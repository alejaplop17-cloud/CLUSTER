import React from 'react';
import { Sparkles, FileText, Code, RefreshCw, BarChart3, Database } from 'lucide-react';
import { SectorType } from '../types/data';

interface HeaderProps {
  currentStage: number;
  sector: SectorType;
  fileName: string | null;
  rowCount: number;
  onReset: () => void;
  onOpenPythonModal: () => void;
  onOpenDocumentationModal: () => void;
}

const SECTOR_NAMES: Record<SectorType, string> = {
  retail: 'Comercio y Retail',
  telecom: 'Telecomunicaciones',
  finance: 'Servicios Financieros',
  logistics: 'Transporte y Logística',
  health: 'Salud',
  manufacturing: 'Manufactura',
  gastronomy: 'Gastronomía y Restaurantes',
  tech: 'Tecnología',
  energy: 'Energía y Movilidad Eléctrica',
  other: 'Sector Personalizado',
};

export const Header: React.FC<HeaderProps> = ({
  currentStage,
  sector,
  fileName,
  rowCount,
  onReset,
  onOpenPythonModal,
  onOpenDocumentationModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Plataforma de Clustering & Segmentación
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                Data Science Suite
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Análisis de calidad · Algoritmos no supervisados · Estrategia comercial sectorial
            </p>
          </div>
        </div>

        {/* Status context & Actions */}
        <div className="flex items-center gap-3">
          {fileName && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">{fileName}</span>
              <span className="text-slate-400">·</span>
              <span>{rowCount} registros</span>
              <span className="text-slate-400">·</span>
              <span className="text-indigo-600 font-medium">{SECTOR_NAMES[sector]}</span>
            </div>
          )}

          {/* Python & Docs buttons */}
          <button
            onClick={onOpenPythonModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Ver código fuente Python (Streamlit, Scikit-learn) y requirements.txt"
          >
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Código Python</span>
          </button>

          <button
            onClick={onOpenDocumentationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Guía de instalación y validación metodológica"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Guía & Documentación</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Reiniciar análisis y cargar nuevo archivo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
