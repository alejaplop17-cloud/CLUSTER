import React, { useState } from 'react';
import { CleaningOptions, ColumnMetadata, TransformationLog } from '../../types/data';
import { Sparkles, History, Undo2, CheckCircle, ArrowRight, ArrowLeft, Filter, AlertCircle } from 'lucide-react';

interface Stage4CleaningProps {
  columns: ColumnMetadata[];
  originalRowCount: number;
  cleanedRowCount: number;
  options: CleaningOptions;
  logs: TransformationLog[];
  imputedCount: number;
  modifiedCount: number;
  removedCount: number;
  onOptionsChange: (newOptions: Partial<CleaningOptions>) => void;
  onApplyCleaning: () => void;
  onResetCleaning: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const Stage4Cleaning: React.FC<Stage4CleaningProps> = ({
  columns,
  originalRowCount,
  cleanedRowCount,
  options,
  logs,
  imputedCount,
  modifiedCount,
  removedCount,
  onOptionsChange,
  onApplyCleaning,
  onResetCleaning,
  onNext,
  onBack,
}) => {
  const [selectedColToDrop, setSelectedColToDrop] = useState<string>('');

  const handleAddDropCol = (colName: string) => {
    if (colName && !options.removeColumns.includes(colName)) {
      onOptionsChange({ removeColumns: [...options.removeColumns, colName] });
    }
    setSelectedColToDrop('');
  };

  const handleRemoveDropCol = (colName: string) => {
    onOptionsChange({ removeColumns: options.removeColumns.filter(c => c !== colName) });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 4 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Limpieza, Imputación y Transformación Trazable
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Configura las estrategias de imputación para variables numéricas y categóricas, tratamiento de valores atípicos mediante IQR y depuración de duplicados.
          Todos los cambios se auditan en la bitácora conservando una copia intacta de los datos originales.
        </p>
      </div>

      {/* KPI changes banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Filas Actuales</div>
          <div className="text-xl font-bold text-slate-900">
            {cleanedRowCount.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1">/ {originalRowCount}</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Valores Imputados</div>
          <div className="text-xl font-bold text-indigo-600">{imputedCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Filas Eliminadas</div>
          <div className="text-xl font-bold text-rose-600">{removedCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Atípicos Acotados</div>
          <div className="text-xl font-bold text-amber-600">{modifiedCount}</div>
        </div>
      </div>

      {/* Configuration Controls Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Estrategias de Preprocesamiento Configurables</span>
          </h3>
          <button
            onClick={onResetCleaning}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Restablecer Datos Originales</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
          
          {/* 1. Duplicates */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <label className="font-bold text-slate-800 block">1. Registros Duplicados</label>
            <p className="text-slate-500 text-[11px]">
              La presencia de filas idénticas sobrepondera regiones del espacio de distancias.
            </p>
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="dupes"
                  checked={options.removeDuplicates}
                  onChange={() => onOptionsChange({ removeDuplicates: true })}
                  className="text-indigo-600"
                />
                <span>Eliminar filas duplicadas exactas (Recomendado)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="dupes"
                  checked={!options.removeDuplicates}
                  onChange={() => onOptionsChange({ removeDuplicates: false })}
                  className="text-indigo-600"
                />
                <span>Conservar todos los registros</span>
              </label>
            </div>
          </div>

          {/* 2. Numeric Imputation */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <label className="font-bold text-slate-800 block">2. Imputación de Variables Numéricas</label>
            <p className="text-slate-500 text-[11px]">
              Los algoritmos de distancia requieren vectores continuos sin valores nulos.
            </p>
            <select
              value={options.numericImputation}
              onChange={(e) => onOptionsChange({ numericImputation: e.target.value as any })}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
            >
              <option value="median">Imputar con Mediana (Robusta ante sesgo)</option>
              <option value="mean">Imputar con Media Aritmética</option>
              <option value="zero">Rellenar con Cero (0)</option>
              <option value="none">No Imputar (Conservar nulos)</option>
            </select>
            <div className="text-[10px] text-slate-500 italic">
              *Nota: Los identificadores (IDs) nunca son imputados.
            </div>
          </div>

          {/* 3. Categorical Imputation */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <label className="font-bold text-slate-800 block">3. Imputación Categórica</label>
            <p className="text-slate-500 text-[11px]">
              Tratamiento para categorías ausentes antes de la codificación One-Hot.
            </p>
            <select
              value={options.categoricalImputation}
              onChange={(e) => onOptionsChange({ categoricalImputation: e.target.value as any })}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
            >
              <option value="mode">Imputar con la Moda (Categoría más frecuente)</option>
              <option value="unknown">Etiquetar explícitamente como "Desconocido"</option>
              <option value="none">No Imputar</option>
            </select>
          </div>

          {/* 4. Outliers Treatment */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <label className="font-bold text-slate-800 block">4. Tratamiento de Valores Atípicos</label>
            <p className="text-slate-500 text-[11px]">
              Evita que observaciones extremas desplacen artificialmente los centroides.
            </p>
            <select
              value={options.outlierTreatment}
              onChange={(e) => onOptionsChange({ outlierTreatment: e.target.value as any })}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
            >
              <option value="clip_iqr">Winsorización IQR (Acotar a 1.5 × IQR)</option>
              <option value="remove_iqr">Eliminar filas con valores extremos</option>
              <option value="none">Conservar atípicos sin modificar</option>
            </select>
          </div>

          {/* 5. Drop Columns */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 md:col-span-2">
            <label className="font-bold text-slate-800 block">5. Descartar Columnas Específicas</label>
            <div className="flex gap-2">
              <select
                value={selectedColToDrop}
                onChange={(e) => setSelectedColToDrop(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800"
              >
                <option value="">Seleccionar columna a eliminar...</option>
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.selectedType})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleAddDropCol(selectedColToDrop)}
                disabled={!selectedColToDrop}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded font-semibold cursor-pointer"
              >
                Eliminar
              </button>
            </div>

            {options.removeColumns.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {options.removeColumns.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-medium"
                  >
                    <span>{c}</span>
                    <button
                      onClick={() => handleRemoveDropCol(c)}
                      className="hover:text-rose-950 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Apply Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onApplyCleaning}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ejecutar Transformaciones y Actualizar Base</span>
          </button>
        </div>
      </div>

      {/* Bitácora de Transformaciones (Audit Log) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <History className="w-4 h-4 text-slate-500" />
          <span>Bitácora de Transformaciones y Trazabilidad Reproducible</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-xs italic text-center">
            No se han aplicado transformaciones manuales todavía. Presiona "Ejecutar Transformaciones" para limpiar la base.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-bold text-slate-600">Hora</th>
                  <th className="px-3 py-2 font-bold text-slate-700">Acción Ejecutada</th>
                  <th className="px-3 py-2 font-bold text-slate-700">Detalles de la Operación</th>
                  <th className="px-3 py-2 font-bold text-slate-700 text-right">Registros Afectados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{log.action}</td>
                    <td className="px-3 py-2 text-slate-700">{log.details}</td>
                    <td className="px-3 py-2 text-right font-mono text-indigo-600 font-bold">
                      {log.affectedCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a Diagnóstico</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Continuar a Análisis Exploratorio (EDA)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
