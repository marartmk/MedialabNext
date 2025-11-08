import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from "./styles.module.css";
import BottomBar from "../../components/BottomBar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { it } from "date-fns/locale";

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

// 🆕 AGGIUNGI QUESTA INTERFACE
interface BookingResponse {
  id: number;
  bookingId: string;
  bookingCode: string;
  customerName: string;
  scheduledDate: string;
  scheduledTime: string;
  deviceType: string;
  deviceModel: string;
  bookingStatus: string;
  message: string;
  createdAt: string;
}

const Prenotazioni: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  const API_URL = import.meta.env.VITE_API_URL;

  // Stati per la ricerca cliente
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null
  );
  const [operators, setOperators] = useState<Operator[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Refs per gestire i dropdown
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stati per i campi del form cliente
  const [clienteData, setClienteData] = useState({
    email: "",
    nome: "",
    cognome: "",
    telefono: "",
    cap: "",
  });

  // Stati per i campi del form dispositivo
  const [dispositivoData, setDispositivoData] = useState({
    dispositivo: "iPhone",
    modello: "",
    colore: "",
  });

  const [repairComponent, setRepairComponent] = useState("");

  // Stati per la riparazione
  const [riparazioneData, setRiparazioneData] = useState({
    dataOraPrenotazione: "",
    codicePrenotazione: "generato automaticamente",
    tecnicoAssegnato: "",
    componentiProblema: "",
    descrizioneInterventoProblema: "",
    prezzoPreventivato: "",
    tipoPagamento: "Amex",
    informazioneFatturazione: "",
  });

  // Define a type for Operator
  interface Operator {
    id: string;
    firstName: string;
    lastName: string;
    codiceDipendente?: string;
    internalCode?: string;
    email?: string;
    phoneNumber?: string;
  }

  // Stato per il DatePicker
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Stati per il menù tecnici
  const tecniciDropdownRef = useRef<HTMLDivElement>(null);

  // Stati per i modal
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<BookingResponse | null>(
    null
  );

  // Nome azienda e utente (prelevati dalla sessionStorage se presenti)
  const companyName =
    (typeof window !== "undefined" && sessionStorage.getItem("fullName")) ||
    "CLINICA iPHONE STORE";
  const userName =
    (typeof window !== "undefined" &&
      (sessionStorage.getItem("userId") ||
        sessionStorage.getItem("username") ||
        "")) ||
    "Utente";

  // Tipi di dispositivo
  const deviceTypes = [
    { value: "iPhone", label: "📱 iPhone" },
    { value: "iPad", label: "📱 iPad" },
    { value: "Mac", label: "💻 Mac" },
    { value: "Watch", label: "⌚ Watch" },
    { value: "AirPods", label: "🎧 AirPods" },
  ];

  const tipoPagamentoOptions = [
    "Amex",
    "Carta di Credito",
    "Contanti",
    "Bonifico",
    "PayPal",
  ];

  // Imposta data e ora corrente
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setDateTime({ date: dateStr, time: timeStr });

    // Imposta anche la data e ora di prenotazione in formato italiano
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;

    setRiparazioneData((prev) => ({
      ...prev,
      dataOraPrenotazione: formattedDateTime,
    }));
  }, []);

  // Genera codice prenotazione automatico quando viene selezionato un cliente
  useEffect(() => {
    if (selectedCustomer) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const timestamp = Date.now().toString().slice(-6); // 6 cifre invece di 4
      const random = Math.floor(Math.random() * 100); // Numero random 00-99 come ulteriore sicurezza
      const bookingCode = `BOOK-${year}${month}${day}-${timestamp}${random}`;

      setRiparazioneData((prev) => ({
        ...prev,
        codicePrenotazione: bookingCode,
      }));
    }
  }, [selectedCustomer]);

  // Gestione click fuori dal dropdown clienti
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

  // Gestione click fuori dal dropdown tecnici
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tecniciDropdownRef.current &&
        !tecniciDropdownRef.current.contains(event.target as Node)
      ) {
        //setShowTecniciDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carica gli operatori al mount del componente
  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      const response = await fetch(`${API_URL}/api/operator`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const operatorsData = await response.json();
        setOperators(operatorsData);
      } else {
        console.error("Errore nel caricamento operatori");
      }
    } catch (error) {
      console.error("Errore durante il caricamento operatori:", error);

      // In caso di errore, usa comunque i dati fake
      const fakeOperators = [
        {
          id: "1",
          firstName: "Mario",
          lastName: "Rossi",
          codiceDipendente: "TEC001",
          email: "mario.rossi@medialab.it",
          phoneNumber: "+39 333 1234567",
        },
        {
          id: "2",
          firstName: "Luigi",
          lastName: "Verdi",
          codiceDipendente: "TEC002",
          email: "luigi.verdi@medialab.it",
          phoneNumber: "+39 333 2345678",
        },
        {
          id: "3",
          firstName: "Giuseppe",
          lastName: "Bianchi",
          codiceDipendente: "TEC003",
          email: "giuseppe.bianchi@medialab.it",
          phoneNumber: "+39 333 3456789",
        },
      ];

      setOperators(fakeOperators);
    }
  };

  // Funzione per la ricerca del cliente
  const handleSearchClient = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const multitenantId = sessionStorage.getItem("IdCompany");
        const response = await fetch(
          `${API_URL}/api/customer/search?query=${encodeURIComponent(
            query
          )}&multitenantId=${encodeURIComponent(multitenantId || "")}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
          setShowDropdown(true);
        } else {
          console.error("Errore nella ricerca clienti");
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Errore nella ricerca del cliente:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Funzione per selezionare un cliente
  const handleSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setSearchQuery(
      customer.tipologia === "Azienda"
        ? customer.ragioneSociale
        : `${customer.cognome} ${customer.nome}`
    );
    setClienteData({
      email: customer.email,
      nome: customer.nome,
      cognome: customer.cognome,
      telefono: customer.telefono,
      cap: customer.cap,
    });
    setShowDropdown(false);
  };

  // Funzione per cancellare la ricerca
  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedCustomer(null);
    setSearchResults([]);
    setShowDropdown(false);
    setClienteData({
      email: "",
      nome: "",
      cognome: "",
      telefono: "",
      cap: "",
    });
  };

  // Funzione per gestire il salvataggio del nuovo cliente
  const handleSaveNewClient = async () => {
    // Validazione base
    if (newClientData.tipo === "Privato") {
      if (!newClientData.nome || !newClientData.cognome) {
        alert("Nome e cognome sono obbligatori per i clienti privati");
        return;
      }
    } else if (newClientData.tipo === "Azienda") {
      if (
        !newClientData.ragioneSociale ||
        !newClientData.nome ||
        !newClientData.cognome
      ) {
        alert(
          "Ragione sociale e dati del referente sono obbligatori per le aziende"
        );
        return;
      }
    }

    setSavingNewClient(true);
    try {
      const response = await fetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClientData),
      });

      if (response.ok) {
        const savedCustomer = await response.json();
        handleSelectCustomer(savedCustomer);
        setShowNewClientModal(false);

        // Reset form
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

        alert("Cliente creato con successo!");
      } else {
        const error = await response.json();
        alert(`Errore: ${error.message || "Impossibile creare il cliente"}`);
      }
    } catch (error) {
      console.error("Errore nel salvataggio del cliente:", error);
      alert("Errore durante la creazione del cliente");
    } finally {
      setSavingNewClient(false);
    }
  };

  // Funzione per validare il form
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedCustomer) {
      errors.push("Seleziona un cliente");
    }
    if (!dispositivoData.dispositivo) {
      errors.push("Seleziona il tipo di dispositivo");
    }
    if (!dispositivoData.modello.trim()) {
      errors.push("Inserisci il modello del dispositivo");
    }
    if (!riparazioneData.dataOraPrenotazione.trim()) {
      errors.push("Inserisci data e ora di prenotazione");
    }
    if (!selectedOperator) {
      errors.push("Seleziona un tecnico");
    }
    if (!repairComponent) {
      errors.push("Selezionare il componente/tipo di riparazione");
    }
    if (!riparazioneData.descrizioneInterventoProblema.trim()) {
      errors.push("Inserisci una descrizione del problema");
    }
    if (!riparazioneData.prezzoPreventivato.trim()) {
      errors.push("Inserisci il prezzo preventivato");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Funzione per creare la prenotazione
  const handleCreateBooking = async () => {
    // Validazione
    if (!validateForm()) {
      return;
    }

    setIsCreatingBooking(true);
    setValidationErrors([]);

    try {
      const token = sessionStorage.getItem("token");
      const multitenantId = sessionStorage.getItem("IdCompany");
      const companyId = sessionStorage.getItem("IdCompany");

      // Combina data e ora selezionate
      const bookingDateTime = new Date(selectedDate);

      // Prepara il payload per il backend
      const bookingPayload = {
        // Cliente
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer
          ? selectedCustomer.tipologia === "Privato"
            ? `${selectedCustomer.cognome} ${selectedCustomer.nome}`
            : selectedCustomer.ragioneSociale
          : `${clienteData.cognome} ${clienteData.nome}`,
        customerPhone: selectedCustomer?.telefono || clienteData.telefono,
        customerEmail: selectedCustomer?.email || clienteData.email,

        // Dispositivo
        deviceType: dispositivoData.dispositivo,
        deviceBrand: "Apple",
        deviceModel: dispositivoData.modello,
        deviceColor: dispositivoData.colore,

        // Data e ora prenotazione
        bookingDateTime: bookingDateTime.toISOString(),

        // Tecnico
        technicianCode: selectedOperator?.codiceDipendente || null,
        technicianName: selectedOperator
          ? `${selectedOperator.firstName} ${selectedOperator.lastName}`
          : null,

        // Problema
        componentIssue:
          repairComponent || riparazioneData.componentiProblema || null,
        problemDescription: riparazioneData.descrizioneInterventoProblema,

        // Preventivo
        estimatedPrice: riparazioneData.prezzoPreventivato
          ? parseFloat(riparazioneData.prezzoPreventivato)
          : null,
        paymentType: riparazioneData.tipoPagamento,

        // Fatturazione
        billingInfo: riparazioneData.informazioneFatturazione || null,

        // Contesto
        companyId: companyId,
        multitenantId: multitenantId,

        // Note
        notes: null,
        createdBy: userName,
      };

      console.log("📤 Payload prenotazione:", bookingPayload);

      const response = await fetch(`${API_URL}/api/Booking`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      if (response.ok) {
        const result: BookingResponse = await response.json();
        console.log("✔️ Prenotazione creata:", result);

        setCreatedBooking(result);
        setShowSuccessModal(true);

        // Reset form dopo successo
        handleClearSearch();
        setDispositivoData({
          dispositivo: "iPhone",
          modello: "",
          colore: "",
        });
        setRiparazioneData({
          dataOraPrenotazione: "",
          codicePrenotazione: "generato automaticamente",
          tecnicoAssegnato: "",
          componentiProblema: "",
          descrizioneInterventoProblema: "",
          prezzoPreventivato: "",
          tipoPagamento: "Amex",
          informazioneFatturazione: "",
        });
        setRepairComponent("");
        setSelectedOperator(null);
        setSelectedDate(new Date());
      } else {
        const errorData = await response.json();
        alert(
          `❌ Errore: ${
            errorData.message || "Impossibile creare la prenotazione"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Errore nella creazione della prenotazione:", error);
      alert("Errore di connessione al server");
    } finally {
      setIsCreatingBooking(false);
    }
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar
        menuState={menuState}
        toggleMenu={() =>
          setMenuState(menuState === "open" ? "closed" : "open")
        }
      />

      <div className={styles.contentArea}>
        <Topbar
          toggleMenu={() =>
            setMenuState(menuState === "open" ? "closed" : "open")
          }
        />

        {/* Header */}
        <div className={styles.schedaHeader}>
          <div className={styles.leftBlock}>
            <div className={styles.roundBtn}>
              <span className={styles.plusIcon}>+</span>
            </div>
          </div>

          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>{companyName}</span>
            <span className={styles.breadcrumbSeparator}> • </span>
            <span className={styles.breadcrumbItem}>{userName}</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          <div className={styles.repairFormContainer}>
            {/* Titolo */}
            <div className={styles.pageTitle}>
              <h1>Crea Prenotazione</h1>
              <p>
                Data e ora di prenotazione: {dateTime.date} {dateTime.time}
              </p>
            </div>

            {/* Errori di validazione */}
            {validationErrors.length > 0 && (
              <div className={styles.validationErrorsContainer}>
                <h4>⚠️ Correggi i seguenti errori:</h4>
                <ul>
                  {validationErrors.map((error, index) => (
                    <li key={index} className={styles.validationError}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Container principale */}
            <div className={styles.pageContainer}>
              {/* Colonna sinistra */}
              <div className={styles.leftColumn}>
                {/* Sezione Cliente */}
                <div className={styles.topRow}>
                  <div className={styles.formSection}>
                    <h3>Cliente</h3>
                    <div className={styles.formGroup}>
                      <label>Cerca Cliente esistente</label>
                      <div className={styles.searchContainer}>
                        <input
                          ref={searchInputRef}
                          type="text"
                          className={`${styles.formControl} ${styles.searchInput}`}
                          placeholder="Cerca per nome, email o telefono..."
                          value={searchQuery}
                          onChange={(e) => handleSearchClient(e.target.value)}
                        />
                        <button
                          type="button"
                          className={styles.addClientButton}
                          onClick={() => setShowNewClientModal(true)}
                          title="Aggiungi nuovo cliente"
                        >
                          +
                        </button>
                        {searchQuery && (
                          <button
                            type="button"
                            className={styles.clearButton}
                            onClick={handleClearSearch}
                          >
                            ×
                          </button>
                        )}
                        {loading && (
                          <div className={styles.loadingIndicator}>
                            <div className={styles.spinner}></div>
                          </div>
                        )}
                        {showDropdown && searchResults.length > 0 && (
                          <div ref={dropdownRef} className={styles.dropdown}>
                            {searchResults.map((customer) => (
                              <div
                                key={customer.id}
                                className={styles.dropdownItem}
                                onClick={() => handleSelectCustomer(customer)}
                              >
                                <div className={styles.customerInfo}>
                                  <div className={styles.customerName}>
                                    {customer.tipologia === "Azienda"
                                      ? customer.ragioneSociale
                                      : `${customer.cognome} ${customer.nome}`}
                                  </div>
                                  <div className={styles.customerDetails}>
                                    {customer.email} • {customer.telefono}
                                  </div>
                                  {customer.indirizzo && (
                                    <div className={styles.customerAddress}>
                                      {customer.indirizzo}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

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
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>CAP</label>
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
                      />
                    </div>
                  </div>

                  {/* Sezione Dispositivo */}
                  <div className={styles.formSection}>
                    <h3>Dispositivo</h3>
                    <div className={styles.formGroup}>
                      <label>Dispositivo</label>
                      <select
                        className={styles.formControl}
                        value={dispositivoData.dispositivo}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            dispositivo: e.target.value,
                          })
                        }
                      >
                        {deviceTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Modello</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        placeholder="Es. 14 Pro"
                        value={dispositivoData.modello}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            modello: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Colore</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        placeholder="Es. Deep Purple"
                        value={dispositivoData.colore}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            colore: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonna destra */}
              <div className={styles.rightColumn}>
                {/* Card container per i campi superiori */}
                <div className={styles.topFieldsCard}>
                  <div className={styles.topFieldsContainer}>
                    <div className={styles.topField}>
                      <label>Data e ora di prenotazione</label>
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => {
                          if (date) {
                            setSelectedDate(date);
                            const day = String(date.getDate()).padStart(2, "0");
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(
                              2,
                              "0"
                            );
                            const minutes = String(date.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            const formatted = `${day}/${month}/${year} ${hours}:${minutes}`;
                            setRiparazioneData({
                              ...riparazioneData,
                              dataOraPrenotazione: formatted,
                            });
                          }
                        }}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="dd/MM/yyyy HH:mm"
                        locale={it}
                        className={styles.formControl}
                        wrapperClassName={styles.datePickerWrapper}
                        placeholderText="Seleziona data e ora"
                        timeCaption="Ora"
                      />
                    </div>

                    <div className={styles.topField}>
                      <label>Cod. prenotazione</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={riparazioneData.codicePrenotazione}
                        readOnly
                        style={{
                          backgroundColor: "#f8f9fa",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Assegnata a *</label>
                      <select
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Assegnare la riparazione a un tecnico"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={selectedOperator?.id || ""}
                        onChange={(e) => {
                          const operator = operators.find(
                            (op) => op.id === e.target.value
                          );
                          setSelectedOperator(operator || null);
                        }}
                      >
                        <option value="">-- Seleziona Tecnico --</option>
                        {operators.map((operator) => (
                          <option key={operator.id} value={operator.id}>
                            {operator.firstName} {operator.lastName} (
                            {operator.codiceDipendente || "N/A"})
                          </option>
                        ))}
                      </select>
                      {validationErrors.includes(
                        "Assegnare la riparazione a un tecnico"
                      ) && (
                        <div className={styles.errorText}>
                          Campo obbligatorio
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sezione Riparazione */}
                <div className={styles.formSection}>
                  <h3>Riparazione</h3>

                  <div className={styles.formGroup}>
                    <label>Componente/riparazione *</label>
                    <select
                      className={`${styles.formControl} ${
                        validationErrors.includes(
                          "Selezionare il componente/tipo di riparazione"
                        )
                          ? styles.error
                          : ""
                      }`}
                      value={repairComponent}
                      onChange={(e) => setRepairComponent(e.target.value)}
                    >
                      <option value="">-- Seleziona --</option>
                      <option value="Schermo">📱 Schermo</option>
                      <option value="Batteria">🔋 Batteria</option>
                      <option value="Altri Danni">🔧 Altri Danni</option>
                      <option value="Scheda Madre">💾 Scheda Madre</option>
                      <option value="Software">⚙️ Software</option>
                      <option value="Riparazione Completa">
                        🛠️ Riparazione Completa
                      </option>
                    </select>
                    {validationErrors.includes(
                      "Selezionare il componente/tipo di riparazione"
                    ) && (
                      <div className={styles.errorText}>Campo obbligatorio</div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Descrizione dell'intervento/problema</label>
                    <textarea
                      className={styles.formControl}
                      placeholder="Sostituzione del vetro dello schermo"
                      rows={6}
                      value={riparazioneData.descrizioneInterventoProblema}
                      onChange={(e) =>
                        setRiparazioneData({
                          ...riparazioneData,
                          descrizioneInterventoProblema: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Sezione Prezzo */}
                <div className={styles.formSection}>
                  <h3>Prezzo</h3>
                  <div className={styles.formGroup}>
                    <label>Prezzo Preventivato (IVA inclusa)</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="399.00 Eur"
                      value={riparazioneData.prezzoPreventivato}
                      onChange={(e) =>
                        setRiparazioneData({
                          ...riparazioneData,
                          prezzoPreventivato: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo di Pagamento</label>
                    <select
                      className={styles.formControl}
                      value={riparazioneData.tipoPagamento}
                      onChange={(e) =>
                        setRiparazioneData({
                          ...riparazioneData,
                          tipoPagamento: e.target.value,
                        })
                      }
                    >
                      {tipoPagamentoOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Informazioni per la fatturazione</label>
                    <textarea
                      className={styles.formControl}
                      rows={4}
                      value={riparazioneData.informazioneFatturazione}
                      onChange={(e) =>
                        setRiparazioneData({
                          ...riparazioneData,
                          informazioneFatturazione: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottoni di azione */}
            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleCreateBooking}
                disabled={isCreatingBooking}
              >
                {isCreatingBooking ? "Creazione..." : "Crea/Invia E-Mail"}
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={handleCreateBooking}
                disabled={isCreatingBooking}
              >
                {isCreatingBooking
                  ? "Creazione..."
                  : "Crea/stampa prenotazione"}
              </button>
            </div>
          </div>
        </div>

        <BottomBar />
      </div>

      {/* Modal Nuovo Cliente */}
      {showNewClientModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>Nuovo Cliente</h4>
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
                      <option value="Privato">Privato</option>
                      <option value="Azienda">Azienda</option>
                    </select>
                  </div>
                  <div className={styles.formCol3}>
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
      {/* 🆕 AGGIUNGI QUESTO MODAL DI SUCCESSO */}
      {showSuccessModal && createdBooking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>✔️ Prenotazione Creata con Successo!</h2>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.successInfo}>
                <p>
                  <strong>Codice Prenotazione:</strong>{" "}
                  <span className={styles.bookingCode}>
                    {createdBooking.bookingCode}
                  </span>
                </p>
                <p>
                  <strong>Cliente:</strong> {createdBooking.customerName}
                </p>
                <p>
                  <strong>Dispositivo:</strong> {createdBooking.deviceModel}
                </p>
                <p>
                  <strong>Data:</strong>{" "}
                  {new Date(createdBooking.scheduledDate).toLocaleDateString(
                    "it-IT"
                  )}
                </p>
                <p>
                  <strong>Ora:</strong> {createdBooking.scheduledTime}
                </p>
                <p>
                  <strong>Stato:</strong> {createdBooking.bookingStatus}
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedBooking(null);
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prenotazioni;
