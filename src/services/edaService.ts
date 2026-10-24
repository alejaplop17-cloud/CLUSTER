import { BusinessRuleCandidate, CategoricalEDA, ColumnMetadata, NumericEDA } from '../types/data';

export function computeNumericEDA(data: Record<string, any>[], column: string): NumericEDA {
  const values = data
    .map(r => Number(r[column]))
    .filter(v => !isNaN(v) && v !== null && v !== undefined)
    .sort((a, b) => a - b);

  const n = values.length;
  if (n === 0) {
    return {
      name: column,
      count: 0,
      mean: 0,
      median: 0,
      mode: 0,
      std: 0,
      min: 0,
      max: 0,
      range: 0,
      q25: 0,
      q75: 0,
      iqr: 0,
      p90: 0,
      skewness: 0,
      histogram: [],
    };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = +(sum / n).toFixed(2);
  const median = n % 2 === 0 ? +((values[n / 2 - 1] + values[n / 2]) / 2).toFixed(2) : values[Math.floor(n / 2)];

  // Mode
  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  let mode = values[0];
  let maxFreq = 0;
  for (const [k, freq] of Object.entries(counts)) {
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = Number(k);
    }
  }

  // Variance & Standard Deviation
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const std = +Math.sqrt(variance).toFixed(2);

  const min = values[0];
  const max = values[n - 1];
  const range = +(max - min).toFixed(2);

  const q25 = values[Math.floor(n * 0.25)];
  const q75 = values[Math.floor(n * 0.75)];
  const iqr = +(q75 - q25).toFixed(2);
  const p90 = values[Math.floor(n * 0.90)];

  // Skewness
  const m3 = values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
  const skewness = std > 0 ? +(m3 / Math.pow(std, 3)).toFixed(2) : 0;

  // Histogram (7 bins)
  const numBins = 7;
  const binWidth = (max - min) / numBins || 1;
  const histogram: { bin: string; count: number }[] = [];

  for (let b = 0; b < numBins; b++) {
    const binStart = min + b * binWidth;
    const binEnd = min + (b + 1) * binWidth;
    const count = values.filter(v => (b === numBins - 1 ? v >= binStart && v <= binEnd : v >= binStart && v < binEnd)).length;
    histogram.push({
      bin: `${binStart.toFixed(1)} - ${binEnd.toFixed(1)}`,
      count,
    });
  }

  return {
    name: column,
    count: n,
    mean,
    median,
    mode,
    std,
    min,
    max,
    range,
    q25,
    q75,
    iqr,
    p90,
    skewness,
    histogram,
  };
}

export function computeCategoricalEDA(data: Record<string, any>[], column: string): CategoricalEDA {
  const values = data
    .map(r => r[column])
    .filter(v => v !== null && v !== undefined && v !== '');

  const totalCount = values.length;
  const counts: Record<string, number> = {};
  for (const v of values) {
    const s = String(v);
    counts[s] = (counts[s] || 0) + 1;
  }

  const sortedCats = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalCount > 0 ? +((count / totalCount) * 100).toFixed(1) : 0,
    }));

  return {
    name: column,
    totalCount,
    uniqueCount: Object.keys(counts).length,
    topCategories: sortedCats.slice(0, 8),
  };
}

export function computePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n <= 1) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : +(num / den).toFixed(3);
}

export function computeSpearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n <= 1) return 0;

  // Rank x and y
  const rank = (arr: number[]) => {
    const sorted = arr.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
    const ranks = new Array(n);
    for (let i = 0; i < n; i++) ranks[sorted[i].idx] = i + 1;
    return ranks;
  };

  const rankX = rank(x);
  const rankY = rank(y);

  return computePearsonCorrelation(rankX, rankY);
}

export function generateCorrelationMatrix(
  data: Record<string, any>[],
  columns: string[],
  method: 'pearson' | 'spearman' = 'pearson'
): { columns: string[]; matrix: number[][] } {
  const numericVectors: Record<string, number[]> = {};

  for (const col of columns) {
    numericVectors[col] = data.map(r => Number(r[col]) || 0);
  }

  const matrix: number[][] = [];
  for (let i = 0; i < columns.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < columns.length; j++) {
      if (i === j) {
        row.push(1);
      } else {
        const corr =
          method === 'pearson'
            ? computePearsonCorrelation(numericVectors[columns[i]], numericVectors[columns[j]])
            : computeSpearmanCorrelation(numericVectors[columns[i]], numericVectors[columns[j]]);
        row.push(corr);
      }
    }
    matrix.push(row);
  }

  return { columns, matrix };
}

export function deriveBusinessCandidateRules(
  data: Record<string, any>[],
  columns: ColumnMetadata[]
): BusinessRuleCandidate[] {
  const candidates: BusinessRuleCandidate[] = [];
  const numericCols = columns.filter(c => c.selectedType.startsWith('numeric') && c.includeInClustering);

  for (const col of numericCols) {
    const eda = computeNumericEDA(data, col.name);
    const colNameLower = col.name.toLowerCase();

    if (colNameLower.includes('gasto') || colNameLower.includes('monet') || colNameLower.includes('factura') || colNameLower.includes('ticket')) {
      candidates.push({
        id: `rule_high_spend_${col.name}`,
        column: col.name,
        ruleType: 'threshold',
        description: `Umbral de Alto Gasto / Valor Elevado (Percentil 75)`,
        suggestedValue: `>= $${eda.q75.toLocaleString()}`,
        businessImplication: `Identifica clientes de alto valor comercial para planes de fidelización prioritaria y ejecutivos de cuenta dedicados.`,
        validatedByUser: true,
      });
      candidates.push({
        id: `rule_low_spend_${col.name}`,
        column: col.name,
        ruleType: 'threshold',
        description: `Umbral de Entrada / Bajo Ticket (Percentil 25)`,
        suggestedValue: `<= $${eda.q25.toLocaleString()}`,
        businessImplication: `Segmento de clientes sensibles a precio o compras iniciales; target para venta cruzada (upsell) o combos promocionales.`,
        validatedByUser: false,
      });
    }

    if (colNameLower.includes('recencia') || colNameLower.includes('frecuencia') || colNameLower.includes('visita')) {
      if (colNameLower.includes('recencia')) {
        candidates.push({
          id: `rule_inactivity_${col.name}`,
          column: col.name,
          ruleType: 'threshold',
          description: `Alerta de Inactividad Prolongada (Percentil 75 de Recencia)`,
          suggestedValue: `>= ${eda.q75} días sin actividad`,
          businessImplication: `Clientes con alto riesgo de abandono; activar campaña preventiva de reactivación con incentivo directo.`,
          validatedByUser: true,
        });
      } else {
        candidates.push({
          id: `rule_freq_${col.name}`,
          column: col.name,
          ruleType: 'threshold',
          description: `Comprador Recurrente Frecuente (Mediana)`,
          suggestedValue: `>= ${eda.median} transacciones`,
          businessImplication: `Base recurrente estable; objetivo de programas de suscripción periódica o membresías.`,
          validatedByUser: false,
        });
      }
    }

    if (colNameLower.includes('riesgo') || colNameLower.includes('fuga') || colNameLower.includes('deuda') || colNameLower.includes('siniestro')) {
      candidates.push({
        id: `rule_risk_${col.name}`,
        column: col.name,
        ruleType: 'threshold',
        description: `Zona Crítica de Riesgo Operativo (Percentil 75)`,
        suggestedValue: `>= ${eda.q75}`,
        businessImplication: `Cuentas que requieren auditoría de servicio inmediata y plan de contención de margen.`,
        validatedByUser: true,
      });
    }
  }

  return candidates;
}
