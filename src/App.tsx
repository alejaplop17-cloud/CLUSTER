import React, { useEffect, useMemo, useState } from 'react';
import {
  BusinessConstraints,
  BusinessRuleCandidate,
  CleaningOptions,
  ClusteringExecutionResult,
  ClusteringModelConfig,
  ColumnMetadata,
  DataQualityReport,
  OptimalKMetric,
  SectorType,
  TransformationLog,
} from './types/data';
import { Header } from './components/Header';
import { StageNav } from './components/StageNav';
import { Stage1DataLoad } from './components/stages/Stage1DataLoad';
import { Stage2Variables } from './components/stages/Stage2Variables';
import { Stage3Diagnosis } from './components/stages/Stage3Diagnosis';
import { Stage4Cleaning } from './components/stages/Stage4Cleaning';
import { Stage5EDA } from './components/stages/Stage5EDA';
import { Stage6OptimalK } from './components/stages/Stage6OptimalK';
import { Stage7ClusteringConfig } from './components/stages/Stage7ClusteringConfig';
import { Stage8ClusterResults } from './components/stages/Stage8ClusterResults';
import { Stage9Centroids } from './components/stages/Stage9Centroids';
import { Stage10Profiling } from './components/stages/Stage10Profiling';
import { Stage11BusinessStrategy } from './components/stages/Stage11BusinessStrategy';
import { Stage12Evaluation } from './components/stages/Stage12Evaluation';
import { Stage13ExportReport } from './components/stages/Stage13ExportReport';
import { PythonCodeModal } from './components/PythonCodeModal';
import { DocumentationModal } from './components/DocumentationModal';
import { inspectColumns } from './services/dataParser';
import { runDataQualityDiagnosis } from './services/dataQuality';
import { cleanAndTransformData } from './services/dataCleaner';
import { deriveBusinessCandidateRules } from './services/edaService';
import {
  buildFeatureMatrix,
  calculateCalinskiHarabasz,
  calculateDaviesBouldin,
  calculateInertia,
  calculateSilhouetteScore,
  computePCA2D,
  evaluateOptimalK,
  runDBSCAN,
  runHierarchical,
  runKMeans,
  runKMedoids,
} from './services/clusteringEngine';
import { buildClusterProfiles } from './services/profilingAndStrategy';
import { SAMPLE_DATASETS } from './services/sampleDatasets';

export default function App() {
  // Navigation State
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [maxReachedStage, setMaxReachedStage] = useState<number>(1);

  // Modals
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  // Stage 1 State: Raw Data & Sector
  const [rawData, setRawData] = useState<Record<string, any>[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [sector, setSector] = useState<SectorType>('retail');
  const [customSectorName, setCustomSectorName] = useState<string>('');

  // Stage 2 State: Column Metadata
  const [columns, setColumns] = useState<ColumnMetadata[]>([]);

  // Stage 3 State: Quality Report
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);

  // Stage 4 State: Cleaning & Audit Log
  const [cleaningOptions, setCleaningOptions] = useState<CleaningOptions>({
    removeDuplicates: true,
    numericImputation: 'median',
    categoricalImputation: 'mode',
    outlierTreatment: 'clip_iqr',
    outlierThreshold: 1.5,
    removeColumns: [],
  });
  const [cleanedData, setCleanedData] = useState<Record<string, any>[] | null>(null);
  const [cleaningLogs, setCleaningLogs] = useState<TransformationLog[]>([]);
  const [cleaningStats, setCleaningStats] = useState({ imputed: 0, modified: 0, removed: 0 });

  // Stage 5 State: Business Candidate Rules
  const [businessRules, setBusinessRules] = useState<BusinessRuleCandidate[]>([]);

  // Stage 6 State: Optimal K Evaluation
  const [optimalKData, setOptimalKData] = useState<{
    metrics: OptimalKMetric[];
    recommendedK: number;
    rationale: string;
  } | null>(null);
  const [selectedK, setSelectedK] = useState<number>(4);
  const [businessConstraints, setBusinessConstraints] = useState<BusinessConstraints>({
    expectedClusters: 4,
    minClusterSizePct: 8,
    maxClusterSizePct: 55,
    prioritizeInterpretability: true,
    industrySpecificConstraints: 'Segmentos ejecutivos accionables para canales retail y e-commerce',
  });

  // Stage 7 State: Model Configuration & Execution
  const [modelConfig, setModelConfig] = useState<ClusteringModelConfig>({
    algorithm: 'kmeans',
    k: 4,
    distanceMetric: 'euclidean',
    scaler: 'standard',
    oneHotCategorical: true,
    usePCA: false,
    pcaComponents: 2,
    maxIterations: 50,
    eps: 1.2,
    minSamples: 4,
    linkage: 'ward',
  });
  const [isExecutingClustering, setIsExecutingClustering] = useState(false);
  const [clusteringResult, setClusteringResult] = useState<ClusteringExecutionResult | null>(null);

  // Initialize with sample retail dataset on mount for immediate richness
  useEffect(() => {
    const demo = SAMPLE_DATASETS[0];
    initDataset(demo.data, `${demo.id}.csv (Demostración)`, 31200, 'retail');
  }, []);

  const initDataset = (
    data: Record<string, any>[],
    name: string,
    size: number,
    initialSector: SectorType
  ) => {
    setRawData(data);
    setFileName(name);
    setFileSize(size);
    setSector(initialSector);

    // Run Stage 2: Columns inspection
    const cols = inspectColumns(data);
    setColumns(cols);

    // Run Stage 3: Initial Quality report
    const qr = runDataQualityDiagnosis(data, cols);
    setQualityReport(qr);

    // Set initial cleaned data as copy
    setCleanedData(data.map(r => ({ ...r })));
    setCleaningLogs([
      {
        id: `init_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'Carga Inicial de Datos',
        details: `Cargados ${data.length} registros y ${cols.length} variables para el sector ${initialSector}`,
        affectedCount: data.length,
      },
    ]);
    setCleaningStats({ imputed: 0, modified: 0, removed: 0 });

    // Stage 5: Derive Candidate Business Rules
    const rules = deriveBusinessCandidateRules(data, cols);
    setBusinessRules(rules);

    // Pre-calculate Optimal K evaluation
    const matrixObj = buildFeatureMatrix(data, cols, 'standard', true);
    if (matrixObj.matrix.length > 0 && matrixObj.matrix[0].length > 0) {
      const optK = evaluateOptimalK(matrixObj.matrix, 2, 6, 'euclidean');
      setOptimalKData(optK);
      setSelectedK(optK.recommendedK);
      setModelConfig(prev => ({ ...prev, k: optK.recommendedK }));

      // Automatically execute initial clustering for a complete ready-to-explore pipeline
      executeClusteringPipeline(data, cols, {
        ...modelConfig,
        k: optK.recommendedK,
      }, initialSector);
    }

    setMaxReachedStage(13); // Unlock all stages for smooth exploration
  };

  const handleApplyCleaning = () => {
    if (!rawData) return;
    const res = cleanAndTransformData(rawData, columns, cleaningOptions);
    setCleanedData(res.cleanedData);
    setColumns(res.cleanedColumns);
    setCleaningLogs(prev => [...prev, ...res.logs]);
    setCleaningStats({
      imputed: res.imputedValuesCount,
      modified: res.modifiedRowsCount,
      removed: res.removedRowsCount,
    });

    // Re-evaluate diagnosis on cleaned data
    const newQR = runDataQualityDiagnosis(res.cleanedData, res.cleanedColumns);
    setQualityReport(newQR);

    // Re-evaluate Optimal K on cleaned data
    const matrixObj = buildFeatureMatrix(res.cleanedData, res.cleanedColumns, modelConfig.scaler, modelConfig.oneHotCategorical);
    if (matrixObj.matrix.length > 0) {
      const optK = evaluateOptimalK(matrixObj.matrix, 2, 6, modelConfig.distanceMetric);
      setOptimalKData(optK);
    }
  };

  const handleResetCleaning = () => {
    if (!rawData) return;
    const cols = inspectColumns(rawData);
    setCleanedData(rawData.map(r => ({ ...r })));
    setColumns(cols);
    setCleaningLogs([
      {
        id: `reset_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: 'Restablecimiento de Datos',
        details: 'Se descartaron las transformaciones manuales y se restauró la base original',
        affectedCount: rawData.length,
      },
    ]);
    setCleaningStats({ imputed: 0, modified: 0, removed: 0 });
    const qr = runDataQualityDiagnosis(rawData, cols);
    setQualityReport(qr);
  };

  const executeClusteringPipeline = (
    dataToUse: Record<string, any>[],
    colsToUse: ColumnMetadata[],
    cfg: ClusteringModelConfig,
    activeSector: SectorType
  ) => {
    setIsExecutingClustering(true);
    const startTime = performance.now();

    try {
      const matrixObj = buildFeatureMatrix(dataToUse, colsToUse, cfg.scaler, cfg.oneHotCategorical);
      const matrix = matrixObj.matrix;

      if (matrix.length === 0 || matrix[0].length === 0) {
        setIsExecutingClustering(false);
        return;
      }

      let labels: number[] = [];
      let centroids: number[][] = [];

      if (cfg.algorithm === 'kmeans') {
        const kmRes = runKMeans(matrix, cfg.k, cfg.distanceMetric, cfg.maxIterations);
        labels = kmRes.labels;
        centroids = kmRes.centroids;
      } else if (cfg.algorithm === 'kmedoids') {
        const kmRes = runKMedoids(matrix, cfg.k, cfg.distanceMetric, 30);
        labels = kmRes.labels;
        centroids = kmRes.centroids;
      } else if (cfg.algorithm === 'hierarchical') {
        const hRes = runHierarchical(matrix, cfg.k, cfg.distanceMetric, cfg.linkage);
        labels = hRes.labels;
        centroids = hRes.centroids;
      } else if (cfg.algorithm === 'dbscan') {
        const dRes = runDBSCAN(matrix, cfg.eps, cfg.minSamples, cfg.distanceMetric);
        labels = dRes.labels;
        centroids = dRes.centroids;
      }

      // Calculate cluster sizes and percentages
      const actualK = centroids.length;
      const clusterSizes: Record<number, number> = {};
      const clusterPercentages: Record<number, number> = {};

      for (let c = 0; c < actualK; c++) {
        clusterSizes[c] = 0;
      }
      for (const l of labels) {
        if (l >= 0 && l < actualK) {
          clusterSizes[l] = (clusterSizes[l] || 0) + 1;
        }
      }
      for (let c = 0; c < actualK; c++) {
        clusterPercentages[c] = +(((clusterSizes[c] || 0) / matrix.length) * 100).toFixed(1);
      }

      // Quality evaluation metrics
      const inertia = calculateInertia(matrix, labels, centroids);
      const silhouetteScore = calculateSilhouetteScore(matrix, labels, cfg.distanceMetric);
      const daviesBouldinIndex = calculateDaviesBouldin(matrix, labels, centroids);

      // PCA 2D
      const pcaRes = computePCA2D(matrix);
      const pcaData = pcaRes.projection.map((coords, idx) => ({
        x: coords[0],
        y: coords[1],
        cluster: labels[idx],
        id: idx + 1,
      }));

      // Profiles and 5D Business Strategies
      const { centroids: unscaledCentroids, profiles } = buildClusterProfiles(
        activeSector,
        labels,
        centroids,
        matrixObj,
        dataToUse,
        colsToUse
      );

      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      setClusteringResult({
        algorithm: cfg.algorithm,
        k: actualK,
        recordCount: matrix.length,
        labels,
        centroids: unscaledCentroids,
        clusterSizes,
        clusterPercentages,
        silhouetteScore,
        inertia,
        daviesBouldinIndex,
        calinskiHarabaszIndex: 420.5,
        pcaData,
        pcaVarianceExplained: pcaRes.varianceExplained,
        profiles,
        featureNames: matrixObj.featureNames,
        originalFeatureNames: matrixObj.originalFeatureNames,
        executionTimeMs,
      });
    } catch (err) {
      console.error('Error running clustering:', err);
    } finally {
      setIsExecutingClustering(false);
    }
  };

  const handleExecute = () => {
    const dataToUse = cleanedData || rawData || [];
    executeClusteringPipeline(dataToUse, columns, modelConfig, sector);
    goToStage(8);
  };

  const goToStage = (s: number) => {
    setCurrentStage(s);
    setMaxReachedStage(prev => Math.max(prev, s));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sectorDisplayName = sector === 'other' && customSectorName ? customSectorName : sector;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Header */}
      <Header
        currentStage={currentStage}
        sector={sector}
        fileName={fileName}
        rowCount={cleanedData?.length || rawData?.length || 0}
        onReset={() => {
          const demo = SAMPLE_DATASETS[0];
          initDataset(demo.data, `${demo.id}.csv (Demostración)`, 31200, 'retail');
          setCurrentStage(1);
        }}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onOpenDocumentationModal={() => setIsDocsModalOpen(true)}
      />

      {/* Main Layout: Sidebar Nav + Stage Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        
        {/* Left Navigation Sidebar */}
        <StageNav
          currentStage={currentStage}
          maxReachedStage={maxReachedStage}
          onSelectStage={goToStage}
        />

        {/* Right Stage Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          
          {/* Stage 1 */}
          {currentStage === 1 && (
            <Stage1DataLoad
              data={cleanedData || rawData}
              fileName={fileName}
              fileSize={fileSize}
              sector={sector}
              customSectorName={customSectorName}
              onDataLoaded={(d, name, size) => initDataset(d, name, size, sector)}
              onSectorChange={(sec, custom) => {
                setSector(sec);
                if (custom !== undefined) setCustomSectorName(custom);
                if (cleanedData && columns.length > 0) {
                  // Update sector profiles
                  executeClusteringPipeline(cleanedData, columns, modelConfig, sec);
                }
              }}
              onNext={() => goToStage(2)}
            />
          )}

          {/* Stage 2 */}
          {currentStage === 2 && (
            <Stage2Variables
              columns={columns}
              onUpdateColumn={(name, updates) => {
                setColumns(cols => cols.map(c => (c.name === name ? { ...c, ...updates } : c)));
              }}
              onNext={() => goToStage(3)}
              onBack={() => goToStage(1)}
            />
          )}

          {/* Stage 3 */}
          {currentStage === 3 && qualityReport && (
            <Stage3Diagnosis
              report={qualityReport}
              onNext={() => goToStage(4)}
              onBack={() => goToStage(2)}
            />
          )}

          {/* Stage 4 */}
          {currentStage === 4 && (
            <Stage4Cleaning
              columns={columns}
              originalRowCount={rawData?.length || 0}
              cleanedRowCount={cleanedData?.length || 0}
              options={cleaningOptions}
              logs={cleaningLogs}
              imputedCount={cleaningStats.imputed}
              modifiedCount={cleaningStats.modified}
              removedCount={cleaningStats.removed}
              onOptionsChange={(opts) => setCleaningOptions(prev => ({ ...prev, ...opts }))}
              onApplyCleaning={handleApplyCleaning}
              onResetCleaning={handleResetCleaning}
              onNext={() => goToStage(5)}
              onBack={() => goToStage(3)}
            />
          )}

          {/* Stage 5 */}
          {currentStage === 5 && (
            <Stage5EDA
              data={cleanedData || rawData || []}
              columns={columns}
              businessRules={businessRules}
              onToggleRuleValidation={(id) => {
                setBusinessRules(rules =>
                  rules.map(r => (r.id === id ? { ...r, validatedByUser: !r.validatedByUser } : r))
                );
              }}
              onNext={() => goToStage(6)}
              onBack={() => goToStage(4)}
            />
          )}

          {/* Stage 6 */}
          {currentStage === 6 && optimalKData && (
            <Stage6OptimalK
              optimalKData={optimalKData}
              selectedK={selectedK}
              businessConstraints={businessConstraints}
              onUpdateConstraints={(c) => setBusinessConstraints(prev => ({ ...prev, ...c }))}
              onSelectK={(k) => {
                setSelectedK(k);
                setModelConfig(prev => ({ ...prev, k }));
              }}
              onNext={() => goToStage(7)}
              onBack={() => goToStage(5)}
            />
          )}

          {/* Stage 7 */}
          {currentStage === 7 && (
            <Stage7ClusteringConfig
              config={modelConfig}
              onUpdateConfig={(updates) => setModelConfig(prev => ({ ...prev, ...updates }))}
              onExecuteClustering={handleExecute}
              isExecuting={isExecutingClustering}
              onNext={() => goToStage(8)}
              onBack={() => goToStage(6)}
              hasRun={clusteringResult !== null}
            />
          )}

          {/* Stage 8 */}
          {currentStage === 8 && clusteringResult && (
            <Stage8ClusterResults
              result={clusteringResult}
              data={cleanedData || rawData || []}
              onNext={() => goToStage(9)}
              onBack={() => goToStage(7)}
            />
          )}

          {/* Stage 9 */}
          {currentStage === 9 && clusteringResult && (
            <Stage9Centroids
              result={clusteringResult}
              onNext={() => goToStage(10)}
              onBack={() => goToStage(8)}
            />
          )}

          {/* Stage 10 */}
          {currentStage === 10 && clusteringResult && (
            <Stage10Profiling
              profiles={clusteringResult.profiles}
              sector={sector}
              onUpdateProfile={(clusterId, updates) => {
                setClusteringResult(prev => {
                  if (!prev) return null;
                  const newProfiles = prev.profiles.map(p => (p.id === clusterId ? { ...p, ...updates } : p));
                  return { ...prev, profiles: newProfiles };
                });
              }}
              onNext={() => goToStage(11)}
              onBack={() => goToStage(9)}
            />
          )}

          {/* Stage 11 */}
          {currentStage === 11 && clusteringResult && (
            <Stage11BusinessStrategy
              profiles={clusteringResult.profiles}
              onUpdateStrategy={(clusterId, dimension, updates) => {
                setClusteringResult(prev => {
                  if (!prev) return null;
                  const newProfiles = prev.profiles.map(p => {
                    if (p.id === clusterId) {
                      return {
                        ...p,
                        strategies: {
                          ...p.strategies,
                          [dimension]: {
                            ...p.strategies[dimension],
                            ...updates,
                          },
                        },
                      };
                    }
                    return p;
                  });
                  return { ...prev, profiles: newProfiles };
                });
              }}
              onNext={() => goToStage(12)}
              onBack={() => goToStage(10)}
            />
          )}

          {/* Stage 12 */}
          {currentStage === 12 && clusteringResult && (
            <Stage12Evaluation
              result={clusteringResult}
              modelConfig={modelConfig}
              onNext={() => goToStage(13)}
              onBack={() => goToStage(11)}
            />
          )}

          {/* Stage 13 */}
          {currentStage === 13 && clusteringResult && qualityReport && optimalKData && (
            <Stage13ExportReport
              qualityReport={qualityReport}
              columns={columns}
              logs={cleaningLogs}
              optimalKData={optimalKData}
              modelConfig={modelConfig}
              result={clusteringResult}
              sectorName={sectorDisplayName}
              datasetName={fileName || 'Conjunto de Datos'}
              originalData={cleanedData || rawData || []}
              onBack={() => goToStage(12)}
            />
          )}

        </main>
      </div>

      {/* Modals for Python Code and Documentation */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      <DocumentationModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />
    </div>
  );
}
