import React from 'react';
import { X, BookOpen, Layers, CheckCircle2, AlertTriangle, ShieldCheck, Terminal } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Documentación Integral del Sistema & Entregables Metodológicos</h3>
              <p className="text-xs text-slate-400">Diseño funcional, guía de instalación en Windows/Linux y pruebas de validación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Documentation Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          
          {/* Entregable 1 */}
          <section className="space-y-3 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase tracking-wider text-xs">
              <Layers className="w-4 h-4" />
              <span>Entregable 1: Diseño Funcional y Arquitectura Metodológica</span>
            </div>
            <div className="space-y-2">
              <p>
                La plataforma implementa un pipeline estricto de <strong>13 etapas guiadas e interconectadas</strong> diseñado bajo los principios de la ciencia de datos moderna y la inteligencia de negocios:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Preservación de datos:</strong> Los datos crudos originales permanecen inmutables en memoria; todas las operaciones de limpieza generan copias transformadas respaldadas por una <em>Bitácora de Transformaciones</em> (Audit Trail).</li>
                <li><strong>Aislamiento de identificadores:</strong> Ningún identificador único (ID, DNI, Clave) participa en el cálculo de distancias euclidianas o centroides, previniendo sobreajustes espurios.</li>
                <li><strong>Triangulación de K Óptimo:</strong> K se evalúa cruzando el Método del Codo (reducción de inercia), el Coeficiente de Silueta y restricciones de negocio (mínimo 5% por segmento para evitar micro-grupos inoperables).</li>
                <li><strong>Contexto sectorial:</strong> Las interpretaciones no son etiquetas abstractas; se adaptan dinámicamente al sector económico seleccionado (Retail, Telecom, Banca, Logística, Salud, etc.).</li>
              </ul>
            </div>
          </section>

          {/* Entregable 4 */}
          <section className="space-y-3 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase tracking-wider text-xs">
              <Terminal className="w-4 h-4" />
              <span>Entregable 4: Guía de Instalación en Local (Windows, macOS, Linux)</span>
            </div>
            
            <p>
              Para ejecutar la versión de escritorio en Python mediante Streamlit:
            </p>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-2">
              <div className="text-slate-400"># 1. Clonar o descomprimir los archivos del proyecto</div>
              <div>cd clustering-platform</div>
              <div className="text-slate-400 pt-2"># 2. Crear entorno virtual en Windows (PowerShell / CMD)</div>
              <div>python -m venv venv</div>
              <div>.\venv\Scripts\activate</div>
              <div className="text-slate-400 pt-2"># O en Linux / macOS:</div>
              <div>python3 -m venv venv</div>
              <div>source venv/bin/activate</div>
              <div className="text-slate-400 pt-2"># 3. Instalar librerías analíticas</div>
              <div>pip install -r requirements.txt</div>
              <div className="text-slate-400 pt-2"># 4. Iniciar la aplicación interactiva</div>
              <div>streamlit run app_clustering.py</div>
            </div>
          </section>

          {/* Entregable 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold uppercase tracking-wider text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Entregable 5: Validación y Limitaciones Metodológicas Conocidas</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pruebas de Robustez Superadas</span>
                </div>
                <ul className="list-disc pl-4 text-emerald-900 space-y-1 text-[11px]">
                  <li>Tolerancia a celdas nulas mediante imputación por mediana/moda.</li>
                  <li>Invarianza de escala mediante StandardScaler y RobustScaler.</li>
                  <li>Detección de colinealidad vía matrices Pearson/Spearman.</li>
                  <li>Detección y acotamiento de valores extremos (1.5 × IQR).</li>
                </ul>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-1.5">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Limitaciones y Supuestos</span>
                </div>
                <ul className="list-disc pl-4 text-amber-900 space-y-1 text-[11px]">
                  <li>K-Means asume clusters de forma aproximadamente esférica.</li>
                  <li>Las recomendaciones financieras requieren cruce con costos reales de contabilidad analítica.</li>
                  <li>La proyección PCA 2D condensa la varianza pero no refleja la totalidad del hiperespacio.</li>
                </ul>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md cursor-pointer"
          >
            Entendido y Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
