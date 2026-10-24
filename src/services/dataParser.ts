import * as XLSX from 'xlsx';
import { ColumnMetadata, VariableType, AnalysisRecommendation } from '../types/data';

export interface ParseResult {
  fileName: string;
  fileSize: number;
  data: Record<string, any>[];
  sheets?: string[];
  selectedSheet?: string;
  error?: string;
}

export function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r\n|\n/).slice(0, 5).join('\n');
  const delimiters = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let maxCount = -1;

  for (const delim of delimiters) {
    const counts = firstLines.split('\n').map(line => (line.split(delim).length - 1));
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    // Check if consistent across lines
    const isConsistent = counts.every(c => c > 0 && Math.abs(c - counts[0]) <= 1);
    if (isConsistent && avg > maxCount) {
      maxCount = avg;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

export async function parseFile(file: File, selectedSheetName?: string): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    if (extension === 'csv' || extension === 'txt') {
      const text = await file.text();
      const delimiter = detectDelimiter(text);

      const workbook = XLSX.read(text, { type: 'string', FS: delimiter });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });

      return {
        fileName: file.name,
        fileSize: file.size,
        data,
      };
    } else if (extension === 'xls' || extension === 'xlsx') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheets = workbook.SheetNames;
      const targetSheet = selectedSheetName && sheets.includes(selectedSheetName) ? selectedSheetName : sheets[0];
      const sheet = workbook.Sheets[targetSheet];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });

      return {
        fileName: file.name,
        fileSize: file.size,
        data,
        sheets,
        selectedSheet: targetSheet,
      };
    } else {
      return {
        fileName: file.name,
        fileSize: file.size,
        data: [],
        error: `Formato de archivo .${extension} no soportado. Se aceptan CSV, TXT, XLS y XLSX.`,
      };
    }
  } catch (err: any) {
    return {
      fileName: file.name,
      fileSize: file.size,
      data: [],
      error: `Error al leer el archivo: ${err?.message || 'Estructura inválida o corrupta'}`,
    };
  }
}

export function inspectColumns(data: Record<string, any>[]): ColumnMetadata[] {
  if (!data || data.length === 0) return [];

  const colNames = Object.keys(data[0]);
  const totalRows = data.length;

  return colNames.map(col => {
    const rawValues = data.map(r => r[col]);
    const nonNullValues = rawValues.filter(v => v !== null && v !== undefined && v !== '' && !Number.isNaN(v));
    const nullCount = totalRows - nonNullValues.length;
    const nullPercentage = +((nullCount / totalRows) * 100).toFixed(1);

    const uniqueSet = new Set(nonNullValues.map(v => String(v).trim()));
    const uniqueValues = uniqueSet.size;

    // Detect type
    let detectedType: VariableType = 'categorical_nominal';
    let analysisType: ColumnMetadata['analysisType'] = 'categorical';
    let recommendation: AnalysisRecommendation = 'include';
    let recommendationReason = 'Variable adecuada para segmentación';
    let includeInClustering = true;

    const lowerCol = col.toLowerCase();
    const isIdCandidate =
      lowerCol.includes('id') ||
      lowerCol.includes('codigo') ||
      lowerCol.includes('código') ||
      lowerCol.includes('key') ||
      lowerCol.includes('rut') ||
      lowerCol.includes('dni') ||
      lowerCol.includes('cedula') ||
      lowerCol.includes('cliente') ||
      lowerCol.includes('abonado') ||
      lowerCol.includes('despacho') ||
      (uniqueValues === totalRows && totalRows > 15);

    // Date test
    const isDateCandidate =
      lowerCol.includes('fecha') ||
      lowerCol.includes('date') ||
      lowerCol.includes('time') ||
      lowerCol.includes('periodo');

    // Number test
    const numericTest = nonNullValues.every(v => {
      if (typeof v === 'number') return !isNaN(v);
      if (typeof v === 'string') {
        const cleaned = v.trim().replace(',', '.');
        return !isNaN(Number(cleaned)) && cleaned.length > 0;
      }
      return false;
    });

    if (isIdCandidate) {
      detectedType = 'identifier';
      analysisType = 'identifier';
      recommendation = 'exclude';
      recommendationReason = 'Identificador único: excluir de distancias para evitar sobreajuste espurio';
      includeInClustering = false;
    } else if (isDateCandidate) {
      detectedType = 'datetime';
      analysisType = 'temporal';
      recommendation = 'transform';
      recommendationReason = 'Variable temporal: transformar a antigüedad o días transcurridos';
      includeInClustering = false;
    } else if (numericTest && nonNullValues.length > 0) {
      const numbers = nonNullValues.map(v => (typeof v === 'number' ? v : Number(String(v).replace(',', '.'))));
      const areAllIntegers = numbers.every(n => Number.isInteger(n));

      if (uniqueValues <= 2 && (numbers.includes(0) || numbers.includes(1))) {
        detectedType = 'boolean';
        analysisType = 'categorical';
        recommendation = 'include';
        recommendationReason = 'Variable binaria indicadora de comportamiento';
      } else if (areAllIntegers && uniqueValues <= 10) {
        detectedType = 'numeric_discrete';
        analysisType = 'numeric';
        recommendation = 'include';
        recommendationReason = 'Variable numérica discreta (conteo o escala)';
      } else {
        detectedType = 'numeric_continuous';
        analysisType = 'numeric';
        recommendation = 'include';
        recommendationReason = 'Variable numérica continua ideal para distancias euclidianas';
      }
    } else {
      // Categorical or Free Text
      const avgLength = nonNullValues.reduce((sum, v) => sum + String(v).length, 0) / (nonNullValues.length || 1);
      if (avgLength > 50 || uniqueValues > totalRows * 0.8) {
        detectedType = 'text_free';
        analysisType = 'text';
        recommendation = 'exclude';
        recommendationReason = 'Texto no estructurado de alta cardinalidad; no apto para distancias directas';
        includeInClustering = false;
      } else {
        detectedType = 'categorical_nominal';
        analysisType = 'categorical';
        if (uniqueValues > 20) {
          recommendation = 'review';
          recommendationReason = 'Alta cardinalidad categórica (>20 valores); agrupar o codificar con precaución';
          includeInClustering = false;
        } else {
          recommendation = 'include';
          recommendationReason = 'Variable categórica nominal: requiere codificación One-Hot';
        }
      }
    }

    // High null percentage alert
    if (nullPercentage > 40) {
      recommendation = 'exclude';
      recommendationReason = `Tasa de valores nulos elevada (${nullPercentage}%); distorsiona distancias de clustering`;
      includeInClustering = false;
    }

    return {
      name: col,
      detectedType,
      selectedType: detectedType,
      analysisType,
      uniqueValues,
      nullCount,
      nullPercentage,
      recommendation,
      recommendationReason,
      includeInClustering,
      sampleValues: nonNullValues.slice(0, 5),
    };
  });
}
