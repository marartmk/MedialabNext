import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../../components/sidebar-admin";
import Topbar from "../../../components/topbar-admin";
import styles from "./anagrafica-master.module.css";
import { CalendarDays, Users, Shield } from "lucide-react";

const CompanyMaster: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ragioneSocialeInputRef = useRef<HTMLInputElement>(null);

  type UserDetail = {
    id: string;
    username: string;
    email?: string | null;
    isEnabled: boolean;
    isAdmin: boolean;
    accessLevel?: string | null;
    createdAt: string;
  };

  const [companyUsers, setCompanyUsers] = useState<UserDetail[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    accessLevel: "Affiliate",
    isEnabled: true,
    isAdmin: false,
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  const API_BASE = "https://localhost:7148";

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const [formData, setFormData] = useState({
    tipo: "Azienda",
    cliente: true,
    fornitore: false,
    tipoCliente: "",
    ragioneSociale: "",
    indirizzo: "",
    cognome: "",
    nome: "",
    cap: "",
    regione: "",
    provincia: "",
    citta: "",
    telefono: "",
    email: "",
    codiceFiscale: "",
    partitaIva: "",
    emailPec: "",
    codiceSdi: "",
    iban: "",
    // Campi affiliati
    isAffiliate: false,
    affiliateCode: "",
    affiliatedDataStart: "",
    affiliatedDataEnd: "",
    affiliateStatus: true,
  });

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

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Funzione per generare codice affiliato automatico
  const generateAffiliateCode = () => {
    const prefix = "AFF";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newCode = `${prefix}${timestamp}${random}`;

    setFormData({
      ...formData,
      affiliateCode: newCode,
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(
        `https://localhost:7148/api/customer/search?query=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowModal(true);
      } else {
        alert("Errore nella ricerca");
      }
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carica gli utenti dell'azienda (companyId == customerId)
  const loadCompanyUsers = async () => {
    if (!customerId) return;
    try {
      const resp = await fetch(`${API_BASE}/api/Auth/users/${customerId}`, {
        headers: authHeaders(),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data: UserDetail[] = await resp.json();
      setCompanyUsers(data || []);
      setSelectedUserId(data?.[0]?.id ?? null);
      if (data?.[0]) {
        // pre-compila la form con il primo utente trovato
        setAccountForm((prev) => ({
          ...prev,
          username: data[0].username,
          email: data[0].email ?? "",
          accessLevel: data[0].accessLevel ?? "Affiliate",
          isEnabled: data[0].isEnabled,
          isAdmin: data[0].isAdmin,
          password: "",
          confirmPassword: "",
        }));
      } else {
        // nessun account esistente
        setAccountForm({
          username: "",
          email: formData.email || "",
          password: "",
          confirmPassword: "",
          accessLevel: "Affiliate",
          isEnabled: true,
          isAdmin: false,
        });
      }
    } catch (e: any) {
      console.error("Errore loadCompanyUsers:", e);
      alert("Errore nel caricamento utenti affiliato.");
    }
  };

  // Crea account affiliato
  const createAffiliateAccount = async () => {
    if (!customerId) {
      alert("Seleziona o salva prima il cliente.");
      return;
    }
    if (!accountForm.username.trim() || !accountForm.password.trim()) {
      alert("Username e Password sono obbligatori.");
      return;
    }
    setIsSavingAccount(true);
    try {
      const body = {
        username: accountForm.username.trim(),
        password: accountForm.password,
        idCustomer: customerId, // come da Swagger
        email: accountForm.email || null,
        accessLevel: accountForm.accessLevel || null,
      };
      const resp = await fetch(`${API_BASE}/api/Auth/create-affiliate-user`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore creazione account");
      await loadCompanyUsers();
      alert("Account affiliato creato con successo.");
    } catch (e: any) {
      console.error("Errore createAffiliateAccount:", e);
      alert(e.message || "Errore nella creazione account.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Aggiorna dati account selezionato
  const updateSelectedUser = async () => {
    if (!selectedUserId) return;
    setIsSavingAccount(true);
    try {
      const body = {
        email: accountForm.email || null,
        isEnabled: accountForm.isEnabled,
        isAdmin: accountForm.isAdmin,
        accessLevel: accountForm.accessLevel || null,
      };
      const resp = await fetch(
        `${API_BASE}/api/Auth/update-user/${selectedUserId}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(body),
        }
      );
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore aggiornamento utente");
      await loadCompanyUsers();
      alert("Dati account aggiornati.");
    } catch (e: any) {
      console.error("Errore updateSelectedUser:", e);
      alert(e.message || "Errore aggiornamento.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Cambia password
  const changePassword = async () => {
    if (!selectedUserId) return;
    if (!accountForm.password.trim())
      return alert("Inserisci la nuova password.");
    if (
      accountForm.confirmPassword.trim() &&
      accountForm.confirmPassword !== accountForm.password
    ) {
      return alert("La conferma password non coincide.");
    }
    setIsSavingAccount(true);
    try {
      const body = {
        newPassword: accountForm.password,
        confirmPassword: accountForm.confirmPassword || undefined,
      };
      const resp = await fetch(
        `${API_BASE}/api/Auth/change-password/${selectedUserId}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(body),
        }
      );
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore cambio password");
      setAccountForm((p) => ({ ...p, password: "", confirmPassword: "" }));
      alert("Password aggiornata.");
    } catch (e: any) {
      console.error("Errore changePassword:", e);
      alert(e.message || "Errore cambio password.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Attiva/Disattiva
  const toggleUserStatus = async () => {
    if (!selectedUserId) return;
    try {
      const resp = await fetch(
        `${API_BASE}/api/Auth/toggle-user-status/${selectedUserId}`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore cambio stato");
      await loadCompanyUsers();
      alert("Stato utente aggiornato.");
    } catch (e: any) {
      console.error("Errore toggleUserStatus:", e);
      alert(e.message || "Errore nel cambio stato.");
    }
  };

  const onSelectCustomer = (c: any) => {
    setCustomerId(c.id);
    setFormData({
      tipo: "Azienda",
      cliente: c.isCustomer ?? true,
      fornitore: !c.isCustomer,
      tipoCliente: c.tipoCliente || "",
      ragioneSociale: c.ragioneSociale || "",
      indirizzo: c.indirizzo || "",
      cognome: c.cognome || "",
      nome: c.nome || "",
      cap: c.cap || "",
      regione: c.regione || "",
      provincia: c.provincia || "",
      citta: c.citta || "",
      telefono: c.telefono || "",
      email: c.email || "",
      codiceFiscale: c.fiscalCode || "",
      partitaIva: c.pIva || "",
      emailPec: c.emailPec || "",
      codiceSdi: c.codiceSdi || "",
      iban: c.iban || "",
      // Campi affiliati
      isAffiliate: c.isAffiliate || false,
      affiliateCode: c.affiliateCode || "",
      affiliatedDataStart: c.affiliatedDataStart
        ? c.affiliatedDataStart.split("T")[0]
        : "",
      affiliatedDataEnd: c.affiliatedDataEnd
        ? c.affiliatedDataEnd.split("T")[0]
        : "",
      affiliateStatus: c.affiliateStatus ?? true,
    });
    setShowModal(false);
  };

  const resetForm = () => {
    setCustomerId(null);
    setFormData({
      tipo: "Azienda",
      cliente: true,
      fornitore: false,
      tipoCliente: "",
      ragioneSociale: "",
      indirizzo: "",
      cognome: "",
      nome: "",
      cap: "",
      regione: "",
      provincia: "",
      citta: "",
      telefono: "",
      email: "",
      codiceFiscale: "",
      partitaIva: "",
      emailPec: "",
      codiceSdi: "",
      iban: "",
      isAffiliate: false,
      affiliateCode: "",
      affiliatedDataStart: "",
      affiliatedDataEnd: "",
      affiliateStatus: true,
    });

    setTimeout(() => {
      ragioneSocialeInputRef.current?.focus();
    }, 0);
  };

  // Saòva i dati del Customer
  const handleSaveCustomer = async () => {
    // Validazioni esistenti
    if (!formData.ragioneSociale) {
      alert("Inserire una ragione sociale");
      return;
    }

    if (!formData.indirizzo) {
      alert("Inserire un indirizzo");
      return;
    }

    if (!formData.cap) {
      alert("Inserire un CAP");
      return;
    }

    if (!formData.regione) {
      alert("Inserire una regione");
      return;
    }

    if (!formData.provincia) {
      alert("Inserire una provincia");
      return;
    }

    if (!formData.citta) {
      alert("Inserire una città");
      return;
    }

    if (!formData.telefono) {
      alert("Inserire un numero di telefono");
      return;
    }

    if (!formData.email) {
      alert("Inserire un'email");
      return;
    }

    // Validazioni per affiliati
    if (formData.isAffiliate) {
      if (!formData.affiliateCode) {
        alert("Inserire un codice affiliato o generarlo automaticamente");
        return;
      }
      if (!formData.affiliatedDataStart) {
        alert("Inserire la data di inizio affiliazione");
        return;
      }
    }

    // PAYLOAD CORRETTO secondo lo schema API
    const payload = {
      ...(customerId && { id: customerId }),

      // Campi base - corrispondenti allo schema C_ANA_Company
      tipologia: "0",
      isCustomer: formData.cliente,
      isSupplier: formData.fornitore,
      tipoCliente: formData.tipoCliente || null,
      ragioneSociale: formData.ragioneSociale,
      indirizzo: formData.indirizzo,
      cognome: formData.tipo === "Persona" ? formData.cognome : null,
      nome: formData.tipo === "Persona" ? formData.nome : null,
      cap: formData.cap,
      regione: formData.regione,
      provincia: formData.provincia,
      citta: formData.citta,
      telefono: formData.telefono,
      email: formData.email,
      fiscalCode: formData.codiceFiscale || null,
      pIva: formData.partitaIva || null,
      emailPec: formData.emailPec || null,
      codiceSdi: formData.codiceSdi || null,
      iban: formData.iban || null,

      // Campi affiliazione - CORRETTI secondo lo schema
      isAffiliate: formData.isAffiliate,
      affiliateCode: formData.isAffiliate ? formData.affiliateCode : null,
      affiliatedDataStart:
        formData.isAffiliate && formData.affiliatedDataStart
          ? new Date(formData.affiliatedDataStart).toISOString()
          : null,
      affiliatedDataEnd:
        formData.isAffiliate && formData.affiliatedDataEnd
          ? new Date(formData.affiliatedDataEnd).toISOString()
          : null,

      // IMPORTANTE: affiliateStatus deve essere un INTEGER, non boolean
      // 0 = Inattivo, 1 = Attivo (o viceversa - verifica con il backend)
      affiliateStatus: formData.isAffiliate
        ? formData.affiliateStatus
          ? 1
          : 0 // Converti boolean a integer
        : null,

      // Altri campi che potrebbero essere richiesti
      active: true,
      isDeleted: false,
      nazione: "Italia",
      enabledFE: false,
      isVendolo: false,
      isVendoloFE: false,
    };

    // DEBUG DETTAGLIATO - AGGIUNGI QUESTO
    console.log("=== DEBUG SALVATAGGIO CLIENTE ===");
    console.log("customerId:", customerId);
    console.log("Tipo operazione:", customerId ? "UPDATE" : "CREATE");
    console.log(
      "formData.isAffiliate:",
      formData.isAffiliate,
      typeof formData.isAffiliate
    );
    console.log(
      "formData.affiliateStatus:",
      formData.affiliateStatus,
      typeof formData.affiliateStatus
    );
    console.log("formData.affiliateCode:", formData.affiliateCode);
    console.log("formData.affiliatedDataStart:", formData.affiliatedDataStart);
    console.log(
      "payload.isAffiliate:",
      payload.isAffiliate,
      typeof payload.isAffiliate
    );
    console.log(
      "payload.affiliateStatus:",
      payload.affiliateStatus,
      typeof payload.affiliateStatus
    );
    console.log("payload.affiliateCode:", payload.affiliateCode);
    console.log("Payload completo:", JSON.stringify(payload, null, 2));
    console.log("================================");

    try {
      const url = customerId
        ? `https://localhost:7148/api/customer/${customerId}`
        : `https://localhost:7148/api/customer`;

      const method = customerId ? "PUT" : "POST";

      console.log(`Chiamando ${method} ${url}`);
      console.log("Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          localStorage.getItem("token")
            ? "***TOKEN_PRESENTE***"
            : "***NO_TOKEN***"
        }`,
      });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("=== RESPONSE INFO ===");
      console.log("Response status:", response.status);
      console.log("Response statusText:", response.statusText);
      console.log("Response ok:", response.ok);
      console.log("Response headers:", Array.from(response.headers.entries()));
      console.log("====================");

      if (response.ok) {
        const message = customerId
          ? "Cliente aggiornato con successo!"
          : "Cliente creato con successo!";
        alert(message);

        if (!customerId) {
          try {
            const newCustomer = await response.json();
            console.log("Nuovo cliente creato dal server:", newCustomer);
            setCustomerId(newCustomer.id);
          } catch (parseError) {
            console.log(
              "Nessun JSON di risposta (normale per alcuni endpoint)"
            );
          }
        }

        // VERIFICA IMMEDIATA: ricarica i dati per vedere se sono stati salvati correttamente
        if (customerId) {
          console.log(
            "Verificando se i dati sono stati salvati correttamente..."
          );
          try {
            const verifyResponse = await fetch(
              `https://localhost:7148/api/customer/${customerId}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            if (verifyResponse.ok) {
              const savedCustomer = await verifyResponse.json();
              console.log("VERIFICA - Cliente salvato nel DB:", savedCustomer);
              console.log(
                "VERIFICA - isAffiliate nel DB:",
                savedCustomer.isAffiliate
              );
              console.log(
                "VERIFICA - affiliateStatus nel DB:",
                savedCustomer.affiliateStatus
              );
            }
          } catch (verifyError) {
            console.log("Errore nella verifica:", verifyError);
          }
        }
      } else {
        // Migliore gestione degli errori
        const errorText = await response.text();
        console.error("=== ERRORE DAL SERVER ===");
        console.error("Status:", response.status);
        console.error("StatusText:", response.statusText);
        console.error("Body:", errorText);
        console.error("========================");

        let errorMessage = "Errore nel salvataggio";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors) {
            // Se l'errore ha un formato strutturato con errori di validazione
            const validationErrors = Object.entries(errorJson.errors)
              .map(
                ([field, errors]) =>
                  `${field}: ${
                    Array.isArray(errors) ? errors.join(", ") : errors
                  }`
              )
              .join("\n");
            errorMessage = `Errori di validazione:\n${validationErrors}`;
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.title) {
            errorMessage = errorJson.title;
          }
        } catch (e) {
          // Se non è JSON, usa il testo grezzo
          errorMessage = `Errore nel salvataggio (${response.status}):\n${errorText}`;
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error("=== ERRORE DI RETE ===");
      console.error("Errore completo:", error);
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      console.error("======================");
      alert(`Errore di connessione: ${error.message}`);
    }
  };

  // Handler per gli switch - con debug
  const handleAffiliateToggle = (checked: boolean) => {
    console.log("Affiliate toggle clicked:", checked);
    setFormData((prev) => ({
      ...prev,
      isAffiliate: checked,
      // Reset dei campi affiliati se disabilitato
      ...(!checked && {
        affiliateCode: "",
        affiliatedDataStart: "",
        affiliatedDataEnd: "",
        affiliateStatus: true,
      }),
    }));
  };

  const handleAffiliateStatusToggle = (checked: boolean) => {
    console.log("Affiliate status toggle clicked:", checked);
    setFormData((prev) => ({
      ...prev,
      affiliateStatus: checked,
    }));
  };

  return (
    <>
      {loading && (
        <div className={styles.globalLoadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Caricamento...</p>
        </div>
      )}
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />

          <div className={styles.schedaHeader}>
            <div className={styles.leftBlock}>
              <div
                className={styles.roundBtn}
                title="Aggiungi un nuovo cliente"
                onClick={resetForm}
              >
                <span>+</span>
              </div>

              <div className={styles.dateBox}>
                <CalendarDays className="calendar-icon" />
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
                placeholder="Cerca cliente per nome, cognome o P.IVA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.searchButton}`}
                onClick={handleSearch}
              >
                Cerca
              </button>
            </div>

            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Home</span>
              <span className={styles.breadcrumbSeparator}> &gt; </span>
              <span className={styles.breadcrumbItem}>Anagrafica</span>
              <span className={styles.breadcrumbSeparator}> &gt; </span>
              <span className={styles.breadcrumbCurrent}>Aggiungi</span>
            </div>
          </div>

          {/* Form */}
          <div className="page-body">
            <div
              className="card bg-light card text-black"
              style={{ borderRadius: "10px" }}
            >
              <div className="custom-card-header">Dati Cliente / Fornitore</div>
              <div className={`card-body ${styles.customerForm}`}>
                <div className="row">
                  <div className={`col-md-6 ${styles.fieldGroup}`}>
                    <label>Ragione Sociale</label>
                    <input
                      className="form-control"
                      value={formData.ragioneSociale}
                      ref={ragioneSocialeInputRef}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ragioneSociale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={`col-md-6 ${styles.fieldGroup}`}>
                    <label>Indirizzo</label>
                    <input
                      className="form-control"
                      value={formData.indirizzo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          indirizzo: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>CAP</label>
                    <input
                      className="form-control"
                      value={formData.cap}
                      onChange={(e) =>
                        setFormData({ ...formData, cap: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Regione</label>
                    <input
                      className="form-control"
                      value={formData.regione}
                      onChange={(e) =>
                        setFormData({ ...formData, regione: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Provincia</label>
                    <input
                      className="form-control"
                      value={formData.provincia}
                      onChange={(e) =>
                        setFormData({ ...formData, provincia: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Città</label>
                    <input
                      className="form-control"
                      value={formData.citta}
                      onChange={(e) =>
                        setFormData({ ...formData, citta: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Telefono</label>
                    <input
                      className="form-control"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Email</label>
                    <input
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Codice Fiscale</label>
                    <input
                      className="form-control"
                      value={formData.codiceFiscale}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          codiceFiscale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Partita IVA</label>
                    <input
                      className="form-control"
                      value={formData.partitaIva}
                      onChange={(e) =>
                        setFormData({ ...formData, partitaIva: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className={`col-md-4 ${styles.fieldGroup}`}>
                    <label>Email PEC</label>
                    <input
                      className="form-control"
                      value={formData.emailPec}
                      onChange={(e) =>
                        setFormData({ ...formData, emailPec: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-4 ${styles.fieldGroup}`}>
                    <label>Codice SDI</label>
                    <input
                      className="form-control"
                      value={formData.codiceSdi}
                      onChange={(e) =>
                        setFormData({ ...formData, codiceSdi: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-4 ${styles.fieldGroup}`}>
                    <label>IBAN</label>
                    <input
                      className="form-control"
                      value={formData.iban}
                      onChange={(e) =>
                        setFormData({ ...formData, iban: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Sezione Affiliazione - CORRETTA E FUNZIONALE */}
                <div className={styles.affiliateSection}>
                  <div className={styles.affiliateTitle}>
                    <Shield size={20} />
                    Gestione Affiliazione
                  </div>

                  <div className="row">
                    <div className={`col-md-6 ${styles.fieldGroup}`}>
                      <div className={styles.switchGroup}>
                        <label htmlFor="isAffiliateSwitch">
                          È un affiliato?
                        </label>
                        <div className={styles.switchContainer}>
                          <input
                            id="isAffiliateSwitch"
                            type="checkbox"
                            className={styles.switchInput}
                            checked={formData.isAffiliate}
                            onChange={(e) =>
                              handleAffiliateToggle(e.target.checked)
                            }
                          />
                          <span
                            className={styles.switchSlider}
                            onClick={() =>
                              handleAffiliateToggle(!formData.isAffiliate)
                            }
                          ></span>
                        </div>
                        <span
                          className={`${styles.statusText} ${
                            formData.isAffiliate
                              ? styles.statusTextActive
                              : styles.statusTextInactive
                          }`}
                        >
                          {formData.isAffiliate ? "Sì" : "No"}
                        </span>
                      </div>
                    </div>

                    {formData.isAffiliate && (
                      <div className={`col-md-6 ${styles.fieldGroup}`}>
                        <div className={styles.switchGroup}>
                          <label htmlFor="affiliateStatusSwitch">
                            Stato affiliazione
                          </label>
                          <div className={styles.switchContainer}>
                            <input
                              id="affiliateStatusSwitch"
                              type="checkbox"
                              className={styles.switchInput}
                              checked={formData.affiliateStatus}
                              onChange={(e) =>
                                handleAffiliateStatusToggle(e.target.checked)
                              }
                            />
                            <span
                              className={styles.switchSlider}
                              onClick={() =>
                                handleAffiliateStatusToggle(
                                  !formData.affiliateStatus
                                )
                              }
                            ></span>
                          </div>
                          <span
                            className={`${styles.statusBadge} ${
                              formData.affiliateStatus
                                ? styles.statusActive
                                : styles.statusInactive
                            }`}
                          >
                            {formData.affiliateStatus ? "Attivo" : "Inattivo"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.isAffiliate && (
                    <>
                      <div className="row">
                        <div className={`col-md-8 ${styles.fieldGroup}`}>
                          <div className={styles.affiliateCodeGroup}>
                            <div className={styles.fieldGroup}>
                              <label>Codice Affiliato</label>
                              <input
                                className="form-control"
                                value={formData.affiliateCode}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    affiliateCode: e.target.value,
                                  })
                                }
                                placeholder="Es: AFF123456ABC"
                              />
                            </div>
                            <button
                              type="button"
                              className={styles.codeGenerateBtn}
                              onClick={generateAffiliateCode}
                              title="Genera codice automatico"
                            >
                              Genera
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className={`col-md-6 ${styles.fieldGroup}`}>
                          <label>Data Inizio Affiliazione</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.affiliatedDataStart}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                affiliatedDataStart: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={`col-md-6 ${styles.fieldGroup}`}>
                          <label>Data Fine Affiliazione (opzionale)</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.affiliatedDataEnd}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                affiliatedDataEnd: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* === ACCOUNT DI ACCESSO AFFILIATO === */}
                <div
                  className={styles.customerFormContainer}
                  style={{ marginTop: 16 }}
                >
                  <div className={styles.affiliateTitle}>
                    <Shield size={20} />
                    Account di accesso affiliato
                  </div>

                  {/* Messaggio se manca il cliente */}
                  {!customerId ? (
                    <div className="text-muted">
                      Seleziona o salva prima un cliente per abilitare la
                      gestione account.
                    </div>
                  ) : (
                    <>
                      <div className="d-flex gap-2 mb-3">
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnSecondary}`}
                          onClick={loadCompanyUsers}
                        >
                          Carica/aggiorna utenti
                        </button>

                        {selectedUserId && (
                          <span
                            className={`${styles.statusBadge} ${
                              accountForm.isEnabled
                                ? styles.statusActive
                                : styles.statusInactive
                            }`}
                          >
                            {accountForm.isEnabled ? "Attivo" : "Disattivo"}
                          </span>
                        )}
                      </div>

                      {/* Se ci sono utenti, seleziona quello da modificare */}
                      {companyUsers.length > 0 && (
                        <div className="row mb-3">
                          <div className={`col-md-6 ${styles.fieldGroup}`}>
                            <label>Utente affiliato</label>
                            <select
                              className="form-select"
                              value={selectedUserId ?? ""}
                              onChange={(e) => {
                                const id = e.target.value || null;
                                setSelectedUserId(id);
                                const u = companyUsers.find(
                                  (x) => x.id === id!
                                );
                                if (u) {
                                  setAccountForm((p) => ({
                                    ...p,
                                    username: u.username,
                                    email: u.email ?? "",
                                    accessLevel: u.accessLevel ?? "Affiliate",
                                    isEnabled: u.isEnabled,
                                    isAdmin: u.isAdmin,
                                    password: "",
                                    confirmPassword: "",
                                  }));
                                }
                              }}
                            >
                              {companyUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.username} {u.email ? `(${u.email})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Form creazione/modifica */}
                      <div className="row">
                        <div className={`col-md-4 ${styles.fieldGroup}`}>
                          <label>Username</label>
                          <input
                            className="form-control"
                            value={accountForm.username}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                username: e.target.value,
                              })
                            }
                            disabled={!!selectedUserId} // username fisso in modifica
                          />
                        </div>
                        <div className={`col-md-4 ${styles.fieldGroup}`}>
                          <label>Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={accountForm.email}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={`col-md-4 ${styles.fieldGroup}`}>
                          <label>Access level</label>
                          <input
                            className="form-control"
                            value={accountForm.accessLevel}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                accessLevel: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Password: in creazione oppure azione dedicata in modifica */}
                      {!selectedUserId ? (
                        <div className="row">
                          <div className={`col-md-4 ${styles.fieldGroup}`}>
                            <label>Password</label>
                            <input
                              type="password"
                              className="form-control"
                              value={accountForm.password}
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  password: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className={`col-md-4 ${styles.fieldGroup}`}>
                            <label>Conferma Password (opz.)</label>
                            <input
                              type="password"
                              className="form-control"
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
                      ) : (
                        <div className="row">
                          <div className={`col-md-4 ${styles.fieldGroup}`}>
                            <label>Nuova Password</label>
                            <input
                              type="password"
                              className="form-control"
                              value={accountForm.password}
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  password: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className={`col-md-4 ${styles.fieldGroup}`}>
                            <label>Conferma (opz.)</label>
                            <input
                              type="password"
                              className="form-control"
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
                      )}

                      {/* Azioni */}
                      <div className="d-flex gap-2 mt-3">
                        {!selectedUserId ? (
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={createAffiliateAccount}
                            disabled={isSavingAccount}
                          >
                            Crea account affiliato
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnPrimary}`}
                              onClick={updateSelectedUser}
                              disabled={isSavingAccount}
                            >
                              Salva modifiche
                            </button>

                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnSecondary}`}
                              onClick={changePassword}
                              disabled={
                                isSavingAccount || !accountForm.password
                              }
                              title="Imposta la nuova password"
                            >
                              Cambia password
                            </button>

                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnDanger}`}
                              onClick={toggleUserStatus}
                            >
                              {accountForm.isEnabled ? "Disattiva" : "Attiva"}{" "}
                              utente
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="row mt-4">
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={handleSaveCustomer}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Risultati ricerca</h4>
            <ul>
              {searchResults.map((c: any) => (
                <li
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{c.ragioneSociale}</strong> - {c.telefono} -{" "}
                      {c.indirizzo} - {c.citta} ({c.provincia})
                    </div>
                    {c.isAffiliate && (
                      <span
                        className={`${styles.statusBadge} ${styles.statusActive}`}
                      >
                        <Users size={12} /> Affiliato
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowModal(false)}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyMaster;
