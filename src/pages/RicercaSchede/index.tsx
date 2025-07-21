import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { CalendarDays } from "lucide-react";
import styles from "./styles.module.css";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";

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

const RicercaSchede: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  // Stati per la tabella
  const [rowData, setRowData] = useState<RepairData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Stati per i filtri
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");

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
              {customer.ragioneSociale ||
                customer.name ||
                "Cliente sconosciuto"}
            </div>
            <div className={styles.customerContact}>
              {customer.telefono && <span>📞 {customer.telefono}</span>}
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

  // Inizializza la tabella
  const table = useReactTable({
    data: rowData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
      sorting: [
        {
          id: "createdAt",
          desc: true, // Ordina per data decrescente (più recenti prima)
        },
      ],
    },
  });

  // Effetto per aggiornare data e ora
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const date = now.toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const time = now.toLocaleTimeString("it-IT");
      setDateTime({ date, time });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carica le riparazioni al mount del componente
  useEffect(() => {
    fetchRepairs();
  }, [statusFilter, globalFilter]);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Funzione per recuperare le riparazioni
  const fetchRepairs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const multitenantId = localStorage.getItem("IdCompany");

      if (!multitenantId) {
        throw new Error("ID azienda non trovato");
      }

      const searchPayload = {
        multitenantId: multitenantId,
        statusCode: statusFilter || null,
        searchQuery: globalFilter || null,
        page: 1, // se vuoi paginare lato server
        pageSize: 100, // numero massimo records da ricevere
        sortBy: "CreatedAt",
        sortDescending: true,
      };

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
      console.log("Riparazioni caricate:", data);

      setRowData(data);
    } catch (error: any) {
      console.error("Errore nel caricamento delle riparazioni:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per le azioni
  const handleViewRepair = (repair: RepairData) => {
    console.log("Visualizza riparazione:", repair);
    // Implementa navigazione alla vista dettaglio
    // navigate(`/repair/${repair.repairId}/view`);
  };

  const handleEditRepair = (repair: RepairData) => {
    console.log("Modifica riparazione:", repair);
    // Implementa navigazione alla modifica
    // navigate(`/repair/${repair.repairId}/edit`);
  };

  const handlePrintRepair = (repair: RepairData) => {
    console.log("Stampa riparazione:", repair);
    // Implementa funzionalità di stampa
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

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className={styles.schedaHeader}>
          <div className={styles.leftBlock}>
            <div className={styles.roundBtn}>
              <span className={styles.plusIcon}>🔍</span>
            </div>
            <div className={styles.dateBox}>
              <CalendarDays className={styles.calendarIcon} />
              <div className={styles.dateTextInline}>
                <span>{dateTime.date}</span>
                <span>{dateTime.time}</span>
              </div>
            </div>
          </div>

          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Roma - Next srl</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>Ricerca Schede</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          {/* Tabella Riparazioni */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>🔍 Ricerca Schede di Riparazione</h3>
              <div className={styles.tableControls}>
                {/* Filtro per stato */}
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tutti gli stati</option>
                  <option value="received">📥 Ricevuto</option>
                  <option value="pending">⏳ In Attesa</option>
                  <option value="in progress">🔧 In Lavorazione</option>
                  <option value="completed">✅ Completato</option>
                  <option value="delivered">📦 Consegnato</option>
                  <option value="cancelled">❌ Annullato</option>
                </select>

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
                    placeholder="Cerca per codice, cliente, dispositivo..."
                  />
                </div>
              </div>
            </div>

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

            {!loading && !error && rowData.length === 0 && (
              <div className={styles.emptyState}>
                <h4>Nessuna riparazione trovata</h4>
                <p>
                  Non ci sono riparazioni che corrispondono ai criteri di
                  ricerca.
                </p>
              </div>
            )}

            {!loading && !error && rowData.length > 0 && (
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
                    di{" "}
                    <strong>{table.getFilteredRowModel().rows.length}</strong>{" "}
                    riparazioni
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
