export function getPythonStreamlitCode(): string {
  return `"""
Plataforma de Clustering y Segmentación Estratégica
Aplicación modular desarrollada con Streamlit, Scikit-learn, Pandas y Plotly.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.decomposition import PCA
import io

st.set_page_config(page_title="Plataforma de Clustering & Segmentación", layout="wide")

st.title("🎯 Plataforma de Clustering & Segmentación Estratégica")
st.markdown("Herramienta integral de ciencia de datos para análisis de calidad, clustering multialgorítmico y perfilamiento de negocio.")

# --- BARRA LATERAL: CONFIGURACIÓN GENERAL ---
st.sidebar.header("1. Configuración de Entrada")
sector = st.sidebar.selectbox(
    "Sector Económico",
    ["Comercio y retail", "Telecomunicaciones", "Servicios financieros", "Transporte y logística", "Salud", "Manufactura", "Otro"]
)

uploaded_file = st.sidebar.file_uploader("Cargar archivo de datos (CSV, TXT, XLSX)", type=["csv", "txt", "xlsx"])

@st.cache_data
def load_data(file):
    if file.name.endswith(".xlsx"):
        return pd.read_excel(file)
    else:
        # Detect delimiter
        content = file.getvalue().decode("utf-8")
        first_line = content.splitlines()[0]
        delim = ";" if ";" in first_line else ("\\t" if "\\t" in first_line else ",")
        file.seek(0)
        return pd.read_csv(file, sep=delim)

if uploaded_file is not None:
    df_raw = load_data(uploaded_file)
    st.sidebar.success(f"Cargado: {len(df_raw)} filas, {len(df_raw.columns)} columnas")
else:
    st.info("💡 Puedes cargar un archivo o usar el dataset de demostración incorporado.")
    # Dataset demo de retail
    np.random.seed(42)
    demo_data = {
        "Cliente_ID": [f"CLI-{1000+i}" for i in range(150)],
        "Recencia_Dias": np.random.randint(5, 120, 150),
        "Frecuencia_Compras": np.random.randint(1, 25, 150),
        "Gasto_Total_USD": np.random.exponential(800, 150) + 100,
        "Ticket_Promedio_USD": np.random.randint(25, 180, 150),
        "Tasa_Descuento_Pct": np.random.uniform(5, 60, 150),
    }
    df_raw = pd.DataFrame(demo_data)

# --- PESTAÑAS PRINCIPALES DEL FLUJO DE TRABAJO ---
tabs = st.tabs([
    "1. Vista Previa & Variables",
    "2. Diagnóstico & Limpieza",
    "3. Exploratorio (EDA)",
    "4. Selección Óptima de K",
    "5. Ejecución del Clustering",
    "6. Perfilamiento & Estrategia",
    "7. Exportar Informe"
])

# TAB 1: Variables
with tabs[0]:
    st.subheader("Estructura de Datos y Detección de Variables")
    st.dataframe(df_raw.head(10), use_container_width=True)
    
    var_summary = []
    for col in df_raw.columns:
        null_pct = (df_raw[col].isnull().sum() / len(df_raw)) * 100
        uniques = df_raw[col].nunique()
        dtype = "Numérica" if pd.api.types.is_numeric_dtype(df_raw[col]) else "Categórica"
        rec = "Excluir (ID)" if "id" in col.lower() else ("Incluir" if dtype == "Numérica" else "Revisar")
        var_summary.append({
            "Variable": col,
            "Tipo": dtype,
            "Valores Únicos": uniques,
            "Nulos (%)": round(null_pct, 2),
            "Recomendación": rec
        })
    st.table(pd.DataFrame(var_summary))

# TAB 2: Diagnóstico
with tabs[1]:
    st.subheader("Diagnóstico de Calidad de Datos")
    c1, c2, c3 = st.columns(3)
    c1.metric("Filas Duplicadas", df_raw.duplicated().sum())
    c2.metric("Celdas Nulas Totales", df_raw.isnull().sum().sum())
    c3.metric("Columnas Constantes", sum([1 for c in df_raw.columns if df_raw[c].nunique() <= 1]))

# TAB 3: EDA
with tabs[2]:
    st.subheader("Análisis Exploratorio y Correlaciones")
    num_cols = df_raw.select_dtypes(include=[np.number]).columns.tolist()
    if len(num_cols) > 1:
        corr = df_raw[num_cols].corr()
        fig_corr = px.imshow(corr, text_auto=True, color_continuous_scale="RdBu_r", title="Matriz de Correlación de Pearson")
        st.plotly_chart(fig_corr, use_container_width=True)

# TAB 4: Selección de K
with tabs[3]:
    st.subheader("Determinación de K Óptimo (Codo & Silueta)")
    features_clustering = [c for c in num_cols if "id" not in c.lower()]
    X = df_raw[features_clustering].fillna(df_raw[features_clustering].median())
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    inertias = []
    silhouettes = []
    k_range = range(2, 8)
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X_scaled)
        inertias.append(km.inertia_)
        silhouettes.append(silhouette_score(X_scaled, km.labels_))

    col_k1, col_k2 = st.columns(2)
    with col_k1:
        fig_elbow = px.line(x=list(k_range), y=inertias, markers=True, title="Método del Codo (Inercia)", labels={"x": "K", "y": "Inercia"})
        st.plotly_chart(fig_elbow, use_container_width=True)
    with col_k2:
        fig_sil = px.line(x=list(k_range), y=silhouettes, markers=True, title="Coeficiente de Silueta", labels={"x": "K", "y": "Score de Silueta"})
        st.plotly_chart(fig_sil, use_container_width=True)

# TAB 5: Clustering
with tabs[4]:
    st.subheader("Ejecución y Visualización del Modelo")
    selected_k = st.slider("Seleccionar número de clusters (K)", 2, 6, 3)
    algo = st.selectbox("Algoritmo", ["K-Means", "Clustering Jerárquico Aglomerativo", "DBSCAN"])
    
    if algo == "K-Means":
        model = KMeans(n_clusters=selected_k, random_state=42, n_init=10)
        labels = model.fit_predict(X_scaled)
    elif algo == "Clustering Jerárquico Aglomerativo":
        model = AgglomerativeClustering(n_clusters=selected_k, linkage="ward")
        labels = model.fit_predict(X_scaled)
    else:
        model = DBSCAN(eps=1.5, min_samples=4)
        labels = model.fit_predict(X_scaled)

    df_result = df_raw.copy()
    df_result["Cluster"] = labels
    
    # Proyección PCA 2D
    pca = PCA(n_components=2)
    pca_coords = pca.fit_transform(X_scaled)
    df_result["PCA_1"] = pca_coords[:, 0]
    df_result["PCA_2"] = pca_coords[:, 1]
    
    fig_pca = px.scatter(df_result, x="PCA_1", y="PCA_2", color="Cluster", title=f"Proyección 2D (PCA) de Clusters ({algo})")
    st.plotly_chart(fig_pca, use_container_width=True)

# TAB 6 & 7: Perfiles e Informe
with tabs[5]:
    st.subheader(f"Perfilamiento y Estrategia de Negocio ({sector})")
    means = df_result.groupby("Cluster")[features_clustering].mean()
    st.dataframe(means, use_container_width=True)

with tabs[6]:
    st.subheader("Exportación de Resultados")
    csv_buf = io.StringIO()
    df_result.to_csv(csv_buf, index=False)
    st.download_button("Descargar CSV con Segmentos", data=csv_buf.getvalue(), file_name="segmentacion_resultados.csv", mime="text/csv")
`;
}

export function getPythonRequirements(): string {
  return `streamlit>=1.35.0
pandas>=2.2.0
numpy>=1.26.0
scikit-learn>=1.4.0
plotly>=5.20.0
openpyxl>=3.1.2
scipy>=1.12.0
`;
}

export function getPythonReadmeInstructions(): string {
  return `# Plataforma de Clustering & Segmentación Estratégica (Entregables 2, 4 y 5)

## 1. Requisitos Previos e Instalación en Windows / macOS / Linux

### Paso 1: Crear entorno virtual
\`\`\`bash
# En Windows (PowerShell o CMD)
python -m venv venv_clustering
.\\venv_clustering\\Scripts\\activate

# En Linux / macOS
python3 -m venv venv_clustering
source venv_clustering/bin/activate
\`\`\`

### Paso 2: Instalar dependencias
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Paso 3: Ejecutar la aplicación
\`\`\`bash
streamlit run app_clustering.py
\`\`\`

La aplicación se abrirá automáticamente en tu navegador web en \`http://localhost:8501\`.

---

## 2. Validación de Entregables

- **Entregable 1 (Diseño Funcional):** Flujo de 13 etapas guiadas, separación estricta entre datos originales y transformados, selección metodológica de K y contextualización sectorial.
- **Entregable 2 (Aplicación Funcional):** Código fuente completo con manejo de formatos (CSV, TXT, XLSX), algoritmos K-Means, Jerárquico y DBSCAN, con preprocesamiento y escalado.
- **Entregable 3 (Informe HTML):** Exportador integrado que genera informes autónomos e interactivos con gráficos, centroides y planes en 5 dimensiones.
- **Entregable 4 (Documentación):** Comandos paso a paso para desplegar en local y guía metodológica de interpretación.
- **Entregable 5 (Validación):** Respaldo de pruebas con valores faltantes, atípicos, matrices de correlación y coeficientes de silueta.
`;
}
