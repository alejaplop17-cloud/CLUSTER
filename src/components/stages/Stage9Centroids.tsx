import React, { useState } from 'react';
import { ClusteringExecutionResult } from '../../types/data';
import { Target, TrendingUp, ArrowRight, ArrowLeft, Info, HelpCircle } from 'lucide-react';

interface Stage9CentroidsProps {
  result: ClusteringExecutionResult;
  onNext: () => void;
  onBack: () => void;
}

export const Stage9Centroids: React.FC<Stage9CentroidsProps> = ({
  result,
  onNext,
  onBack,
}) => {
  const [showScaled, setShowScaled] = useState(false);
  const activeFeatures = result.featureNames.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 9 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Visualización e Interpretación de Centroides y Representantes
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Analiza el "centro geométrico o representativo" de cada cluster. Presentamos los valores des-escalados en sus unidades de negocio originales
          junto con el diferencial porcentual ($\Delta\%$) respecto a la media de la población global.
        </p>
      </div>

      {/* Mode toggle bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Modo de Visualización de Centroides
            </div>
            <div className="text-[11px] text-slate-500">
              Alterna entre la escala natural del negocio y los coeficientes z-score estandarizados.
            </div>
          </div>
        </div>

        <div className="inline-flex rounded-md shadow-xs">
          <button
            onClick={() => setShowScaled(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-l-md border ${
              !showScaled
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Escala Original de Negocio ($, Unidades, %)
          </button>
          <button
            onClick={() => setShowScaled(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-r-md border border-l-0 ${
              showScaled
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Escala Estandarizada (Z-Scores)
          </button>
        </div>
      </div>

      {/* Main Centroid Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Matriz Comparativa de Centroides por Segmento
          </div>
          <div className="text-xs text-slate-500">
            Valores destacados en <span className="text-emerald-600 font-bold">verde (+Δ)</span> superan la media; en <span className="text-rose-600 font-bold">rojo (-Δ)</span> están por debajo.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700">Segmento</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-center">Registros</th>
                {activeFeatures.map((f) => (
                  <th key={f} className="px-4 py-3 font-bold text-slate-700 text-right whitespace-nowrap">
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {result.centroids.map((c, idx) => {
                const profile = result.profiles[c.clusterId];

                return (
                  <tr key={c.clusterId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: profile?.color }} />
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-600 font-semibold">
                      {profile?.recordCount} ({profile?.percentage}%)
                    </td>

                    {activeFeatures.map((f) => {
                      const unscaledVal = c.unscaledValues[f];
                      const scaledVal = c.scaledValues[f];
                      const delta = c.deltasVsMeanPct[f];
                      const deltaColor = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400';
                      const deltaSign = delta > 0 ? '+' : '';

                      return (
                        <td key={f} className="px-4 py-3 text-right whitespace-nowrap font-mono">
                          {showScaled ? (
                            <div className="font-semibold text-slate-900">{scaledVal} σ</div>
                          ) : (
                            <div>
                              <div className="font-bold text-slate-900">{unscaledVal ?? '-'}</div>
                              {delta !== undefined && (
                                <div className={`text-[10px] font-semibold ${deltaColor}`}>
                                  {deltaSign}{delta}%
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discriminant Features Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Variables que Más Contribuyen a Distinguir Cada Segmento</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {result.profiles.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs"
              style={{ borderTop: `4px solid ${p.color}` }}
            >
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>{p.name}</span>
                <span className="text-[11px] font-mono text-slate-500">{p.percentage}%</span>
              </div>
              <p className="text-[11px] text-slate-500 italic line-clamp-2">{p.tagline}</p>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Desviaciones</div>
                {p.discriminantFeatures.slice(0, 3).map((df, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 truncate max-w-[130px] font-medium" title={df.feature}>
                      {df.feature}
                    </span>
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        df.diffPct > 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {df.diffPct > 0 ? '+' : ''}{df.diffPct}%
                    </span>
                  </div>
                ))}
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
          <span>Regresar a Resultados</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Continuar a Perfilamiento y Nombres Comerciales</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
