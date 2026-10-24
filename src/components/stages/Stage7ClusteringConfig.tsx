import React from 'react';
import {
  ClusteringAlgorithm,
  ClusteringModelConfig,
  DistanceMetric,
  ScalerType,
} from '../../types/data';
import { Cpu, Play, Settings2, ShieldCheck, ArrowRight, ArrowLeft, Info, HelpCircle } from 'lucide-react';

interface Stage7ClusteringConfigProps {
  config: ClusteringModelConfig;
  onUpdateConfig: (updates: Partial<ClusteringModelConfig>) => void;
  onExecuteClustering: () => void;
  isExecuting: boolean;
  onNext: () => void;
  onBack: () => void;
  hasRun: boolean;
}

export const Stage7ClusteringConfig: React.FC<Stage7ClusteringConfigProps> = ({
  config,
  onUpdateConfig,
  onExecuteClustering,
  isExecuting,
  onNext,
  onBack,
  hasRun,
}) => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 7 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Configuración y Ejecución del Modelo de Clustering
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Selecciona la familia de algoritmos no supervisados, el método de estandarización multivariado y la métrica de distancia compatible.
        </p>
      </div>

      {/* Methodological Clarification Banner (KNN & Distances) */}
      <div className="bg-slate-900 text-white rounded-xl p-4.5 space-y-2 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Aclaración Metodológica Rigurosa: Algoritmos vs Medidas de Distancia</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>KNN (K-Nearest Neighbors)</strong> no es un algoritmo de clustering no supervisado ni una métrica de distancia;
          es un método de clasificación/regresión supervisado y búsqueda de similitud local.
          Para clustering no supervisado genuino se emplean algoritmos particionales (<strong>K-Means</strong>, <strong>K-Medoids</strong>),
          jerárquicos aglomerativos o basados en densidad (<strong>DBSCAN</strong>), evaluados mediante métricas formales de distancia euclidiana, Manhattan, Minkowski o Gower.
        </p>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Algorithm Selection */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>1. Algoritmo de Clustering</span>
          </div>
          <p className="text-xs text-slate-500">
            Estructura de partición espacial de los datos.
          </p>

          <div className="space-y-2 pt-1 text-xs">
            {[
              {
                id: 'kmeans',
                name: 'K-Means (Lloyd + K-Means++)',
                desc: 'Rápido, centroides geométricos esféricos, estándar de la industria.',
              },
              {
                id: 'kmedoids',
                name: 'K-Medoids (PAM)',
                desc: 'Utiliza puntos reales de la muestra como medoides; altamente resistente a atípicos.',
              },
              {
                id: 'hierarchical',
                name: 'Clustering Jerárquico Aglomerativo',
                desc: 'Construcción ascendente mediante enlace Ward (mínima varianza) o Average.',
              },
              {
                id: 'dbscan',
                name: 'DBSCAN (Basado en Densidad)',
                desc: 'Encuentra formas arbitrarias y aísla ruido. No asume K predeterminado.',
              },
            ].map((algo) => (
              <label
                key={algo.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                  config.algorithm === algo.id
                    ? 'bg-indigo-50/70 border-indigo-400 font-semibold text-indigo-950'
                    : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="algorithm"
                  value={algo.id}
                  checked={config.algorithm === algo.id}
                  onChange={() => onUpdateConfig({ algorithm: algo.id as ClusteringAlgorithm })}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="text-xs">{algo.name}</div>
                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">{algo.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 2. Scaler & Encoding */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <span>2. Preprocesamiento & Escala</span>
          </div>
          <p className="text-xs text-slate-500">
            Imprescindible para que variables de gran escala (ej. Gasto en $) no monopolicen el cálculo de distancias.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Método de Escalado Numérico:</label>
              <select
                value={config.scaler}
                onChange={(e) => onUpdateConfig({ scaler: e.target.value as ScalerType })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
              >
                <option value="standard">StandardScaler (Z-Score: μ=0, σ=1) [Recomendado]</option>
                <option value="robust">RobustScaler (Mediana y Rango Intercuartílico IQR)</option>
                <option value="minmax">MinMaxScaler (Normalización [0, 1])</option>
                <option value="none">Sin escalado (No recomendado)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={config.oneHotCategorical}
                  onChange={(e) => onUpdateConfig({ oneHotCategorical: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Codificar variables categóricas (One-Hot)</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={config.usePCA}
                  onChange={(e) => onUpdateConfig({ usePCA: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Reducir dimensionalidad con PCA previo</span>
              </label>
            </div>
          </div>
        </div>

        {/* 3. Distance Metrics & Hyperparameters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>3. Métricas de Distancia</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Métrica de Distancia / Disimilitud:</label>
              <select
                value={config.distanceMetric}
                onChange={(e) => onUpdateConfig({ distanceMetric: e.target.value as DistanceMetric })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
              >
                <option value="euclidean">Distancia Euclidiana (L2 - Estándar continuo)</option>
                <option value="manhattan">Distancia Manhattan (L1 - Menos sensible a valores extremos)</option>
                <option value="minkowski">Distancia Minkowski (p=3)</option>
                <option value="cosine">Distancia Coseno (Orientación angular de vectores)</option>
                <option value="gower">Distancia de Gower (Datos mixtos)</option>
              </select>
            </div>

            {config.algorithm !== 'dbscan' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Número de Clusters (K):</label>
                  <span className="font-mono font-bold text-indigo-600 text-sm">{config.k}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={config.k}
                  onChange={(e) => onUpdateConfig({ k: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            )}

            {config.algorithm === 'dbscan' && (
              <div className="space-y-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Radio Epsilon (eps): {config.eps}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={config.eps}
                    onChange={(e) => onUpdateConfig({ eps: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mínimo de Muestras (min_samples): {config.minSamples}</label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={config.minSamples}
                    onChange={(e) => onUpdateConfig({ minSamples: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Execution Call to Action */}
      <div className="bg-indigo-600 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-bold text-base">¿Listo para entrenar la segmentación?</h3>
          <p className="text-xs text-indigo-100 mt-0.5">
            Se ejecutará <strong>{config.algorithm.toUpperCase()}</strong> con K = {config.k}, distancia {config.distanceMetric} y escalador {config.scaler}.
          </p>
        </div>

        <button
          onClick={onExecuteClustering}
          disabled={isExecuting}
          className="px-6 py-3 bg-white hover:bg-slate-100 text-indigo-900 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          {isExecuting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Optimizando iteraciones y convergencia...</span>
            </div>
          ) : (
            <>
              <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>Ejecutar Algoritmo de Clustering</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a K Óptimo</span>
        </button>

        <button
          onClick={onNext}
          disabled={!hasRun}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Ver Resultados y Visualización Gráfica</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
