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
import styles from "./styles.module.css";
import Sidebar from "../../../components/sidebar-admin";
import Topbar from "../../../components/topbar";

// Definisci il tipo per i dati del cliente
interface CustomerData {
  id: string;
  ragioneSociale: string;
  nome: string;
  cognome: string;
  citta: string;
  provincia: string;
  telefono: string;
  emailAziendale: string;
  pIva: string;
}

const DashboardAdmin: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  //const navigate = useNavigate();
  const [rowData, setRowData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // Definisci le colonne usando createColumnHelper
  const columnHelper = createColumnHelper<CustomerData>();

  const columns = [
    columnHelper.accessor("ragioneSociale", {
      header: "Ragione Sociale",
      cell: (info) => (
        <div style={{ fontWeight: "600", color: "#1a1a1a" }}>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("nome", {
      header: "Nome",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("cognome", {
      header: "Cognome",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("citta", {
      header: "Città",
      cell: (info) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("provincia", {
      header: "Provincia",
      cell: (info) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("telefono", {
      header: "Telefono",
      cell: (info) => (
        <div className={`${styles.tableBadge} ${styles.badgePhone}`}>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("emailAziendale", {
      header: "Email",
      cell: (info) => (
        <div className={`${styles.tableBadge} ${styles.badgeEmail}`}>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("pIva", {
      header: "Partita IVA",
      cell: (info) => (
        <div className={`${styles.tableBadge} ${styles.badgePiva}`}>
          {info.getValue()}
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
            onClick={() => handleViewCustomer(info.row.original)}
            title="Visualizza dettagli"
          >
            <i className="fa-solid fa-eye"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={() => handleEditCustomer(info.row.original)}
            title="Modifica dati"
          >
            <i className="fa-solid fa-edit"></i>
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
        pageSize: 10,
      },
    },
  });

  // Carica tutti gli utenti presenti in customer
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Inizio caricamento dati clienti...");

        const token = localStorage.getItem("token");
        const multitenantId = localStorage.getItem("IdCompanyAdmin");
        console.log("Token presente:", !!token);

        const response = await fetch(
          `https://localhost:7148/api/Customer/customeraffiliated?multitenantId=${multitenantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Dati ricevuti:", data);
        console.log("Numero di record:", data.length);
        console.log("Primo record:", data[0]);

        setRowData(data);
      } catch (error: any) {
        console.error("Errore nel caricamento dei clienti:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Carica lo stato del menu dal localStorage
  useEffect(() => {
    const savedMenuState = localStorage.getItem("menuState");
    if (savedMenuState === "closed") {
      setMenuState("closed");
    }
  }, []);

  // Gestione del toggle del menu
  const toggleMenu = () => {
    const newState = menuState === "open" ? "closed" : "open";
    setMenuState(newState);
    localStorage.setItem("menuState", newState);
  };

  // Gestione visualizzazione dettagli cliente
  const handleViewCustomer = (customer: CustomerData) => {
    console.log("Visualizza cliente:", customer);
    // Qui aprirai la form di visualizzazione
    // navigate(`/view-customer/${customer.id}`);
  };

  // Gestione modifica cliente
  const handleEditCustomer = (customer: CustomerData) => {
    console.log("Modifica cliente:", customer);
    // Qui aprirai la form di modifica
    // navigate(`/edit-customer/${customer.id}`);
  };

  // Navigazione alle varie pagine
  // const navigateTo = (path: string) => {
  //   navigate(path);
  // };

  return (
    <div
      className={`d-flex ${menuState === "closed" ? "menu-closed" : ""}`}
      id="wrapper"
    >
      {/* Nuova Sidebar */}
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />

      {/* Main Content */}
      <div id="page-content-wrapper">
        <Topbar toggleMenu={toggleMenu} />

        {/* Page content */}
        <div className="container-fluid">
          <div>
            <p />
            <p />
            <p />
          </div>
          {/* Box Top Riepilogo */}
          <div className="container">
            <div className="box purple">
              <i className="fa-solid fa-sack-dollar icon"></i>
              <div className="text">
                <span>Totale</span>
                <span>Mese</span>
                <span>Oggi</span>
              </div>
            </div>
            <div className="box dark">
              <i className="fa-solid fa-screwdriver icon"></i>
              <div className="text">
                <span>Riparazioni</span>
              </div>
            </div>
            <div className="box dark">
              <i className="fa-solid fa-mobile-screen-button icon"></i>
              <div className="text">
                <span>Vendite Dispositivi</span>
                <span>Usato</span>
                <span>Nuovo</span>
              </div>
            </div>
            <div className="box grey">
              <i className="fa fa-wallet icon"></i>
              <div className="text">
                <span>Vendite Accessori</span>
              </div>
            </div>
            <div className="box grey">
              <i className="fa fa-heartbeat icon"></i>
              <div className="text">
                <span>Interventi Software</span>
              </div>
            </div>
            <div className="box light-grey">
              <i className="fa fa-arrow-down icon"></i>
              <div className="text">
                <span>Spese</span>
              </div>
            </div>
          </div>
          {/* Tabella Clienti con Design Monocromatico */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>Lista Affiliati</h3>
              <div className={styles.tableControls}>
                <div className={styles.searchContainerTable}>
                  <i
                    className={`fa-solid fa-magnifying-glass ${styles.searchIconTable}`}
                  ></i>
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className={styles.searchTableInput}
                    placeholder="Cerca clienti..."
                  />
                </div>
              </div>
            </div>

            {loading && (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span>Caricamento clienti...</span>
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
                <h4>Nessun cliente trovato</h4>
                <p>Non ci sono clienti da visualizzare al momento.</p>
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

                {/* Paginazione Monocromatica */}
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
                    risultati
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

          <div>
            <p />
            <p />
            <p />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
