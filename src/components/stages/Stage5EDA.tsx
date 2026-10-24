import React, { useState } from 'react';
import { BusinessRuleCandidate, ColumnMetadata } from '../../types/data';
import {
  computeCategoricalEDA,
  computeNumericEDA,
  deriveBusinessCandidateRules,
  generateCorrelationMatrix,
} from '../../services/edaService';
import { BarChart3, TrendingUp, Grid, ShieldAlert, ArrowRight, ArrowLeft, CheckSquare, Square, Info } from 'lucide-react';

interface Stage5EDAProps {
  data: Record<string, any>[];
  columns: ColumnMetadata[];
  businessRules: BusinessRuleCandidate[];
  onToggleRuleValidation: (ruleId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Stage5EDA: React.FC<Stage5EDAProps> = ({
  data,
  columns,
  businessRules,
  onToggleRuleValidation,
  onNext,
  onBack,
}) => {
  const numericCols = columns.filter(c => c.selectedType.startsWith('numeric') && c.includeInClustering);
  const categoricalCols = columns.filter(c => c.selectedType.startsWith('categorical') && c.includeInClustering);

  const [selectedNumCol, setSelectedNumCol] = useState<string>(numericCols[0]?.name || '');
  const [selectedCatCol, setSelectedCatCol] = useState<string>(categoricalCols[0]?.name || '');
  const [corrMethod, setCorrMethod] = useState<'pearson' | 'spearman'>('pearson');

  const currentNumEDA = selectedNumCol ? computeNumericEDA(data, selectedNumCol) : null;
  const currentCatEDA = selectedCatCol ? computeCategoricalEDA(data, selectedCatCol) : null;

  // Correlation Matrix
  const corrData = numericCols.length >= 2
    ? generateCorrelationMatrix(data, numericCols.slice(0, 8).map(c => c.name), corrMethod)
    : null;

  const getHeatmapColor = (val: number) => {
    if (val === 1) return '#e0e7ff';
    if (val > 0.6) return '#bbf7d0'; // Strong positive green
    if (val > 0.3) return '#dcfce7'; // Moderate green
    if (val < -0.6) return '#fecdd3'; // Strong negative red
    if (val < -0.3) return '#ffe4e6'; // Moderate red
    return '#f8fafc'; // Neutral
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 5 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Análisis Exploratorio de Datos (EDA) y Reglas de Negocio
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Explora distribuciones estadísticas, matrices de correlación lineal y no lineal, y valida umbrales empíricos derivados de los datos para fundamentar la interpretación posterior de los segmentos.
        </p>
      </div>

      {/* Numerical Variable In-Depth Exploration */}
      {numericCols.length > 0 && currentNumEDA && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Estadísticas Descriptivas y Distribución
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Variable seleccionada:</span>
              <select
                value={selectedNumCol}
                onChange={(e) => setSelectedNumCol(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500"
              >
                {numericCols.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Media (μ)</div>
              <div className="text-base font-bold text-slate-900">{currentNumEDA.mean.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Mediana (p50)</div>
              <div className="text-base font-bold text-indigo-600">{currentNumEDA.median.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Desv. Estándar (σ)</div>
              <div className="text-base font-bold text-slate-900">{currentNumEDA.std.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Rango [Mín - Máx]</div>
              <div className="text-xs font-bold text-slate-900 mt-1">
                [{currentNumEDA.min}, {currentNumEDA.max}]
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">IQR [p25 - p75]</div>
              <div className="text-xs font-bold text-slate-900 mt-1">
                [{currentNumEDA.q25}, {currentNumEDA.q75}]
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Percentil 90</div>
              <div className="text-base font-bold text-slate-900">{currentNumEDA.p90.toLocaleString()}</div>
            </div>
          </div>

          {/* Histogram SVG visualization */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-700 mb-2">Histograma de Frecuencia ({selectedNumCol}):</div>
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <div className="flex items-end gap-2 h-36 pt-4 px-2">
                {(() => {
                  const maxCount = Math.max(...currentNumEDA.histogram.map(b => b.count), 1);
                  return currentNumEDA.histogram.map((bin, idx) => {
                    const heightPct = Math.max(8, (bin.count / maxCount) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        <div className="text-[10px] font-bold text-slate-600 mb-1 group-hover:text-indigo-600">
                          {bin.count}
                        </div>
                        <div
                          className="w-full bg-indigo-500 group-hover:bg-indigo-600 rounded-t transition-all"
                          style={{ height: `${heightPct}%` }}
                        />
                        <div className="text-[9px] text-slate-400 mt-2 truncate w-full text-center" title={bin.bin}>
                          {bin.bin}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categorical Frequency Breakdown if any */}
      {categoricalCols.length > 0 && currentCatEDA && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Distribución de Frecuencia Categórica
            </h3>
            <select
              value={selectedCatCol}
              onChange={(e) => setSelectedCatCol(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-semibold"
            >
              {categoricalCols.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {currentCatEDA.topCategories.map((cat, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-900 truncate max-w-[120px]">{cat.category}</span>
                  <span className="text-indigo-600 font-bold">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${cat.percentage}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{cat.count.toLocaleString()} registros</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlation Matrix Heatmap */}
      {corrData && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-600" />
                <span>Matriz de Correlación Bivariada</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permite detectar variables redundantes o altamente colineales para evitar sobredimensionar ciertos atributos.
              </p>
            </div>
            <div className="inline-flex rounded-md shadow-xs self-start">
              <button
                onClick={() => setCorrMethod('pearson')}
                className={`px-3 py-1 text-xs font-semibold rounded-l-md border ${
                  corrMethod === 'pearson'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Pearson (Lineal)
              </button>
              <button
                onClick={() => setCorrMethod('spearman')}
                className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 ${
                  corrMethod === 'spearman'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Spearman (Rangos Monótonos)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-center text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-slate-700">Variable</th>
                  {corrData.columns.map((c) => (
                    <th key={c} className="px-3 py-2 font-bold text-slate-700 font-mono text-[11px] whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrData.columns.map((rowName, i) => (
                  <tr key={rowName}>
                    <td className="px-3 py-2 text-left font-bold text-slate-900 font-mono text-[11px] bg-slate-50 whitespace-nowrap">
                      {rowName}
                    </td>
                    {corrData.columns.map((colName, j) => {
                      const val = corrData.matrix[i][j];
                      const isDiag = i === j;
                      return (
                        <td
                          key={colName}
                          className="px-3 py-2 font-mono text-xs font-semibold"
                          style={{ backgroundColor: getHeatmapColor(val) }}
                        >
                          {isDiag ? '1.00' : val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Business Rules Derived from Data */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Reglas de Negocio Candidatas e Inferencias de Distribución</span>
        </div>
        <p className="text-xs text-slate-600">
          A continuación se proponen umbrales y reglas comerciales derivadas estadísticamente de los percentiles empíricos de los datos (sin inventar umbrales).
          Valida las reglas que se alineen con tus criterios operacionales:
        </p>

        <div className="space-y-2.5">
          {businessRules.map((rule) => (
            <div
              key={rule.id}
              onClick={() => onToggleRuleValidation(rule.id)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                rule.validatedByUser
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="mt-0.5">
                {rule.validatedByUser ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{rule.description}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800 font-semibold">
                    {rule.suggestedValue}
                  </span>
                </div>
                <div className="text-slate-600 leading-relaxed">{rule.businessImplication}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a Limpieza</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Continuar a Selección de K Óptimo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
