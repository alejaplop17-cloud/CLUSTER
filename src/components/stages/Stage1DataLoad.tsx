import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Building2,
  Table as TableIcon,
  Layers,
} from 'lucide-react';
import { SectorType } from '../../types/data';
import { SAMPLE_DATASETS, SampleDatasetInfo } from '../../services/sampleDatasets';
import { parseFile, detectDelimiter } from '../../services/dataParser';

interface Stage1DataLoadProps {
  data: Record<string, any>[] | null;
  fileName: string | null;
  fileSize: number;
  sector: SectorType;
  customSectorName: string;
  onDataLoaded: (data: Record<string, any>[], fileName: string, fileSize: number) => void;
  onSectorChange: (sector: SectorType, customName?: string) => void;
  onNext: () => void;
}

const SECTOR_OPTIONS: { id: SectorType; name: string; description: string }[] = [
  { id: 'retail', name: 'Comercio y retail', description: 'E-commerce, tiendas físicas, patrones de compra y canastas' },
  { id: 'telecom', name: 'Telecomunicaciones', description: 'Móviles, fibra óptica, consumo de datos y riesgo de fuga' },
  { id: 'finance', name: 'Servicios financieros', description: 'Banca, créditos, inversiones, riesgo crediticio y transaccional' },
  { id: 'logistics', name: 'Transporte y logística', description: 'Flotas, rutas de entrega, tiempos de ciclo y siniestralidad' },
  { id: 'health', name: 'Salud', description: 'Pacientes, estancias hospitalarias, adherencia y costos clínicos' },
  { id: 'manufacturing', name: 'Manufactura', description: 'Líneas de producción, rotación de referencias y calidad' },
  { id: 'gastronomy', name: 'Gastronomía y restaurantes', description: 'Comandas, horarios de alta afluencia y fidelidad de comensales' },
  { id: 'tech', name: 'Tecnología', description: 'Usuarios SaaS, adopción de features y engagement digital' },
  { id: 'energy', name: 'Energía y movilidad eléctrica', description: 'Consumo por tramos horarios, recarga de flotas y picos de potencia' },
  { id: 'other', name: 'Otro sector (especificar)', description: 'Contexto empresarial personalizado por el analista' },
];

export const Stage1DataLoad: React.FC<Stage1DataLoadProps> = ({
  data,
  fileName,
  fileSize,
  sector,
  customSectorName,
  onDataLoaded,
  onSectorChange,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRowsCount, setPreviewRowsCount] = useState<number>(5);
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File, sheetName?: string) => {
    setLoading(true);
    setError(null);
    setLastUploadedFile(file);

    try {
      const res = await parseFile(file, sheetName);
      if (res.error) {
        setError(res.error);
      } else if (res.data.length === 0) {
        setError('El archivo no contiene filas válidas o está vacío.');
      } else {
        if (res.sheets && res.sheets.length > 1) {
          setDetectedSheets(res.sheets);
          setSelectedSheet(res.selectedSheet || res.sheets[0]);
        } else {
          setDetectedSheets([]);
        }
        onDataLoaded(res.data, res.fileName, res.fileSize);
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (lastUploadedFile) {
      handleFileUpload(lastUploadedFile, sheet);
    }
  };

  const handleLoadSample = (sample: SampleDatasetInfo) => {
    onSectorChange(sample.sector);
    onDataLoaded(sample.data, `${sample.id}.csv (Demostración)`, 28400);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 1 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Carga de Datos y Selección del Sector Económico
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Carga un archivo local en formato CSV, TXT, XLS o XLSX, o selecciona uno de nuestros conjuntos de datos
          empresariales de demostración. El sector seleccionado contextualizará la interpretación de los segmentos y la generación de estrategias de negocio.
        </p>
      </div>

      {/* Grid: Upload & Sector Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload & Samples (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all rounded-xl p-6 text-center cursor-pointer bg-white"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt,.xls,.xlsx"
              className="hidden"
            />
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">
              Haz clic para cargar o arrastra tu archivo aquí
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Soporta <strong>CSV</strong>, <strong>TXT</strong> (delimitador autodetectado), <strong>XLS</strong> y <strong>XLSX</strong>
            </p>
            {loading && (
              <div className="mt-3 text-xs text-indigo-600 font-semibold animate-pulse">
                Procesando e indexando estructura del archivo...
              </div>
            )}
          </div>

          {/* Excel Sheet selector if multiple */}
          {detectedSheets.length > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Libro Excel con múltiples hojas detectadas:</span>
              </div>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="text-xs bg-white border border-amber-300 rounded-md px-2 py-1 text-slate-800 font-semibold focus:ring-1 focus:ring-amber-500"
              >
                {detectedSheets.map((s) => (
                  <option key={s} value={s}>Hoja: {s}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3.5 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Error al cargar datos:</strong> {error}
              </div>
            </div>
          )}

          {/* 1-Click Demo Datasets */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>O prueba datasets reales preconfigurados</span>
              </div>
              <span className="text-[11px] text-slate-400">1 clic para cargar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SAMPLE_DATASETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group cursor-pointer bg-slate-50/50"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 flex items-center justify-between">
                    <span>{sample.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                      {sample.rowCount} filas
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {sample.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sector Selection & Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Sector Económico del Negocio
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Este sector orientará los algoritmos para asignar nombres intuitivos a los clusters y generar estrategias comerciales de producto, precio, innovación, comunicación y rentabilidad.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Selecciona la industria principal:
              </label>
              <select
                value={sector}
                onChange={(e) => onSectorChange(e.target.value as SectorType)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {SECTOR_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {sector === 'other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Especificar sector económico:
                </label>
                <input
                  type="text"
                  value={customSectorName}
                  onChange={(e) => onSectorChange('other', e.target.value)}
                  placeholder="Ej. Inmobiliaria & Bienes Raíces, Agronegocios..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Selected Sector Context Card */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-xs">
              <div className="font-semibold text-indigo-950 mb-0.5">
                Impacto en la Segmentación:
              </div>
              <div className="text-indigo-800 text-[11px] leading-relaxed">
                {SECTOR_OPTIONS.find((s) => s.id === sector)?.description}
              </div>
            </div>

            {/* Dataset Loaded Quick Stats */}
            {data && data.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Resumen de Carga
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Filas</div>
                    <div className="text-sm font-bold text-slate-900">{data.length}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Columnas</div>
                    <div className="text-sm font-bold text-slate-900">{Object.keys(data[0] || {}).length}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase">Tamaño</div>
                    <div className="text-sm font-bold text-slate-900">{formatFileSize(fileSize)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Preview Table: First Rows */}
      {data && data.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Vista Previa del Conjunto de Datos (<code className="font-mono text-indigo-600 text-xs">head({previewRowsCount})</code>)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Mostrar:</span>
              <div className="inline-flex rounded-md shadow-xs">
                {[5, 10, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPreviewRowsCount(count)}
                    className={`px-2.5 py-1 text-xs font-medium border first:rounded-l-md last:rounded-r-md ${
                      previewRowsCount === count
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-bold text-slate-600 w-12 text-center">#</th>
                  {Object.keys(data[0]).map((col) => (
                    <th key={col} className="px-3 py-2 font-bold text-slate-700 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.slice(0, previewRowsCount).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 text-slate-400 font-mono text-center">{idx + 1}</td>
                    {Object.keys(data[0]).map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined || val === '';
                      return (
                        <td key={col} className="px-3 py-2 whitespace-nowrap text-slate-800">
                          {isNull ? (
                            <span className="text-rose-500 font-mono italic text-[11px]">null</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action to proceed to Stage 2 */}
          <div className="pt-3 flex justify-end">
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <span>Confirmar Datos y Pasar a Clasificación de Variables</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
