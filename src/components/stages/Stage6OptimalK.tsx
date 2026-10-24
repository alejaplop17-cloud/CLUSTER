import React, { useState } from 'react';
import { BusinessConstraints, OptimalKMetric } from '../../types/data';
import { TrendingUp, Award, Sliders, ArrowRight, ArrowLeft, Info, HelpCircle } from 'lucide-react';

interface Stage6OptimalKProps {
  optimalKData: { metrics: OptimalKMetric[]; recommendedK: number; rationale: string };
  selectedK: number;
  businessConstraints: BusinessConstraints;
  onUpdateConstraints: (updates: Partial<BusinessConstraints>) => void;
  onSelectK: (k: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Stage6OptimalK: React.FC<Stage6OptimalKProps> = ({
  optimalKData,
  selectedK,
  businessConstraints,
  onUpdateConstraints,
  onSelectK,
  onNext,
  onBack,
}) => {
  const { metrics, recommendedK, rationale } = optimalKData;

  // Chart coordinates
  const maxInertia = Math.max(...metrics.map(m => m.inertia), 1);
  const minInertia = Math.min(...metrics.map(m => m.inertia), 0);
  const maxSil = Math.max(...metrics.map(m => m.silhouette), 0.5);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 6 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Selección del Número Óptimo de Clusters (K)
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Combinamos tres métodos complementarios: el <strong>Método del Codo (Inercia)</strong>, el <strong>Coeficiente de Silueta</strong> y
          los <strong>Criterios de Operación Empresarial</strong> para determinar el número de segmentos más robusto y accionable.
        </p>
      </div>

      {/* Recommendation Banner */}
      <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Recomendación Metodológica Integrada
              </span>
              <span className="text-xs bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
                K = {recommendedK} Clusters
              </span>
            </div>
            <p className="text-xs text-indigo-950 mt-1 leading-relaxed max-w-2xl">
              {rationale}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => onSelectK(recommendedK)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Aplicar K = {recommendedK} Recomendado
          </button>
        </div>
      </div>

      {/* Two Interactive Visualizations: Elbow Curve & Silhouette Curve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Method A: Elbow Curve */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                A. Método del Codo (Inercia Intra-Cluster)
              </h3>
              <p className="text-[11px] text-slate-500">
                Busca el punto de inflexión donde añadir más clusters no reduce significativamente la varianza.
              </p>
            </div>
          </div>

          {/* SVG Plot for Elbow */}
          <div className="h-48 w-full bg-slate-50/70 rounded-lg p-3 border border-slate-200 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 font-mono text-right">Inercia (SSE)</div>
            
            <div className="relative flex-1 flex items-end justify-between px-4 pb-2 pt-4">
              {metrics.map((m, idx) => {
                const heightPct = Math.max(15, Math.min(95, ((m.inertia - minInertia) / (maxInertia - minInertia || 1)) * 80 + 15));
                const isSelected = m.k === selectedK;
                const isRec = m.k === recommendedK;

                return (
                  <div
                    key={m.k}
                    onClick={() => onSelectK(m.k)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="text-[10px] font-bold text-slate-600 mb-1 font-mono">
                      {Math.round(m.inertia)}
                    </div>
                    <div
                      className={`w-7 rounded-t transition-all ${
                        isSelected
                          ? 'bg-indigo-600 ring-2 ring-indigo-300'
                          : isRec
                          ? 'bg-indigo-400'
                          : 'bg-slate-300 group-hover:bg-slate-400'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className={`text-xs mt-1.5 font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>
                      K={m.k}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Method B: Silhouette Curve */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                B. Coeficiente de Silueta Media
              </h3>
              <p className="text-[11px] text-slate-500">
                Mide qué tan compacto es cada grupo frente a la distancia hacia su vecino más cercano [-1 a +1].
              </p>
            </div>
          </div>

          {/* SVG Plot for Silhouette */}
          <div className="h-48 w-full bg-slate-50/70 rounded-lg p-3 border border-slate-200 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 font-mono text-right">Silueta (Mayor es mejor)</div>
            
            <div className="relative flex-1 flex items-end justify-between px-4 pb-2 pt-4">
              {metrics.map((m) => {
                const heightPct = Math.max(15, Math.min(95, (m.silhouette / maxSil) * 85));
                const isSelected = m.k === selectedK;
                const isRec = m.k === recommendedK;

                return (
                  <div
                    key={m.k}
                    onClick={() => onSelectK(m.k)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="text-[10px] font-bold text-slate-600 mb-1 font-mono">
                      {m.silhouette.toFixed(2)}
                    </div>
                    <div
                      className={`w-7 rounded-t transition-all ${
                        isSelected
                          ? 'bg-emerald-600 ring-2 ring-emerald-300'
                          : isRec
                          ? 'bg-emerald-400'
                          : 'bg-slate-300 group-hover:bg-slate-400'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className={`text-xs mt-1.5 font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                      K={m.k}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Comparative Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Tabla Comparativa Multicriterio (Estadística vs Operación)
          </div>
          <div className="text-xs text-slate-500">
            K seleccionado actualmente: <strong className="text-indigo-600 text-sm font-extrabold">{selectedK}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 font-bold text-slate-700">K</th>
                <th className="px-4 py-2.5 font-bold text-slate-700">Inercia (SSE)</th>
                <th className="px-4 py-2.5 font-bold text-slate-700">Silueta Media</th>
                <th className="px-4 py-2.5 font-bold text-slate-700">Davies-Bouldin</th>
                <th className="px-4 py-2.5 font-bold text-slate-700">Distribución de Tamaños</th>
                <th className="px-4 py-2.5 font-bold text-slate-700">Interpretación Empresarial</th>
                <th className="px-4 py-2.5 font-bold text-slate-700 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {metrics.map((m) => {
                const isSelected = m.k === selectedK;
                const isRec = m.k === recommendedK;

                return (
                  <tr
                    key={m.k}
                    className={`hover:bg-slate-50 ${
                      isSelected ? 'bg-indigo-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono text-sm">
                      K = {m.k} {isRec && <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded ml-1">Óptimo</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{m.inertia.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">{m.silhouette.toFixed(3)}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{m.daviesBouldin.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                      {m.clusterSizes.join(' · ')}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{m.businessInterpretation}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onSelectK(m.k)}
                        className={`px-3 py-1 text-xs rounded font-bold cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Seleccionado' : 'Elegir'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a EDA</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Continuar a Configuración del Modelo (K = {selectedK})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
