import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import styles from "./ricerca-note-styles.module.css";

interface QuickRepairNote {
  id: number;
  noteCode: string;
  customerId?: string;
  deviceId?: string;
  companyId: string;
  multitenantId: string;
  ragioneSociale: string;
  cognome: string;
  nome: string;
  telefono: string;
  brand: string;
  model: string;
  codiceRiparazione: string;
  problema: string;
  prezzoPreventivo: number;
  stato: string;
  statoCode: string;
  receivedAt: string;
  createdAt: string;
  createdBy: string;
}

const RicercaNote: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [notes, setNotes] = useState<QuickRepairNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filtri
  const [searchTerm, setSearchTerm] = useState("");
  const [statoCode, setStatoCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Carica le note all'avvio
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    const params = new URLSearchParams();
    if (multitenantId) params.append("MultitenantId", multitenantId);
    if (searchTerm) params.append("SearchTerm", searchTerm);
    if (statoCode) params.append("StatoCode", statoCode);
    if (fromDate) params.append("FromDate", new Date(fromDate).toISOString());
    if (toDate) params.append("ToDate", new Date(toDate).toISOString());

    try {
      const response = await fetch(
        `https://localhost:7148/api/Repair/quick-note/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        setTotalRecords(data.length);
      } else {
        console.error("Errore nel recupero delle note");
        setNotes([]);
      }
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchNotes();
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatoCode("");
    setFromDate("");
    setToDate("");
    setTimeout(() => fetchNotes(), 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatoBadge = (statoCode: string) => {
    switch (statoCode) {
      case "IN_ATTESA":
        return <span className={styles.badgeAttesa}>In Attesa</span>;
      case "IN_LAVORAZIONE":
        return <span className={styles.badgeLavorazione}>In Lavorazione</span>;
      case "COMPLETATO":
        return <span className={styles.badgeCompletato}>Completato</span>;
      case "RICEVUTO":
        return <span className={styles.badgeRicevuto}>Ricevuto</span>;
      default:
        return <span className={styles.badgeDefault}>{statoCode}</span>;
    }
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.pageBody}>
          <div className={styles.deviceSidebar}>
            <button className={styles.deviceBtn}>iPhone</button>
            <button className={styles.deviceBtn}>iPad</button>
            <button className={styles.deviceBtn}>Mac</button>
            <button className={styles.deviceBtn}>Watch</button>
            <button className={styles.deviceBtn}>AirPods</button>
          </div>

          <div className={styles.centerBox}>
            <div className={styles.boxHeader}>
              <h2>Ricerca Note di Riparazione</h2>
            </div>

            <div className={styles.boxBody}>
              {/* Filtri di ricerca */}
              <div className={styles.filterSection}>
                <div className={styles.filterRow}>
                  <div className={styles.filterField}>
                    <label>Cerca</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="Codice, cliente, telefono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>

                  <div className={styles.filterField}>
                    <label>Stato</label>
                    <select
                      className={styles.formControl}
                      value={statoCode}
                      onChange={(e) => setStatoCode(e.target.value)}
                    >
                      <option value="">Tutti gli stati</option>
                      <option value="RICEVUTO">Ricevuto</option>
                      <option value="IN_ATTESA">In Attesa</option>
                      <option value="IN_LAVORAZIONE">In Lavorazione</option>
                      <option value="COMPLETATO">Completato</option>
                    </select>
                  </div>

                  <div className={styles.filterField}>
                    <label>Data Da</label>
                    <input
                      type="date"
                      className={styles.formControl}
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div className={styles.filterField}>
                    <label>Data A</label>
                    <input
                      type="date"
                      className={styles.formControl}
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.filterActions}>
                  <button className={styles.btnSearch} onClick={handleSearch}>
                    🔍 Cerca
                  </button>
                  <button className={styles.btnReset} onClick={handleReset}>
                    ↻ Reset
                  </button>
                  <div className={styles.recordCount}>
                    Totale: <strong>{totalRecords}</strong> note
                  </div>
                </div>
              </div>

              {/* Tabella risultati */}
              <div className={styles.tableContainer}>
                {loading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Caricamento in corso...</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>📋 Nessuna nota trovata</p>
                  </div>
                ) : (
                  <table className={styles.notesTable}>
                    <thead>
                      <tr>
                        <th>Codice Nota</th>
                        <th>Stato</th>
                        <th>Cliente</th>
                        <th>Dispositivo</th>
                        <th>Problema</th>
                        <th>Tecnico</th>
                        <th>Data Accettazione</th>
                        <th>Data Creazione</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map((note) => (
                        <tr key={note.id}>
                          <td>
                            <strong>{note.noteCode}</strong>
                          </td>
                          <td>{getStatoBadge(note.statoCode)}</td>
                          <td>
                            <div className={styles.clientInfo}>
                              <div>
                                {note.cognome} {note.nome}
                              </div>
                              {note.ragioneSociale && (
                                <small>{note.ragioneSociale}</small>
                              )}
                              <small>📞 {note.telefono}</small>
                            </div>
                          </td>
                          <td>
                            <div className={styles.deviceInfo}>
                              <strong>
                                {note.brand} {note.model}
                              </strong>
                            </div>
                          </td>
                          <td>
                            <div className={styles.problemText}>
                              {note.problema}
                            </div>
                          </td>
                          <td>{note.createdBy}</td>
                          <td>{formatDate(note.receivedAt)}</td>
                          <td>{formatDate(note.createdAt)}</td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button
                                className={styles.btnView}
                                title="Visualizza"
                              >
                                👁️
                              </button>
                              <button
                                className={styles.btnEdit}
                                title="Modifica"
                              >
                                ✏️
                              </button>
                              <button
                                className={styles.btnPrint}
                                title="Stampa"
                              >
                                🖨️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <BottomBar />
      </div>
    </div>
  );
};

export default RicercaNote;
