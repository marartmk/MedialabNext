import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import Topbar from "../../../components/topbar-admin";

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

type AffiliateStatus = "ATTIVO" | "DISATTIVO";
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
  // nuovo:
  affiliateStatus?: AffiliateStatus | string | null;
}

type UserAccount = {
  id: string;
  username: string;
  email?: string | null;
  isEnabled: boolean;
  isAdmin: boolean;
  accessLevel?: string | null;
  createdAt?: string | null;
};

const DashboardAdmin: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const navigate = useNavigate();
  //const navigate = useNavigate();
  const [rowData, setRowData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // 🔹 Config base API (opzionale: meglio da .env)
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Helper per badge di stato
  const renderStatusBadge = (status?: string | null) => {
    const s = (status || "").toString().trim().toUpperCase();
    const isActive =
      s === "ATTIVO" ||
      s === "ACTIVE" ||
      s === "ENABLED" ||
      s === "TRUE" ||
      s === "1";
    return (
      <span
        className={`${styles.statusBadge} ${
          isActive ? styles.statusActive : styles.statusInactive
        }`}
      >
        {isActive ? "ATTIVO" : "DISATTIVO"}
      </span>
    );
  };

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
    columnHelper.accessor("affiliateStatus", {
      header: "Stato",
      cell: (info) => renderStatusBadge(info.getValue()),
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

        const token = sessionStorage.getItem("token");
        const multitenantId = sessionStorage.getItem("IdCompanyAdmin");
        console.log("Token presente:", !!token);        

        const response = await fetch(
          `${API_URL}/api/Customer/customeraffiliated?multitenantId=${multitenantId}`,
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

        const normalized = (data ?? []).map((d: any) => {
          const raw =
            d?.affiliateStatus ??
            d?.status ??
            d?.isEnabled ??
            d?.enabled ??
            null;
          let affiliateStatus: AffiliateStatus | string | null = null;
          if (typeof raw === "boolean")
            affiliateStatus = raw ? "ATTIVO" : "DISATTIVO";
          else if (raw != null)
            affiliateStatus =
              String(raw).toUpperCase() === "ATTIVO"
                ? "ATTIVO"
                : ["ACTIVE", "ENABLED", "TRUE", "1"].includes(
                    String(raw).toUpperCase()
                  )
                ? "ATTIVO"
                : "DISATTIVO";
          return { ...d, affiliateStatus };
        });

        setRowData(normalized);

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

  // Carica lo stato del menu dal sessionStorage
  useEffect(() => {
    const savedMenuState = sessionStorage.getItem("menuState");
    if (savedMenuState === "closed") {
      setMenuState("closed");
    }
  }, []);

  // Gestione del toggle del menu
  const toggleMenu = () => {
    const newState = menuState === "open" ? "closed" : "open";
    setMenuState(newState);
    sessionStorage.setItem("menuState", newState);
  };

  // Gestione visualizzazione dettagli cliente
  const handleViewCustomer = async (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
    setLoadingAccounts(true);

    try {
      const token = sessionStorage.getItem("token");
      // carica gli account legati al cliente (se disponibile l'endpoint)
      const resp = await fetch(`${API_BASE}/api/Auth/users/${customer.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const list: UserAccount[] = await resp.json();
        setAccounts(list ?? []);
      } else {
        setAccounts([]);
      }
    } catch {
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedCustomer(null);
    setAccounts([]);
  };

  // Gestione modifica cliente
  const handleEditCustomer = (customer: CustomerData) => {
    console.log("Modifica cliente:", customer);
    navigate(`/master-company/${customer.id}`);
  };

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
      {/* === MODAL DETTAGLI AFFILIATO === */}
      {viewModalOpen && selectedCustomer && (
        <div className={styles.modalOverlay} onClick={closeViewModal}>
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h4>Dettagli affiliato</h4>
              <button
                className={styles.modalClose}
                onClick={closeViewModal}
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Riepilogo anagrafica */}
              <div className={styles.detailGrid}>
                <div>
                  <div className={styles.detailLabel}>Ragione Sociale</div>
                  <div className={styles.detailValue}>
                    {selectedCustomer.ragioneSociale}
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Referente</div>
                  <div className={styles.detailValue}>
                    {selectedCustomer.nome} {selectedCustomer.cognome}
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Città</div>
                  <div className={styles.detailValue}>
                    {selectedCustomer.citta} ({selectedCustomer.provincia})
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Telefono</div>
                  <div className={styles.detailValue}>
                    {selectedCustomer.telefono}
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Email</div>
                  <div className={styles.detailValue}>
                    {selectedCustomer.emailAziendale}
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>P. IVA</div>
                  <div className={styles.detailValue}>
                    {selectedCustomer.pIva}
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Stato</div>
                  <div className={styles.detailValue}>
                    {renderStatusBadge(selectedCustomer.affiliateStatus)}
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>ID</div>
                  <div className={styles.detailValue}>
                    <code>{selectedCustomer.id}</code>
                  </div>
                </div>
              </div>

              {/* Sezione account associati */}
              <div className={styles.accountsSection}>
                <div className={styles.sectionTitle}>Account associati</div>
                {loadingAccounts ? (
                  <div className={styles.loadingInline}>
                    <span className={styles.loadingSpinner}></span> Caricamento
                    account...
                  </div>
                ) : accounts.length === 0 ? (
                  <div className={styles.muted}>Nessun account associato.</div>
                ) : (
                  <div className={styles.accountsList}>
                    {accounts.map((u) => {
                      const badge = renderStatusBadge(
                        u.isEnabled ? "ATTIVO" : "DISATTIVO"
                      );
                      return (
                        <div key={u.id} className={styles.accountItem}>
                          <div className={styles.accountMain}>
                            <div className={styles.accountUsername}>
                              {u.username}
                            </div>
                            <div className={styles.accountMeta}>
                              {u.email ? (
                                <span className={styles.tableBadge}>
                                  {u.email}
                                </span>
                              ) : null}
                              {u.accessLevel ? (
                                <span className={styles.tableBadge}>
                                  Level: {u.accessLevel}
                                </span>
                              ) : null}
                              {u.isAdmin ? (
                                <span className={styles.tableBadge}>Admin</span>
                              ) : null}
                            </div>
                          </div>
                          <div className={styles.accountStatus}>{badge}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalPrimary} onClick={closeViewModal}>
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;
