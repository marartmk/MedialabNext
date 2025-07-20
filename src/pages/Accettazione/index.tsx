import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from "./styles.module.css";
import { CalendarDays } from "lucide-react";
import BottomBar from "../../components/BottomBar";

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

// Tipo per i dati del dispositivo
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
  const debounceRef = useRef<NodeJS.Timeout>();
  const deviceDebounceRef = useRef<NodeJS.Timeout>();

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
    serialNumber: "",
    brand: "",
    model: "",
    deviceType: "Mobile",
    color: "",
    unlockCode: "",
    courtesyPhone: "",
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

  // Stati per il nuovo dispositivo
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

  const [savingNewClient, setSavingNewClient] = useState(false);
  const [savingNewDevice, setSavingNewDevice] = useState(false);

  // Nuovi stati per la gestione della riparazione
  const [repairData, setRepairData] = useState({
    faultDeclared: "",
    repairAction: "",
    technicianCode: "",
    technicianName: "",
    estimatedPrice: 0,
    paymentType: "",
    billingInfo: "",
    unlockCode: "",
    courtesyPhone: "",
  });

  const [operators, setOperators] = useState<any[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isCreatingRepair, setIsCreatingRepair] = useState(false);
  const [repairComponent, setRepairComponent] = useState("");

  // Tipi di dispositivo
  const deviceTypes = [
    { value: "Mobile", label: "📱 Mobile" },
    { value: "TV", label: "📺 TV" },
    { value: "Other", label: "🔧 Altro" },
  ];

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

  // Carica gli operatori al mount del componente
  useEffect(() => {
    loadOperators();
  }, []);

  // Effetto per gestire i click fuori dai dropdown
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

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Funzione per caricare gli operatori
  const loadOperators_base = async () => {
    try {
      const response = await fetch("https://localhost:7148/api/operator", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
    }
  };

  const loadOperators = async () => {
    try {
      // Per ora usiamo dati fake, poi sostituiremo con la vera API
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

      // Simula un piccolo delay come se fosse una vera chiamata API
      await new Promise((resolve) => setTimeout(resolve, 300));

      setOperators(fakeOperators);
      console.log("Operatori fake caricati:", fakeOperators);

      /* 
    // Questo sarà il codice vero quando avremo l'API:
    const response = await fetch('https://localhost:7148/api/operator', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (response.ok) {
      const operatorsData = await response.json();
      setOperators(operatorsData);
    } else {
      console.error('Errore nel caricamento operatori');
    }
    */
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

  // Funzione per eseguire la ricerca dispositivo
  const performDeviceSearch = async (query: string) => {
    if (!query.trim()) return;

    setDeviceLoading(true);
    const multitenantId = localStorage.getItem("IdCompany");

    try {
      const response = await fetch(
        `https://localhost:7148/api/device/search?query=${encodeURIComponent(
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

  // Funzione per selezionare un dispositivo
  const onSelectDevice = (device: DeviceData) => {
    setSelectedDevice(device);
    setDeviceSearchQuery(
      `${device.brand} ${device.model} - ${device.serialNumber}`
    );
    setShowDeviceDropdown(false);

    setDispositivoData({
      serialNumber: device.serialNumber,
      brand: device.brand,
      model: device.model,
      deviceType: device.deviceType,
      color: "",
      unlockCode: "",
      courtesyPhone: "",
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
      serialNumber: "",
      brand: "",
      model: "",
      deviceType: "Mobile",
      color: "",
      unlockCode: "",
      courtesyPhone: "",
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

  // Funzione per aprire il modal di nuovo dispositivo
  const openNewDeviceModal = () => {
    setNewDeviceData({
      deviceId: generateGuid(),
      customerId: selectedCustomer?.id || "",
      companyId: "",
      multitenantId: localStorage.getItem("IdCompany") || "",
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

    // Validazione Riparazione
    if (!repairComponent) {
      errors.push("Selezionare il componente/tipo di riparazione");
    }

    if (!repairData.faultDeclared?.trim()) {
      errors.push("Inserire la descrizione del problema");
    }

    if (!selectedOperator) {
      errors.push("Assegnare la riparazione a un tecnico");
    }

    if (repairData.estimatedPrice <= 0) {
      errors.push("Inserire un prezzo preventivo valido");
    }

    // Validazione diagnostica - almeno un elemento deve essere selezionato
    const activeDiagnosticItems = diagnosticItems.filter((item) => item.active);
    if (activeDiagnosticItems.length === 0) {
      errors.push(
        "Selezionare almeno un elemento nella diagnostica di ricezione"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Funzione per preparare i dati della riparazione
  const prepareRepairPayload = () => {
    const multitenantId = localStorage.getItem("IdCompany");

    // Prepara i dati del cliente (se nuovo)
    let customerPayload = null;
    if (!selectedCustomer) {
      customerPayload = {
        tipo: "Privato",
        cliente: true,
        fornitore: false,
        ragioneSociale: `${clienteData.cognome} ${clienteData.nome}`.trim(),
        cognome: clienteData.cognome,
        nome: clienteData.nome,
        email: clienteData.email,
        telefono: clienteData.telefono,
        cap: clienteData.cap,
        multitenantId: multitenantId,
        indirizzo: "",
        citta: "",
        provincia: "",
        regione: "",
        fiscalCode: "",
        pIva: "",
        emailPec: "",
        codiceSdi: "",
        iban: "",
      };
    }

    // Prepara i dati del dispositivo (se nuovo)
    let devicePayload = null;
    if (!selectedDevice) {
      devicePayload = {
        serialNumber: dispositivoData.serialNumber,
        brand: dispositivoData.brand,
        model: dispositivoData.model,
        deviceType: dispositivoData.deviceType,
        color: dispositivoData.color || null,
        purchaseDate: null,
        receiptNumber: null,
        retailer: null,
        notes: null,
      };
    }

    // Prepara i dati della riparazione
    const repairPayload = {
      faultDeclared: repairData.faultDeclared,
      repairAction: repairData.repairAction || null,
      technicianCode:
        selectedOperator?.codiceDipendente ||
        selectedOperator?.internalCode ||
        null,
      technicianName:
        `${selectedOperator?.firstName || ""} ${
          selectedOperator?.lastName || ""
        }`.trim() || null,
      estimatedPrice: repairData.estimatedPrice,
      paymentType: repairData.paymentType || null,
      billingInfo: repairData.billingInfo || null,
      unlockCode: dispositivoData.unlockCode || null,
      courtesyPhone: dispositivoData.courtesyPhone || null,
    };

    // Prepara il test di ingresso
    const incomingTestPayload = {
      companyId: multitenantId,
      multitenantId: multitenantId,
      deviceInfo:
        diagnosticItems.find((item) => item.id === "device-info")?.active ||
        false,
      applePay:
        diagnosticItems.find((item) => item.id === "apple-pay")?.active ||
        false,
      battery:
        diagnosticItems.find((item) => item.id === "battery")?.active || false,
      bluetooth:
        diagnosticItems.find((item) => item.id === "bluetooth")?.active ||
        false,
      camera:
        diagnosticItems.find((item) => item.id === "camera")?.active || false,
      cellular:
        diagnosticItems.find((item) => item.id === "cellular")?.active || false,
      clock:
        diagnosticItems.find((item) => item.id === "clock")?.active || false,
      sim: diagnosticItems.find((item) => item.id === "sim")?.active || false,
      faceId:
        diagnosticItems.find((item) => item.id === "face-id")?.active || false,
      scanner:
        diagnosticItems.find((item) => item.id === "scanner")?.active || false,
      magSafe:
        diagnosticItems.find((item) => item.id === "magsafe")?.active || false,
      sensors:
        diagnosticItems.find((item) => item.id === "sensors")?.active || false,
      services:
        diagnosticItems.find((item) => item.id === "services")?.active || false,
      software:
        diagnosticItems.find((item) => item.id === "software")?.active || false,
      system:
        diagnosticItems.find((item) => item.id === "system")?.active || false,
      wiFi: diagnosticItems.find((item) => item.id === "wifi")?.active || false,
      rfCellular:
        diagnosticItems.find((item) => item.id === "rf-cellular")?.active ||
        false,
      wirelessProblem:
        diagnosticItems.find((item) => item.id === "wireless-problem")
          ?.active || false,
    };

    // Prepara gli elementi diagnostici
    const diagnosticItemsPayload = diagnosticItems
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        label: item.label,
        active: item.active,
      }));

    return {
      customerId: selectedCustomer?.id || null,
      newCustomer: customerPayload,
      deviceId: selectedDevice?.id || null,
      newDevice: devicePayload,
      repairData: repairPayload,
      incomingTest: incomingTestPayload,
      diagnosticItems: diagnosticItemsPayload,
      notes: repairData.billingInfo || null,
      multitenantId: multitenantId,
    };
  };

  // Funzione principale per creare la riparazione
  const handleCreateRepair = async (
    actionType: "email" | "print" | "label" | "lab"
  ) => {
    // Esegui validazione
    const validation = validateForm();

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      alert("Errori di validazione:\n\n" + validation.errors.join("\n"));
      return;
    }

    // Pulisci errori di validazione precedenti
    setValidationErrors([]);
    setIsCreatingRepair(true);

    try {
      // Prepara il payload
      const payload = prepareRepairPayload();

      console.log("Payload riparazione:", payload);

      // Chiama l'API per creare la riparazione
      const response = await fetch("https://localhost:7148/api/repair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();

        console.log("Riparazione creata:", result);

        // Mostra messaggio di successo
        alert(
          `Riparazione creata con successo!\n\nCodice: ${result.repairCode}\nID: ${result.repairId}\nStato: ${result.status}`
        );

        // Gestisci l'azione specifica
        await handlePostCreateAction(actionType, result);

        // Reset del form o reindirizzamento
        if (confirm("Vuoi creare un'altra riparazione?")) {
          resetForm();
        } else {
          // Reindirizza alla lista riparazioni o dashboard
          // window.location.href = '/riparazioni';
        }
      } else {
        const errorText = await response.text();
        console.error("Errore risposta API:", errorText);
        alert("Errore nella creazione della riparazione:\n" + errorText);
      }
    } catch (error) {
      console.error("Errore durante la creazione:", error);
      alert("Errore durante la creazione della riparazione. Riprova.");
    } finally {
      setIsCreatingRepair(false);
    }
  };

  // Funzione per gestire le azioni post-creazione
  const handlePostCreateAction = async (
    actionType: "email" | "print" | "label" | "lab",
    repairResult: any
  ) => {
    switch (actionType) {
      case "email":
        console.log("Invio email per riparazione:", repairResult.repairId);
        alert("Email di conferma inviata al cliente!");
        break;

      case "print":
        console.log("Stampa scheda riparazione:", repairResult.repairId);
        alert("Stampa della scheda avviata!");
        break;

      case "label":
        console.log("Stampa etichetta per:", repairResult.repairId);
        alert("Stampa etichetta avviata!");
        break;

      case "lab":
        console.log("Invio al laboratorio:", repairResult.repairId);
        alert("Riparazione inviata al laboratorio!");
        break;
    }
  };

  // Funzione per resettare il form
  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedDevice(null);
    setSearchQuery("");
    setDeviceSearchQuery("");
    setClienteData({
      email: "",
      nome: "",
      cognome: "",
      telefono: "",
      cap: "",
    });
    setDispositivoData({
      serialNumber: "",
      brand: "",
      model: "",
      deviceType: "Mobile",
      color: "",
      unlockCode: "",
      courtesyPhone: "",
    });
    setRepairData({
      faultDeclared: "",
      repairAction: "",
      technicianCode: "",
      technicianName: "",
      estimatedPrice: 0,
      paymentType: "",
      billingInfo: "",
      unlockCode: "",
      courtesyPhone: "",
    });
    setRepairComponent("");
    setSelectedOperator(null);
    setValidationErrors([]);

    // Reset diagnostica
    setDiagnosticItems((prevItems) =>
      prevItems.map((item) => ({ ...item, active: true }))
    );
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

  // Funzione per salvare il nuovo dispositivo
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

    const payload = {
      deviceId: newDeviceData.deviceId || generateGuid(),
      customerId: selectedCustomer?.id || null,
      companyId: newDeviceData.companyId || null,
      multitenantId: localStorage.getItem("IdCompany") || null,
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
      const response = await fetch("https://localhost:7148/api/device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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

  // Funzione per ottenere l'icona del dispositivo
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "Mobile":
        return "📱";
      case "TV":
        return "📺";
      case "Other":
        return "🔧";
      default:
        return "📱";
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

                        <button
                          type="button"
                          className={styles.addClientButton}
                          onClick={openNewDeviceModal}
                          title="Aggiungi nuovo dispositivo"
                        >
                          +
                        </button>

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

                        {/* Dropdown risultati dispositivi */}
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
                                      <span>
                                        Seriale: {device.serialNumber}
                                      </span>
                                      <span> • Tipo: {device.deviceType}</span>
                                    </div>
                                    <div className={styles.customerAddress}>
                                      {device.purchaseDate && (
                                        <>
                                          Acquisto:{" "}
                                          {new Date(
                                            device.purchaseDate
                                          ).toLocaleDateString("it-IT")}
                                        </>
                                      )}
                                      {device.retailer && (
                                        <> • Rivenditore: {device.retailer}</>
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
                      <input
                        type="text"
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
                        placeholder="Marca del dispositivo"
                      />
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
                        value={dispositivoData.color}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            color: e.target.value,
                          })
                        }
                        placeholder="Colore del dispositivo"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Codice di Sblocco</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={dispositivoData.unlockCode}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            unlockCode: e.target.value,
                          })
                        }
                        placeholder="Codice di sblocco"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Telefono di cortesia</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={dispositivoData.courtesyPhone}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            courtesyPhone: e.target.value,
                          })
                        }
                        placeholder="Telefono di cortesia"
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
                  {validationErrors.includes(
                    "Selezionare almeno un elemento nella diagnostica di ricezione"
                  ) && (
                    <div className={styles.errorText}>
                      Selezionare almeno un elemento
                    </div>
                  )}
                </div>
              </div>

              {/* Colonna destra */}
              <div className={styles.rightColumn}>
                {/* Info generazione automatica - AGGIORNATA */}
                <div className={styles.autoGenerationInfo}>
                  <div className={styles.formGroup}>
                    <label>Data e ora di creazione</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={`${dateTime.date} ${dateTime.time}`}
                      readOnly
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Cod. scheda</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value="Generato automaticamente alla creazione"
                      readOnly
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
                      <div className={styles.errorText}>Campo obbligatorio</div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Gestita in</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value="Sede principale"
                      readOnly
                    />
                  </div>
                </div>

                {/* Sezione Riparazione - AGGIORNATA */}
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
                    <label>Descrizione dell'intervento/problema *</label>
                    <textarea
                      className={`${styles.formControl} ${
                        validationErrors.includes(
                          "Inserire la descrizione del problema"
                        )
                          ? styles.error
                          : ""
                      }`}
                      rows={4}
                      value={repairData.faultDeclared}
                      onChange={(e) =>
                        setRepairData({
                          ...repairData,
                          faultDeclared: e.target.value,
                        })
                      }
                      placeholder="Descrivi il problema riscontrato o l'intervento richiesto..."
                    />
                    {validationErrors.includes(
                      "Inserire la descrizione del problema"
                    ) && (
                      <div className={styles.errorText}>Campo obbligatorio</div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Azione di riparazione</label>
                    <textarea
                      className={styles.formControl}
                      rows={3}
                      value={repairData.repairAction}
                      onChange={(e) =>
                        setRepairData({
                          ...repairData,
                          repairAction: e.target.value,
                        })
                      }
                      placeholder="Descrivi le azioni che verranno eseguite..."
                    />
                  </div>
                </div>

                {/* Sezione Prezzo - AGGIORNATA */}
                <div className={styles.formSection}>
                  <h3>Prezzo</h3>

                  <div className={styles.formGroup}>
                    <label>Prezzo Preventivo IVA inclusa *</label>
                    <div className={styles.priceInputContainer}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "Inserire un prezzo preventivo valido"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={repairData.estimatedPrice}
                        onChange={(e) =>
                          setRepairData({
                            ...repairData,
                            estimatedPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                      <span className={styles.currencyLabel}>€</span>
                    </div>
                    {validationErrors.includes(
                      "Inserire un prezzo preventivo valido"
                    ) && (
                      <div className={styles.errorText}>Campo obbligatorio</div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo di Pagamento</label>
                    <select
                      className={styles.formControl}
                      value={repairData.paymentType}
                      onChange={(e) =>
                        setRepairData({
                          ...repairData,
                          paymentType: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Seleziona --</option>
                      <option value="Contanti">💵 Contanti</option>
                      <option value="Carta di Credito">
                        💳 Carta di Credito
                      </option>
                      <option value="Bancomat">💳 Bancomat</option>
                      <option value="Bonifico">🏦 Bonifico</option>
                      <option value="Amex">💳 American Express</option>
                      <option value="PayPal">💰 PayPal</option>
                      <option value="Altro">🔄 Altro</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Informazioni per la fatturazione</label>
                    <textarea
                      className={styles.formControl}
                      rows={3}
                      value={repairData.billingInfo}
                      onChange={(e) =>
                        setRepairData({
                          ...repairData,
                          billingInfo: e.target.value,
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

            {/* Bottoni azioni - AGGIORNATI */}
            <div className={styles.formActions}>
              <button
                className={`${styles.btn} ${styles.btnSuccess}`}
                onClick={() => handleCreateRepair("email")}
                disabled={isCreatingRepair}
              >
                {isCreatingRepair ? "Creando..." : "📧 Crea/Invia E-Mail"}
              </button>

              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => handleCreateRepair("print")}
                disabled={isCreatingRepair}
              >
                {isCreatingRepair ? "Creando..." : "🖨️ Crea/Stampa"}
              </button>

              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => handleCreateRepair("label")}
                disabled={isCreatingRepair}
              >
                {isCreatingRepair ? "Creando..." : "🏷️ Crea/Stampa etichetta"}
              </button>

              <button
                className={`${styles.btn} ${styles.btnDark}`}
                onClick={() => handleCreateRepair("lab")}
                disabled={isCreatingRepair}
              >
                {isCreatingRepair
                  ? "Creando..."
                  : "🔬 Crea/Stampa/Spedisci al Lab"}
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

      {/* Modal per inserimento nuovo dispositivo */}
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
                      onChange={(e) =>
                        setNewDeviceData({
                          ...newDeviceData,
                          deviceId: e.target.value,
                        })
                      }
                      placeholder="Generato automaticamente"
                      readOnly
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

export default Accettazione;
