import React from 'react';
import {
  UploadCloud,
  Columns,
  ShieldAlert,
  Sparkles,
  BarChart2,
  TrendingUp,
  Cpu,
  ScatterChart,
  Target,
  Users,
  Briefcase,
  CheckCircle2,
  FileDown,
} from 'lucide-react';

export interface StageDefinition {
  id: number;
  title: string;
  shortTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const STAGES: StageDefinition[] = [
  { id: 1, title: 'Carga de Datos & Sector', shortTitle: '1. Carga & Sector', icon: UploadCloud, description: 'Formatos CSV, TXT, Excel y sector económico' },
  { id: 2, title: 'Clasificación de Variables', shortTitle: '2. Variables', icon: Columns, description: 'Tipado e inferencia de columnas' },
  { id: 3, title: 'Diagnóstico de Calidad', shortTitle: '3. Calidad', icon: ShieldAlert, description: 'Detección de nulos, duplicados y atípicos' },
  { id: 4, title: 'Limpieza e Imputación', shortTitle: '4. Limpieza', icon: Sparkles, description: 'Imputación, IQR y bitácora de cambios' },
  { id: 5, title: 'Análisis Exploratorio (EDA)', shortTitle: '5. EDA', icon: BarChart2, description: 'Estadísticas, correlaciones y reglas' },
  { id: 6, title: 'Selección de K Óptimo', shortTitle: '6. K Óptimo', icon: TrendingUp, description: 'Método del codo, silueta y negocio' },
  { id: 7, title: 'Configuración de Modelo', shortTitle: '7. Modelo', icon: Cpu, description: 'K-Means, Jerárquico, DBSCAN y distancias' },
  { id: 8, title: 'Resultados del Clustering', shortTitle: '8. Resultados', icon: ScatterChart, description: 'Proyección PCA y partición de grupos' },
  { id: 9, title: 'Interpretación de Centroides', shortTitle: '9. Centroides', icon: Target, description: 'Centroides y diferencias vs población' },
  { id: 10, title: 'Perfilamiento Sectorial', shortTitle: '10. Perfiles', icon: Users, description: 'Nombres comerciales y comportamientos' },
  { id: 11, title: 'Estrategias de Negocio (5D)', shortTitle: '11. Estrategia 5D', icon: Briefcase, description: 'Producto, precio, innovación, comunicación y rentabilidad' },
  { id: 12, title: 'Evaluación & Validación', shortTitle: '12. Validación', icon: CheckCircle2, description: 'Cohesión, balance y chequeo de estabilidad' },
  { id: 13, title: 'Informe Ejecutivo HTML', shortTitle: '13. Exportación', icon: FileDown, description: 'Informe interactivo autónomo descargable' },
];

interface StageNavProps {
  currentStage: number;
  maxReachedStage: number;
  onSelectStage: (stage: number) => void;
}

export const StageNav: React.FC<StageNavProps> = ({
  currentStage,
  maxReachedStage,
  onSelectStage,
}) => {
  return (
    <aside className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 shrink-0 flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      {/* Progress header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>Progreso del Flujo</span>
          <span className="text-indigo-600">Etapa {currentStage} de 13</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(Math.max(currentStage, maxReachedStage) / 13) * 100}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <nav className="p-2 space-y-1 flex-1">
        {STAGES.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === currentStage;
          const isCompleted = s.id < currentStage;
          const isUnlocked = s.id <= Math.max(currentStage, maxReachedStage);

          return (
            <button
              key={s.id}
              onClick={() => isUnlocked && onSelectStage(s.id)}
              disabled={!isUnlocked}
              className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-indigo-50/80 text-indigo-900 font-semibold ring-1 ring-indigo-200'
                  : isUnlocked
                  ? 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : isUnlocked
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : s.id}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
                  <span className={isActive ? 'text-indigo-950 font-bold' : ''}>
                    {s.title}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {s.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Helper footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
        💡 <span className="font-semibold text-slate-700">Trazabilidad garantizada:</span> Datos originales preservados y auditados en cada transformación.
      </div>
    </aside>
  );
};
