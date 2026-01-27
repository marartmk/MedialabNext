import React, { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Calendar, Clock, ChevronDown } from "lucide-react";
import styles from "./ricerca-fatture.module.css";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Interfacce TypeScript
interface Invoice {
  id: number;
  invoiceNumber: string;
  issueDateTime: string;
  type: "LAB" | "Ordini Shop" | "Royalties/Marketing" | "Spedizioni" | "Pagamenti dilazionati";
  description: string;
  dueDateTime: string;
  status: "Non pagato" | "In attesa" | "Pagato";
  totalAmount: number;
  pdfUrl?: string;
}

// Interfaccia per il filtro temporale
interface DateFilter {
  type: "none" | "today" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}

// Dati mock
const MOCK_INVOICES: Invoice[] = [
  {
    id: 1,
    invoiceNumber: "2000/22",
    issueDateTime: "2022-12-18T09:31:00",
    type: "LAB",
    description: "Servizi laboratorio riparazioni",
    dueDateTime: "2023-01-08T09:31:00",
    status: "Non pagato",
    totalAmount: 399.00,
    pdfUrl: "#",
  },
  {
    id: 2,
    invoiceNumber: "2001/22",
    issueDateTime: "2022-12-18T09:31:00",
    type: "Ordini Shop",
    description: "Ordine ricambi e accessori",
    dueDateTime: "2023-01-08T09:31:00",
    status: "Non pagato",
    totalAmount: 299.00,
    pdfUrl: "#",
  },
  {
    id: 3,
    invoiceNumber: "2002/22",
    issueDateTime: "2022-12-18T09:31:00",
    type: "Royalties/Marketing",
    description: "Fee royalties trimestrale",
    dueDateTime: "2023-01-08T09:31:00",
    status: "Non pagato",
    totalAmount: 435.00,
    pdfUrl: "#",
  },
  {
    id: 4,
    invoiceNumber: "2003/22",
    issueDateTime: "2022-12-18T09:31:00",
    type: "Spedizioni",
    description: "Costi spedizione materiali",
    dueDateTime: "2023-01-08T09:31:00",
    status: "Non pagato",
    totalAmount: 40.00,
    pdfUrl: "#",
  },
  {
    id: 5,
    invoiceNumber: "2004/22",
    issueDateTime: "2022-12-18T09:31:00",
    type: "Pagamenti dilazionati",
    description: "Rata pagamento dilazionato",
    dueDateTime: "2023-01-08T09:31:00",
    status: "Non pagato",
    totalAmount: 199.00,
    pdfUrl: "#",
  },
  {
    id: 6,
    invoiceNumber: "2005/22",
    issueDateTime: "2022-12-18T09:31:00",
    type: "Pagamenti dilazionati",
    description: "Rata pagamento dilazionato",
    dueDateTime: "2023-01-08T09:31:00",
    status: "Non pagato",
    totalAmount: 199.00,
    pdfUrl: "#",
  },
  {
    id: 7,
    invoiceNumber: "2006/22",
    issueDateTime: "2022-11-15T10:00:00",
    type: "LAB",
    description: "Servizi laboratorio riparazioni",
    dueDateTime: "2022-12-15T10:00:00",
    status: "Pagato",
    totalAmount: 520.00,
    pdfUrl: "#",
  },
  {
    id: 8,
    invoiceNumber: "2007/22",
    issueDateTime: "2022-11-20T14:30:00",
    type: "Ordini Shop",
    description: "Ordine ricambi e accessori",
    dueDateTime: "2022-12-20T14:30:00",
    status: "In attesa",
    totalAmount: 150.00,
    pdfUrl: "#",
  },
  {
    id: 9,
    invoiceNumber: "2008/22",
    issueDateTime: "2022-10-05T11:00:00",
    type: "Spedizioni",
    description: "Costi spedizione materiali",
    dueDateTime: "2022-11-05T11:00:00",
    status: "Pagato",
    totalAmount: 75.00,
    pdfUrl: "#",
  },
  {
    id: 10,
    invoiceNumber: "2009/22",
    issueDateTime: "2022-12-01T09:00:00",
    type: "Royalties/Marketing",
    description: "Fee royalties trimestrale",
    dueDateTime: "2023-01-01T09:00:00",
    status: "Non pagato",
    totalAmount: 890.00,
    pdfUrl: "#",
  },
  {
    id: 11,
    invoiceNumber: "2010/26",
    issueDateTime: "2026-01-15T10:00:00",
    type: "LAB",
    description: "Servizi laboratorio riparazioni",
    dueDateTime: "2026-02-15T10:00:00",
    status: "Non pagato",
    totalAmount: 350.00,
    pdfUrl: "#",
  },
  {
    id: 12,
    invoiceNumber: "2011/26",
    issueDateTime: "2026-01-20T11:30:00",
    type: "Ordini Shop",
    description: "Ordine ricambi display",
    dueDateTime: "2026-03-01T11:30:00",
    status: "Non pagato",
    totalAmount: 480.00,
    pdfUrl: "#",
  },
  {
    id: 13,
    invoiceNumber: "2012/26",
    issueDateTime: "2026-01-10T09:00:00",
    type: "Spedizioni",
    description: "Costi spedizione express",
    dueDateTime: "2026-02-28T09:00:00",
    status: "In attesa",
    totalAmount: 65.00,
    pdfUrl: "#",
  },
  {
    id: 14,
    invoiceNumber: "2013/26",
    issueDateTime: "2026-01-25T14:00:00",
    type: "Royalties/Marketing",
    description: "Fee marketing Q1 2026",
    dueDateTime: "2026-04-30T14:00:00",
    status: "Non pagato",
    totalAmount: 720.00,
    pdfUrl: "#",
  },
];

const RicercaFatture: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");

  // Stati per la tabella
  const [allData, setAllData] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState("");

  // Stati per i filtri
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");

  // Stati per il filtro temporale
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: "none" });
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Stati per dropdown azioni
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Stati per modal bonifico
  const [showBonificoModal, setShowBonificoModal] = useState(false);
  const [selectedInvoiceForBonifico, setSelectedInvoiceForBonifico] = useState<Invoice | null>(null);
  const [bonificoFile, setBonificoFile] = useState<File | null>(null);

  // Colori per il grafico e tipi
  const COLORS = ["#ef5350", "#ffa726", "#66bb6a", "#42a5f5", "#ab47bc"];

  const TYPE_COLORS: Record<Invoice["type"], string> = {
    "LAB": "#444444",
    "Ordini Shop": "#ff9800",
    "Royalties/Marketing": "#9c27b0",
    "Spedizioni": "#4caf50",
    "Pagamenti dilazionati": "#e91e63",
  };

  const STATUS_COLORS: Record<Invoice["status"], { bg: string; text: string; border: string }> = {
    "Non pagato": { bg: "#ffebee", text: "#c62828", border: "#ef9a9a" },
    "In attesa": { bg: "#fff3e0", text: "#e65100", border: "#ffcc80" },
    "Pagato": { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
  };

  // Calcolo statistiche per grafico
  const statusChartData = useMemo(() => {
    const counts = new Map<string, { count: number; amount: number }>();
    (filteredData || []).forEach((inv) => {
      const current = counts.get(inv.status) || { count: 0, amount: 0 };
      counts.set(inv.status, {
        count: current.count + 1,
        amount: current.amount + inv.totalAmount,
      });
    });
    return Array.from(counts, ([name, data]) => ({
      name,
      value: data.count,
      amount: data.amount,
    })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const totalInvoices = useMemo(() => filteredData?.length ?? 0, [filteredData]);

  const totalAmount = useMemo(
    () => filteredData.reduce((sum, inv) => sum + inv.totalAmount, 0),
    [filteredData]
  );

  const unpaidAmount = useMemo(
    () => filteredData
      .filter((inv) => inv.status === "Non pagato")
      .reduce((sum, inv) => sum + inv.totalAmount, 0),
    [filteredData]
  );

  // Definizione colonne
  const columnHelper = createColumnHelper<Invoice>();

  const columns = [
    columnHelper.accessor("invoiceNumber", {
      header: "N. Fattura",
      cell: (info) => (
        <div className={styles.invoiceCodeCell}>
          <strong>{info.getValue()}</strong>
        </div>
      ),
    }),
    columnHelper.accessor("issueDateTime", {
      header: "Ora/Data di emissione",
      cell: (info) => {
        const value = info.getValue();
        return (
          <div className={styles.dateCell}>
            {value
              ? new Date(value).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"}
          </div>
        );
      },
    }),
    columnHelper.accessor("type", {
      header: "Tipo",
      cell: (info) => {
        const type = info.getValue();
        return (
          <div
            className={styles.typeBadge}
            style={{ backgroundColor: TYPE_COLORS[type] }}
          >
            {type}
          </div>
        );
      },
    }),
    columnHelper.accessor("description", {
      header: "Descrizione Fattura",
      cell: (info) => (
        <div className={styles.descriptionCell}>
          <span>{info.getValue()}</span>
          <a
            href={info.row.original.pdfUrl || "#"}
            className={styles.pdfLink}
            onClick={(e) => {
              e.preventDefault();
              console.log("Download PDF:", info.row.original.invoiceNumber);
            }}
          >
            Scarica Fattura PDF
          </a>
        </div>
      ),
    }),
    columnHelper.accessor("dueDateTime", {
      header: "Ora/Data di scadenza",
      cell: (info) => {
        const value = info.getValue();
        const invoice = info.row.original;
        const dueDate = value ? new Date(value) : null;
        const now = new Date();
        const isPaid = invoice.status === "Pagato";
        const isOverdue = dueDate && dueDate < now && !isPaid;

        return (
          <div className={styles.dueDateCell}>
            <span className={styles.dueDateText}>
              {value
                ? new Date(value).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </span>
            {isPaid && (
              <span className={styles.dueDateBadgeCompleted}>Completata</span>
            )}
            {isOverdue && (
              <span className={styles.dueDateBadgeOverdue}>Scaduta</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Stato",
      cell: (info) => {
        const status = info.getValue();
        const colors = STATUS_COLORS[status];
        return (
          <div
            className={styles.statusBadge}
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            {status}
          </div>
        );
      },
    }),
    columnHelper.accessor("totalAmount", {
      header: "Tot. Fattura",
      cell: (info) => (
        <div className={styles.amountCell}>
          {info.getValue().toFixed(2)} Eur
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const invoice = info.row.original;
        const isOpen = openDropdownId === invoice.id;

        if (invoice.status === "Pagato") {
          return null;
        }

        return (
          <div className={styles.actionsCell}>
            <button
              className={styles.dropdownToggle}
              onClick={() => setOpenDropdownId(isOpen ? null : invoice.id)}
            >
              <ChevronDown size={16} />
            </button>
            {isOpen && (
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItemRed}
                  onClick={() => handlePayWithCard(invoice)}
                >
                  Paga con Carta o Paypal
                </button>
                <button
                  className={styles.dropdownItemGreen}
                  onClick={() => handlePayWithBonifico(invoice)}
                >
                  Paga con Bonifico
                </button>
              </div>
            )}
          </div>
        );
      },
    }),
  ];

  // Inizializza la tabella
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
          id: "issueDateTime",
          desc: true,
        },
      ],
    },
  });

  // Filtro locale dei dati
  const applyLocalFilters = () => {
    let filtered = [...allData];
    const now = new Date();

    // Filtro per categoria (Nuove/Scadute/Completate)
    if (categoryFilter) {
      filtered = filtered.filter((item) => {
        const dueDate = item.dueDateTime ? new Date(item.dueDateTime) : null;
        const isPaid = item.status === "Pagato";
        const isOverdue = dueDate && dueDate < now && !isPaid;

        switch (categoryFilter) {
          case "nuove":
            return !isPaid && !isOverdue;
          case "scadute":
            return isOverdue;
          case "completate":
            return isPaid;
          default:
            return true;
        }
      });
    }

    // Filtro per stato pagamento
    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Filtro per tipo
    if (typeFilter) {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Filtro per ricerca testuale
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.invoiceNumber?.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.type?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro per data
    if (dateFilter.type !== "none") {
      let startDate: string | null = null;
      let endDate: string | null = null;

      if (dateFilter.type === "custom" && dateFilter.startDate && dateFilter.endDate) {
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
          const itemDate = item.issueDateTime;
          if (!itemDate) return false;
          const date = new Date(itemDate).toISOString().split("T")[0];
          return date >= startDate! && date <= endDate!;
        });
      }
    }

    setFilteredData(filtered);
  };

  // Applica filtri quando cambiano
  useEffect(() => {
    if (allData.length > 0) {
      applyLocalFilters();
    }
  }, [statusFilter, typeFilter, categoryFilter, globalFilter, dateFilter, allData]);

  // Carica i dati mock al mount
  useEffect(() => {
    setLoading(true);
    // Simulazione caricamento
    setTimeout(() => {
      setAllData(MOCK_INVOICES);
      setFilteredData(MOCK_INVOICES);
      setLoading(false);
    }, 500);
  }, []);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
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
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        return null;
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  // Gestione del cambio di filtro temporale
  const handleDateFilterChange = (filterType: string) => {
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

  // Funzioni per i pagamenti
  const handlePayWithCard = (invoice: Invoice) => {
    console.log("Paga con carta/PayPal:", invoice.invoiceNumber);
    setOpenDropdownId(null);
    // TODO: Implementare redirect a pagamento carta/PayPal
  };

  const handlePayWithBonifico = (invoice: Invoice) => {
    setSelectedInvoiceForBonifico(invoice);
    setShowBonificoModal(true);
    setOpenDropdownId(null);
  };

  const handleBonificoSubmit = () => {
    if (selectedInvoiceForBonifico && bonificoFile) {
      console.log("Allegare distinta per:", selectedInvoiceForBonifico.invoiceNumber);
      console.log("File:", bonificoFile.name);

      // Aggiorna lo stato della fattura a "In attesa"
      setAllData((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoiceForBonifico.id
            ? { ...inv, status: "In attesa" as const }
            : inv
        )
      );

      setShowBonificoModal(false);
      setSelectedInvoiceForBonifico(null);
      setBonificoFile(null);
    }
  };

  const closeBonificoModal = () => {
    setShowBonificoModal(false);
    setSelectedInvoiceForBonifico(null);
    setBonificoFile(null);
  };

  // Pagamento massivo
  const handlePayAllWithCard = () => {
    const unpaidInvoices = filteredData.filter((inv) => inv.status === "Non pagato");
    console.log("Paga tutte con carta/PayPal:", unpaidInvoices.length, "fatture");
    // TODO: Implementare pagamento massivo
  };

  const handlePayAllWithBonifico = () => {
    const unpaidInvoices = filteredData.filter((inv) => inv.status === "Non pagato");
    console.log("Paga tutte con bonifico:", unpaidInvoices.length, "fatture");
    // TODO: Implementare pagamento massivo con bonifico
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className={styles.schedaHeader}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Gestione Fatture</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>Ricerca Fatture</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          {/* === RIEPILOGO GRAFICO & CARDS === */}
          <section className={styles.statsRow}>
            {/* Donut */}
            <div className={styles.statsChartCard}>
              <div className={styles.statsCardHeader}>
                Distribuzione Fatture per Stato
              </div>
              <div className={styles.statsCardBody}>
                <div className={styles.chartTwoCols}>
                  {/* Sinistra: Donut */}
                  <div className={styles.chartLeft}>
                    <div className={styles.donutWrapper}>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              `${value} fatture`,
                              name,
                            ]}
                          />
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
                            {statusChartData.map((entry, idx) => {
                              const statusColors: Record<string, string> = {
                                "Non pagato": "#ef5350",
                                "In attesa": "#ffa726",
                                "Pagato": "#66bb6a",
                              };
                              return (
                                <Cell
                                  key={`cell-${idx}`}
                                  fill={statusColors[entry.name] || COLORS[idx % COLORS.length]}
                                />
                              );
                            })}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Destra: Totale + lista stati */}
                  <div className={styles.chartRight}>
                    <div className={styles.kpiTotal}>
                      <div className={styles.kpiTotalNumber}>{totalInvoices}</div>
                      <div className={styles.kpiTotalLabel}>Fatture Totali</div>
                    </div>

                    <div className={styles.legendList}>
                      {statusChartData.map((s) => {
                        const statusColors: Record<string, string> = {
                          "Non pagato": "#ef5350",
                          "In attesa": "#ffa726",
                          "Pagato": "#66bb6a",
                        };
                        return (
                          <div key={s.name} className={styles.legendItem}>
                            <span className={styles.legendLeft}>
                              <span
                                className={styles.legendDot}
                                style={{ background: statusColors[s.name] || "#999" }}
                              />
                              {s.name}
                            </span>
                            <span
                              className={styles.legendBadge}
                              style={{ background: statusColors[s.name] || "#999" }}
                            >
                              {s.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards di riepilogo */}
            <div className={styles.statCardsGrid}>
              <div className={`${styles.statCard} ${styles.statCardRed}`}>
                <h3>{unpaidAmount.toFixed(2)} EUR</h3>
                <small>DA PAGARE</small>
              </div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                <h3>
                  {filteredData
                    .filter((inv) => inv.status === "In attesa")
                    .reduce((sum, inv) => sum + inv.totalAmount, 0)
                    .toFixed(2)}{" "}
                  EUR
                </h3>
                <small>IN ATTESA</small>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                <h3>
                  {filteredData
                    .filter((inv) => inv.status === "Pagato")
                    .reduce((sum, inv) => sum + inv.totalAmount, 0)
                    .toFixed(2)}{" "}
                  EUR
                </h3>
                <small>PAGATO</small>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGray}`}>
                <h3>{totalAmount.toFixed(2)} EUR</h3>
                <small>TOTALE</small>
              </div>
            </div>
          </section>

          {/* Tabella Fatture */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>Ricerca Fatture</h3>
              <div className={styles.tableControls}>
                {/* Filtro per categoria (Nuove/Scadute/Completate) */}
                <select
                  className={styles.filterSelectCategory}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Tutte le fatture</option>
                  <option value="nuove">Nuove</option>
                  <option value="scadute">Scadute</option>
                  <option value="completate">Completate</option>
                </select>

                {/* Filtro per stato pagamento */}
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tutti gli stati</option>
                  <option value="Non pagato">Non pagato</option>
                  <option value="In attesa">In attesa</option>
                  <option value="Pagato">Pagato</option>
                </select>

                {/* Filtro per tipo */}
                <select
                  className={styles.filterSelect}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">Tutti i tipi</option>
                  <option value="LAB">LAB</option>
                  <option value="Ordini Shop">Ordini Shop</option>
                  <option value="Royalties/Marketing">Royalties/Marketing</option>
                  <option value="Spedizioni">Spedizioni</option>
                  <option value="Pagamenti dilazionati">Pagamenti dilazionati</option>
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
                    <option value="today">Oggi</option>
                    <option value="week">Questa settimana</option>
                    <option value="month">Questo mese</option>
                    <option value="year">Quest'anno</option>
                    <option value="custom">Range personalizzato</option>
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
                        setGlobalFilter(value);
                      }
                    }}
                    className={styles.searchTableInput}
                    placeholder="Cerca per numero, descrizione..."
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
                      Applica Filtro
                    </button>
                    <button onClick={resetCustomDateRange} className={styles.resetDateBtn}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Indicatori filtri attivi */}
            {(categoryFilter || statusFilter || typeFilter || dateFilter.type !== "none" || globalFilter) && (
              <div className={styles.activeFiltersContainer}>
                <div className={styles.activeFiltersHeader}>
                  <span>Filtri attivi:</span>
                </div>
                <div className={styles.activeFilterTags}>
                  {categoryFilter && (
                    <div className={styles.filterTag}>
                      <span>
                        Categoria:{" "}
                        {{ nuove: "Nuove", scadute: "Scadute", completate: "Completate" }[categoryFilter]}
                      </span>
                      <button onClick={() => setCategoryFilter("")}>x</button>
                    </div>
                  )}
                  {statusFilter && (
                    <div className={styles.filterTag}>
                      <span>Stato: {statusFilter}</span>
                      <button onClick={() => setStatusFilter("")}>x</button>
                    </div>
                  )}
                  {typeFilter && (
                    <div className={styles.filterTag}>
                      <span>Tipo: {typeFilter}</span>
                      <button onClick={() => setTypeFilter("")}>x</button>
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
                      <button onClick={() => setDateFilter({ type: "none" })}>x</button>
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
                        x
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span>Caricamento fatture...</span>
              </div>
            )}

            {!loading && filteredData.length === 0 && (
              <div className={styles.emptyState}>
                <h4>Nessuna fattura trovata</h4>
                <p>
                  {allData.length > 0
                    ? "Non ci sono fatture che corrispondono ai criteri di ricerca selezionati."
                    : "Non ci sono fatture disponibili."}
                </p>
              </div>
            )}

            {!loading && filteredData.length > 0 && (
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
                                  asc: "^",
                                  desc: "v",
                                }[header.column.getIsSorted() as string] ?? ""}
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
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                    di <strong>{filteredData.length}</strong> fatture
                  </div>
                  <div className={styles.paginationControls}>
                    <button
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      className={styles.paginationBtn}
                      title="Prima pagina"
                    >
                      {"<<"}
                    </button>
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className={styles.paginationBtn}
                      title="Pagina precedente"
                    >
                      {"<"}
                    </button>
                    <span className={styles.paginationInfoText}>
                      Pagina{" "}
                      <strong>{table.getState().pagination.pageIndex + 1}</strong> di{" "}
                      <strong>{table.getPageCount()}</strong>
                    </span>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className={styles.paginationBtn}
                      title="Pagina successiva"
                    >
                      {">"}
                    </button>
                    <button
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                      className={styles.paginationBtn}
                      title="Ultima pagina"
                    >
                      {">>"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pulsanti pagamento massivo */}
            {filteredData.some((inv) => inv.status === "Non pagato") && (
              <div className={styles.bulkPaymentSection}>
                <button
                  className={styles.payAllCardBtn}
                  onClick={handlePayAllWithCard}
                >
                  Paga tutte con Carta o Paypal
                </button>
                <button
                  className={styles.payAllBonificoBtn}
                  onClick={handlePayAllWithBonifico}
                >
                  Paga tutte con Bonifico
                </button>
              </div>
            )}
          </div>
        </div>

        <BottomBar />
      </div>

      {/* Modal Bonifico */}
      {showBonificoModal && selectedInvoiceForBonifico && (
        <div className={styles.modalOverlay} onClick={closeBonificoModal}>
          <div className={styles.bonificoModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Paga con Bonifico</h2>
              <button className={styles.modalCloseBtn} onClick={closeBonificoModal}>
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                <strong>Fattura:</strong> {selectedInvoiceForBonifico.invoiceNumber}
              </p>
              <p>
                <strong>Importo:</strong> {selectedInvoiceForBonifico.totalAmount.toFixed(2)} EUR
              </p>
              <div className={styles.uploadSection}>
                <label>Allega distinta di pagamento:</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setBonificoFile(e.target.files?.[0] || null)}
                />
                {bonificoFile && (
                  <p className={styles.fileName}>File selezionato: {bonificoFile.name}</p>
                )}
              </div>
              <p className={styles.infoText}>
                Allegando la distinta, lo stato della fattura cambiera' in "In attesa" fino alla verifica del pagamento.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeBonificoModal}>
                Annulla
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleBonificoSubmit}
                disabled={!bonificoFile}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RicercaFatture;
