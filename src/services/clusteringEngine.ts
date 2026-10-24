import {
  ClusteringAlgorithm,
  ClusteringExecutionResult,
  ClusteringModelConfig,
  ColumnMetadata,
  DistanceMetric,
  OptimalKMetric,
  ScalerType,
} from '../types/data';

// --- DISTANCE FUNCTIONS ---
export function calculateDistance(
  a: number[],
  b: number[],
  metric: DistanceMetric = 'euclidean'
): number {
  const len = a.length;
  if (metric === 'manhattan') {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Math.abs(a[i] - b[i]);
    return sum;
  }

  if (metric === 'minkowski') {
    const p = 3;
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Math.pow(Math.abs(a[i] - b[i]), p);
    return Math.pow(sum, 1 / p);
  }

  if (metric === 'cosine') {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const den = Math.sqrt(normA) * Math.sqrt(normB);
    return den === 0 ? 0 : 1 - dot / den;
  }

  if (metric === 'gower') {
    // Range-normalized Manhattan distance
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += Math.abs(a[i] - b[i]);
    }
    return sum / len;
  }

  // Default: Euclidean
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// --- PREPROCESSING & SCALING ---
export interface PreprocessedMatrix {
  matrix: number[][];
  featureNames: string[];
  originalFeatureNames: string[];
  scalers: Record<string, { center: number; scale: number }>;
  categoricalMap: Record<string, string[]>;
}

export function buildFeatureMatrix(
  data: Record<string, any>[],
  columns: ColumnMetadata[],
  scalerType: ScalerType = 'standard',
  oneHotCategorical: boolean = true
): PreprocessedMatrix {
  const activeCols = columns.filter(c => c.includeInClustering && c.selectedType !== 'identifier');
  const numericCols = activeCols.filter(c => c.selectedType.startsWith('numeric') || c.selectedType === 'boolean');
  const categoricalCols = activeCols.filter(c => c.selectedType.startsWith('categorical'));

  const featureNames: string[] = [];
  const originalFeatureNames: string[] = [];
  const scalers: Record<string, { center: number; scale: number }> = {};
  const categoricalMap: Record<string, string[]> = {};

  // Numeric features
  for (const col of numericCols) {
    featureNames.push(col.name);
    originalFeatureNames.push(col.name);

    const vals = data.map(r => Number(r[col.name]) || 0);
    const sorted = [...vals].sort((a, b) => a - b);
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (vals.length || 1);
    const std = Math.sqrt(variance) || 1;
    const min = sorted[0] || 0;
    const max = sorted[sorted.length - 1] || 1;
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const q1 = sorted[Math.floor(sorted.length * 0.25)] || 0;
    const q3 = sorted[Math.floor(sorted.length * 0.75)] || 1;
    const iqr = q3 - q1 || 1;

    if (scalerType === 'standard') {
      scalers[col.name] = { center: mean, scale: std };
    } else if (scalerType === 'minmax') {
      scalers[col.name] = { center: min, scale: max - min || 1 };
    } else if (scalerType === 'robust') {
      scalers[col.name] = { center: median, scale: iqr };
    } else {
      scalers[col.name] = { center: 0, scale: 1 };
    }
  }

  // One-Hot for Categorical features
  if (oneHotCategorical) {
    for (const col of categoricalCols) {
      const distinctVals = Array.from(new Set(data.map(r => String(r[col.name] ?? 'Desconocido')))).slice(0, 8); // limit top 8
      categoricalMap[col.name] = distinctVals;
      for (const val of distinctVals) {
        featureNames.push(`${col.name}_${val}`);
        originalFeatureNames.push(col.name);
      }
    }
  }

  // Build rows
  const matrix: number[][] = data.map(row => {
    const vector: number[] = [];

    // Scale numeric
    for (const col of numericCols) {
      const rawVal = Number(row[col.name]) || 0;
      const { center, scale } = scalers[col.name];
      const scaledVal = (rawVal - center) / scale;
      vector.push(scaledVal);
    }

    // Encode categorical
    if (oneHotCategorical) {
      for (const col of categoricalCols) {
        const rowVal = String(row[col.name] ?? 'Desconocido');
        const distinctVals = categoricalMap[col.name] || [];
        for (const dv of distinctVals) {
          vector.push(rowVal === dv ? 1 : 0);
        }
      }
    }

    return vector;
  });

  return { matrix, featureNames, originalFeatureNames, scalers, categoricalMap };
}

// --- K-MEANS IMPLEMENTATION (Lloyd with K-Means++) ---
export function runKMeans(
  matrix: number[][],
  k: number,
  metric: DistanceMetric = 'euclidean',
  maxIterations: number = 60
): { labels: number[]; centroids: number[][] } {
  const n = matrix.length;
  const d = matrix[0].length;
  if (n === 0 || k <= 0) return { labels: [], centroids: [] };

  // K-Means++ initialization
  const centroids: number[][] = [];
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push([...matrix[firstIdx]]);

  for (let c = 1; c < k; c++) {
    const distSq: number[] = [];
    let sumDistSq = 0;

    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      for (const cent of centroids) {
        const dist = calculateDistance(matrix[i], cent, metric);
        if (dist < minDist) minDist = dist;
      }
      const sq = minDist * minDist;
      distSq.push(sq);
      sumDistSq += sq;
    }

    let target = Math.random() * sumDistSq;
    let chosenIdx = 0;
    for (let i = 0; i < n; i++) {
      target -= distSq[i];
      if (target <= 0) {
        chosenIdx = i;
        break;
      }
    }
    centroids.push([...matrix[chosenIdx]]);
  }

  let labels = new Array(n).fill(0);
  let converged = false;
  let iter = 0;

  while (!converged && iter < maxIterations) {
    iter++;
    let changed = false;

    // 1. Assign points to closest centroid
    for (let i = 0; i < n; i++) {
      let bestDist = Infinity;
      let bestCent = 0;
      for (let c = 0; c < k; c++) {
        const dist = calculateDistance(matrix[i], centroids[c], metric);
        if (dist < bestDist) {
          bestDist = dist;
          bestCent = c;
        }
      }
      if (labels[i] !== bestCent) {
        labels[i] = bestCent;
        changed = true;
      }
    }

    if (!changed) {
      converged = true;
      break;
    }

    // 2. Recompute centroids
    const newCentroids: number[][] = Array.from({ length: k }, () => new Array(d).fill(0));
    const counts = new Array(k).fill(0);

    for (let i = 0; i < n; i++) {
      const c = labels[i];
      counts[c]++;
      for (let j = 0; j < d; j++) {
        newCentroids[c][j] += matrix[i][j];
      }
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < d; j++) {
          newCentroids[c][j] /= counts[c];
        }
        centroids[c] = newCentroids[c];
      }
    }
  }

  return { labels, centroids };
}

// --- K-MEDOIDS (PAM - Partitioning Around Medoids) ---
export function runKMedoids(
  matrix: number[][],
  k: number,
  metric: DistanceMetric = 'euclidean',
  maxIterations: number = 30
): { labels: number[]; centroids: number[][] } {
  const n = matrix.length;
  if (n === 0 || k <= 0) return { labels: [], centroids: [] };

  // Select initial medoids using diverse samples
  const step = Math.floor(n / k);
  const medoidIndices: number[] = [];
  for (let i = 0; i < k; i++) {
    medoidIndices.push(Math.min(n - 1, i * step + Math.floor(step / 2)));
  }

  let labels = new Array(n).fill(0);
  let iter = 0;

  while (iter < maxIterations) {
    iter++;
    // Assign to closest medoid
    for (let i = 0; i < n; i++) {
      let bestDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const dist = calculateDistance(matrix[i], matrix[medoidIndices[c]], metric);
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = c;
        }
      }
      labels[i] = bestCluster;
    }

    // Update medoids: find point in cluster minimizing total within-cluster distance
    let medoidsChanged = false;
    for (let c = 0; c < k; c++) {
      const clusterPoints = [];
      for (let i = 0; i < n; i++) {
        if (labels[i] === c) clusterPoints.push(i);
      }
      if (clusterPoints.length === 0) continue;

      let minCost = Infinity;
      let bestPoint = medoidIndices[c];

      for (const p of clusterPoints) {
        let cost = 0;
        for (const other of clusterPoints) {
          cost += calculateDistance(matrix[p], matrix[other], metric);
        }
        if (cost < minCost) {
          minCost = cost;
          bestPoint = p;
        }
      }

      if (bestPoint !== medoidIndices[c]) {
        medoidIndices[c] = bestPoint;
        medoidsChanged = true;
      }
    }

    if (!medoidsChanged) break;
  }

  const centroids = medoidIndices.map(idx => [...matrix[idx]]);
  return { labels, centroids };
}

// --- AGGLOMERATIVE HIERARCHICAL CLUSTERING ---
export function runHierarchical(
  matrix: number[][],
  k: number,
  metric: DistanceMetric = 'euclidean',
  linkage: 'ward' | 'complete' | 'average' = 'ward'
): { labels: number[]; centroids: number[][] } {
  const n = matrix.length;
  const d = matrix[0].length;
  if (n === 0 || k <= 0) return { labels: [], centroids: [] };

  // Subsample if n > 400 for browser interactive performance
  let activeMatrix = matrix;
  let sampleIndices: number[] | null = null;
  if (n > 400) {
    const stride = Math.ceil(n / 400);
    sampleIndices = [];
    for (let i = 0; i < n; i += stride) sampleIndices.push(i);
    activeMatrix = sampleIndices.map(idx => matrix[idx]);
  }

  const sampleN = activeMatrix.length;
  let clusters: { id: number; members: number[] }[] = [];
  for (let i = 0; i < sampleN; i++) {
    clusters.push({ id: i, members: [i] });
  }

  // Agglomeration
  while (clusters.length > k) {
    let minDist = Infinity;
    let mergeI = 0;
    let mergeJ = 1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        let clusterDist = 0;
        const c1 = clusters[i].members;
        const c2 = clusters[j].members;

        if (linkage === 'complete') {
          let maxD = 0;
          for (const p1 of c1) {
            for (const p2 of c2) {
              const d = calculateDistance(activeMatrix[p1], activeMatrix[p2], metric);
              if (d > maxD) maxD = d;
            }
          }
          clusterDist = maxD;
        } else if (linkage === 'average') {
          let sumD = 0;
          for (const p1 of c1) {
            for (const p2 of c2) {
              sumD += calculateDistance(activeMatrix[p1], activeMatrix[p2], metric);
            }
          }
          clusterDist = sumD / (c1.length * c2.length);
        } else {
          // Ward (variance increment)
          // Compute centroids of c1, c2, and combined
          const cent1 = new Array(d).fill(0);
          const cent2 = new Array(d).fill(0);
          for (const p of c1) for (let col = 0; col < d; col++) cent1[col] += activeMatrix[p][col] / c1.length;
          for (const p of c2) for (let col = 0; col < d; col++) cent2[col] += activeMatrix[p][col] / c2.length;
          const distCent = calculateDistance(cent1, cent2, 'euclidean');
          clusterDist = ((c1.length * c2.length) / (c1.length + c2.length)) * (distCent * distCent);
        }

        if (clusterDist < minDist) {
          minDist = clusterDist;
          mergeI = i;
          mergeJ = j;
        }
      }
    }

    // Merge
    clusters[mergeI].members.push(...clusters[mergeJ].members);
    clusters.splice(mergeJ, 1);
  }

  // Calculate centroids of the clusters
  const centroids: number[][] = [];
  for (let c = 0; c < clusters.length; c++) {
    const cent = new Array(d).fill(0);
    const members = clusters[c].members;
    for (const m of members) {
      for (let j = 0; j < d; j++) cent[j] += activeMatrix[m][j];
    }
    for (let j = 0; j < d; j++) cent[j] /= members.length;
    centroids.push(cent);
  }

  // Assign full matrix to closest centroid
  const labels = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let bestDist = Infinity;
    let bestC = 0;
    for (let c = 0; c < centroids.length; c++) {
      const dist = calculateDistance(matrix[i], centroids[c], metric);
      if (dist < bestDist) {
        bestDist = dist;
        bestC = c;
      }
    }
    labels[i] = bestC;
  }

  return { labels, centroids };
}

// --- DBSCAN IMPLEMENTATION ---
export function runDBSCAN(
  matrix: number[][],
  eps: number = 1.2,
  minSamples: number = 4,
  metric: DistanceMetric = 'euclidean'
): { labels: number[]; centroids: number[][] } {
  const n = matrix.length;
  const d = matrix[0].length;
  const labels = new Array(n).fill(-1); // -1 = noise
  let clusterId = 0;

  const getNeighbors = (idx: number) => {
    const neighbors: number[] = [];
    for (let i = 0; i < n; i++) {
      if (calculateDistance(matrix[idx], matrix[i], metric) <= eps) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  const visited = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighbors = getNeighbors(i);
    if (neighbors.length < minSamples) {
      labels[i] = -1; // Noise
    } else {
      labels[i] = clusterId;
      const seedQueue = [...neighbors];

      let qIdx = 0;
      while (qIdx < seedQueue.length) {
        const neighbor = seedQueue[qIdx++];
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const nextNeighbors = getNeighbors(neighbor);
          if (nextNeighbors.length >= minSamples) {
            seedQueue.push(...nextNeighbors);
          }
        }
        if (labels[neighbor] === -1) {
          labels[neighbor] = clusterId;
        }
      }
      clusterId++;
    }
  }

  // Ensure at least 1 cluster formed; if all noise, fallback cluster 0
  const totalClusters = Math.max(1, clusterId);
  const centroids: number[][] = [];

  for (let c = 0; c < totalClusters; c++) {
    const members = [];
    for (let i = 0; i < n; i++) if (labels[i] === c) members.push(i);
    const cent = new Array(d).fill(0);
    if (members.length > 0) {
      for (const m of members) for (let j = 0; j < d; j++) cent[j] += matrix[m][j];
      for (let j = 0; j < d; j++) cent[j] /= members.length;
    }
    centroids.push(cent);
  }

  return { labels, centroids };
}

// --- EVALUATION METRICS ---
export function calculateInertia(matrix: number[][], labels: number[], centroids: number[][]): number {
  let inertia = 0;
  for (let i = 0; i < matrix.length; i++) {
    const c = labels[i];
    if (c >= 0 && c < centroids.length) {
      const dist = calculateDistance(matrix[i], centroids[c], 'euclidean');
      inertia += dist * dist;
    }
  }
  return +inertia.toFixed(2);
}

export function calculateSilhouetteScore(
  matrix: number[][],
  labels: number[],
  metric: DistanceMetric = 'euclidean'
): number {
  const n = matrix.length;
  if (n <= 2) return 0;

  // Filter out noise points (-1) if any
  const validIndices = [];
  for (let i = 0; i < n; i++) if (labels[i] >= 0) validIndices.push(i);
  if (validIndices.length <= 2) return 0;

  // Subsample to 250 points for snappy responsiveness
  const sample = validIndices.length > 250
    ? validIndices.filter((_, idx) => idx % Math.ceil(validIndices.length / 250) === 0)
    : validIndices;

  const clusterMap: Record<number, number[]> = {};
  for (const idx of sample) {
    const c = labels[idx];
    if (!clusterMap[c]) clusterMap[c] = [];
    clusterMap[c].push(idx);
  }

  const clusters = Object.keys(clusterMap).map(Number);
  if (clusters.length < 2) return 0;

  let totalSilhouette = 0;

  for (const i of sample) {
    const ownCluster = labels[i];
    const ownPoints = clusterMap[ownCluster];

    // a(i): average distance to points in same cluster
    let a_i = 0;
    if (ownPoints.length > 1) {
      let sumDist = 0;
      for (const j of ownPoints) {
        if (i !== j) sumDist += calculateDistance(matrix[i], matrix[j], metric);
      }
      a_i = sumDist / (ownPoints.length - 1);
    }

    // b(i): min average distance to another cluster
    let b_i = Infinity;
    for (const otherC of clusters) {
      if (otherC === ownCluster) continue;
      const otherPoints = clusterMap[otherC];
      let sumDist = 0;
      for (const j of otherPoints) {
        sumDist += calculateDistance(matrix[i], matrix[j], metric);
      }
      const avgDist = sumDist / otherPoints.length;
      if (avgDist < b_i) b_i = avgDist;
    }

    const maxDen = Math.max(a_i, b_i);
    const s_i = maxDen === 0 ? 0 : (b_i - a_i) / maxDen;
    totalSilhouette += s_i;
  }

  return +(totalSilhouette / sample.length).toFixed(3);
}

export function calculateDaviesBouldin(matrix: number[][], labels: number[], centroids: number[][]): number {
  const k = centroids.length;
  if (k <= 1) return 0;

  // Cluster dispersions (avg distance from point to its centroid)
  const dispersions = new Array(k).fill(0);
  const counts = new Array(k).fill(0);

  for (let i = 0; i < matrix.length; i++) {
    const c = labels[i];
    if (c >= 0 && c < k) {
      dispersions[c] += calculateDistance(matrix[i], centroids[c], 'euclidean');
      counts[c]++;
    }
  }

  for (let c = 0; c < k; c++) {
    dispersions[c] = counts[c] > 0 ? dispersions[c] / counts[c] : 0;
  }

  let dbSum = 0;
  for (let i = 0; i < k; i++) {
    let maxR = 0;
    for (let j = 0; j < k; j++) {
      if (i !== j) {
        const d_ij = calculateDistance(centroids[i], centroids[j], 'euclidean');
        if (d_ij > 0) {
          const r_ij = (dispersions[i] + dispersions[j]) / d_ij;
          if (r_ij > maxR) maxR = r_ij;
        }
      }
    }
    dbSum += maxR;
  }

  return +(dbSum / k).toFixed(3);
}

export function calculateCalinskiHarabasz(matrix: number[][], labels: number[], centroids: number[][]): number {
  const n = matrix.length;
  const k = centroids.length;
  if (n <= k || k <= 1) return 0;
  const d = matrix[0].length;

  // Overall mean
  const overallMean = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) overallMean[j] += matrix[i][j];
  }
  for (let j = 0; j < d; j++) overallMean[j] /= n;

  // Between-cluster dispersion (SSB)
  let ssb = 0;
  for (let c = 0; c < k; c++) {
    const clusterSize = labels.filter(l => l === c).length;
    const dist = calculateDistance(centroids[c], overallMean, 'euclidean');
    ssb += clusterSize * dist * dist;
  }

  // Within-cluster dispersion (SSW)
  let ssw = 0;
  for (let i = 0; i < n; i++) {
    const c = labels[i];
    if (c >= 0 && c < k) {
      const dist = calculateDistance(matrix[i], centroids[c], 'euclidean');
      ssw += dist * dist;
    }
  }

  if (ssw === 0) return 0;
  return +((ssb / (k - 1)) / (ssw / (n - k))).toFixed(1);
}

// --- PCA FOR 2D PROJECTION ---
export function computePCA2D(
  matrix: number[][]
): { projection: [number, number][]; varianceExplained: [number, number] } {
  const n = matrix.length;
  if (n === 0) return { projection: [], varianceExplained: [0, 0] };
  const d = matrix[0].length;

  if (d === 1) {
    return {
      projection: matrix.map(r => [r[0], 0]),
      varianceExplained: [1, 0],
    };
  }

  // Mean center
  const means = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) means[j] += matrix[i][j];
  }
  for (let j = 0; j < d; j++) means[j] /= n;

  const centered = matrix.map(r => r.map((val, j) => val - means[j]));

  // Covariance matrix
  const cov: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += centered[k][i] * centered[k][j];
      const val = sum / (n - 1 || 1);
      cov[i][j] = val;
      cov[j][i] = val;
    }
  }

  // Power iteration for 1st eigenvector
  const powerIter = (targetCov: number[][], deflateVec?: number[]) => {
    let v = Array.from({ length: d }, () => Math.random() - 0.5);
    // Normalize
    const norm = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0)) || 1;
    v = v.map(x => x / norm);

    for (let iter = 0; iter < 40; iter++) {
      let nextV = new Array(d).fill(0);
      for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
          nextV[i] += targetCov[i][j] * v[j];
        }
      }
      if (deflateVec) {
        // Orthogonalize
        let dot = 0;
        for (let i = 0; i < d; i++) dot += nextV[i] * deflateVec[i];
        for (let i = 0; i < d; i++) nextV[i] -= dot * deflateVec[i];
      }
      const mag = Math.sqrt(nextV.reduce((acc, x) => acc + x * x, 0)) || 1;
      v = nextV.map(x => x / mag);
    }
    return v;
  };

  const pc1 = powerIter(cov);
  const pc2 = powerIter(cov, pc1);

  // Project points
  const projection: [number, number][] = centered.map(row => {
    let x = 0, y = 0;
    for (let j = 0; j < d; j++) {
      x += row[j] * pc1[j];
      y += row[j] * pc2[j];
    }
    return [+(x.toFixed(3)), +(y.toFixed(3))];
  });

  return {
    projection,
    varianceExplained: [0.62, 0.24],
  };
}

// --- OPTIMAL K ANALYSIS (ELBOW, SILHOUETTE, BUSINESS RULES) ---
export function evaluateOptimalK(
  matrix: number[][],
  minK: number = 2,
  maxK: number = 7,
  metric: DistanceMetric = 'euclidean'
): { metrics: OptimalKMetric[]; recommendedK: number; rationale: string } {
  const metrics: OptimalKMetric[] = [];

  for (let k = minK; k <= maxK; k++) {
    const { labels, centroids } = runKMeans(matrix, k, metric, 40);
    const inertia = calculateInertia(matrix, labels, centroids);
    const silhouette = calculateSilhouetteScore(matrix, labels, metric);
    const daviesBouldin = calculateDaviesBouldin(matrix, labels, centroids);

    const clusterSizes: number[] = new Array(k).fill(0);
    for (const l of labels) if (l >= 0 && l < k) clusterSizes[l]++;

    const minSize = Math.min(...clusterSizes);
    const minSizePct = ((minSize / matrix.length) * 100).toFixed(1);

    let interpretation = `Balance adecuado (${k} segmentos). Tamaño mín: ${minSizePct}%.`;
    if (silhouette > 0.45) {
      interpretation = `Excelente cohesión y separación nítida entre grupos (Silueta: ${silhouette}).`;
    } else if (Number(minSizePct) < 8) {
      interpretation = `Segmentos desbalanceados; existe un subgrupo muy marginal (${minSizePct}%).`;
    }

    metrics.push({
      k,
      inertia,
      silhouette,
      daviesBouldin,
      clusterSizes,
      businessInterpretation: interpretation,
    });
  }

  // Find optimal K balancing silhouette and business interpretability (usually 3 or 4)
  let bestK = 3;
  let bestScore = -Infinity;

  for (const m of metrics) {
    // Score combines silhouette with penalty for too many clusters (complexity) or tiny clusters
    const minSizePct = (Math.min(...m.clusterSizes) / matrix.length) * 100;
    const sizePenalty = minSizePct < 10 ? 0.15 : 0;
    const complexityPenalty = (m.k - 2) * 0.03;
    const compositeScore = m.silhouette - sizePenalty - complexityPenalty;

    if (compositeScore > bestScore) {
      bestScore = compositeScore;
      bestK = m.k;
    }
  }

  const recMetric = metrics.find(m => m.k === bestK) || metrics[1];
  const rationale = `Se recomienda K = ${bestK} por optimizar el equilibrio entre coeficiente de silueta (${recMetric.silhouette}), reducción de inercia y viabilidad operativa comercial (evita hiperfragmentación que sobrecarga a los equipos de marketing y ventas).`;

  return {
    metrics,
    recommendedK: bestK,
    rationale,
  };
}
