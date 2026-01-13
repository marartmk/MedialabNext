import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from './styles.module.css';
import logoUrl from "../../assets/logo-black-white.jpg";

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

interface CreateQuotationResponse {
  id: number;
  quotationId: string;
  quotationCode: string;
  quotationStatus: string;
  quotationStatusCode: string;
  createdAt: string;
}

interface QuotationDetail {
  id: number;
  quotationId: string;
  quotationCode?: string | null;
  quotationStatus?: string | null;
  quotationStatusCode?: number | null;
  quotationDateTime?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  deviceType?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  technicianCode?: string | null;
  technicianName?: string | null;
  componentIssue?: string | null;
  problemDescription?: string | null;
  estimatedPrice?: number | null;
  createdAt?: string | null;
}

interface PrintQuotationData {
  quotationId?: string;
  quotationCode?: string;
  quotationStatus?: string;
  createdAt?: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    province?: string;
    fiscalCode?: string;
    vatNumber?: string;
  };
  device?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    deviceType?: string;
  };
  technicianName?: string;
  componentIssue?: string;
  problemDescription?: string;
  estimatedPrice?: number | null;
  notes?: string | null;
}

const PreventiviPage: React.FC = () => {
  // Stati per la ricerca cliente (dalla pagina note)
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state || {}) as {
    quotationId?: string;
    quotationCode?: string;
    quotationNumericId?: number;
  };
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
  const userName =
    (typeof window !== "undefined" &&
      (sessionStorage.getItem("userId") ||
        sessionStorage.getItem("username") ||
        sessionStorage.getItem("userName") ||
        sessionStorage.getItem("UserName") ||
        "")) ||
    "Utente";

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
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);
  const [isUpdatingQuotation, setIsUpdatingQuotation] = useState(false);
  const [savedQuotation, setSavedQuotation] =
    useState<CreateQuotationResponse | null>(null);
  const [quotationToEdit, setQuotationToEdit] =
    useState<QuotationDetail | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printQuotation, setPrintQuotation] =
    useState<PrintQuotationData | null>(null);
  const [showSignatureQrModal, setShowSignatureQrModal] = useState(false);
  const [signatureAccessKey, setSignatureAccessKey] = useState<string | null>(
    null
  );
  const [signatureAccessUrl, setSignatureAccessUrl] = useState<string | null>(
    null
  );
  const [isCreatingAccessKey, setIsCreatingAccessKey] = useState(false);
  const [accessKeyError, setAccessKeyError] = useState<string | null>(null);

  // Stati per la firma digitale (stampa preventivo)
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const signatureCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Dati aziendali per la stampa
  const companyName =
    (typeof window !== "undefined" && sessionStorage.getItem("fullName")) ||
    "CLINICA iPHONE STORE";
  const companyAddr =
    (typeof window !== "undefined" &&
      sessionStorage.getItem("companyAddress")) ||
    "Via Prova 1 73100 Lecce (LE)";
  const companyVat =
    (typeof window !== "undefined" && sessionStorage.getItem("companyVat")) ||
    "P.IVA 01234567890";
  const companyPhone =
    (typeof window !== "undefined" && sessionStorage.getItem("companyPhone")) ||
    "0832 123456";

    console.log("signatureAccessKey",signatureAccessKey);

  useEffect(() => {
    loadOperators();
  }, []);

  const splitCustomerName = (fullName: string) => {
    const normalized = fullName.trim();
    if (!normalized) {
      return { nome: "", cognome: "" };
    }
    const parts = normalized.split(/\s+/);
    if (parts.length === 1) {
      return { nome: parts[0], cognome: "" };
    }
    const nome = parts[parts.length - 1];
    const cognome = parts.slice(0, -1).join(" ");
    return { nome, cognome };
  };

  const formatDateTimeForInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const hydrateFormFromQuotation = (quotation: QuotationDetail) => {
    const customerName = (quotation.customerName || "").trim();
    const { nome, cognome } = splitCustomerName(customerName);

    setSearchQuery(customerName);
    setShowDropdown(false);
    setSearchResults([]);

    if (quotation.customerId) {
      setSelectedCustomer({
        id: quotation.customerId,
        tipologia: "",
        ragioneSociale: customerName,
        nome,
        cognome,
        email: quotation.customerEmail || "",
        telefono: quotation.customerPhone || "",
        cap: "",
        indirizzo: "",
        citta: "",
        provincia: "",
        regione: "",
        fiscalCode: "",
        pIva: "",
        emailPec: "",
        codiceSdi: "",
        iban: "",
      });
    } else {
      setSelectedCustomer(null);
    }

    setSelectedDevice(null);
    setDeviceSearchQuery(
      [quotation.deviceBrand, quotation.deviceModel].filter(Boolean).join(" ")
    );

    setFormData((prev) => ({
      ...prev,
      dataOraRilevazione:
        formatDateTimeForInput(quotation.quotationDateTime) ||
        prev.dataOraRilevazione,
      email: quotation.customerEmail || "",
      nome,
      cognome,
      massimocapriLoreti: "",
      telefono: quotation.customerPhone || "",
      numeroSerieIMEI: "",
      dispositivo: quotation.deviceType || prev.dispositivo,
      marca: quotation.deviceBrand || "",
      modello: quotation.deviceModel || "",
      assegnataA: quotation.technicianName || "",
      componenteProblem: quotation.componentIssue || prev.componenteProblem,
      descrizioneIntervento: quotation.problemDescription || "",
      prezzoPreventivo:
        typeof quotation.estimatedPrice === "number"
          ? String(quotation.estimatedPrice)
          : "",
    }));

    setSavedQuotation({
      id: quotation.id || 0,
      quotationId: quotation.quotationId,
      quotationCode: quotation.quotationCode || navState.quotationCode || "",
      quotationStatus: quotation.quotationStatus || "",
      quotationStatusCode: String(quotation.quotationStatusCode || ""),
      createdAt: quotation.createdAt || "",
    });
    setIsUpdatingQuotation(true);
  };

  const loadCustomerDetail = async (customerId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/Customer/${customerId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }
      const data = await response.json();
      const customer: CustomerData = {
        id: data.id || customerId,
        tipologia: data.tipologia || "",
        ragioneSociale: data.ragioneSociale || "",
        nome: data.nome || "",
        cognome: data.cognome || "",
        email: data.email || "",
        telefono: data.telefono || "",
        cap: data.cap || "",
        indirizzo: data.indirizzo || "",
        citta: data.citta || "",
        provincia: data.provincia || "",
        regione: data.regione || "",
        fiscalCode: data.fiscalCode || data.codiceFiscale || "",
        pIva: data.pIva || data.partitaIva || "",
        emailPec: data.emailPec || "",
        codiceSdi: data.codiceSdi || "",
        iban: data.iban || "",
      };

      setSelectedCustomer(customer);
      const displayName =
        customer.ragioneSociale ||
        `${customer.nome} ${customer.cognome}`.trim();
      if (displayName) {
        setSearchQuery(displayName);
      }
      setFormData((prev) => ({
        ...prev,
        email: customer.email || prev.email,
        nome: customer.nome || prev.nome,
        cognome: customer.cognome || prev.cognome,
        telefono: customer.telefono || prev.telefono,
        massimocapriLoreti: customer.cap || prev.massimocapriLoreti,
      }));
    } catch (error) {
      console.error("Errore nel caricamento anagrafica cliente:", error);
    }
  };

  useEffect(() => {
    const quotationId = navState.quotationId;
    const quotationNumericId = navState.quotationNumericId;
    if (!quotationId && !quotationNumericId) return;

    const fetchQuotation = async () => {
      try {
        const endpoint = quotationNumericId
          ? `${API_URL}/api/quotations/${quotationNumericId}`
          : `${API_URL}/api/quotations/guid/${quotationId}`;
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Errore ${response.status}`);
        }
        const detail: QuotationDetail = await response.json();
        setQuotationToEdit(detail);
        hydrateFormFromQuotation(detail);
        if (detail.customerId) {
          await loadCustomerDetail(detail.customerId);
        }
      } catch (error) {
        console.error("Errore nel caricamento del preventivo:", error);
        alert("Impossibile caricare i dati del preventivo selezionato.");
      }
    };

    fetchQuotation();
  }, [navState.quotationId, navState.quotationNumericId, API_URL]);

  useEffect(() => {
    if (!quotationToEdit || operators.length === 0) return;
    const targetCode = quotationToEdit.technicianCode || "";
    const targetName = (quotationToEdit.technicianName || "").trim();
    const operator =
      operators.find(
        (op) =>
          op.codiceDipendente === targetCode ||
          op.internalCode === targetCode ||
          `${op.firstName} ${op.lastName}`.trim() === targetName
      ) || null;
    setSelectedOperator(operator);
    if (operator) {
      setFormData((prev) => ({
        ...prev,
        assegnataA: `${operator.firstName} ${operator.lastName}`.trim(),
      }));
    }
  }, [quotationToEdit, operators]);

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

  // Funzioni per la gestione della firma digitale (stampa preventivo)
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);

    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    setSignatureData(dataUrl);
    setShowSignatureModal(false);

    alert("Firma acquisita con successo!");
  };

  const openSignatureModal = () => {
    setShowSignatureModal(true);

    setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 100);
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

  const validateQuotationForm = () => {
    const errors: string[] = [];
    const companyId = sessionStorage.getItem("IdCompany");
    const deviceType = selectedDevice?.deviceType || formData.dispositivo;
    const deviceModel = selectedDevice?.model || formData.modello;
    const technicianCode =
      selectedOperator?.codiceDipendente || selectedOperator?.internalCode || "";
    const quotationDate = formData.dataOraRilevazione
      ? new Date(formData.dataOraRilevazione)
      : null;

    if (!companyId) {
      errors.push("Selezionare un'azienda valida");
    }
    if (!deviceType?.trim()) {
      errors.push("Selezionare il tipo di dispositivo");
    }
    if (!deviceModel?.trim()) {
      errors.push("Inserire il modello del dispositivo");
    }
    if (!formData.descrizioneIntervento.trim()) {
      errors.push("Inserire la descrizione del problema");
    }
    if (!technicianCode) {
      errors.push("Selezionare un tecnico");
    }
    if (!quotationDate || Number.isNaN(quotationDate.getTime())) {
      errors.push("Inserire una data valida");
    }
    if (formData.prezzoPreventivo.trim()) {
      const price = Number.parseFloat(formData.prezzoPreventivo);
      if (Number.isNaN(price) || price <= 0) {
        errors.push("Inserire un prezzo preventivo valido");
      }
    }

    return errors;
  };

  const buildQuotationPayload = () => {
    const multitenantId = sessionStorage.getItem("IdCompany");
    const companyId = sessionStorage.getItem("IdCompany");
    const quotationDateTime = new Date(formData.dataOraRilevazione);
    const estimatedPrice = formData.prezzoPreventivo.trim()
      ? Number.parseFloat(formData.prezzoPreventivo)
      : null;
    const technicianCode =
      selectedOperator?.codiceDipendente || selectedOperator?.internalCode || "";
    const technicianName = selectedOperator
      ? `${selectedOperator.firstName} ${selectedOperator.lastName}`.trim()
      : null;
    const customerName = selectedCustomer
      ? selectedCustomer.ragioneSociale ||
        `${selectedCustomer.nome} ${selectedCustomer.cognome}`.trim()
      : `${formData.nome} ${formData.cognome}`.trim();

    return {
      // Cliente
      customerId: selectedCustomer?.id || null,
      customerName: customerName || null,
      customerPhone: selectedCustomer?.telefono || formData.telefono || null,
      customerEmail: selectedCustomer?.email || formData.email || null,

      // Dispositivo
      deviceType: selectedDevice?.deviceType || formData.dispositivo,
      deviceBrand: selectedDevice?.brand || formData.marca || null,
      deviceModel: selectedDevice?.model || formData.modello,
      deviceColor: null,

      // Preventivo
      quotationDateTime: quotationDateTime.toISOString(),
      validUntil: null,

      // Tecnico
      technicianCode,
      technicianName,

      // Problema
      componentIssue: formData.componenteProblem || null,
      problemDescription: formData.descrizioneIntervento,

      // Importi
      estimatedPrice,
      paymentType: null,
      billingInfo: null,

      // Contesto
      companyId,
      multitenantId,

      // Note
      notes: null,
      createdBy: userName,
    };
  };

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "0,00";
    }
    return value.toLocaleString("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const buildPrintQuotationData = (): PrintQuotationData => {
    const customerName = selectedCustomer
      ? selectedCustomer.ragioneSociale ||
        `${selectedCustomer.nome} ${selectedCustomer.cognome}`.trim()
      : `${formData.nome} ${formData.cognome}`.trim();
    const address = selectedCustomer?.indirizzo || "";
    const postalCode = selectedCustomer?.cap || "";
    const city = selectedCustomer?.citta || "";
    const province = selectedCustomer?.provincia || "";
    const estimatedPrice = formData.prezzoPreventivo.trim()
      ? Number.parseFloat(formData.prezzoPreventivo)
      : null;

    return {
      quotationId: savedQuotation?.quotationId,
      quotationCode: savedQuotation?.quotationCode,
      quotationStatus: savedQuotation?.quotationStatus,
      createdAt: savedQuotation?.createdAt,
      customer: {
        name: customerName || "Non specificato",
        phone: selectedCustomer?.telefono || formData.telefono || "",
        email: selectedCustomer?.email || formData.email || "",
        address: address || "",
        postalCode,
        city,
        province,
        fiscalCode: selectedCustomer?.fiscalCode || "",
        vatNumber: selectedCustomer?.pIva || "",
      },
      device: {
        brand: selectedDevice?.brand || formData.marca || "",
        model: selectedDevice?.model || formData.modello || "",
        serialNumber: selectedDevice?.serialNumber || formData.numeroSerieIMEI || "",
        deviceType: selectedDevice?.deviceType || formData.dispositivo || "",
      },
      technicianName: selectedOperator
        ? `${selectedOperator.firstName} ${selectedOperator.lastName}`.trim()
        : "",
      componentIssue: formData.componenteProblem || "",
      problemDescription: formData.descrizioneIntervento || "",
      estimatedPrice,
      notes: null,
    };
  };

  const handleSaveOrUpdateQuotation = async () => {
    const errors = validateQuotationForm();
    if (errors.length > 0) {
      alert("Errori di validazione:\n\n" + errors.join("\n"));
      return;
    }

    console.log("Token:", sessionStorage.getItem("token"));

    if (isCreatingQuotation) return;
    setIsCreatingQuotation(true);

    const currentQuotationId = savedQuotation?.quotationId;
    const isUpdate = Boolean(currentQuotationId);

    try {
      const payload = buildQuotationPayload();
      console.log(
        "Payload preventivo (json):",
        JSON.stringify(payload, null, 2)
      );
      const endpoint = isUpdate
        ? `${API_URL}/api/quotations/${currentQuotationId}`
        : `${API_URL}/api/quotations`;
      const response = await fetch(endpoint, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result: CreateQuotationResponse = await response.json();
        const quotationCode =
          result.quotationCode || savedQuotation?.quotationCode || "";
        const quotationStatus =
          result.quotationStatus || savedQuotation?.quotationStatus || "";
        const baseMessage = isUpdate
          ? `Preventivo aggiornato con successo!\n\nCodice: ${quotationCode}\nStato: ${quotationStatus}`
          : `Preventivo creato con successo!\n\nCodice: ${quotationCode}\nStato: ${quotationStatus}`;
        const nextQuotationId = result.quotationId || currentQuotationId || "";
        if (nextQuotationId) {
          setSavedQuotation({
            ...(savedQuotation || {}),
            ...result,
            quotationId: nextQuotationId,
            quotationCode,
            quotationStatus,
          });
          setIsUpdatingQuotation(true);
        } else {
          setSavedQuotation({ ...(savedQuotation || {}), ...result });
        }
        alert(baseMessage);
      } else {
        const errText = await response.text();
        alert(
          `Errore ${isUpdate ? "nell'aggiornamento" : "nella creazione"} del preventivo:\n` +
            errText
        );
      }
    } catch (error) {
      console.error(
        `Errore durante ${isUpdate ? "l'aggiornamento" : "la creazione"} preventivo:`,
        error
      );
      alert(
        `Errore durante ${isUpdate ? "l'aggiornamento" : "la creazione"} del preventivo. Riprova.`
      );
    } finally {
      setIsCreatingQuotation(false);
    }
  };

  // Funzione creazione preventivo con email
  const handleCreaEmail = () => {
    if (!savedQuotation?.quotationId) {
      alert("Salva prima il preventivo per poter inviare l'email.");
      return;
    }
    alert("Invio email non ancora implementato in FE.");
  };

  // Funzione creazione preventivo con stampa
  const handleCreaStampa = () => {
    if (!savedQuotation?.quotationId) {
      alert("Salva prima il preventivo per poter stampare.");
      return;
    }
    setPrintQuotation(buildPrintQuotationData());
    setShowPrintModal(true);
  };

  // Funzione salvataggio preventivo
  const handleSalvaPreventivo = () => {
    handleSaveOrUpdateQuotation();
  };

  const handleOpenSignatureQr = async () => {
    if (!savedQuotation?.quotationId) {
      alert("Salva prima il preventivo per poter firmare.");
      return;
    }

    if (isCreatingAccessKey) return;
    setIsCreatingAccessKey(true);
    setAccessKeyError(null);

    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const createdBy = sessionStorage.getItem("userId") || "";
      const response = await fetch(`${API_URL}/api/Signature/generateKey`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: savedQuotation.quotationId,
          areaId: "9b40e7a0-9b87-4c12-9d9c-9f5208f3f3f6",
          areaName: "Preventivi",
          createdBy,
          expiresAt: expiresAt.toISOString(),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Errore nella creazione access key");
      }

      const data = await response.json();
      const accessKey = data?.accessKey || data?.key || data?.token;
      if (!accessKey) {
        throw new Error("Access key non disponibile nella risposta");
      }

      const accessUrl = `${window.location.origin}/firma-preventivo-ext?accessKey=${encodeURIComponent(
        accessKey
      )}`;
      setSignatureAccessKey(accessKey);
      setSignatureAccessUrl(accessUrl);
      setShowSignatureQrModal(true);
    } catch (error) {
      console.error("Errore creazione access key:", error);
      const message =
        error instanceof Error ? error.message : "Errore nella richiesta";
      setAccessKeyError(message);
      alert(
        "Errore nella creazione della chiave di accesso.\n" + message
      );
    } finally {
      setIsCreatingAccessKey(false);
    }
  };

  const handleCopySignatureLink = async () => {
    if (!signatureAccessUrl) return;
    try {
      await navigator.clipboard.writeText(signatureAccessUrl);
      alert("Link copiato negli appunti.");
    } catch (error) {
      console.error("Errore copia link:", error);
      alert("Impossibile copiare il link. Copialo manualmente.");
    }
  };

  const handlePrintQuotationDocument = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const printContent = document.querySelector(`.accSheet`);
      if (!printContent) {
        console.error("Elemento da stampare non trovato");
        alert("Errore: impossibile trovare il contenuto da stampare");
        return;
      }

      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        console.error("Impossibile aprire la finestra di stampa");
        alert(
          "Errore: impossibile aprire la finestra di stampa. Verifica che i popup siano consentiti."
        );
        return;
      }

      const cssLinks = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]')
      )
        .map(
          (link) =>
            `<link rel="stylesheet" href="${(link as HTMLLinkElement).href}">`
        )
        .join("");

      const cssStyles = Array.from(document.querySelectorAll("style"))
        .map((style) => style.outerHTML)
        .join("");

      const printHTML = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preventivo - ${printQuotation?.quotationCode || ""}</title>
        ${cssLinks}
        ${cssStyles}
        <style>
          @media print {
            * {
              visibility: hidden !important;
              box-sizing: border-box !important;
            }
            .print-content,
            .print-content * {
              visibility: visible !important;
            }
            .print-content {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 5mm !important;
              background: white !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              font-size: 10px !important;
              line-height: 1.2 !important;
              color: #000 !important;
              overflow: hidden !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 8mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-content accSheet">
          ${printContent.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 500);
          };
        </script>
      </body>
      </html>
      `;

      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
    } catch (error) {
      console.error("Errore durante la stampa:", error);
      alert("Errore durante la stampa del preventivo. Riprova.");
    }
  };

  const handleGoToRiepilogo = () => {
    navigate("/ricerca-preventivi");
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
                  {isUpdatingQuotation ? "Aggiorna" : "Salva"}
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
                  className={styles.btnSignature}
                  onClick={handleOpenSignatureQr}
                  disabled={isCreatingAccessKey}
                >
                  {isCreatingAccessKey ? "Generando..." : "Firma"}
                </button>
                <button
                  type="button"
                  className={styles.btnSummary}
                  onClick={handleGoToRiepilogo}
                >
                  Riepilogo
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

      {/* Modal Stampa Preventivo */}
      {showPrintModal && printQuotation && (
        <div
          className="accOverlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            (setShowPrintModal(false), setPrintQuotation(null))
          }
        >
          <div className="accModal" onClick={(e) => e.stopPropagation()}>
            {/* AREA CHE SI STAMPA */}
            <div className="accSheet">
              <div className="accHeaderPro">
                <div className="accLogoSection">
                  <div className="accLogo">
                    <img src={logoUrl} alt="Logo" className="accLogoImage" />
                  </div>
                  <div className="accCompanyTagline">ASSISTENZA TECNICA</div>

                  <div className="accCompanyDetails">
                    <div>{companyName}</div>
                    <div>{companyAddr}</div>
                    <div>Tel. {companyPhone}</div>
                    <div>{companyVat}</div>
                  </div>
                </div>

                <div className="accDocSection">
                  <h1 className="accDocTitle">Preventivo di riparazione</h1>
                  <div className="accDocInfo">
                    <div>
                      <strong>Gestita da:</strong>{" "}
                      {selectedOperator
                        ? `${selectedOperator.firstName} ${selectedOperator.lastName}`.trim()
                        : userName}
                    </div>
                    <div>
                      <strong>Numero Preventivo:</strong>{" "}
                      {printQuotation?.quotationCode || ""}
                    </div>
                    <div>
                      <strong>Stato:</strong>{" "}
                      {printQuotation?.quotationStatus || ""}
                    </div>
                    <div>
                      <strong>Data:</strong>{" "}
                      {new Date(
                        printQuotation?.createdAt ||
                          formData.dataOraRilevazione
                      ).toLocaleDateString("it-IT")}{" "}
                      {new Date(
                        printQuotation?.createdAt ||
                          formData.dataOraRilevazione
                      ).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <hr className="accDivider" />
              <div className="accInfoGrid">
                <div className="accInfoSection">
                  <div className="accSectionTitle">
                    INFORMAZIONI DEL CLIENTE
                  </div>
                  <div className="accInfoRows">
                    <div className="accInfoRow">
                      <span className="accLabel">Cliente:</span>
                      <span className="accValue">
                        {printQuotation.customer?.name || "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Telefono:</span>
                      <span className="accValue">
                        {printQuotation.customer?.phone || "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Email:</span>
                      <span className="accValue">
                        {printQuotation.customer?.email || "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Indirizzo:</span>
                      <span className="accValue">
                        {[
                          printQuotation.customer?.address,
                          printQuotation.customer?.postalCode,
                          printQuotation.customer?.city,
                          printQuotation.customer?.province,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Non specificato"}
                      </span>
                    </div>
                    {printQuotation.customer?.fiscalCode && (
                      <div className="accInfoRow">
                        <span className="accLabel">Codice Fiscale:</span>
                        <span className="accValue">
                          {printQuotation.customer.fiscalCode}
                        </span>
                      </div>
                    )}
                    {printQuotation.customer?.vatNumber && (
                      <div className="accInfoRow">
                        <span className="accLabel">P.IVA:</span>
                        <span className="accValue">
                          {printQuotation.customer.vatNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="accInfoSection">
                  <div className="accSectionTitle">DATI DEL DISPOSITIVO</div>
                  <div className="accInfoRows">
                    <div className="accInfoRow">
                      <span className="accLabel">Marca e Modello:</span>
                      <span className="accValue">
                        {printQuotation.device?.brand}{" "}
                        {printQuotation.device?.model}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Numero Seriale:</span>
                      <span className="accValue">
                        {printQuotation.device?.serialNumber ||
                          "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Tipologia:</span>
                      <span className="accValue">
                        {printQuotation.device?.deviceType || "Non specificato"}
                      </span>
                    </div>
                    {printQuotation.technicianName && (
                      <div className="accInfoRow">
                        <span className="accLabel">Tecnico Assegnato:</span>
                        <span className="accValue">
                          {printQuotation.technicianName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="accProblemSection">
                <div className="accSectionTitle">DESCRIZIONE DEL PROBLEMA</div>
                <div className="accProblemText">
                  {printQuotation.problemDescription ||
                    "Nessuna descrizione fornita"}
                </div>
                {printQuotation.componentIssue && (
                  <div className="accNotesText">
                    <strong>Componente:</strong> {printQuotation.componentIssue}
                  </div>
                )}
              </div>

              <div className="accTableSection">
                <div className="accSectionTitle">PREVENTIVO</div>
                <table className="accTable">
                  <thead>
                    <tr>
                      <th className="accTableHeader">Descrizione Intervento</th>
                      <th
                        className="accTableHeader"
                        style={{ width: "80px", textAlign: "center" }}
                      >
                        Q.ta
                      </th>
                      <th
                        className="accTableHeader"
                        style={{ width: "120px", textAlign: "right" }}
                      >
                        Importo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="accTableCell">
                        {printQuotation.problemDescription ||
                          "Diagnosi e preventivo riparazione"}
                      </td>
                      <td
                        className="accTableCell"
                        style={{ textAlign: "center" }}
                      >
                        1
                      </td>
                      <td
                        className="accTableCell"
                        style={{ textAlign: "right" }}
                      >
                        € {formatCurrency(printQuotation.estimatedPrice || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="accTableCell" colSpan={2}>
                        <strong>TOTALE</strong>
                      </td>
                      <td
                        className="accTableCell"
                        style={{ textAlign: "right" }}
                      >
                        <strong>
                          € {formatCurrency(printQuotation.estimatedPrice || 0)}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="accPrivacySection">
                <div className="accPrivacyTitle">
                  AUTORIZZAZIONE DEL SERVIZIO DI ASSISTENZA
                </div>
                <div className="accPrivacyText">
                  <p>
                    Accetto che i Termini e condizioni di riparazione riportati
                    sul retro di questa pagina verranno applicati al servizio di
                    assistenza per il prodotto sopra indicato, che, poiche
                    l'espletamento del servizio di assistenza puo comportare
                    l'accidentale perdita dei dati, sara responsabilita
                    esclusiva mia quella di backed archiviare i dati per
                    recuperarli in caso di necessita e che quindi CLINICA IPHONE
                    non e responsabile dell'eventuale perdita o danneggiamento
                    dei dati archiviati sul prodotto che i componenti potranno
                    essere riparati o sostituiti con componenti nuovi o
                    ricondizionati e che gli eventuali componenti difettosi
                    rimossi dal prodotto non potranno essere ritirati o
                    recuperati dal Cliente.
                  </p>
                  <p>
                    Ai sensi ed in conformita degli artt. 13 Dlgs 196/03 e 14
                    del GDPR regolamento UE 2016/679, per il trattamento dei
                    dati personali, i dati raccolti con la presente scheda sono
                    destinati ad essere archiviati (sia manualmente su supporti
                    cartacei sia mediante l'utilizzo di moderni sistemi
                    informatici su supporti magnetici) nel pieno rispetto dei
                    dettami normativi vigenti e potranno essere oggetto di
                    trattamento solo ed esclusivamente da parte di soggetti
                    appositamente nominati incaricati ai sensi del citato
                    Decreto legislativo. I dati medesimi saranno utilizzati
                    unicamente per gli scopi indicati nella presente scheda e
                    non saranno utilizzati per ulteriori comunicazioni o per usi
                    diversi dal trattamento della "riparazione".
                  </p>
                </div>

                <div className="accConsentSection">
                  <div className="accConsentTitle">COPIA DI ASSISTENZA</div>
                  <div className="accSignatureArea">
                    <div className="accSignatureBox">
                      <div className="accSignatureLabel">
                        Firma per accettazione
                      </div>
                      <div
                        className="accSignatureLine"
                        onClick={openSignatureModal}
                        style={{
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {signatureData ? (
                          <img
                            src={signatureData}
                            alt="Firma"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              color: "#95a5a6",
                              fontSize: "0.85rem",
                              textAlign: "center",
                              width: "100%",
                            }}
                          >
                            Clicca qui per firmare
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="accDateBox">
                      <div className="accDateLabel">
                        Data: {new Date().toLocaleDateString("it-IT")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="accFooter">
                <div className="accFooterText">
                  Documento generato automaticamente dal sistema di gestione
                  preventivi - {companyName}
                </div>
              </div>
            </div>

            <div className="accActions">
              <button
                className="accBtnSecondary"
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintQuotation(null);
                }}
              >
                Chiudi
              </button>
              <button
                className="accBtnPrimary"
                onClick={handlePrintQuotationDocument}
              >
                Stampa Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Firma Preventivo */}
      {showSignatureQrModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowSignatureQrModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h4>Firma da Tablet</h4>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowSignatureQrModal(false)}
              >
                x
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.qrContent}>
                <div className={styles.qrBox}>
                  {signatureAccessUrl ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        signatureAccessUrl
                      )}`}
                      alt="QR firma preventivo"
                      className={styles.qrImage}
                    />
                  ) : (
                    <div className={styles.qrPlaceholder}>QR non disponibile</div>
                  )}
                </div>
                <div className={styles.qrInfo}>
                  <div className={styles.qrTitle}>
                    Scansiona il QR con il tablet
                  </div>
                  <div className={styles.qrText}>
                    Apri la pagina di firma esterna per il preventivo.
                  </div>
                  <div className={styles.qrLink}>
                    {signatureAccessUrl || "Link non disponibile"}
                  </div>
                  {accessKeyError && (
                    <div className={styles.qrError}>{accessKeyError}</div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowSignatureQrModal(false)}
              >
                Chiudi
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleCopySignatureLink}
                disabled={!signatureAccessUrl}
              >
                Copia Link
              </button>
              {signatureAccessUrl && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => window.open(signatureAccessUrl, "_blank")}
                >
                  Apri Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Modal firma digitale */}
      {showSignatureModal && (
        <div
          className={styles.signatureModalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSignatureModal(false);
            }
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
          >
            <div className={styles.modalHeader}>
              <h4>Apponi la tua firma</h4>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowSignatureModal(false)}
              >
                x
              </button>
            </div>

            <div className={styles.modalBody}>
              <div
                style={{
                  padding: "12px 16px",
                  background: "#e7f3ff",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "0.9rem",
                  color: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>Nota:</span>
                <span>
                  Firma nell'area sottostante utilizzando il mouse o il touch
                  screen
                </span>
              </div>

              <div
                style={{
                  border: "2px solid #333",
                  borderRadius: "8px",
                  background: "white",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <canvas
                  ref={signatureCanvasRef}
                  width={600}
                  height={250}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    cursor: "crosshair",
                    touchAction: "none",
                  }}
                />

                {!isDrawing && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      color: "#ccc",
                      fontSize: "1.2rem",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    Firma qui
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={clearSignature}
              >
                Cancella
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={saveSignature}
              >
                Salva Firma
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
