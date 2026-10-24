import { ColumnMetadata, DataQualityReport } from '../types/data';

export function runDataQualityDiagnosis(
  data: Record<string, any>[],
  columns: ColumnMetadata[]
): DataQualityReport {
  const totalRows = data.length;
  const totalColumns = columns.length;

  if (totalRows === 0 || totalColumns === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      duplicateRows: 0,
      duplicatePercentage: 0,
      totalMissingCells: 0,
      missingPercentage: 0,
      columnsWithMissing: [],
      constantColumns: [],
      highCardinalityColumns: [],
      outlierCounts: {},
      impossibleValues: [],
      qualityScore: 100,
      confirmedIssues: [],
      reviewNeededIssues: [],
    };
  }

  // 1. Duplicate rows
  const rowSignatures = new Set<string>();
  let duplicateRows = 0;
  for (const row of data) {
    const sig = JSON.stringify(row);
    if (rowSignatures.has(sig)) {
      duplicateRows++;
    } else {
      rowSignatures.add(sig);
    }
  }
  const duplicatePercentage = +((duplicateRows / totalRows) * 100).toFixed(1);

  // 2. Missing cells
  let totalMissingCells = 0;
  const columnsWithMissing: string[] = [];
  const constantColumns: string[] = [];
  const highCardinalityColumns: string[] = [];
  const outlierCounts: Record<string, number> = {};
  const impossibleValues: { column: string; issue: string; count: number }[] = [];

  const confirmedIssues: string[] = [];
  const reviewNeededIssues: string[] = [];

  if (duplicateRows > 0) {
    confirmedIssues.push(`Se detectaron ${duplicateRows} filas duplicadas exactas (${duplicatePercentage}%).`);
  }

  for (const col of columns) {
    const rawValues = data.map(r => r[col.name]);
    const validValues = rawValues.filter(v => v !== null && v !== undefined && v !== '' && !Number.isNaN(v));
    const nullsInCol = totalRows - validValues.length;
    totalMissingCells += nullsInCol;

    if (nullsInCol > 0) {
      columnsWithMissing.push(`${col.name} (${nullsInCol} nulos, ${((nullsInCol / totalRows) * 100).toFixed(1)}%)`);
      if (nullsInCol / totalRows > 0.3) {
        reviewNeededIssues.push(`Columna '${col.name}' tiene más del 30% de valores ausentes.`);
      }
    }

    const uniqueSet = new Set(validValues.map(v => String(v)));
    if (uniqueSet.size === 1 && totalRows > 1) {
      constantColumns.push(col.name);
      confirmedIssues.push(`Columna constante detectada: '${col.name}' (varianza cero, no aporta poder discriminante).`);
    }

    if (col.selectedType.startsWith('categorical') && uniqueSet.size > 25) {
      highCardinalityColumns.push(`${col.name} (${uniqueSet.size} categorías distintas)`);
      reviewNeededIssues.push(`Columna categórica '${col.name}' tiene alta cardinalidad (${uniqueSet.size} categorías).`);
    }

    // Outliers & Impossible values for numeric columns
    if (col.selectedType.startsWith('numeric')) {
      const numbers = validValues
        .map(v => (typeof v === 'number' ? v : Number(String(v).replace(',', '.'))))
        .filter(v => !isNaN(v))
        .sort((a, b) => a - b);

      if (numbers.length >= 4) {
        const q1 = numbers[Math.floor(numbers.length * 0.25)];
        const q3 = numbers[Math.floor(numbers.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outliers = numbers.filter(v => v < lowerBound || v > upperBound);
        if (outliers.length > 0) {
          outlierCounts[col.name] = outliers.length;
          reviewNeededIssues.push(
            `Columna '${col.name}': ${outliers.length} valores atípicos detectados por criterio IQR (rango normal [${lowerBound.toFixed(1)}, ${upperBound.toFixed(1)}]).`
          );
        }
      }

      // Semantic impossible values checks
      const colLower = col.name.toLowerCase();
      if (colLower.includes('tasa') || colLower.includes('pct') || colLower.includes('porcentaje')) {
        const over100 = numbers.filter(v => v > 100);
        if (over100.length > 0) {
          impossibleValues.push({
            column: col.name,
            issue: 'Porcentaje superior al 100%',
            count: over100.length,
          });
          confirmedIssues.push(`Valores imposibles en '${col.name}': ${over100.length} registros con porcentaje > 100.`);
        }
      }

      if (
        colLower.includes('dias') ||
        colLower.includes('edad') ||
        colLower.includes('gasto') ||
        colLower.includes('ingreso') ||
        colLower.includes('costo') ||
        colLower.includes('distancia')
      ) {
        const negativeVals = numbers.filter(v => v < 0);
        if (negativeVals.length > 0) {
          impossibleValues.push({
            column: col.name,
            issue: 'Valores negativos en magnitud estrictamente positiva',
            count: negativeVals.length,
          });
          confirmedIssues.push(`Valores negativos anómalos en '${col.name}': ${negativeVals.length} registros menores a 0.`);
        }
      }
    }
  }

  const totalCells = totalRows * totalColumns;
  const missingPercentage = totalCells > 0 ? +((totalMissingCells / totalCells) * 100).toFixed(1) : 0;

  // Calculate Data Quality Score (0 to 100)
  let score = 100;
  score -= Math.min(30, missingPercentage * 3);
  score -= Math.min(20, duplicatePercentage * 2);
  score -= Math.min(15, constantColumns.length * 10);
  score -= Math.min(15, impossibleValues.reduce((acc, iv) => acc + iv.count, 0) * 2);
  score -= Math.min(20, Object.keys(outlierCounts).length * 3);
  const qualityScore = Math.max(10, Math.min(100, Math.round(score)));

  return {
    totalRows,
    totalColumns,
    duplicateRows,
    duplicatePercentage,
    totalMissingCells,
    missingPercentage,
    columnsWithMissing,
    constantColumns,
    highCardinalityColumns,
    outlierCounts,
    impossibleValues,
    qualityScore,
    confirmedIssues,
    reviewNeededIssues,
  };
}
