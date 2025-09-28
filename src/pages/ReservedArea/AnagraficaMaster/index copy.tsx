import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../../components/sidebar-admin";
import Topbar from "../../../components/topbar";
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
  console.log("formData.isAffiliate:", formData.isAffiliate, typeof formData.isAffiliate);
  console.log("formData.affiliateStatus:", formData.affiliateStatus, typeof formData.affiliateStatus);
  console.log("formData.affiliateCode:", formData.affiliateCode);
  console.log("formData.affiliatedDataStart:", formData.affiliatedDataStart);
  console.log("payload.isAffiliate:", payload.isAffiliate, typeof payload.isAffiliate);
  console.log("payload.affiliateStatus:", payload.affiliateStatus, typeof payload.affiliateStatus);
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
      Authorization: `Bearer ${localStorage.getItem("token") ? "***TOKEN_PRESENTE***" : "***NO_TOKEN***"}`,
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
          console.log("Nessun JSON di risposta (normale per alcuni endpoint)");
        }
      }
      
      // VERIFICA IMMEDIATA: ricarica i dati per vedere se sono stati salvati correttamente
      if (customerId) {
        console.log("Verificando se i dati sono stati salvati correttamente...");
        try {
          const verifyResponse = await fetch(`https://localhost:7148/api/customer/${customerId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          
          if (verifyResponse.ok) {
            const savedCustomer = await verifyResponse.json();
            console.log("VERIFICA - Cliente salvato nel DB:", savedCustomer);
            console.log("VERIFICA - isAffiliate nel DB:", savedCustomer.isAffiliate);
            console.log("VERIFICA - affiliateStatus nel DB:", savedCustomer.affiliateStatus);
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
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
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
