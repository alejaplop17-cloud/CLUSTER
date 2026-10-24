import React from 'react';
import { ColumnMetadata, VariableType, AnalysisRecommendation } from '../../types/data';
import { Columns, Check, X, AlertTriangle, ArrowRight, ArrowLeft, Info, HelpCircle } from 'lucide-react';

interface Stage2VariablesProps {
  columns: ColumnMetadata[];
  onUpdateColumn: (name: string, updates: Partial<ColumnMetadata>) => void;
  onNext: () => void;
  onBack: () => void;
}

const VARIABLE_TYPE_OPTIONS: { value: VariableType; label: string; group: ColumnMetadata['analysisType'] }[] = [
  { value: 'numeric_continuous', label: 'Numérica Continua', group: 'numeric' },
  { value: 'numeric_discrete', label: 'Numérica Discreta (Conteo)', group: 'numeric' },
  { value: 'categorical_nominal', label: 'Categórica Nominal', group: 'categorical' },
  { value: 'categorical_ordinal', label: 'Categórica Ordinal', group: 'categorical' },
  { value: 'boolean', label: 'Booleana (Binaria 0/1)', group: 'categorical' },
  { value: 'datetime', label: 'Fecha y Hora (Temporal)', group: 'temporal' },
  { value: 'identifier', label: 'Identificador (ID / Clave)', group: 'identifier' },
  { value: 'text_free', label: 'Texto Libre No Estructurado', group: 'text' },
];

export const Stage2Variables: React.FC<Stage2VariablesProps> = ({
  columns,
  onUpdateColumn,
  onNext,
  onBack,
}) => {
  const activeCount = columns.filter(c => c.includeInClustering).length;

  const handleTypeChange = (colName: string, newType: VariableType) => {
    const colOpt = VARIABLE_TYPE_OPTIONS.find(o => o.value === newType);
    const analysisType = colOpt?.group || 'numeric';
    
    // Auto adjust recommendation and inclusion if switched to identifier
    const isId = newType === 'identifier';
    const recommendation: AnalysisRecommendation = isId ? 'exclude' : 'include';
    const includeInClustering = !isId;

    onUpdateColumn(colName, {
      selectedType: newType,
      analysisType,
      recommendation,
      includeInClustering,
    });
  };

  const getRecommendationBadge = (rec: AnalysisRecommendation) => {
    switch (rec) {
      case 'include':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">Incluir</span>;
      case 'transform':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">Transformar</span>;
      case 'exclude':
        return <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-rose-200">Excluir</span>;
      case 'review':
        return <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-purple-200">Revisar</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 2 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Identificación y Clasificación de Variables
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          El sistema ha inferido automáticamente el tipo de variable y su aptitud para clustering.
          Verifica la clasificación, excluye identificadores o variables redundantes, y define cuáles participarán activamente en la segmentación.
        </p>
      </div>

      {/* Methodological Alert about Identifiers */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <strong className="font-bold">Regla metodológica fundamental de clustering:</strong>
          <p className="leading-relaxed text-amber-900">
            Los identificadores únicos (como <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">Cliente_ID</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">DNI</code> o <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">Despacho_ID</code>)
            deben <strong>excluirse</strong> de las distancias euclidianas. Incluir un ID distorsiona el espacio geométrico y produce agrupaciones espurias.
            El sistema los ha desmarcado automáticamente para tu seguridad.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Variables</div>
          <div className="text-lg font-bold text-slate-900">{columns.length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Activas en Clustering</div>
          <div className="text-lg font-bold text-indigo-600">{activeCount}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Numéricas</div>
          <div className="text-lg font-bold text-slate-900">
            {columns.filter(c => c.analysisType === 'numeric').length}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Excluidas / IDs</div>
          <div className="text-lg font-bold text-rose-600">
            {columns.length - activeCount}
          </div>
        </div>
      </div>

      {/* Interactive Variables Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Columns className="w-4 h-4 text-slate-500" />
            <span>Matriz de Diagnóstico de Columnas</span>
          </div>
          <div className="text-xs text-slate-500">
            {activeCount === 0 ? (
              <span className="text-rose-600 font-bold">⚠️ Debes seleccionar al menos 1 variable para continuar</span>
            ) : (
              <span>{activeCount} variables seleccionadas para el modelo</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-600 w-12 text-center">Usar</th>
                <th className="px-4 py-3 font-bold text-slate-700">Nombre de la Variable</th>
                <th className="px-4 py-3 font-bold text-slate-700">Tipo Asignado</th>
                <th className="px-4 py-3 font-bold text-slate-700">Valores Únicos</th>
                <th className="px-4 py-3 font-bold text-slate-700">Nulos (%)</th>
                <th className="px-4 py-3 font-bold text-slate-700">Recomendación</th>
                <th className="px-4 py-3 font-bold text-slate-700">Muestra de Valores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {columns.map((col) => {
                const isSelected = col.includeInClustering;
                return (
                  <tr
                    key={col.name}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-indigo-50/15' : 'bg-slate-50/40 text-slate-400'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={col.includeInClustering}
                        onChange={(e) => onUpdateColumn(col.name, { includeInClustering: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Variable Name */}
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono text-[11px]">
                      {col.name}
                    </td>

                    {/* Type Selector */}
                    <td className="px-4 py-3">
                      <select
                        value={col.selectedType}
                        onChange={(e) => handleTypeChange(col.name, e.target.value as VariableType)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        {VARIABLE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Unique values */}
                    <td className="px-4 py-3 text-slate-700 font-mono">
                      {col.uniqueValues.toLocaleString()}
                    </td>

                    {/* Nulls */}
                    <td className="px-4 py-3 font-mono">
                      <span className={col.nullPercentage > 20 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {col.nullPercentage}%
                      </span>
                    </td>

                    {/* Recommendation */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div>{getRecommendationBadge(col.recommendation)}</div>
                        <div className="text-[10px] text-slate-500 max-w-xs truncate" title={col.recommendationReason}>
                          {col.recommendationReason}
                        </div>
                      </div>
                    </td>

                    {/* Sample values */}
                    <td className="px-4 py-3 text-[11px] text-slate-500 font-mono max-w-xs truncate">
                      {col.sampleValues.slice(0, 3).map(v => String(v ?? 'null')).join(', ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a Carga de Datos</span>
        </button>

        <button
          onClick={onNext}
          disabled={activeCount === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Continuar a Diagnóstico de Calidad</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
