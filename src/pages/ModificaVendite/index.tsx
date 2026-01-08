import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from "./styles.module.css";
import BottomBar from "../../components/BottomBar";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import deviceInventoryService, {
  type DeviceInventoryItem,
} from "../../services/deviceInventoryService";

console.log("ModificaVendite loaded", deviceInventoryService);

// Alias per DeviceInventoryItem
type DeviceData = DeviceInventoryItem;

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

// Tipo per i dati della vendita esistente
interface SaleData {
  id: number;
  saleId: string;
  saleCode: string;
  saleType: string;
  deviceId: string | null;
  deviceRegistryId: number | null;
  accessoryId: string | null;
  brand: string;
  model: string;
  serialNumber: string | null;
  imei: string | null;
  customerId: string;
  customerName: string | null;
  companyId: string | null;
  companyName: string | null;
  multitenantId: string;
  salePrice: number;
  originalPrice: number;
  discount: number | null;
  vatRate: number;
  totalAmount: number;
  paymentType: string;
  paymentStatus: string;
  paidAmount: number;
  remainingAmount: number;
  installmentsCount: number | null;
  installmentAmount: number | null;
  saleStatus: string;
  saleStatusCode: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  receiptId: string | null;
  receiptNumber: string | null;
  receiptDate: string | null;
  sellerCode: string;
  sellerName: string;
  notes: string | null;
  includedAccessories: string | null;
  hasWarranty: boolean;
  warrantyMonths: number | null;
  warrantyExpiryDate: string | null;
  createdAt: string;
  saleDate: string;
  deliveryDate: string | null;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  payments: any[];
}

const ModificaVendite: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL;

  // ID della vendita da modificare
  // Può arrivare da:
  // 1. location.state (quando viene dalla pagina Ricerca Vendite)
  // 2. searchParams (quando viene dall'URL diretto)
  const locationState = location.state as {
    saleId?: string;
    id?: number;
  } | null;
  const saleIdFromState =
    locationState?.saleId || locationState?.id?.toString();
  const saleIdFromUrl = searchParams.get("id");
  const saleId = saleIdFromState || saleIdFromUrl;

  // Stati per il caricamento della vendita
  const [loadingSale, setLoadingSale] = useState(true);
  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deviceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [regimeIva, setRegimeIva] = useState<"IVA22" | "ART17" | "ART36">(
    "IVA22"
  );

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

  // Stati per i prezzi e pagamento
  const [prezziData, setPrezziData] = useState({
    prezzoAcquistoIva0: "",
    prezzoAcquistoIva22: "",
    prezzoIva22: "",
    prezzoTotale: "",
    tipoDiPagamento: "Amex",
    informazioniPerLaFatturazione: "",
    prezzoArt17: "",
    prezzoArt36: "",
    imponibileIva22: "",
  });

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

  // Stati per il salvataggio della vendita
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Stato per le note private
  const [notePrivateData, setNotePrivateData] = useState({
    fornitore: "Acquisto Privato",
    valuteBatteria: "98%",
    grado: "A",
  });

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
  const [isUpdatingSale, setIsUpdatingSale] = useState(false);

  // Nome azienda e utente (prelevati dalla sessionStorage se presenti)
  // const companyName =
  //   sessionStorage.getItem("companyName") ||
  //   sessionStorage.getItem("CompanyName") ||
  //   "";
  const userName =
    sessionStorage.getItem("userName") ||
    sessionStorage.getItem("UserName") ||
    "";

  // Funzione per caricare i dati della vendita
  useEffect(() => {
    const loadSaleData = async () => {
      if (!saleId) {
        setLoadError("ID vendita non specificato");
        setLoadingSale(false);
        return;
      }

      try {
        setLoadingSale(true);
        setLoadError(null);

        // Chiamata API per recuperare i dati della vendita
        const response = await fetch(`${API_URL}/api/sale/guid/${saleId}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Vendita non trovata");
        }

        const sale: SaleData = await response.json();
        setSaleData(sale);

        // Carica i dati del cliente se presente customerId
        if (sale.customerId) {
          try {
            console.log("🔍 Caricamento cliente con ID:", sale.customerId);
            const customerResponse = await fetch(
              `${API_URL}/api/customer/${sale.customerId}`,
              {
                headers: {
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
              }
            );
            if (customerResponse.ok) {
              const customer: CustomerData = await customerResponse.json();
              console.log("✅ Cliente caricato:", customer);
              setSelectedCustomer(customer);
              setSearchQuery(
                customer.tipologia === "Azienda"
                  ? customer.ragioneSociale
                  : `${customer.nome} ${customer.cognome}`
              );
              setClienteData({
                email: customer.email || "",
                nome: customer.nome || "",
                cognome: customer.cognome || "",
                telefono: customer.telefono || "",
                cap: customer.cap || "",
              });
              console.log("✅ clienteData popolato:", {
                email: customer.email,
                nome: customer.nome,
                cognome: customer.cognome,
                telefono: customer.telefono,
                cap: customer.cap,
              });
            } else {
              console.error(
                "❌ Errore risposta cliente:",
                customerResponse.status
              );
            }
          } catch (error) {
            console.error("❌ Errore nel caricamento del cliente:", error);
          }
        } else {
          console.warn("⚠️ Nessun customerId trovato nella vendita");
        }

        // Carica i dati del dispositivo se presente deviceId
        if (sale.deviceId) {
          try {
            console.log("🔍 Caricamento dispositivo con ID:", sale.deviceId);
            const deviceResponse = await fetch(
              `${API_URL}/api/device-inventory/guid/${sale.deviceId}`,
              {
                headers: {
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
              }
            );
            if (deviceResponse.ok) {
              const device: DeviceData = await deviceResponse.json();
              console.log("✅ Dispositivo caricato:", device);
              setSelectedDevice(device);
              setDeviceSearchQuery(
                `${device.brand} ${device.model} - ${device.serialNumber}`
              );
            } else {
              console.error(
                "❌ Errore risposta dispositivo:",
                deviceResponse.status
              );
            }
          } catch (error) {
            console.error("❌ Errore nel caricamento del dispositivo:", error);
          }
        } else {
          console.warn("⚠️ Nessun deviceId trovato nella vendita");
        }

        // Popola i dati del dispositivo dai campi diretti della vendita
        console.log("📝 Popolamento dispositivoData da sale:", {
          serialNumber: sale.serialNumber,
          brand: sale.brand,
          model: sale.model,
          warrantyMonths: sale.warrantyMonths,
        });
        setDispositivoData({
          condizione: "Usato", // Default, potrebbe essere calcolato
          serialNumber: sale.serialNumber || "",
          brand: sale.brand || "Apple",
          model: sale.model || "",
          deviceType: "iPhone", // Default, potrebbe essere inferito dal model
          colore: "",
          memoria: "512 GB", // Default
          durataGaranzia: sale.warrantyMonths
            ? `${sale.warrantyMonths} Mesi`
            : "6 Mesi",
        });

        // Imposta data e ora dalla saleDate
        if (sale.saleDate) {
          const saleDateTime = new Date(sale.saleDate);
          const dateStr = saleDateTime.toISOString().split("T")[0];
          const timeStr = saleDateTime.toTimeString().slice(0, 5);
          setDateTime({
            date: dateStr,
            time: timeStr,
          });
        }

        // Imposta regime IVA in base al vatRate
        if (sale.vatRate === 22) {
          setRegimeIva("IVA22");
        } else if (sale.vatRate === 0) {
          // Potrebbe essere ART17 o ART36, default a IVA22
          setRegimeIva("IVA22");
        }

        // Imposta diagnostica da includedAccessories
        if (sale.includedAccessories) {
          const accessories = sale.includedAccessories.split(", ");
          const updatedDiagnostics = diagnosticItems.map((item) => ({
            ...item,
            active: accessories.some((acc) =>
              item.label.toLowerCase().includes(acc.toLowerCase())
            ),
          }));
          setDiagnosticItems(updatedDiagnostics);
        }

        // Popola i dati di prezzo
        setPrezziData({
          prezzoAcquistoIva0:
            sale.vatRate === 0 ? sale.salePrice.toString() : "",
          prezzoAcquistoIva22:
            sale.vatRate === 0 ? sale.salePrice.toString() : "",
          prezzoIva22: sale.vatRate === 22 ? sale.salePrice.toString() : "",
          prezzoTotale: sale.totalAmount.toString(),
          tipoDiPagamento: sale.paymentType || "Amex",
          informazioniPerLaFatturazione: sale.notes || "",
          prezzoArt17: sale.vatRate === 0 ? sale.salePrice.toString() : "",
          prezzoArt36: sale.vatRate === 0 ? sale.salePrice.toString() : "",
          imponibileIva22: sale.vatRate === 22 ? sale.salePrice.toString() : "",
        });

        // Note private - per ora vuote, da aggiungere se necessario
        // Il payload non sembra avere questo campo strutturato

        setLoadingSale(false);
      } catch (error) {
        console.error("Errore nel caricamento della vendita:", error);
        setLoadError(
          error instanceof Error ? error.message : "Errore nel caricamento"
        );
        setLoadingSale(false);
      }
    };

    loadSaleData();
  }, [saleId, API_URL]);

  // Gestione data e ora
  useEffect(() => {
    if (!dateTime.date && !dateTime.time) {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().slice(0, 5);
      setDateTime({ date: dateStr, time: timeStr });
    }
  }, [dateTime]);

  // Funzione per cercare clienti
  const handleSearchCustomer = async (query: string) => {
    setSearchQuery(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/customers/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Errore nella ricerca");
        }

        const data = await response.json();
        setSearchResults(data);
        setShowDropdown(true);
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
        : `${customer.nome} ${customer.cognome}`
    );
    setShowDropdown(false);

    setClienteData({
      email: customer.email || "",
      nome: customer.nome || "",
      cognome: customer.cognome || "",
      telefono: customer.telefono || "",
      cap: customer.cap || "",
    });
  };

  // Funzione per cercare dispositivi
  const handleSearchDevice = async (query: string) => {
    setDeviceSearchQuery(query);

    if (deviceDebounceRef.current) {
      clearTimeout(deviceDebounceRef.current);
    }

    if (query.length < 2) {
      setDeviceSearchResults([]);
      setShowDeviceDropdown(false);
      return;
    }

    deviceDebounceRef.current = setTimeout(async () => {
      setDeviceLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/device-inventory/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Errore nella ricerca");
        }

        const devices = await response.json();
        setDeviceSearchResults(devices);
        setShowDeviceDropdown(true);
      } catch (error) {
        console.error("Errore nella ricerca del dispositivo:", error);
        setDeviceSearchResults([]);
      } finally {
        setDeviceLoading(false);
      }
    }, 300);
  };

  // Funzione per selezionare un dispositivo
  const handleSelectDevice = (device: DeviceData) => {
    setSelectedDevice(device);
    setDeviceSearchQuery(
      `${device.brand} ${device.model} - ${device.serialNumber}`
    );
    setShowDeviceDropdown(false);

    setDispositivoData({
      condizione: (device as any).condizione || "Nuovo",
      serialNumber: device.serialNumber || "",
      brand: device.brand || "Apple",
      model: device.model || "",
      deviceType: (device as any).deviceType || "iPhone",
      colore: (device as any).colore || "",
      memoria: (device as any).memoria || "512 GB",
      durataGaranzia: (device as any).durataGaranzia || "6 Mesi",
    });
  };

  // Toggle diagnostica
  const toggleDiagnostic = (id: string) => {
    setDiagnosticItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  // Funzione per validare il form
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedCustomer) {
      errors.push("Seleziona un cliente");
    }

    if (!selectedDevice) {
      errors.push("Seleziona un dispositivo");
    }

    if (!dateTime.date) {
      errors.push("Inserisci la data della vendita");
    }

    if (!dateTime.time) {
      errors.push("Inserisci l'ora della vendita");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Funzione per aggiornare la vendita
  const handleUpdateSale = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!saleId || !saleData) {
      setUpdateError("ID vendita non valido");
      return;
    }

    setIsUpdatingSale(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      // Prepara i dati per l'aggiornamento mantenendo la struttura del payload originale
      const activeDiagnostics = diagnosticItems
        .filter((item) => item.active)
        .map((item) => item.label)
        .join(", ");

      const saleUpdateData = {
        // Mantieni i campi originali non modificabili
        saleId: saleData.saleId,
        saleCode: saleData.saleCode,
        saleType: saleData.saleType,

        // Aggiorna i riferimenti
        customerId: selectedCustomer?.id || saleData.customerId,
        deviceId: selectedDevice?.id || saleData.deviceId,
        deviceRegistryId: saleData.deviceRegistryId,

        // Aggiorna i dati del dispositivo
        brand: dispositivoData.brand,
        model: dispositivoData.model,
        serialNumber: dispositivoData.serialNumber,
        imei: dispositivoData.serialNumber, // Usa serialNumber come IMEI se non diverso

        // Prezzi e IVA - Calcola in base al regime IVA selezionato
        salePrice: (() => {
          if (regimeIva === "IVA22") {
            return parseFloat(
              prezziData.imponibileIva22 || prezziData.prezzoIva22 || "0"
            );
          } else if (regimeIva === "ART17") {
            return parseFloat(
              prezziData.prezzoArt17 || prezziData.prezzoAcquistoIva0 || "0"
            );
          } else {
            return parseFloat(
              prezziData.prezzoArt36 || prezziData.prezzoAcquistoIva22 || "0"
            );
          }
        })(),
        originalPrice: parseFloat(prezziData.prezzoTotale || "0"),
        discount: saleData.discount,
        vatRate: regimeIva === "IVA22" ? 22.0 : 0.0,
        totalAmount: parseFloat(prezziData.prezzoTotale || "0"),

        // Pagamento - Usa i dati dal form prezziData
        paymentType: prezziData.tipoDiPagamento || "Amex",
        paymentStatus: saleData.paymentStatus,
        paidAmount: saleData.paidAmount,
        remainingAmount: saleData.remainingAmount,
        installmentsCount: saleData.installmentsCount,
        installmentAmount: saleData.installmentAmount,

        // Status
        saleStatus: saleData.saleStatus,
        saleStatusCode: saleData.saleStatusCode,

        // Fattura e ricevuta
        invoiceId: saleData.invoiceId,
        invoiceNumber: saleData.invoiceNumber,
        invoiceDate: saleData.invoiceDate,
        receiptId: saleData.receiptId,
        receiptNumber: saleData.receiptNumber,
        receiptDate: saleData.receiptDate,

        // Venditore
        sellerCode: saleData.sellerCode,
        sellerName: saleData.sellerName,

        // Note e accessori
        notes: prezziData.informazioniPerLaFatturazione || saleData.notes,
        includedAccessories: activeDiagnostics,

        // Garanzia
        hasWarranty: saleData.hasWarranty,
        warrantyMonths:
          parseInt(dispositivoData.durataGaranzia) || saleData.warrantyMonths,
        warrantyExpiryDate: saleData.warrantyExpiryDate,

        // Date
        saleDate: `${dateTime.date}T${dateTime.time}:00`,
        deliveryDate: saleData.deliveryDate,

        // Multitenancy
        companyId: saleData.companyId,
        companyName: saleData.companyName,
        multitenantId: saleData.multitenantId,

        // Metadati
        updatedBy:
          userName || sessionStorage.getItem("userEmail") || saleData.createdBy,
      };

      const response = await fetch(`${API_URL}/api/sale/${saleData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(saleUpdateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Errore nell'aggiornamento della vendita"
        );
      }

      const result = await response.json();
      console.log("Vendita aggiornata con successo:", result);

      setUpdateSuccess("Vendita aggiornata con successo!");

      // Reindirizza alla pagina ricerca vendite dopo 2 secondi
      setTimeout(() => {
        navigate("/ricerca-vendite");
      }, 2000);
    } catch (error) {
      console.error("Errore nell'aggiornamento della vendita:", error);
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Errore nell'aggiornamento della vendita"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsUpdatingSale(false);
    }
  };

  // Funzione per salvare un nuovo cliente
  const handleSaveNewClient = async () => {
    setSavingNewClient(true);
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(newClientData),
      });

      if (!response.ok) {
        throw new Error("Errore nel salvataggio del cliente");
      }

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
    } catch (error) {
      console.error("Errore nel salvataggio del cliente:", error);
      alert("Errore nel salvataggio del cliente");
    } finally {
      setSavingNewClient(false);
    }
  };

  // Gestione click fuori dai dropdown
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Renderizza errore di caricamento
  if (loadError) {
    return (
      <div className={styles.mainLayout}>
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}>
          <Topbar toggleMenu={toggleMenu} />
          <div className={styles.pageBody}>
            <div className={styles.repairFormContainer}>
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#dc3545",
                }}
              >
                <h2>❌ Errore</h2>
                <p>{loadError}</p>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => navigate("/ricerca-vendite")}
                  style={{ marginTop: "20px" }}
                >
                  Torna a Ricerca Vendite
                </button>
              </div>
            </div>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  // Renderizza loading
  if (loadingSale) {
    return (
      <div className={styles.mainLayout}>
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}>
          <Topbar toggleMenu={toggleMenu} />
          <div className={styles.pageBody}>
            <div className={styles.repairFormContainer}>
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Caricamento vendita in corso...</p>
              </div>
            </div>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />
        <div className={styles.pageBody}>
          <div className={styles.repairFormContainer}>
            <div className={styles.pageTitle}>
              <h1>✏️ Modifica Vendita</h1>
              <p>
                Modifica i dettagli della vendita {saleData?.saleCode || saleId}
              </p>
            </div>

            {/* Messaggi di errore validazione */}
            {validationErrors.length > 0 && (
              <div className={styles.validationErrorsContainer}>
                <h4>⚠️ Correggi i seguenti errori:</h4>
                <ul className={styles.validationErrorsList}>
                  {validationErrors.map((error, index) => (
                    <li key={index} className={styles.validationError}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Messaggio di errore aggiornamento */}
            {updateError && (
              <div className={styles.errorMessage}>❌ {updateError}</div>
            )}

            {/* Messaggio di successo */}
            {updateSuccess && (
              <div className={styles.successMessage}>✅ {updateSuccess}</div>
            )}

            <div className={styles.pageContainer}>
              {/* COLONNA SINISTRA */}
              <div className={styles.leftColumn}>
                {/* ROW CON CLIENTE E DISPOSITIVO AFFIANCATI */}
                <div className={styles.topRow}>
                  {/* SEZIONE CLIENTE */}
                  <div className={styles.formSection}>
                    <h3>👤 CLIENTE</h3>
                    <div className={styles.formGroup}>
                      <label>Cerca Cliente</label>
                      <div className={styles.searchContainer}>
                        <input
                          ref={searchInputRef}
                          type="text"
                          className={`${styles.formControl} ${styles.searchInput}`}
                          placeholder="Cerca per nome, email, telefono..."
                          value={searchQuery}
                          onChange={(e) => handleSearchCustomer(e.target.value)}
                          onFocus={() =>
                            searchQuery.length >= 2 && setShowDropdown(true)
                          }
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
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedCustomer(null);
                              setSearchResults([]);
                              setShowDropdown(false);
                            }}
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
                                      : `${customer.nome} ${customer.cognome}`}
                                  </div>
                                  <div className={styles.customerDetails}>
                                    {customer.email} • {customer.telefono}
                                  </div>
                                  {customer.indirizzo && (
                                    <div className={styles.customerAddress}>
                                      {customer.indirizzo}, {customer.citta}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Campi cliente sempre visibili */}
                    <div className={styles.formGroup}>
                      <label>Email *</label>
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
                        placeholder="Email del cliente"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Nome *</label>
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
                      <label>Cognome *</label>
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
                      <label>Telefono *</label>
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
                        placeholder="Telefono del cliente"
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
                        placeholder="CAP"
                      />
                    </div>
                  </div>

                  {/* SEZIONE DISPOSITIVO */}
                  <div className={styles.formSection}>
                    <h3>📱 DISPOSITIVO</h3>
                    <div className={styles.formGroup}>
                      <label>Cerca Dispositivo</label>
                      <div className={styles.searchContainer}>
                        <input
                          ref={deviceSearchInputRef}
                          type="text"
                          className={`${styles.formControl} ${styles.searchInput}`}
                          placeholder="Cerca per modello, serial number..."
                          value={deviceSearchQuery}
                          onChange={(e) => handleSearchDevice(e.target.value)}
                          onFocus={() =>
                            deviceSearchQuery.length >= 2 &&
                            setShowDeviceDropdown(true)
                          }
                        />
                        {deviceSearchQuery && (
                          <button
                            type="button"
                            className={styles.clearButton}
                            onClick={() => {
                              setDeviceSearchQuery("");
                              setSelectedDevice(null);
                              setDeviceSearchResults([]);
                              setShowDeviceDropdown(false);
                            }}
                          >
                            ×
                          </button>
                        )}
                        {deviceLoading && (
                          <div className={styles.loadingIndicator}>
                            <div className={styles.spinner}></div>
                          </div>
                        )}
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
                                  onClick={() => handleSelectDevice(device)}
                                >
                                  <div className={styles.customerInfo}>
                                    <div className={styles.customerName}>
                                      {device.brand} {device.model}
                                    </div>
                                    <div className={styles.customerDetails}>
                                      SN: {device.serialNumber}
                                    </div>
                                    <div className={styles.customerAddress}>
                                      {device.color ? `${device.color} • ` : ""}
                                      {(device as any).condizione || ""}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Campi dispositivo sempre visibili */}
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
                        {condizioniOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Numero di serie/IMEI *</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={dispositivoData.serialNumber}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            serialNumber: e.target.value,
                          })
                        }
                        placeholder="Serial Number / IMEI"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Tipo Dispositivo *</label>
                      <select
                        className={styles.formControl}
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
                    </div>

                    <div className={styles.formGroup}>
                      <label>Marca *</label>
                      <select
                        className={styles.formControl}
                        value={dispositivoData.brand}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            brand: e.target.value,
                          })
                        }
                      >
                        {brandOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Modello *</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={dispositivoData.model}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            model: e.target.value,
                          })
                        }
                        placeholder="Modello del dispositivo"
                      />
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
                        {memoriaOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
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
                        {durataGaranziaOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {/* Fine topRow con Cliente e Dispositivo */}

                {/* SEZIONE DIAGNOSTICA */}
                <div
                  className={`${styles.formSection} ${styles.diagnosticaSection}`}
                >
                  <h3>🔍 DIAGNOSTICA DISPOSITIVO</h3>
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
                          onClick={() => toggleDiagnostic(item.id)}
                        >
                          <span className={styles.diagnosticaIcon}>
                            {item.icon}
                          </span>
                        </div>
                        <span className={styles.diagnosticaLabel}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLONNA DESTRA */}
              <div className={styles.rightColumn}>
                {/* DATA E ORA */}
                <div className={styles.formSection}>
                  <h3>📅 DATA E ORA VENDITA</h3>
                  <div className={styles.formGroup}>
                    <label>Data</label>
                    <input
                      type="date"
                      className={styles.formControl}
                      value={dateTime.date}
                      onChange={(e) =>
                        setDateTime({ ...dateTime, date: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Ora</label>
                    <input
                      type="time"
                      className={styles.formControl}
                      value={dateTime.time}
                      onChange={(e) =>
                        setDateTime({ ...dateTime, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* REGIME IVA */}
                <div className={styles.formSection}>
                  <h3>💶 REGIME IVA</h3>
                  <div className={styles.formGroup}>
                    <label>Seleziona Regime</label>
                    <select
                      className={styles.formControl}
                      value={regimeIva}
                      onChange={(e) =>
                        setRegimeIva(
                          e.target.value as "IVA22" | "ART17" | "ART36"
                        )
                      }
                    >
                      <option value="IVA22">IVA 22%</option>
                      <option value="ART17">
                        Art. 17 (Inversione contabile)
                      </option>
                      <option value="ART36">Art. 36 (Beni usati)</option>
                    </select>
                  </div>
                </div>

                {/* REGIME IVA */}
                <div className={styles.formSection}>
                  <h3>💰 REGIME IVA</h3>
                  <div className={styles.formGroup}>
                    <label>Regime IVA</label>
                    <select
                      className={styles.formControl}
                      value={regimeIva}
                      onChange={(e) =>
                        setRegimeIva(
                          e.target.value as "IVA22" | "ART17" | "ART36"
                        )
                      }
                    >
                      <option value="ART17">Art.17 – IVA 0%</option>
                      <option value="ART36">Art.36 – IVA 0%</option>
                      <option value="IVA22">IVA 22%</option>
                    </select>
                  </div>
                </div>

                {/* SEZIONE PREZZO */}
                <div className={styles.formSection}>
                  <h3>💵 PREZZO</h3>

                  {/* ART.17 */}
                  {regimeIva === "ART17" && (
                    <div className={styles.formGroup}>
                      <label>Prezzo Art.17 IVA 0%</label>
                      <div className={styles.priceInputContainer}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={styles.formControl}
                          value={
                            prezziData.prezzoArt17 ||
                            prezziData.prezzoAcquistoIva0
                          }
                          onChange={(e) =>
                            setPrezziData((p) => ({
                              ...p,
                              prezzoArt17: e.target.value,
                              prezzoAcquistoIva0: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                        />
                        <span className={styles.currencyLabel}>€</span>
                      </div>
                    </div>
                  )}

                  {/* ART.36 */}
                  {regimeIva === "ART36" && (
                    <div className={styles.formGroup}>
                      <label>Prezzo Art.36 IVA 0%</label>
                      <div className={styles.priceInputContainer}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={styles.formControl}
                          value={
                            prezziData.prezzoArt36 ||
                            prezziData.prezzoAcquistoIva22
                          }
                          onChange={(e) =>
                            setPrezziData((p) => ({
                              ...p,
                              prezzoArt36: e.target.value,
                              prezzoAcquistoIva22: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                        />
                        <span className={styles.currencyLabel}>€</span>
                      </div>
                    </div>
                  )}

                  {/* IVA 22% */}
                  {regimeIva === "IVA22" && (
                    <>
                      <div className={styles.formGroup}>
                        <label>Imponibile (IVA 22%)</label>
                        <div className={styles.priceInputContainer}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={styles.formControl}
                            value={
                              prezziData.imponibileIva22 ||
                              prezziData.prezzoIva22
                            }
                            onChange={(e) =>
                              setPrezziData((p) => ({
                                ...p,
                                imponibileIva22: e.target.value,
                                prezzoIva22: e.target.value,
                              }))
                            }
                            placeholder="0.00"
                          />
                          <span className={styles.currencyLabel}>€</span>
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>IVA (22% su imponibile)</label>
                        <div className={styles.priceInputContainer}>
                          <input
                            type="number"
                            className={styles.formControl}
                            readOnly
                            value={(() => {
                              const v =
                                parseFloat(
                                  (
                                    prezziData.imponibileIva22 ||
                                    prezziData.prezzoIva22 ||
                                    "0"
                                  ).replace(",", ".")
                                ) || 0;
                              return (Math.round(v * 0.22 * 100) / 100).toFixed(
                                2
                              );
                            })()}
                          />
                          <span className={styles.currencyLabel}>€</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Totale sempre visibile */}
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
                          setPrezziData((p) => ({
                            ...p,
                            prezzoTotale: e.target.value,
                          }))
                        }
                        placeholder="0.00"
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
                        setPrezziData((p) => ({
                          ...p,
                          tipoDiPagamento: e.target.value,
                        }))
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
                        setPrezziData((p) => ({
                          ...p,
                          informazioniPerLaFatturazione: e.target.value,
                        }))
                      }
                      placeholder="Note aggiuntive per la fatturazione."
                    />
                  </div>
                </div>

                {/* NOTE PRIVATE */}
                <div className={styles.formSection}>
                  <h3>📝 NOTE PRIVATE</h3>
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
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Salute Batteria</label>
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
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AZIONI */}
            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => navigate("/ricerca-vendite")}
                disabled={isUpdatingSale}
              >
                ← Annulla
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleUpdateSale}
                disabled={isUpdatingSale}
              >
                {isUpdatingSale ? "⏳ Aggiornamento..." : "✅ Aggiorna Vendita"}
              </button>
            </div>
          </div>
        </div>
        <BottomBar />
      </div>

      {/* MODAL NUOVO CLIENTE */}
      {showNewClientModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>Nuovo Cliente</h4>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowNewClientModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.customerForm}>
                {/* Toggle Tipo Cliente */}
                <div className={styles.formRow}>
                  <div className={styles.checkboxGroup}>
                    <label>
                      <input
                        type="radio"
                        name="tipo"
                        value="Privato"
                        checked={newClientData.tipo === "Privato"}
                        onChange={(e) =>
                          setNewClientData({
                            ...newClientData,
                            tipo: e.target.value,
                          })
                        }
                      />
                      Privato
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="tipo"
                        value="Azienda"
                        checked={newClientData.tipo === "Azienda"}
                        onChange={(e) =>
                          setNewClientData({
                            ...newClientData,
                            tipo: e.target.value,
                          })
                        }
                      />
                      Azienda
                    </label>
                  </div>
                </div>

                <div className={styles.formRow}>
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

                {/* Form Campi */}
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

export default ModificaVendite;
