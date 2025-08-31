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

interface RepairDetailModal extends RepairData {
  device?: {
    deviceId: string;
    brand: string;
    model: string;
    serialNumber: string;
    deviceType: string;
    color?: string;
    purchaseDate?: string;
    receiptNumber?: string;
    retailer?: string;
    notes?: string;
    createdAt: string;
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
  hasDiagnostic: boolean;
  diagnosticSummary?: string;
  diagnosticDetails?: {
    deviceInfo?: boolean;
    applePay?: boolean;
    battery?: boolean;
    bluetooth?: boolean;
    camera?: boolean;
    cellular?: boolean;
    clock?: boolean;
    sim?: boolean;
    faceId?: boolean;
    scanner?: boolean;
    magSafe?: boolean;
    sensors?: boolean;
    services?: boolean;
    software?: boolean;
    system?: boolean;
    wiFi?: boolean;
    rfCellular?: boolean;
    wirelessProblem?: boolean;
    // Campi diagnostica estesa
    telefonoSpento?: boolean;
    vetroRotto?: boolean;
    touchscreen?: boolean;
    lcd?: boolean;
    frameScollato?: boolean;
    dockDiRicarica?: boolean;
    backCover?: boolean;
    telaio?: boolean;
    tastiVolumeMuto?: boolean;
    tastoStandbyPower?: boolean;
    microfonoChiamate?: boolean;
    microfonoAmbientale?: boolean;
    altoparlantteChiamata?: boolean;
    speakerBuzzer?: boolean;
    vetroFotocameraPosteriore?: boolean;
    tastoHome?: boolean;
    touchId?: boolean;
    chiamata?: boolean;
    vetroPosteriore?: boolean;
  };
}

// Estendi l'interfaccia RepairDetailModal esistente aggiungendo questi campi:
interface RepairDetailModalExtended extends RepairDetailModal {
  incomingTest?: IncomingTestDto;
  exitTest?: ExitTestDto;
}

interface IncomingTestDto {
  id?: number;
  repairId?: string;
  companyId: string;
  multitenantId: string;
  // Test base (gruppi FE)
  deviceInfo?: boolean;
  applePay?: boolean;
  battery?: boolean;
  bluetooth?: boolean;
  camera?: boolean;
  cellular?: boolean;
  clock?: boolean;
  sim?: boolean;
  faceId?: boolean;
  scanner?: boolean; // alias per TouchId
  magSafe?: boolean;
  sensors?: boolean;
  services?: boolean;
  software?: boolean;
  system?: boolean;
  wiFi?: boolean;
  rfCellular?: boolean;
  wirelessProblem?: boolean;

  // Test specifici hardware (campi DB diretti)
  telefonoSpento?: boolean;
  vetroRotto?: boolean;
  touchscreen?: boolean;
  lcd?: boolean;
  frameScollato?: boolean;
  dockDiRicarica?: boolean;
  backCover?: boolean;
  telaio?: boolean;
  tastiVolumeMuto?: boolean;
  tastoStandbyPower?: boolean;
  microfonoChiamate?: boolean;
  microfonoAmbientale?: boolean;
  altoparlantteChiamata?: boolean;
  speakerBuzzer?: boolean;
  vetroFotocameraPosteriore?: boolean;
  tastoHome?: boolean;
  touchId?: boolean;
  chiamata?: boolean;
  vetroPosteriore?: boolean;
}

interface ExitTestDto {
  id?: number;
  repairId?: string;
  companyId: string;
  multitenantId: string;
  vetroRotto?: boolean;
  touchscreen?: boolean;
  lcd?: boolean;
  frameScollato?: boolean;
  batteria?: boolean;
  dockDiRicarica?: boolean;
  backCover?: boolean;
  telaio?: boolean;
  tastiVolumeMuto?: boolean;
  tastoStandbyPower?: boolean;
  sensoreDiProssimita?: boolean;
  microfonoChiamate?: boolean;
  microfonoAmbientale?: boolean;
  altoparlanteChiamata?: boolean;
  speakerBuzzer?: boolean;
  vetroFotocameraPosteriore?: boolean;
  fotocameraPosteriore?: boolean;
  fotocameraAnteriore?: boolean;
  tastoHome?: boolean;
  touchId?: boolean;
  faceId?: boolean;
  wiFi?: boolean;
  rete?: boolean;
  chiamata?: boolean;
  schedaMadre?: boolean;
  vetroPosteriore?: boolean;
}

const RicercaSchede: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const navigate = useNavigate();

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

  // Nuovi stati per dettagli riparazione
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRepairDetail, setSelectedRepairDetail] =
    useState<RepairDetailModal | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Nuovi stati per dettagli riparazione estesi (test ingresso/uscita)
  const [incomingTestLoading, setIncomingTestLoading] = useState(false);
  const [exitTestLoading, setExitTestLoading] = useState(false);
  const [incomingTestData, setIncomingTestData] =
    useState<IncomingTestDto | null>(null);
  const [exitTestData, setExitTestData] = useState<ExitTestDto | null>(null);

  // --- STATO MODALE STAMPA ---
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printRepair, setPrintRepair] = useState<RepairData | null>(null);

  // --- DATI AZIENDALI ---
  // Legge da sessionStorage se presente, altrimenti usa i fallback.
  // La guardia "typeof window" evita problemi in build/SSR.
  const companyName =
    (typeof window !== "undefined" && sessionStorage.getItem("companyName")) ||
    "CLINICA iPHONE STORE";
  const companyAddr =
    (typeof window !== "undefined" &&
      sessionStorage.getItem("companyAddress")) ||
    "Via Prova 1 – 73100 Lecce (LE)";
  const companyVat =
    (typeof window !== "undefined" && sessionStorage.getItem("companyVat")) ||
    "P.IVA 01234567890";
  const companyPhone =
    (typeof window !== "undefined" && sessionStorage.getItem("companyPhone")) ||
    "0832 123456";

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
  const handleViewRepair = async (repair: RepairData) => {
    console.log("Visualizza riparazione:", repair);

    setDetailLoading(true);
    setDetailError(null);
    setShowDetailModal(true);
    setIncomingTestData(null);
    setExitTestData(null);

    try {
      // Carica i dettagli della riparazione
      const response = await fetch(
        `https://localhost:7148/api/repair/${repair.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const detailData = await response.json();
        setSelectedRepairDetail(detailData);

        // Carica i dati diagnostici in parallelo
        await loadDiagnosticData(detailData.repairId || repair.repairId);
      } else {
        throw new Error("Errore nel caricamento dei dettagli");
      }
    } catch (error) {
      console.error("Errore nel caricamento dettagli riparazione:", error);
      setDetailError("Impossibile caricare i dettagli della riparazione");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRepairDetail(null);
    setDetailError(null);
    setIncomingTestData(null);
    setExitTestData(null);
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
      case "pending":
      case "in attesa":
        return styles.statusPending;
      case "in progress":
      case "in lavorazione":
        return styles.statusInProgress;
      case "completed":
      case "completato":
        return styles.statusCompleted;
      case "delivered":
      case "consegnato":
        return styles.statusDelivered;
      case "cancelled":
      case "annullato":
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const handleEditRepair = (repair: RepairData) => {
    // Passo sia nello state di React Router che in query string (robusto ai refresh)
    const rid = repair.repairId; // GUID usato dai nuovi endpoint
    const id = repair.id; // id numerico interno (usato dal dettaglio)

    navigate(`/modifica-schede?rid=${encodeURIComponent(rid)}&id=${id}`, {
      state: {
        repairGuid: rid,
        id,
        repairCode: repair.repairCode, // utile per header pagina
      },
    });
  };

  const handlePrintRepair = (repair: RepairData) => {
    setPrintRepair(repair);
    setShowPrintModal(true);
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

  const loadDiagnosticData = async (repairId: string) => {
    const token = localStorage.getItem("token");

    if (!token) return;

    // Carica diagnostica in ingresso
    setIncomingTestLoading(true);
    try {
      const incomingResponse = await fetch(
        `https://localhost:7148/api/repair/${repairId}/incoming-test`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (incomingResponse.ok) {
        const incomingData = await incomingResponse.json();
        setIncomingTestData(incomingData);
      } else if (incomingResponse.status !== 404) {
        console.error("Errore nel caricamento diagnostica in ingresso");
      }
    } catch (error) {
      console.error("Errore nel caricamento diagnostica in ingresso:", error);
    } finally {
      setIncomingTestLoading(false);
    }

    // Carica diagnostica in uscita
    setExitTestLoading(true);
    try {
      const exitResponse = await fetch(
        `https://localhost:7148/api/repair/${repairId}/exit-test`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (exitResponse.ok) {
        const exitData = await exitResponse.json();
        setExitTestData(exitData);
      } else if (exitResponse.status !== 404) {
        console.error("Errore nel caricamento diagnostica in uscita");
      }
    } catch (error) {
      console.error("Errore nel caricamento diagnostica in uscita:", error);
    } finally {
      setExitTestLoading(false);
    }
  };

  // Mappa alias noti dalla UI al payload restituito dal BE
  const mapAliasKey = (key: string): string => {
    // UI -> BE
    if (key === "scanner") return "touchId"; // alias
    if (key === "altoparlanteChiamata") return "altoparlantteChiamata"; // sicurezza: doppia "tt"
    return key;
  };

  // Converte il valore in boolean coerente (accetta true/false, 1/0, "true"/"false")
  const asBool = (obj: any, key: string): boolean | null => {
    if (!obj) return null;
    const realKey = mapAliasKey(key);
    const v = obj[realKey];
    if (v === true || v === false) return v;
    if (v === 1 || v === 0) return Boolean(v);
    if (v === "true") return true;
    if (v === "false") return false;
    return null; // non presente o non definito
  };

  // Ritorna true se la chiave esiste ed è impostata (true o false)
  const isSet = (obj: any, key: string) => asBool(obj, key) !== null;

  // Funzione per renderizzare i test diagnostici - VERSIONE CORRETTA
  const renderDiagnosticTests = (
    tests: IncomingTestDto | ExitTestDto | null,
    title: string,
    isLoading: boolean
  ) => {
    if (isLoading) {
      return (
        <div className={styles.repairDetailSection}>
          <h3>🔬 {title}</h3>
          <div className={styles.repairDetailLoading}>
            <div className={styles.loadingSpinner}></div>
            <span>Caricamento diagnostica...</span>
          </div>
        </div>
      );
    }

    if (!tests) {
      return (
        <div className={styles.repairDetailSection}>
          <h3>🔬 {title}</h3>
          <div className={styles.diagnosticNotAvailable}>
            <p>Diagnostica non disponibile per questa riparazione.</p>
          </div>
        </div>
      );
    }

    // Raggruppa i test per categoria
    const testCategories = [
      {
        name: "Test Base Sistema",
        items: [
          { key: "deviceInfo", label: "Info Dispositivo", icon: "📱" },
          { key: "battery", label: "Batteria", icon: "🔋" },
          { key: "system", label: "Sistema", icon: "⚙️" },
          { key: "software", label: "Software", icon: "💻" },
          { key: "services", label: "Servizi", icon: "🔧" },
        ],
      },
      {
        name: "Connettività",
        items: [
          { key: "wiFi", label: "Wi-Fi", icon: "📶" },
          { key: "bluetooth", label: "Bluetooth", icon: "🔵" },
          { key: "cellular", label: "Rete Cellulare", icon: "📱" },
          { key: "rfCellular", label: "RF Cellulare", icon: "📡" },
          { key: "sim", label: "SIM", icon: "🗃️" },
        ],
      },
      {
        name: "Hardware Avanzato",
        items: [
          { key: "camera", label: "Fotocamera", icon: "📷" },
          { key: "faceId", label: "Face ID", icon: "😊" },
          { key: "touchId", label: "Touch ID", icon: "👆" },
          { key: "scanner", label: "Scanner", icon: "🔍" },
          { key: "sensors", label: "Sensori", icon: "🎯" },
          { key: "magSafe", label: "MagSafe", icon: "🧲" },
          { key: "applePay", label: "Apple Pay", icon: "💳" },
        ],
      },
      {
        name: "Componenti Fisici",
        items: [
          { key: "vetroRotto", label: "Vetro Rotto", icon: "📸" },
          { key: "touchscreen", label: "Touchscreen", icon: "👆" },
          { key: "lcd", label: "Display LCD", icon: "📺" },
          { key: "frameScollato", label: "Frame Scollato", icon: "📱" },
          { key: "backCover", label: "Back Cover", icon: "🔄" },
          { key: "telaio", label: "Telaio", icon: "🗂️" },
        ],
      },
      {
        name: "Audio e Controlli",
        items: [
          { key: "microfonoChiamate", label: "Microfono Chiamate", icon: "🎤" },
          {
            key: "microfonoAmbientale",
            label: "Microfono Ambientale",
            icon: "🎙️",
          },
          { key: "altoparlantteChiamata", label: "Altoparlante", icon: "🔊" },
          { key: "speakerBuzzer", label: "Speaker/Buzzer", icon: "📢" },
          { key: "tastiVolumeMuto", label: "Tasti Volume/Muto", icon: "🔘" },
          { key: "tastoStandbyPower", label: "Tasto Power", icon: "⏻" },
          { key: "tastoHome", label: "Tasto Home", icon: "🏠" },
        ],
      },
    ];

    return (
      <div className={styles.repairDetailSection}>
        <h3>🔬 {title}</h3>

        <div className={styles.diagnosticCategoriesGrid}>
          {testCategories.map((category) => {
            const categoryTests = category.items.filter(
              (item) => asBool(tests, item.key) !== null // mostra sia true che false
            );

            if (categoryTests.length === 0) return null;

            return (
              <div key={category.name} className={styles.diagnosticCategory}>
                <h4 className={styles.diagnosticCategoryTitle}>
                  {category.name}
                </h4>
                <div className={styles.diagnosticGrid}>
                  {categoryTests.map((item) => {
                    const v = asBool(tests, item.key);
                    const isOk = v === true;
                    return (
                      <div
                        key={item.key}
                        className={`${styles.diagnosticItem} ${
                          isOk
                            ? styles.diagnosticItemOk
                            : styles.diagnosticItemKo
                        }`}
                      >
                        <span className={styles.diagnosticIcon}>
                          {item.icon}
                        </span>
                        <span className={styles.diagnosticLabel}>
                          {item.label}
                        </span>
                        <span
                          className={`${styles.diagnosticStatus} ${
                            isOk ? styles.diagnosticOk : styles.diagnosticKo
                          }`}
                        >
                          {isOk ? "✓" : "✕"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mostra tutti i test che sono stati eseguiti */}
        {(() => {
          const ALL_KEYS = testCategories.flatMap((c) =>
            c.items.map((i) => i.key)
          );
          const vals = ALL_KEYS.map((k) => asBool(tests, k)).filter(
            (v) => v !== null
          ) as boolean[];
          const ok = vals.filter((v) => v === true).length;
          const ko = vals.filter((v) => v === false).length;
          return (
            <div className={styles.diagnosticSummaryStats}>
              <div className={styles.diagnosticStat}>
                <span className={styles.diagnosticStatNumber}>{ok}</span>
                <span className={styles.diagnosticStatLabel}>
                  Test Eseguiti
                </span>
              </div>
              <div className={styles.diagnosticStat}>
                <span className={styles.diagnosticStatNumber}>{ko}</span>
                <span className={styles.diagnosticStatLabel}>Test Falliti</span>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

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
      {/* Modal Dettagli Riparazione */}
      {showDetailModal && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div
            className={styles.repairDetailModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className={styles.repairDetailHeader}>
              <div className={styles.repairDetailTitleSection}>
                <h2>📋 Dettagli Riparazione</h2>
                {selectedRepairDetail && (
                  <div className={styles.repairDetailCodeAndStatus}>
                    <span className={styles.repairDetailCode}>
                      {selectedRepairDetail.repairCode}
                    </span>
                    <span
                      className={`${styles.statusBadge} ${getStatusBadgeClass(
                        selectedRepairDetail.repairStatus
                      )}`}
                    >
                      {getStatusIcon(selectedRepairDetail.repairStatus)}{" "}
                      {selectedRepairDetail.repairStatus}
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

              {selectedRepairDetail && !detailLoading && !detailError && (
                <div className={styles.repairDetailContent}>
                  {/* Timeline Stati */}
                  <div className={styles.repairDetailSection}>
                    <h3>🕒 Timeline Riparazione</h3>
                    <div className={styles.repairTimeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineIcon}>📝</div>
                        <div className={styles.timelineContent}>
                          <strong>Creazione</strong>
                          <span>
                            {formatDetailDate(selectedRepairDetail.createdAt)}
                          </span>
                        </div>
                      </div>

                      {selectedRepairDetail.receivedAt && (
                        <div className={styles.timelineItem}>
                          <div className={styles.timelineIcon}>📥</div>
                          <div className={styles.timelineContent}>
                            <strong>Ricevuto</strong>
                            <span>
                              {formatDetailDate(
                                selectedRepairDetail.receivedAt
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedRepairDetail.startedAt && (
                        <div className={styles.timelineItem}>
                          <div className={styles.timelineIcon}>🔧</div>
                          <div className={styles.timelineContent}>
                            <strong>Iniziato</strong>
                            <span>
                              {formatDetailDate(selectedRepairDetail.startedAt)}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedRepairDetail.completedAt && (
                        <div className={styles.timelineItem}>
                          <div className={styles.timelineIcon}>✅</div>
                          <div className={styles.timelineContent}>
                            <strong>Completato</strong>
                            <span>
                              {formatDetailDate(
                                selectedRepairDetail.completedAt
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedRepairDetail.deliveredAt && (
                        <div className={styles.timelineItem}>
                          <div className={styles.timelineIcon}>📦</div>
                          <div className={styles.timelineContent}>
                            <strong>Consegnato</strong>
                            <span>
                              {formatDetailDate(
                                selectedRepairDetail.deliveredAt
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layout a due colonne */}
                  <div className={styles.repairDetailColumns}>
                    {/* Colonna sinistra */}
                    <div className={styles.repairDetailLeftColumn}>
                      {/* Dati Cliente */}
                      {selectedRepairDetail.customer && (
                        <div className={styles.repairDetailSection}>
                          <h3>👤 Cliente</h3>
                          <div className={styles.repairDetailGrid}>
                            <div className={styles.repairDetailField}>
                              <label>Nome:</label>
                              <span>
                                {selectedRepairDetail.customer.name || "N/A"}
                              </span>
                            </div>
                            <div className={styles.repairDetailField}>
                              <label>Telefono:</label>
                              <span>
                                {selectedRepairDetail.customer.phone || "N/A"}
                              </span>
                            </div>
                            <div className={styles.repairDetailField}>
                              <label>Email:</label>
                              <span>
                                {selectedRepairDetail.customer.email || "N/A"}
                              </span>
                            </div>
                            <div className={styles.repairDetailField}>
                              <label>Indirizzo:</label>
                              <span>
                                {selectedRepairDetail.customer.address
                                  ? `${
                                      selectedRepairDetail.customer.address
                                    }, ${
                                      selectedRepairDetail.customer.city || ""
                                    } (${
                                      selectedRepairDetail.customer.province ||
                                      ""
                                    })`
                                  : "N/A"}
                              </span>
                            </div>
                            {selectedRepairDetail.customer.fiscalCode && (
                              <div className={styles.repairDetailField}>
                                <label>Codice Fiscale:</label>
                                <span>
                                  {selectedRepairDetail.customer.fiscalCode}
                                </span>
                              </div>
                            )}
                            {selectedRepairDetail.customer.vatNumber && (
                              <div className={styles.repairDetailField}>
                                <label>P.IVA:</label>
                                <span>
                                  {selectedRepairDetail.customer.vatNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dati Dispositivo */}
                      {selectedRepairDetail.device && (
                        <div className={styles.repairDetailSection}>
                          <h3>
                            {getDeviceIcon(
                              selectedRepairDetail.device.deviceType
                            )}{" "}
                            Dispositivo
                          </h3>
                          <div className={styles.repairDetailGrid}>
                            <div className={styles.repairDetailField}>
                              <label>Marca e Modello:</label>
                              <span>
                                {selectedRepairDetail.device.brand}{" "}
                                {selectedRepairDetail.device.model}
                              </span>
                            </div>
                            <div className={styles.repairDetailField}>
                              <label>Numero Seriale:</label>
                              <span className={styles.serialNumber}>
                                {selectedRepairDetail.device.serialNumber}
                              </span>
                            </div>
                            <div className={styles.repairDetailField}>
                              <label>Tipo:</label>
                              <span>
                                {selectedRepairDetail.device.deviceType}
                              </span>
                            </div>
                            {selectedRepairDetail.device.color && (
                              <div className={styles.repairDetailField}>
                                <label>Colore:</label>
                                <span>{selectedRepairDetail.device.color}</span>
                              </div>
                            )}
                            {selectedRepairDetail.device.purchaseDate && (
                              <div className={styles.repairDetailField}>
                                <label>Data Acquisto:</label>
                                <span>
                                  {formatDetailDate(
                                    selectedRepairDetail.device.purchaseDate
                                  )}
                                </span>
                              </div>
                            )}
                            {selectedRepairDetail.device.retailer && (
                              <div className={styles.repairDetailField}>
                                <label>Rivenditore:</label>
                                <span>
                                  {selectedRepairDetail.device.retailer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Colonna destra */}
                    <div className={styles.repairDetailRightColumn}>
                      {/* Dettagli Riparazione */}
                      <div className={styles.repairDetailSection}>
                        <h3>🔧 Riparazione</h3>
                        <div className={styles.repairDetailGrid}>
                          <div className={styles.repairDetailField}>
                            <label>Problema Dichiarato:</label>
                            <span>{selectedRepairDetail.faultDeclared}</span>
                          </div>
                          {selectedRepairDetail.repairAction && (
                            <div className={styles.repairDetailField}>
                              <label>Azione di Riparazione:</label>
                              <span>{selectedRepairDetail.repairAction}</span>
                            </div>
                          )}
                          {selectedRepairDetail.technicianName && (
                            <div className={styles.repairDetailField}>
                              <label>Tecnico Assegnato:</label>
                              <span>{selectedRepairDetail.technicianName}</span>
                            </div>
                          )}
                          {selectedRepairDetail.technicianCode && (
                            <div className={styles.repairDetailField}>
                              <label>Codice Tecnico:</label>
                              <span>{selectedRepairDetail.technicianCode}</span>
                            </div>
                          )}
                          {selectedRepairDetail.notes && (
                            <div className={styles.repairDetailField}>
                              <label>Note:</label>
                              <span>{selectedRepairDetail.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Diagnostica */}

                      {/* Diagnostica In Ingresso */}
                      {renderDiagnosticTests(
                        incomingTestData,
                        "Diagnostica In Ingresso",
                        incomingTestLoading
                      )}

                      {/* Diagnostica In Uscita */}
                      {renderDiagnosticTests(
                        exitTestData,
                        "Diagnostica In Uscita",
                        exitTestLoading
                      )}
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

      {showPrintModal && printRepair && (
        <div
          className={styles.accOverlay}
          onClick={(e) =>
            e.target === e.currentTarget &&
            (setShowPrintModal(false), setPrintRepair(null))
          }
        >
          <div className={styles.accModal} onClick={(e) => e.stopPropagation()}>
            {/* AREA CHE SI STAMPA */}
            <div className={styles.accSheet}>
              {/* Header professionale con logo */}
              <div className={styles.accHeaderPro}>
                <div className={styles.accLogoSection}>
                  <div className={styles.accLogo}>
                    <div className={styles.accLogoIcon}>🏥</div>
                    <div className={styles.accLogoText}>
                      <div className={styles.accCompanyName}>
                        CLINICA iPHONE
                      </div>
                      <div className={styles.accCompanyTagline}>
                        ASSISTENZA TECNICA AUTORIZZATA
                      </div>
                    </div>
                  </div>
                  <div className={styles.accCompanyDetails}>
                    <div>{companyName}</div>
                    <div>Città - AZIENDA</div>
                    <div>{companyAddr}</div>
                    <div>Tel. {companyPhone}</div>
                    <div>{companyVat}</div>
                  </div>
                </div>
                <div className={styles.accDocSection}>
                  <h1 className={styles.accDocTitle}>
                    Autorizzazione al lavoro
                  </h1>
                  <div className={styles.accDocInfo}>
                    <div>
                      <strong>Tipo di riparazione:</strong> Gestita in clinica
                    </div>
                    <div>
                      <strong>Gestita da dipendente:</strong> xxxx
                    </div>
                    <div>
                      <strong>Numero di Riparazione:</strong>{" "}
                      {printRepair.repairCode}
                    </div>
                    <div>
                      <strong>Data:</strong>{" "}
                      {new Date(printRepair.createdAt).toLocaleDateString(
                        "it-IT"
                      )}{" "}
                      {new Date(printRepair.createdAt).toLocaleTimeString(
                        "it-IT",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <hr className={styles.accDivider} />

              {/* Dati cliente / dispositivo con layout migliorato */}
              <div className={styles.accInfoGrid}>
                <div className={styles.accInfoSection}>
                  <div className={styles.accSectionTitle}>
                    INFORMAZIONI DEL CLIENTE
                  </div>
                  <div className={styles.accInfoRows}>
                    <div className={styles.accInfoRow}>
                      <span className={styles.accLabel}>Cliente:</span>
                      <span className={styles.accValue}>
                        {printRepair.customer?.name || "Non specificato"}
                      </span>
                    </div>
                    <div className={styles.accInfoRow}>
                      <span className={styles.accLabel}>Telefono:</span>
                      <span className={styles.accValue}>
                        {printRepair.customer?.phone || "Non specificato"}
                      </span>
                    </div>
                    <div className={styles.accInfoRow}>
                      <span className={styles.accLabel}>Email:</span>
                      <span className={styles.accValue}>
                        {printRepair.customer?.email || "Non specificato"}
                      </span>
                    </div>
                    <div className={styles.accInfoRow}>
                      <span className={styles.accLabel}>Indirizzo:</span>
                      <span className={styles.accValue}>
                        {[
                          printRepair.customer?.address,
                          printRepair.customer?.postalCode,
                          printRepair.customer?.city,
                          printRepair.customer?.province,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Non specificato"}
                      </span>
                    </div>
                    {printRepair.customer?.fiscalCode && (
                      <div className={styles.accInfoRow}>
                        <span className={styles.accLabel}>Codice Fiscale:</span>
                        <span className={styles.accValue}>
                          {printRepair.customer.fiscalCode}
                        </span>
                      </div>
                    )}
                    {printRepair.customer?.vatNumber && (
                      <div className={styles.accInfoRow}>
                        <span className={styles.accLabel}>P.IVA:</span>
                        <span className={styles.accValue}>
                          {printRepair.customer.vatNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.accInfoSection}>
                  <div className={styles.accSectionTitle}>
                    DATI DEL DISPOSITIVO
                  </div>
                  <div className={styles.accInfoRows}>
                    <div className={styles.accInfoRow}>
                      <span className={styles.accLabel}>Marca e Modello:</span>
                      <span className={styles.accValue}>
                        {printRepair.device?.brand} {printRepair.device?.model}
                      </span>
                    </div>
                    <div className={styles.accInfoRow}>
                      <span className={styles.accLabel}>Numero Seriale:</span>
                      <span className={styles.accValue}>
                        {printRepair.device?.serialNumber || "Non specificato"}
                      </span>
                    </div>
                    <div className={styles.accInfoRow}>
                      <span className={styles.accLabel}>Tipologia:</span>
                      <span className={styles.accValue}>
                        {printRepair.device?.deviceType || "Non specificato"}
                      </span>
                    </div>
                    <div className={styles.accInfoRow}>
                      <span className={styles.accLabel}>Stato:</span>
                      <span className={styles.accValue}>
                        {printRepair.repairStatus}
                      </span>
                    </div>
                    {printRepair.technicianName && (
                      <div className={styles.accInfoRow}>
                        <span className={styles.accLabel}>
                          Tecnico Assegnato:
                        </span>
                        <span className={styles.accValue}>
                          {printRepair.technicianName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descrizione problema */}
              <div className={styles.accProblemSection}>
                <div className={styles.accSectionTitle}>
                  DESCRIZIONE DEL PROBLEMA
                </div>
                <div className={styles.accProblemText}>
                  {printRepair.faultDeclared || "Nessuna descrizione fornita"}
                </div>
                {printRepair.notes && (
                  <div className={styles.accNotesText}>
                    <strong>Note aggiuntive:</strong> {printRepair.notes}
                  </div>
                )}
              </div>

              {/* Tabella preventivo */}
              <div className={styles.accTableSection}>
                <div className={styles.accSectionTitle}>PREVENTIVO</div>
                <table className={styles.accTable}>
                  <thead>
                    <tr>
                      <th className={styles.accTableHeader}>
                        Descrizione Intervento
                      </th>
                      <th
                        className={styles.accTableHeader}
                        style={{ width: "80px", textAlign: "center" }}
                      >
                        Q.tà
                      </th>
                      <th
                        className={styles.accTableHeader}
                        style={{ width: "120px", textAlign: "right" }}
                      >
                        Importo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.accTableCell}>
                        Diagnosi e preventivo riparazione
                      </td>
                      <td
                        className={styles.accTableCell}
                        style={{ textAlign: "center" }}
                      >
                        1
                      </td>
                      <td
                        className={styles.accTableCell}
                        style={{ textAlign: "right" }}
                      >
                        € 0,00
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.accTableCell} colSpan={2}>
                        <strong>TOTALE</strong>
                      </td>
                      <td
                        className={styles.accTableCell}
                        style={{ textAlign: "right" }}
                      >
                        <strong>€ 0,00</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Clausole complete privacy e servizio */}
              <div className={styles.accPrivacySection}>
                <div className={styles.accPrivacyTitle}>
                  AUTORIZZAZIONE DEL SERVIZIO DI ASSISTENZA
                </div>

                <div className={styles.accPrivacyText}>
                  <p>
                    Accetto che i Termini e condizioni di riparazione riportati
                    sul retro di questa pagina verranno applicati al servizio di
                    assistenza per il prodotto sopra indicato, che, poiché
                    l'espletamento del servizio di assistenza può comportare
                    l'accidentale perdita dei dati, sarà responsabilità
                    esclusiva mia quella di backed archiviare i dati per
                    recuperarli in caso di necessità e che quindi CLINICA IPHONE
                    non è responsabile dell'eventuale perdita o danneggiamento
                    dei dati archiviati sul prodotto che i componenti potranno
                    essere riparati o sostituiti con componenti nuovi o
                    ricondizionati e che gli eventuali componenti difettosi
                    rimossi dal prodotto non potranno essere ritirati o
                    recuperati dal Cliente.
                  </p>

                  <p>
                    Ai sensi ed in conformità degli artt. 13 Digs 196/03 e 14
                    del GDPR regolamento UE 2016/679, per il trattamento dei
                    dati personali, i dati raccolti con la presente scheda sono
                    destinati ad essere archiviati (sia manualmente su supporti
                    cartacei sia mediante l'utilizzo di moderni sistemi
                    informatici su supporti magnetici) nel pieno rispetto dei
                    dettami normativi vigenti e potranno essere oggetto di
                    trattamento solo ed esclusivamente da parte di soggetti
                    appositamente nominati incaricati ai sensi del citato
                    Decreto legislativo. I dati medesimi saranno utilizzati
                    unicamente per gli scopi indicati nella presente scheda e
                    non saranno utilizzati per ulteriori comunicazioni o per usi
                    diversi dal trattamento della "riparazione" e SWIPE UP
                    (DITTA INDIVIDUALE) - NEXT S.R.L. FRANCHISING. Responsabile
                    del Trattamento è SWIPE UP (DITTA INDIVIDUALE) - NEXT S.R.L.
                    FRANCHISING. Con la sottoscrizione della presente,
                    l'interessato esprime libero consenso ai trattamenti
                    indicati.
                  </p>
                </div>

                <div className={styles.accConsentSection}>
                  <div className={styles.accConsentTitle}>
                    COPIA DI ASSISTENZA
                  </div>
                  <div className={styles.accSignatureArea}>
                    <div className={styles.accSignatureBox}>
                      <div className={styles.accSignatureLabel}>
                        Firma per accettazione
                      </div>
                      <div className={styles.accSignatureLine}></div>
                    </div>
                    <div className={styles.accDateBox}>
                      <div className={styles.accDateLabel}>
                        Data: {new Date().toLocaleDateString("it-IT")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con informazioni legali */}
              <div className={styles.accFooter}>
                <div className={styles.accFooterText}>
                  Documento generato automaticamente dal sistema di gestione
                  riparazioni - {companyName}
                </div>
              </div>
            </div>

            {/* Azioni (non stampate) */}
            <div className={styles.accActions}>
              <button
                className={styles.accBtnSecondary}
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintRepair(null);
                }}
              >
                ✕ Chiudi
              </button>
              <button
                className={styles.accBtnPrimary}
                onClick={() => window.print()}
              >
                🖨️ Stampa Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RicercaSchede;
