import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from "./styles.module.css";
import { CalendarDays } from "lucide-react";

// Definizione dei tipi per la diagnostica
interface DiagnosticItem {
  id: string;
  icon: string;
  label: string;
  active: boolean;
}

// Tipo per i dati del cliente
interface CustomerData {
  id: string;
  tipologia: string;
  ragioneSociale: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  cap: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  regione: string;
  fiscalCode: string;
  pIva: string;
  emailPec: string;
  codiceSdi: string;
  iban: string;
}

const Accettazione: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  // Stati per la ricerca cliente
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );

  // Refs per gestire il dropdown
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Stati per i campi del form cliente
  const [clienteData, setClienteData] = useState({
    email: "",
    nome: "",
    cognome: "",
    telefono: "",
    cap: "",
  });

  // Stati per il modal di inserimento nuovo cliente
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    tipo: "Privato",
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
  });
  const [savingNewClient, setSavingNewClient] = useState(false);

  // Stato per gli elementi diagnostici
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticItem[]>([
    {
      id: "device-info",
      icon: "📱",
      label: "Info sul dispositivo",
      active: true,
    },
    { id: "apple-pay", icon: "💳", label: "Apple Pay", active: true },
    { id: "battery", icon: "🔋", label: "Condizione batteria", active: true },
    { id: "bluetooth", icon: "🔵", label: "Bluetooth", active: true },
    { id: "camera", icon: "📷", label: "Fotocamera", active: true },
    { id: "cellular", icon: "📡", label: "Rete dati cellulare", active: true },
    { id: "clock", icon: "⏰", label: "Orologio", active: true },
    { id: "sim", icon: "🔐", label: "SIM", active: true },
    { id: "face-id", icon: "😊", label: "Face ID", active: true },
    { id: "scanner", icon: "🔍", label: "Scanner UDID", active: true },
    { id: "magsafe", icon: "🔐", label: "MagSafe", active: true },
    { id: "sensors", icon: "📊", label: "Sensori", active: true },
    { id: "services", icon: "☁️", label: "Servizi", active: true },
    { id: "software", icon: "⚙️", label: "Software", active: true },
    { id: "system", icon: "📻", label: "Sistema", active: true },
    { id: "wifi", icon: "📶", label: "Wi-Fi", active: true },
    { id: "rf-cellular", icon: "🎵", label: "RF cellulare", active: true },
    {
      id: "wireless-problem",
      icon: "⚡",
      label: "Problema wireless",
      active: true,
    },
  ]);

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

  // Effetto per gestire i click fuori dal dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Funzione per la ricerca cliente con debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Se il campo è vuoto, nascondi il dropdown
    if (!value.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    // Imposta un nuovo timeout per la ricerca
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms di debouncing
  };

  // Funzione per eseguire la ricerca
  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    const multitenantId = localStorage.getItem("IdCompany");

    try {
      const response = await fetch(
        `https://localhost:7148/api/customer/search?query=${encodeURIComponent(
          query
        )}&multitenantId=${encodeURIComponent(multitenantId || "")}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowDropdown(true);
      } else {
        console.error("Errore nella ricerca");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per selezionare un cliente
  const onSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.ragioneSociale);
    setShowDropdown(false);

    // Popola i campi del form cliente
    setClienteData({
      email: customer.email || "",
      nome: customer.nome || "",
      cognome: customer.cognome || "",
      telefono: customer.telefono || "",
      cap: customer.cap || "",
    });
  };

  // Funzione per cancellare la selezione
  const clearSelection = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
    setClienteData({
      email: "",
      nome: "",
      cognome: "",
      telefono: "",
      cap: "",
    });
  };

  // Funzione per cambiare lo stato di un elemento diagnostico
  const toggleDiagnosticItem = (id: string) => {
    setDiagnosticItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  // Funzione per aprire il modal di nuovo cliente
  const openNewClientModal = () => {
    setNewClientData({
      tipo: "Privato",
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
    });
    setShowNewClientModal(true);
  };

  // Funzione per salvare il nuovo cliente
  const handleSaveNewClient = async () => {
    if (!newClientData.tipo) {
      alert("Selezionare un tipo di cliente");
      return;
    }

    const isPrivato = newClientData.tipo === "Privato";
    const tipologia = isPrivato ? "1" : "0";

    const ragioneSociale = isPrivato
      ? `${newClientData.cognome} ${newClientData.nome}`.trim()
      : newClientData.ragioneSociale;

    if (!isPrivato && ragioneSociale === "") {
      alert("Inserire una ragione sociale");
      return;
    }

    if (!newClientData.indirizzo) {
      alert("Inserire un indirizzo");
      return;
    }

    if (!newClientData.cap) {
      alert("Inserire un CAP");
      return;
    }

    if (!newClientData.regione) {
      alert("Inserire una regione");
      return;
    }

    if (!newClientData.provincia) {
      alert("Inserire una provincia");
      return;
    }

    if (!newClientData.citta) {
      alert("Inserire una città");
      return;
    }

    if (!newClientData.telefono) {
      alert("Inserire un numero di telefono");
      return;
    }

    if (!newClientData.email) {
      alert("Inserire un'email");
      return;
    }

    const payload = {
      tipologia: tipologia,
      isCustomer: newClientData.cliente,
      tipoCliente: newClientData.tipoCliente,
      ragioneSociale: ragioneSociale,
      indirizzo: newClientData.indirizzo,
      cognome: isPrivato ? newClientData.cognome : null,
      nome: isPrivato ? newClientData.nome : null,
      cap: newClientData.cap,
      regione: newClientData.regione,
      provincia: newClientData.provincia,
      citta: newClientData.citta,
      telefono: newClientData.telefono,
      email: newClientData.email,
      fiscalCode: newClientData.codiceFiscale,
      pIva: newClientData.partitaIva,
      emailPec: newClientData.emailPec,
      codiceSdi: newClientData.codiceSdi,
      iban: newClientData.iban,
      multitenantId: localStorage.getItem("IdCompany") || "",
    };

    setSavingNewClient(true);

    try {
      const response = await fetch("https://localhost:7148/api/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        alert("Cliente creato con successo!");

        // Seleziona automaticamente il cliente appena creato
        const customerData: CustomerData = {
          id: newCustomer.id,
          tipologia: newCustomer.tipologia,
          ragioneSociale: newCustomer.ragioneSociale,
          nome: newCustomer.nome || "",
          cognome: newCustomer.cognome || "",
          email: newCustomer.email || "",
          telefono: newCustomer.telefono || "",
          cap: newCustomer.cap || "",
          indirizzo: newCustomer.indirizzo || "",
          citta: newCustomer.citta || "",
          provincia: newCustomer.provincia || "",
          regione: newCustomer.regione || "",
          fiscalCode: newCustomer.fiscalCode || "",
          pIva: newCustomer.pIva || "",
          emailPec: newCustomer.emailPec || "",
          codiceSdi: newCustomer.codiceSdi || "",
          iban: newCustomer.iban || "",
        };

        // Applica il cliente appena creato alla form
        onSelectCustomer(customerData);

        // Chiudi il modal
        setShowNewClientModal(false);
      } else {
        const errText = await response.text();
        alert("Errore nel salvataggio:\n" + errText);
      }
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore durante il salvataggio");
    } finally {
      setSavingNewClient(false);
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
              <span className={styles.plusIcon}>+</span>
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
            <span className={styles.breadcrumbCurrent}>Crea Riparazione</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          <div className={styles.repairFormContainer}>
            {/* Header della pagina */}
            <div className={styles.pageTitle}>
              <h1>Crea Riparazione</h1>
              <p>Autorizzazione al Lavoro</p>
            </div>

            {/* Layout principale */}
            <div className={styles.pageContainer}>
              {/* Colonna sinistra */}
              <div className={styles.leftColumn}>
                <div className={styles.topRow}>
                  {/* Sezione Cliente */}
                  <div className={styles.formSection}>
                    <h3>Cliente</h3>

                    {/* Campo di ricerca cliente con dropdown */}
                    <div className={styles.formGroup}>
                      <label>Cerca Cliente esistente</label>
                      <div className={styles.searchContainer}>
                        <input
                          ref={searchInputRef}
                          type="text"
                          className={`${styles.formControl} ${styles.searchInput}`}
                          placeholder="Digita nome, cognome o ragione sociale..."
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          onFocus={() => {
                            if (searchResults.length > 0) {
                              setShowDropdown(true);
                            }
                          }}
                        />

                        {/* Pulsante per aggiungere nuovo cliente */}
                        <button
                          type="button"
                          className={styles.addClientButton}
                          onClick={openNewClientModal}
                          title="Aggiungi nuovo cliente"
                        >
                          +
                        </button>

                        {/* Mostra X per cancellare la selezione */}
                        {selectedCustomer && (
                          <button
                            type="button"
                            className={styles.clearButton}
                            onClick={clearSelection}
                            title="Cancella selezione"
                          >
                            ×
                          </button>
                        )}

                        {/* Loading indicator */}
                        {loading && (
                          <div className={styles.loadingIndicator}>
                            <div className={styles.spinner}></div>
                          </div>
                        )}

                        {/* Dropdown risultati */}
                        {showDropdown && searchResults.length > 0 && (
                          <div ref={dropdownRef} className={styles.dropdown}>
                            {searchResults.map((customer) => (
                              <div
                                key={customer.id}
                                className={styles.dropdownItem}
                                onClick={() => onSelectCustomer(customer)}
                              >
                                <div className={styles.customerInfo}>
                                  <div className={styles.customerName}>
                                    <strong>{customer.ragioneSociale}</strong>
                                  </div>
                                  <div className={styles.customerDetails}>
                                    {customer.email && (
                                      <span>{customer.email}</span>
                                    )}
                                    {customer.telefono && (
                                      <span> • {customer.telefono}</span>
                                    )}
                                  </div>
                                  <div className={styles.customerAddress}>
                                    {customer.indirizzo} - {customer.citta} (
                                    {customer.provincia})
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Campi cliente auto-compilati */}
                    <div className={styles.formGroup}>
                      <label>E-Mail</label>
                      <input
                        type="email"
                        className={styles.formControl}
                        value={clienteData.email}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            email: e.target.value,
                          })
                        }
                        placeholder="E-mail del cliente"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Nome</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={clienteData.nome}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            nome: e.target.value,
                          })
                        }
                        placeholder="Nome del cliente"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cognome</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={clienteData.cognome}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            cognome: e.target.value,
                          })
                        }
                        placeholder="Cognome del cliente"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Telefono</label>
                      <input
                        type="tel"
                        className={styles.formControl}
                        value={clienteData.telefono}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            telefono: e.target.value,
                          })
                        }
                        placeholder="Numero di telefono"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cap</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={clienteData.cap}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            cap: e.target.value,
                          })
                        }
                        placeholder="CAP"
                      />
                    </div>
                  </div>

                  {/* Sezione Dispositivo */}
                  <div className={styles.formSection}>
                    <h3>Dispositivo</h3>
                    <div className={styles.formGroup}>
                      <label>Numero di serie/IMEI</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        defaultValue="359560232396424D"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Dispositivo</label>
                      <select className={styles.formControl}>
                        <option value="">-- Seleziona --</option>
                        <option value="iPhone" selected>
                          iPhone
                        </option>
                        <option value="iPad">iPad</option>
                        <option value="Mac">Mac</option>
                        <option value="Watch">Watch</option>
                        <option value="AirPods">AirPods</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Modello</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        defaultValue="14 Pro"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Colore</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        defaultValue="Oro Purple"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Codice di Sblocco</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        defaultValue="123456"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Telefono di cortesia</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        defaultValue="SI"
                      />
                    </div>
                  </div>
                </div>

                {/* Sezione Diagnostica */}
                <div
                  className={`${styles.formSection} ${styles.diagnosticaSection}`}
                >
                  <h3>Diagnostica di ricezione</h3>
                  <div className={styles.diagnosticaGrid}>
                    {diagnosticItems.map((item) => (
                      <div
                        key={item.id}
                        className={styles.diagnosticaItemWrapper}
                      >
                        <div
                          className={`${styles.diagnosticaItem} ${
                            item.active ? styles.active : styles.inactive
                          }`}
                          onClick={() => toggleDiagnosticItem(item.id)}
                        >
                          <div className={styles.diagnosticaIcon}>
                            {item.icon}
                          </div>
                        </div>
                        <div className={styles.diagnosticaLabel}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colonna destra */}
              <div className={styles.rightColumn}>
                {/* Info generazione automatica */}
                <div className={styles.autoGenerationInfo}>
                  <div className={styles.formGroup}>
                    <label>Data e ora di creazione</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      defaultValue="gg/mm/aa oo:mm generato automaticamente"
                      readOnly
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cod. scheda</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      defaultValue="generato automaticamente"
                      readOnly
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Assegnata a</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      defaultValue="menu a tendina con lista tecnici"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Gestita in</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      defaultValue="menu a tendina"
                    />
                  </div>
                </div>

                {/* Sezione Riparazione */}
                <div className={styles.formSection}>
                  <h3>Riparazione</h3>
                  <div className={styles.formGroup}>
                    <label>Componente/riparazione</label>
                    <select className={styles.formControl}>
                      <option value="">-- Seleziona --</option>
                      <option value="Schermo">Schermo</option>
                      <option value="Batteria">Batteria</option>
                      <option value="Altri Danni">Altri Danni</option>
                      <option value="Scheda Madre">Scheda Madre</option>
                      <option value="Software">Software</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Descrizione dell'intervento/problema</label>
                    <textarea
                      className={styles.formControl}
                      rows={4}
                      defaultValue="Sostituzione del vetro dello schermo"
                    ></textarea>
                  </div>
                </div>

                {/* Sezione Prezzo */}
                <div className={styles.formSection}>
                  <h3>Prezzo</h3>
                  <div className={styles.formGroup}>
                    <label>Prezzo Preventivo iva inclusa</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      defaultValue="399,00 Eur"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tipo di Pagamento</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      defaultValue="Amex"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Informazioni per la fatturazione</label>
                    <textarea
                      className={styles.formControl}
                      rows={3}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottoni */}
            <div className={styles.formActions}>
              <button className={`${styles.btn} ${styles.btnSuccess}`}>
                Crea/Invia E-Mail
              </button>
              <button className={`${styles.btn} ${styles.btnSecondary}`}>
                Crea/Stampa
              </button>
              <button className={`${styles.btn} ${styles.btnSecondary}`}>
                Crea/Stampa etichetta
              </button>
              <button className={`${styles.btn} ${styles.btnDark}`}>
                Crea/Stampa/Spedisci al Lab
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal per inserimento nuovo cliente */}
      {showNewClientModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowNewClientModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h4>Aggiungi Nuovo Cliente</h4>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowNewClientModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.customerForm}>
                <div className={styles.formRow}>
                  <div className={styles.formCol3}>
                    <label>Tipo</label>
                    <select
                      className={styles.formControl}
                      value={newClientData.tipo}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          tipo: e.target.value,
                        })
                      }
                    >
                      <option>Privato</option>
                      <option>Azienda</option>
                    </select>
                  </div>
                  <div className={styles.formCol3}>
                    <label style={{ marginBottom: "16px" }}>Tipo Cliente</label>
                    <div className={styles.checkboxGroup}>
                      <label>
                        <input
                          type="checkbox"
                          checked={newClientData.cliente}
                          onChange={(e) =>
                            setNewClientData({
                              ...newClientData,
                              cliente: e.target.checked,
                            })
                          }
                        />
                        Cliente
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={newClientData.fornitore}
                          onChange={(e) =>
                            setNewClientData({
                              ...newClientData,
                              fornitore: e.target.checked,
                            })
                          }
                        />
                        Fornitore
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.formRow}>
                  {newClientData.tipo === "Azienda" ? (
                    <>
                      <div className={styles.formCol6}>
                        <label>Ragione Sociale</label>
                        <input
                          className={styles.formControl}
                          value={newClientData.ragioneSociale}
                          onChange={(e) =>
                            setNewClientData({
                              ...newClientData,
                              ragioneSociale: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className={styles.formCol6}>
                        <label>Indirizzo</label>
                        <input
                          className={styles.formControl}
                          value={newClientData.indirizzo}
                          onChange={(e) =>
                            setNewClientData({
                              ...newClientData,
                              indirizzo: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.formCol6}>
                        <div className={styles.nameGroup}>
                          <div className={styles.formCol6}>
                            <label>Cognome</label>
                            <input
                              className={styles.formControl}
                              value={newClientData.cognome}
                              onChange={(e) =>
                                setNewClientData({
                                  ...newClientData,
                                  cognome: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className={styles.formCol6}>
                            <label>Nome</label>
                            <input
                              className={styles.formControl}
                              value={newClientData.nome}
                              onChange={(e) =>
                                setNewClientData({
                                  ...newClientData,
                                  nome: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className={styles.formCol6}>
                        <label>Indirizzo</label>
                        <input
                          className={styles.formControl}
                          value={newClientData.indirizzo}
                          onChange={(e) =>
                            setNewClientData({
                              ...newClientData,
                              indirizzo: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formCol3}>
                    <label>CAP</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.cap}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          cap: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Regione</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.regione}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          regione: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Provincia</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.provincia}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          provincia: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Città</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.citta}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          citta: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formCol3}>
                    <label>Telefono</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.telefono}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          telefono: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Email</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.email}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Codice Fiscale</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.codiceFiscale}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          codiceFiscale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Partita IVA</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.partitaIva}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          partitaIva: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formCol3}>
                    <label>Email PEC</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.emailPec}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          emailPec: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Codice SDI</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.codiceSdi}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          codiceSdi: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>IBAN</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.iban}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          iban: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowNewClientModal(false)}
              >
                Annulla
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSaveNewClient}
                disabled={savingNewClient}
              >
                {savingNewClient ? "Salvando..." : "Salva Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accettazione;
