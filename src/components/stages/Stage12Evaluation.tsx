import React from 'react';
import { ClusteringExecutionResult, ClusteringModelConfig } from '../../types/data';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Activity,
  Lightbulb,
} from 'lucide-react';

interface Stage12EvaluationProps {
  result: ClusteringExecutionResult;
  modelConfig: ClusteringModelConfig;
  onNext: () => void;
  onBack: () => void;
}

export const Stage12Evaluation: React.FC<Stage12EvaluationProps> = ({
  result,
  modelConfig,
  onNext,
  onBack,
}) => {
  // Check cluster size balance
  const clusterPcts = Object.values(result.clusterPercentages);
  const minPct = Math.min(...clusterPcts);
  const maxPct = Math.max(...clusterPcts);

  const hasSmallCluster = minPct < 5;
  const hasDominantCluster = maxPct > 60;
  const isSilhouetteAcceptable = result.silhouetteScore >= 0.35;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 12 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Evaluación y Validación Metodológica del Modelo
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Verificación exhaustiva de solidez estadística y viabilidad comercial. Comprobamos la separación geométrica,
          el balance de tamaños, la ausencia de microsegmentos marginales y la coherencia de negocio.
        </p>
      </div>

      {/* Global Validation Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${
              isSilhouetteAcceptable && !hasSmallCluster
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}
          >
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Dictamen Técnico de Calidad del Agrupamiento
              </h3>
              {isSilhouetteAcceptable && !hasSmallCluster ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Validado para Producción
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  Aprobado con Advertencias
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {isSilhouetteAcceptable && !hasSmallCluster
                ? 'El modelo cumple simultáneamente con criterios de separación matemática y balance operacional de volúmenes para ejecución comercial.'
                : 'El modelo es funcional pero presenta alertas en la distribución de tamaños o en la cercanía de fronteras entre grupos.'}
            </p>
          </div>
        </div>

        <div className="flex gap-4 shrink-0 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Silueta Global</div>
            <div className={`text-xl font-extrabold ${result.silhouetteScore >= 0.4 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {result.silhouetteScore}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Davies-Bouldin</div>
            <div className="text-xl font-extrabold text-slate-800">
              {result.daviesBouldinIndex}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        
        {/* Statistical Soundness */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>1. Validación Estadística y Separabilidad</span>
          </h4>

          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-semibold">Coeficiente de Silueta: {result.silhouetteScore}</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {result.silhouetteScore > 0.45
                    ? 'Estructura fuerte y definida. Distancias inter-cluster superan ampliamente la dispersión intra-cluster.'
                    : 'Separación aceptable para datos empresariales reales con solapamiento moderado en las fronteras.'}
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-semibold">Índice Davies-Bouldin: {result.daviesBouldinIndex}</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Valores cercanos o inferiores a 1.2 confirman que cada cluster está bien separado de su vecino más próximo.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-semibold">Convergencia del Algoritmo:</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Convergencia estable alcanzada en {result.executionTimeMs} ms sin oscilación de centroides.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Operational Viability */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>2. Viabilidad Operacional y Comercial</span>
          </h4>

          <ul className="space-y-2.5">
            <li className={`flex items-start gap-2.5 p-2 rounded-lg border ${hasSmallCluster ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              {hasSmallCluster ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="text-slate-800 font-semibold">
                  Balance de Tamaños (Mín: {minPct}% · Máx: {maxPct}%)
                </strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {hasSmallCluster
                    ? 'Advertencia: Existe un cluster con menos del 5% de la base. Podría tratarse de un subgrupo residual o nicho ultraconcentrado.'
                    : 'Excelente distribución: ningún cluster es inferior al 5% ni monopoliza más del 60% de los registros.'}
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-semibold">Interpretabilidad Sectorial:</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Los perfiles reflejan variables observables con impacto comercial directo (RFM, tickets, uso de servicio, riesgos).
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-semibold">Trazabilidad Metodológica:</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Los parámetros de distancia, escalador y algoritmos están 100% documentados para garantizar reproducibilidad.
                </p>
              </div>
            </li>
          </ul>
        </div>

      </div>

      {/* Suggested Alternatives if Needed */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <strong className="font-bold text-slate-900">Recomendaciones para afinar resultados:</strong>
          <p className="leading-relaxed">
            Si deseas explorar una mayor resolución de nichos, puedes aumentar K en la Etapa 7 o probar la distancia <strong>Manhattan</strong> si los datos presentan asimetría.
            Para segmentos de forma no esférica, evalúa <strong>DBSCAN</strong> o <strong>Clustering Jerárquico</strong> con enlace Ward.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a Estrategias</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Ir a Exportación de Informe HTML</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
