import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from "./styles.module.css";
import BottomBar from "../../components/BottomBar";
import { useSearchParams } from "react-router-dom";
import deviceInventoryService, {
  type DeviceInventoryItem,
} from "../../services/deviceInventoryService";

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

const Vendite: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  const [searchParams] = useSearchParams();
  const API_URL = import.meta.env.VITE_API_URL;

  // Stati per la ricerca cliente
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );

  // Stati per la ricerca dispositivo
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const [deviceSearchResults, setDeviceSearchResults] = useState<DeviceData[]>(
    []
  );
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);

  // Refs per gestire i dropdown
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const deviceSearchInputRef = useRef<HTMLInputElement>(null);
  const deviceDropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deviceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    condizione: "Nuovo",
    serialNumber: "",
    brand: "Apple",
    model: "",
    deviceType: "iPhone",
    colore: "",
    memoria: "512 GB",
    durataGaranzia: "6 Mesi",
  });

  // Stati per i modal
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewDeviceModal, setShowNewDeviceModal] = useState(false);
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

  // Stati per il nuovo dispositivo (Magazzino Apparati)
  const [newDeviceData, setNewDeviceData] = useState({
    code: "",
    deviceType: "smartphone" as "smartphone" | "tablet",
    brand: "",
    model: "",
    imei: "",
    esn: "",
    color: "",
    deviceCondition: "new" as "new" | "used" | "refurbished",
    isCourtesyDevice: false,
    deviceStatus: "available" as
      | "available"
      | "loaned"
      | "sold"
      | "unavailable",
    supplierId: "",
    purchasePrice: 0,
    sellingPrice: 0,
    location: "",
    notes: "",
  });

  const [savingNewClient, setSavingNewClient] = useState(false);
  const [savingNewDevice, setSavingNewDevice] = useState(false);

  // Stato per i prezzi
  const [prezziData, setPrezziData] = useState({
    prezzoAcquistoIva0: "",
    prezzoAcquistoIva22: "",
    prezzoIva22: "",
    prezzoTotale: "",
    tipoDiPagamento: "Amex",
    informazioniPerLaFatturazione: "",
  });

  // Stato per le note private
  const [notePrivateData, setNotePrivateData] = useState({
    fornitore: "Acquisto Privato",
    valuteBatteria: "98%",
    grado: "A",
  });

  // Dati aziendali per la stampa
  const companyName =
    (typeof window !== "undefined" && sessionStorage.getItem("fullName")) ||
    "CLINICA iPHONE STORE";
  const companyAddr =
    (typeof window !== "undefined" &&
      sessionStorage.getItem("companyAddress")) ||
    "Via Prova 1 – 73100 Lecce (LE)";
  const companyVat =
    (typeof window !== "undefined" && sessionStorage.getItem("companyVat")) ||
    "P.IVA 01234567890";
  const companyPhone =
    (typeof window !== "undefined" && sessionStorage.getItem("companyPhone")) ||
    "0832 123456";
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

  // Opzioni per i dropdown
  const condizioniOptions = ["Nuovo", "Usato"];
  const brandOptions = [
    "Apple",
    "Samsung",
    "Huawei",
    "Xiaomi",
    "OnePlus",
    "Google",
    "Altro",
  ];
  const memoriaOptions = [
    "64 GB",
    "128 GB",
    "256 GB",
    "512 GB",
    "1 TB",
    "2 TB",
  ];
  const durataGaranziaOptions = ["3 Mesi", "6 Mesi", "12 Mesi", "24 Mesi"];

  // Stato per gli elementi diagnostici
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticItem[]>([
    {
      id: "informazioni-sul-dispositivo",
      icon: "🆔",
      label: "Informazioni sul dispositivo",
      active: true,
    },
    { id: "apple-pay", icon: "🍎", label: "Apple Pay", active: true },
    {
      id: "condizione-della-batteria",
      icon: "🔋",
      label: "Condizione della batteria",
      active: true,
    },
    { id: "bluetooth", icon: "📶", label: "Bluetooth", active: true },
    { id: "fotocamera", icon: "📷", label: "Fotocamera", active: true },
    {
      id: "banda-base-cellulare",
      icon: "📡",
      label: "Banda base cellulare",
      active: true,
    },
    { id: "display", icon: "🖥️", label: "Display", active: true },
    { id: "esim", icon: "📱", label: "eSIM", active: true },
    { id: "face-id", icon: "😊", label: "Face ID", active: true },
    { id: "scanner-lidar", icon: "🔦", label: "Scanner LiDAR", active: true },
    { id: "microfono", icon: "🎤", label: "Microfono", active: true },
    { id: "sensori", icon: "📊", label: "Sensori", active: true },
    { id: "servizi", icon: "⚙️", label: "Servizi", active: true },
    { id: "software", icon: "💾", label: "Software", active: true },
    { id: "sistema", icon: "🖥️", label: "Sistema", active: true },
    { id: "wi-fi", icon: "📶", label: "Wi-Fi", active: true },
    { id: "nfc-cellulare", icon: "📡", label: "NFC Cellulare", active: true },
    {
      id: "ricarica-wireless",
      icon: "⚡",
      label: "Ricarica wireless",
      active: true,
    },
  ]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isCreatingSale, setIsCreatingSale] = useState(false);

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

  // Effetto per gestire i click fuori dai dropdown
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

      if (
        deviceDropdownRef.current &&
        !deviceDropdownRef.current.contains(event.target as Node) &&
        deviceSearchInputRef.current &&
        !deviceSearchInputRef.current.contains(event.target as Node)
      ) {
        setShowDeviceDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Genera GUID
  const generateGuid = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  // Funzione per la ricerca cliente con debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Funzione per la ricerca dispositivo con debouncing
  const handleDeviceSearchChange = (value: string) => {
    setDeviceSearchQuery(value);

    if (deviceDebounceRef.current) {
      clearTimeout(deviceDebounceRef.current);
    }

    if (!value.trim()) {
      setShowDeviceDropdown(false);
      setDeviceSearchResults([]);
      return;
    }

    deviceDebounceRef.current = setTimeout(() => {
      performDeviceSearch(value);
    }, 300);
  };

  // Funzione per eseguire la ricerca cliente
  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
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

  // Funzione per eseguire la ricerca dispositivo (Magazzino Apparati)
  const performDeviceSearch = async (query: string) => {
    if (!query.trim()) return;

    setDeviceLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      // Imposta multitenantId nel service
      if (multitenantId) {
        deviceInventoryService.setMultitenantId(multitenantId);
      }

      // Cerca solo apparati disponibili per la vendita
      const response = await deviceInventoryService.searchItems({
        searchQuery: query,
        deviceStatus: "available", // Solo dispositivi disponibili
        page: 1,
        pageSize: 10,
      });

      setDeviceSearchResults(response.items);
      setShowDeviceDropdown(response.items.length > 0);
    } catch (error) {
      console.error("Errore durante la ricerca dispositivo:", error);
      setDeviceSearchResults([]);
      setShowDeviceDropdown(false);
    } finally {
      setDeviceLoading(false);
    }
  };

  // Funzione per selezionare un cliente
  const onSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.ragioneSociale);
    setShowDropdown(false);

    setClienteData({
      email: customer.email || "",
      nome: customer.nome || "",
      cognome: customer.cognome || "",
      telefono: customer.telefono || "",
      cap: customer.cap || "",
    });
  };

  // Funzione per selezionare un dispositivo (Magazzino Apparati)
  const onSelectDevice = (device: DeviceInventoryItem) => {
    setSelectedDevice(device);
    setDeviceSearchQuery(`${device.brand} ${device.model} - ${device.imei}`);
    setShowDeviceDropdown(false);

    setDispositivoData({
      ...dispositivoData,
      serialNumber: device.imei,
      brand: device.brand,
      model: device.model,
      deviceType: device.deviceType === "smartphone" ? "iPhone" : "iPad",
      colore: device.color,
    });
  };

  // Funzione per cancellare la selezione cliente
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

  // Funzione per cancellare la selezione dispositivo
  const clearDeviceSelection = () => {
    setSelectedDevice(null);
    setDeviceSearchQuery("");
    setDispositivoData({
      condizione: "Nuovo",
      serialNumber: "",
      brand: "Apple",
      model: "",
      deviceType: "iPhone",
      colore: "",
      memoria: "512 GB",
      durataGaranzia: "6 Mesi",
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

  // Funzione per aprire il modal di nuovo dispositivo (Magazzino Apparati)
  const openNewDeviceModal = () => {
    setNewDeviceData({
      code: "",
      deviceType: "smartphone",
      brand: "",
      model: "",
      imei: "",
      esn: "",
      color: "",
      deviceCondition: "new",
      isCourtesyDevice: false,
      deviceStatus: "available",
      supplierId: "",
      purchasePrice: 0,
      sellingPrice: 0,
      location: "",
      notes: "",
    });
    setShowNewDeviceModal(true);
  };

  // Funzione di validazione completa
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validazione Cliente
    if (!selectedCustomer) {
      errors.push("Selezionare o creare un cliente");
    } else {
      if (!clienteData.email || !/\S+@\S+\.\S+/.test(clienteData.email)) {
        errors.push("Inserire un'email valida per il cliente");
      }
      if (!clienteData.nome?.trim()) {
        errors.push("Inserire il nome del cliente");
      }
      if (!clienteData.cognome?.trim()) {
        errors.push("Inserire il cognome del cliente");
      }
      if (!clienteData.telefono?.trim()) {
        errors.push("Inserire il telefono del cliente");
      }
    }

    // Validazione Dispositivo
    if (!selectedDevice && !dispositivoData.serialNumber?.trim()) {
      errors.push(
        "Selezionare un dispositivo esistente o inserire i dati del nuovo dispositivo"
      );
    }

    if (!selectedDevice) {
      if (!dispositivoData.serialNumber?.trim()) {
        errors.push("Inserire il numero seriale/IMEI del dispositivo");
      }
      if (!dispositivoData.brand?.trim()) {
        errors.push("Inserire la marca del dispositivo");
      }
      if (!dispositivoData.model?.trim()) {
        errors.push("Inserire il modello del dispositivo");
      }
      if (!dispositivoData.deviceType) {
        errors.push("Selezionare il tipo di dispositivo");
      }
    }

    // Validazione diagnostica - almeno un elemento deve essere selezionato
    const activeDiagnosticItems = diagnosticItems.filter((item) => item.active);
    if (activeDiagnosticItems.length === 0) {
      errors.push("Selezionare almeno un elemento nella diagnostica di uscita");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Funzione per creare la vendita
  const handleCreateSale = async (actionType: "email" | "print") => {
    // Esegui validazione
    const validation = validateForm();

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      alert("Errori di validazione:\n\n" + validation.errors.join("\n"));
      return;
    }

    // Pulisci errori di validazione precedenti
    setValidationErrors([]);
    setIsCreatingSale(true);

    try {
      // TODO: Implementare la chiamata API per creare la vendita
      console.log("Creazione vendita:", {
        cliente: clienteData,
        dispositivo: dispositivoData,
        prezzi: prezziData,
        notePrivate: notePrivateData,
        diagnostica: diagnosticItems.filter((item) => item.active),
      });

      alert("✅ Vendita creata con successo!\n\n(Backend da implementare)");

      // TODO: Gestire azione post-creazione
      if (actionType === "email") {
        console.log("Invio email...");
      } else if (actionType === "print") {
        console.log("Stampa garanzia...");
      }
    } catch (error) {
      console.error("Errore durante la creazione:", error);
      alert("Errore durante la creazione della vendita. Riprova.");
    } finally {
      setIsCreatingSale(false);
    }
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
      multitenantId: sessionStorage.getItem("IdCompany") || "",
    };

    setSavingNewClient(true);

    try {
      const response = await fetch(`${API_URL}/api/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        alert("Cliente creato con successo!");

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

        onSelectCustomer(customerData);
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

  // Funzione per ottenere l'icona del dispositivo (Magazzino Apparati)
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "smartphone":
        return "📱";
      case "tablet":
        return "📋";
      case "iPhone":
        return "📱";
      case "iPad":
        return "📱";
      case "Mac":
        return "💻";
      case "Watch":
        return "⌚";
      case "AirPods":
        return "🎧";
      default:
        return "📱";
    }
  };

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
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
          </div>

          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>{companyName}</span>
            <span className={styles.breadcrumbSeparator}> • </span>
            <span className={styles.breadcrumbItem}>{userName}</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          <div className={styles.repairFormContainer}>
            {/* Header della pagina */}
            <div className={styles.pageTitle}>
              <h1>Crea Vendita</h1>
              <p>Nuova vendita dispositivo</p>
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

                        <button
                          type="button"
                          className={styles.addClientButton}
                          onClick={openNewClientModal}
                          title="Aggiungi nuovo cliente"
                        >
                          +
                        </button>

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

                        {loading && (
                          <div className={styles.loadingIndicator}>
                            <div className={styles.spinner}></div>
                          </div>
                        )}

                        {/* Dropdown risultati clienti */}
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
                      <label>E-Mail *</label>
                      <input
                        type="email"
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Inserire un'email valida per il cliente"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={clienteData.email}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            email: e.target.value,
                          })
                        }
                        placeholder="E-mail del cliente"
                      />
                      {validationErrors.includes(
                        "Inserire un'email valida per il cliente"
                      ) && (
                        <div className={styles.errorText}>Email non valida</div>
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Nome *</label>
                      <input
                        type="text"
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Inserire il nome del cliente"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={clienteData.nome}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            nome: e.target.value,
                          })
                        }
                        placeholder="Nome del cliente"
                      />
                      {validationErrors.includes(
                        "Inserire il nome del cliente"
                      ) && (
                        <div className={styles.errorText}>
                          Campo obbligatorio
                        </div>
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cognome *</label>
                      <input
                        type="text"
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Inserire il cognome del cliente"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={clienteData.cognome}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            cognome: e.target.value,
                          })
                        }
                        placeholder="Cognome del cliente"
                      />
                      {validationErrors.includes(
                        "Inserire il cognome del cliente"
                      ) && (
                        <div className={styles.errorText}>
                          Campo obbligatorio
                        </div>
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Telefono *</label>
                      <input
                        type="tel"
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Inserire il telefono del cliente"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={clienteData.telefono}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            telefono: e.target.value,
                          })
                        }
                        placeholder="Numero di telefono"
                      />
                      {validationErrors.includes(
                        "Inserire il telefono del cliente"
                      ) && (
                        <div className={styles.errorText}>
                          Campo obbligatorio
                        </div>
                      )}
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

                    {/* Campo di ricerca dispositivo con dropdown */}
                    <div className={styles.formGroup}>
                      <label>Cerca Dispositivo esistente</label>
                      <div className={styles.searchContainer}>
                        <input
                          ref={deviceSearchInputRef}
                          type="text"
                          className={`${styles.formControl} ${styles.searchInput}`}
                          placeholder="Digita marca, modello o numero seriale..."
                          value={deviceSearchQuery}
                          onChange={(e) =>
                            handleDeviceSearchChange(e.target.value)
                          }
                          onFocus={() => {
                            if (deviceSearchResults.length > 0) {
                              setShowDeviceDropdown(true);
                            }
                          }}
                        />                       

                        {selectedDevice && (
                          <button
                            type="button"
                            className={styles.clearButton}
                            onClick={clearDeviceSelection}
                            title="Cancella selezione"
                          >
                            ×
                          </button>
                        )}

                        {deviceLoading && (
                          <div className={styles.loadingIndicator}>
                            <div className={styles.spinner}></div>
                          </div>
                        )}

                        {/* Dropdown risultati dispositivi (Magazzino Apparati) */}
                        {showDeviceDropdown &&
                          deviceSearchResults.length > 0 && (
                            <div
                              ref={deviceDropdownRef}
                              className={styles.dropdown}
                            >
                              {deviceSearchResults.map((device) => (
                                <div
                                  key={device.id}
                                  className={styles.dropdownItem}
                                  onClick={() => onSelectDevice(device)}
                                >
                                  <div className={styles.customerInfo}>
                                    <div className={styles.customerName}>
                                      <strong>
                                        {getDeviceIcon(device.deviceType)}{" "}
                                        {device.brand} {device.model}
                                      </strong>
                                    </div>
                                    <div className={styles.customerDetails}>
                                      <span>IMEI: {device.imei}</span>
                                      <span> • Codice: {device.code}</span>
                                      {device.esn && (
                                        <span> • ESN: {device.esn}</span>
                                      )}
                                    </div>
                                    <div className={styles.customerAddress}>
                                      {device.color} •{" "}
                                      {device.deviceCondition === "new"
                                        ? "Nuovo"
                                        : device.deviceCondition === "used"
                                        ? "Usato"
                                        : "Rigenerato"}
                                      {device.location && (
                                        <> • 📍 {device.location}</>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Condizione *</label>
                      <select
                        className={styles.formControl}
                        value={dispositivoData.condizione}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            condizione: e.target.value,
                          })
                        }
                      >
                        {condizioniOptions.map((cond) => (
                          <option key={cond} value={cond}>
                            {cond}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Numero di serie/IMEI *</label>
                      <input
                        type="text"
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Inserire il numero seriale/IMEI del dispositivo"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={dispositivoData.serialNumber}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            serialNumber: e.target.value,
                          })
                        }
                        placeholder="Numero seriale del dispositivo"
                      />
                      {validationErrors.includes(
                        "Inserire il numero seriale/IMEI del dispositivo"
                      ) && (
                        <div className={styles.errorText}>
                          Campo obbligatorio
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Dispositivo *</label>
                      <select
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Selezionare il tipo di dispositivo"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={dispositivoData.deviceType}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            deviceType: e.target.value,
                          })
                        }
                      >
                        {deviceTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.includes(
                        "Selezionare il tipo di dispositivo"
                      ) && (
                        <div className={styles.errorText}>
                          Campo obbligatorio
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Marca *</label>
                      <select
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Inserire la marca del dispositivo"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={dispositivoData.brand}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            brand: e.target.value,
                          })
                        }
                      >
                        {brandOptions.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                      {validationErrors.includes(
                        "Inserire la marca del dispositivo"
                      ) && (
                        <div className={styles.errorText}>
                          Campo obbligatorio
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Modello *</label>
                      <input
                        type="text"
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Inserire il modello del dispositivo"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={dispositivoData.model}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            model: e.target.value,
                          })
                        }
                        placeholder="Modello del dispositivo"
                      />
                      {validationErrors.includes(
                        "Inserire il modello del dispositivo"
                      ) && (
                        <div className={styles.errorText}>
                          Campo obbligatorio
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Colore</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={dispositivoData.colore}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            colore: e.target.value,
                          })
                        }
                        placeholder="Colore del dispositivo"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Memoria</label>
                      <select
                        className={styles.formControl}
                        value={dispositivoData.memoria}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            memoria: e.target.value,
                          })
                        }
                      >
                        {memoriaOptions.map((mem) => (
                          <option key={mem} value={mem}>
                            {mem}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Durata della Garanzia</label>
                      <select
                        className={styles.formControl}
                        value={dispositivoData.durataGaranzia}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            durataGaranzia: e.target.value,
                          })
                        }
                      >
                        {durataGaranziaOptions.map((dur) => (
                          <option key={dur} value={dur}>
                            {dur}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sezione Diagnostica */}
                <div
                  className={`${styles.formSection} ${styles.diagnosticaSection}`}
                >
                  <h3>Diagnostica di uscita</h3>
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
                          role="button"
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

                  {validationErrors.includes(
                    "Selezionare almeno un elemento nella diagnostica di uscita"
                  ) && (
                    <div className={styles.errorText}>
                      Selezionare almeno un elemento
                    </div>
                  )}
                </div>
              </div>

              {/* Colonna destra */}
              <div className={styles.rightColumn}>
                {/* Sezione Note Private */}
                <div className={styles.formSection}>
                  <h3>Note Private</h3>

                  <div className={styles.formGroup}>
                    <label>Fornitore</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={notePrivateData.fornitore}
                      onChange={(e) =>
                        setNotePrivateData({
                          ...notePrivateData,
                          fornitore: e.target.value,
                        })
                      }
                      placeholder="Nome fornitore"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Valute della batteria</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={notePrivateData.valuteBatteria}
                      onChange={(e) =>
                        setNotePrivateData({
                          ...notePrivateData,
                          valuteBatteria: e.target.value,
                        })
                      }
                      placeholder="es. 98%"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Grado</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={notePrivateData.grado}
                      onChange={(e) =>
                        setNotePrivateData({
                          ...notePrivateData,
                          grado: e.target.value,
                        })
                      }
                      placeholder="es. A, B, C"
                    />
                  </div>
                </div>

                {/* Info generazione automatica */}
                <div className={styles.autoGenerationInfo}>
                  <div className={styles.formGroup}>
                    <label>Data e ora di vendita</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value="gg/mm/aa ore mm:mm generato automaticamente"
                      readOnly
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Cod. scheda</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value="generato automaticamente"
                      readOnly
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Operato da</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value="menu a tendina con lista tecnici"
                      readOnly
                    />
                  </div>
                </div>

                {/* Sezione Prezzo */}
                <div className={styles.formSection}>
                  <h3>Prezzo</h3>

                  <div className={styles.formGroup}>
                    <label>Prezzo Art.17 Iva 0%</label>
                    <div className={styles.priceInputContainer}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={styles.formControl}
                        value={prezziData.prezzoAcquistoIva0}
                        onChange={(e) =>
                          setPrezziData({
                            ...prezziData,
                            prezzoAcquistoIva0: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                      <span className={styles.currencyLabel}>€</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Prezzo Art.38 Iva 0%</label>
                    <div className={styles.priceInputContainer}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={styles.formControl}
                        value={prezziData.prezzoAcquistoIva22}
                        onChange={(e) =>
                          setPrezziData({
                            ...prezziData,
                            prezzoAcquistoIva22: e.target.value,
                          })
                        }
                        placeholder="999.00"
                      />
                      <span className={styles.currencyLabel}>€</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Prezzo Iva 22%</label>
                    <div className={styles.priceInputContainer}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={styles.formControl}
                        value={prezziData.prezzoIva22}
                        onChange={(e) =>
                          setPrezziData({
                            ...prezziData,
                            prezzoIva22: e.target.value,
                          })
                        }
                        placeholder="200.00"
                      />
                      <span className={styles.currencyLabel}>€</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Prezzo Totale</label>
                    <div className={styles.priceInputContainer}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={styles.formControl}
                        value={prezziData.prezzoTotale}
                        onChange={(e) =>
                          setPrezziData({
                            ...prezziData,
                            prezzoTotale: e.target.value,
                          })
                        }
                        placeholder="1299.00"
                      />
                      <span className={styles.currencyLabel}>€</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo di Pagamento</label>
                    <select
                      className={styles.formControl}
                      value={prezziData.tipoDiPagamento}
                      onChange={(e) =>
                        setPrezziData({
                          ...prezziData,
                          tipoDiPagamento: e.target.value,
                        })
                      }
                    >
                      <option value="Amex">💳 Amex</option>
                      <option value="Contanti">💵 Contanti</option>
                      <option value="Carta di Credito">
                        💳 Carta di Credito
                      </option>
                      <option value="Bancomat">💳 Bancomat</option>
                      <option value="Bonifico">🏦 Bonifico</option>
                      <option value="PayPal">💰 PayPal</option>
                      <option value="Altro">📄 Altro</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Informazioni per la fatturazione</label>
                    <textarea
                      className={styles.formControl}
                      rows={3}
                      value={prezziData.informazioniPerLaFatturazione}
                      onChange={(e) =>
                        setPrezziData({
                          ...prezziData,
                          informazioniPerLaFatturazione: e.target.value,
                        })
                      }
                      placeholder="Note aggiuntive per la fatturazione..."
                    />
                  </div>
                </div>

                {/* Mostra errori di validazione se presenti */}
                {validationErrors.length > 0 && (
                  <div className={styles.validationErrorsContainer}>
                    <h4>⚠️ Errori di validazione:</h4>
                    <ul>
                      {validationErrors.map((error, index) => (
                        <li key={index} className={styles.validationError}>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Bottoni azioni */}
            <div className={styles.formActions}>
              <button
                className={`${styles.btn} ${styles.btnSuccess}`}
                onClick={() => handleCreateSale("email")}
                disabled={isCreatingSale}
              >
                {isCreatingSale ? "Creando..." : "📧 Crea/invia E-Mail"}
              </button>

              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => handleCreateSale("print")}
                disabled={isCreatingSale}
              >
                {isCreatingSale ? "Creando..." : "🖨️ Crea/Stampa garanzia"}
              </button>
            </div>
          </div>
        </div>
        <BottomBar />
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

export default Vendite;
