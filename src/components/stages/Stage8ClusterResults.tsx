import React, { useState } from 'react';
import { ClusteringExecutionResult } from '../../types/data';
import { ScatterChart, Layers, Download, Search, ArrowRight, ArrowLeft, Info } from 'lucide-react';

interface Stage8ClusterResultsProps {
  result: ClusteringExecutionResult;
  data: Record<string, any>[];
  onNext: () => void;
  onBack: () => void;
}

export const Stage8ClusterResults: React.FC<Stage8ClusterResultsProps> = ({
  result,
  data,
  onNext,
  onBack,
}) => {
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Filtered dataset with cluster labels attached
  const combinedData = data.map((row, idx) => ({
    ...row,
    __cluster: result.labels[idx] ?? 0,
    __id: idx + 1,
  }));

  const filteredData = combinedData.filter(row => {
    if (selectedClusterFilter !== 'all' && row.__cluster !== selectedClusterFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return Object.values(row).some(v => String(v).toLowerCase().includes(q));
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  // SVG PCA scatter bounds
  const pcaPoints = result.pcaData;
  const minX = Math.min(...pcaPoints.map(p => p.x), -2);
  const maxX = Math.max(...pcaPoints.map(p => p.x), 2);
  const minY = Math.min(...pcaPoints.map(p => p.y), -2);
  const maxY = Math.max(...pcaPoints.map(p => p.y), 2);

  const getClusterColor = (c: number) => {
    return result.profiles[c]?.color || '#64748b';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          Etapa 8 de 13
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Visualización y Estructura de los Clusters
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Explora la distribución espacial de los segmentos generados mediante proyección en componentes principales (PCA),
          analiza el balance de tamaños y audita los registros individuales asignados a cada grupo.
        </p>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Clusters (K)</div>
          <div className="text-xl font-bold text-indigo-600">{result.k}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Silueta Global</div>
          <div className={`text-xl font-bold ${result.silhouetteScore >= 0.4 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {result.silhouetteScore}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Davies-Bouldin</div>
          <div className="text-xl font-bold text-slate-900">{result.daviesBouldinIndex}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Inercia Final (SSE)</div>
          <div className="text-xl font-bold text-slate-900">{result.inertia.toLocaleString()}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Tiempo Cómputo</div>
          <div className="text-xl font-bold text-slate-700 font-mono">{result.executionTimeMs} ms</div>
        </div>
      </div>

      {/* Visualizations: 2D PCA & Cluster Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 2D PCA Scatter (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ScatterChart className="w-4 h-4 text-indigo-600" />
                <span>Proyección 2D en Componentes Principales (PCA)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Varianza explicada: PC1 ({Math.round(result.pcaVarianceExplained[0] * 100)}%) + PC2 ({Math.round(result.pcaVarianceExplained[1] * 100)}%)
              </p>
            </div>
          </div>

          {/* Interactive SVG Scatter */}
          <div className="h-72 w-full bg-slate-50/80 rounded-xl p-3 border border-slate-200 relative overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 500 300" className="w-full h-full">
              {/* Grid axes */}
              <line x1="250" y1="10" x2="250" y2="290" stroke="#e2e8f0" strokeDasharray="4" />
              <line x1="10" y1="150" x2="490" y2="150" stroke="#e2e8f0" strokeDasharray="4" />
              
              {/* Render points */}
              {pcaPoints.map((pt, idx) => {
                const normX = ((pt.x - minX) / (maxX - minX || 1)) * 460 + 20;
                const normY = 280 - (((pt.y - minY) / (maxY - minY || 1)) * 260 + 10);
                const color = getClusterColor(pt.cluster);

                return (
                  <circle
                    key={idx}
                    cx={normX}
                    cy={normY}
                    r={selectedClusterFilter === 'all' || selectedClusterFilter === pt.cluster ? 5 : 2.5}
                    fill={color}
                    opacity={selectedClusterFilter === 'all' || selectedClusterFilter === pt.cluster ? 0.85 : 0.2}
                    className="transition-all hover:r-7 cursor-pointer"
                  >
                    <title>{`Registro #${pt.id} · Cluster ${pt.cluster + 1} (${result.profiles[pt.cluster]?.name})`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Nota metodológica:</strong> Las proyecciones PCA reducen la dimensionalidad hipergeométrica para permitir la visualización gráfica en el plano 2D. No sustituyen el cálculo multidimensional completo de distancias.
            </span>
          </div>
        </div>

        {/* Cluster Distribution & Filter Bar (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Participación y Filtro de Segmentos</span>
            </h3>
            {selectedClusterFilter !== 'all' && (
              <button
                onClick={() => setSelectedClusterFilter('all')}
                className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {result.profiles.map((p) => {
              const isSelected = selectedClusterFilter === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedClusterFilter(isSelected ? 'all' : p.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-300'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="font-bold text-slate-900">{p.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{p.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${p.percentage}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span>{p.recordCount} registros</span>
                    <span className="italic">{p.tagline}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Interactive Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Registros Asignados por Segmento ({filteredData.length} registros)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar registros..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 font-bold text-slate-600">Cluster</th>
                {result.originalFeatureNames.slice(0, 7).map((col) => (
                  <th key={col} className="px-3 py-2 font-bold text-slate-700 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedData.map((row: Record<string, any>, idx) => {
                const clusterId = row.__cluster;
                const profile = result.profiles[clusterId];

                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap font-semibold">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold text-white"
                        style={{ backgroundColor: profile?.color || '#64748b' }}
                      >
                        {profile?.name || `Cluster ${clusterId + 1}`}
                      </span>
                    </td>
                    {result.originalFeatureNames.slice(0, 7).map((col) => (
                      <td key={col} className="px-3 py-2 whitespace-nowrap text-slate-800">
                        {String(row[col] ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar a Configuración</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <span>Ver e Interpretar Centroides</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
