import React, { useState } from 'react';
import { ClusterDimensionStrategy, ClusterProfile } from '../../types/data';
import {
  Briefcase,
  Package,
  DollarSign,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Edit3,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Target,
} from 'lucide-react';

interface Stage11BusinessStrategyProps {
  profiles: ClusterProfile[];
  onUpdateStrategy: (
    clusterId: number,
    dimension: 'product' | 'price' | 'innovation' | 'communication' | 'profitability',
    updates: Partial<ClusterDimensionStrategy>
  ) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Stage11BusinessStrategy: React.FC<Stage11BusinessStrategyProps> = ({
  profiles,
  onUpdateStrategy,
  onNext,
  onBack,
}) => {
  const [selectedClusterIndex, setSelectedClusterIndex] = useState(0);
  const [editingDimension, setEditingDimension] = useState<string | null>(null);

  const currentProfile = profiles[selectedClusterIndex] || profiles[0];
  const strategies = currentProfile?.strategies;

  const DIMENSIONS = [
    { key: 'product', title: 'A. Estrategia de Producto', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'price', title: 'B. Estrategia de Precio', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'innovation', title: 'C. Estrategia de Innovación', icon: Lightbulb, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { key: 'communication', title: 'D. Estrategia de Comunicación', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: 'profitability', title: 'E. Estrategia de Rentabilidad', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 11 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Generación de Estrategias de Negocio Multidimensionales
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Estructura táctica en 5 dimensiones estratégicas para cada segmento.
          Cada recomendación incluye su justificación estadística, objetivo operativo, KPI cuantificable y análisis de riesgos.
        </p>
      </div>

      {/* Cluster Tab Selector */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-xl">
        {profiles.map((p, idx) => {
          const isSelected = selectedClusterIndex === idx;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedClusterIndex(idx);
                setEditingDimension(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span>{p.name}</span>
              <span className="text-[11px] font-normal text-slate-400 font-mono">({p.percentage}%)</span>
            </button>
          );
        })}
      </div>

      {/* Selected Segment Banner */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ borderLeft: `6px solid ${currentProfile.color}` }}
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Segmento Activo #{currentProfile.id + 1}</span>
            <span>·</span>
            <span>{currentProfile.recordCount} registros ({currentProfile.percentage}% de la base)</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">{currentProfile.name}</h3>
          <p className="text-xs text-slate-500 italic mt-0.5">"{currentProfile.tagline}"</p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 max-w-sm">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-0.5">
            Diferenciación Metodológica
          </div>
          Las tácticas se fundamentan en las diferencias relativas de los centroides frente a la población global.
        </div>
      </div>

      {/* The 5 Strategic Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          const strat = strategies[dim.key];
          const isEditing = editingDimension === dim.key;

          return (
            <div
              key={dim.key}
              className={`bg-white border rounded-xl p-5 shadow-xs space-y-3 transition-all ${
                isEditing ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${dim.bg} ${dim.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{dim.title}</h4>
                    <div className="text-[11px] text-slate-500 font-semibold">{strat.title}</div>
                  </div>
                </div>

                <button
                  onClick={() => setEditingDimension(isEditing ? null : dim.key)}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Listo</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Main Recommendation */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Recomendación Estratégica Principal
                </div>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={strat.mainRecommendation}
                    onChange={(e) => onUpdateStrategy(currentProfile.id, dim.key, { mainRecommendation: e.target.value })}
                    className="w-full text-xs border border-indigo-300 rounded p-2 text-slate-800"
                  />
                ) : (
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {strat.mainRecommendation}
                  </p>
                )}
              </div>

              {/* Tactics */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tácticas Operativas Sugeridas
                </div>
                <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                  {strat.keyTactics.map((tac, i) => (
                    <li key={i}>{tac}</li>
                  ))}
                </ul>
              </div>

              {/* KPI Box */}
              <div className={`p-2.5 rounded-lg ${dim.bg} ${dim.border} border flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Target className={`w-3.5 h-3.5 ${dim.color}`} />
                  <span className="text-[11px] font-bold text-slate-800 uppercase">Indicador Clave (KPI):</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={strat.kpi}
                    onChange={(e) => onUpdateStrategy(currentProfile.id, dim.key, { kpi: e.target.value })}
                    className="text-xs border border-indigo-300 rounded px-2 py-0.5 bg-white text-slate-800 font-semibold max-w-[200px]"
                  />
                ) : (
                  <span className={`text-xs font-bold ${dim.color}`}>{strat.kpi}</span>
                )}
              </div>

              {/* Rationale and Risks */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="text-slate-500">
                  <strong className="text-slate-700">Evidencia de datos:</strong> {strat.dataBackedRationale}
                </div>
                <div className="text-slate-500">
                  <strong className="text-slate-700">Riesgo / Control:</strong> {strat.potentialRisks}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a Perfilamiento</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Continuar a Evaluación y Validación</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
