import React, { useState, useEffect, useRef } from "react";
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
import "./styles.css";
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

const AffiliateManagement: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [newsData, setNewsData] = useState<any[]>([]);
  const navigate = useNavigate();
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
        <div className="table-badge badge-phone">
        
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("emailAziendale", {
      header: "Email",
      cell: (info) => (
        <div className="table-badge badge-email">
         
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("pIva", {
      header: "Partita IVA",
      cell: (info) => (
        <div className="table-badge badge-piva">{info.getValue()}</div>
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

        const response = await fetch(`https://localhost:7148/api/Customer/customeraffiliated?multitenantId=${multitenantId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

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

  // Simula il caricamento delle notizie
  useEffect(() => {
    const loadNews = () => {
      const mockNews = [
        {
          id: 1,
          title: "Alcuni computer Mac con l'aggiornamento....",
          date: new Date(Date.now() - 86400000),
          content:
            "Alcuni modelli di Mac potrebbero riscontrare ritardi nel caricamento di Diagnosi Apple o delle diagnostiche EFI di AST 2 dopo i seguenti aggiornamenti: Aggiornamento a macOS Big Sur 11.3 Aggiornamento del firmware del chip di sicurezza Apple T2 alla versione più recente dopo aver eseguito correttamente le suite Configurazione di sistema, Riattiva dispositivo o un ripristino con Apple Configurator 2 I modelli di Mac interessati si collegheranno alla Console di diagnostica di AST 2 e possono visualizzare il messaggio 'Attendo il supporto...' per diversi minuti.",
        },
        {
          id: 2,
          title: "Trasformazione di GSX - Fase 2: ...",
          date: new Date(Date.now() - 172800000),
          content: "Informazioni sulla fase 2......",
        },
        {
          id: 3,
          title: "Suggerimenti per ridurre l'impatto ambiantale ...",
          date: new Date(Date.now() - 259200000),
          content: "Suggerimenti per ridurre l'impatto ambientale...",
        },
      ];
      setNewsData(mockNews);
    };

    loadNews();

    // Carica lo stato del menu dal localStorage
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

  // Gestione della selezione di una notizia
  const handleSelectNews = (newsId: number) => {
    const newsItem = newsData.find((item) => item.id === newsId);
    setSelectedNews(newsItem);
  };

  // Navigazione alle varie pagine
  const navigateTo = (path: string) => {
    navigate(path);
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
         
          {/* Tabella Clienti con Design Monocromatico */}
          <div className="table-section">
            <div className="table-header">
              <h3>Lista Affiliati</h3>
              <div className="table-controls">
                <div className="search-container-table">
                  <i className="fa-solid fa-magnifying-glass search-icon-table"></i>
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="search-table-input"
                    placeholder="Cerca clienti..."
                  />
                </div>
              </div>
            </div>

            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span>Caricamento clienti...</span>
              </div>
            )}

            {error && (
              <div className="error-container">
                <i className="fa-solid fa-exclamation-triangle"></i>
                <span>Errore: {error}</span>
              </div>
            )}

            {!loading && !error && rowData.length === 0 && (
              <div className="empty-state">
                <h4>Nessun cliente trovato</h4>
                <p>Non ci sono clienti da visualizzare al momento.</p>
              </div>
            )}

            {!loading && !error && rowData.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="modern-table">
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
                              <span className="sort-indicator">
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
                <div className="pagination-container">
                  <div className="pagination-info">
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
                  <div className="pagination-controls">
                    <button
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      className="pagination-btn"
                      title="Prima pagina"
                    >
                      ⟪
                    </button>
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="pagination-btn"
                      title="Pagina precedente"
                    >
                      ‹
                    </button>
                    <span className="pagination-info-text">
                      Pagina{" "}
                      <strong>
                        {table.getState().pagination.pageIndex + 1}
                      </strong>{" "}
                      di <strong>{table.getPageCount()}</strong>
                    </span>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="pagination-btn"
                      title="Pagina successiva"
                    >
                      ›
                    </button>
                    <button
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
                      disabled={!table.getCanNextPage()}
                      className="pagination-btn"
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

export default AffiliateManagement;
