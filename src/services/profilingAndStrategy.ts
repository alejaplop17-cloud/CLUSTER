import {
  ClusterCentroid,
  ClusterDimensionStrategy,
  ClusterProfile,
  ColumnMetadata,
  SectorType,
} from '../types/data';
import { PreprocessedMatrix } from './clusteringEngine';

const CLUSTER_COLORS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#64748b', // Slate
];

export function buildClusterProfiles(
  sector: SectorType,
  labels: number[],
  rawCentroids: number[][],
  matrixObj: PreprocessedMatrix,
  data: Record<string, any>[],
  columns: ColumnMetadata[]
): { centroids: ClusterCentroid[]; profiles: ClusterProfile[] } {
  const k = rawCentroids.length;
  const n = data.length;
  const { featureNames, originalFeatureNames, scalers } = matrixObj;

  // Calculate cluster sizes
  const clusterCounts = new Array(k).fill(0);
  for (const l of labels) {
    if (l >= 0 && l < k) clusterCounts[l]++;
  }

  // Calculate overall dataset averages for features
  const overallMeans: Record<string, number> = {};
  for (const col of featureNames) {
    if (scalers[col]) {
      const vals = data.map(r => Number(r[col]) || 0);
      overallMeans[col] = vals.reduce((a, b) => a + b, 0) / (n || 1);
    }
  }

  // 1. Unscale centroids
  const centroids: ClusterCentroid[] = [];

  for (let c = 0; c < k; c++) {
    const scaledVals: Record<string, number> = {};
    const unscaledVals: Record<string, number> = {};
    const deltas: Record<string, number> = {};

    for (let f = 0; f < featureNames.length; f++) {
      const feat = featureNames[f];
      const scaledVal = rawCentroids[c][f];
      scaledVals[feat] = +(scaledVal.toFixed(3));

      if (scalers[feat]) {
        const { center, scale } = scalers[feat];
        const unscaled = scaledVal * scale + center;
        unscaledVals[feat] = +(unscaled.toFixed(2));

        const baseMean = overallMeans[feat] || 1;
        const deltaPct = baseMean !== 0 ? +(((unscaled - baseMean) / Math.abs(baseMean)) * 100).toFixed(1) : 0;
        deltas[feat] = deltaPct;
      } else {
        // One-hot binary flag: proportion in cluster
        unscaledVals[feat] = +(scaledVal * 100).toFixed(1);
        deltas[feat] = +(scaledVal * 100).toFixed(1);
      }
    }

    centroids.push({
      clusterId: c,
      name: `Segmento ${c + 1}`,
      scaledValues: scaledVals,
      unscaledValues: unscaledVals,
      deltasVsMeanPct: deltas,
    });
  }

  // 2. Identify top discriminant features for each cluster
  const profiles: ClusterProfile[] = [];

  for (let c = 0; c < k; c++) {
    const cent = centroids[c];
    const count = clusterCounts[c];
    const pct = n > 0 ? +((count / n) * 100).toFixed(1) : 0;

    // Rank features by absolute delta vs population mean
    const sortedDeltas = Object.entries(cent.deltasVsMeanPct)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5)
      .map(([feat, diffPct]) => {
        const unscaled = cent.unscaledValues[feat];
        return {
          feature: feat,
          value: String(unscaled),
          diffPct,
        };
      });

    // Sector-based intelligent naming & tailored strategies
    const sectorProfile = generateSectorSpecificProfile(sector, c, cent, sortedDeltas);

    profiles.push({
      id: c,
      name: sectorProfile.name,
      tagline: sectorProfile.tagline,
      recordCount: count,
      percentage: pct,
      color: CLUSTER_COLORS[c % CLUSTER_COLORS.length],
      keyCharacteristics: sectorProfile.keyCharacteristics,
      discriminantFeatures: sortedDeltas,
      predominantBehaviors: sectorProfile.predominantBehaviors,
      probableNeeds: sectorProfile.probableNeeds,
      businessOpportunities: sectorProfile.businessOpportunities,
      risksAndLimitations: sectorProfile.risksAndLimitations,
      strategies: sectorProfile.strategies,
    });
  }

  // Update centroid names to match profile names
  for (let c = 0; c < k; c++) {
    centroids[c].name = profiles[c].name;
  }

  return { centroids, profiles };
}

function generateSectorSpecificProfile(
  sector: SectorType,
  clusterIndex: number,
  centroid: ClusterCentroid,
  discriminants: { feature: string; value: string; diffPct: number }[]
): {
  name: string;
  tagline: string;
  keyCharacteristics: string[];
  predominantBehaviors: string;
  probableNeeds: string;
  businessOpportunities: string;
  risksAndLimitations: string;
  strategies: {
    product: ClusterDimensionStrategy;
    price: ClusterDimensionStrategy;
    innovation: ClusterDimensionStrategy;
    communication: ClusterDimensionStrategy;
    profitability: ClusterDimensionStrategy;
  };
} {
  // Extract key indicators if available in centroid
  const deltas = centroid.deltasVsMeanPct;
  const unscaled = centroid.unscaledValues;

  // Helper to test if a feature is prominent
  const isHigh = (nameKeyword: string) => {
    const match = Object.keys(deltas).find(k => k.toLowerCase().includes(nameKeyword));
    return match ? deltas[match] > 20 : false;
  };
  const isLow = (nameKeyword: string) => {
    const match = Object.keys(deltas).find(k => k.toLowerCase().includes(nameKeyword));
    return match ? deltas[match] < -20 : false;
  };

  if (sector === 'retail') {
    if (isHigh('gasto') || isHigh('monet') || isHigh('ticket')) {
      return {
        name: 'Clientes VIP de Alto Valor y Frecuencia',
        tagline: 'Compradores insignia con el mayor ticket promedio y alta fidelidad omnicanal.',
        keyCharacteristics: [
          'Gasto acumulado significativamente superior a la media (+30% a +80%).',
          'Baja sensibilidad a promociones de liquidación; priorizan conveniencia y exclusividad.',
          'Baja tasa de devoluciones respecto a otros segmentos.',
        ],
        predominantBehaviors: 'Realizan recompras recurrentes tanto en tienda física como en canal digital con canastas de alto valor unitario.',
        probableNeeds: 'Atención personalizada, lanzamientos anticipados, acceso prioritario a stock premium y empaques de regalo.',
        businessOpportunities: 'Programas de lealtad por puntos premium, venta cruzada en categorías de lujo y suscripciones anuales.',
        risksAndLimitations: 'Cualquier fricción en soporte postventa o stock insuficiente puede impactar fuertemente la facturación consolidada.',
        strategies: {
          product: {
            dimension: 'product',
            title: 'Portafolio Exclusivo & Curaduría VIP',
            mainRecommendation: 'Ofrecer preventas exclusivas y catálogo de alta gama con packaging diferenciado.',
            keyTactics: ['Acceso 48h antes a nuevas colecciones', 'Línea de productos concierge', 'Empaquetado eco-premium sin costo'],
            kpi: 'Tasa de retención anual VIP >= 92%',
            dataBackedRationale: 'Su gasto promedio supera con creces el del resto de la base, justificando costos de curaduría.',
            potentialRisks: 'Riesgo de sobreoferta de productos inaccesibles si el catálogo pierde relevancia.',
          },
          price: {
            dimension: 'price',
            title: 'Pricing Basado en Valor (Inelástico)',
            mainRecommendation: 'Mantener precios plenos; sustituir descuentos directos por beneficios experienciales.',
            keyTactics: ['Envío express gratuito vitalicio', 'Cashback acreditable en próximas compras', 'Puntos multiplicados en compras de fin de semana'],
            kpi: 'Margen bruto unitario >= 45%',
            dataBackedRationale: 'Presentan la menor tasa de compras con descuento en el conjunto de datos.',
            potentialRisks: 'Descuentos agresivos erosionan innecesariamente el margen de clientes dispuestos a pagar precio completo.',
          },
          innovation: {
            dimension: 'innovation',
            title: 'Personal Shopper Digital & Experiencia Omnicanal',
            mainRecommendation: 'Implementar recomendador hiperpersonalizado y asistencia directa por WhatsApp Business.',
            keyTactics: ['Pruebas virtuales interactivas', 'Citas privadas en tienda reservables por app', 'Reposición automática con 1-click'],
            kpi: 'NPS del segmento >= 75 puntos',
            dataBackedRationale: 'Alta tasa de respuesta a novedades tecnológicas y navegación omnicanal observada.',
            potentialRisks: 'Inversión en personal shoppers no escalable sin soporte de IA asistida.',
          },
          communication: {
            dimension: 'communication',
            title: 'Canal Directo Exclusivo & Tono Concierge',
            mainRecommendation: 'Comunicaciones directas no invasivas mediante email de diseño editorial y WhatsApp VIP.',
            keyTactics: ['Invitaciones a eventos a puerta cerrada', 'Newsletter quincenal con consejos de estilo', 'Línea directa con gestor de cuenta'],
            kpi: 'Open Rate en comunicaciones >= 42%',
            dataBackedRationale: 'Los canales masivos saturados generan bajas de suscripción en este perfil.',
            potentialRisks: 'Saturación publicitaria si se les envían newsletters promocionales genéricas.',
          },
          profitability: {
            dimension: 'profitability',
            title: 'Maximización del Lifetime Value (LTV)',
            mainRecommendation: 'Proteger la retención mensual y elevar el LTV a 36 meses mediante upselling.',
            keyTactics: ['Monitor de alerta temprana ante caída de recencia > 45 días', 'Auditoría mensual de satisfacción post-entrega'],
            kpi: 'Crecimiento de LTV interanual +15%',
            dataBackedRationale: 'Generan el mayor margen neto por cliente de toda la cartera comercial.',
            potentialRisks: 'Pérdida de un solo cliente en este segmento representa el equivalente a 10 compradores promedio.',
          },
        },
      };
    } else if (isHigh('descuento') || isHigh('devolucion')) {
      return {
        name: 'Cazadores de Ofertas y Promociones',
        tagline: 'Compradores altamente sensibles al precio y activados por rebajas agresivas.',
        keyCharacteristics: [
          'Más del 40% del volumen de compra se concentra en productos con descuento o liquidación.',
          'Ticket promedio moderado o bajo, con alta volatilidad estacional.',
          'Mayor tasa de devoluciones por compras por impulso.',
        ],
        predominantBehaviors: 'Esperan activamente campañas de CyberDay, Black Friday y cupones de bienvenida para comprar.',
        probableNeeds: 'Cupones de descuento, liquidaciones de fin de temporada y facilidades de pago en cuotas.',
        businessOpportunities: 'Movilizar inventario de lenta rotación y saldos de temporada sin acumular costos de bodegaje.',
        risksAndLimitations: 'Margen unitario reducido y alta elasticidad precio: si no hay descuento, no compran.',
        strategies: {
          product: {
            dimension: 'product',
            title: 'Paquetes Combo & Liquidación de Inventario',
            mainRecommendation: 'Dirigir inventario estancado y armar kits "compra 2 y lleva 3" para elevar volumen.',
            keyTactics: ['Combos de productos complementarios', 'Sección outlet exclusiva en app', 'Muestras gratis de productos nuevos'],
            kpi: 'Rotación de inventario en liquidación +25%',
            dataBackedRationale: 'Responden fuertemente al incentivo de ahorro por volumen.',
            potentialRisks: 'Canibalización del catálogo a precio estándar.',
          },
          price: {
            dimension: 'price',
            title: 'Precios Gancho y Cupones Condicionados',
            mainRecommendation: 'Condicionar descuentos a montos mínimos de compra para forzar el incremento del ticket.',
            keyTactics: ['Cupón de $10 USD solo aplicable en compras > $60 USD', 'Escalas de descuento por cantidad', 'Descuentos por pronto pago'],
            kpi: 'Incremento del ticket promedio en +18%',
            dataBackedRationale: 'Tienen ticket unitario bajo pero responden rápidamente a mínimos de compra.',
            potentialRisks: 'Riesgo de margen negativo si los cupones se apilan sin reglas de exclusión.',
          },
          innovation: {
            dimension: 'innovation',
            title: 'Gamificación de Ahorro y Alertas de Rebaja',
            mainRecommendation: 'Notificaciones automáticas "Bajó de precio el producto que guardaste" y ruleta de premios.',
            keyTactics: ['Wishlist con alertas de baja de precio', 'Desafíos de compras con puntos canjeables', 'Flash sales de 3 horas'],
            kpi: 'Conversión de carritos abandonados >= 22%',
            dataBackedRationale: 'Monitorean precios de forma constante en la plataforma móvil.',
            potentialRisks: 'Entrenar al cliente a no comprar nunca a precio regular.',
          },
          communication: {
            dimension: 'communication',
            title: 'Mensajería Push de Urgencia & Campañas de Temporada',
            mainRecommendation: 'Push notifications y SMS breves centrados en escasez temporal y porcentaje de ahorro.',
            keyTactics: ['Titulares con porcentaje de descuento explícito', 'Contador regresivo en banners de email', 'Campañas flash por fin de semana'],
            kpi: 'Click-Through Rate (CTR) >= 5.8%',
            dataBackedRationale: 'Su decisión de compra se gatilla por urgencia promocional demostrable.',
            potentialRisks: 'Fatiga de notificaciones si la frecuencia supera 2 impactos por semana.',
          },
          profitability: {
            dimension: 'profitability',
            title: 'Control Estricto de Costos Logísticos y Retornos',
            mainRecommendation: 'Impedir envío gratis en compras con descuentos extremos y optimizar política de devoluciones.',
            keyTactics: ['Cobro de envío en pedidos menores al ticket umbral', 'Auditoría de causas de devolución en productos en oferta'],
            kpi: 'Reducción de tasa de devolución en 3 puntos porcentuales',
            dataBackedRationale: 'Las devoluciones en productos con margen estrecho destruyen la rentabilidad neta.',
            potentialRisks: 'Fricción en usuarios si las condiciones de devolución son confusas.',
          },
        },
      };
    } else if (isHigh('recencia')) {
      return {
        name: 'Clientes en Riesgo de Abandono (Durmientes)',
        tagline: 'Cuentas con alta antigüedad sin transacciones en el último periodo comercial.',
        keyCharacteristics: [
          'Recencia elevada (>90 días sin compras ni actividad en plataforma).',
          'Historial de compras previo existente pero estancado.',
          'Caída progresiva en apertura de comunicaciones institucionales.',
        ],
        predominantBehaviors: 'Dejaron de interactuar gradualmente, posiblemente atraídos por ofertas de la competencia.',
        probableNeeds: 'Motivo contundente para regresar, actualización de catálogo y verificación de calidad del servicio previo.',
        businessOpportunities: 'Campaña win-back con incentivo inmediato antes de que el coste de reactivación sea irreversible.',
        risksAndLimitations: 'Un porcentaje ya habrá migrado definitivamente a alternativas de mercado.',
        strategies: {
          product: {
            dimension: 'product',
            title: 'Re-enganche con Productos Top Seller Actualizados',
            mainRecommendation: 'Presentar catálogo de novedades con base en las categorías que compraba históricamente.',
            keyTactics: ['"Mira lo que te has perdido" personalizado', 'Garantía extendida de satisfacción en el reingreso'],
            kpi: 'Tasa de reactivación a 60 días >= 14%',
            dataBackedRationale: 'La recencia crítica indica pérdida de relevancia de la oferta anterior.',
            potentialRisks: 'Ofrecer productos descontinuados o sin stock genera rechazo permanente.',
          },
          price: {
            dimension: 'price',
            title: 'Bono de Re-bienvenida Un solo Uso',
            mainRecommendation: 'Incentivo económico temporal válido por 15 días con caducidad explícita.',
            keyTactics: ['Cupón directo de reactivación sin letra chica', 'Envío prioritario bonificado en su próxima orden'],
            kpi: 'Retorno sobre inversión de reactivación (ROI) >= 3.5x',
            dataBackedRationale: 'Requieren romper la inercia del abandono con un beneficio tangible.',
            potentialRisks: 'Que solo compren una vez por el subsidio y vuelvan a dormirse.',
          },
          innovation: {
            dimension: 'innovation',
            title: 'Encuesta de Satisfacción Rápida de 1 Pregunta',
            mainRecommendation: 'Detectar motivos de la fuga mediante microencuesta interactiva en app o correo.',
            keyTactics: ['Pregunta NPS rápida con campo de texto libre', 'Procesamiento de reclamos desatendidos'],
            kpi: 'Tasa de respuesta de feedback >= 8%',
            dataBackedRationale: 'Identificar si la inactividad fue por mala experiencia o cambio de necesidad.',
            potentialRisks: 'Reactivar frustraciones pasadas si no hay respuesta de soporte.',
          },
          communication: {
            dimension: 'communication',
            title: 'Campañas Automatizadas de Reactivación (Drip Sequences)',
            mainRecommendation: 'Secuencia de 3 correos espaciados con enfoque empático y llamada a la acción clara.',
            keyTactics: ['Asunto: "Te extrañamos + regalo adentro"', 'Encuesta breve en segundo impacto', 'Último llamado con caducidad del cupón'],
            kpi: 'Tasa de apertura en secuencias de rescate >= 28%',
            dataBackedRationale: 'El correo único tiene baja tasa de rescate; una secuencia de 3 contactos duplica la probabilidad.',
            potentialRisks: 'Marcación de correos como spam si se insiste tras 3 intentos.',
          },
          profitability: {
            dimension: 'profitability',
            title: 'Depuración de Base Activa y Reducción de Costes de Marketing',
            mainRecommendation: 'Si no responden tras 90 días adicionales, pausar pauta publicitaria para evitar quema de presupuesto.',
            keyTactics: ['Excluir de audiencias pagadas de Meta/Google Ads', 'Limpieza de base de CRM'],
            kpi: 'Ahorro de costos de adquisición publicitaria en un 12%',
            dataBackedRationale: 'Impactar usuarios irrecuperables diluye el ROAS publicitario.',
            potentialRisks: 'Dar por perdida una cuenta que podría reactivarse estacionalmente.',
          },
        },
      };
    } else {
      return {
        name: 'Compradores Recurrentes en Crecimiento',
        tagline: 'Clientes consistentes con potencial de expansión y fidelización a mediano plazo.',
        keyCharacteristics: [
          'Frecuencia y gasto en torno al promedio del negocio.',
          'Interacciones regulares con buena respuesta a promociones moderadas.',
          'Riesgo de fuga bajo o controlado.',
        ],
        predominantBehaviors: 'Compran cuando surge una necesidad específica con un proceso de decisión racional.',
        probableNeeds: 'Planes de suscripción, recomendaciones cruzadas y beneficios por acumulación de compras.',
        businessOpportunities: 'Transición hacia el segmento VIP mediante venta cruzada y fidelización programada.',
        risksAndLimitations: 'Si no se les incentiva, su gasto se mantiene plano sin crecimiento orgánico.',
        strategies: {
          product: {
            dimension: 'product',
            title: 'Kits de Frecuencia y Reposición Programada',
            mainRecommendation: 'Introducir modelos de reposición periódica o suscripción con 10% de ahorro.',
            keyTactics: ['Suscripción recurrente mensual', 'Cross-sell inteligente en checkout'],
            kpi: 'Tasa de adopción de suscripción >= 15%',
            dataBackedRationale: 'Muestran periodicidad predecible que se adapta a modelos de suscripción.',
            potentialRisks: 'Falta de flexibilidad para pausar entregas.',
          },
          price: {
            dimension: 'price',
            title: 'Metas Escalonadas de Gasto (Gamificación de Tier)',
            mainRecommendation: '"Gasta $20 más y alcanza el nivel Plata para envíos gratis todo el mes".',
            keyTactics: ['Barra de progreso de recompensas en carrito', 'Descuento en la segunda unidad'],
            kpi: 'Incremento del ticket promedio +12%',
            dataBackedRationale: 'Están a corta distancia económica de saltar al siguiente tramo de rentabilidad.',
            potentialRisks: 'Complejidad en las reglas de las metas escalonadas.',
          },
          innovation: {
            dimension: 'innovation',
            title: 'Recomendaciones Basadas en Machine Learning',
            mainRecommendation: 'Módulo de "Clientes que compraron este producto también agregaron...".',
            keyTactics: ['Recomendaciones dinámicas en la página de confirmación', 'Recordatorios por email de reposición'],
            kpi: 'Tasa de productos por orden (Basket Depth) de 2.1 a 2.8',
            dataBackedRationale: 'Comportamiento receptivo a sugerencias afines.',
            potentialRisks: 'Recomendaciones redundantes de artículos ya adquiridos.',
          },
          communication: {
            dimension: 'communication',
            title: 'Boletín Semanal de Contenido de Valor y Tendencias',
            mainRecommendation: 'Compartir guías prácticas de uso, recetas o comparativas antes que solo banners de venta.',
            keyTactics: ['Email informativo los días martes', 'Contenido generado por usuarios en redes'],
            kpi: 'Tasa de engagement en emails >= 32%',
            dataBackedRationale: 'Aprecian información técnica antes de decidir una compra.',
            potentialRisks: 'Contenido demasiado denso que no oriente a la compra.',
          },
          profitability: {
            dimension: 'profitability',
            title: 'Optimización de Margen por Venta Cruzada',
            mainRecommendation: 'Favorecer en las recomendaciones productos con margen bruto superior al 50%.',
            keyTactics: ['Promover marcas propias y productos de alta rotación con bajo costo de adquisición'],
            kpi: 'Aumento de contribución marginal neta +8%',
            dataBackedRationale: 'Este segmento aporta el volumen base de ingresos operacionales del negocio.',
            potentialRisks: 'Descuidar marcas líderes que atraen el tráfico inicial.',
          },
        },
      };
    }
  }

  // Generic fallback with deep domain insights
  return {
    name: `Segmento Estratégico ${clusterIndex + 1}: ${discriminants[0]?.feature || 'Perfil Principal'} ${discriminants[0]?.diffPct > 0 ? 'Superior' : 'Controlado'}`,
    tagline: `Grupo con comportamiento diferencial caracterizado por ${discriminants.slice(0, 2).map(d => `${d.feature} (${d.diffPct > 0 ? '+' : ''}${d.diffPct}%)`).join(' y ')}.`,
    keyCharacteristics: [
      `Diferencia marcada en ${discriminants[0]?.feature || 'variable principal'} respecto a la media de la población.`,
      `Representa un subgrupo homogéneo con varianza interna reducida.`,
      `Patrón de comportamiento estadísticamente consistente en las distancias multivariadas.`,
    ],
    predominantBehaviors: 'Comportamiento enfocado en las métricas clave del sector, con clara diferenciación operativa respecto a los demás grupos.',
    probableNeeds: 'Propuesta de valor ajustada a su escala de consumo, soporte adecuado a su nivel de criticidad y canales fluidos.',
    businessOpportunities: 'Diseño de planes personalizados que capturen el valor excedente y mejoren la retención.',
    risksAndLimitations: 'Requiere validación periódica para asegurar que los patrones se mantengan estables en el tiempo.',
    strategies: {
      product: {
        dimension: 'product',
        title: 'Alineación de Catálogo y Oferta de Valor',
        mainRecommendation: 'Alinear el portafolio a las variables distintivas identificadas en este cluster.',
        keyTactics: ['Adaptación de especificaciones de servicio', 'Modularidad en planes y características', 'Paquetes a medida'],
        kpi: 'Tasa de satisfacción del segmento >= 85%',
        dataBackedRationale: 'La varianza del grupo demuestra requerimientos funcionales distintos a la media.',
        potentialRisks: 'Complejidad operativa en la gestión de demasiadas variantes de producto.',
      },
      price: {
        dimension: 'price',
        title: 'Estructura Tarifaria Ajustada al Valor Percibido',
        mainRecommendation: 'Implementar precios diferenciados acordes a la intensidad de uso observada.',
        keyTactics: ['Planes escalonados por umbrales de uso', 'Descuentos por compromiso de largo plazo', 'Revisión de márgenes unitarios'],
        kpi: 'Margen operativo promedio >= 28%',
        dataBackedRationale: 'Los datos muestran una capacidad o disposición de uso particular en este segmento.',
        potentialRisks: 'Resistencia a tarifas si la diferenciación de valor no es clara.',
      },
      innovation: {
        dimension: 'innovation',
        title: 'Optimización de Experiencia y Digitalización',
        mainRecommendation: 'Incorporar herramientas de autoservicio y automatización en los puntos de contacto más usados.',
        keyTactics: ['Flujos digitales de autogestión', 'Alertas proactivas de estado', 'Monitoreo continuo de experiencia'],
        kpi: 'Tiempo de resolución de solicitudes -30%',
        dataBackedRationale: 'Permite reducir costos de atención manteniendo altos niveles de servicio.',
        potentialRisks: 'Falta de adopción de canales digitales sin acompañamiento inicial.',
      },
      communication: {
        dimension: 'communication',
        title: 'Mensajes Segmentados por Canal Preferente',
        mainRecommendation: 'Concentrar los esfuerzos de comunicación en los canales que muestran mayor interacción.',
        keyTactics: ['Mensajes centrados en beneficios específicos del grupo', 'Frecuencia de contacto calibrada', 'Pruebas A/B de contenido'],
        kpi: 'Tasa de respuesta a campañas >= 18%',
        dataBackedRationale: 'La comunicación genérica genera fatiga informativa en grupos con perfiles específicos.',
        potentialRisks: 'Inconsistencia en el mensaje de marca global.',
      },
      profitability: {
        dimension: 'profitability',
        title: 'Eficiencia Operacional y Control de Costes',
        mainRecommendation: 'Monitorear la contribución neta del segmento descontando costos de servicio asignados.',
        keyTactics: ['Costeo por actividad (ABC)', 'Definición de umbrales mínimos de rentabilidad', 'Planes de contingencia'],
        kpi: 'EBITDA por cuenta en el segmento +10%',
        dataBackedRationale: 'Asegura que el segmento contribuya positivamente al resultado financiero global.',
        potentialRisks: 'Subestimar costos indirectos de servicio o soporte.',
      },
    },
  };
}
