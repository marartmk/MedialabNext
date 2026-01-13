import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Calendar, Clock } from "lucide-react";
import styles from "./styles.module.css";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";

// Interfacce TypeScript
interface Quotation {
  id: number;
  quotationId: string;
  quotationCode?: string;
  quotationStatus?: string;
  quotationStatusCode?: number;
  quotationDateTime: string;
  validUntil?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  technicianId?: string;
  technicianCode?: string;
  technicianName?: string;
  componentIssue?: string;
  problemDescription?: string;
  estimatedPrice?: number;
  finalPrice?: number;
  paymentType?: string;
  billingInfo?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  isConverted?: boolean;
}


// Interfaccia per il filtro temporale
interface DateFilter {
  type: "none" | "today" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}

const RicercaPreventivi: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const navigate = useNavigate();

  // Stati per la tabella
  const [allData, setAllData] = useState<Quotation[]>([]);
  const [filteredData, setFilteredData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataRange, setDataRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  // Stati per i filtri
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");

  // Nuovi stati per il filtro temporale
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: "none" });
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Nuovi stati per dettagli preventivo
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuotationDetail, setSelectedQuotationDetail] =
    useState<Quotation | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // --- RIEPILOGO STATI (per donut + cards) ---
  const COLORS = [
    "#ffa726",
    "#26a69a",
    "#42a5f5",
    "#ef5350",
    "#ab47bc",
    "#8d6e63",
    "#78909c",
  ];

  const statusChartData = React.useMemo(() => {
    const counts = new Map<string, number>();
    (filteredData || []).forEach((b) => {
      const key = (b.quotationStatus || "Senza stato").trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    );
  }, [filteredData]);

  const totalQuotations = React.useMemo(
    () => filteredData?.length ?? 0,
    [filteredData]
  );

  const topStatusForCards = React.useMemo(
    () => statusChartData.slice(0, 4),
    [statusChartData]
  );

  // Definisci le colonne usando createColumnHelper
  const columnHelper = createColumnHelper<Quotation>();

  const columns = [
    columnHelper.accessor("quotationCode", {
      header: "Codice Preventivo",
      cell: (info) => (
        <div className={styles.repairCodeCell}>
          <strong>{info.getValue()}</strong>
        </div>
      ),
    }),
    columnHelper.accessor("quotationStatus", {
      header: "Stato",
      cell: (info) => (
        <div
          className={`${styles.statusBadge} ${
            styles[getStatusClass(info.getValue())]
          }`}
        >
          {getStatusIcon(info.getValue())} {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("customerName", {
      header: "Cliente",
      cell: (info) => (
        <div className={styles.customerCell}>
          <div className={styles.customerName}>{info.getValue()}</div>
          <div className={styles.customerContact}>
            {info.row.original.customerPhone && (
              <span>📞 {info.row.original.customerPhone}</span>
            )}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("customerEmail", {
      header: "Email",
      cell: (info) => (
        <div className={styles.emailCell}>{info.getValue() || "N/A"}</div>
      ),
    }),
    columnHelper.display({
      id: "device",
      header: "Dispositivo",
      cell: (info) => (
        <div className={styles.deviceCell}>
          <div className={styles.deviceName}>
            {getDeviceIcon(info.row.original.deviceType)}{" "}
            {info.row.original.deviceType || "N/A"}
          </div>
          <div className={styles.deviceSerial}>
            {[info.row.original.deviceBrand, info.row.original.deviceModel]
              .filter(Boolean)
              .join(" ") || "N/A"}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("quotationDateTime", {
      header: "Data Preventivo",
      cell: (info) => {
        const value = info.getValue();
        return (
          <div className={styles.dateCell}>
            {value
              ? new Date(value).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "N/A"}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "quotationTime",
      header: "Ora",
      cell: (info) => {
        const value = info.row.original.quotationDateTime;
        return (
          <div className={styles.timeCell}>
            {value
              ? new Date(value).toLocaleTimeString("it-IT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"}
          </div>
        );
      },
    }),
    columnHelper.accessor("technicianName", {
      header: "Tecnico",
      cell: (info) => (
        <div className={styles.technicianCell}>
          {info.getValue() || (
            <span className={styles.noData}>Non assegnato</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Data Creazione",
      cell: (info) => (
        <div className={styles.dateCell}>
          {new Date(info.getValue()).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Azioni",
      cell: (info) => (
        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionBtn} ${styles.viewBtn}`}
            onClick={() => handleViewQuotation(info.row.original)}
            title="Visualizza dettagli"
          >
            <i className="fa-solid fa-eye"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={() => handleEditQuotation(info.row.original)}
            title="Modifica preventivo"
          >
            <i className="fa-solid fa-edit"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.completeBtn}`}
            onClick={() => handleConvertToRepair(info.row.original)}
            title="Converti in riparazione"
          >
            <i className="fa-solid fa-check-circle"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.cancelBtn}`}
            onClick={() => handleCancelQuotation(info.row.original)}
            title="Annulla preventivo"
          >
            <i className="fa-solid fa-times-circle"></i>
          </button>
        </div>
      ),
    }),
  ];

  // Inizializza la tabella con dati filtrati
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
      sorting: [
        {
          id: "createdAt",
          desc: true,
        },
      ],
    },
  });

  // Filtro locale dei dati
  const applyLocalFilters = () => {
    console.log("🔍 Applicando filtri locali...");
    let filtered = [...allData];

    // Filtro per stato
    if (statusFilter) {
      filtered = filtered.filter((item) =>
        item.quotationStatus?.toLowerCase().includes(statusFilter.toLowerCase())
      );
      console.log(
        `🏷️ Filtro stato '${statusFilter}': ${filtered.length} risultati`
      );
    }

    // Filtro per ricerca testuale
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.quotationCode?.toLowerCase().includes(searchTerm) ||
          item.customerName?.toLowerCase().includes(searchTerm) ||
          item.customerEmail?.toLowerCase().includes(searchTerm) ||
          item.customerPhone?.toLowerCase().includes(searchTerm) ||
          item.deviceType?.toLowerCase().includes(searchTerm) ||
          item.deviceBrand?.toLowerCase().includes(searchTerm) ||
          item.deviceModel?.toLowerCase().includes(searchTerm)
      );
      console.log(
        `🔍 Filtro ricerca '${globalFilter}': ${filtered.length} risultati`
      );
    }

    // Filtro per data
    if (dateFilter.type !== "none") {
      let startDate: string | null = null;
      let endDate: string | null = null;

      if (
        dateFilter.type === "custom" &&
        dateFilter.startDate &&
        dateFilter.endDate
      ) {
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
      } else {
        const dateRange = calculateDateRange(dateFilter.type);
        if (dateRange) {
          startDate = dateRange.startDate;
          endDate = dateRange.endDate;
        }
      }

      if (startDate && endDate) {
        filtered = filtered.filter((item) => {
          const itemDate = item.quotationDateTime || item.createdAt;
          if (!itemDate) return false;

          const date = new Date(itemDate).toISOString().split("T")[0];
          return date >= startDate! && date <= endDate!;
        });
        console.log(
          `📅 Filtro data ${startDate} - ${endDate}: ${filtered.length} risultati`
        );
      }
    }

    console.log(
      `✅ Filtro completato: ${filtered.length}/${allData.length} risultati`
    );
    setFilteredData(filtered);
  };

  // Applica filtri quando cambiano
  useEffect(() => {
    if (allData.length > 0) {
      applyLocalFilters();
    }
  }, [statusFilter, globalFilter, dateFilter, allData]);

  // Carica i preventivi al mount
  useEffect(() => {
    fetchQuotations();
  }, []);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Funzione per calcolare le date basate sul tipo di filtro
  const calculateDateRange = (
    filterType: string
  ): { startDate: string; endDate: string } | null => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (filterType) {
      case "today":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0
        );
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        );
        break;
      case "week": {
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        return null;
    }

    const result = {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };

    console.log(`📅 Calcolato range per ${filterType}:`, result);
    return result;
  };

  // Funzione per recuperare tutti i preventivi
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem("token");
      const multitenantId = sessionStorage.getItem("IdCompany");

      if (!multitenantId) {
        throw new Error("ID azienda non trovato");
      }

      // Range ultimi 12 mesi
      const now = new Date();
      const start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      const defaultStartDate = start.toISOString();
      const defaultEndDate = end.toISOString();

      const searchPayload = {
        multitenantId: multitenantId,
        fromDate: defaultStartDate,
        toDate: defaultEndDate,
        page: 1,
        pageSize: 2000,
      };

      console.log("🔍 Caricamento preventivi ultimi 12 mesi:", {
        from: defaultStartDate,
        to: defaultEndDate,
      });

      const response = await fetch(`${API_URL}/api/quotations/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchPayload),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const quotations = data.items || data;

      console.log(`✅ Caricate ${quotations.length} preventivi`);

      setAllData(quotations);
      setFilteredData(quotations);
      setDataRange({
        from: defaultStartDate.split("T")[0],
        to: defaultEndDate.split("T")[0],
      });
    } catch (error: unknown) {
      console.error("❌ Errore nel caricamento dei preventivi:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Errore sconosciuto");
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestione del cambio di filtro temporale
  const handleDateFilterChange = (filterType: string) => {
    console.log("🕐 Cambio filtro temporale:", filterType);
    if (filterType === "custom") {
      setShowCustomDateRange(true);
      setDateFilter({ type: "custom" });
    } else {
      setShowCustomDateRange(false);
      setDateFilter({ type: filterType as DateFilter["type"] });
    }
  };

  // Applicazione del range personalizzato
  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      console.log("🎯 Applicando range personalizzato:", {
        startDate: customStartDate,
        endDate: customEndDate,
      });
      setDateFilter({
        type: "custom",
        startDate: customStartDate,
        endDate: customEndDate,
      });
      setShowCustomDateRange(false);
    }
  };

  // Reset del filtro personalizzato
  const resetCustomDateRange = () => {
    setCustomStartDate("");
    setCustomEndDate("");
    setShowCustomDateRange(false);
    setDateFilter({ type: "none" });
  };

  // Funzioni per le azioni
  const handleViewQuotation = async (quotation: Quotation) => {
    console.log("Visualizza preventivo:", quotation);
    setDetailLoading(true);
    setDetailError(null);
    setShowDetailModal(true);

    try {
      const response = await fetch(`${API_URL}/api/quotations/${quotation.id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const detailData = await response.json();
        setSelectedQuotationDetail(detailData);
      } else {
        throw new Error("Errore nel caricamento dei dettagli");
      }
    } catch (error) {
      console.error("Errore nel caricamento dettagli preventivo:", error);
      setDetailError("Impossibile caricare i dettagli del preventivo");
      setSelectedQuotationDetail(quotation);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedQuotationDetail(null);
    setDetailError(null);
  };

  const formatDetailDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "prenotata":
        return styles.statusConfermata;
      case "in attesa":
        return styles.statusPendente;
      case "completata":
        return styles.statusCompletata;
      case "annullata":
        return styles.statusAnnullata;
      case "non pervenuta":
        return styles.statusInCorso;
      default:
        return styles.statusDefault;
    }
  };

  const handleEditQuotation = (quotation: Quotation) => {
    navigate("/preventivi", {
      state: {
        quotationId: quotation.quotationId,
        quotationCode: quotation.quotationCode,
      },
    });
  };

  // 🆕 Handler per completare la riparazione
  const handleConvertToRepair = (quotation: Quotation) => {
    console.log("Converti in riparazione:", quotation);
    alert("Conversione in riparazione non disponibile da questa schermata.");
  };

  // 🆕 Handler per segnare come non pervenuta
  const handleCancelQuotation = (quotation: Quotation) => {
    console.log("Annulla preventivo:", quotation);
    alert("Annullamento preventivo non disponibile da questa schermata.");
  };

  // Funzione per caricare dati più vecchi
  const loadMoreData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem("token");
      const multitenantId = sessionStorage.getItem("IdCompany");
      if (!multitenantId) throw new Error("ID azienda non trovato");

      const now = new Date();
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 3);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      const searchPayload = {
        multitenantId,
        fromDate: start.toISOString(),
        toDate: end.toISOString(),
        page: 1,
        pageSize: 5000,
      };

      console.log("🔍 Caricamento esteso (3 anni):", {
        from: searchPayload.fromDate,
        to: searchPayload.toDate,
      });

      const response = await fetch(`${API_URL}/api/quotations/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchPayload),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const quotations = data.items || data;
      console.log(
        `✅ Caricate ${quotations.length} preventivi estesi (3 anni)`
      );

      setAllData(quotations);
      setFilteredData(quotations);
      setDataRange({
        from: fmtDateIT(start),
        to: fmtDateIT(end),
      });
    } catch (err: unknown) {
      console.error("❌ Errore nel caricamento esteso:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const fmtDateIT = (d: Date) =>
    d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // Funzioni di utilità
  const getStatusClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "confermata":
        return "statusConfermata";
      case "pendente":
        return "statusPendente";
      case "completata":
        return "statusCompletata";
      case "annullata":
        return "statusAnnullata";
      case "in corso":
        return "statusInCorso";
      default:
        return "statusDefault";
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "confermata":
        return "✅";
      case "pendente":
        return "⌛";
      case "completata":
        return "🎉";
      case "annullata":
        return "❌";
      case "in corso":
        return "🔧";
      default:
        return "📋";
    }
  };

  const getDeviceIcon = (deviceType: string): string => {
    switch (deviceType?.toLowerCase()) {
      case "smartphone":
        return "📱";
      case "tablet":
        return "📱";
      case "laptop":
        return "💻";
      case "desktop":
        return "🖥️";
      case "console":
        return "🎮";
      case "smartwatch":
        return "⌚";
      default:
        return "🔧";
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
            <span className={styles.breadcrumbItem}>Gestione Preventivi</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>
              Ricerca Preventivi
            </span>
          </div>
        </div>

        <div className={styles.pageBody}>
          {/* === RIEPILOGO GRAFICO & CARDS === */}
          <section className={styles.statsRow}>
            {/* Donut */}
            <div className={styles.statsChartCard}>
              <div className={styles.statsCardHeader}>
                Distribuzione Preventivi per Stato
              </div>
              <div className={styles.statsCardBody}>
                <div className={styles.chartTwoCols}>
                  {/* Sinistra: Donut */}
                  <div className={styles.chartLeft}>
                    <div className={styles.donutWrapper}>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Tooltip />
                          <Pie
                            data={statusChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={4}
                            stroke="#fff"
                            strokeWidth={3}
                          >
                            {statusChartData.map((_entry, idx) => (
                              <Cell
                                key={`cell-${idx}`}
                                fill={COLORS[idx % COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Destra: Totale + lista stati */}
                  <div className={styles.chartRight}>
                    <div className={styles.kpiTotal}>
                      <div className={styles.kpiTotalNumber}>
                        {totalQuotations}
                      </div>
                      <div className={styles.kpiTotalLabel}>
                        Preventivi Totali
                      </div>
                    </div>

                    <div className={styles.legendList}>
                      {statusChartData.map((s, i) => (
                        <div key={s.name} className={styles.legendItem}>
                          <span className={styles.legendLeft}>
                            <span
                              className={styles.legendDot}
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            {s.name}
                          </span>
                          <span
                            className={styles.legendBadge}
                            style={{ background: COLORS[i % COLORS.length] }}
                          >
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards di riepilogo */}
            <div className={styles.statCardsGrid}>
              {topStatusForCards.map((s, i) => (
                <div
                  key={s.name}
                  className={`${styles.statCard} ${styles[`statCard${i}`]}`}
                >
                  <h3>{s.value}</h3>
                  <small>{s.name.toUpperCase()}</small>
                </div>
              ))}
            </div>
          </section>

          {/* Tabella Preventivi */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>🔍 Ricerca Preventivi</h3>
              <div className={styles.tableHeaderInfo}>
                {allData.length > 0 && dataRange && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: "normal",
                    }}
                  >
                    {filteredData.length === allData.length
                      ? `Totale: ${allData.length} preventivi`
                      : `Filtrate: ${filteredData.length}/${allData.length} preventivi`}
                    <span style={{ marginLeft: "12px", color: "#999" }}>
                      📅 Periodo:{" "}
                      {new Date(dataRange.from).toLocaleDateString("it-IT")} -{" "}
                      {new Date(dataRange.to).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                )}
                {dataRange &&
                  new Date(dataRange.from).getFullYear() >
                    new Date().getFullYear() - 3 && (
                    <button
                      onClick={loadMoreData}
                      className={styles.loadMoreBtn}
                      disabled={loading}
                      title="Carica dati più vecchi (ultimi 3 anni)"
                    >
                      📚 Carica più dati
                    </button>
                  )}
              </div>
              <div className={styles.tableControls}>
                {/* Filtro per stato */}
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => {
                    console.log("🏷️ Cambio filtro stato:", e.target.value);
                    setStatusFilter(e.target.value);
                  }}
                >
                  <option value="">Tutti gli stati</option>
                  <option value="Confermata">✅ Confermata</option>
                  <option value="Pendente">⌛ Pendente</option>
                  <option value="Completata">🎉 Completata</option>
                  <option value="Annullata">❌ Annullata</option>
                  <option value="In Corso">🔧 In Corso</option>
                </select>

                {/* Filtro Temporale */}
                <div className={styles.dateFilterContainer}>
                  <Calendar className={styles.dateFilterIcon} />
                  <select
                    className={styles.dateFilterSelect}
                    value={dateFilter.type}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                  >
                    <option value="none">Tutte le date</option>
                    <option value="today">📅 Oggi</option>
                    <option value="week">📊 Questa settimana</option>
                    <option value="month">🗓️ Questo mese</option>
                    <option value="year">🗓️ Quest'anno</option>
                    <option value="custom">🎯 Range personalizzato</option>
                  </select>
                </div>

                {/* Campo di ricerca globale */}
                <div className={styles.searchContainerTable}>
                  <i className="fa-solid fa-magnifying-glass search-icon-table"></i>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchInput(value);
                      if (value.length >= 3 || value.length === 0) {
                        console.log("🔍 Cambio ricerca globale:", value);
                        setGlobalFilter(value);
                      }
                    }}
                    className={styles.searchTableInput}
                    placeholder="Cerca per codice, cliente, email..."
                  />
                </div>
              </div>
            </div>

            {/* Range personalizzato per le date */}
            {showCustomDateRange && (
              <div className={styles.customDateRangeContainer}>
                <div className={styles.customDateRangeContent}>
                  <div className={styles.customDateRangeHeader}>
                    <Clock className={styles.clockIcon} />
                    <h4>Seleziona Range Personalizzato</h4>
                  </div>
                  <div className={styles.dateInputsRow}>
                    <div className={styles.dateInputGroup}>
                      <label>Data inizio:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={styles.dateInput}
                      />
                    </div>
                    <div className={styles.dateInputGroup}>
                      <label>Data fine:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={styles.dateInput}
                      />
                    </div>
                  </div>
                  <div className={styles.customDateRangeButtons}>
                    <button
                      onClick={applyCustomDateRange}
                      className={styles.applyDateBtn}
                      disabled={!customStartDate || !customEndDate}
                    >
                      ✅ Applica Filtro
                    </button>
                    <button
                      onClick={resetCustomDateRange}
                      className={styles.resetDateBtn}
                    >
                      🔄 Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Indicatori filtri attivi */}
            {(statusFilter || dateFilter.type !== "none" || globalFilter) && (
              <div className={styles.activeFiltersContainer}>
                <div className={styles.activeFiltersHeader}>
                  <span>🏷️ Filtri attivi:</span>
                </div>
                <div className={styles.activeFilterTags}>
                  {statusFilter && (
                    <div className={styles.filterTag}>
                      <span>Stato: {statusFilter}</span>
                      <button onClick={() => setStatusFilter("")}>×</button>
                    </div>
                  )}
                  {dateFilter.type !== "none" && (
                    <div className={styles.filterTag}>
                      <span>
                        Periodo:{" "}
                        {dateFilter.type === "custom"
                          ? `${dateFilter.startDate} - ${dateFilter.endDate}`
                          : {
                              today: "Oggi",
                              week: "Questa settimana",
                              month: "Questo mese",
                              year: "Quest'anno",
                            }[dateFilter.type]}
                      </span>
                      <button onClick={() => setDateFilter({ type: "none" })}>
                        ×
                      </button>
                    </div>
                  )}
                  {globalFilter && (
                    <div className={styles.filterTag}>
                      <span>Ricerca: "{globalFilter}"</span>
                      <button
                        onClick={() => {
                          setGlobalFilter("");
                          setSearchInput("");
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span>Caricamento preventivi...</span>
              </div>
            )}

            {error && (
              <div className={styles.errorContainer}>
                <i className="fa-solid fa-exclamation-triangle"></i>
                <span>Errore: {error}</span>
              </div>
            )}

            {!loading && !error && filteredData.length === 0 && (
              <div className={styles.emptyState}>
                <h4>Nessun preventivo trovato</h4>
                <p>
                  {allData.length > 0
                    ? "Non ci sono preventivi che corrispondono ai criteri di ricerca selezionati."
                    : "Non ci sono preventivi disponibili."}
                </p>
              </div>
            )}

            {!loading && !error && filteredData.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className={styles.modernTable}>
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                              <span className={styles.sortIndicator}>
                                {{
                                  asc: "▲",
                                  desc: "▼",
                                }[header.column.getIsSorted() as string] ?? "⇅"}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginazione */}
                <div className={styles.paginationContainer}>
                  <div className={styles.paginationInfo}>
                    Mostrando{" "}
                    <strong>
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}
                    </strong>{" "}
                    -{" "}
                    <strong>
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}
                    </strong>{" "}
                    di <strong>{filteredData.length}</strong> preventivi
                  </div>
                  <div className={styles.paginationControls}>
                    <button
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      className={styles.paginationBtn}
                      title="Prima pagina"
                    >
                      ⟪
                    </button>
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className={styles.paginationBtn}
                      title="Pagina precedente"
                    >
                      ‹
                    </button>
                    <span className={styles.paginationInfoText}>
                      Pagina{" "}
                      <strong>
                        {table.getState().pagination.pageIndex + 1}
                      </strong>{" "}
                      di <strong>{table.getPageCount()}</strong>
                    </span>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className={styles.paginationBtn}
                      title="Pagina successiva"
                    >
                      ›
                    </button>
                    <button
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
                      disabled={!table.getCanNextPage()}
                      className={styles.paginationBtn}
                      title="Ultima pagina"
                    >
                      ⟫
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <BottomBar />
      </div>

      {/* Modal Dettagli Preventivo */}
      {showDetailModal && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div
            className={styles.repairDetailModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className={styles.repairDetailHeader}>
              <div className={styles.repairDetailTitleSection}>
                <h2>Dettagli Preventivo</h2>
                {selectedQuotationDetail && (
                  <div className={styles.repairDetailCodeAndStatus}>
                    <span className={styles.repairDetailCode}>
                      {selectedQuotationDetail.quotationCode}
                    </span>
                    <span
                      className={`${styles.statusBadge} ${getStatusBadgeClass(
                        selectedQuotationDetail.quotationStatus
                      )}`}
                    >
                      {getStatusIcon(selectedQuotationDetail.quotationStatus)}{" "}
                      {selectedQuotationDetail.quotationStatus}
                    </span>
                  </div>
                )}
              </div>
              <button
                className={styles.repairDetailCloseBtn}
                onClick={closeDetailModal}
                title="Chiudi"
              >
                x
              </button>
            </div>

            {/* Body Modal */}
            <div className={styles.repairDetailBody}>
              {detailLoading && (
                <div className={styles.repairDetailLoading}>
                  <div className={styles.loadingSpinner}></div>
                  <span>Caricamento dettagli...</span>
                </div>
              )}

              {detailError && (
                <div className={styles.repairDetailError}>
                  <i className="fa-solid fa-exclamation-triangle"></i>
                  <span>{detailError}</span>
                </div>
              )}

              {selectedQuotationDetail && !detailLoading && (
                <div className={styles.repairDetailContent}>
                  {/* Timeline Stati */}
                  <div className={styles.repairDetailSection}>
                    <h3>Timeline Preventivo</h3>
                    <div className={styles.repairTimeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineIcon}>C</div>
                        <div className={styles.timelineContent}>
                          <strong>Creazione</strong>
                          <span>
                            {formatDetailDate(selectedQuotationDetail.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.timelineItem}>
                        <div className={styles.timelineIcon}>P</div>
                        <div className={styles.timelineContent}>
                          <strong>Data Preventivo</strong>
                          <span>
                            {formatDetailDate(
                              selectedQuotationDetail.quotationDateTime
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout a due colonne */}
                  <div className={styles.repairDetailColumns}>
                    {/* Colonna sinistra */}
                    <div className={styles.repairDetailLeftColumn}>
                      {/* Dati Cliente */}
                      <div className={styles.repairDetailSection}>
                        <h3>Cliente</h3>
                        <div className={styles.repairDetailGrid}>
                          <div className={styles.repairDetailField}>
                            <label>Nome:</label>
                            <span>
                              {selectedQuotationDetail.customerName || "N/A"}
                            </span>
                          </div>
                          <div className={styles.repairDetailField}>
                            <label>Telefono:</label>
                            <span>
                              {selectedQuotationDetail.customerPhone || "N/A"}
                            </span>
                          </div>
                          <div className={styles.repairDetailField}>
                            <label>Email:</label>
                            <span>
                              {selectedQuotationDetail.customerEmail || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dati Dispositivo */}
                      <div className={styles.repairDetailSection}>
                        <h3>
                          {getDeviceIcon(selectedQuotationDetail.deviceType)}{" "}
                          Dispositivo
                        </h3>
                        <div className={styles.repairDetailGrid}>
                          <div className={styles.repairDetailField}>
                            <label>Tipo:</label>
                            <span>{selectedQuotationDetail.deviceType || "N/A"}</span>
                          </div>
                          <div className={styles.repairDetailField}>
                            <label>Marca:</label>
                            <span>{selectedQuotationDetail.deviceBrand || "N/A"}</span>
                          </div>
                          <div className={styles.repairDetailField}>
                            <label>Modello:</label>
                            <span>{selectedQuotationDetail.deviceModel || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colonna destra */}
                    <div className={styles.repairDetailRightColumn}>
                      {/* Dettagli Preventivo */}
                      <div className={styles.repairDetailSection}>
                        <h3>Dettagli Preventivo</h3>
                        <div className={styles.repairDetailGrid}>
                          <div className={styles.repairDetailField}>
                            <label>Stato:</label>
                            <span>{selectedQuotationDetail.quotationStatus}</span>
                          </div>
                          {selectedQuotationDetail.technicianName && (
                            <div className={styles.repairDetailField}>
                              <label>Tecnico Assegnato:</label>
                              <span>{selectedQuotationDetail.technicianName}</span>
                            </div>
                          )}
                          {selectedQuotationDetail.componentIssue && (
                            <div className={styles.repairDetailField}>
                              <label>Componente:</label>
                              <span>{selectedQuotationDetail.componentIssue}</span>
                            </div>
                          )}
                          {selectedQuotationDetail.problemDescription && (
                            <div className={styles.repairDetailField}>
                              <label>Descrizione:</label>
                              <span>{selectedQuotationDetail.problemDescription}</span>
                            </div>
                          )}
                          {typeof selectedQuotationDetail.estimatedPrice === "number" && (
                            <div className={styles.repairDetailField}>
                              <label>Prezzo Stimato:</label>
                              <span>EUR {selectedQuotationDetail.estimatedPrice.toFixed(2)}</span>
                            </div>
                          )}
                          {typeof selectedQuotationDetail.finalPrice === "number" && (
                            <div className={styles.repairDetailField}>
                              <label>Prezzo Finale:</label>
                              <span>EUR {selectedQuotationDetail.finalPrice.toFixed(2)}</span>
                            </div>
                          )}
                          {selectedQuotationDetail.paymentType && (
                            <div className={styles.repairDetailField}>
                              <label>Tipo Pagamento:</label>
                              <span>{selectedQuotationDetail.paymentType}</span>
                            </div>
                          )}
                          {selectedQuotationDetail.validUntil && (
                            <div className={styles.repairDetailField}>
                              <label>Valido fino al:</label>
                              <span>{formatDetailDate(selectedQuotationDetail.validUntil)}</span>
                            </div>
                          )}
                          {selectedQuotationDetail.notes && (
                            <div className={styles.repairDetailField}>
                              <label>Note:</label>
                              <span>{selectedQuotationDetail.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className={styles.repairDetailFooter}>
              <button
                className={styles.repairDetailCloseBtn}
                onClick={closeDetailModal}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RicercaPreventivi;
