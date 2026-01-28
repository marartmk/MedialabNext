import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { ZoomIn, ZoomOut } from "lucide-react";
import styles from "./statistiche.module.css";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";

// Colori per i mesi (bar chart)
const MONTH_COLORS = [
  "#808080", // Gennaio - Grigio
  "#228B22", // Febbraio - Verde
  "#1E90FF", // Marzo - Blu
  "#228B22", // Aprile - Verde
  "#FFD700", // Maggio - Giallo/Oro
  "#32CD32", // Giugno - Verde chiaro
  "#1E90FF", // Luglio - Blu
  "#FFA500", // Agosto - Arancione
  "#228B22", // Settembre - Verde
  "#8B4513", // Ottobre - Marrone
  "#FF4500", // Novembre - Rosso arancione
  "#FFD700", // Dicembre - Giallo/Oro
];

// Tipi per i grafici
type ChartType = "ingressi" | "lavorazioni" | "ingressiUscite" | null;

// Dati mock per i grafici (saranno sostituiti con API reali)
const generateMockMonthlyData = (_year: number) => {
  const months = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  return months.map((month, index) => ({
    name: month,
    ingressi: Math.floor(Math.random() * 100) + 150,
    lavorazioni: Math.floor(Math.random() * 80) + 100,
    uscite: Math.floor(Math.random() * 100) + 140,
    color: MONTH_COLORS[index],
  }));
};

const Statistiche: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Stati per fullscreen e zoom
  const [fullscreenChart, setFullscreenChart] = useState<ChartType>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const API_URL = import.meta.env.VITE_API_URL;

  // Genera anni disponibili (ultimi 5 anni)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const companyId = sessionStorage.getItem("IdCompany");

        if (!token || !companyId) {
          setMonthlyData(generateMockMonthlyData(selectedYear));
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/api/statistics/monthly?year=${selectedYear}&companyId=${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const formattedData = data.map((item: any, index: number) => ({
            name: item.month || item.name,
            ingressi: item.ingressi || item.entries || 0,
            lavorazioni: item.lavorazioni || item.processing || 0,
            uscite: item.uscite || item.exits || 0,
            color: MONTH_COLORS[index],
          }));
          setMonthlyData(formattedData);
        } else {
          setMonthlyData(generateMockMonthlyData(selectedYear));
        }
      } catch (error) {
        console.error("Errore nel caricamento statistiche:", error);
        setMonthlyData(generateMockMonthlyData(selectedYear));
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [selectedYear, API_URL]);

  // Gestione tasto ESC per chiudere fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreenChart) {
        closeFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenChart]);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Funzioni fullscreen e zoom
  const openFullscreen = (chartType: ChartType) => {
    setFullscreenChart(chartType);
    setZoomLevel(1);
  };

  const closeFullscreen = () => {
    setFullscreenChart(null);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.6));
  };

  // Calcola i dati per il grafico Ingressi/Uscite con differenza
  const ingressiUsciteData = monthlyData.map((item) => ({
    name: item.name,
    Ingressi: item.ingressi,
    Uscite: item.uscite,
    Differenza: item.ingressi - item.uscite,
  }));

  // Custom bar per colori diversi per ogni mese
  const CustomBar = (props: any) => {
    const { x, y, width, height, index } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={MONTH_COLORS[index % 12]}
        rx={2}
        ry={2}
      />
    );
  };

  // Componente grafico Ingressi
  const renderIngressiChart = (height: number = 300) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        />
        <Bar dataKey="ingressi" shape={<CustomBar />} name="Ingressi" />
      </BarChart>
    </ResponsiveContainer>
  );

  // Componente grafico Lavorazioni
  const renderLavorazioniChart = (height: number = 300) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        />
        <Area
          type="monotone"
          dataKey="lavorazioni"
          stroke="#1E90FF"
          fill="rgba(30, 144, 255, 0.2)"
          strokeWidth={2}
          name="Lavorazioni"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  // Componente grafico Ingressi/Uscite
  const renderIngressiUsciteChart = (height: number = 350) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={ingressiUsciteData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          wrapperStyle={{ paddingBottom: '10px' }}
        />
        <Line
          type="monotone"
          dataKey="Ingressi"
          stroke="#228B22"
          strokeWidth={3}
          dot={{ fill: '#228B22', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Uscite"
          stroke="#DC143C"
          strokeWidth={3}
          dot={{ fill: '#DC143C', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Differenza"
          stroke="#FFD700"
          strokeWidth={2}
          dot={{ fill: '#FFD700', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Titoli per i grafici fullscreen
  const getChartTitle = (chartType: ChartType): string => {
    switch (chartType) {
      case "ingressi": return "Andamento Ingressi Apparati";
      case "lavorazioni": return "Andamento Lavorazioni";
      case "ingressiUscite": return "Andamento Ingresso/Uscite Apparati";
      default: return "";
    }
  };

  // Render del grafico in fullscreen
  const renderFullscreenChart = () => {
    const height = Math.floor(window.innerHeight * 0.65 * zoomLevel);
    switch (fullscreenChart) {
      case "ingressi": return renderIngressiChart(height);
      case "lavorazioni": return renderLavorazioniChart(height);
      case "ingressiUscite": return renderIngressiUsciteChart(height);
      default: return null;
    }
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className={styles.schedaHeader}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Statistiche</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>Report Andamento</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Caricamento statistiche...</p>
            </div>
          ) : (
            <>
              {/* Prima riga: Andamento Ingressi + Andamento Lavorazioni */}
              <div className={styles.chartsRow}>
                {/* Grafico 1: Andamento Ingressi Apparati */}
                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Andamento Ingressi Apparati</h3>
                    <button
                      className={styles.expandButton}
                      onClick={() => openFullscreen("ingressi")}
                      title="Espandi a schermo intero"
                      aria-label="Espandi grafico a schermo intero"
                    >
                      <i className="fa-solid fa-expand" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div className={styles.chartContainer}>
                    {renderIngressiChart()}
                  </div>
                </div>

                {/* Grafico 2: Andamento Lavorazioni */}
                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Andamento lavorazioni</h3>
                    <button
                      className={styles.expandButton}
                      onClick={() => openFullscreen("lavorazioni")}
                      title="Espandi a schermo intero"
                      aria-label="Espandi grafico a schermo intero"
                    >
                      <i className="fa-solid fa-expand" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div className={styles.chartContainer}>
                    {renderLavorazioniChart()}
                  </div>
                </div>
              </div>

              {/* Seconda riga: Selettore anno + Grafico Ingressi/Uscite */}
              <div className={styles.fullWidthSection}>
                {/* Selettore Anno */}
                <div className={styles.yearSelectorContainer}>
                  <select
                    className={styles.yearSelector}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grafico 3: Andamento Ingresso/Uscite Apparati */}
                <div className={styles.chartCardFull}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Andamento Ingresso/Uscite Apparati</h3>
                    <button
                      className={styles.expandButton}
                      onClick={() => openFullscreen("ingressiUscite")}
                      title="Espandi a schermo intero"
                      aria-label="Espandi grafico a schermo intero"
                    >
                      <i className="fa-solid fa-expand" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div className={styles.chartContainerLarge}>
                    {renderIngressiUsciteChart()}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <BottomBar />
      </div>

      {/* Modal Fullscreen */}
      {fullscreenChart && (
        <div className={styles.fullscreenOverlay} onClick={closeFullscreen}>
          <div
            className={styles.fullscreenModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className={styles.fullscreenHeader}>
              <h2 className={styles.fullscreenTitle}>{getChartTitle(fullscreenChart)}</h2>
              <div className={styles.fullscreenControls}>
                {/* Controlli Zoom */}
                <div className={styles.zoomControls}>
                  <button
                    className={styles.zoomButton}
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.6}
                    title="Zoom out"
                  >
                    <ZoomOut size={20} />
                  </button>
                  <span className={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
                  <button
                    className={styles.zoomButton}
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 2}
                    title="Zoom in"
                  >
                    <ZoomIn size={20} />
                  </button>
                </div>
                {/* Bottone chiudi */}
                <button
                  className={styles.closeButton}
                  onClick={closeFullscreen}
                  title="Chiudi (ESC)"
                  aria-label="Esci da schermo intero"
                >
                  <i className="fa-solid fa-compress" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            {/* Contenuto del grafico */}
            <div
              className={styles.fullscreenContent}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            >
              {renderFullscreenChart()}
            </div>

            {/* Footer con hint */}
            <div className={styles.fullscreenFooter}>
              <span>Premi ESC o clicca fuori per chiudere</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistiche;


