export type VariableType =
  | 'numeric_continuous'
  | 'numeric_discrete'
  | 'categorical_nominal'
  | 'categorical_ordinal'
  | 'boolean'
  | 'datetime'
  | 'identifier'
  | 'text_free';

export type AnalysisRecommendation = 'include' | 'transform' | 'exclude' | 'review';

export interface ColumnMetadata {
  name: string;
  detectedType: VariableType;
  selectedType: VariableType;
  analysisType: 'numeric' | 'categorical' | 'temporal' | 'identifier' | 'text';
  uniqueValues: number;
  nullCount: number;
  nullPercentage: number;
  recommendation: AnalysisRecommendation;
  recommendationReason: string;
  includeInClustering: boolean;
  sampleValues: (string | number | boolean | null)[];
}

export type SectorType =
  | 'retail'
  | 'telecom'
  | 'finance'
  | 'manufacturing'
  | 'logistics'
  | 'health'
  | 'gastronomy'
  | 'tech'
  | 'energy'
  | 'other';

export interface SectorOption {
  id: SectorType;
  name: string;
  description: string;
  iconName: string;
}

export interface DataQualityReport {
  totalRows: number;
  totalColumns: number;
  duplicateRows: number;
  duplicatePercentage: number;
  totalMissingCells: number;
  missingPercentage: number;
  columnsWithMissing: string[];
  constantColumns: string[];
  highCardinalityColumns: string[];
  outlierCounts: Record<string, number>;
  impossibleValues: { column: string; issue: string; count: number }[];
  qualityScore: number; // 0 to 100
  confirmedIssues: string[];
  reviewNeededIssues: string[];
}

export interface TransformationLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  affectedCount: number;
}

export interface CleaningOptions {
  removeDuplicates: boolean;
  numericImputation: 'mean' | 'median' | 'zero' | 'none';
  categoricalImputation: 'mode' | 'unknown' | 'none';
  outlierTreatment: 'clip_iqr' | 'remove_iqr' | 'none';
  outlierThreshold: number; // default 1.5
  removeColumns: string[];
}

export interface NumericEDA {
  name: string;
  count: number;
  mean: number;
  median: number;
  mode: number;
  std: number;
  min: number;
  max: number;
  range: number;
  q25: number;
  q75: number;
  iqr: number;
  p90: number;
  skewness: number;
  histogram: { bin: string; count: number }[];
}

export interface CategoricalEDA {
  name: string;
  totalCount: number;
  uniqueCount: number;
  topCategories: { category: string; count: number; percentage: number }[];
}

export interface BusinessRuleCandidate {
  id: string;
  column: string;
  ruleType: 'threshold' | 'range' | 'ratio';
  description: string;
  suggestedValue: number | string;
  businessImplication: string;
  validatedByUser: boolean;
}

export interface OptimalKMetric {
  k: number;
  inertia: number;
  silhouette: number;
  daviesBouldin: number;
  clusterSizes: number[];
  businessInterpretation: string;
}

export interface BusinessConstraints {
  expectedClusters: number;
  minClusterSizePct: number;
  maxClusterSizePct: number;
  prioritizeInterpretability: boolean;
  industrySpecificConstraints: string;
}

export type ClusteringAlgorithm = 'kmeans' | 'hierarchical' | 'dbscan' | 'kmedoids';
export type DistanceMetric = 'euclidean' | 'manhattan' | 'cosine' | 'minkowski' | 'gower';
export type ScalerType = 'standard' | 'minmax' | 'robust' | 'none';

export interface ClusteringModelConfig {
  algorithm: ClusteringAlgorithm;
  k: number;
  distanceMetric: DistanceMetric;
  scaler: ScalerType;
  oneHotCategorical: boolean;
  usePCA: boolean;
  pcaComponents: number;
  maxIterations: number;
  // DBSCAN specific
  eps: number;
  minSamples: number;
  // Hierarchical specific
  linkage: 'ward' | 'complete' | 'average';
}

export interface ClusterCentroid {
  clusterId: number;
  name: string;
  scaledValues: Record<string, number>;
  unscaledValues: Record<string, number>;
  deltasVsMeanPct: Record<string, number>;
}

export interface ClusterDimensionStrategy {
  dimension: 'product' | 'price' | 'innovation' | 'communication' | 'profitability';
  title: string;
  mainRecommendation: string;
  keyTactics: string[];
  kpi: string;
  dataBackedRationale: string;
  potentialRisks: string;
}

export interface ClusterProfile {
  id: number;
  name: string;
  tagline: string;
  recordCount: number;
  percentage: number;
  color: string;
  keyCharacteristics: string[];
  discriminantFeatures: { feature: string; value: string; diffPct: number }[];
  predominantBehaviors: string;
  probableNeeds: string;
  businessOpportunities: string;
  risksAndLimitations: string;
  strategies: {
    product: ClusterDimensionStrategy;
    price: ClusterDimensionStrategy;
    innovation: ClusterDimensionStrategy;
    communication: ClusterDimensionStrategy;
    profitability: ClusterDimensionStrategy;
  };
}

export interface ClusteringExecutionResult {
  algorithm: ClusteringAlgorithm;
  k: number;
  recordCount: number;
  labels: number[];
  centroids: ClusterCentroid[];
  clusterSizes: Record<number, number>;
  clusterPercentages: Record<number, number>;
  silhouetteScore: number;
  inertia: number;
  daviesBouldinIndex: number;
  calinskiHarabaszIndex: number;
  pcaData: { x: number; y: number; cluster: number; id: string | number }[];
  pcaVarianceExplained: [number, number];
  profiles: ClusterProfile[];
  featureNames: string[];
  originalFeatureNames: string[];
  executionTimeMs: number;
}
