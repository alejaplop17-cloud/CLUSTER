import { CleaningOptions, ColumnMetadata, TransformationLog } from '../types/data';

export interface CleaningResult {
  cleanedData: Record<string, any>[];
  cleanedColumns: ColumnMetadata[];
  logs: TransformationLog[];
  modifiedRowsCount: number;
  removedRowsCount: number;
  imputedValuesCount: number;
}

export function cleanAndTransformData(
  originalData: Record<string, any>[],
  columns: ColumnMetadata[],
  options: CleaningOptions
): CleaningResult {
  const logs: TransformationLog[] = [];
  let currentData = originalData.map(row => ({ ...row }));
  let currentColumns = columns.map(c => ({ ...c }));
  let removedRowsCount = 0;
  let imputedValuesCount = 0;
  let modifiedRowsCount = 0;

  // 1. Column drops
  if (options.removeColumns.length > 0) {
    const colsToDrop = new Set(options.removeColumns);
    currentData = currentData.map(row => {
      const newRow: Record<string, any> = {};
      for (const key of Object.keys(row)) {
        if (!colsToDrop.has(key)) {
          newRow[key] = row[key];
        }
      }
      return newRow;
    });
    currentColumns = currentColumns.filter(c => !colsToDrop.has(c.name));
    logs.push({
      id: `col_drop_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'Eliminación de Columnas',
      details: `Se eliminaron ${options.removeColumns.length} columnas: ${options.removeColumns.join(', ')}`,
      affectedCount: options.removeColumns.length,
    });
  }

  // 2. Remove duplicates
  if (options.removeDuplicates) {
    const beforeCount = currentData.length;
    const seen = new Set<string>();
    currentData = currentData.filter(row => {
      const sig = JSON.stringify(row);
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
    const dupesRemoved = beforeCount - currentData.length;
    if (dupesRemoved > 0) {
      removedRowsCount += dupesRemoved;
      logs.push({
        id: `dupes_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'Depuración de Duplicados',
        details: `Se eliminaron ${dupesRemoved} registros duplicados exactos`,
        affectedCount: dupesRemoved,
      });
    }
  }

  // 3. Imputation
  for (const col of currentColumns) {
    if (col.selectedType === 'identifier') {
      // Do NOT impute identifiers!
      continue;
    }

    if (col.selectedType.startsWith('numeric') && options.numericImputation !== 'none') {
      const validNumbers = currentData
        .map(r => r[col.name])
        .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
        .map(v => Number(v));

      if (validNumbers.length > 0) {
        let fillValue = 0;
        if (options.numericImputation === 'mean') {
          fillValue = +(validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length).toFixed(2);
        } else if (options.numericImputation === 'median') {
          const sorted = [...validNumbers].sort((a, b) => a - b);
          fillValue = sorted[Math.floor(sorted.length / 2)];
        } else if (options.numericImputation === 'zero') {
          fillValue = 0;
        }

        let colImputed = 0;
        currentData.forEach(row => {
          const val = row[col.name];
          if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
            row[col.name] = fillValue;
            colImputed++;
            imputedValuesCount++;
          } else {
            row[col.name] = Number(val);
          }
        });

        if (colImputed > 0) {
          logs.push({
            id: `impute_num_${col.name}`,
            timestamp: new Date().toLocaleTimeString(),
            action: `Imputación Numérica (${options.numericImputation})`,
            details: `Variable '${col.name}': se imputaron ${colImputed} valores nulos con valor ${fillValue}`,
            affectedCount: colImputed,
          });
        }
      }
    } else if (col.selectedType.startsWith('categorical') && options.categoricalImputation !== 'none') {
      const validCats = currentData
        .map(r => r[col.name])
        .filter(v => v !== null && v !== undefined && v !== '');

      let fillCat = 'Desconocido';
      if (options.categoricalImputation === 'mode' && validCats.length > 0) {
        const counts: Record<string, number> = {};
        for (const cat of validCats) counts[String(cat)] = (counts[String(cat)] || 0) + 1;
        const sortedCats = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        fillCat = sortedCats[0][0];
      }

      let colImputed = 0;
      currentData.forEach(row => {
        const val = row[col.name];
        if (val === null || val === undefined || val === '') {
          row[col.name] = fillCat;
          colImputed++;
          imputedValuesCount++;
        }
      });

      if (colImputed > 0) {
        logs.push({
          id: `impute_cat_${col.name}`,
          timestamp: new Date().toLocaleTimeString(),
          action: `Imputación Categórica (${options.categoricalImputation})`,
          details: `Variable '${col.name}': se imputaron ${colImputed} nulos con '${fillCat}'`,
          affectedCount: colImputed,
        });
      }
    }
  }

  // 4. Outlier treatment
  if (options.outlierTreatment !== 'none') {
    const numericCols = currentColumns.filter(c => c.selectedType.startsWith('numeric') && c.includeInClustering);

    for (const col of numericCols) {
      const numbers = currentData
        .map(r => Number(r[col.name]))
        .filter(v => !isNaN(v))
        .sort((a, b) => a - b);

      if (numbers.length >= 10) {
        const q1 = numbers[Math.floor(numbers.length * 0.25)];
        const q3 = numbers[Math.floor(numbers.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - options.outlierThreshold * iqr;
        const upperBound = q3 + options.outlierThreshold * iqr;

        if (options.outlierTreatment === 'clip_iqr') {
          let clipped = 0;
          currentData.forEach(row => {
            const val = Number(row[col.name]);
            if (!isNaN(val)) {
              if (val < lowerBound) {
                row[col.name] = +lowerBound.toFixed(2);
                clipped++;
                modifiedRowsCount++;
              } else if (val > upperBound) {
                row[col.name] = +upperBound.toFixed(2);
                clipped++;
                modifiedRowsCount++;
              }
            }
          });
          if (clipped > 0) {
            logs.push({
              id: `outlier_clip_${col.name}`,
              timestamp: new Date().toLocaleTimeString(),
              action: 'Tratamiento de Atípicos (Winsorización IQR)',
              details: `Columna '${col.name}': se acotaron ${clipped} valores fuera del intervalo [${lowerBound.toFixed(1)}, ${upperBound.toFixed(1)}]`,
              affectedCount: clipped,
            });
          }
        } else if (options.outlierTreatment === 'remove_iqr') {
          const before = currentData.length;
          currentData = currentData.filter(row => {
            const val = Number(row[col.name]);
            return isNaN(val) || (val >= lowerBound && val <= upperBound);
          });
          const removed = before - currentData.length;
          if (removed > 0) {
            removedRowsCount += removed;
            logs.push({
              id: `outlier_remove_${col.name}`,
              timestamp: new Date().toLocaleTimeString(),
              action: 'Eliminación de Filas con Atípicos',
              details: `Columna '${col.name}': se eliminaron ${removed} registros con valores extremos`,
              affectedCount: removed,
            });
          }
        }
      }
    }
  }

  return {
    cleanedData: currentData,
    cleanedColumns: currentColumns,
    logs,
    modifiedRowsCount,
    removedRowsCount,
    imputedValuesCount,
  };
}
