import React from 'react';
import { DataQualityReport } from '../../types/data';
import { ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, Activity, Info } from 'lucide-react';

interface Stage3DiagnosisProps {
  report: DataQualityReport;
  onNext: () => void;
  onBack: () => void;
}

export const Stage3Diagnosis: React.FC<Stage3DiagnosisProps> = ({
  report,
  onNext,
  onBack,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 3 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Diagnóstico Exhaustivo de Calidad de Datos
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Evaluación automática de integridad, valores faltantes, duplicados, columnas constantes, valores atípicos (IQR)
          e inconsistencias de formato. Distinguimos entre problemas confirmados y anomalías que requieren juicio del analista.
        </p>
      </div>

      {/* Main Health Score Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border font-extrabold text-xl ${getScoreColor(report.qualityScore)}`}>
            <span>{report.qualityScore}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">/100</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Índice Global de Calidad de la Base de Datos
              </h3>
              {report.qualityScore >= 80 ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Saludable</span>
              ) : report.qualityScore >= 60 ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">Aceptable</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">Crítico</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              {report.qualityScore >= 80
                ? 'El conjunto de datos presenta una estructura robusta y apta para la aplicación de algoritmos de clustering con mínimo preprocesamiento.'
                : 'Se detectaron inconsistencias relevantes (nulos, duplicados o atípicos) que deben ser tratadas en la Etapa 4 de Limpieza.'}
            </p>
          </div>
        </div>

        <div className="flex gap-4 shrink-0 text-center">
          <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Filas Evaluadas</div>
            <div className="text-sm font-bold text-slate-800">{report.totalRows.toLocaleString()}</div>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Columnas</div>
            <div className="text-sm font-bold text-slate-800">{report.totalColumns}</div>
          </div>
        </div>
      </div>

      {/* 4 Core Diagnosis Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Duplicates */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Filas Duplicadas</span>
            <span className={report.duplicateRows > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              {report.duplicatePercentage}%
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">{report.duplicateRows}</div>
          <div className="text-[11px] text-slate-500">
            {report.duplicateRows > 0 ? 'Registros idénticos que sesgan densidades' : 'Sin duplicados exactos'}
          </div>
        </div>

        {/* Missing cells */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Celdas Faltantes</span>
            <span className={report.totalMissingCells > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
              {report.missingPercentage}%
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">{report.totalMissingCells}</div>
          <div className="text-[11px] text-slate-500">
            {report.columnsWithMissing.length} columnas con valores nulos
          </div>
        </div>

        {/* Outliers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Valores Atípicos (IQR)</span>
            <span className="text-indigo-600 font-bold">1.5 × IQR</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {Object.values(report.outlierCounts).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-[11px] text-slate-500">
            En {Object.keys(report.outlierCounts).length} variables numéricas
          </div>
        </div>

        {/* Impossible values / anomalies */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Valores Imposibles</span>
            <span className={report.impossibleValues.length > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              {report.impossibleValues.length > 0 ? 'Crítico' : 'Limpio'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {report.impossibleValues.reduce((a, b) => a + b.count, 0)}
          </div>
          <div className="text-[11px] text-slate-500">
            Fuera de rangos lógicos esperados
          </div>
        </div>

      </div>

      {/* Two Columns: Confirmed Issues vs Anomalies Needing Review */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Confirmed issues */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Problemas Confirmados (Requieren Corrección)</span>
          </div>
          <p className="text-xs text-slate-500">
            Errores matemáticos u operacionales demostrables que distorsionan directamente las distancias y pesos de clustering.
          </p>

          {report.confirmedIssues.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No se detectaron problemas críticos estructurales confirmados.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {report.confirmedIssues.map((issue, idx) => (
                <li key={idx} className="bg-rose-50/70 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-900 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Anomalies needing review */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Anomalías que Requieren Criterio del Analista</span>
          </div>
          <p className="text-xs text-slate-500">
            Comportamientos inusuales, colas largas o categorías dispersas que pueden reflejar nichos genuinos de negocio o ruido estadístico.
          </p>

          {report.reviewNeededIssues.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Distribuciones uniformes sin colas anómalas severas.</span>
            </div>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {report.reviewNeededIssues.map((issue, idx) => (
                <li key={idx} className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a Clasificación</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Continuar a Limpieza e Imputación</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
