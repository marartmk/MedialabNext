import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import {
  Truck,
  Search,
  BarChart3,
  X,
  Printer,
  Plus,
  Grid3X3,
  List,
  Smartphone,
} from "lucide-react";
import "./logistica-styles.css";
import warehouseService from "../../services/warehouseService";
import deviceInventoryService from "../../services/deviceInventoryService";
import accessoryInventoryService from "../../services/accessoryInventoryService";
import type { WarehouseItem } from "../../services/warehouseService";
import type { DeviceInventoryItem } from "../../services/deviceInventoryService";
import type { AccessoryInventoryItem } from "../../services/accessoryInventoryService";

// API URL
const API_URL = import.meta.env.VITE_API_URL;

// Helper per le chiamate API
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

// Tipi per i dati (allineati ai DTO del backend)
interface TransportDocument {
  id: number;
  transportDocumentId: string;
  documentCode: string;
  documentType:
    | "DDT_IN"
    | "DDT_OUT"
    | "PURCHASE"
    | "SALE"
    | "REPAIR_IN"
    | "REPAIR_OUT";
  documentDate: string;
  supplierName?: string;
  customerName?: string;
  laboratoryId?: number;
  laboratoryName?: string;
  courierId?: number;
  courierName?: string;
  transportStatus: "DRAFT" | "CONFIRMED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  totalItems: number;
  totalValue: number;
  notes?: string;
  trackingNumber?: string;
  shippingDate?: string;
  deliveryDate?: string;
  // Campi DDT aggiuntivi
  destinatarioName?: string;
  destinatarioAddress?: string;
  destinatarioCity?: string;
  luogoDestinazioneName?: string;
  luogoDestinazioneAddress?: string;
  luogoDestinazioneCity?: string;
  orderReference?: string;
  orderDate?: string;
  paymentType?: "IN_CONTO" | "A_SALDO";
  weight?: number;
  packagingType?: string;
  pickupDateTime?: string;
  numberOfPackages?: number;
  goodsAppearance?: string;
  shippingType?: "FRANCO" | "ASSEGNATO";
  carrierType?: "VETTORE" | "MITTENTE" | "DESTINATARIO";
  items: TransportItem[];
  repairItems: RepairTransportItem[];
  createdAt: string;
  updatedAt?: string;
}

interface TransportItem {
  id: number;
  transportItemId: string;
  transportDocumentId: string;
  warehouseItemId?: number;
  itemCode: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  brand?: string;
  model?: string;
  createdAt: string;
}

interface RepairTransportItem {
  id: number;
  transportRepairItemId: string;
  transportDocumentId: string;
  repairId: string;
  repairCode: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber?: string;
  customerName: string;
  faultDescription?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  priorityLabel: string;
  createdAt: string;
}

interface RepairListItem {
  id: number;
  repairId: string;
  repairCode: string;
  repairStatusCode?: string;
  repairStatus?: string;
  faultDeclared?: string;
  createdAt?: string;
  device?: {
    brand: string;
    model: string;
    serialNumber?: string;
  };
  customer?: {
    name: string;
  };
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

interface Courier {
  id: number;
  courierId: string;
  code: string;
  name: string;
  contactPhone?: string;
  contactEmail?: string;
  trackingBaseUrl?: string;
  isActive: boolean;
}

interface Laboratory {
  id: number;
  laboratoryId: string;
  code: string;
  name: string;
  city: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  isAffiliate: boolean;
  isActive: boolean;
}

// Interfaccia per la risposta paginata
interface TransportDocumentPagedResponse {
  items: TransportDocument[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Interfaccia per le statistiche
interface TransportStats {
  totalDocuments: number;
  draftCount: number;
  confirmedCount: number;
  inTransitCount: number;
  deliveredCount: number;
  cancelledCount: number;
  totalValue: number;
  documentsThisMonth: number;
  documentsThisWeek: number;
}

type MaterialSource = "repairs" | "devices" | "parts" | "accessories" | "";

const Logistica: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });
  console.log(dateTime);

  // Funzione per la validazione del tipo di documento
  const isValidDocumentType = (
    value: string
  ): value is TransportDocument["documentType"] => {
    return [
      "DDT_IN",
      "DDT_OUT",
      "PURCHASE",
      "SALE",
      "REPAIR_IN",
      "REPAIR_OUT",
    ].includes(value);
  };

  // Stati per le ricerche articoli e riparazioni
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [materialSource, setMaterialSource] = useState<MaterialSource>("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialLoading, setMaterialLoading] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [availableRepairs, setAvailableRepairs] = useState<RepairListItem[]>([]);
  const [availableDevices, setAvailableDevices] = useState<DeviceInventoryItem[]>([]);
  const [availableParts, setAvailableParts] = useState<WarehouseItem[]>([]);
  const [availableAccessories, setAvailableAccessories] = useState<AccessoryInventoryItem[]>([]);
  const [materialSelections, setMaterialSelections] = useState<Record<string, number>>({});

  // Stati per destinatario e luogo di destinazione
  const [destinatarioQuery, setDestinatarioQuery] = useState("");
  const [destinatarioResults, setDestinatarioResults] = useState<CustomerData[]>([]);
  const [showDestinatarioDropdown, setShowDestinatarioDropdown] = useState(false);
  const [destinatarioLoading, setDestinatarioLoading] = useState(false);
  const [selectedDestinatario, setSelectedDestinatario] = useState<CustomerData | null>(null);

  const [destinazioneQuery, setDestinazioneQuery] = useState("");
  const [destinazioneResults, setDestinazioneResults] = useState<CustomerData[]>([]);
  const [showDestinazioneDropdown, setShowDestinazioneDropdown] = useState(false);
  const [destinazioneLoading, setDestinazioneLoading] = useState(false);
  const [selectedDestinazione, setSelectedDestinazione] = useState<CustomerData | null>(null);

  const destinatarioDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destinazioneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stati per i dati
  const [documents, setDocuments] = useState<TransportDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<
    TransportDocument[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stati per i filtri
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Stati per il modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedDocument, setSelectedDocument] =
    useState<TransportDocument | null>(null);

  // Stati per il modal di stampa DDT
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDocument, setPrintDocument] = useState<TransportDocument | null>(null);

  // Informazioni azienda (recuperate da sessionStorage)
  const companyName = sessionStorage.getItem("companyName") || "Azienda";
  const companyAddress = sessionStorage.getItem("companyAddress") || "";
  const companyCity = sessionStorage.getItem("companyCity") || "";
  const companyPhone = sessionStorage.getItem("companyPhone") || "";
  const companyVat = sessionStorage.getItem("companyVat") || "";
  const companyEmail = sessionStorage.getItem("companyEmail") || "";

  // Stati per il form
  const [formData, setFormData] = useState({
    documentNumber: "",
    documentType: "DDT_OUT" as TransportDocument["documentType"],
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    customer: "",
    laboratory: "",
    affiliate: "",
    courier: "",
    notes: "",
  });

  // Stati per gli articoli e riparazioni
  const [selectedItems, setSelectedItems] = useState<TransportItem[]>([]);
  const [selectedRepairs, setSelectedRepairs] = useState<RepairTransportItem[]>(
    []
  );

  // Dati statici
  const documentTypes = [
    { value: "DDT_IN", label: "📦 DDT Ingresso", icon: "📦", color: "#17a2b8" },
    { value: "DDT_OUT", label: "🚚 DDT Uscita", icon: "🚚", color: "#28a745" },
    {
      value: "PURCHASE",
      label: "🛒 Acquisto Ricambi",
      icon: "🛒",
      color: "#6f42c1",
    },
    {
      value: "SALE",
      label: "💰 Vendita Ricambi",
      icon: "💰",
      color: "#fd7e14",
    },
    {
      value: "REPAIR_IN",
      label: "📱 Riparazioni IN",
      icon: "📱",
      color: "#dc3545",
    },
    {
      value: "REPAIR_OUT",
      label: "🔧 Riparazioni OUT",
      icon: "🔧",
      color: "#20c997",
    },
  ];

  const statuses = [
    { value: "DRAFT", label: "📝 Bozza", color: "#6c757d" },
    { value: "CONFIRMED", label: "✅ Confermato", color: "#28a745" },
    { value: "IN_TRANSIT", label: "🚛 In Transito", color: "#ffc107" },
    { value: "DELIVERED", label: "📦 Consegnato", color: "#17a2b8" },
    { value: "CANCELLED", label: "❌ Annullato", color: "#dc3545" },
  ];

  // Stati per corrieri e laboratori (caricati da API)
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [stats, setStats] = useState<TransportStats | null>(null);


  // Effetti
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

  useEffect(() => {
    loadLogisticsData();
    loadCouriers();
    loadLaboratories();
    loadStats();
  }, []);

  // Applica filtri locali quando cambiano i documenti o la query di ricerca
  useEffect(() => {
    let filtered = documents;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.documentCode?.toLowerCase().includes(query) ||
          doc.supplierName?.toLowerCase().includes(query) ||
          doc.customerName?.toLowerCase().includes(query) ||
          doc.laboratoryName?.toLowerCase().includes(query) ||
          doc.courierName?.toLowerCase().includes(query) ||
          doc.notes?.toLowerCase().includes(query)
      );
    }

    if (selectedDocType) {
      filtered = filtered.filter((doc) => doc.documentType === selectedDocType);
    }

    if (selectedStatus) {
      filtered = filtered.filter((doc) => doc.transportStatus === selectedStatus);
    }

    if (dateRange.from) {
      const fromDate = new Date(dateRange.from).toISOString().split('T')[0];
      filtered = filtered.filter((doc) => {
        const docDate = new Date(doc.documentDate).toISOString().split('T')[0];
        return docDate >= fromDate;
      });
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to).toISOString().split('T')[0];
      filtered = filtered.filter((doc) => {
        const docDate = new Date(doc.documentDate).toISOString().split('T')[0];
        return docDate <= toDate;
      });
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, selectedDocType, selectedStatus, dateRange]);

  const filteredRepairs = useMemo(() => {
    const query = materialSearch.trim().toLowerCase();
    if (!query) {
      return availableRepairs;
    }

    return availableRepairs.filter((repair) => {
      return [
        repair.repairCode,
        repair.repairStatus,
        repair.device?.brand,
        repair.device?.model,
        repair.customer?.name,
        repair.faultDeclared,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [availableRepairs, materialSearch]);

  const filteredDevices = useMemo(() => {
    const query = materialSearch.trim().toLowerCase();
    if (!query) {
      return availableDevices;
    }

    return availableDevices.filter((device) => {
      return [
        device.code,
        device.brand,
        device.model,
        device.imei,
        device.serialNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [availableDevices, materialSearch]);

  const filteredParts = useMemo(() => {
    const query = materialSearch.trim().toLowerCase();
    if (!query) {
      return availableParts;
    }

    return availableParts.filter((part) => {
      return [
        part.code,
        part.name,
        part.brand,
        part.model,
        part.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [availableParts, materialSearch]);

  const filteredAccessories = useMemo(() => {
    const query = materialSearch.trim().toLowerCase();
    if (!query) {
      return availableAccessories;
    }

    return availableAccessories.filter((accessory) => {
      return [
        accessory.code,
        accessory.brand,
        accessory.model,
        accessory.accessoryType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [availableAccessories, materialSearch]);

  // Funzioni per il caricamento dei dati
  const loadLogisticsData = async () => {
    setLoading(true);
    try {
      const multitenantId = sessionStorage.getItem("multitenantId") || "";
      const searchPayload = {
        searchQuery: searchQuery || null,
        documentType: selectedDocType || null,
        transportStatus: selectedStatus || null,
        dateFrom: dateRange.from || null,
        dateTo: dateRange.to || null,
        multitenantId: multitenantId || null,
        pageNumber: 1,
        pageSize: 50,
        sortBy: "DocumentDate",
        sortDescending: true
      };

      const response = await fetch(`${API_URL}/api/logistic/search`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(searchPayload),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data: TransportDocumentPagedResponse = await response.json();
      setDocuments(data.items || []);
      setError(null);
    } catch (err) {
      console.error("Errore nel caricamento dei documenti:", err);
      setError("Errore nel caricamento dei documenti di trasporto");
    } finally {
      setLoading(false);
    }
  };

  // Carica corrieri
  const loadCouriers = async () => {
    try {
      const multitenantId = sessionStorage.getItem("multitenantId") || "";
      const response = await fetch(
        `${API_URL}/api/logistic/couriers?multitenantId=${multitenantId}&activeOnly=true`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      const data: Courier[] = await response.json();
      setCouriers(data);
    } catch (err) {
      console.error("Errore nel caricamento dei corrieri:", err);
    }
  };

  // Carica laboratori
  const loadLaboratories = async () => {
    try {
      const multitenantId = sessionStorage.getItem("multitenantId") || "";
      const response = await fetch(
        `${API_URL}/api/logistic/laboratories?multitenantId=${multitenantId}&activeOnly=true`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      const data: Laboratory[] = await response.json();
      setLaboratories(data);
    } catch (err) {
      console.error("Errore nel caricamento dei laboratori:", err);
    }
  };

  // Carica statistiche
  const loadStats = async () => {
    try {
      const multitenantId = sessionStorage.getItem("multitenantId") || "";
      const response = await fetch(
        `${API_URL}/api/logistic/stats?multitenantId=${multitenantId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      const data: TransportStats = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Errore nel caricamento delle statistiche:", err);
    }
  };

  const fetchDocumentDetails = async (
    document: TransportDocument
  ): Promise<TransportDocument> => {
    try {
      const response = await fetch(`${API_URL}/api/logistic/${document.id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      return (await response.json()) as TransportDocument;
    } catch (err) {
      console.error("Errore nel caricamento dettagli documento:", err);
      return document;
    }
  };

  const resetMaterialSelection = () => {
    setMaterialSelections({});
    setMaterialSearch("");
    setMaterialError(null);
  };

  const buildSelectionKey = (source: MaterialSource, id: number | string) =>
    `${source}-${id}`;

  const loadCompletedRepairs = async () => {
    const token = sessionStorage.getItem("token");
    const multitenantId =
      sessionStorage.getItem("IdCompany") || sessionStorage.getItem("multitenantId");

    if (!multitenantId) {
      throw new Error("ID azienda non trovato");
    }

    const now = new Date();
    const start = new Date(now);
    start.setFullYear(now.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const searchPayload = {
      multitenantId,
      fromDate: start.toISOString(),
      toDate: end.toISOString(),
      page: 1,
      pageSize: 2000,
      sortBy: "CreatedAt",
      sortDescending: true,
    };

    const response = await fetch(`${API_URL}/api/repair/search/light`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      throw new Error(`Errore ${response.status}: ${response.statusText}`);
    }

    const data: RepairListItem[] = await response.json();
    const completedRepairs = data.filter((repair) => {
      const statusCode = (repair.repairStatusCode || "").toUpperCase();
      const statusLabel = (repair.repairStatus || "").toLowerCase();
      return statusCode === "COMPLETED" || statusLabel.includes("complet");
    });

    setAvailableRepairs(completedRepairs);
  };

  const loadMaterialOptions = async (source: MaterialSource) => {
    if (!source) {
      return;
    }

    setMaterialLoading(true);
    setMaterialError(null);

    try {
      if (source === "repairs") {
        await loadCompletedRepairs();
      }

      if (source === "devices") {
        const response = await deviceInventoryService.searchItems({
          deviceStatus: "available",
          page: 1,
          pageSize: 200,
          sortBy: "CreatedAt",
          sortDescending: true,
        });
        setAvailableDevices(response.items || []);
      }

      if (source === "parts") {
        const response = await warehouseService.searchItems({
          stockStatus: "available",
          page: 1,
          pageSize: 200,
          sortBy: "CreatedAt",
          sortDescending: true,
        });
        setAvailableParts(
          (response.items || []).filter((item) => item.quantity > 0)
        );
      }

      if (source === "accessories") {
        const response = await accessoryInventoryService.searchItems({
          accessoryStatus: "available",
          page: 1,
          pageSize: 200,
          sortBy: "CreatedAt",
          sortDescending: true,
        });
        setAvailableAccessories(
          (response.items || []).filter((item) => item.quantityInStock > 0)
        );
      }
    } catch (err) {
      console.error("Errore nel caricamento materiali:", err);
      setMaterialError("Errore nel caricamento dei materiali");
    } finally {
      setMaterialLoading(false);
    }
  };

  useEffect(() => {
    if (!showMaterialSearch || !materialSource) {
      return;
    }

    resetMaterialSelection();
    loadMaterialOptions(materialSource);
  }, [showMaterialSearch, materialSource]);


  // Funzioni per la gestione del modal
  const openModal = async (
    mode: "add" | "edit" | "view",
    document?: TransportDocument
  ) => {
    setModalMode(mode);
    setSelectedDocument(document || null);

    if (document && (mode === "edit" || mode === "view")) {
      const baseDate = document.documentDate
        ? document.documentDate.split("T")[0]
        : new Date().toISOString().split("T")[0];
      setFormData({
        documentNumber: document.documentCode,
        documentType: document.documentType,
        date: baseDate,
        supplier: document.supplierName || "",
        customer: document.customerName || "",
        laboratory: document.laboratoryId?.toString() || "",
        affiliate: "",
        courier: document.courierId?.toString() || "",
        notes: document.notes || "",
      });
      setSelectedItems(document.items || []);
      setSelectedRepairs(document.repairItems || []);
      if (document.customerName) {
        const destinatario = {
          id: "",
          tipologia: "",
          ragioneSociale: document.customerName || "",
          nome: "",
          cognome: "",
          email: "",
          telefono: "",
          cap: "",
          indirizzo: document.destinatarioAddress || "",
          citta: document.destinatarioCity || "",
          provincia: "",
          regione: "",
          fiscalCode: "",
          pIva: "",
          emailPec: "",
          codiceSdi: "",
          iban: "",
        };
        setSelectedDestinatario(destinatario);
        setDestinatarioQuery(getCustomerDisplayName(destinatario));
      }

      if (
        document.luogoDestinazioneAddress ||
        document.luogoDestinazioneCity ||
        document.customerName
      ) {
        const destinazione = {
          id: "",
          tipologia: "",
          ragioneSociale: document.customerName || "",
          nome: "",
          cognome: "",
          email: "",
          telefono: "",
          cap: "",
          indirizzo:
            document.luogoDestinazioneAddress || document.destinatarioAddress || "",
          citta:
            document.luogoDestinazioneCity || document.destinatarioCity || "",
          provincia: "",
          regione: "",
          fiscalCode: "",
          pIva: "",
          emailPec: "",
          codiceSdi: "",
          iban: "",
        };
        setSelectedDestinazione(destinazione);
        setDestinazioneQuery(getCustomerDisplayName(destinazione));
      }
      const detailed = await fetchDocumentDetails(document);
      setSelectedDocument(detailed);
      setSelectedItems(detailed.items || []);
      setSelectedRepairs(detailed.repairItems || []);
      const destinatarioName =
        detailed.destinatarioName || detailed.customerName || "";
      const destinazioneName =
        detailed.luogoDestinazioneName ||
        detailed.destinatarioName ||
        detailed.customerName ||
        "";

      if (
        destinatarioName ||
        detailed.destinatarioAddress ||
        detailed.destinatarioCity
      ) {
        const destinatario = {
          id: "",
          tipologia: "",
          ragioneSociale: destinatarioName,
          nome: "",
          cognome: "",
          email: "",
          telefono: "",
          cap: "",
          indirizzo: detailed.destinatarioAddress || "",
          citta: detailed.destinatarioCity || "",
          provincia: "",
          regione: "",
          fiscalCode: "",
          pIva: "",
          emailPec: "",
          codiceSdi: "",
          iban: "",
        };
        setSelectedDestinatario(destinatario);
        setDestinatarioQuery(getCustomerDisplayName(destinatario));
      }

      if (
        destinazioneName ||
        detailed.luogoDestinazioneAddress ||
        detailed.luogoDestinazioneCity
      ) {
        const destinazione = {
          id: "",
          tipologia: "",
          ragioneSociale: destinazioneName,
          nome: "",
          cognome: "",
          email: "",
          telefono: "",
          cap: "",
          indirizzo:
            detailed.luogoDestinazioneAddress ||
            detailed.destinatarioAddress ||
            "",
          citta:
            detailed.luogoDestinazioneCity || detailed.destinatarioCity || "",
          provincia: "",
          regione: "",
          fiscalCode: "",
          pIva: "",
          emailPec: "",
          codiceSdi: "",
          iban: "",
        };
        setSelectedDestinazione(destinazione);
        setDestinazioneQuery(getCustomerDisplayName(destinazione));
      }
    } else {
      resetForm();
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      documentNumber: "",
      documentType: "DDT_OUT" as TransportDocument["documentType"],
      date: new Date().toISOString().split("T")[0],
      supplier: "",
      customer: "",
      laboratory: "",
      affiliate: "",
      courier: "",
      notes: "",
    });
    setSelectedItems([]);
    setSelectedRepairs([]);
    setSelectedDestinatario(null);
    setSelectedDestinazione(null);
    setDestinatarioQuery("");
    setDestinazioneQuery("");
    setDestinatarioResults([]);
    setDestinazioneResults([]);
    setShowDestinatarioDropdown(false);
    setShowDestinazioneDropdown(false);
  };

  const getCustomerDisplayName = (customer: CustomerData | null) => {
    if (!customer) return "";
    return customer.ragioneSociale || `${customer.nome} ${customer.cognome}`.trim();
  };

  const performCustomerSearch = async (
    query: string,
    setResults: React.Dispatch<React.SetStateAction<CustomerData[]>>,
    setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>,
    setLoadingState: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoadingState(true);
    const multitenantId = sessionStorage.getItem("IdCompany") || "";

    try {
      const response = await fetch(
        `${API_URL}/api/customer/search?query=${encodeURIComponent(
          query
        )}&multitenantId=${encodeURIComponent(multitenantId)}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Errore durante la ricerca clienti:", error);
      setResults([]);
      setShowDropdown(false);
    } finally {
      setLoadingState(false);
    }
  };

  const handleDestinatarioSearchChange = (value: string) => {
    setDestinatarioQuery(value);
    if (destinatarioDebounceRef.current) {
      clearTimeout(destinatarioDebounceRef.current);
    }
    if (!value.trim()) {
      setShowDestinatarioDropdown(false);
      setDestinatarioResults([]);
      return;
    }
    destinatarioDebounceRef.current = setTimeout(() => {
      performCustomerSearch(
        value,
        setDestinatarioResults,
        setShowDestinatarioDropdown,
        setDestinatarioLoading
      );
    }, 300);
  };

  const handleDestinazioneSearchChange = (value: string) => {
    setDestinazioneQuery(value);
    if (destinazioneDebounceRef.current) {
      clearTimeout(destinazioneDebounceRef.current);
    }
    if (!value.trim()) {
      setShowDestinazioneDropdown(false);
      setDestinazioneResults([]);
      return;
    }
    destinazioneDebounceRef.current = setTimeout(() => {
      performCustomerSearch(
        value,
        setDestinazioneResults,
        setShowDestinazioneDropdown,
        setDestinazioneLoading
      );
    }, 300);
  };

  const selectDestinatario = (customer: CustomerData) => {
    setSelectedDestinatario(customer);
    const label = getCustomerDisplayName(customer);
    setDestinatarioQuery(label);
    setFormData((prev) => ({ ...prev, customer: label }));
    setShowDestinatarioDropdown(false);
    setDestinatarioResults([]);
  };

  const selectDestinazione = (customer: CustomerData) => {
    setSelectedDestinazione(customer);
    const label = getCustomerDisplayName(customer);
    setDestinazioneQuery(label);
    setShowDestinazioneDropdown(false);
    setDestinazioneResults([]);
  };

  const openMaterialModal = (source?: MaterialSource) => {
    const nextSource = source ?? materialSource;
    if (!nextSource) {
      alert("Seleziona prima il tipo di materiale da aggiungere.");
      return;
    }
    setMaterialSource(nextSource);
    setShowMaterialSearch(true);
  };

  const closeMaterialModal = () => {
    setShowMaterialSearch(false);
    resetMaterialSelection();
  };

  const toggleMaterialSelection = (key: string, defaultQuantity = 1) => {
    setMaterialSelections((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = defaultQuantity;
      }
      return next;
    });
  };

  const updateMaterialQuantity = (key: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMaterialSelections((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    setMaterialSelections((prev) => ({
      ...prev,
      [key]: quantity,
    }));
  };

  const mergeSelectedItems = (incoming: TransportItem[]) => {
    setSelectedItems((prev) => {
      const next = [...prev];
      incoming.forEach((item) => {
        const itemKey = `${item.category || ""}-${item.itemCode}`;
        const existingIndex = next.findIndex(
          (existing) =>
            `${existing.category || ""}-${existing.itemCode}` === itemKey
        );

        if (existingIndex >= 0) {
          const existing = next[existingIndex];
          const mergedQuantity = existing.quantity + item.quantity;
          next[existingIndex] = {
            ...existing,
            quantity: mergedQuantity,
            totalPrice: existing.unitPrice * mergedQuantity,
          };
        } else {
          next.push(item);
        }
      });
      return next;
    });
  };

  const handleConfirmMaterialSelection = () => {
    const now = new Date().toISOString();
    const documentId = selectedDocument?.transportDocumentId || "temp";

    if (materialSource === "repairs") {
      const selected = availableRepairs.filter((repair) => {
        const key = buildSelectionKey("repairs", repair.id);
        return Boolean(materialSelections[key]);
      });

      if (selected.length === 0) {
        closeMaterialModal();
        return;
      }

      setSelectedRepairs((prev) => {
        const existingIds = new Set(prev.map((repair) => repair.repairId));
        const next = [...prev];

        selected.forEach((repair, index) => {
          if (existingIds.has(repair.repairId)) {
            return;
          }

          const tempId = Date.now() + index;
          next.push({
            id: tempId,
            transportRepairItemId: `temp-repair-${tempId}`,
            transportDocumentId: documentId,
            repairId: repair.repairId,
            repairCode: repair.repairCode,
            deviceBrand: repair.device?.brand || "",
            deviceModel: repair.device?.model || "",
            serialNumber: repair.device?.serialNumber || "",
            customerName: repair.customer?.name || "",
            faultDescription: repair.faultDeclared || "",
            priority: "MEDIUM",
            priorityLabel: "MEDIUM",
            createdAt: now,
          });
        });

        return next;
      });

      closeMaterialModal();
      return;
    }

    if (materialSource === "devices") {
      const selected = availableDevices.filter((device) => {
        const key = buildSelectionKey("devices", device.id);
        return Boolean(materialSelections[key]);
      });

      const mapped = selected.map((device, index) => {
        const tempId = Date.now() + index;
        return {
          id: tempId,
          transportItemId: `temp-device-${tempId}`,
          transportDocumentId: documentId,
          itemCode: device.code,
          itemName: `${device.brand} ${device.model}`,
          description: device.imei
            ? `IMEI: ${device.imei}`
            : device.serialNumber
              ? `SN: ${device.serialNumber}`
              : "",
          quantity: 1,
          unitPrice: device.sellingPrice || 0,
          totalPrice: device.sellingPrice || 0,
          category: "APPARATI",
          brand: device.brand,
          model: device.model,
          createdAt: now,
        } as TransportItem;
      });

      mergeSelectedItems(mapped);
      closeMaterialModal();
      return;
    }

    if (materialSource === "parts") {
      const selected = availableParts.filter((part) => {
        const key = buildSelectionKey("parts", part.id);
        return Boolean(materialSelections[key]);
      });

      const mapped = selected.map((part, index) => {
        const key = buildSelectionKey("parts", part.id);
        const quantity = materialSelections[key] || 1;
        const tempId = Date.now() + index;
        const unitPrice = part.unitPrice || 0;
        return {
          id: tempId,
          transportItemId: `temp-part-${tempId}`,
          transportDocumentId: documentId,
          warehouseItemId: part.id,
          itemCode: part.code,
          itemName: part.name,
          description: part.description || "",
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          category: "RICAMBI",
          brand: part.brand,
          model: part.model,
          createdAt: now,
        } as TransportItem;
      });

      mergeSelectedItems(mapped);
      closeMaterialModal();
      return;
    }

    if (materialSource === "accessories") {
      const selected = availableAccessories.filter((accessory) => {
        const key = buildSelectionKey("accessories", accessory.id);
        return Boolean(materialSelections[key]);
      });

      const mapped = selected.map((accessory, index) => {
        const key = buildSelectionKey("accessories", accessory.id);
        const quantity = materialSelections[key] || 1;
        const tempId = Date.now() + index;
        const unitPrice = accessory.sellingPrice || 0;
        return {
          id: tempId,
          transportItemId: `temp-accessory-${tempId}`,
          transportDocumentId: documentId,
          itemCode: accessory.code,
          itemName: `${accessory.brand} ${accessory.model}`,
          description: accessory.accessoryType,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          category: "ACCESSORI",
          brand: accessory.brand,
          model: accessory.model,
          createdAt: now,
        } as TransportItem;
      });

      mergeSelectedItems(mapped);
      closeMaterialModal();
      return;
    }

    closeMaterialModal();
  };

  const handleSaveDocument = async () => {
    try {
      const multitenantId = sessionStorage.getItem("multitenantId") || "";
      const companyId = sessionStorage.getItem("companyId") || "";
      const needsDestination =
        formData.documentType === "DDT_OUT" || formData.documentType === "DDT_IN";

      if (modalMode === "add") {
        if (needsDestination && (!selectedDestinatario || !selectedDestinazione)) {
          alert("Seleziona destinatario e luogo di destinazione.");
          return;
        }

        // Crea nuovo documento
        const createPayload = {
          documentType: formData.documentType,
          documentDate: formData.date,
          supplierName: formData.supplier || null,
          customerName: needsDestination
            ? getCustomerDisplayName(selectedDestinatario)
            : formData.customer || null,
          laboratoryId: formData.laboratory ? parseInt(formData.laboratory) : null,
          courierId: formData.courier ? parseInt(formData.courier) : null,
          notes: formData.notes || null,
          multitenantId: multitenantId,
          companyId: companyId,
          destinatarioName: needsDestination
            ? getCustomerDisplayName(selectedDestinatario)
            : null,
          destinatarioAddress: needsDestination
            ? selectedDestinatario?.indirizzo || null
            : null,
          destinatarioCity: needsDestination
            ? selectedDestinatario?.citta || null
            : null,
          luogoDestinazioneName: needsDestination
            ? getCustomerDisplayName(selectedDestinazione)
            : null,
          luogoDestinazioneAddress: needsDestination
            ? selectedDestinazione?.indirizzo || null
            : null,
          luogoDestinazioneCity: needsDestination
            ? selectedDestinazione?.citta || null
            : null,
        };

        const response = await fetch(`${API_URL}/api/logistic`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(createPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Errore ${response.status}: ${errorText}`);
        }

        const newDocument = await response.json();

        // Aggiungi articoli al documento se presenti
        for (const item of selectedItems) {
          await fetch(`${API_URL}/api/logistic/${newDocument.transportDocumentId}/items`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              warehouseItemId: item.warehouseItemId || null,
              itemCode: item.itemCode,
              itemName: item.itemName,
              description: item.description || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              category: item.category || null,
              brand: item.brand || null,
              model: item.model || null,
            }),
          });
        }

        // Aggiungi riparazioni al documento se presenti
        for (const repair of selectedRepairs) {
          await fetch(`${API_URL}/api/logistic/${newDocument.transportDocumentId}/repairs`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              repairId: repair.repairId,
              repairCode: repair.repairCode,
              deviceBrand: repair.deviceBrand,
              deviceModel: repair.deviceModel,
              serialNumber: repair.serialNumber || null,
              customerName: repair.customerName,
              faultDescription: repair.faultDescription || null,
              priority: repair.priority,
            }),
          });
        }

        alert("Documento creato con successo!");

      } else if (modalMode === "edit" && selectedDocument) {
        // Modifica documento esistente
        if (needsDestination && (!selectedDestinatario || !selectedDestinazione)) {
          alert("Seleziona destinatario e luogo di destinazione.");
          return;
        }

        const updatePayload = {
          documentType: formData.documentType,
          documentDate: formData.date,
          supplierName: formData.supplier || null,
          customerName: needsDestination
            ? getCustomerDisplayName(selectedDestinatario)
            : formData.customer || null,
          laboratoryId: formData.laboratory ? parseInt(formData.laboratory) : null,
          courierId: formData.courier ? parseInt(formData.courier) : null,
          notes: formData.notes || null,
          destinatarioName: needsDestination
            ? getCustomerDisplayName(selectedDestinatario)
            : null,
          destinatarioAddress: needsDestination
            ? selectedDestinatario?.indirizzo || null
            : null,
          destinatarioCity: needsDestination
            ? selectedDestinatario?.citta || null
            : null,
          luogoDestinazioneName: needsDestination
            ? getCustomerDisplayName(selectedDestinazione)
            : null,
          luogoDestinazioneAddress: needsDestination
            ? selectedDestinazione?.indirizzo || null
            : null,
          luogoDestinazioneCity: needsDestination
            ? selectedDestinazione?.citta || null
            : null,
        };

        const response = await fetch(`${API_URL}/api/logistic/${selectedDocument.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Errore ${response.status}: ${errorText}`);
        }

        alert("Documento modificato con successo!");
      }

      closeModal();
      loadLogisticsData(); // Ricarica i dati
      loadStats(); // Ricarica le statistiche

    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore durante il salvataggio del documento");
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (confirm("Sei sicuro di voler eliminare questo documento?")) {
      try {
        const response = await fetch(`${API_URL}/api/logistic/${documentId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Errore ${response.status}`);
        }

        alert("Documento eliminato con successo!");
        loadLogisticsData(); // Ricarica i dati
        loadStats(); // Ricarica le statistiche
      } catch (error) {
        console.error("Errore durante l'eliminazione:", error);
        alert("Errore durante l'eliminazione del documento");
      }
    }
  };

  // Funzione per aggiornare lo stato del documento
  const handleUpdateStatus = async (documentId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/logistic/${documentId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          transportStatus: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      alert("Stato aggiornato con successo!");
      loadLogisticsData();
      loadStats();
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato:", error);
      alert("Errore durante l'aggiornamento dello stato");
    }
  };


  const handlePrintDocument = async (document: TransportDocument) => {
    const detailed = await fetchDocumentDetails(document);
    setPrintDocument(detailed);
    setShowPrintModal(true);
  };

  // Funzione per eseguire la stampa effettiva
  const executePrint = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const printContent = document.querySelector(`.ddtSheet`);

      if (!printContent) {
        console.error("Elemento da stampare non trovato");
        alert("Errore: impossibile trovare il contenuto da stampare");
        return;
      }

      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (!printWindow) {
        alert("Errore: impossibile aprire la finestra di stampa. Verifica che i popup siano consentiti.");
        return;
      }

      const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((link) => `<link rel="stylesheet" href="${(link as HTMLLinkElement).href}">`)
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
        <title>DDT - ${printDocument?.documentCode || ""}</title>
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

      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
    } catch (error) {
      console.error("Errore durante la stampa:", error);
      alert("Si è verificato un errore durante la preparazione della stampa.");
    }
  };

  // Funzioni di utility
  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const getDocTypeInfo = (type: string) => {
    return documentTypes.find((dt) => dt.value === type) || documentTypes[0];
  };

  const getStatusInfo = (status: string) => {
    return statuses.find((s) => s.value === status) || statuses[0];
  };

  // Statistiche calcolate localmente come fallback
  const localStats = useMemo(() => {
    const total = documents.length;
    const inTransit = documents.filter(
      (doc) => doc.transportStatus === "IN_TRANSIT"
    ).length;
    const delivered = documents.filter(
      (doc) => doc.transportStatus === "DELIVERED"
    ).length;
    const pending = documents.filter(
      (doc) => doc.transportStatus === "DRAFT" || doc.transportStatus === "CONFIRMED"
    ).length;
    const totalValue = documents.reduce((sum, doc) => sum + (doc.totalValue || 0), 0);

    return { total, inTransit, delivered, pending, totalValue };
  }, [documents]);

  // Usa le statistiche dall'API se disponibili, altrimenti usa quelle locali
  const displayStats = stats || {
    totalDocuments: localStats.total,
    inTransitCount: localStats.inTransit,
    deliveredCount: localStats.delivered,
    draftCount: localStats.pending,
    confirmedCount: 0,
    cancelledCount: 0,
    totalValue: localStats.totalValue,
    documentsThisMonth: 0,
    documentsThisWeek: 0,
  };

  // Rendering condizionale per loading e errori
  if (loading) {
    return (
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Caricamento documenti logistica...</span>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />
          <div className="error-container">
            <h2>⛔ Errore nel caricamento</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadLogisticsData}>
              Riprova
            </button>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout">
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className="content-area">
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className="scheda-header">
          <div className="left-block">
            <div className="logistics-icon-btn">
              <Truck className="logistics-icon" />
            </div>
            <div className="logistics-info">
              <h2 className="logistics-title">Gestione Logistica</h2>
              <p className="logistics-subtitle">Documenti di Trasporto</p>
            </div>
            <div className="stats-box">
              <BarChart3 className="stats-icon" />
              <div className="stats-text">
                <span>{displayStats.totalDocuments} Documenti Totali</span>
                <span>€ {displayStats.totalValue.toFixed(2)} Valore</span>
              </div>
            </div>
          </div>

          <div className="breadcrumb">
            <span className="breadcrumb-item">Roma - Next srl</span>
            <span className="breadcrumb-separator"> &gt; </span>
            <span className="breadcrumb-current">Gestione Logistica</span>
          </div>
        </div>

        <div className="page-body">
          <div className="logistics-container">
            {/* Header della pagina */}
            <div className="page-title">
              <h1>
                <Truck style={{ width: "32px", height: "32px" }} />
                Gestione Logistica
              </h1>
              <p>Documenti di trasporto, DDT e gestione spedizioni</p>
            </div>

            {/* Statistiche rapide */}
            <div className="quick-stats">
              <div className="stat-card">
                <h3 className="stat-number">{displayStats.draftCount + displayStats.confirmedCount}</h3>
                <p className="stat-label">In Preparazione</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#ffc107" }}>
                  {displayStats.inTransitCount}
                </h3>
                <p className="stat-label">In Transito</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#28a745" }}>
                  {displayStats.deliveredCount}
                </h3>
                <p className="stat-label">Consegnati</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#17a2b8" }}>
                  € {displayStats.totalValue.toFixed(0)}
                </h3>
                <p className="stat-label">Valore Totale</p>
              </div>
            </div>

            {/* Layout principale */}
            <div className="logistics-layout">
              {/* Sidebar filtri */}
              <div className="filters-sidebar">
                <div className="filter-section">
                  <h3>🔍 Ricerca</h3>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca per numero, cliente, fornitore..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-section">
                  <h3>📄 Tipo Documento</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                    >
                      <option value="">Tutti i tipi</option>
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>📊 Stato</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="">Tutti gli stati</option>
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>📅 Periodo</h3>
                  <div className="form-group">
                    <label>Da:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dateRange.from}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, from: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>A:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dateRange.to}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, to: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Area principale */}
              <div className="main-area">
                {/* Toolbar */}
                <div className="logistics-toolbar">
                  <div className="search-bar">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Ricerca rapida nei documenti..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Selettore visualizzazione */}
                  <div className="view-selector">
                    <button
                      className={`view-btn ${
                        viewMode === "grid" ? "active" : ""
                      }`}
                      onClick={() => setViewMode("grid")}
                      title="Vista Griglia"
                    >
                      <Grid3X3 className="view-icon" />
                    </button>
                    <button
                      className={`view-btn ${
                        viewMode === "list" ? "active" : ""
                      }`}
                      onClick={() => setViewMode("list")}
                      title="Vista Lista"
                    >
                      <List className="view-icon" />
                    </button>
                  </div>

                  <div className="toolbar-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => openModal("add")}
                    >
                      Nuovo Documento
                    </button>
                  </div>
                </div>

                {/* Area contenuto - Vista condizionale */}
                {viewMode === "grid" ? (
                  /* Griglia documenti */
                  <div className="ddts-grid">
                    {filteredDocuments.map((document) => {
                      const docTypeInfo = getDocTypeInfo(document.documentType);
                      const statusInfo = getStatusInfo(document.transportStatus);

                      return (
                        <div key={document.id} className="ddt-card">
                          <div className="ddt-header">
                            <div
                              className={`document-icon ${document.documentType.toLowerCase()}`}
                            >
                              {docTypeInfo.icon}
                            </div>
                            <div className="ddt-info">
                              <div className="document-number">
                                {document.documentCode}
                              </div>
                              <h4 className="document-type">
                                {docTypeInfo.label}
                              </h4>
                              <p className="ddt-date">
                                {new Date(document.documentDate).toLocaleDateString(
                                  "it-IT"
                                )}
                              </p>
                            </div>
                            <div
                              className={`status-badge ${document.transportStatus.toLowerCase()}`}
                              style={{
                                backgroundColor: statusInfo.color + "20",
                                color: statusInfo.color,
                              }}
                            >
                              {statusInfo.label}
                            </div>
                          </div>

                          <div className="document-details">
                            {document.customerName && (
                              <div className="document-row">
                                <span className="document-label">Cliente:</span>
                                <span className="document-value">
                                  {document.customerName}
                                </span>
                              </div>
                            )}
                            {document.supplierName && (
                              <div className="document-row">
                                <span className="document-label">
                                  Fornitore:
                                </span>
                                <span className="document-value">
                                  {document.supplierName}
                                </span>
                              </div>
                            )}
                            {document.laboratoryName && (
                              <div className="document-row">
                                <span className="document-label">
                                  Laboratorio:
                                </span>
                                <span className="document-value">
                                  {document.laboratoryName}
                                </span>
                              </div>
                            )}
                            {document.courierName && (
                              <div className="document-row">
                                <span className="document-label">
                                  Corriere:
                                </span>
                                <span className="document-value">
                                  {document.courierName}
                                </span>
                              </div>
                            )}
                            <div className="document-row">
                              <span className="document-label">Articoli:</span>
                              <span className="document-value">
                                {document.totalItems} pz
                              </span>
                            </div>
                            {document.totalValue > 0 && (
                              <div className="document-row">
                                <span className="document-label">Valore:</span>
                                <span className="price-value">
                                  € {document.totalValue.toFixed(2)}
                                </span>
                              </div>
                            )}

                            <div className="ddt-actions">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => openModal("view", document)}
                              >
                                Dettagli
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => openModal("edit", document)}
                              >
                                Modifica
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handlePrintDocument(document)}
                              >
                                Stampa
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() =>
                                  handleDeleteDocument(document.id)
                                }
                              >
                                Elimina
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Vista Lista */
                  <div className="ddts-table-container">
                    <table className="ddts-table">
                      <thead>
                        <tr>
                          <th>Numero</th>
                          <th>Tipo</th>
                          <th>Data</th>
                          <th>Cliente/Fornitore</th>
                          <th>Stato</th>
                          <th>Articoli</th>
                          <th>Valore</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((document) => {
                          const docTypeInfo = getDocTypeInfo(
                            document.documentType
                          );
                          const statusInfo = getStatusInfo(document.transportStatus);

                          return (
                            <tr key={document.id} className="table-row">
                              <td className="table-ddt-number">
                                {document.documentCode}
                              </td>
                              <td>
                                <span
                                  className="type-badge"
                                  style={{
                                    backgroundColor: docTypeInfo.color + "20",
                                    color: docTypeInfo.color,
                                  }}
                                >
                                  {docTypeInfo.icon} {docTypeInfo.label}
                                </span>
                              </td>
                              <td>
                                {new Date(document.documentDate).toLocaleDateString(
                                  "it-IT"
                                )}
                              </td>
                              <td>
                                {document.customerName ||
                                  document.supplierName ||
                                  document.laboratoryName ||
                                  "-"}
                              </td>
                              <td>
                                <select
                                  className="status-select"
                                  value={document.transportStatus}
                                  onChange={(e) => handleUpdateStatus(document.id, e.target.value)}
                                  style={{
                                    backgroundColor: statusInfo.color + "20",
                                    color: statusInfo.color,
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                  }}
                                >
                                  {statuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>{document.totalItems}</td>
                              <td className="table-amount">
                                {document.totalValue > 0
                                  ? `€ ${document.totalValue.toFixed(2)}`
                                  : "-"}
                              </td>
                              <td className="table-actions">
                                <button
                                  className="action-btn btn-view"
                                  onClick={() => openModal("view", document)}
                                  title="Visualizza"
                                >
                                  👁️
                                </button>
                                <button
                                  className="action-btn btn-edit"
                                  onClick={() => openModal("edit", document)}
                                  title="Modifica"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="action-btn btn-print"
                                  onClick={() => handlePrintDocument(document)}
                                  title="Stampa"
                                >
                                  🖨️
                                </button>
                                <button
                                  className="action-btn btn-delete"
                                  onClick={() =>
                                    handleDeleteDocument(document.id)
                                  }
                                  title="Elimina"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Messaggio se non ci sono risultati */}
                {filteredDocuments.length === 0 && (
                  <div className="error-container">
                    <h2>📄 Nessun documento trovato</h2>
                    <p>
                      Modifica i filtri di ricerca o crea un nuovo documento di
                      trasporto
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal per gestione documenti */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div className="modal-content modal-large">
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalMode === "add" && "➕ Nuovo Documento"}
                  {modalMode === "edit" && "✏️ Modifica Documento"}
                  {modalMode === "view" && "👁️ Dettagli Documento"}
                </h3>
                <button className="modal-close" onClick={closeModal}>
                  <X />
                </button>
              </div>

              <div
                className="modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                {/* Dati generali */}
                <div className="form-section">
                  <h4>📄 Dati Generali</h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div className="form-group">
                      <label>Numero Documento</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.documentNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            documentNumber: e.target.value,
                          })
                        }
                        placeholder="Lascia vuoto per auto-generazione"
                        readOnly={modalMode === "view"}
                      />
                    </div>

                    <div className="form-group">
                      <label>Tipo Documento *</label>
                      <select
                        className="form-control"
                        value={formData.documentType}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (isValidDocumentType(value)) {
                            setFormData({
                              ...formData,
                              documentType: value,
                            });
                          }
                        }}
                        disabled={modalMode === "view"}
                      >
                        {documentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Data *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        readOnly={modalMode === "view"}
                      />
                    </div>

                    {/* Campi condizionali in base al tipo documento */}
                    {(formData.documentType === "PURCHASE" ||
                      formData.documentType === "DDT_IN") && (
                      <div className="form-group">
                        <label>Fornitore *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.supplier}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              supplier: e.target.value,
                            })
                          }
                          placeholder="Nome fornitore"
                          readOnly={modalMode === "view"}
                        />
                      </div>
                    )}

                    {formData.documentType === "SALE" && (
                      <div className="form-group">
                        <label>Cliente *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.customer}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customer: e.target.value,
                            })
                          }
                          placeholder="Nome cliente"
                          readOnly={modalMode === "view"}
                        />
                      </div>
                    )}

                    {(formData.documentType === "DDT_OUT" ||
                      formData.documentType === "DDT_IN") && (
                      <div className="form-group">
                        <label>Destinatario *</label>
                        <div className="customer-search">
                          <input
                            type="text"
                            className="form-control"
                            value={destinatarioQuery}
                            onChange={(e) =>
                              handleDestinatarioSearchChange(e.target.value)
                            }
                            placeholder="Cerca cliente"
                            readOnly={modalMode === "view"}
                          />
                          {destinatarioLoading && (
                            <div className="customer-loading">Ricerca...</div>
                          )}
                          {showDestinatarioDropdown &&
                            destinatarioResults.length > 0 &&
                            modalMode !== "view" && (
                              <div className="customer-dropdown">
                                {destinatarioResults.map((customer) => (
                                  <button
                                    key={customer.id}
                                    type="button"
                                    className="customer-option"
                                    onClick={() => selectDestinatario(customer)}
                                  >
                                    <div className="customer-option-title">
                                      {getCustomerDisplayName(customer)}
                                    </div>
                                    <div className="customer-option-subtitle">
                                      {customer.indirizzo} - {customer.citta}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                        {selectedDestinatario && (
                          <div className="customer-selected">
                            <strong>{getCustomerDisplayName(selectedDestinatario)}</strong>
                            <small>
                              {selectedDestinatario.indirizzo} - {selectedDestinatario.citta}
                            </small>
                          </div>
                        )}
                      </div>
                    )}

                    {(formData.documentType === "DDT_OUT" ||
                      formData.documentType === "DDT_IN") && (
                      <div className="form-group">
                        <label>Luogo di destinazione *</label>
                        <div className="customer-search">
                          <input
                            type="text"
                            className="form-control"
                            value={destinazioneQuery}
                            onChange={(e) =>
                              handleDestinazioneSearchChange(e.target.value)
                            }
                            placeholder="Cerca cliente"
                            readOnly={modalMode === "view"}
                          />
                          {destinazioneLoading && (
                            <div className="customer-loading">Ricerca...</div>
                          )}
                          {showDestinazioneDropdown &&
                            destinazioneResults.length > 0 &&
                            modalMode !== "view" && (
                              <div className="customer-dropdown">
                                {destinazioneResults.map((customer) => (
                                  <button
                                    key={customer.id}
                                    type="button"
                                    className="customer-option"
                                    onClick={() => selectDestinazione(customer)}
                                  >
                                    <div className="customer-option-title">
                                      {getCustomerDisplayName(customer)}
                                    </div>
                                    <div className="customer-option-subtitle">
                                      {customer.indirizzo} - {customer.citta}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                        {selectedDestinazione && (
                          <div className="customer-selected">
                            <strong>{getCustomerDisplayName(selectedDestinazione)}</strong>
                            <small>
                              {selectedDestinazione.indirizzo} - {selectedDestinazione.citta}
                            </small>
                          </div>
                        )}
                      </div>
                    )}

                    {(formData.documentType === "REPAIR_IN" ||
                      formData.documentType === "REPAIR_OUT") && (
                      <div className="form-group">
                        <label>Laboratorio *</label>
                        <select
                          className="form-control"
                          value={formData.laboratory}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              laboratory: e.target.value,
                            })
                          }
                          disabled={modalMode === "view"}
                        >
                          <option value="">Seleziona laboratorio</option>
                          {laboratories.map((lab) => (
                            <option key={lab.id} value={lab.id.toString()}>
                              {lab.name} - {lab.city}{" "}
                              {lab.isAffiliate ? "(Affiliato)" : "(Interno)"}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(formData.documentType === "DDT_OUT" ||
                      formData.documentType === "REPAIR_OUT" ||
                      formData.documentType === "REPAIR_IN") && (
                      <div className="form-group">
                        <label>Corriere</label>
                        <select
                          className="form-control"
                          value={formData.courier}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              courier: e.target.value,
                            })
                          }
                          disabled={modalMode === "view"}
                        >
                          <option value="">Seleziona corriere</option>
                          {couriers
                            .filter((courier) => courier.isActive)
                            .map((courier) => (
                              <option key={courier.id} value={courier.id.toString()}>
                                {courier.name} {courier.contactPhone ? `- ${courier.contactPhone}` : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Note</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Note aggiuntive sul documento"
                      readOnly={modalMode === "view"}
                    />
                  </div>
                </div>

                {/* Sezione Articoli (per documenti che non sono REPAIR) */}
                {!formData.documentType.includes("REPAIR") && (
                  <div className="form-section">
                    <h4>📦 Articoli/Componenti</h4>

                    {modalMode !== "view" && (
                      <div className="material-actions">
                        <div className="material-select">
                          <label>Tipo materiale</label>
                          <select
                            className="form-control"
                            value={materialSource}
                            onChange={(e) =>
                              setMaterialSource(e.target.value as MaterialSource)
                            }
                          >
                            <option value="">Seleziona tipo</option>
                            <option value="repairs">Riparazioni</option>
                            <option value="devices">Apparati</option>
                            <option value="parts">Ricambi</option>
                            <option value="accessories">Accessori</option>
                          </select>
                        </div>
                        <button
                          className="btn btn-secondary"
                          onClick={() => openMaterialModal()}
                          style={{ marginBottom: "16px" }}
                        >
                          <Plus className="btn-icon" />
                          Aggiungi Articoli
                        </button>
                      </div>
                    )}

                    {selectedItems.length > 0 ? (
                      <div className="items-list">
                        {selectedItems.map((item, index) => (
                          <div key={item.id} className="item-row">
                            <div className="item-details">
                              <strong>{item.itemName}</strong>
                              <span>{item.description}</span>
                              <small>Codice: {item.itemCode}</small>
                            </div>
                            <div className="item-quantity">
                              Qty: {item.quantity}
                            </div>
                            <div className="item-price">
                              € {item.totalPrice.toFixed(2)}
                            </div>
                            {modalMode !== "view" && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setSelectedItems((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                <X />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-list">
                        <p>Nessun articolo selezionato</p>
                      </div>
                    )}

                    {selectedRepairs.length > 0 && (
                      <div className="repairs-list">
                        {selectedRepairs.map((repair, index) => (
                          <div key={repair.id} className="repair-row">
                            <div className="repair-details">
                              <strong>{repair.repairCode}</strong>
                              <span>
                                {repair.deviceBrand} {repair.deviceModel}
                              </span>
                              <small>Cliente: {repair.customerName}</small>
                            </div>
                            {modalMode !== "view" && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setSelectedRepairs((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                <X />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sezione Riparazioni (per documenti REPAIR) */}
                {formData.documentType.includes("REPAIR") && (
                  <div className="form-section">
                    <h4>🔧 Riparazioni</h4>

                    {modalMode !== "view" && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => openMaterialModal("repairs")}
                        style={{ marginBottom: "16px" }}
                      >
                        <Smartphone className="btn-icon" />
                        Seleziona Riparazioni
                      </button>
                    )}

                    {selectedRepairs.length > 0 ? (
                      <div className="repairs-list">
                        {selectedRepairs.map((repair, index) => (
                          <div key={repair.id} className="repair-row">
                            <div className="repair-details">
                              <strong>{repair.repairCode}</strong>
                              <span>
                                {repair.deviceBrand} {repair.deviceModel}
                              </span>
                              <small>Cliente: {repair.customerName}</small>
                              <small>Problema: {repair.faultDescription}</small>
                            </div>
                            <div className="repair-priority">
                              <span
                                className={`priority-badge priority-${repair.priority.toLowerCase()}`}
                              >
                                {repair.priority}
                              </span>
                            </div>
                            {modalMode !== "view" && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setSelectedRepairs((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                <X />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-list">
                        <p>Nessuna riparazione selezionata</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Riepilogo */}
                <div className="form-section">
                  <h4>📊 Riepilogo</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <label>Totale Articoli:</label>
                      <span>
                        {selectedItems.length + selectedRepairs.length}
                      </span>
                    </div>
                    <div className="summary-item">
                      <label>Valore Totale:</label>
                      <span className="price-value">
                        €{" "}
                        {selectedItems
                          .reduce((sum, item) => sum + item.totalPrice, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeModal}>
                  {modalMode === "view" ? "Chiudi" : "Annulla"}
                </button>
                {modalMode !== "view" && (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handlePrintDocument(selectedDocument!)}
                    >
                      <Printer className="btn-icon" />
                      Anteprima Stampa
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveDocument}
                    >
                      {modalMode === "add"
                        ? "Crea Documento"
                        : "Salva Modifiche"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Modal per selezione materiali */}
        {showMaterialSearch && (
          <div className="modal-overlay" onClick={closeMaterialModal}>
            <div
              className="modal-content modal-large"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Seleziona Materiale</h3>
                <button className="modal-close" onClick={closeMaterialModal}>
                  <X />
                </button>
              </div>
              <div className="modal-body">
                <div className="material-modal-toolbar">
                  <div className="form-group">
                    <label>Tipo materiale</label>
                    <select
                      className="form-control"
                      value={materialSource}
                      onChange={(e) =>
                        setMaterialSource(e.target.value as MaterialSource)
                      }
                    >
                      <option value="">Seleziona tipo</option>
                      <option value="repairs">Riparazioni</option>
                      <option value="devices">Apparati</option>
                      <option value="parts">Ricambi</option>
                      <option value="accessories">Accessori</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cerca</label>
                    <input
                      className="form-control"
                      value={materialSearch}
                      onChange={(event) => setMaterialSearch(event.target.value)}
                      placeholder="Cerca per codice, nome o modello"
                    />
                  </div>
                </div>

                {materialLoading && (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <span>Caricamento materiali...</span>
                  </div>
                )}

                {materialError && !materialLoading && (
                  <div className="error-container">
                    <h2>Errore</h2>
                    <p>{materialError}</p>
                  </div>
                )}

                {!materialLoading && !materialError && materialSource === "repairs" && (
                  <>
                    {filteredRepairs.length > 0 ? (
                      <div className="material-list">
                        <div className="material-list-header repairs-header">
                          <span>Seleziona</span>
                          <span>Riparazione</span>
                          <span>Cliente</span>
                          <span>Stato</span>
                        </div>
                        {filteredRepairs.map((repair) => {
                          const key = buildSelectionKey("repairs", repair.id);
                          const isSelected = Boolean(materialSelections[key]);
                          return (
                            <div
                              key={repair.id}
                              className={`material-row repairs ${isSelected ? "selected" : ""}`}
                            >
                              <label className="material-checkbox">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMaterialSelection(key, 1)}
                                />
                              </label>
                              <div className="material-main">
                                <div className="material-title">{repair.repairCode}</div>
                                <div className="material-subtitle">
                                  {repair.device?.brand} {repair.device?.model}
                                </div>
                              </div>
                              <div className="material-meta">
                                {repair.customer?.name || "-"}
                              </div>
                              <div className="material-status">
                                {repair.repairStatus || "-"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty-list">
                        <p>Nessuna riparazione completata disponibile</p>
                      </div>
                    )}
                  </>
                )}

                {!materialLoading && !materialError && materialSource === "devices" && (
                  <>
                    {filteredDevices.length > 0 ? (
                      <div className="material-list">
                        <div className="material-list-header">
                          <span>Seleziona</span>
                          <span>Apparato</span>
                          <span>Identificativo</span>
                          <span>Quantità</span>
                        </div>
                        {filteredDevices.map((device) => {
                          const key = buildSelectionKey("devices", device.id);
                          const isSelected = Boolean(materialSelections[key]);
                          return (
                            <div
                              key={device.id}
                              className={`material-row ${isSelected ? "selected" : ""}`}
                            >
                              <label className="material-checkbox">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMaterialSelection(key, 1)}
                                />
                              </label>
                              <div className="material-main">
                                <div className="material-title">
                                  {device.brand} {device.model}
                                </div>
                                <div className="material-subtitle">{device.code}</div>
                              </div>
                              <div className="material-meta">
                                {device.imei || device.serialNumber || "-"}
                              </div>
                              <div className="material-qty">
                                <input
                                  className="form-control"
                                  type="number"
                                  min={1}
                                  value={1}
                                  disabled
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty-list">
                        <p>Nessun apparato disponibile</p>
                      </div>
                    )}
                  </>
                )}

                {!materialLoading && !materialError && materialSource === "parts" && (
                  <>
                    {filteredParts.length > 0 ? (
                      <div className="material-list">
                        <div className="material-list-header">
                          <span>Seleziona</span>
                          <span>Ricambio</span>
                          <span>Disponibilità</span>
                          <span>Quantità</span>
                        </div>
                        {filteredParts.map((part) => {
                          const key = buildSelectionKey("parts", part.id);
                          const isSelected = Boolean(materialSelections[key]);
                          const maxQty = Math.max(1, part.quantity || 1);
                          return (
                            <div
                              key={part.id}
                              className={`material-row ${isSelected ? "selected" : ""}`}
                            >
                              <label className="material-checkbox">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMaterialSelection(key, 1)}
                                />
                              </label>
                              <div className="material-main">
                                <div className="material-title">{part.name}</div>
                                <div className="material-subtitle">{part.code}</div>
                              </div>
                              <div className="material-meta">Stock: {part.quantity}</div>
                              <div className="material-qty">
                                <input
                                  className="form-control"
                                  type="number"
                                  min={1}
                                  max={maxQty}
                                  value={materialSelections[key] || 1}
                                  disabled={!isSelected}
                                  onChange={(event) =>
                                    updateMaterialQuantity(
                                      key,
                                      Math.min(
                                        maxQty,
                                        Number(event.target.value) || 1
                                      )
                                    )
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty-list">
                        <p>Nessun ricambio disponibile</p>
                      </div>
                    )}
                  </>
                )}

                {!materialLoading && !materialError && materialSource === "accessories" && (
                  <>
                    {filteredAccessories.length > 0 ? (
                      <div className="material-list">
                        <div className="material-list-header">
                          <span>Seleziona</span>
                          <span>Accessorio</span>
                          <span>Disponibilità</span>
                          <span>Quantità</span>
                        </div>
                        {filteredAccessories.map((accessory) => {
                          const key = buildSelectionKey("accessories", accessory.id);
                          const isSelected = Boolean(materialSelections[key]);
                          const maxQty = Math.max(1, accessory.quantityInStock || 1);
                          return (
                            <div
                              key={accessory.id}
                              className={`material-row ${isSelected ? "selected" : ""}`}
                            >
                              <label className="material-checkbox">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMaterialSelection(key, 1)}
                                />
                              </label>
                              <div className="material-main">
                                <div className="material-title">
                                  {accessory.brand} {accessory.model}
                                </div>
                                <div className="material-subtitle">{accessory.code}</div>
                              </div>
                              <div className="material-meta">
                                Stock: {accessory.quantityInStock}
                              </div>
                              <div className="material-qty">
                                <input
                                  className="form-control"
                                  type="number"
                                  min={1}
                                  max={maxQty}
                                  value={materialSelections[key] || 1}
                                  disabled={!isSelected}
                                  onChange={(event) =>
                                    updateMaterialQuantity(
                                      key,
                                      Math.min(
                                        maxQty,
                                        Number(event.target.value) || 1
                                      )
                                    )
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty-list">
                        <p>Nessun accessorio disponibile</p>
                      </div>
                    )}
                  </>
                )}

                {!materialLoading && !materialError && !materialSource && (
                  <div className="empty-list">
                    <p>Seleziona un tipo di materiale per visualizzare i dati.</p>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeMaterialModal}>
                  Chiudi
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleConfirmMaterialSelection}
                  disabled={Object.keys(materialSelections).length === 0}
                >
                  Conferma Selezione
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Stampa DDT - Layout KLABIT */}
        {showPrintModal && printDocument && (
          <div
            className="modal-overlay print-modal-overlay"
            onClick={() => {
              setShowPrintModal(false);
              setPrintDocument(null);
            }}
          >
            <div className="print-modal-content" onClick={(e) => e.stopPropagation()}>
              {/* AREA CHE SI STAMPA */}
              <div className="ddtSheet">
                {/* Layout principale DDT stile KLABIT */}
                <div className="ddt-main-layout">
                  {/* Colonna sinistra - Dati azienda mittente */}
                  <div className="ddt-left-column">
                    <div className="ddt-company-box">
                      <div className="ddt-company-logo">
                        <Truck size={32} />
                      </div>
                      <div className="ddt-company-name">{companyName}</div>
                      <div className="ddt-company-details">
                        {companyAddress && <div>{companyAddress}</div>}
                        {companyCity && <div>{companyCity}</div>}
                        {companyPhone && <div>{companyPhone}</div>}
                        {companyEmail && <div>{companyEmail}</div>}
                        {companyVat && <div>{companyVat}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Colonna destra - Info documento */}
                  <div className="ddt-right-column">
                    <div className="ddt-doc-header-box">
                      <div className="ddt-doc-title">DOCUMENTO DI TRASPORTO</div>
                      <div className="ddt-doc-law">D.P.R. 472 DEL 14/08/1996</div>
                    </div>

                    <div className="ddt-doc-info-box">
                      <div className="ddt-info-row">
                        <span className="ddt-info-label">N.Progressivo Attribuito</span>
                        <span className="ddt-info-value">{printDocument.documentCode}</span>
                      </div>
                      <div className="ddt-info-row">
                        <span className="ddt-info-label">BENI VIAGGIANTI MEZZO:</span>
                      </div>
                      <div className="ddt-checkbox-row">
                        <label className="ddt-checkbox">
                          <input type="checkbox" checked={printDocument.carrierType === "VETTORE" || (!printDocument.carrierType && printDocument.courierName ? true : false)} readOnly />
                          <span>VETTORE</span>
                        </label>
                        <label className="ddt-checkbox">
                          <input type="checkbox" checked={printDocument.carrierType === "MITTENTE" || (!printDocument.carrierType && !printDocument.courierName)} readOnly />
                          <span>MITTENTE</span>
                        </label>
                        <label className="ddt-checkbox">
                          <input type="checkbox" checked={printDocument.carrierType === "DESTINATARIO"} readOnly />
                          <span>DESTINATARIO</span>
                        </label>
                      </div>
                      <div className="ddt-info-row ddt-date-row">
                        <span className="ddt-info-label">Data</span>
                        <span className="ddt-info-value">{new Date(printDocument.documentDate).toLocaleDateString("it-IT")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sezione Destinatario e Luogo di Destinazione */}
                <div className="ddt-address-section">
                  <div className="ddt-address-box">
                    <div className="ddt-address-title">DESTINATARIO</div>
                    <div className="ddt-address-content">
                      <div className="ddt-address-name">
                        {printDocument.destinatarioName ||
                          printDocument.customerName ||
                          printDocument.supplierName ||
                          printDocument.laboratoryName ||
                          "-"}
                      </div>
                      <div className="ddt-address-line">{printDocument.destinatarioAddress || ""}</div>
                      <div className="ddt-address-city">{printDocument.destinatarioCity || ""}</div>
                    </div>
                  </div>
                  <div className="ddt-address-box">
                    <div className="ddt-address-title">LUOGO DI DESTINAZIONE</div>
                    <div className="ddt-address-content">
                      <div className="ddt-address-name">
                        {printDocument.luogoDestinazioneName ||
                          printDocument.destinatarioName ||
                          printDocument.customerName ||
                          printDocument.supplierName ||
                          printDocument.laboratoryName ||
                          "-"}
                      </div>
                      <div className="ddt-address-line">{printDocument.luogoDestinazioneAddress || printDocument.destinatarioAddress || ""}</div>
                      <div className="ddt-address-city">{printDocument.luogoDestinazioneCity || printDocument.destinatarioCity || ""}</div>
                    </div>
                  </div>
                </div>

                {/* Sezione Causale del Trasporto */}
                <div className="ddt-causale-section">
                  <div className="ddt-causale-left">
                    <div className="ddt-causale-title">CAUSALE DEL TRASPORTO</div>
                    <div className="ddt-causale-value">
                      {printDocument.documentType === "DDT_OUT" && "VENDITA"}
                      {printDocument.documentType === "DDT_IN" && "ACQUISTO"}
                      {printDocument.documentType === "REPAIR_OUT" && "RIPARAZIONE IN GARANZIA"}
                      {printDocument.documentType === "REPAIR_IN" && "RESO DA RIPARAZIONE"}
                      {printDocument.documentType === "PURCHASE" && "ACQUISTO MERCE"}
                      {printDocument.documentType === "SALE" && "VENDITA MERCE"}
                    </div>
                  </div>
                  <div className="ddt-causale-right">
                    <div className="ddt-order-info">
                      <span className="ddt-order-label">vs.Ordine</span>
                      <span className="ddt-order-value">{printDocument.orderReference || ""}</span>
                      <span className="ddt-order-label">del</span>
                      <span className="ddt-order-value">{printDocument.orderDate ? new Date(printDocument.orderDate).toLocaleDateString("it-IT") : ""}</span>
                    </div>
                    <div className="ddt-payment-checkboxes">
                      <label className="ddt-checkbox">
                        <input type="checkbox" checked={printDocument.paymentType === "IN_CONTO"} readOnly />
                        <span>In Conto</span>
                      </label>
                      <label className="ddt-checkbox">
                        <input type="checkbox" checked={printDocument.paymentType === "A_SALDO"} readOnly />
                        <span>A Saldo</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tabella Articoli - stile KLABIT */}
                <div className="ddt-items-section">
                  <table className="ddt-items-table">
                    <thead>
                      <tr>
                        <th className="ddt-th" style={{width: '150px'}}>Codice/Modello</th>
                        <th className="ddt-th">Descrizione</th>
                        <th className="ddt-th" style={{width: '50px', textAlign: 'center'}}>UM</th>
                        <th className="ddt-th" style={{width: '70px', textAlign: 'center'}}>Quantità</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printDocument.items && printDocument.items.length > 0 ? (
                        printDocument.items.map((item, index) => (
                          <tr key={index}>
                            <td className="ddt-td">{item.itemCode}</td>
                            <td className="ddt-td">{item.itemName}</td>
                            <td className="ddt-td" style={{textAlign: 'center'}}>PZ</td>
                            <td className="ddt-td" style={{textAlign: 'center'}}>{item.quantity}</td>
                          </tr>
                        ))
                      ) : printDocument.repairItems && printDocument.repairItems.length > 0 ? (
                        printDocument.repairItems.map((repair, index) => (
                          <tr key={index}>
                            <td className="ddt-td">{repair.repairCode}</td>
                            <td className="ddt-td">{repair.deviceBrand} {repair.deviceModel} - {repair.customerName}</td>
                            <td className="ddt-td" style={{textAlign: 'center'}}>PZ</td>
                            <td className="ddt-td" style={{textAlign: 'center'}}>1</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="ddt-td" colSpan={4} style={{textAlign: 'center', color: '#999'}}>
                            Nessun articolo
                          </td>
                        </tr>
                      )}
                      {/* Righe vuote per spazio */}
                      {Array.from({ length: Math.max(0, 8 - (printDocument.items?.length || 0) - (printDocument.repairItems?.length || 0)) }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          <td className="ddt-td">&nbsp;</td>
                          <td className="ddt-td">&nbsp;</td>
                          <td className="ddt-td">&nbsp;</td>
                          <td className="ddt-td">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sezione inferiore - Dettagli spedizione */}
                <div className="ddt-footer-section">
                  {/* Riga 1: Aspetto, Colli, Peso, Porto */}
                  <div className="ddt-footer-row ddt-shipping-details">
                    <div className="ddt-footer-cell">
                      <span className="ddt-footer-label">ASPETTO ESTERIORE BENI</span>
                      <span className="ddt-footer-value">{printDocument.goodsAppearance || printDocument.packagingType || "SCATOLO"}</span>
                    </div>
                    <div className="ddt-footer-cell">
                      <span className="ddt-footer-label">N-COLLI</span>
                      <span className="ddt-footer-value">{printDocument.numberOfPackages || printDocument.totalItems || 1}</span>
                    </div>
                    <div className="ddt-footer-cell">
                      <span className="ddt-footer-label">PESO KG</span>
                      <span className="ddt-footer-value">{printDocument.weight ? `${printDocument.weight}` : "-"}</span>
                    </div>
                    <div className="ddt-footer-cell">
                      <span className="ddt-footer-label">PORTO</span>
                      <span className="ddt-footer-value">{printDocument.shippingType || "FRANCO"}</span>
                    </div>
                  </div>

                  {/* Riga 2: Vettori e firme */}
                  <div className="ddt-footer-row ddt-carrier-row">
                    <div className="ddt-carrier-info">
                      <span className="ddt-carrier-label">vettori: ditte, domicilio o residenza</span>
                      <div className="ddt-carrier-value">{printDocument.courierName || ""}</div>
                    </div>
                    <div className="ddt-carrier-datetime">
                      <span className="ddt-carrier-label">ora e data del ritiro</span>
                      <div className="ddt-carrier-value">{printDocument.pickupDateTime ? new Date(printDocument.pickupDateTime).toLocaleString("it-IT") : ""}</div>
                    </div>
                    <div className="ddt-signature-cell">
                      <span className="ddt-signature-label">firme</span>
                      <div className="ddt-signature-line"></div>
                    </div>
                  </div>

                  {/* Riga 3: Consegna e firma conducente */}
                  <div className="ddt-footer-row ddt-delivery-row">
                    <div className="ddt-delivery-info">
                      <span className="ddt-carrier-label">consegna o inizio trasporto a mezzo mittente</span>
                      <div className="ddt-delivery-boxes">
                        <div className="ddt-delivery-box"></div>
                        <div className="ddt-delivery-box"></div>
                        <div className="ddt-delivery-box"></div>
                      </div>
                    </div>
                    <div className="ddt-signature-cell">
                      <span className="ddt-signature-label">firma conducente</span>
                      <div className="ddt-signature-line"></div>
                    </div>
                  </div>

                  {/* Riga 4: Annotazioni e firma destinatario */}
                  <div className="ddt-footer-row ddt-notes-row">
                    <div className="ddt-notes-section">
                      <span className="ddt-notes-label">ANNOTAZIONI - VARIAZIONI</span>
                      <div className="ddt-notes-content">{printDocument.notes || ""}</div>
                    </div>
                    <div className="ddt-signature-cell">
                      <span className="ddt-signature-label">firma destinatario</span>
                      <div className="ddt-signature-line"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pulsanti azioni (non stampabili) */}
              <div className="print-modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPrintModal(false);
                    setPrintDocument(null);
                  }}
                >
                  Chiudi
                </button>
                <button className="btn btn-primary" onClick={executePrint}>
                  <Printer size={16} style={{marginRight: '8px'}} />
                  Stampa DDT
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomBar />
      </div>
    </div>
  );
};

export default Logistica;
