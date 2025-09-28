import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../../components/sidebar";
import Topbar from "../../../components/topbar";
import styles from "./styles.module.css";
import { CalendarDays, Edit, Plus } from "lucide-react";

interface Operator {
  id: string;
  idWhr: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  regione: string;
  provincia: string;
  citta: string;
  cap: string;
  indirizzo: string | null;
  idcompany: string | null;
  codiceDipendente: string;
  codiceFiscale: string | null;
  dataNascita: string | null;
  comuneNascita: string | null;
  prNascita: string | null;
  iban: string | null;
  matricola: string | null;
  qualificaImpiegato: string | null;
  descriQualifica: string | null;
  active: boolean | null;
  dataCreazione: string;
  isEmployee: boolean | null;
  multiTenantId: string | null;
}

const Operators: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [operators, setOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [flashPanel, setFlashPanel] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    regione: "",
    provincia: "",
    citta: "",
    cap: "",
    indirizzo: "",
    codiceDipendente: "",
    codiceFiscale: "",
    dataNascita: "",
    comuneNascita: "",
    prNascita: "",
    iban: "",
    matricola: "",
    qualificaImpiegato: "",
    descriQualifica: "",
  });

  type UserDetail = {
    id: string;
    username?: string;
    userName?: string;
    email?: string | null;
    isEnabled: boolean;
    isAdmin: boolean;
    accessLevel?: string | null;
    createdAt?: string;
  };

  const [operatorUsers, setOperatorUsers] = useState<UserDetail[]>([]);
  const [selectedOpUserId, setSelectedOpUserId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    accessLevel: "User",
    isEnabled: true,
    isAdmin: false,
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);

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

  useEffect(() => {
    loadOperators();
  }, []);

  useEffect(() => {
    filterOperators();
  }, [searchQuery, operators]);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const loadOperatorUsers = async (opId: string, opCompanyId?: string) => {
    try {
      const companyId = opCompanyId || sessionStorage.getItem("IdCompany");

      if (!companyId) {
        setOperatorUsers([]);
        setSelectedOpUserId(null);
        setAccountForm((p) => ({ ...p, username: "", email: "" }));
        return;
      }

      const resp = await fetch(`${API_URL}/api/Auth/users/${companyId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (resp.status === 204 || resp.status === 404) {
        setOperatorUsers([]);
        setSelectedOpUserId(null);
        setAccountForm((p) => ({ ...p, username: "", email: "" }));
        return;
      }
      if (!resp.ok) throw new Error(await resp.text());

      const json = await resp.json();

      const listRaw: any[] = Array.isArray(json?.users)
        ? json.users
        : Array.isArray(json)
        ? json
        : json && typeof json === "object"
        ? [json]
        : [];

      // Teniamo solo gli utenti legati all'operatore (idWhr === opId)
      const filtered = listRaw.filter(
        (u) =>
          (u.idWhr || u.IdWhr || u.idwhr) &&
          String(u.idWhr || u.IdWhr || u.idwhr).toLowerCase() ===
            opId.toLowerCase()
      );

      const list = filtered.map((u) => ({
        ...u,
        username: u.username ?? u.userName ?? u.UserName ?? "",
        email: u.email ?? "",
        isEnabled: !!u.isEnabled,
        isAdmin: !!u.isAdmin,
        accessLevel: u.accessLevel ?? "User",
      }));

      setOperatorUsers(list);

      const first = list[0] ?? null;
      setSelectedOpUserId(first?.id ?? null);
      setAccountForm((p) =>
        first
          ? {
              ...p,
              username: first.username,
              email: first.email,
              accessLevel: first.accessLevel,
              isEnabled: first.isEnabled,
              isAdmin: first.isAdmin,
              password: "",
              confirmPassword: "",
            }
          : { ...p, username: "", email: "", password: "", confirmPassword: "" }
      );
    } catch (e) {
      console.error("loadOperatorUsers error:", e);
      alert("Errore nel caricamento account operatore.");
    }
  };

  const createOperatorAccount = async (opId: string, opCompanyId?: string) => {
    if (!accountForm.username.trim() || !accountForm.password.trim()) {
      return alert("Username e Password sono obbligatori.");
    }

    // companyId dall'operatore o da sessione (fallback)
    const companyId =
      opCompanyId ||
      sessionStorage.getItem("IdCompanyAdmin") ||
      sessionStorage.getItem("IdCompany");

    if (!companyId) {
      alert("Impossibile determinare la company dell'operatore.");
      return;
    }

    setIsSavingAccount(true);
    try {
      const body = {
        username: accountForm.username.trim(),
        password: accountForm.password,
        email: accountForm.email || null,
        idCompany: companyId, // <- richiesto dallo Swagger
        isAdmin: !!accountForm.isAdmin,
        accessLevel: accountForm.accessLevel || null,
        idWhr: opId, // <- usiamo questo per legare l’utente all’operatore
      };

      const resp = await fetch(`${API_URL}/api/Auth/create-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore creazione account");

      await loadOperatorUsers(opId, companyId);
      alert("Account operatore creato con successo.");
    } catch (e: any) {
      console.error("createOperatorAccount error:", e);
      alert(e.message || "Errore nella creazione account.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const updateOperatorUser = async (userId: string, opId: string) => {
    setIsSavingAccount(true);
    try {
      const body = {
        email: accountForm.email || null,
        isEnabled: accountForm.isEnabled,
        isAdmin: accountForm.isAdmin,
        accessLevel: accountForm.accessLevel || null,
      };
      const resp = await fetch(`${API_URL}/api/Auth/update-user/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore aggiornamento utente");
      await loadOperatorUsers(opId);
      alert("Dati account aggiornati.");
    } catch (e: any) {
      console.error("updateOperatorUser error:", e);
      alert(e.message || "Errore aggiornamento.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const changeOperatorPassword = async (userId: string) => {
    if (!accountForm.password.trim())
      return alert("Inserisci la nuova password.");
    if (
      accountForm.confirmPassword &&
      accountForm.confirmPassword !== accountForm.password
    )
      return alert("La conferma password non coincide.");

    setIsSavingAccount(true);
    try {
      const body = {
        newPassword: accountForm.password,
        confirmPassword: accountForm.confirmPassword || undefined,
      };
      const resp = await fetch(
        `${API_URL}/api/Auth/change-password/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore cambio password");
      setAccountForm((p) => ({ ...p, password: "", confirmPassword: "" }));
      alert("Password aggiornata.");
    } catch (e: any) {
      console.error("changeOperatorPassword error:", e);
      alert(e.message || "Errore cambio password.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const toggleOperatorUserStatus = async (userId: string, opId: string) => {
    try {
      const resp = await fetch(
        `${API_URL}/api/Auth/toggle-user-status/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore cambio stato");
      await loadOperatorUsers(opId);
      alert("Stato utente aggiornato.");
    } catch (e: any) {
      console.error("toggleOperatorUserStatus error:", e);
      alert(e.message || "Errore nel cambio stato.");
    }
  };

  const loadOperators = async () => {
    setLoading(true);
    try {
      const companyId = (
        sessionStorage.getItem("IdCompany") || ""
      ).toLowerCase();

      const response = await fetch(`${API_URL}/api/operator`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        /* ... */
      }

      const data: Operator[] = await response.json();

      // mostra solo gli operatori della company loggata
      const filtered = (data || []).filter((o) => {
        const mt = (o.multiTenantId || "").toLowerCase();
        const ic = (o.idcompany || "").toLowerCase();
        return mt === companyId || ic === companyId;
      });

      setOperators(filtered);
      setFilteredOperators(filtered);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const filterOperators = () => {
    if (!searchQuery.trim()) {
      setFilteredOperators(operators);
    } else {
      const filtered = operators.filter(
        (operator) =>
          operator.firstName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          operator.lastName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          operator.codiceDipendente
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          operator.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          operator.phoneNumber?.includes(searchQuery)
      );
      setFilteredOperators(filtered);
    }
    setCurrentPage(1);
  };

  const openModal = (operator?: Operator) => {
    if (operator) {
      setOperatorId(operator.id);
      setFormData({
        userName: operator.userName || "",
        email: operator.email || "",
        firstName: operator.firstName || "",
        lastName: operator.lastName || "",
        phoneNumber: operator.phoneNumber || "",
        regione: operator.regione || "",
        provincia: operator.provincia || "",
        citta: operator.citta || "",
        cap: operator.cap || "",
        indirizzo: operator.indirizzo || "",
        codiceDipendente: operator.codiceDipendente || "",
        codiceFiscale: operator.codiceFiscale || "",
        dataNascita: operator.dataNascita
          ? operator.dataNascita.split("T")[0]
          : "",
        comuneNascita: operator.comuneNascita || "",
        prNascita: operator.prNascita || "",
        iban: operator.iban || "",
        matricola: operator.matricola || "",
        qualificaImpiegato: operator.qualificaImpiegato || "",
        descriQualifica: operator.descriQualifica || "",
      });
      if (operator.id) {
        loadOperatorUsers(operator.id, operator.idcompany || undefined);
      }
    } else {
      resetForm();
    }
    setShowModal(true);
    setTimeout(() => {
      firstNameInputRef.current?.focus();
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      // trigger del lampeggio bordo
      setFlashPanel(true);
      setTimeout(() => setFlashPanel(false), 1500); // torna allo stato normale
    }, 100);
  };

  const closeModal = () => {
    setShowModal(false);
    setOperatorId(null);
  };

  const handleSaveOperator = async () => {
    if (!formData.firstName) {
      alert("Inserire il nome");
      return;
    }

    if (!formData.lastName) {
      alert("Inserire il cognome");
      return;
    }

    if (!formData.email) {
      alert("Inserire un'email");
      return;
    }

    if (!formData.userName) {
      alert("Inserire un username");
      return;
    }

    if (!formData.phoneNumber) {
      alert("Inserire un numero di telefono");
      return;
    }

    if (!formData.codiceDipendente) {
      alert("Inserire il codice dipendente");
      return;
    }

    const payload = {
      ...(operatorId && { id: operatorId }),
      userName: formData.userName,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      regione: formData.regione,
      provincia: formData.provincia,
      citta: formData.citta,
      cap: formData.cap,
      indirizzo: formData.indirizzo,
      codiceDipendente: formData.codiceDipendente,
      codiceFiscale: formData.codiceFiscale,
      dataNascita: formData.dataNascita
        ? new Date(formData.dataNascita).toISOString()
        : null,
      comuneNascita: formData.comuneNascita,
      prNascita: formData.prNascita,
      iban: formData.iban,
      matricola: formData.matricola,
      qualificaImpiegato: formData.qualificaImpiegato,
      descriQualifica: formData.descriQualifica,
      idcompany: sessionStorage.getItem("IdCompany") || null,
      multiTenantId: sessionStorage.getItem("IdCompany") || null,
      active: 1,
      isEmployee: 1,
      dataCreazione: operatorId ? undefined : new Date().toISOString(),
      dataModifica: operatorId ? new Date().toISOString() : undefined,
      isDeleted: false,
      createdAt: operatorId ? undefined : new Date().toISOString(),
    };

    try {
      const url = operatorId
        ? `${API_URL}/api/operator/${operatorId}`
        : `${API_URL}/api/operator`;

      const method = operatorId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const message = operatorId
          ? "Operatore aggiornato con successo!"
          : "Operatore creato con successo!";
        alert(message);
        closeModal();
        loadOperators();
      } else {
        const errText = await response.text();
        alert("Errore nel salvataggio:\n" + errText);
      }
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore durante il salvataggio");
    }
  };

  const resetForm = () => {
    setOperatorId(null);
    setFormData({
      userName: "",
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      regione: "",
      provincia: "",
      citta: "",
      cap: "",
      indirizzo: "",
      codiceDipendente: "",
      codiceFiscale: "",
      dataNascita: "",
      comuneNascita: "",
      prNascita: "",
      iban: "",
      matricola: "",
      qualificaImpiegato: "",
      descriQualifica: "",
    });
  };

  // Paginazione
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOperators.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <>
      {loading && (
        <div className={styles.globalLoadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Caricamento...</p>
        </div>
      )}

      <div className={styles.mainLayout}>
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}>
          <Topbar toggleMenu={toggleMenu} />

          <div className={styles.schedaHeader}>
            <div className={styles.leftBlock}>
              <div
                className={styles.roundBtn}
                title="Aggiungi un nuovo operatore"
                onClick={() => openModal()}
              >
                <Plus size={20} />
              </div>

              <div className={styles.dateBox}>
                <CalendarDays className={styles.calendarIcon} />
                <div className={styles.dateTextInline}>
                  <span>{dateTime.date}</span>
                  <span>{dateTime.time}</span>
                </div>
              </div>
            </div>

            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cerca operatori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Home</span>
              <span className={styles.breadcrumbSeparator}> &gt; </span>
              <span className={styles.breadcrumbItem}>Anagrafica</span>
              <span className={styles.breadcrumbSeparator}> &gt; </span>
              <span className={styles.breadcrumbCurrent}>Operatori</span>
            </div>
          </div>

          {/* Lista Operatori */}
          <div className={styles.pageBody}>
            {/* --- LISTA OPERATORI in stile 'Ricerca schede' --- */}
            <section className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <div className={styles.tableHeaderInfo}>
                  <h3>Anagrafica Operatori</h3>
                  <span>Totale: {filteredOperators.length}</span>
                </div>

                <div className={styles.tableControls}>
                  <div className={styles.searchContainerTable}>
                    <i
                      className={`fa-solid fa-magnifying-glass ${styles.searchIconTable}`}
                    ></i>
                    <input
                      className={styles.searchTableInput}
                      placeholder="Cerca per nome, cognome, email, telefono…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <table className={styles.modernTable}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cognome</th>
                    <th>Username / Email</th>
                    <th>Telefono</th>
                    <th>Qualifica</th>
                    <th>Stato</th>
                    <th style={{ textAlign: "center" }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperators
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((op) => (
                      <tr key={op.id}>
                        <td>{op.firstName || "-"}</td>
                        <td>{op.lastName || "-"}</td>
                        <td>
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <strong>{op.userName || "-"}</strong>
                            <span style={{ fontSize: 12, color: "#666" }}>
                              {op.email || ""}
                            </span>
                          </div>
                        </td>
                        <td>{op.phoneNumber || "-"}</td>
                        <td>
                          {op.qualificaImpiegato || op.descriQualifica || "-"}
                        </td>
                        <td>
                          <span
                            className={
                              op.active
                                ? styles.statusActive
                                : styles.statusInactive
                            }
                          >
                            {op.active ? "Attivo" : "Disattivo"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.actionBtn}
                              title="Modifica operatore"
                              onClick={() => openModal(op)}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {filteredOperators.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: 24,
                          textAlign: "center",
                          color: "#666",
                        }}
                      >
                        Nessun operatore trovato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Paginazione: puoi lasciare la tua esistente */}
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  Pagina {currentPage} di{" "}
                  {Math.max(
                    1,
                    Math.ceil(filteredOperators.length / itemsPerPage)
                  )}
                </div>
                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>
                  <button
                    className={styles.paginationBtn}
                    onClick={() =>
                      setCurrentPage((p) =>
                        p < Math.ceil(filteredOperators.length / itemsPerPage)
                          ? p + 1
                          : p
                      )
                    }
                    disabled={
                      currentPage >=
                      Math.ceil(filteredOperators.length / itemsPerPage)
                    }
                  >
                    ›
                  </button>
                </div>
              </div>
            </section>
            {/* Modal Form */}
            {/* --- Editor operatore sotto la lista (no modal) --- */}
            {showModal && (
              <section ref={editorRef} className={`${styles.inlineEditorCard} ${flashPanel ? styles.panelFocusFlash : ""}`}>
                <div className={styles.inlineEditorHeader}>
                  <h3>
                    {operatorId ? "Modifica operatore" : "Nuovo operatore"}
                  </h3>
                  <button
                    className={styles.inlineCloseBtn}
                    onClick={closeModal}
                    title="Chiudi"
                  >
                    ×
                  </button>
                </div>

                <div className={styles.inlineEditorBody}>
                  <div className={styles.customerForm}>
                    {/* riga 1 */}
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label>Nome *</label>
                        <input
                          className={styles.formControl}
                          value={formData.firstName}
                          ref={firstNameInputRef}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Cognome *</label>
                        <input
                          className={styles.formControl}
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* riga 2 */}
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label>Username *</label>
                        <input
                          className={styles.formControl}
                          value={formData.userName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              userName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Email *</label>
                        <input
                          type="email"
                          className={styles.formControl}
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* riga 3 */}
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label>Codice Dipendente *</label>
                        <input
                          className={styles.formControl}
                          value={formData.codiceDipendente}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              codiceDipendente: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Telefono *</label>
                        <input
                          className={styles.formControl}
                          value={formData.phoneNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* riga 4 */}
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label>Codice Fiscale</label>
                        <input
                          className={styles.formControl}
                          value={formData.codiceFiscale}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              codiceFiscale: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Matricola</label>
                        <input
                          className={styles.formControl}
                          value={formData.matricola}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              matricola: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* ...continua con le altre righe già presenti nel tuo form... */}
                  </div>

                  {/* eventuale sezione “Account utente dell’operatore”, riutilizzando il tuo stato:
          selectedOpUserId, accountForm, isSavingAccount, ecc. */}

                  <div className={styles.sectionTitle}>Account di accesso</div>
                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label>Username</label>
                      <input
                        className={styles.formControl}
                        value={accountForm.username}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            username: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Email</label>
                      <input
                        className={styles.formControl}
                        type="email"
                        value={accountForm.email ?? ""}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label>Password</label>
                      <input
                        className={styles.formControl}
                        type="password"
                        value={accountForm.password}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Conferma Password</label>
                      <input
                        className={styles.formControl}
                        type="password"
                        value={accountForm.confirmPassword}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                {/* Azioni account operatore */}
                <div className={styles.accountActions}>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() =>
                      selectedOpUserId
                        ? updateOperatorUser(selectedOpUserId, operatorId!)
                        : createOperatorAccount(operatorId!)
                    }
                    disabled={isSavingAccount || !operatorId}
                  >
                    {selectedOpUserId ? "Aggiorna account" : "Crea account"}
                  </button>

                  {selectedOpUserId && (
                    <>
                      <button
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => changeOperatorPassword(selectedOpUserId)}
                        disabled={isSavingAccount || !accountForm.password}
                      >
                        Cambia password
                      </button>

                      <button
                        className={`${styles.btn} ${styles.btnDanger}`}
                        onClick={() =>
                          toggleOperatorUserStatus(
                            selectedOpUserId,
                            operatorId!
                          )
                        }
                        disabled={isSavingAccount}
                      >
                        {accountForm.isEnabled ? "Disattiva" : "Attiva"} utente
                      </button>
                    </>
                  )}
                </div>

                <div className={styles.inlineEditorFooter}>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleSaveOperator}
                  >
                    SALVA
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={resetForm}
                  >
                    NUOVO
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Operators;
