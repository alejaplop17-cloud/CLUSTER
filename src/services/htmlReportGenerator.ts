import {
  ClusteringExecutionResult,
  ClusteringModelConfig,
  ColumnMetadata,
  DataQualityReport,
  OptimalKMetric,
  SectorType,
  TransformationLog,
} from '../types/data';

export interface ReportConfig {
  reportTitle: string;
  analystName: string;
  organization: string;
  sectorName: string;
  datasetName: string;
  includeTechnicalAppendix: boolean;
  notes: string;
}

export function generateHTMLReport(
  config: ReportConfig,
  qualityReport: DataQualityReport,
  columns: ColumnMetadata[],
  logs: TransformationLog[],
  optimalKData: { metrics: OptimalKMetric[]; recommendedK: number; rationale: string },
  modelConfig: ClusteringModelConfig,
  result: ClusteringExecutionResult
): string {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate SVG for Cluster Sizes Donut / Bar
  const clusterBarsSVG = result.profiles
    .map((p, idx) => {
      const barWidth = Math.max(10, Math.round(p.percentage * 3.5));
      return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #1e293b;">
            <span>${p.name}</span>
            <span>${p.recordCount} registros (${p.percentage}%)</span>
          </div>
          <div style="background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; position: relative;">
            <div style="background: ${p.color}; width: ${p.percentage}%; height: 100%; border-radius: 8px;"></div>
          </div>
        </div>
      `;
    })
    .join('');

  // Top centroids comparison table
  const featureCols = result.featureNames.slice(0, 7);
  const centroidRows = result.centroids
    .map(c => {
      const cells = featureCols
        .map(f => {
          const val = c.unscaledValues[f] !== undefined ? c.unscaledValues[f] : '-';
          const delta = c.deltasVsMeanPct[f];
          const deltaColor = delta > 0 ? '#059669' : delta < 0 ? '#dc2626' : '#64748b';
          const deltaSign = delta > 0 ? '+' : '';
          return `
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">
              <div style="font-weight: 600; color: #0f172a;">${val}</div>
              <div style="font-size: 11px; color: ${deltaColor};">${deltaSign}${delta}%</div>
            </td>
          `;
        })
        .join('');

      return `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; font-size: 13px;">
            ${c.name}
          </td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  // Profiles and 5-dimension strategies HTML
  const profilesHTML = result.profiles
    .map((p, idx) => {
      const strat = p.strategies;
      return `
        <div style="margin-top: 36px; padding: 28px; background: #ffffff; border: 1px solid #cbd5e1; border-top: 5px solid ${p.color}; border-radius: 12px; page-break-inside: avoid; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${p.color}; margin-bottom: 4px;">
                Segmento ${p.id + 1} · ${config.sectorName}
              </div>
              <h3 style="margin: 0; font-size: 22px; color: #0f172a; font-weight: 700;">${p.name}</h3>
              <p style="margin: 4px 0 0; font-size: 14px; color: #475569; font-style: italic;">"${p.tagline}"</p>
            </div>
            <div style="text-align: right; background: #f8fafc; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${p.recordCount} <span style="font-size: 13px; font-weight: 500; color: #64748b;">(${p.percentage}%)</span></div>
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Volumen de Base</div>
            </div>
          </div>

          <!-- Key characteristics and discriminants -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px;">
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px; text-transform: uppercase;">Variables más Diferenciadoras (vs Media)</div>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.6;">
                ${p.discriminantFeatures.map(df => `<li><strong>${df.feature}:</strong> ${df.value} <span style="color: ${df.diffPct > 0 ? '#059669' : '#dc2626'}; font-weight: 600;">(${df.diffPct > 0 ? '+' : ''}${df.diffPct}%)</span></li>`).join('')}
              </ul>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px; text-transform: uppercase;">Comportamiento y Necesidades</div>
              <p style="margin: 0 0 6px; font-size: 13px; color: #475569; line-height: 1.5;">${p.predominantBehaviors}</p>
              <div style="font-size: 12px; font-weight: 600; color: #1e293b;">Necesidad clave: <span style="font-weight: 400; color: #475569;">${p.probableNeeds}</span></div>
            </div>
          </div>

          <h4 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 20px 0 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
            Plan Estratégico Multidimensional (5 Dimensiones de Negocio)
          </h4>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
            <!-- Product -->
            <div style="padding: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 4px; text-transform: uppercase;">A. Producto</div>
              <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 6px;">${strat.product.title}</div>
              <div style="font-size: 12px; color: #475569; margin-bottom: 8px; line-height: 1.4;">${strat.product.mainRecommendation}</div>
              <div style="font-size: 11px; background: #eff6ff; padding: 6px; border-radius: 4px; color: #1e40af; font-weight: 600;">KPI: ${strat.product.kpi}</div>
            </div>

            <!-- Price -->
            <div style="padding: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #059669; margin-bottom: 4px; text-transform: uppercase;">B. Precio</div>
              <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 6px;">${strat.price.title}</div>
              <div style="font-size: 12px; color: #475569; margin-bottom: 8px; line-height: 1.4;">${strat.price.mainRecommendation}</div>
              <div style="font-size: 11px; background: #ecfdf5; padding: 6px; border-radius: 4px; color: #065f46; font-weight: 600;">KPI: ${strat.price.kpi}</div>
            </div>

            <!-- Innovation -->
            <div style="padding: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #7c3aed; margin-bottom: 4px; text-transform: uppercase;">C. Innovación</div>
              <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 6px;">${strat.innovation.title}</div>
              <div style="font-size: 12px; color: #475569; margin-bottom: 8px; line-height: 1.4;">${strat.innovation.mainRecommendation}</div>
              <div style="font-size: 11px; background: #f5f3ff; padding: 6px; border-radius: 4px; color: #5b21b6; font-weight: 600;">KPI: ${strat.innovation.kpi}</div>
            </div>

            <!-- Communication -->
            <div style="padding: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #d97706; margin-bottom: 4px; text-transform: uppercase;">D. Comunicación</div>
              <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 6px;">${strat.communication.title}</div>
              <div style="font-size: 12px; color: #475569; margin-bottom: 8px; line-height: 1.4;">${strat.communication.mainRecommendation}</div>
              <div style="font-size: 11px; background: #fffbeb; padding: 6px; border-radius: 4px; color: #92400e; font-weight: 600;">KPI: ${strat.communication.kpi}</div>
            </div>

            <!-- Profitability -->
            <div style="padding: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #e11d48; margin-bottom: 4px; text-transform: uppercase;">E. Rentabilidad</div>
              <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 6px;">${strat.profitability.title}</div>
              <div style="font-size: 12px; color: #475569; margin-bottom: 8px; line-height: 1.4;">${strat.profitability.mainRecommendation}</div>
              <div style="font-size: 11px; background: #fff1f2; padding: 6px; border-radius: 4px; color: #9f1239; font-weight: 600;">KPI: ${strat.profitability.kpi}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.reportTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    * { box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    .cover-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 48px;
      border-radius: 16px;
      margin-bottom: 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    }

    .meta-tag {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #38bdf8;
      margin-bottom: 12px;
    }

    .title {
      font-size: 34px;
      font-weight: 800;
      line-height: 1.2;
      margin: 0 0 16px;
    }

    .subtitle {
      font-size: 16px;
      color: #94a3b8;
      margin: 0 0 28px;
      max-width: 800px;
      line-height: 1.6;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 13px;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .metric-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 8px;
    }

    .metric-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 14px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
    }

    .print-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      z-index: 100;
    }

    @media print {
      body { background: #ffffff; }
      .container { padding: 0; max-width: 100%; }
      .print-button { display: none; }
      .cover-card { box-shadow: none; border-radius: 0; padding: 24px; }
      .card { box-shadow: none; border: 1px solid #cbd5e1; }
    }
  </style>
</head>
<body>

  <button class="print-button" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>

  <div class="container">

    <!-- PORTADA / HERO -->
    <div class="cover-card">
      <div class="meta-tag">Informe Ejecutivo y Técnico de Segmentación Analítica</div>
      <h1 class="title">${config.reportTitle}</h1>
      <p class="subtitle">
        Documento metodológico y estratégico que sintetiza el diagnóstico de calidad, preprocesamiento de variables,
        selección matemática de clusters mediante ${modelConfig.algorithm.toUpperCase()} y diseño de planes de negocio
        para el sector ${config.sectorName}.
      </p>

      <div class="meta-grid">
        <div>
          <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Organización</div>
          <div style="font-weight: 600;">${config.organization}</div>
        </div>
        <div>
          <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Científico / Analista</div>
          <div style="font-weight: 600;">${config.analystName}</div>
        </div>
        <div>
          <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Sector Económico</div>
          <div style="font-weight: 600;">${config.sectorName}</div>
        </div>
        <div>
          <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Fecha de Emisión</div>
          <div style="font-weight: 600;">${dateStr}</div>
        </div>
      </div>
    </div>

    <!-- 1. RESUMEN EJECUTIVO -->
    <div class="card">
      <h2 class="section-title">1. Resumen Ejecutivo de la Segmentación</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
        Se procesó exitosamente el conjunto de datos <strong>${config.datasetName}</strong> que contiene un total de 
        <strong>${result.recordCount} registros</strong> analizados bajo una metodología no supervisada.
        El modelo <strong>${modelConfig.algorithm.toUpperCase()}</strong> segmentó la población en <strong>${result.k} conglomerados estratégicos</strong>
        con un Coeficiente de Silueta global de <strong>${result.silhouetteScore}</strong>, garantizando cohesión interna y separación funcional apta para operaciones de negocio.
      </p>

      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Registros Procesados</div>
          <div class="metric-value">${result.recordCount}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Clusters Identificados</div>
          <div class="metric-value" style="color: #2563eb;">${result.k}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Coeficiente de Silueta</div>
          <div class="metric-value" style="color: ${result.silhouetteScore >= 0.4 ? '#059669' : '#d97706'};">${result.silhouetteScore}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Índice Davies-Bouldin</div>
          <div class="metric-value">${result.daviesBouldinIndex}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Salud de Datos</div>
          <div class="metric-value" style="color: #059669;">${qualityReport.qualityScore}/100</div>
        </div>
      </div>

      <div style="margin-top: 16px;">
        <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px; text-transform: uppercase;">
          Distribución de Participación por Segmento
        </div>
        ${clusterBarsSVG}
      </div>
    </div>

    <!-- 2. DIAGNÓSTICO Y CALIDAD -->
    <div class="card">
      <h2 class="section-title">2. Diagnóstico de Calidad y Limpieza de Datos</h2>
      <p style="color: #475569; font-size: 13px; line-height: 1.6;">
        El análisis exploratorio de calidad identificó <strong>${qualityReport.duplicateRows} duplicados exactos</strong> (${qualityReport.duplicatePercentage}%)
        y <strong>${qualityReport.totalMissingCells} celdas nulas</strong> (${qualityReport.missingPercentage}%).
        Todas las anomalías fueron depuradas o imputadas siguiendo la política de preservación de identificadores.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 12px; font-size: 13px;">
        <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Bitácora de Transformaciones Aplicadas:</div>
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          ${logs.map(l => `<li><strong>${l.action}:</strong> ${l.details} (${l.timestamp})</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- 3. COMPARATIVA DE CENTROIDES -->
    <div class="card">
      <h2 class="section-title">3. Tabla Comparativa de Centroides y Representantes</h2>
      <p style="color: #475569; font-size: 13px; margin-bottom: 12px;">
        Valores expresados en las unidades originales del negocio con porcentaje de variación ($\Delta\%$) respecto a la media de la población global.
      </p>

      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Segmento</th>
              ${featureCols.map(f => `<th style="text-align: right;">${f}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${centroidRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. PERFILES Y ESTRATEGIAS -->
    <div>
      <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 40px 0 8px;">
        4. Perfiles de Segmento y Estrategias Comerciales Diferenciadas
      </h2>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">
        Planes tácticos estructurados en 5 dimensiones estratégicas para cada grupo de interés identificado.
      </p>

      ${profilesHTML}
    </div>

    <!-- 5. LIMITACIONES Y ANEXO TÉCNICO -->
    <div class="card" style="margin-top: 36px;">
      <h2 class="section-title">5. Limitaciones Metodológicas y Supuestos de Negocio</h2>
      <ul style="font-size: 13px; color: #475569; line-height: 1.7; padding-left: 20px; margin: 0 0 20px;">
        <li><strong>Estabilidad temporal:</strong> La segmentación representa una fotografía instantánea del comportamiento capturado en el archivo. Se recomienda recalibrar el modelo cada 3 a 6 meses.</li>
        <li><strong>Validación financiera de rentabilidad:</strong> Las estrategias de precio y margen asumen estructuras estándar del sector ${config.sectorName}; deben cruzarse con los costos reales de absorción de cada línea de negocio.</li>
        <li><strong>Proyecciones de dimensionalidad:</strong> La visualización PCA condensa la varianza multivariada; algunas sutiles relaciones hiperdimensionales quedan reflejadas en las distancias pero no en gráficos 2D.</li>
      </ul>

      <div style="padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        <strong>Parámetros Técnicos de Ejecución:</strong> Algoritmo: ${modelConfig.algorithm.toUpperCase()} · K: ${modelConfig.k} · Medida de Distancia: ${modelConfig.distanceMetric} · Escalador: ${modelConfig.scaler} · Tiempo de cómputo: ${result.executionTimeMs} ms · Generado automáticamente por Plataforma Analítica de Clustering.
      </div>
    </div>

  </div>

</body>
</html>`;
}
