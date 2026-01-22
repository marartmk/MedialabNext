import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from "./styles.module.css";
import BottomBar from "../../components/BottomBar";
import logoUrl from "../../assets/logo-black-white.jpg";
import { useSearchParams } from "react-router-dom";

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

interface DeviceInventoryItem {
  id: number;
  code: string;
  deviceType: "smartphone" | "tablet";
  brand: string;
  model: string;
  imei: string;
  esn?: string;
  color: string;
  deviceCondition: "new" | "used" | "refurbished";
  isCourtesyDevice: boolean;
  deviceStatus: "available" | "loaned" | "sold" | "unavailable";
  supplierId: string;
  purchasePrice: number;
  sellingPrice: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

const Accettazione: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  // Funzione per ottenere i parametri di query
  // ✅ USA QUESTO
  const [searchParams] = useSearchParams();
  const noteIdFromQuery = searchParams.get("noteId");
  const bookingIdFromQuery = searchParams.get("bookingId");
  const quotationIdFromQuery = searchParams.get("quotationId");

  // 🆕 Stato per sapere se stiamo caricando i dati da una nota
  const [isLoadingFromNote, setIsLoadingFromNote] = useState(false);

  // 🆕 Stato per sapere se stiamo caricando i dati da un booking
  const [isLoadingFromBooking, setIsLoadingFromBooking] = useState(false);
  const [isLoadingFromQuotation, setIsLoadingFromQuotation] = useState(false);

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

  // Stati per la ricerca telefono di cortesia
  const [courtesyPhoneSearchQuery, setCourtesyPhoneSearchQuery] = useState("");
  const [courtesyPhoneSearchResults, setCourtesyPhoneSearchResults] = useState<
    DeviceInventoryItem[]
  >([]);
  const [showCourtesyPhoneDropdown, setShowCourtesyPhoneDropdown] =
    useState(false);
  const [courtesyPhoneLoading, setCourtesyPhoneLoading] = useState(false);
  const [selectedCourtesyPhone, setSelectedCourtesyPhone] =
    useState<DeviceInventoryItem | null>(null);
  const courtesyPhoneSearchInputRef = useRef<HTMLInputElement>(null);
  const courtesyPhoneDropdownRef = useRef<HTMLDivElement>(null);
  const courtesyPhoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // 🆕 Stato per il modal telefoni di cortesia
  const [showCourtesyPhoneModal, setShowCourtesyPhoneModal] = useState(false);
  const [courtesyPhonesList, setCourtesyPhonesList] = useState<
    DeviceInventoryItem[]
  >([]);
  const [loadingCourtesyList, setLoadingCourtesyList] = useState(false);

  // Stati per la firma digitale
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignatureQrModal, setShowSignatureQrModal] = useState(false);
  const [signatureAccessKey, setSignatureAccessKey] = useState<string | null>(
    null,
  );
  const [signatureAccessUrl, setSignatureAccessUrl] = useState<string | null>(
    null,
  );
  const [isCreatingAccessKey, setIsCreatingAccessKey] = useState(false);
  const [accessKeyError, setAccessKeyError] = useState<string | null>(null);

  console.log("signatureAccessKey",signatureAccessKey)

  const API_URL = import.meta.env.VITE_API_URL;

  // Tipo per i dati della riparazione (per la stampa)
  interface RepairData {
    repairId?: number;
    repairGuid?: string;
    repairCode?: string;
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
    repairStatus?: string;
    faultDeclared?: string;
    notes?: string;
  }

  // Stati per il modal di stampa
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printRepair, setPrintRepair] = useState<RepairData | null>(null);

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

  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null
  );
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
  // Stati per la diagnostica - LISTA COMPLETA 1:1 CON IL BACKEND
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticItem[]>([
    // 1. Telefono Spento
    {
      id: "telefono-spento",
      icon: "📴",
      label: "Telefono spento",
      active: true,
    },

    // 2. Vetro Rotto
    { id: "vetro-rotto", icon: "🔨", label: "Vetro rotto", active: true },

    // 3. Touchscreen
    { id: "touchscreen", icon: "👆", label: "Touchscreen", active: true },

    // 4. LCD
    { id: "lcd", icon: "📱", label: "LCD", active: true },

    // 5. Frame Scollato
    {
      id: "frame-scollato",
      icon: "🔲",
      label: "Frame scollato",
      active: true,
    },

    // 6. Batteria
    { id: "batteria", icon: "🔋", label: "Batteria", active: true },

    // 7. Dock di Ricarica
    {
      id: "dock-ricarica",
      icon: "🔌",
      label: "Dock di ricarica",
      active: true,
    },

    // 8. Back Cover
    { id: "back-cover", icon: "📲", label: "Back cover", active: true },

    // 9. Telaio
    { id: "telaio", icon: "🔧", label: "Telaio", active: true },

    // 10. Tasti Volume/Muto
    {
      id: "tasti-volume-muto",
      icon: "🔊",
      label: "Tasti volume/muto",
      active: true,
    },

    // 11. Tasto Standby/Power
    {
      id: "tasto-standby-power",
      icon: "⻏",
      label: "Tasto standby/power",
      active: true,
    },

    // 12. Sensore di Prossimità
    {
      id: "sensore-prossimita",
      icon: "📡",
      label: "Sensore di prossimità",
      active: true,
    },

    // 13. Microfono Chiamate
    {
      id: "microfono-chiamate",
      icon: "🎤",
      label: "Microfono chiamate",
      active: true,
    },

    // 14. Microfono Ambientale
    {
      id: "microfono-ambientale",
      icon: "🎙️",
      label: "Microfono ambientale",
      active: true,
    },

    // 15. Altoparlante Chiamata
    {
      id: "altoparlante-chiamata",
      icon: "🔉",
      label: "Altoparlante chiamata",
      active: true,
    },

    // 16. Speaker/Buzzer
    { id: "speaker-buzzer", icon: "🔔", label: "Speaker/buzzer", active: true },

    // 17. Vetro Fotocamera Posteriore
    {
      id: "vetro-fotocamera-posteriore",
      icon: "📸",
      label: "Vetro fotocamera posteriore",
      active: true,
    },

    // 18. Fotocamera Posteriore
    {
      id: "fotocamera-posteriore",
      icon: "📷",
      label: "Fotocamera posteriore",
      active: true,
    },

    // 19. Fotocamera Anteriore
    {
      id: "fotocamera-anteriore",
      icon: "🤳",
      label: "Fotocamera anteriore",
      active: true,
    },

    // 20. Tasto Home
    { id: "tasto-home", icon: "🏠", label: "Tasto home", active: true },

    // 21. Touch ID
    { id: "touch-id", icon: "👆", label: "Touch ID", active: true },

    // 22. Face ID
    { id: "face-id", icon: "😊", label: "Face ID", active: true },

    // 23. Wi-Fi
    { id: "wifi", icon: "📶", label: "Wi-Fi", active: true },

    // 24. Rete
    { id: "rete", icon: "📡", label: "Rete cellulare", active: true },

    // 25. Chiamata
    { id: "chiamata", icon: "📞", label: "Chiamata", active: true },

    // 26. Scheda Madre
    { id: "scheda-madre", icon: "💻", label: "Scheda madre", active: true },

    // 27. Vetro Posteriore
    {
      id: "vetro-posteriore",
      icon: "📳",
      label: "Vetro posteriore",
      active: true,
    },
  ]);

  // Sotto agli state, dentro il componente Accettazione:
  const isPhoneOff = !(
    diagnosticItems.find((x) => x.id === "telefono-spento")?.active ?? false
  );

  const [isRepairCreated, setIsRepairCreated] = useState(false);
  const [repairGuid, setRepairGuid] = useState<string | null>(null); // 🆕 Usa GUID

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

      // 🆕 Dropdown telefono di cortesia
      if (
        courtesyPhoneDropdownRef.current &&
        !courtesyPhoneDropdownRef.current.contains(event.target as Node) &&
        courtesyPhoneSearchInputRef.current &&
        !courtesyPhoneSearchInputRef.current.contains(event.target as Node)
      ) {
        setShowCourtesyPhoneDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🆕 useEffect per caricare i dati della nota quando arriva il noteId
  useEffect(() => {
    if (noteIdFromQuery && !isLoadingFromNote) {
      console.log("📝 Caricamento nota con GUID:", noteIdFromQuery);
      loadNoteDataForRepair(noteIdFromQuery);
    }
  }, [noteIdFromQuery]);

  // 🆕 useEffect per caricare i dati del booking quando arriva il bookingId
  useEffect(() => {
    if (bookingIdFromQuery && !isLoadingFromBooking) {
      console.log("� Caricamento booking con ID:", bookingIdFromQuery);
      loadBookingDataForRepair(bookingIdFromQuery);
    }
  }, [bookingIdFromQuery]);

  useEffect(() => {
    if (quotationIdFromQuery && !isLoadingFromQuotation) {
      console.log("Caricamento preventivo con ID:", quotationIdFromQuery);
      loadQuotationDataForRepair(quotationIdFromQuery);
    }
  }, [quotationIdFromQuery]);

  // Funzioni per la gestione della firma digitale
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

    // Converti il canvas in base64
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureData(dataUrl);
    setShowSignatureModal(false);

    alert("✅ Firma acquisita con successo!");
  };

  const openSignatureModal = () => {
    setShowSignatureModal(true);

    // Inizializza il canvas dopo che il modal è stato renderizzato
    setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Imposta lo sfondo bianco
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 100);
  };

  const handleOpenSignatureQr = async () => {
    if (!repairGuid) {
      alert("Salva prima l'accettazione per poter firmare.");
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
          serviceId: repairGuid,
          areaId: "9b40e7a0-9b87-4c12-9d9c-9f5208f3f3f6",
          areaName: "Accettazione",
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

      const accessUrl = `${window.location.origin}/firma-accettazione-ext?accessKey=${encodeURIComponent(
        accessKey,
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
        "Errore nella creazione della chiave di accesso.\n" + message,
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

  // Funzione per la ricerca telefono di cortesia con debouncing
  const handleCourtesyPhoneSearchChange = (value: string) => {
    setCourtesyPhoneSearchQuery(value);

    if (courtesyPhoneDebounceRef.current) {
      clearTimeout(courtesyPhoneDebounceRef.current);
    }

    if (!value.trim()) {
      setShowCourtesyPhoneDropdown(false);
      setCourtesyPhoneSearchResults([]);
      return;
    }

    courtesyPhoneDebounceRef.current = setTimeout(() => {
      performCourtesyPhoneSearch(value);
    }, 300);
  };

  // 🆕 Funzione per eseguire la ricerca telefono di cortesia (con filtro lato client)
  const performCourtesyPhoneSearch = async (query: string) => {
    if (!query.trim()) return;

    setCourtesyPhoneLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      // 🎯 Usiamo lo stesso endpoint dedicato
      const url = new URL(`${API_URL}/api/DeviceInventory/courtesy-available`);

      if (multitenantId) {
        url.searchParams.append("multitenantId", multitenantId);
      }

      console.log("🔍 Ricerca telefono cortesia:", query);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const devices: DeviceInventoryItem[] = Array.isArray(data) ? data : [];

        // 🔎 Filtro lato client per la ricerca testuale
        const searchLower = query.toLowerCase().trim();
        const filteredDevices = devices.filter((phone) => {
          const brandMatch = phone.brand?.toLowerCase().includes(searchLower);
          const modelMatch = phone.model?.toLowerCase().includes(searchLower);
          const imeiMatch = phone.imei?.toLowerCase().includes(searchLower);
          const codeMatch = phone.code?.toLowerCase().includes(searchLower);
          const colorMatch = phone.color?.toLowerCase().includes(searchLower);

          return (
            brandMatch || modelMatch || imeiMatch || codeMatch || colorMatch
          );
        });

        console.log(
          `✅ Trovati ${filteredDevices.length} risultati per "${query}"`
        );

        setCourtesyPhoneSearchResults(filteredDevices);
        setShowCourtesyPhoneDropdown(filteredDevices.length > 0);
      } else {
        const errorText = await response.text();
        console.error("❌ Errore ricerca:", response.status, errorText);
        setCourtesyPhoneSearchResults([]);
        setShowCourtesyPhoneDropdown(false);
      }
    } catch (error) {
      console.error(
        "❌ Errore durante la ricerca telefono di cortesia:",
        error
      );
      setCourtesyPhoneSearchResults([]);
      setShowCourtesyPhoneDropdown(false);
    } finally {
      setCourtesyPhoneLoading(false);
    }
  };

  // 🆕 Funzione per caricare tutti i telefoni di cortesia disponibili
  const loadCourtesyPhonesList = async () => {
    setLoadingCourtesyList(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      // 🎯 Costruiamo l'URL con il parametro multitenantId
      const url = new URL(`${API_URL}/api/DeviceInventory/courtesy-available`);

      if (multitenantId) {
        url.searchParams.append("multitenantId", multitenantId);
      }

      console.log("📞 Chiamata API:", url.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Telefoni di cortesia caricati:", data);

        // L'endpoint restituisce direttamente l'array
        setCourtesyPhonesList(Array.isArray(data) ? data : []);

        if (data.length === 0) {
          console.warn("⚠️ Nessun telefono di cortesia disponibile");
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Errore caricamento:", response.status, errorText);

        // Mostra messaggio più specifico in base allo status
        if (response.status === 401) {
          alert("⚠️ Sessione scaduta. Effettua nuovamente il login.");
        } else if (response.status === 403) {
          alert(
            "⚠️ Non hai i permessi per visualizzare i telefoni di cortesia."
          );
        } else {
          alert(
            `⚠️ Errore nel caricamento dei telefoni di cortesia (${response.status})`
          );
        }

        setCourtesyPhonesList([]);
      }
    } catch (error) {
      console.error(
        "❌ Errore durante il caricamento telefoni di cortesia:",
        error
      );

      // Messaggio di errore più user-friendly
      if (error instanceof TypeError && error.message.includes("fetch")) {
        alert(
          "❌ Errore di connessione al server. Verifica la tua connessione internet."
        );
      } else {
        alert(
          "❌ Errore imprevisto durante il caricamento. Riprova più tardi."
        );
      }

      setCourtesyPhonesList([]);
    } finally {
      setLoadingCourtesyList(false);
    }
  };

  // 🆕 Carica la lista quando si apre il modal
  useEffect(() => {
    if (showCourtesyPhoneModal) {
      loadCourtesyPhonesList();
    }
  }, [showCourtesyPhoneModal]);

  // Funzione per selezionare un telefono di cortesia
  const onSelectCourtesyPhone = (phone: DeviceInventoryItem) => {
    setSelectedCourtesyPhone(phone);
    setCourtesyPhoneSearchQuery(
      `${phone.brand} ${phone.model} - ${phone.imei}`
    );
    setShowCourtesyPhoneDropdown(false);

    // Aggiorna il campo courtesyPhone nei dati del dispositivo
    setDispositivoData({
      ...dispositivoData,
      courtesyPhone: phone.code, // Salviamo il codice del dispositivo
    });
  };

  // Funzione per cancellare la selezione telefono di cortesia
  const clearCourtesyPhoneSelection = () => {
    setSelectedCourtesyPhone(null);
    setCourtesyPhoneSearchQuery("");
    setDispositivoData({
      ...dispositivoData,
      courtesyPhone: "",
    });
  };

  // 🆕 Funzione per caricare i dati della nota tramite GUID
  const loadNoteDataForRepair = async (noteGuid: string) => {
    setIsLoadingFromNote(true);

    try {
      const token = sessionStorage.getItem("token");

      console.log("🔍 Chiamata API per nota:", noteGuid);

      const response = await fetch(
        `${API_URL}/api/Repair/quick-note/guid/${noteGuid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Errore ${response.status}: impossibile caricare la nota`
        );
      }

      const noteData = await response.json();
      console.log("✅ Dati nota caricati:", noteData);

      // Pre-compila il form con i dati della nota
      await prePopulateFormFromNote(noteData);

      alert(
        "✅ Dati della nota caricati con successo!\n\nControlla i campi pre-compilati."
      );
    } catch (error) {
      console.error("❌ Errore durante il caricamento nota:", error);
      alert(
        "❌ Impossibile caricare i dati della nota.\n\nVerifica che la nota esista."
      );
    } finally {
      setIsLoadingFromNote(false);
    }
  };

  // 🆕 Funzione per caricare i dati della nota tramite GUID
  const loadBookingDataForRepair = async (bookingGuid: string) => {
    setIsLoadingFromBooking(true);

    try {
      const token = sessionStorage.getItem("token");

      console.log("🔍 Chiamata API per booking:", bookingGuid);

      const response = await fetch(
        `${API_URL}/api/Booking/guid/${bookingGuid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Errore ${response.status}: impossibile caricare la nota`
        );
      }

      const bookingData = await response.json();
      console.log("✅ Dati prenotazione caricati:", bookingData);

      // Pre-compila il form con i dati della prenotazione
      await prePopulateFormFromBooking(bookingData);

      alert(
        "✅ Dati della nota caricati con successo!\n\nControlla i campi pre-compilati."
      );
    } catch (error) {
      console.error("❌ Errore durante il caricamento nota:", error);
      alert(
        "❌ Impossibile caricare i dati della nota.\n\nVerifica che la nota esista."
      );
    } finally {
      setIsLoadingFromBooking(false);
    }
  };

  const loadQuotationDataForRepair = async (quotationGuid: string) => {
    setIsLoadingFromQuotation(true);

    try {
      const token = sessionStorage.getItem("token");

      console.log("Chiamata API per preventivo:", quotationGuid);

      const response = await fetch(
        `${API_URL}/api/quotations/guid/${quotationGuid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Errore ${response.status}: impossibile caricare il preventivo`
        );
      }

      const quotationData = await response.json();
      console.log("Dati preventivo caricati:", quotationData);

      await prePopulateFormFromQuotation(quotationData);

      alert(
        "Dati del preventivo caricati con successo!\n\nControlla i campi pre-compilati."
      );
    } catch (error) {
      console.error("Errore durante il caricamento preventivo:", error);
      alert(
        "Impossibile caricare i dati del preventivo.\n\nVerifica che il preventivo esista."
      );
    } finally {
      setIsLoadingFromQuotation(false);
    }
  };

  // 🆕 Funzione per pre-compilare il form con i dati della nota
  interface QuickNoteData {
    customerId?: string;
    cognome?: string;
    nome?: string;
    email?: string;
    telefono?: string;
    cap?: string;
    deviceId?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    deviceType?: string;
    color?: string;
    codiceRiparazione?: string;
    problema?: string;
    prezzoPreventivo?: number;
    [key: string]: unknown;
  }

  // 🆕 Funzione per pre-compilare il form con i dati dell booking
  interface QuickBookingData {
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    deviceType?: string;
    deviceBrand: string;
    deviceModel: string;
    deviceColor: string;
    technicianCode: string;
    technicianName: string;
    componentIssue: string;
    problemDescription: string;
    estimatedPrice: number;
    paymentType: string;
    billingInfo: string;
    bookingStatus: string;
    bookingStatusCode: string;
    notes: string;
    [key: string]: unknown;
  }

  interface QuickQuotationData {
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    deviceType?: string;
    deviceBrand?: string;
    deviceModel?: string;
    componentIssue?: string;
    problemDescription?: string;
    estimatedPrice?: number | string | null;
    finalPrice?: number | string | null;
    price?: number | string | null;
    quotationPrice?: number | string | null;
    paymentType?: string;
    billingInfo?: string;
    [key: string]: unknown;
  }

  const prePopulateFormFromNote = async (noteData: QuickNoteData) => {
    console.log("📝 Pre-compilazione form da nota:", noteData);

    // ==================== CLIENTE ====================
    if (noteData.customerId) {
      // ✅ CASO 1: Ha customerId → carica e seleziona il cliente
      console.log("👤 Caricamento cliente con ID:", noteData.customerId);
      await loadAndSelectCustomer(noteData.customerId);
    } else {
      // ✅ CASO 2: NON ha customerId → inserisci solo come testo
      console.log("👤 Inserimento dati cliente come testo (nessun ID)");

      const fullName = `${noteData.cognome || ""} ${
        noteData.nome || ""
      }`.trim();
      setSearchQuery(fullName);

      setClienteData({
        email: (noteData.email as string) || "",
        nome: (noteData.nome as string) || "",
        cognome: (noteData.cognome as string) || "",
        telefono: (noteData.telefono as string) || "",
        cap: (noteData.cap as string) || "",
      });
    }

    // ==================== DISPOSITIVO ====================
    if (noteData.deviceId) {
      // ✅ CASO 1: Ha deviceId → carica e seleziona il dispositivo
      console.log("📱 Caricamento dispositivo con ID:", noteData.deviceId);
      await loadAndSelectDevice(noteData.deviceId);
    } else {
      // ✅ CASO 2: NON ha deviceId → inserisci solo come testo
      console.log("📱 Inserimento dati dispositivo come testo (nessun ID)");

      const deviceName = `${noteData.brand || ""} ${
        noteData.model || ""
      }`.trim();
      setDeviceSearchQuery(deviceName);

      setDispositivoData({
        serialNumber: (noteData.serialNumber as string) || "",
        brand: (noteData.brand as string) || "",
        model: (noteData.model as string) || "",
        deviceType: (noteData.deviceType as string) || "Mobile",
        color: (noteData.color as string) || "",
        unlockCode: (noteData.codiceRiparazione as string) || "",
        courtesyPhone: "",
      });
    }

    // ==================== RIPARAZIONE ====================
    setRepairData({
      ...repairData,
      faultDeclared: (noteData.problema as string) || "",
      estimatedPrice: (noteData.prezzoPreventivo as number) || 0,
    });

    console.log("✅ Pre-compilazione completata");
  };

  // 🆕 Funzione per pre-compilare il form con i dati del booking
  const prePopulateFormFromBooking = async (bookingData: QuickBookingData) => {
    console.log("📝 Pre-compilazione form da nota:", bookingData);

    // ==================== CLIENTE ====================
    if (bookingData.customerId) {
      // ✅ CASO 1: Ha customerId → carica e seleziona il cliente
      console.log("👤 Caricamento cliente con ID:", bookingData.customerId);
      await loadAndSelectCustomer(bookingData.customerId);
    } else {
      // ✅ CASO 2: NON ha customerId → inserisci solo come testo
      console.log("👤 Inserimento dati cliente come testo (nessun ID)");

      const fullName = `${bookingData.customerName || ""} ${
        bookingData.customerSurname || ""
      }`.trim();
      setSearchQuery(fullName);

      setClienteData({
        email: (bookingData.customerEmail as string) || "",
        nome: (bookingData.customerName as string) || "",
        cognome: (bookingData.customerSurname as string) || "",
        telefono: (bookingData.customerPhone as string) || "",
        cap: (bookingData.customerCap as string) || "",
      });
    }

    // ==================== DISPOSITIVO ====================
    if (bookingData.deviceType) {
      // ✅ CASO 1: Ha deviceId → carica e seleziona il dispositivo
      console.log("📱 Caricamento dispositivo con ID:", bookingData.deviceType);
      //await loadAndSelectDevice(bookingData.deviceId);
      setDispositivoData({
        serialNumber: String(bookingData.serialNumber ?? ""),
        brand: bookingData.deviceBrand || "",
        model: bookingData.deviceModel || "",
        deviceType: bookingData.deviceType || "Mobile",
        color: bookingData.deviceColor || "",
        unlockCode: String(bookingData.codiceRiparazione ?? ""),
        courtesyPhone: "",
      });    
    } else {
      // ✅ CASO 2: NON ha deviceId → inserisci solo come testo
      console.log("📱 Inserimento dati dispositivo come testo (nessun ID)");

      const deviceName = `${bookingData.brand || ""} ${
        bookingData.model || ""
      }`.trim();
      setDeviceSearchQuery(deviceName);

      setDispositivoData({
        serialNumber: (bookingData.serialNumber as string) || "",
        brand: (bookingData.deviceBrand as string) || "",
        model: (bookingData.deviceModel as string) || "",
        deviceType: (bookingData.deviceType as string) || "Mobile",
        color: (bookingData.deviceColor as string) || "",
        unlockCode: (bookingData.codiceRiparazione as string) || "",
        courtesyPhone: "",
      });
    }

    // ==================== RIPARAZIONE ====================
    setRepairData({
      ...repairData,
      faultDeclared: (bookingData.problema as string) || "",
      estimatedPrice: (bookingData.prezzoPreventivo as number) || 0,
    });

    console.log("✅ Pre-compilazione completata");
  };

  // 🆕 Carica e seleziona automaticamente un cliente esistente
  const prePopulateFormFromQuotation = async (
    quotationData: QuickQuotationData
  ) => {
    console.log("Pre-compilazione form da preventivo:", quotationData);

    // ==================== CLIENTE ====================
    if (quotationData.customerId) {
      console.log("Caricamento cliente con ID:", quotationData.customerId);
      await loadAndSelectCustomer(quotationData.customerId);
    } else {
      console.log("Inserimento dati cliente come testo (nessun ID)");

      const fullName = `${quotationData.customerName || ""}`.trim();
      setSearchQuery(fullName);

      const [nome, ...cognomeParts] = fullName.split(" ").filter(Boolean);
      const cognome = cognomeParts.join(" ");

      setClienteData({
        email: (quotationData.customerEmail as string) || "",
        nome: nome || "",
        cognome: cognome || "",
        telefono: (quotationData.customerPhone as string) || "",
        cap: "",
      });
    }

    // ==================== DISPOSITIVO ====================
    const deviceName = `${quotationData.deviceBrand || ""} ${
      quotationData.deviceModel || ""
    }`.trim();
    setDeviceSearchQuery(deviceName);

    setDispositivoData({
      serialNumber: "",
      brand: (quotationData.deviceBrand as string) || "",
      model: (quotationData.deviceModel as string) || "",
      deviceType: (quotationData.deviceType as string) || "Mobile",
      color: "",
      unlockCode: "",
      courtesyPhone: "",
    });

    // ==================== RIPARAZIONE ====================
    const normalizePrice = (value: unknown) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = Number(value.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const rawPrice =
      quotationData.estimatedPrice ??
      quotationData.finalPrice ??
      quotationData.price ??
      quotationData.quotationPrice ??
      0;

    setRepairData({
      ...repairData,
      faultDeclared:
        (quotationData.problemDescription as string) ||
        (quotationData.componentIssue as string) ||
        "",
      estimatedPrice: normalizePrice(rawPrice),
      paymentType: (quotationData.paymentType as string) || "",
      billingInfo: (quotationData.billingInfo as string) || "",
    });

    console.log("Pre-compilazione completata");
  };

  const loadAndSelectCustomer = async (customerId: string) => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/customer/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const customerData = await response.json();
        console.log("✅ Cliente caricato:", customerData);
        onSelectCustomer(customerData);
      } else {
        console.error("❌ Cliente non trovato, inserisco come testo");
      }
    } catch (error) {
      console.error("❌ Errore durante il caricamento cliente:", error);
    }
  };

  // 🆕 Carica e seleziona automaticamente un dispositivo esistente
  const loadAndSelectDevice = async (deviceId: string) => {
    try {
      const token = sessionStorage.getItem("token");
      //const multitenantId = sessionStorage.getItem("IdCompany");

      const response = await fetch(
        `${API_URL}/api/device/deviceid/${deviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const deviceData = await response.json();
        console.log("✅ Dispositivo caricato:", deviceData);
        onSelectDevice(deviceData);
      } else {
        console.error("❌ Dispositivo non trovato, inserisco come testo");
      }
    } catch (error) {
      console.error("❌ Errore durante il caricamento dispositivo:", error);
    }
  };

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const loadOperators = async () => {
    try {
      // Per ora usiamo dati fake, poi sostituiremo con la vera API
      // const fakeOperators = [
      //   {
      //     id: "1",
      //     firstName: "Mario",
      //     lastName: "Rossi",
      //     codiceDipendente: "TEC001",
      //     email: "mario.rossi@medialab.it",
      //     phoneNumber: "+39 333 1234567",
      //   },
      //   {
      //     id: "2",
      //     firstName: "Luigi",
      //     lastName: "Verdi",
      //     codiceDipendente: "TEC002",
      //     email: "luigi.verdi@medialab.it",
      //     phoneNumber: "+39 333 2345678",
      //   },
      //   {
      //     id: "3",
      //     firstName: "Giuseppe",
      //     lastName: "Bianchi",
      //     codiceDipendente: "TEC003",
      //     email: "giuseppe.bianchi@medialab.it",
      //     phoneNumber: "+39 333 3456789",
      //   },
      // ];

      // // Simula un piccolo delay come se fosse una vera chiamata API
      // await new Promise((resolve) => setTimeout(resolve, 300));

      // setOperators(fakeOperators);
      // console.log("Operatori fake caricati:", fakeOperators);

      // Questo sarà il codice vero quando avremo l'API:
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

  // Funzione per eseguire la ricerca dispositivo
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
  // Master toggle su "Telefono spento"
  const toggleDiagnosticItem = (id: string) => {
    setDiagnosticItems((prevItems) => {
      // Se clicco "Telefono spento", imposto TUTTI allo stesso stato del nuovo valore di "Telefono spento"
      if (id === "telefono-spento") {
        const current = prevItems.find((x) => x.id === id);
        const nextValue = !(current?.active ?? false); // valore dopo il toggle
        return prevItems.map((item) => ({ ...item, active: nextValue }));
      }

      // Per tutte le altre icone, continua il comportamento normale (toggle singolo)
      return prevItems.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      );
    });
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
      multitenantId: sessionStorage.getItem("IdCompany") || "",
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

    // if (repairData.estimatedPrice <= 0) {
    //   errors.push("Inserire un prezzo preventivo valido");
    // }
    
    if (repairData.estimatedPrice < 0) {
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

  // Costruisce SOLO i campi che finiscono in dbo.IncomingTests (camelCase del DTO)
  // Costruisce il DTO per IncomingTest mappato 1:1 con il backend
  const buildIncomingTestDto = (items: { id: string; active: boolean }[]) => {
    const on = (id: string) => items.find((x) => x.id === id)?.active ?? false;

    return {
      telefonoSpento: on("telefono-spento"),
      vetroRotto: on("vetro-rotto"),
      touchscreen: on("touchscreen"),
      lcd: on("lcd"),
      frameScollato: on("frame-scollato"),
      batteria: on("batteria"),
      dockDiRicarica: on("dock-ricarica"),
      backCover: on("back-cover"),
      telaio: on("telaio"),
      tastiVolumeMuto: on("tasti-volume-muto"),
      tastoStandbyPower: on("tasto-standby-power"),
      sensoreDiProssimita: on("sensore-prossimita"),
      microfonoChiamate: on("microfono-chiamate"),
      microfonoAmbientale: on("microfono-ambientale"),
      altoparlanteChiamata: on("altoparlante-chiamata"),
      speakerBuzzer: on("speaker-buzzer"),
      vetroFotocameraPosteriore: on("vetro-fotocamera-posteriore"),
      fotocameraPosteriore: on("fotocamera-posteriore"),
      fotocameraAnteriore: on("fotocamera-anteriore"),
      tastoHome: on("tasto-home"),
      touchId: on("touch-id"),
      faceId: on("face-id"),
      wiFi: on("wifi"),
      rete: on("rete"),
      chiamata: on("chiamata"),
      schedaMadre: on("scheda-madre"),
      vetroPosteriore: on("vetro-posteriore"),
    };
  };

  const upsertIncomingTest = async (
    repairGuid: string,
    items: { id: string; active: boolean }[]
  ) => {
    const dto = buildIncomingTestDto(items);
    console.log("DTO diagnostica ingresso:", dto);

    const res = await fetch(
      `${API_URL}/api/repair/${repairGuid}/incoming-test`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(dto),
      }
    );

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Salvataggio diagnostica fallito (${res.status}) ${t}`);
    }
  };

  const prepareRepairPayload = () => {
    const multitenantId = sessionStorage.getItem("IdCompany");

    // newCustomer (solo se non selezionato cliente esistente)
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

    // newDevice (solo se non selezionato device esistente)
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

    // dati riparazione
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
      courtesyPhone:
        selectedCourtesyPhone?.code || dispositivoData.courtesyPhone || null, // 🆕 Aggiungi telefono cortesia
      courtesyPhoneId: selectedCourtesyPhone?.id || null, // 🆕 ID per tracking
    };

    return {
      customerId: selectedCustomer?.id || null,
      newCustomer: customerPayload,
      deviceId: selectedDevice?.id || null,
      newDevice: devicePayload,
      repairData: repairPayload,
      notes: repairData.billingInfo || null,
      multitenantId: multitenantId,
    };
  };

  // Funzione principale per creare la riparazione
  const handleCreateRepair = async (
    actionType: "email" | "print" | "label" | "lab"
  ) => {
    if (isRepairCreated) {
      alert(
        "La riparazione è già stata creata. Usa il pulsante Aggiorna per modificare la scheda."
      );
      return;
    }

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
      const response = await fetch(`${API_URL}/api/repair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Riparazione creata:", result);

        // 1) salva la diagnostica di ingresso con il nuovo endpoint
        try {
          await upsertIncomingTest(result.repairGuid, diagnosticItems);
        } catch (e: unknown) {
          console.error(e);
          const message = e instanceof Error ? e.message : String(e);
          alert(
            "⚠️ Riparazione creata, ma diagnostica NON salvata.\n" + message
          );
        }

        // 2) UX di conferma
        alert(
          `Riparazione creata con successo!\n\nCodice: ${result.repairCode}\nID: ${result.repairId}\nStato: ${result.status}`
        );

        // 3) azione post-creazione (stampa, email, ecc.)
        await handlePostCreateAction(actionType, result);

        // 4) stato locale
        setIsRepairCreated(true);
        setRepairGuid(result.repairGuid);
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
  // Define a type for the repair result
  interface RepairResult {
    repairId: number;
    repairGuid: string;
    repairCode: string;
    status: string;
    // Add other fields as needed
  }

  const handlePostCreateAction = async (
    actionType: "email" | "print" | "label" | "lab",
    repairResult: RepairResult
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

    console.log("Payload per la creazione del cliente:", JSON.stringify(payload, null, 2));
    
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
      multitenantId: sessionStorage.getItem("IdCompany") || null,
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

  // Funzione per aggiornare la riparazione già creata
  const handleUpdateRepair = async () => {
    if (!repairGuid) {
      // 🔧 Controlla il GUID invece dell'ID
      alert("Nessuna riparazione da aggiornare.");
      return;
    }

    const validation = validateForm();

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      alert("Errori di validazione:\n\n" + validation.errors.join("\n"));
      return;
    }

    setIsCreatingRepair(true);

    try {
      const payload = prepareUpdateRepairPayload(); // 🔧 Usa payload specifico per update
      console.log("Payload aggiornamento:", payload);

      const response = await fetch(
        `${API_URL}/api/repair/${repairGuid}`, // 🔧 FIX: Usa il GUID
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        try {
          await upsertIncomingTest(repairGuid, diagnosticItems);
          alert("Riparazione e diagnostica aggiornate con successo.");
        } catch (e: unknown) {
          console.error(e);
          const message = e instanceof Error ? e.message : String(e);
          alert(
            "Riparazione aggiornata ma diagnostica NON salvata.\n" + message
          );
        }
      } else {
        const errorText = await response.text();
        console.error("Errore aggiornamento API:", errorText);
        alert("Errore durante aggiornamento:\n" + errorText);
      }
    } catch (error) {
      console.error("Errore durante aggiornamento:", error);
      alert("Errore durante aggiornamento riparazione. Riprova.");
    } finally {
      setIsCreatingRepair(false);
    }
  };

  // Funzione per la stampa (da definire)
  const handleStampaAccettazione = () => {
    if (repairData) {
      setPrintRepair(repairData);
      setShowPrintModal(true);
    }
  };

  // FUNZIONE DI STAMPA CORRETTA
  const handlePrintRepairDocument = async () => {
    try {
      // Aggiungi un piccolo delay per assicurarti che il modal sia completamente renderizzato
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trova l'elemento da stampare
      const printContent = document.querySelector(`.accSheet`);

      if (!printContent) {
        console.error("Elemento da stampare non trovato");
        alert("Errore: impossibile trovare il contenuto da stampare");
        return;
      }

      // Crea una finestra di stampa separata
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (!printWindow) {
        console.error("Impossibile aprire la finestra di stampa");
        alert(
          "Errore: impossibile aprire la finestra di stampa. Verifica che i popup siano consentiti."
        );
        return;
      }

      // Ottieni tutti i CSS della pagina corrente
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

      // Crea il contenuto HTML della finestra di stampa
      const printHTML = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documento di Riparazione - ${
          printRepair?.repairCode || ""
        }</title>
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
        <div class="print-content">
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

      // Scrivi il contenuto nella nuova finestra
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
    } catch (error) {
      console.error("Errore durante la stampa:", error);
      alert("Si è verificato un errore durante la preparazione della stampa.");
    }
  };

  // Payload specifico per l'update (diverso dal create)
  const prepareUpdateRepairPayload = () => {
    const payload = {
      customerId: selectedCustomer?.id || null, // GUID cliente
      deviceId: selectedDevice?.deviceId || null, // GUID device
      repairData: {
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
      },
      notes: repairData.billingInfo || null,
    };

    return payload;
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
                    {/* Campo Telefono di Cortesia - CON ICONA PER MODAL */}
                    {/* Campo Telefono di Cortesia - CON ICONA PER MODAL */}
                    <div className={styles.formGroup}>
                      <label>Telefono di cortesia</label>
                      <div className={styles.searchContainer}>
                        <input
                          ref={courtesyPhoneSearchInputRef}
                          type="text"
                          className={`${styles.formControl} ${styles.searchInput}`}
                          placeholder="Cerca o seleziona telefono di cortesia..."
                          value={courtesyPhoneSearchQuery}
                          onChange={(e) =>
                            handleCourtesyPhoneSearchChange(e.target.value)
                          }
                          onFocus={() => {
                            if (courtesyPhoneSearchResults.length > 0) {
                              setShowCourtesyPhoneDropdown(true);
                            }
                          }}
                          readOnly={selectedCourtesyPhone !== null}
                        />

                        {/* 🆕 ICONA PER APRIRE IL MODAL */}
                        <button
                          type="button"
                          className={styles.addClientButton}
                          onClick={() => setShowCourtesyPhoneModal(true)}
                          title="Visualizza telefoni di cortesia disponibili"
                        >
                          📱
                        </button>

                        {selectedCourtesyPhone && (
                          <button
                            type="button"
                            className={styles.clearButton}
                            onClick={clearCourtesyPhoneSelection}
                            title="Cancella selezione"
                          >
                            ×
                          </button>
                        )}

                        {courtesyPhoneLoading && (
                          <div className={styles.loadingIndicator}>
                            <div className={styles.spinner}></div>
                          </div>
                        )}

                        {/* 🆕🆕🆕 AGGIUNGI QUESTO DROPDOWN QUI 🆕🆕🆕 */}
                        {showCourtesyPhoneDropdown &&
                          courtesyPhoneSearchResults.length > 0 && (
                            <div
                              ref={courtesyPhoneDropdownRef}
                              className={styles.dropdown}
                            >
                              {courtesyPhoneSearchResults.map((phone) => (
                                <div
                                  key={phone.id}
                                  className={styles.dropdownItem}
                                  onClick={() => onSelectCourtesyPhone(phone)}
                                >
                                  <div className={styles.customerInfo}>
                                    <div className={styles.customerName}>
                                      <strong>
                                        {phone.deviceType === "smartphone"
                                          ? "📱"
                                          : "📋"}{" "}
                                        {phone.brand} {phone.model}
                                      </strong>
                                    </div>
                                    <div className={styles.customerDetails}>
                                      <span>IMEI: {phone.imei}</span>
                                      <span> • Codice: {phone.code}</span>
                                    </div>
                                    <div className={styles.customerAddress}>
                                      <span
                                        style={{
                                          background:
                                            phone.deviceCondition === "new"
                                              ? "#d4edda"
                                              : phone.deviceCondition ===
                                                "refurbished"
                                              ? "#d1ecf1"
                                              : "#fff3cd",
                                          padding: "2px 6px",
                                          borderRadius: "3px",
                                          fontSize: "0.8rem",
                                          fontWeight: "600",
                                          marginRight: "8px",
                                        }}
                                      >
                                        {phone.deviceCondition === "new"
                                          ? "Nuovo"
                                          : phone.deviceCondition === "used"
                                          ? "Usato"
                                          : "Rigenerato"}
                                      </span>
                                      {phone.color} • 🤝 CORTESIA
                                      {phone.location &&
                                        ` • 📍 ${phone.location}`}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        {/* 🆕🆕🆕 FINE DROPDOWN 🆕🆕🆕 */}
                      </div>

                      {/* Info dispositivo selezionato */}
                      {selectedCourtesyPhone && (
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "8px",
                            backgroundColor: "#e7f3ff",
                            borderRadius: "4px",
                            fontSize: "0.9em",
                          }}
                        >
                          <strong>✓ Selezionato:</strong>{" "}
                          {selectedCourtesyPhone.brand}{" "}
                          {selectedCourtesyPhone.model}
                          <span style={{ marginLeft: "8px", color: "#666" }}>
                            (Codice: {selectedCourtesyPhone.code})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sezione Diagnostica */}
                <div
                  className={`${styles.formSection} ${styles.diagnosticaSection}`}
                >
                  <h3>Diagnostica di ricezione</h3>
                  <div className={styles.diagnosticaGrid}>
                    {diagnosticItems.map((item) => {
                      const isDisabled =
                        isPhoneOff && item.id !== "telefono-spento";
                      return (
                        <div
                          key={item.id}
                          className={styles.diagnosticaItemWrapper}
                        >
                          <div
                            className={`${styles.diagnosticaItem} ${
                              item.active ? styles.active : styles.inactive
                            } ${isDisabled ? styles.disabled : ""}`}
                            onClick={() => {
                              if (!isDisabled) toggleDiagnosticItem(item.id);
                            }}
                            aria-disabled={isDisabled}
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
                      );
                    })}
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
              {!isRepairCreated ? (
                <>
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
                    {isCreatingRepair
                      ? "Creando..."
                      : "🏷️ Crea/Stampa etichetta"}
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
                </>
              ) : (
                <>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleUpdateRepair}
                  >
                    🔄 Aggiorna Scheda
                  </button>

                  <button
                    className={`${styles.btn} ${styles.btnInfo}`}
                    onClick={handleStampaAccettazione}
                  >
                    🖨️ Stampa Accettazione
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnSignature}`}
                    onClick={handleOpenSignatureQr}
                    disabled={isCreatingAccessKey}
                  >
                    {isCreatingAccessKey ? "Generando..." : "Firma"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <BottomBar />
      </div>


      {/* Modal QR Firma Accettazione */}
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
                      alt="QR firma accettazione"
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
                    Apri la pagina di firma esterna per l'accettazione.
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

      {/* Modal Stampa Accettazione */}
      {showPrintModal && printRepair && (
        <div
          className="accOverlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            (setShowPrintModal(false), setPrintRepair(null))
          }
        >
          <div className="accModal" onClick={(e) => e.stopPropagation()}>
            {/* AREA CHE SI STAMPA */}
            <div className="accSheet">
              {/* Header professionale con logo */}
              <div className="accHeaderPro">
                {/* Colonna sinistra - Dati azienda */}
                <div className="accLogoSection">
                  <div className="accLogo">
                    <img src={logoUrl} alt="Logo" className="accLogoImage" />
                  </div>
                  <div className="accCompanyTagline">ASSISTENZA TECNICA</div>

                  <div className="accCompanyDetails">
                    <div>{companyName}</div>
                    <div>Città - AZIENDA</div>
                    <div>{companyAddr}</div>
                    <div>Tel. {companyPhone}</div>
                    <div>{companyVat}</div>
                  </div>
                </div>

                {/* Colonna destra - Autorizzazione al lavoro */}
                <div className="accDocSection">
                  <h1 className="accDocTitle">Autorizzazione al lavoro</h1>
                  <div className="accDocInfo">
                    <div>
                      <strong>Tipo di riparazione:</strong> Gestita in clinica
                    </div>
                    <div>
                      <strong>Gestita da dipendente:</strong> xxxx
                    </div>
                    <div>
                      <strong>Numero di Riparazione:</strong>{" "}
                      {printRepair?.repairCode}
                    </div>
                    <div>
                      <strong>Data:</strong>{" "}
                      {new Date(
                        printRepair?.createdAt || ""
                      ).toLocaleDateString("it-IT")}{" "}
                      {new Date(
                        printRepair?.createdAt || ""
                      ).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <hr className="accDivider" />
              {/* Dati cliente / dispositivo */}
              <div className="accInfoGrid">
                <div className="accInfoSection">
                  <div className="accSectionTitle">
                    INFORMAZIONI DEL CLIENTE
                  </div>
                  <div className="accInfoRows">
                    <div className="accInfoRow">
                      <span className="accLabel">Cliente:</span>
                      <span className="accValue">
                        {printRepair.customer?.name || "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Telefono:</span>
                      <span className="accValue">
                        {printRepair.customer?.phone || "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Email:</span>
                      <span className="accValue">
                        {printRepair.customer?.email || "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Indirizzo:</span>
                      <span className="accValue">
                        {[
                          printRepair.customer?.address,
                          printRepair.customer?.postalCode,
                          printRepair.customer?.city,
                          printRepair.customer?.province,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Non specificato"}
                      </span>
                    </div>
                    {printRepair.customer?.fiscalCode && (
                      <div className="accInfoRow">
                        <span className="accLabel">Codice Fiscale:</span>
                        <span className="accValue">
                          {printRepair.customer.fiscalCode}
                        </span>
                      </div>
                    )}
                    {printRepair.customer?.vatNumber && (
                      <div className="accInfoRow">
                        <span className="accLabel">P.IVA:</span>
                        <span className="accValue">
                          {printRepair.customer.vatNumber}
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
                        {printRepair.device?.brand} {printRepair.device?.model}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Numero Seriale:</span>
                      <span className="accValue">
                        {printRepair.device?.serialNumber || "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Tipologia:</span>
                      <span className="accValue">
                        {printRepair.device?.deviceType || "Non specificato"}
                      </span>
                    </div>
                    <div className="accInfoRow">
                      <span className="accLabel">Stato:</span>
                      <span className="accValue">
                        {printRepair.repairStatus}
                      </span>
                    </div>
                    {printRepair.technicianName && (
                      <div className="accInfoRow">
                        <span className="accLabel">Tecnico Assegnato:</span>
                        <span className="accValue">
                          {printRepair.technicianName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descrizione problema */}
              <div className="accProblemSection">
                <div className="accSectionTitle">DESCRIZIONE DEL PROBLEMA</div>
                <div className="accProblemText">
                  {printRepair.faultDeclared || "Nessuna descrizione fornita"}
                </div>
                {printRepair.notes && (
                  <div className="accNotesText">
                    <strong>Note aggiuntive:</strong> {printRepair.notes}
                  </div>
                )}
              </div>

              {/* Tabella preventivo */}
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
                        Q.tà
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
                        Diagnosi e preventivo riparazione
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
                        € 0,00
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
                        <strong>€ 0,00</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Clausole privacy */}
              <div className="accPrivacySection">
                <div className="accPrivacyTitle">
                  AUTORIZZAZIONE DEL SERVIZIO DI ASSISTENZA
                </div>
                <div className="accPrivacyText">
                  <p>
                    Accetto che i Termini e condizioni di riparazione riportati
                    sul retro di questa pagina verranno applicati al servizio di
                    assistenza per il prodotto sopra indicato, che, poiché
                    l'espletamento del servizio di assistenza può comportare
                    l'accidentale perdita dei dati, sarà responsabilità
                    esclusiva mia quella di backed archiviare i dati per
                    recuperarli in caso di necessità e che quindi CLINICA IPHONE
                    non è responsabile dell'eventuale perdita o danneggiamento
                    dei dati archiviati sul prodotto che i componenti potranno
                    essere riparati o sostituiti con componenti nuovi o
                    ricondizionati e che gli eventuali componenti difettosi
                    rimossi dal prodotto non potranno essere ritirati o
                    recuperati dal Cliente.
                  </p>
                  <p>
                    Ai sensi ed in conformità degli artt. 13 Dlgs 196/03 e 14
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
                            ✍️ Clicca qui per firmare
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

              {/* Footer */}
              <div className="accFooter">
                <div className="accFooterText">
                  Documento generato automaticamente dal sistema di gestione
                  riparazioni - {companyName}
                </div>
              </div>
            </div>

            {/* Azioni (non stampate) */}
            <div className="accActions">
              <button
                className="accBtnSecondary"
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintRepair(null);
                }}
              >
                ✕ Chiudi
              </button>
              <button
                className="accBtnPrimary"
                onClick={handlePrintRepairDocument}
              >
                🖨️ Stampa Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 MODAL TELEFONI DI CORTESIA */}
      {showCourtesyPhoneModal && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCourtesyPhoneModal(false);
            }
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "900px" }}
          >
            <div className={styles.modalHeader}>
              <h4>📱 Seleziona Telefono di Cortesia</h4>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowCourtesyPhoneModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {loadingCourtesyList ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div
                    className={styles.spinner}
                    style={{ margin: "0 auto 16px" }}
                  ></div>
                  <p>Caricamento telefoni di cortesia...</p>
                </div>
              ) : courtesyPhonesList.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#666",
                  }}
                >
                  <p style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                    📵 Nessun telefono di cortesia disponibile
                  </p>
                  <p style={{ fontSize: "0.9rem" }}>
                    Aggiungi dispositivi di cortesia nel magazzino apparati
                  </p>
                </div>
              ) : (
                <>
                  {/* Header informativo */}
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#e7f3ff",
                      borderRadius: "6px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "1.5rem" }}>🤝</span>
                    <div>
                      <strong style={{ display: "block", marginBottom: "4px" }}>
                        {courtesyPhonesList.length} dispositivi di cortesia
                        disponibili
                      </strong>
                      <span style={{ fontSize: "0.85rem", color: "#666" }}>
                        Clicca su un dispositivo per selezionarlo
                      </span>
                    </div>
                  </div>

                  {/* Griglia dispositivi */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "16px",
                      maxHeight: "60vh",
                      overflowY: "auto",
                      padding: "4px",
                    }}
                  >
                    {courtesyPhonesList.map((phone) => (
                      <div
                        key={phone.id}
                        onClick={() => {
                          onSelectCourtesyPhone(phone);
                          setShowCourtesyPhoneModal(false);
                        }}
                        style={{
                          border: "2px solid #ddd",
                          borderRadius: "10px",
                          padding: "16px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background:
                            selectedCourtesyPhone?.id === phone.id
                              ? "#e7f3ff"
                              : "white",
                          borderColor:
                            selectedCourtesyPhone?.id === phone.id
                              ? "#17a2b8"
                              : "#ddd",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#17a2b8";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(23, 162, 184, 0.2)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCourtesyPhone?.id !== phone.id) {
                            e.currentTarget.style.borderColor = "#ddd";
                          }
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {/* Header card */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "12px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "2rem",
                              background: "#f8f9fa",
                              width: "50px",
                              height: "50px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {phone.deviceType === "smartphone" ? "📱" : "📋"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: "bold",
                                fontSize: "1rem",
                                color: "#333",
                                marginBottom: "4px",
                              }}
                            >
                              {phone.brand} {phone.model}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#17a2b8",
                                fontWeight: "600",
                                background: "#e7f3ff",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                display: "inline-block",
                              }}
                            >
                              🤝 CORTESIA
                            </div>
                          </div>
                        </div>

                        {/* Dettagli */}
                        <div style={{ fontSize: "0.85rem", lineHeight: "1.6" }}>
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{ color: "#666", fontWeight: "500" }}>
                              Codice:
                            </span>{" "}
                            <span style={{ color: "#333", fontWeight: "600" }}>
                              {phone.code}
                            </span>
                          </div>
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{ color: "#666", fontWeight: "500" }}>
                              IMEI:
                            </span>{" "}
                            <span
                              style={{
                                color: "#333",
                                fontFamily: "monospace",
                                fontSize: "0.8rem",
                              }}
                            >
                              {phone.imei}
                            </span>
                          </div>
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{ color: "#666", fontWeight: "500" }}>
                              Colore:
                            </span>{" "}
                            <span style={{ color: "#333" }}>{phone.color}</span>
                          </div>
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{ color: "#666", fontWeight: "500" }}>
                              Condizione:
                            </span>{" "}
                            <span
                              style={{
                                color: "#333",
                                background:
                                  phone.deviceCondition === "new"
                                    ? "#d4edda"
                                    : phone.deviceCondition === "refurbished"
                                    ? "#d1ecf1"
                                    : "#fff3cd",
                                padding: "2px 6px",
                                borderRadius: "3px",
                                fontSize: "0.8rem",
                                fontWeight: "600",
                              }}
                            >
                              {phone.deviceCondition === "new"
                                ? "Nuovo"
                                : phone.deviceCondition === "used"
                                ? "Usato"
                                : "Rigenerato"}
                            </span>
                          </div>
                          {phone.location && (
                            <div>
                              <span
                                style={{ color: "#666", fontWeight: "500" }}
                              >
                                Ubicazione:
                              </span>{" "}
                              <span style={{ color: "#333" }}>
                                {phone.location}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Indicatore selezione */}
                        {selectedCourtesyPhone?.id === phone.id && (
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "8px",
                              background: "#28a745",
                              color: "white",
                              borderRadius: "6px",
                              textAlign: "center",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                            }}
                          >
                            ✓ Selezionato
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowCourtesyPhoneModal(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 MODAL FIRMA DIGITALE */}
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
              <h4>✍️ Apponi la tua firma</h4>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowSignatureModal(false)}
              >
                ×
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
                <span style={{ fontSize: "1.2rem" }}>ℹ️</span>
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

                {/* Watermark quando vuoto */}
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
                🗑️ Cancella
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={saveSignature}
              >
                ✅ Salva Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accettazione;
