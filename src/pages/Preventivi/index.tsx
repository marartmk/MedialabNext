import React, { useState, useEffect } from 'react';
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from './styles.module.css';

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

// Tipo per i dati del dispositivo (dalla pagina accettazione)
interface DeviceData {
  id: number;
  deviceId: string;
  customerId?: string;
  companyId?: string;
  multitenantId?: string;
  serialNumber: string;
  brand: string;
  model: string;
  deviceType: string;
  purchaseDate?: string;
  receiptNumber?: string;
  retailer?: string;
  notes?: string;
  createdAt: string;
  isDeleted: boolean;
}

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  codiceDipendente?: string;
  internalCode?: string;
  email?: string;
  phoneNumber?: string;
}

const PreventiviPage: React.FC = () => {
  // Stati per la ricerca cliente (dalla pagina note)
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );

  // Stati per la ricerca dispositivo (dalla pagina accettazione)
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const [deviceSearchResults, setDeviceSearchResults] = useState<DeviceData[]>([]);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);

  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null
  );

  // Refs per i dropdown
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const deviceSearchInputRef = React.useRef<HTMLInputElement>(null);
  const deviceDropdownRef = React.useRef<HTMLDivElement>(null);
  const deviceDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Stati per il modal nuovo dispositivo
  const [showNewDeviceModal, setShowNewDeviceModal] = useState(false);
  const [savingNewDevice, setSavingNewDevice] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [savingNewClient, setSavingNewClient] = useState(false);
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
  const [newDeviceData, setNewDeviceData] = useState({
    deviceId: "",
    customerId: "",
    companyId: "",
    multitenantId: "",
    serialNumber: "",
    brand: "",
    model: "",
    deviceType: "Mobile",
    purchaseDate: "",
    receiptNumber: "",
    retailer: "",
    notes: "",
  });

  // Tipi di dispositivo
  const deviceTypes = [
    { value: "Mobile", label: "📱 Mobile" },
    { value: "TV", label: "📺 TV" },
    { value: "Other", label: "🔧 Altro" },
  ];

  // Stati del form - CAMPI PREVENTIVO
  const [formData, setFormData] = useState({
    dataOraRilevazione: new Date().toISOString().slice(0, 16),
    // Colonna 1
    email: '',
    nome: '',
    cognome: '',
    massimocapriLoreti: '',
    telefono: '',
    // Colonna 2
    numeroSerieIMEI: '',
    dispositivo: 'Mobile',
    marca: '',
    modello: '',
    assegnataA: '',
    // Colonna 3
    componenteProblem: 'Schermo',
    descrizioneIntervento: '',
    // Prezzo
    prezzoPreventivo: ''
  });

  useEffect(() => {
    loadOperators();
  }, []);

  // Effetto per gestire i click fuori dai dropdown (dalla pagina accettazione)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Dropdown cliente
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      // Dropdown dispositivo
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

  // Funzione per selezionare un cliente
  const onSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.ragioneSociale);
    setShowDropdown(false);

    setFormData(prev => ({
      ...prev,
      email: customer.email || "",
      nome: customer.nome || "",
      cognome: customer.cognome || "",
      telefono: customer.telefono || "",
      massimocapriLoreti: customer.cap || "",
    }));
  };

  // Funzione per cancellare la selezione cliente
  const clearSelection = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setFormData(prev => ({
      ...prev,
      email: "",
      nome: "",
      cognome: "",
      telefono: "",
      massimocapriLoreti: "",
    }));
  };

  // Gestione cambio input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Funzione per la ricerca dispositivo con debouncing (dalla pagina accettazione)
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

  // Funzione per eseguire la ricerca dispositivo (dalla pagina accettazione)
  const performDeviceSearch = async (query: string) => {
    if (!query.trim()) return;

    setDeviceLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      const response = await fetch(
        `${API_URL}/api/device/search?query=${encodeURIComponent(
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
        setDeviceSearchResults(data);
        setShowDeviceDropdown(true);
      } else {
        console.error("Errore nella ricerca dispositivo");
        setDeviceSearchResults([]);
      }
    } catch (error) {
      console.error("Errore durante la ricerca dispositivo:", error);
      setDeviceSearchResults([]);
    } finally {
      setDeviceLoading(false);
    }
  };

  // Funzione per selezionare un dispositivo (dalla pagina accettazione)
  const onSelectDevice = (device: DeviceData) => {
    setSelectedDevice(device);
    setDeviceSearchQuery(
      `${device.brand} ${device.model} - ${device.serialNumber}`
    );
    setShowDeviceDropdown(false);

    // Popola i campi del form
    setFormData(prev => ({
      ...prev,
      numeroSerieIMEI: device.serialNumber,
      dispositivo: device.deviceType,
      marca: device.brand,
      modello: device.model,
    }));
  };

  // Funzione per cancellare la selezione dispositivo (dalla pagina accettazione)
  const clearDeviceSelection = () => {
    setSelectedDevice(null);
    setDeviceSearchQuery("");
    setFormData(prev => ({
      ...prev,
      numeroSerieIMEI: "",
      dispositivo: "Mobile",
      marca: "",
      modello: "",
    }));
  };

  // Helper per icona dispositivo (dalla pagina accettazione)
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
      case 'smartphone':
        return '📱';
      case 'tablet':
        return '📱';
      case 'laptop':
      case 'computer':
        return '💻';
      case 'watch':
        return '⌚';
      default:
        return '📱';
    }
  };

  // Genera GUID (dalla pagina accettazione)
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

  // Funzione per aprire il modal di nuovo dispositivo (dalla pagina accettazione)
  const openNewDeviceModal = () => {
    const companyId = sessionStorage.getItem("IdCompany") || "";
    setNewDeviceData({
      deviceId: generateGuid(),
      customerId: selectedCustomer?.id || "",
      companyId,
      multitenantId: companyId,
      serialNumber: "",
      brand: "",
      model: "",
      deviceType: "Mobile",
      purchaseDate: "",
      receiptNumber: "",
      retailer: "",
      notes: "",
    });
    setShowNewDeviceModal(true);
  };

  // Funzione per salvare il nuovo dispositivo (dalla pagina accettazione)
  const handleSaveNewDevice = async () => {
    if (!newDeviceData.serialNumber.trim()) {
      alert("Inserire il numero seriale");
      return;
    }

    if (!newDeviceData.brand.trim()) {
      alert("Inserire la marca");
      return;
    }

    if (!newDeviceData.model.trim()) {
      alert("Inserire il modello");
      return;
    }

    if (!newDeviceData.deviceType) {
      alert("Selezionare un tipo di device");
      return;
    }

    const companyId = sessionStorage.getItem("IdCompany") || "";
    const payload = {
      deviceId: newDeviceData.deviceId || generateGuid(),
      customerId: selectedCustomer?.id || null,
      companyId: companyId || null,
      multitenantId: companyId || null,
      serialNumber: newDeviceData.serialNumber,
      brand: newDeviceData.brand,
      model: newDeviceData.model,
      deviceType: newDeviceData.deviceType,
      purchaseDate: newDeviceData.purchaseDate || null,
      receiptNumber: newDeviceData.receiptNumber || null,
      retailer: newDeviceData.retailer || null,
      notes: newDeviceData.notes || null,
    };

    setSavingNewDevice(true);

    try {
      const response = await fetch(`${API_URL}/api/device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newDevice = await response.json();
        alert("Dispositivo creato con successo!");

        const deviceData: DeviceData = {
          id: newDevice.id,
          deviceId: newDevice.deviceId,
          customerId: newDevice.customerId,
          companyId: newDevice.companyId,
          multitenantId: newDevice.multitenantId,
          serialNumber: newDevice.serialNumber,
          brand: newDevice.brand,
          model: newDevice.model,
          deviceType: newDevice.deviceType,
          purchaseDate: newDevice.purchaseDate,
          receiptNumber: newDevice.receiptNumber,
          retailer: newDevice.retailer,
          notes: newDevice.notes,
          createdAt: newDevice.createdAt,
          isDeleted: false,
        };

        onSelectDevice(deviceData);
        setShowNewDeviceModal(false);
      } else {
        const errText = await response.text();
        alert("Errore nel salvataggio:\n" + errText);
      }
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore durante il salvataggio");
    } finally {
      setSavingNewDevice(false);
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
      alert("Inserire una citta");
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

  // Funzione creazione preventivo con email (da implementare)
  const handleCreaEmail = () => {
    console.log('Crea Preventivo & E-Mail:', { ...formData, cliente: selectedCustomer });
    // TODO: Implementare chiamata API
    alert('Funzionalità da implementare: Crea Preventivo & E-Mail');
  };

  // Funzione creazione preventivo con stampa (da implementare)
  const handleCreaStampa = () => {
    console.log('Crea Preventivo & Stampa:', { ...formData, cliente: selectedCustomer });
    // TODO: Implementare chiamata API
    alert('Funzionalità da implementare: Crea Preventivo & Stampa');
  };

  // Funzione salvataggio preventivo (da implementare)
  const handleSalvaPreventivo = () => {
    console.log('Salva Preventivo:', { ...formData, cliente: selectedCustomer });
    // TODO: Implementare chiamata API
    alert('Funzionalità da implementare: Salva Preventivo');
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
        
        <div className={styles.pageBody}>
          {/* Box centrale */}
          <div className={styles.centerBox}>
            <div className={styles.boxHeader}>
              <h2>Crea Preventivo Riparazione</h2>
            </div>

            <div className={styles.boxBody}>
              {/* LAYOUT A 3 COLONNE - come da immagine */}
              <div className={styles.formRowTriple}>
                {/* COLONNA 1: Dati Cliente */}
                <div className={styles.formColumn}>
                  {/* Ricerca Cliente - dalla pagina accettazione */}
                  <div className={styles.formField}>
                    <label>Cliente *</label>
                    <div className={styles.searchContainer}>
                      <input
                        ref={searchInputRef}
                        type="text"
                        className={styles.formControl}
                        placeholder="Cerca per nome, cognome o telefono..."
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
                        className={styles.addButton}
                        onClick={openNewClientModal}
                        title="Aggiungi nuovo cliente"
                      >
                        +
                      </button>

                      {searchQuery && (
                        <button
                          className={styles.clearBtn}
                          onClick={clearSelection}
                          type="button"
                        >
                          x
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
                              onClick={() => onSelectCustomer(customer)}
                            >
                              <strong>
                                {customer.ragioneSociale ||
                                  `${customer.nome} ${customer.cognome}`}
                              </strong>
                              <small>{customer.telefono} - {customer.email}</small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <label>E-Mail</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles.formControl}
                      placeholder="indyxrome@yahoo.it"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Nome</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className={styles.formControl}
                      placeholder="Adriano"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Cognome</label>
                    <input
                      type="text"
                      name="cognome"
                      value={formData.cognome}
                      onChange={handleInputChange}
                      className={styles.formControl}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>CAP</label>
                    <input
                      type="text"
                      name="massimocapriLoreti"
                      value={formData.massimocapriLoreti}
                      onChange={handleInputChange}
                      className={styles.formControl}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Telefono</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className={styles.formControl}
                      placeholder="+39 334 5918481"
                    />
                  </div>
                </div>

                {/* COLONNA 2: Dati Dispositivo */}
                <div className={styles.formColumn}>
                  {/* Campo di ricerca dispositivo con dropdown - DALLA PAGINA ACCETTAZIONE */}
                  <div className={styles.formField}>
                    <label>Cerca Dispositivo esistente</label>
                    <div className={styles.searchContainer}>
                      <input
                        ref={deviceSearchInputRef}
                        type="text"
                        className={styles.formControl}
                        placeholder="Digita marca, modello o numero seriale..."
                        value={deviceSearchQuery}
                        onChange={(e) => handleDeviceSearchChange(e.target.value)}
                        onFocus={() => {
                          if (deviceSearchResults.length > 0) {
                            setShowDeviceDropdown(true);
                          }
                        }}
                      />

                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={openNewDeviceModal}
                        title="Aggiungi nuovo dispositivo"
                      >
                        +
                      </button>

                      {selectedDevice && (
                        <button
                          type="button"
                          className={styles.clearBtn}
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

                      {/* Dropdown risultati dispositivi */}
                      {showDeviceDropdown && deviceSearchResults.length > 0 && (
                        <div ref={deviceDropdownRef} className={styles.dropdown}>
                          {deviceSearchResults.map((device) => (
                            <div
                              key={device.id}
                              className={styles.dropdownItem}
                              onClick={() => onSelectDevice(device)}
                            >
                              <strong>
                                {getDeviceIcon(device.deviceType)} {device.brand} {device.model}
                              </strong>
                              <small>
                                Seriale: {device.serialNumber} • Tipo: {device.deviceType}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <label>Numero di serie/IMEI</label>
                    <input
                      type="text"
                      name="numeroSerieIMEI"
                      value={formData.numeroSerieIMEI}
                      onChange={handleInputChange}
                      className={styles.formControl}
                      placeholder="356664323 40464345"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Dispositivo</label>
                    <select
                      name="dispositivo"
                      value={formData.dispositivo}
                      onChange={handleInputChange}
                      className={styles.formControl}
                    >
                      <option value="Mobile">📱 Mobile</option>
                      <option value="Tablet">📱 Tablet</option>
                      <option value="Laptop">💻 Laptop</option>
                      <option value="Watch">⌚ Watch</option>
                      <option value="Altri">🔧 Altri</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label>Marca</label>
                    <input
                      type="text"
                      name="marca"
                      value={formData.marca || ''}
                      onChange={handleInputChange}
                      className={styles.formControl}
                      placeholder="Apple"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Modello</label>
                    <input
                      type="text"
                      name="modello"
                      value={formData.modello}
                      onChange={handleInputChange}
                      className={styles.formControl}
                      placeholder="iPhone 14 Pro"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Assegnata a</label>
                    <select
                      className={styles.formControl}
                      value={selectedOperator?.id || ""}
                      onChange={(e) => {
                        const operator = operators.find(
                          (op) => op.id === e.target.value
                        );
                        setSelectedOperator(operator || null);
                        setFormData(prev => ({
                          ...prev,
                          assegnataA: operator
                            ? `${operator.firstName} ${operator.lastName}`.trim()
                            : "",
                        }));
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
                  </div>
                </div>

                {/* COLONNA 3: Component/Problem e Descrizione */}
                <div className={styles.formColumn}>
                  {/* Data e ora di rilevazione */}
                  <div className={styles.formField}>
                    <label>Data e ora di rilevazione</label>
                    <input
                      type="datetime-local"
                      name="dataOraRilevazione"
                      value={formData.dataOraRilevazione}
                      onChange={handleInputChange}
                      className={styles.formControl}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Componente/Problem</label>
                    <select
                      name="componenteProblem"
                      value={formData.componenteProblem}
                      onChange={handleInputChange}
                      className={styles.formControl}
                    >
                      <option value="Schermo">Schermo</option>
                      <option value="Batteria">Batteria</option>
                      <option value="Fotocamera">Fotocamera</option>
                      <option value="Speaker">Speaker</option>
                      <option value="Microfono">Microfono</option>
                      <option value="Connettore">Connettore</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label>Descrizione dell'intervento/problema</label>
                    <textarea
                      name="descrizioneIntervento"
                      value={formData.descrizioneIntervento}
                      onChange={handleInputChange}
                      className={`${styles.formControl} ${styles.textareaLarge}`}
                      rows={8}
                      placeholder="Sostituzione del vetro dello schermo"
                    />
                  </div>

                  {/* Prezzo Preventivo iva inclusa */}
                  <div className={styles.formField}>
                    <label>Prezzo Preventivo iva inclusa</label>
                    <div className={styles.priceInput}>
                      <input
                        type="number"
                        name="prezzoPreventivo"
                        value={formData.prezzoPreventivo}
                        onChange={handleInputChange}
                        className={styles.formControl}
                        placeholder="399.00"
                        step="0.01"
                        min="0"
                      />
                      <span className={styles.currency}>Eur</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pulsanti azione */}
              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.btnSave}
                  onClick={handleSalvaPreventivo}
                >
                  Salva
                </button>
                <button
                  type="button"
                  className={styles.btnPrint}
                  onClick={handleCreaStampa}
                >
                  Stampa
                </button>
                <button
                  type="button"
                  className={styles.btnSendMail}
                  onClick={handleCreaEmail}
                >
                  Invia Mail
                </button>
              </div>
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
                x
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
                    <label>Citta</label>
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

      {/* Modal per inserimento nuovo dispositivo - DALLA PAGINA ACCETTAZIONE */}
      {showNewDeviceModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowNewDeviceModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h4>📱 Aggiungi Nuovo Dispositivo</h4>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowNewDeviceModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.customerForm}>
                <div className={styles.formRow}>
                  <div className={styles.formCol6}>
                    <label>Device ID</label>
                    <input
                      className={styles.formControl}
                      value={newDeviceData.deviceId}
                      readOnly
                      placeholder="Generato automaticamente"
                    />
                  </div>
                  <div className={styles.formCol6}>
                    <label>Numero Seriale *</label>
                    <input
                      className={styles.formControl}
                      value={newDeviceData.serialNumber}
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
                          serialNumber: e.target.value,
                        })
                      }
                      placeholder="IMEI, ESN o altro codice seriale"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formCol3}>
                    <label>Marca *</label>
                    <input
                      className={styles.formControl}
                      value={newDeviceData.brand}
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
                          brand: e.target.value,
                        })
                      }
                      placeholder="es. Samsung, LG, Apple..."
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Modello *</label>
                    <input
                      className={styles.formControl}
                      value={newDeviceData.model}
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
                          model: e.target.value,
                        })
                      }
                      placeholder="es. Galaxy S21, iPhone 13..."
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Tipo Device *</label>
                    <select
                      className={styles.formControl}
                      value={newDeviceData.deviceType}
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
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
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formCol3}>
                    <label>Data Acquisto</label>
                    <input
                      type="date"
                      className={styles.formControl}
                      value={newDeviceData.purchaseDate}
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
                          purchaseDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Numero Scontrino</label>
                    <input
                      className={styles.formControl}
                      value={newDeviceData.receiptNumber}
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
                          receiptNumber: e.target.value,
                        })
                      }
                      placeholder="Numero per la garanzia"
                    />
                  </div>
                  <div className={styles.formCol3}>
                    <label>Rivenditore</label>
                    <input
                      className={styles.formControl}
                      value={newDeviceData.retailer}
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
                          retailer: e.target.value,
                        })
                      }
                      placeholder="Nome del negozio"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formCol6}>
                    <label>Note</label>
                    <textarea
                      className={styles.formControl}
                      value={newDeviceData.notes}
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Note aggiuntive sul dispositivo..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowNewDeviceModal(false)}
              >
                Annulla
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSaveNewDevice}
                disabled={savingNewDevice}
              >
                {savingNewDevice ? "Salvando..." : "Salva Dispositivo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreventiviPage;

