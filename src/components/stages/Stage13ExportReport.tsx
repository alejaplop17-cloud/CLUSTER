import React, { useState } from 'react';
import {
  ClusteringExecutionResult,
  ClusteringModelConfig,
  ColumnMetadata,
  DataQualityReport,
  OptimalKMetric,
  TransformationLog,
} from '../../types/data';
import { generateHTMLReport, ReportConfig } from '../../services/htmlReportGenerator';
import {
  FileDown,
  FileSpreadsheet,
  Download,
  Eye,
  ShieldAlert,
  Share2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface Stage13ExportReportProps {
  qualityReport: DataQualityReport;
  columns: ColumnMetadata[];
  logs: TransformationLog[];
  optimalKData: { metrics: OptimalKMetric[]; recommendedK: number; rationale: string };
  modelConfig: ClusteringModelConfig;
  result: ClusteringExecutionResult;
  sectorName: string;
  datasetName: string;
  originalData: Record<string, any>[];
  onBack: () => void;
}

export const Stage13ExportReport: React.FC<Stage13ExportReportProps> = ({
  qualityReport,
  columns,
  logs,
  optimalKData,
  modelConfig,
  result,
  sectorName,
  datasetName,
  originalData,
  onBack,
}) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportTitle: `Informe Ejecutivo de Segmentación y Estrategia - ${sectorName}`,
    analystName: 'Equipo de Ciencia de Datos & Analítica',
    organization: 'Dirección de Inteligencia de Negocios',
    sectorName,
    datasetName,
    includeTechnicalAppendix: true,
    notes: 'Análisis ejecutado con modelos no supervisados para fundamentar decisiones comerciales.',
  });

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleGenerateHTML = () => {
    return generateHTMLReport(
      reportConfig,
      qualityReport,
      columns,
      logs,
      optimalKData,
      modelConfig,
      result
    );
  };

  const handleDownloadHTML = () => {
    const htmlContent = handleGenerateHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Informe_Segmentacion_${sectorName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!originalData || originalData.length === 0) return;
    const enriched = originalData.map((row, idx) => {
      const clusterId = result.labels[idx] ?? 0;
      const profile = result.profiles[clusterId];
      return {
        ...row,
        Segmento_ID: clusterId + 1,
        Nombre_Segmento: profile?.name || `Segmento ${clusterId + 1}`,
      };
    });

    const headers = Object.keys(enriched[0]);
    const csvRows = [
      headers.join(','),
      ...enriched.map((r: Record<string, any>) =>
        headers
          .map(h => {
            const val = r[h];
            const str = val === null || val === undefined ? '' : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataset_segmentado_${sectorName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 13 de 13 (Final)
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Exportación y Distribución del Informe Ejecutivo HTML
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Genera un informe completo, interactivo y autónomo en formato HTML sin dependencias de servidor.
          Puedes abrirlo en cualquier navegador web, guardarlo como PDF o compartirlo con los comités de dirección y marketing.
        </p>
      </div>

      {/* Main Grid: Form & Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Metadata Configuration (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-indigo-600" />
            <span>Configuración de la Portada del Informe</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Título Principal del Informe:</label>
              <input
                type="text"
                value={reportConfig.reportTitle}
                onChange={(e) => setReportConfig({ ...reportConfig, reportTitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Científico / Analista Responsable:</label>
                <input
                  type="text"
                  value={reportConfig.analystName}
                  onChange={(e) => setReportConfig({ ...reportConfig, analystName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organización / Unidad de Negocio:</label>
                <input
                  type="text"
                  value={reportConfig.organization}
                  onChange={(e) => setReportConfig({ ...reportConfig, organization: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notas Ejecutivas / Mensaje Inicial:</label>
              <textarea
                rows={2}
                value={reportConfig.notes}
                onChange={(e) => setReportConfig({ ...reportConfig, notes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:bg-white"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={reportConfig.includeTechnicalAppendix}
                  onChange={(e) => setReportConfig({ ...reportConfig, includeTechnicalAppendix: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Incluir anexo técnico de parámetros y trazabilidad matemática</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Download Actions Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-indigo-900 text-white rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Descargas y Distribución</span>
            </h3>

            <p className="text-xs text-indigo-100 leading-relaxed">
              El archivo HTML descargado contiene todos los estilos, tablas interactivas, métricas y centroides embebidos. Funciona 100% offline sin necesidad de servidores.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleDownloadHTML}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-indigo-900 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-indigo-600" />
                <span>Descargar Informe Ejecutivo HTML</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="w-full py-2.5 px-4 bg-indigo-800/80 hover:bg-indigo-800 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 border border-indigo-700 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Descargar Base de Datos con Clusters (CSV)</span>
              </button>

              <button
                onClick={() => setPreviewHtml(previewHtml ? null : handleGenerateHTML())}
                className="w-full py-2 px-4 bg-transparent hover:bg-white/10 text-indigo-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{previewHtml ? 'Ocultar Vista Previa del HTML' : 'Previsualizar Informe en Pantalla'}</span>
              </button>
            </div>
          </div>

          {/* Privacy & Hosting Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold">Privacidad y Seguridad de Datos:</strong>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Descargar el informe HTML genera un archivo local privado en tu equipo; <strong>no se publica en Internet</strong>.
                Para distribuirlo a otros miembros de tu organización, puedes adjuntarlo por correo electrónico institucional o alojarlo en un repositorio seguro (ej. SharePoint, Google Drive, AWS S3 privado o servidor corporativo).
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Live Preview if toggled */}
      {previewHtml && (
        <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-lg space-y-2">
          <div className="p-3 bg-slate-800 text-white text-xs font-bold flex items-center justify-between">
            <span>Previsualización Interactiva del Informe HTML</span>
            <button
              onClick={() => setPreviewHtml(null)}
              className="text-xs text-slate-300 hover:text-white"
            >
              Cerrar ×
            </button>
          </div>
          <iframe
            title="Preview Informe HTML"
            srcDoc={previewHtml}
            className="w-full h-[650px] border-none"
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a Evaluación</span>
        </button>

        <button
          onClick={handleDownloadHTML}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Descargar Informe Final (HTML Autónomo)</span>
        </button>
      </div>
    </div>
  );
};
