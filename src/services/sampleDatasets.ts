import { SectorType } from '../types/data';

export interface SampleDatasetInfo {
  id: string;
  name: string;
  sector: SectorType;
  description: string;
  rowCount: number;
  data: Record<string, any>[];
}

// Generate realistic synthetic datasets with distinct hidden business clusters
export const SAMPLE_DATASETS: SampleDatasetInfo[] = [
  {
    id: 'retail_rfm',
    name: 'Retail Omnicanal & Clientes E-commerce',
    sector: 'retail',
    description: 'Conjunto de datos de clientes de retail con métricas RFM, valor de ticket, sensibilidad a descuentos y tasas de devolución.',
    rowCount: 200,
    data: (() => {
      const records: Record<string, any>[] = [];
      // 4 natural business profiles
      for (let i = 1; i <= 200; i++) {
        const profile = i % 4;
        let recency = 0, frequency = 0, monetary = 0, basket = 0, discountPct = 0, returnRate = 0, age = 0;
        let category = 'Moda';
        let channel = 'Web';

        if (profile === 0) {
          // VIP Premium: recent, frequent, high spend, low discount sensitivity
          recency = Math.floor(5 + Math.random() * 20);
          frequency = Math.floor(18 + Math.random() * 15);
          monetary = Math.floor(2500 + Math.random() * 3000);
          basket = Math.floor(140 + Math.random() * 80);
          discountPct = +(Math.random() * 10).toFixed(1);
          returnRate = +(Math.random() * 4).toFixed(1);
          age = Math.floor(35 + Math.random() * 25);
          category = ['Electrónica', 'Hogar & Lujo', 'Moda'][Math.floor(Math.random() * 3)];
          channel = 'Omnicanal';
        } else if (profile === 1) {
          // Cazadores de promociones: high discount share, medium frequency, lower basket
          recency = Math.floor(15 + Math.random() * 45);
          frequency = Math.floor(8 + Math.random() * 8);
          monetary = Math.floor(600 + Math.random() * 600);
          basket = Math.floor(45 + Math.random() * 30);
          discountPct = +(45 + Math.random() * 40).toFixed(1);
          returnRate = +(8 + Math.random() * 12).toFixed(1);
          age = Math.floor(22 + Math.random() * 20);
          category = ['Moda', 'Accesorios', 'Calzado'][Math.floor(Math.random() * 3)];
          channel = 'App Móvil';
        } else if (profile === 2) {
          // Clientes en riesgo / durmientes: high recency (long time no buy), historically moderate spend
          recency = Math.floor(90 + Math.random() * 180);
          frequency = Math.floor(2 + Math.random() * 4);
          monetary = Math.floor(300 + Math.random() * 500);
          basket = Math.floor(70 + Math.random() * 40);
          discountPct = +(15 + Math.random() * 20).toFixed(1);
          returnRate = +(2 + Math.random() * 6).toFixed(1);
          age = Math.floor(28 + Math.random() * 35);
          category = ['Hogar & Lujo', 'Deportes', 'Moda'][Math.floor(Math.random() * 3)];
          channel = 'Tienda Física';
        } else {
          // Nuevos compradores recurrentes / Crecimiento: low recency, moderate spend, fast adoption
          recency = Math.floor(10 + Math.random() * 30);
          frequency = Math.floor(5 + Math.random() * 6);
          monetary = Math.floor(850 + Math.random() * 700);
          basket = Math.floor(95 + Math.random() * 45);
          discountPct = +(20 + Math.random() * 25).toFixed(1);
          returnRate = +(4 + Math.random() * 5).toFixed(1);
          age = Math.floor(26 + Math.random() * 28);
          category = ['Electrónica', 'Deportes', 'Alimentos'][Math.floor(Math.random() * 3)];
          channel = 'Web';
        }

        // Add 2 realistic missing values or slight noise to test cleaning
        const hasMissingDiscount = i === 12 || i === 48;
        const hasOutlier = i === 99;

        records.push({
          Cliente_ID: `CLI-${1000 + i}`,
          Recencia_Dias: recency,
          Frecuencia_Compras: frequency,
          Gasto_Total_USD: hasOutlier ? 18500 : monetary,
          Ticket_Promedio_USD: basket,
          Porcentaje_Descuentos: hasMissingDiscount ? null : discountPct,
          Tasa_Devolucion_Pct: returnRate,
          Edad_Cliente: age,
          Categoria_Favorita: category,
          Canal_Principal: channel,
        });
      }
      return records;
    })(),
  },
  {
    id: 'telecom_subscribers',
    name: 'Telecomunicaciones - Suscriptores Móviles & Fibra',
    sector: 'telecom',
    description: 'Facturación mensual, volumen de datos GB, minutos de voz, permanencia y scoring de riesgo de fuga.',
    rowCount: 200,
    data: (() => {
      const records: Record<string, any>[] = [];
      for (let i = 1; i <= 200; i++) {
        const seg = i % 4;
        let cargo = 0, datosGB = 0, minutos = 0, antiguedad = 0, serviciosValor = 0, riesgoFuga = 0;
        let tipoContrato = 'Mensual';

        if (seg === 0) {
          // Data Heavy / Heavy Streamers
          cargo = Math.floor(65 + Math.random() * 30);
          datosGB = +(45 + Math.random() * 50).toFixed(1);
          minutos = Math.floor(200 + Math.random() * 250);
          antiguedad = Math.floor(12 + Math.random() * 36);
          serviciosValor = Math.floor(3 + Math.random() * 3);
          riesgoFuga = +(10 + Math.random() * 15).toFixed(1);
          tipoContrato = 'Anual';
        } else if (seg === 1) {
          // Voz Tradicional / Adultos Mayores
          cargo = Math.floor(25 + Math.random() * 15);
          datosGB = +(2 + Math.random() * 6).toFixed(1);
          minutos = Math.floor(550 + Math.random() * 400);
          antiguedad = Math.floor(36 + Math.random() * 48);
          serviciosValor = 1;
          riesgoFuga = +(15 + Math.random() * 20).toFixed(1);
          tipoContrato = 'Fijo 24M';
        } else if (seg === 2) {
          // En Alto Riesgo de Churn
          cargo = Math.floor(75 + Math.random() * 35);
          datosGB = +(15 + Math.random() * 25).toFixed(1);
          minutos = Math.floor(120 + Math.random() * 150);
          antiguedad = Math.floor(6 + Math.random() * 14);
          serviciosValor = 1;
          riesgoFuga = +(65 + Math.random() * 30).toFixed(1);
          tipoContrato = 'Sin Permanencia';
        } else {
          // Low Cost / Plan Básico
          cargo = Math.floor(18 + Math.random() * 12);
          datosGB = +(8 + Math.random() * 12).toFixed(1);
          minutos = Math.floor(180 + Math.random() * 120);
          antiguedad = Math.floor(18 + Math.random() * 24);
          serviciosValor = 2;
          riesgoFuga = +(25 + Math.random() * 25).toFixed(1);
          tipoContrato = 'Mensual';
        }

        records.push({
          Abonado_ID: `TEL-${2000 + i}`,
          Factura_Mensual_USD: cargo,
          Consumo_Datos_GB: datosGB,
          Minutos_Voz: minutos,
          Permanencia_Meses: antiguedad,
          Servicios_Adicionales: serviciosValor,
          Indice_Riesgo_Fuga: riesgoFuga,
          Tipo_Contrato: tipoContrato,
          Metodo_Pago: ['Tarjeta Automática', 'Transferencia', 'Efectivo en Taquilla'][i % 3],
        });
      }
      return records;
    })(),
  },
  {
    id: 'finance_banking',
    name: 'Servicios Financieros - Cartera y Clientes de Crédito',
    sector: 'finance',
    description: 'Score crediticio, ingresos netos, ratio deuda/ingreso, saldo revolvente y productos de inversión.',
    rowCount: 200,
    data: (() => {
      const records: Record<string, any>[] = [];
      for (let i = 1; i <= 200; i++) {
        const seg = i % 4;
        let score = 0, ingreso = 0, ratioDTI = 0, saldoRevolvente = 0, lineasCredito = 0, morosidad2A = 0, patrimonioInvertido = 0;

        if (seg === 0) {
          // Banca Patrimonial / High Net Worth
          score = Math.floor(740 + Math.random() * 80);
          ingreso = Math.floor(7500 + Math.random() * 8000);
          ratioDTI = +(12 + Math.random() * 14).toFixed(1);
          saldoRevolvente = Math.floor(800 + Math.random() * 1500);
          lineasCredito = Math.floor(5 + Math.random() * 4);
          morosidad2A = 0;
          patrimonioInvertido = Math.floor(65000 + Math.random() * 120000);
        } else if (seg === 1) {
          // Deudores Activos de Alto Riesgo
          score = Math.floor(560 + Math.random() * 70);
          ingreso = Math.floor(1800 + Math.random() * 1500);
          ratioDTI = +(48 + Math.random() * 30).toFixed(1);
          saldoRevolvente = Math.floor(3500 + Math.random() * 4000);
          lineasCredito = Math.floor(6 + Math.random() * 5);
          morosidad2A = Math.floor(1 + Math.random() * 3);
          patrimonioInvertido = 0;
        } else if (seg === 2) {
          // Jóvenes Profesionales Emergentes
          score = Math.floor(680 + Math.random() * 50);
          ingreso = Math.floor(3800 + Math.random() * 2200);
          ratioDTI = +(26 + Math.random() * 15).toFixed(1);
          saldoRevolvente = Math.floor(1400 + Math.random() * 1200);
          lineasCredito = Math.floor(3 + Math.random() * 3);
          morosidad2A = 0;
          patrimonioInvertido = Math.floor(8000 + Math.random() * 15000);
        } else {
          // Clientes Tradicionales Cautelosos
          score = Math.floor(710 + Math.random() * 50);
          ingreso = Math.floor(2900 + Math.random() * 1500);
          ratioDTI = +(18 + Math.random() * 12).toFixed(1);
          saldoRevolvente = Math.floor(300 + Math.random() * 600);
          lineasCredito = Math.floor(2 + Math.random() * 2);
          morosidad2A = 0;
          patrimonioInvertido = Math.floor(15000 + Math.random() * 25000);
        }

        records.push({
          Cliente_ID: `FIN-${3000 + i}`,
          Score_Crediticio: score,
          Ingreso_Mensual_USD: ingreso,
          Ratio_Deuda_Ingreso_Pct: ratioDTI,
          Saldo_Revolvente_USD: saldoRevolvente,
          Numero_Lineas_Credito: lineasCredito,
          Atrasos_Ultimos_2Anios: morosidad2A,
          Patrimonio_Inversion_USD: patrimonioInvertido,
          Segmento_Bancario: ['Premier', 'Básica', 'Pyme', 'Digital'][i % 4],
        });
      }
      return records;
    })(),
  },
  {
    id: 'logistics_fleet',
    name: 'Transporte y Logística - Rutas y Despachos B2B',
    sector: 'logistics',
    description: 'Distancia de ruta, tiempo de entrega, costo de combustible, cumplimiento en tiempo y siniestralidad.',
    rowCount: 200,
    data: (() => {
      const records: Record<string, any>[] = [];
      for (let i = 1; i <= 200; i++) {
        const seg = i % 4;
        let dist = 0, tiempo = 0, fuel = 0, onTime = 0, peso = 0, siniestros = 0;

        if (seg === 0) {
          // Rutas Troncales Larga Distancia Eficientes
          dist = Math.floor(650 + Math.random() * 500);
          tiempo = +(10 + Math.random() * 8).toFixed(1);
          fuel = Math.floor(280 + Math.random() * 180);
          onTime = +(94 + Math.random() * 5).toFixed(1);
          peso = Math.floor(12000 + Math.random() * 8000);
          siniestros = +(Math.random() * 0.5).toFixed(2);
        } else if (seg === 1) {
          // Última Milla Urbana Congestionada
          dist = Math.floor(35 + Math.random() * 45);
          tiempo = +(3.5 + Math.random() * 3).toFixed(1);
          fuel = Math.floor(65 + Math.random() * 40);
          onTime = +(76 + Math.random() * 12).toFixed(1);
          peso = Math.floor(450 + Math.random() * 800);
          siniestros = +(1.2 + Math.random() * 2).toFixed(2);
        } else if (seg === 2) {
          // Rutas Interurbanas Express
          dist = Math.floor(180 + Math.random() * 150);
          tiempo = +(2.8 + Math.random() * 1.5).toFixed(1);
          fuel = Math.floor(110 + Math.random() * 50);
          onTime = +(96 + Math.random() * 4).toFixed(1);
          peso = Math.floor(2200 + Math.random() * 1800);
          siniestros = +(0.2 + Math.random() * 0.4).toFixed(2);
        } else {
          // Carga Pesada Especializada de Retorno Vacío
          dist = Math.floor(400 + Math.random() * 300);
          tiempo = +(7.5 + Math.random() * 4).toFixed(1);
          fuel = Math.floor(220 + Math.random() * 100);
          onTime = +(83 + Math.random() * 10).toFixed(1);
          peso = Math.floor(18000 + Math.random() * 6000);
          siniestros = +(0.8 + Math.random() * 1.5).toFixed(2);
        }

        records.push({
          Despacho_ID: `LOG-${4000 + i}`,
          Distancia_KM: dist,
          Tiempo_Entrega_Horas: tiempo,
          Costo_Combustible_USD: fuel,
          Cumplimiento_Puntual_Pct: onTime,
          Peso_Carga_KG: peso,
          Tasa_Siniestralidad_Pct: siniestros,
          Tipo_Vehiculo: ['Tractocamión', 'Furgón 3.5T', 'Camión Rígido', 'Van Express'][i % 4],
        });
      }
      return records;
    })(),
  },
];
