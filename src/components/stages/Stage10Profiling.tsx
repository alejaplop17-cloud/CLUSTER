import React, { useState } from 'react';
import { ClusterProfile, SectorType } from '../../types/data';
import { Users, Edit3, Check, ArrowRight, ArrowLeft, Lightbulb, AlertTriangle, Sparkles } from 'lucide-react';

interface Stage10ProfilingProps {
  profiles: ClusterProfile[];
  sector: SectorType;
  onUpdateProfile: (clusterId: number, updates: Partial<ClusterProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Stage10Profiling: React.FC<Stage10ProfilingProps> = ({
  profiles,
  sector,
  onUpdateProfile,
  onNext,
  onBack,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 10 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Perfilamiento y Asignación de Nombres Comerciales
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Traduce los clusters matemáticos en arquetipos de negocio comprensibles y accionables para los equipos directivos,
          ventas y marketing. Puedes personalizar libremente los nombres, comportamientos y oportunidades identificadas.
        </p>
      </div>

      {/* Profiles list */}
      <div className="space-y-5">
        {profiles.map((p) => {
          const isEditing = editingId === p.id;

          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all"
              style={{ borderLeft: `6px solid ${p.color}` }}
            >
              <div className="p-5 space-y-4">
                
                {/* Header with Title and Volume */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: p.color }}>
                        Segmento {p.id + 1}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-medium">Sector {sector}</span>
                    </div>

                    {isEditing ? (
                      <div className="mt-1 space-y-2">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => onUpdateProfile(p.id, { name: e.target.value })}
                          className="w-full text-base font-bold text-slate-900 border border-indigo-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={p.tagline}
                          onChange={(e) => onUpdateProfile(p.id, { tagline: e.target.value })}
                          placeholder="Subtítulo o lema comercial..."
                          className="w-full text-xs text-slate-600 border border-slate-300 rounded px-2 py-1"
                        />
                      </div>
                    ) : (
                      <div className="mt-1">
                        <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                        <p className="text-xs text-slate-500 italic mt-0.5">"{p.tagline}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <div className="text-sm font-bold text-slate-900">
                        {p.recordCount} <span className="text-xs font-normal text-slate-500">({p.percentage}%)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Participación</div>
                    </div>

                    <button
                      onClick={() => setEditingId(isEditing ? null : p.id)}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 ${
                        isEditing
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Guardar</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4 text-slate-500" />
                          <span>Editar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Behavioral Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Left: Behaviors & Needs */}
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Comportamientos Predominantes</span>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={p.predominantBehaviors}
                          onChange={(e) => onUpdateProfile(p.id, { predominantBehaviors: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1.5 bg-white"
                        />
                      ) : (
                        <p className="text-slate-600 leading-relaxed">{p.predominantBehaviors}</p>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>Necesidades Específicas Sustentadas</span>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={p.probableNeeds}
                          onChange={(e) => onUpdateProfile(p.id, { probableNeeds: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1.5 bg-white"
                        />
                      ) : (
                        <p className="text-slate-600 leading-relaxed">{p.probableNeeds}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Opportunities & Risks */}
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Oportunidades Comerciales Clave</span>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={p.businessOpportunities}
                          onChange={(e) => onUpdateProfile(p.id, { businessOpportunities: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1.5 bg-white"
                        />
                      ) : (
                        <p className="text-slate-600 leading-relaxed">{p.businessOpportunities}</p>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Riesgos Operativos y Límites de Interpretación</span>
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={p.risksAndLimitations}
                          onChange={(e) => onUpdateProfile(p.id, { risksAndLimitations: e.target.value })}
                          className="w-full text-xs border border-indigo-300 rounded p-1.5 bg-white"
                        />
                      ) : (
                        <p className="text-slate-600 leading-relaxed">{p.risksAndLimitations}</p>
                      )}
                    </div>
                  </div>

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
          <span>Regresar a Centroides</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Continuar a Estrategias de Negocio (5D)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
