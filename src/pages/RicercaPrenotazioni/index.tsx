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
interface Booking {
  id: number;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deviceType: string;
  deviceModel: string;
  scheduledDate: string;
  scheduledTime: string;
  bookingStatus: string;
  technicianAssigned?: string;
  estimatedPrice?: number;
  paymentType?: string;
  notes?: string;
  createdAt: string;
}

// Interfaccia per il filtro temporale
interface DateFilter {
  type: "none" | "today" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}

const RicercaPrenotazioni: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const navigate = useNavigate();

  // Stati per la tabella
  const [allData, setAllData] = useState<Booking[]>([]);
  const [filteredData, setFilteredData] = useState<Booking[]>([]);
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

  // Nuovi stati per dettagli prenotazione
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBookingDetail, setSelectedBookingDetail] =
    useState<Booking | null>(null);
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
      const key = (b.bookingStatus || "Senza stato").trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    );
  }, [filteredData]);

  const totalBookings = React.useMemo(
    () => filteredData?.length ?? 0,
    [filteredData]
  );

  const topStatusForCards = React.useMemo(
    () => statusChartData.slice(0, 4),
    [statusChartData]
  );

  // Definisci le colonne usando createColumnHelper
  const columnHelper = createColumnHelper<Booking>();

  const columns = [
    columnHelper.accessor("bookingCode", {
      header: "Codice Prenotazione",
      cell: (info) => (
        <div className={styles.repairCodeCell}>
          <strong>{info.getValue()}</strong>
        </div>
      ),
    }),
    columnHelper.accessor("bookingStatus", {
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
            {info.row.original.deviceType}
          </div>
          <div className={styles.deviceSerial}>
            {info.row.original.deviceModel}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("scheduledDate", {
      header: "Data Prenotazione",
      cell: (info) => (
        <div className={styles.dateCell}>
          {new Date(info.getValue()).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
      ),
    }),
    columnHelper.accessor("scheduledTime", {
      header: "Ora",
      cell: (info) => (
        <div className={styles.timeCell}>{info.getValue() || "N/A"}</div>
      ),
    }),
    columnHelper.accessor("technicianAssigned", {
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
            onClick={() => handleViewBooking(info.row.original)}
            title="Visualizza dettagli"
          >
            <i className="fa-solid fa-eye"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={() => handleEditBooking(info.row.original)}
            title="Modifica prenotazione"
          >
            <i className="fa-solid fa-edit"></i>
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
        item.bookingStatus?.toLowerCase().includes(statusFilter.toLowerCase())
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
          item.bookingCode?.toLowerCase().includes(searchTerm) ||
          item.customerName?.toLowerCase().includes(searchTerm) ||
          item.customerEmail?.toLowerCase().includes(searchTerm) ||
          item.customerPhone?.toLowerCase().includes(searchTerm) ||
          item.deviceType?.toLowerCase().includes(searchTerm) ||
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
          const itemDate = item.scheduledDate || item.createdAt;
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

  // Carica le prenotazioni al mount
  useEffect(() => {
    fetchBookings();
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

  // Funzione per recuperare tutte le prenotazioni
  const fetchBookings = async () => {
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
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        page: 1,
        pageSize: 2000,
      };

      console.log("🔍 Caricamento prenotazioni ultimi 12 mesi:", {
        from: defaultStartDate,
        to: defaultEndDate,
      });

      const response = await fetch(`${API_URL}/api/booking/search`, {
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
      const bookings = data.items || data;

      console.log(`✅ Caricate ${bookings.length} prenotazioni`);

      setAllData(bookings);
      setFilteredData(bookings);
      setDataRange({
        from: defaultStartDate.split("T")[0],
        to: defaultEndDate.split("T")[0],
      });
    } catch (error: unknown) {
      console.error("❌ Errore nel caricamento delle prenotazioni:", error);
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
  const handleViewBooking = async (booking: Booking) => {
    console.log("Visualizza prenotazione:", booking);
    setDetailLoading(true);
    setDetailError(null);
    setShowDetailModal(true);

    try {
      const response = await fetch(`${API_URL}/api/booking/${booking.id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const detailData = await response.json();
        setSelectedBookingDetail(detailData);
      } else {
        throw new Error("Errore nel caricamento dei dettagli");
      }
    } catch (error) {
      console.error("Errore nel caricamento dettagli prenotazione:", error);
      setDetailError("Impossibile caricare i dettagli della prenotazione");
      setSelectedBookingDetail(booking);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedBookingDetail(null);
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
      case "confermata":
        return styles.statusConfermata;
      case "pendente":
        return styles.statusPendente;
      case "completata":
        return styles.statusCompletata;
      case "annullata":
        return styles.statusAnnullata;
      case "in corso":
        return styles.statusInCorso;
      default:
        return styles.statusDefault;
    }
  };

  const handleEditBooking = (booking: Booking) => {
    navigate(`/modifica-prenotazione/${booking.id}`, {
      state: { booking },
    });
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
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        page: 1,
        pageSize: 5000,
      };

      console.log("🔍 Caricamento esteso (3 anni):", {
        from: searchPayload.startDate,
        to: searchPayload.endDate,
      });

      const response = await fetch(`${API_URL}/api/booking/search`, {
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
      const bookings = data.items || data;
      console.log(
        `✅ Caricate ${bookings.length} prenotazioni estese (3 anni)`
      );

      setAllData(bookings);
      setFilteredData(bookings);
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
            <span className={styles.breadcrumbItem}>Gestione Prenotazioni</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>
              Ricerca Prenotazioni
            </span>
          </div>
        </div>

        <div className={styles.pageBody}>
          {/* === RIEPILOGO GRAFICO & CARDS === */}
          <section className={styles.statsRow}>
            {/* Donut */}
            <div className={styles.statsChartCard}>
              <div className={styles.statsCardHeader}>
                Distribuzione Prenotazioni per Stato
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
                        {totalBookings}
                      </div>
                      <div className={styles.kpiTotalLabel}>
                        Prenotazioni Totali
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

          {/* Tabella Prenotazioni */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>🔍 Ricerca Prenotazioni</h3>
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
                      ? `Totale: ${allData.length} prenotazioni`
                      : `Filtrate: ${filteredData.length}/${allData.length} prenotazioni`}
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
                <span>Caricamento prenotazioni...</span>
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
                <h4>Nessuna prenotazione trovata</h4>
                <p>
                  {allData.length > 0
                    ? "Non ci sono prenotazioni che corrispondono ai criteri di ricerca selezionati."
                    : "Non ci sono prenotazioni disponibili."}
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
                    di <strong>{filteredData.length}</strong> prenotazioni
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

      {/* Modal Dettagli Prenotazione */}
      {showDetailModal && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div
            className={styles.repairDetailModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className={styles.repairDetailHeader}>
              <div className={styles.repairDetailTitleSection}>
                <h2>📋 Dettagli Prenotazione</h2>
                {selectedBookingDetail && (
                  <div className={styles.repairDetailCodeAndStatus}>
                    <span className={styles.repairDetailCode}>
                      {selectedBookingDetail.bookingCode}
                    </span>
                    <span
                      className={`${styles.statusBadge} ${getStatusBadgeClass(
                        selectedBookingDetail.bookingStatus
                      )}`}
                    >
                      {getStatusIcon(selectedBookingDetail.bookingStatus)}{" "}
                      {selectedBookingDetail.bookingStatus}
                    </span>
                  </div>
                )}
              </div>
              <button
                className={styles.repairDetailCloseBtn}
                onClick={closeDetailModal}
                title="Chiudi"
              >
                ×
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

              {selectedBookingDetail && !detailLoading && (
                <div className={styles.repairDetailContent}>
                  {/* Timeline Stati */}
                  <div className={styles.repairDetailSection}>
                    <h3>🕒 Timeline Prenotazione</h3>
                    <div className={styles.repairTimeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineIcon}>📝</div>
                        <div className={styles.timelineContent}>
                          <strong>Creazione</strong>
                          <span>
                            {formatDetailDate(selectedBookingDetail.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.timelineItem}>
                        <div className={styles.timelineIcon}>📅</div>
                        <div className={styles.timelineContent}>
                          <strong>Data Prenotata</strong>
                          <span>
                            {formatDetailDate(
                              selectedBookingDetail.scheduledDate
                            )}{" "}
                            - {selectedBookingDetail.scheduledTime}
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
                        <h3>👤 Cliente</h3>
                        <div className={styles.repairDetailGrid}>
                          <div className={styles.repairDetailField}>
                            <label>Nome:</label>
                            <span>
                              {selectedBookingDetail.customerName || "N/A"}
                            </span>
                          </div>
                          <div className={styles.repairDetailField}>
                            <label>Telefono:</label>
                            <span>
                              {selectedBookingDetail.customerPhone || "N/A"}
                            </span>
                          </div>
                          <div className={styles.repairDetailField}>
                            <label>Email:</label>
                            <span>
                              {selectedBookingDetail.customerEmail || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dati Dispositivo */}
                      <div className={styles.repairDetailSection}>
                        <h3>
                          {getDeviceIcon(selectedBookingDetail.deviceType)}{" "}
                          Dispositivo
                        </h3>
                        <div className={styles.repairDetailGrid}>
                          <div className={styles.repairDetailField}>
                            <label>Tipo:</label>
                            <span>{selectedBookingDetail.deviceType}</span>
                          </div>
                          <div className={styles.repairDetailField}>
                            <label>Modello:</label>
                            <span>{selectedBookingDetail.deviceModel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colonna destra */}
                    <div className={styles.repairDetailRightColumn}>
                      {/* Dettagli Prenotazione */}
                      <div className={styles.repairDetailSection}>
                        <h3>🔧 Dettagli Servizio</h3>
                        <div className={styles.repairDetailGrid}>
                          <div className={styles.repairDetailField}>
                            <label>Stato:</label>
                            <span>{selectedBookingDetail.bookingStatus}</span>
                          </div>
                          {selectedBookingDetail.technicianAssigned && (
                            <div className={styles.repairDetailField}>
                              <label>Tecnico Assegnato:</label>
                              <span>
                                {selectedBookingDetail.technicianAssigned}
                              </span>
                            </div>
                          )}
                          {selectedBookingDetail.estimatedPrice !==
                            undefined && (
                            <div className={styles.repairDetailField}>
                              <label>Prezzo Stimato:</label>
                              <span>
                                €{" "}
                                {selectedBookingDetail.estimatedPrice.toFixed(
                                  2
                                )}
                              </span>
                            </div>
                          )}
                          {selectedBookingDetail.paymentType && (
                            <div className={styles.repairDetailField}>
                              <label>Tipo Pagamento:</label>
                              <span>{selectedBookingDetail.paymentType}</span>
                            </div>
                          )}
                          {selectedBookingDetail.notes && (
                            <div className={styles.repairDetailField}>
                              <label>Note:</label>
                              <span>{selectedBookingDetail.notes}</span>
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

export default RicercaPrenotazioni;
