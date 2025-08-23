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

// Interfaccia per i dati delle riparazioni
interface RepairData {
  id: number;
  repairId: string;
  repairCode: string;
  deviceId: string;
  customerId?: string;
  companyId: string;
  multitenantId: string;
  faultDeclared: string;
  faultDetected?: string;
  repairAction?: string;
  repairStatusCode: string;
  repairStatus: string;
  technicianCode?: string;
  technicianName?: string;
  createdAt: string;
  receivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  notes?: string;
  device?: {
    brand: string;
    model: string;
    serialNumber: string;
    deviceType: string;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    region: string | null;
    fiscalCode: string | null;
    vatNumber: string | null;
    customerType: string;
  };
}

// Interfaccia per il filtro temporale
interface DateFilter {
  type: "none" | "today" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}

const RicercaSchede: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");

  // Stati per la tabella
  const [allData, setAllData] = useState<RepairData[]>([]); // Tutti i dati
  const [filteredData, setFilteredData] = useState<RepairData[]>([]); // Dati filtrati
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataRange, setDataRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Stati per i filtri
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");

  // Nuovi stati per il filtro temporale
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: "none" });
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

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
    (filteredData || []).forEach((r) => {
      const key = (r.repairStatus || "Senza stato").trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    // Ordino per valore discendente
    return Array.from(counts, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    );
  }, [filteredData]);

  const totalRepairs = React.useMemo(
    () => filteredData?.length ?? 0,
    [filteredData]
  );

  // Le 4 categorie più frequenti per le cards a destra
  const topStatusForCards = React.useMemo(
    () => statusChartData.slice(0, 4),
    [statusChartData]
  );

  // Definisci le colonne usando createColumnHelper
  const columnHelper = createColumnHelper<RepairData>();

  const columns = [
    columnHelper.accessor("repairCode", {
      header: "Codice Scheda",
      cell: (info) => (
        <div className={styles.repairCodeCell}>
          <strong>{info.getValue()}</strong>
        </div>
      ),
    }),
    columnHelper.accessor("repairStatus", {
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
    columnHelper.display({
      id: "customer",
      header: "Cliente",
      cell: (info) => {
        const customer = info.row.original.customer;
        if (!customer) return <span className={styles.noData}>N/A</span>;

        return (
          <div className={styles.customerCell}>
            <div className={styles.customerName}>
              {customer.name || "Cliente sconosciuto"}
            </div>
            <div className={styles.customerContact}>
              {customer.phone && <span>📞 {customer.phone}</span>}
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "device",
      header: "Dispositivo",
      cell: (info) => {
        const device = info.row.original.device;
        if (!device) return <span className={styles.noData}>N/A</span>;

        return (
          <div className={styles.deviceCell}>
            <div className={styles.deviceName}>
              {getDeviceIcon(device.deviceType)} {device.brand} {device.model}
            </div>
            <div className={styles.deviceSerial}>
              S/N: {device.serialNumber}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("faultDeclared", {
      header: "Problema",
      cell: (info) => (
        <div className={styles.problemCell}>
          {info.getValue().length > 50
            ? `${info.getValue().substring(0, 50)}...`
            : info.getValue()}
        </div>
      ),
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
    // Aggiungo anche la colonna per la data di accettazione
    columnHelper.accessor("receivedAt", {
      header: "Data Accettazione",
      cell: (info) => (
        <div className={styles.dateCell}>
          {info.getValue() ? (
            new Date(info.getValue()!).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          ) : (
            <span className={styles.noData}>Non ricevuto</span>
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
    // Colonna Azioni
    columnHelper.display({
      id: "actions",
      header: "Azioni",
      cell: (info) => (
        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionBtn} ${styles.viewBtn}`}
            onClick={() => handleViewRepair(info.row.original)}
            title="Visualizza dettagli"
          >
            <i className="fa-solid fa-eye"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={() => handleEditRepair(info.row.original)}
            title="Modifica riparazione"
          >
            <i className="fa-solid fa-edit"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.printBtn}`}
            onClick={() => handlePrintRepair(info.row.original)}
            title="Stampa scheda"
          >
            <i className="fa-solid fa-print"></i>
          </button>
        </div>
      ),
    }),
  ];

  // Inizializza la tabella con dati filtrati
  const table = useReactTable({
    data: filteredData, // Usa i dati già filtrati
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
      filtered = filtered.filter(
        (item) =>
          item.repairStatus
            ?.toLowerCase()
            .includes(statusFilter.toLowerCase()) ||
          item.repairStatusCode?.toLowerCase() === statusFilter.toLowerCase()
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
          item.repairCode?.toLowerCase().includes(searchTerm) ||
          item.customer?.name?.toLowerCase().includes(searchTerm) ||
          item.device?.brand?.toLowerCase().includes(searchTerm) ||
          item.device?.model?.toLowerCase().includes(searchTerm) ||
          item.device?.serialNumber?.toLowerCase().includes(searchTerm) ||
          item.faultDeclared?.toLowerCase().includes(searchTerm)
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
          const itemDate = item.receivedAt || item.createdAt;
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

  // Carica le riparazioni al mount del componente - SOLO UNA VOLTA
  useEffect(() => {
    fetchRepairs();
  }, []); // Rimuovo le dipendenze per caricare solo all'inizio

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

  // Funzione per recuperare tutte le riparazioni (con range temporale ragionevole)
  const fetchRepairs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const multitenantId = localStorage.getItem("IdCompany");

      if (!multitenantId) {
        throw new Error("ID azienda non trovato");
      }

      // 🔧 Range ultimi 12 mesi: start = 00:00:00 di un anno fa, end = 23:59:59.999 di oggi
      const now = new Date();

      const start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0); // ⬅️ inizio giornata (locale)

      const end = new Date(now);
      end.setHours(23, 59, 59, 999); // ⬅️ fine giornata (locale)

      const defaultStartDate = start.toISOString();
      const defaultEndDate = end.toISOString();

      // Payload allineato al DTO RepairSearchRequestDto
      const searchPayload = {
        multitenantId: multitenantId, // JSON atteso dal BE
        fromDate: defaultStartDate,
        toDate: defaultEndDate, // ⬅️ fine-giorno: include "oggi"
        page: 1,
        pageSize: 2000,
        sortBy: "CreatedAt",
        sortDescending: true,
      };

      console.log("🔍 Caricamento ultimi 12 mesi (giorni completi):", {
        from: defaultStartDate,
        to: defaultEndDate,
        maxRecords: searchPayload.pageSize,
      });

      const response = await fetch(
        "https://localhost:7148/api/repair/search/light",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchPayload),
        }
      );

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        `✅ Caricati ${data.length} record (ultimi 12 mesi, inclusa la giornata di oggi)`
      );

      setAllData(data);
      setFilteredData(data);
      setDataRange({
        from: defaultStartDate.split("T")[0],
        to: defaultEndDate.split("T")[0],
      });
    } catch (error: unknown) {
      console.error("❌ Errore nel caricamento delle riparazioni:", error);
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
  const handleViewRepair = (repair: RepairData) => {
    console.log("Visualizza riparazione:", repair);
  };

  const handleEditRepair = (repair: RepairData) => {
    console.log("Modifica riparazione:", repair);
  };

  const handlePrintRepair = (repair: RepairData) => {
    console.log("Stampa riparazione:", repair);
    alert(`Stampa scheda ${repair.repairCode}`);
  };

  // Funzioni di utilità
  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case "pending":
      case "in attesa":
        return "statusPending";
      case "in progress":
      case "in lavorazione":
        return "statusInProgress";
      case "completed":
      case "completato":
        return "statusCompleted";
      case "delivered":
      case "consegnato":
        return "statusDelivered";
      case "cancelled":
      case "annullato":
        return "statusCancelled";
      default:
        return "statusDefault";
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status.toLowerCase()) {
      case "pending":
      case "in attesa":
        return "⏳";
      case "in progress":
      case "in lavorazione":
        return "🔧";
      case "completed":
      case "completato":
        return "✅";
      case "delivered":
      case "consegnato":
        return "📦";
      case "cancelled":
      case "annullato":
        return "❌";
      default:
        return "📋";
    }
  };

  const getDeviceIcon = (deviceType: string): string => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return "📱";
      case "tv":
        return "📺";
      case "tablet":
        return "📟";
      default:
        return "🔧";
    }
  };

  // Funzione per caricare dati più vecchi
  const loadMoreData = async () => {
    try {
      setLoading(true);
      setError?.(null);

      const token = localStorage.getItem("token");
      const multitenantId = localStorage.getItem("IdCompany");
      if (!multitenantId) throw new Error("ID azienda non trovato");

      // Estendi a 3 anni (giorni completi, locale -> ISO/UTC)
      const now = new Date();

      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 3);
      start.setHours(0, 0, 0, 0); // 00:00:00.000 locale

      const end = new Date(now);
      end.setHours(23, 59, 59, 999); // 23:59:59.999 locale

      const searchPayload = {
        multitenantId,
        fromDate: start.toISOString(), // ISO (UTC)
        toDate: end.toISOString(), // ISO (UTC)
        page: 1,
        pageSize: 5000,
        sortBy: "CreatedAt",
        sortDescending: true,
      };

      console.log("🔍 Caricamento esteso (3 anni):", {
        from: searchPayload.fromDate,
        to: searchPayload.toDate,
      });

      const response = await fetch(
        "https://localhost:7148/api/repair/search/light",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchPayload),
        }
      );

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Caricati ${data.length} record estesi (3 anni)`);

      setAllData(data);
      setFilteredData?.(data); // se usi i filtri locali, aggiorna anche la vista
      setDataRange?.({
        from: fmtDateIT(start),
        to: fmtDateIT(end),
      });
    } catch (err: unknown) {
      console.error("❌ Errore nel caricamento esteso:", err);
      if (err instanceof Error) {
        setError?.(err.message);
      } else {
        setError?.(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // helper per visualizzare DD/MM/YYYY senza dipendenze
  const fmtDateIT = (d: Date) =>
    d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className={styles.schedaHeader}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Roma - Next srl</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>Ricerca Schede</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          {/* === RIEPILOGO GRAFICO & CARDS === */}
          <section className={styles.statsRow}>
            {/* Donut */}
            <div className={styles.statsChartCard}>
              <div className={styles.statsCardHeader}>
                Distribuzione Schede per Stato
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
                        {totalRepairs}
                      </div>
                      <div className={styles.kpiTotalLabel}>Schede Totali</div>
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

            {/* Cards di riepilogo (prime 4 categorie) */}
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

          {/* Tabella Riparazioni */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>🔍 Ricerca Schede di Riparazione</h3>
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
                      ? `Totale: ${allData.length} schede`
                      : `Filtrate: ${filteredData.length}/${allData.length} schede`}
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
                  <option value="Received">📥 Ricevuto</option>
                  <option value="Pending">⏳ In Attesa</option>
                  <option value="InProgress">🔧 In Lavorazione</option>
                  <option value="Completed">✅ Completato</option>
                  <option value="Delivered">📦 Consegnato</option>
                  <option value="Cancelled">❌ Annullato</option>
                </select>

                {/* Nuovo Filtro Temporale */}
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
                    placeholder="Cerca per codice, cliente, dispositivo..."
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
                <span>Caricamento riparazioni...</span>
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
                <h4>Nessuna riparazione trovata</h4>
                <p>
                  {allData.length > 0
                    ? "Non ci sono riparazioni che corrispondono ai criteri di ricerca selezionati."
                    : "Non ci sono riparazioni disponibili."}
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
                    di <strong>{filteredData.length}</strong> riparazioni
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
    </div>
  );
};

export default RicercaSchede;
