import React, { useState, useEffect, useMemo } from "react";
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

// Tipi per i dati
interface TransportDocument {
  id: string;
  documentNumber: string;
  documentType:
    | "DDT_IN"
    | "DDT_OUT"
    | "PURCHASE"
    | "SALE"
    | "REPAIR_IN"
    | "REPAIR_OUT";
  date: string;
  supplier?: string;
  customer?: string;
  laboratory?: string;
  affiliate?: string;
  courier?: string;
  status: "DRAFT" | "CONFIRMED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  totalItems: number;
  totalValue: number;
  notes?: string;
  items: TransportItem[];
  repairItems: RepairTransportItem[];
  createdAt: string;
  updatedAt: string;
}

interface TransportItem {
  id: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  brand: string;
  model: string;
}

interface RepairTransportItem {
  id: string;
  repairId: string;
  repairCode: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  customerName: string;
  faultDescription: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

interface Courier {
  id: string;
  name: string;
  contact: string;
  trackingUrl?: string;
  active: boolean;
}

interface Laboratory {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  contact: string;
  isAffiliate: boolean;
}

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
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showRepairSearch, setShowRepairSearch] = useState(false);

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

  const couriers: Courier[] = [
    {
      id: "1",
      name: "BRT",
      contact: "800-123-456",
      trackingUrl: "https://www.brt.it",
      active: true,
    },
    {
      id: "2",
      name: "GLS",
      contact: "800-234-567",
      trackingUrl: "https://www.gls-group.eu",
      active: true,
    },
    {
      id: "3",
      name: "DHL",
      contact: "800-345-678",
      trackingUrl: "https://www.dhl.it",
      active: true,
    },
    {
      id: "4",
      name: "SDA",
      contact: "800-456-789",
      trackingUrl: "https://www.sda.it",
      active: true,
    },
    {
      id: "5",
      name: "TNT",
      contact: "800-567-890",
      trackingUrl: "https://www.tnt.it",
      active: true,
    },
    {
      id: "6",
      name: "UPS",
      contact: "800-678-901",
      trackingUrl: "https://www.ups.com",
      active: true,
    },
    {
      id: "7",
      name: "FedEx",
      contact: "800-789-012",
      trackingUrl: "https://www.fedex.com",
      active: true,
    },
  ];

  const laboratories: Laboratory[] = [
    {
      id: "1",
      name: "Lab Milano",
      code: "MI001",
      city: "Milano",
      address: "Via Roma 123",
      contact: "02-1234567",
      isAffiliate: false,
    },
    {
      id: "2",
      name: "Lab Napoli",
      code: "NA001",
      city: "Napoli",
      address: "Via Dante 45",
      contact: "081-2345678",
      isAffiliate: false,
    },
    {
      id: "3",
      name: "Affiliato Torino",
      code: "TO001",
      city: "Torino",
      address: "Corso Francia 67",
      contact: "011-3456789",
      isAffiliate: true,
    },
    {
      id: "4",
      name: "Affiliato Firenze",
      code: "FI001",
      city: "Firenze",
      address: "Via Guelfa 89",
      contact: "055-4567890",
      isAffiliate: true,
    },
  ];

  // Dati di esempio
  const sampleDocuments: TransportDocument[] = [
    {
      id: "1",
      documentNumber: "DDT001/2024",
      documentType: "DDT_OUT",
      date: "2024-02-15",
      customer: "TechStore Roma",
      courier: "BRT",
      status: "CONFIRMED",
      totalItems: 15,
      totalValue: 2450.0,
      notes: "Consegna urgente entro venerdì",
      items: [
        {
          id: "1",
          itemCode: "SCR-IP14-BLK",
          itemName: "Schermo iPhone 14",
          description: "Display OLED nero",
          quantity: 5,
          unitPrice: 89.99,
          totalPrice: 449.95,
          category: "screens",
          brand: "Apple",
          model: "iPhone 14",
        },
        {
          id: "2",
          itemCode: "BAT-IP13-PRO",
          itemName: "Batteria iPhone 13 Pro",
          description: "Batteria Li-Ion 3095mAh",
          quantity: 10,
          unitPrice: 45.5,
          totalPrice: 455.0,
          category: "batteries",
          brand: "Apple",
          model: "iPhone 13 Pro",
        },
      ],
      repairItems: [],
      createdAt: "2024-02-15T09:30:00Z",
      updatedAt: "2024-02-15T14:22:00Z",
    },
    {
      id: "2",
      documentNumber: "REP002/2024",
      documentType: "REPAIR_OUT",
      date: "2024-02-14",
      laboratory: "Lab Milano",
      courier: "GLS",
      status: "IN_TRANSIT",
      totalItems: 8,
      totalValue: 0,
      notes: "Riparazioni per laboratorio specializzato",
      items: [],
      repairItems: [
        {
          id: "1",
          repairId: "REP-001",
          repairCode: "REP001/2024",
          deviceBrand: "Samsung",
          deviceModel: "Galaxy S23",
          serialNumber: "SM123456789",
          customerName: "Mario Rossi",
          faultDescription: "Schermo rotto",
          status: "IN_PROGRESS",
          priority: "HIGH",
        },
        {
          id: "2",
          repairId: "REP-002",
          repairCode: "REP002/2024",
          deviceBrand: "iPhone",
          deviceModel: "iPhone 14",
          serialNumber: "IP987654321",
          customerName: "Luigi Verdi",
          faultDescription: "Batteria scarica velocemente",
          status: "PENDING",
          priority: "MEDIUM",
        },
      ],
      createdAt: "2024-02-14T11:15:00Z",
      updatedAt: "2024-02-14T16:45:00Z",
    },
    {
      id: "3",
      documentNumber: "ACQ003/2024",
      documentType: "PURCHASE",
      date: "2024-02-13",
      supplier: "TechParts Italy",
      status: "DELIVERED",
      totalItems: 25,
      totalValue: 1890.5,
      notes: "Ordine ricambi settimanale",
      items: [
        {
          id: "3",
          itemCode: "CAM-SAM-S23",
          itemName: "Fotocamera Samsung S23",
          description: "Fotocamera posteriore 50MP",
          quantity: 15,
          unitPrice: 67.8,
          totalPrice: 1017.0,
          category: "cameras",
          brand: "Samsung",
          model: "Galaxy S23",
        },
      ],
      repairItems: [],
      createdAt: "2024-02-13T08:45:00Z",
      updatedAt: "2024-02-13T18:30:00Z",
    },
  ];

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
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedDocType, selectedStatus, dateRange, documents]);

  // Funzioni per il caricamento dei dati
  const loadLogisticsData = async () => {
    setLoading(true);
    try {
      // Simula chiamata API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setDocuments(sampleDocuments);
      setError(null);
    } catch (err) {
      setError("Errore nel caricamento dei documenti di trasporto");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per i filtri
  const applyFilters = () => {
    let filtered = documents;

    // Filtro ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.documentNumber.toLowerCase().includes(query) ||
          doc.supplier?.toLowerCase().includes(query) ||
          doc.customer?.toLowerCase().includes(query) ||
          doc.laboratory?.toLowerCase().includes(query) ||
          doc.courier?.toLowerCase().includes(query) ||
          doc.notes?.toLowerCase().includes(query)
      );
    }

    // Filtro tipo documento
    if (selectedDocType) {
      filtered = filtered.filter((doc) => doc.documentType === selectedDocType);
    }

    // Filtro stato
    if (selectedStatus) {
      filtered = filtered.filter((doc) => doc.status === selectedStatus);
    }

    // Filtro date
    if (dateRange.from) {
      filtered = filtered.filter((doc) => doc.date >= dateRange.from);
    }
    if (dateRange.to) {
      filtered = filtered.filter((doc) => doc.date <= dateRange.to);
    }

    setFilteredDocuments(filtered);
  };

  // Funzioni per la gestione del modal
  const openModal = (
    mode: "add" | "edit" | "view",
    document?: TransportDocument
  ) => {
    setModalMode(mode);
    setSelectedDocument(document || null);

    if (document && (mode === "edit" || mode === "view")) {
      setFormData({
        documentNumber: document.documentNumber,
        documentType: document.documentType,
        date: document.date,
        supplier: document.supplier || "",
        customer: document.customer || "",
        laboratory: document.laboratory || "",
        affiliate: document.affiliate || "",
        courier: document.courier || "",
        notes: document.notes || "",
      });
      setSelectedItems(document.items);
      setSelectedRepairs(document.repairItems);
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
  };

  const handleSaveDocument = async () => {
    try {
      const totalItems = selectedItems.length + selectedRepairs.length;
      const totalValue = selectedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      if (modalMode === "add") {
        // Genera il numero documento se non fornito
        const finalDocumentNumber =
          formData.documentNumber || `AUTO${Date.now()}`;

        // Logica per aggiungere nuovo documento
        const newDocument: TransportDocument = {
          id: Date.now().toString(),
          ...formData,
          documentNumber: finalDocumentNumber, // Sovrascrive quello in formData
          totalItems,
          totalValue,
          items: selectedItems,
          repairItems: selectedRepairs,
          status: "DRAFT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDocuments((prev) => [newDocument, ...prev]);
      } else if (modalMode === "edit" && selectedDocument) {
        // Logica per modificare documento esistente
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === selectedDocument.id
              ? {
                  ...doc,
                  ...formData,
                  totalItems,
                  totalValue,
                  items: selectedItems,
                  repairItems: selectedRepairs,
                  updatedAt: new Date().toISOString(),
                }
              : doc
          )
        );
      }

      closeModal();
      alert(
        modalMode === "add"
          ? "Documento creato con successo!"
          : "Documento modificato con successo!"
      );
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore durante il salvataggio del documento");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo documento?")) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      alert("Documento eliminato con successo!");
    }
  };

  const handlePrintDocument = (document: TransportDocument) => {
    // Implementa la logica di stampa
    alert(`Stampa documento: ${document.documentNumber}`);
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

  const getCourierName = (courierId: string) => {
    return couriers.find((c) => c.id === courierId)?.name || courierId;
  };

  // Statistiche
  const stats = useMemo(() => {
    const total = documents.length;
    const inTransit = documents.filter(
      (doc) => doc.status === "IN_TRANSIT"
    ).length;
    const delivered = documents.filter(
      (doc) => doc.status === "DELIVERED"
    ).length;
    const pending = documents.filter(
      (doc) => doc.status === "DRAFT" || doc.status === "CONFIRMED"
    ).length;
    const totalValue = documents.reduce((sum, doc) => sum + doc.totalValue, 0);

    return { total, inTransit, delivered, pending, totalValue };
  }, [documents]);

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
                <span>{stats.total} Documenti Totali</span>
                <span>€ {stats.totalValue.toFixed(2)} Valore</span>
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
                <h3 className="stat-number">{stats.pending}</h3>
                <p className="stat-label">In Preparazione</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#ffc107" }}>
                  {stats.inTransit}
                </h3>
                <p className="stat-label">In Transito</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#28a745" }}>
                  {stats.delivered}
                </h3>
                <p className="stat-label">Consegnati</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#17a2b8" }}>
                  € {stats.totalValue.toFixed(0)}
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
                      const statusInfo = getStatusInfo(document.status);

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
                                {document.documentNumber}
                              </div>
                              <h4 className="document-type">
                                {docTypeInfo.label}
                              </h4>
                              <p className="ddt-date">
                                {new Date(document.date).toLocaleDateString(
                                  "it-IT"
                                )}
                              </p>
                            </div>
                            <div
                              className={`status-badge ${document.status.toLowerCase()}`}
                              style={{
                                backgroundColor: statusInfo.color + "20",
                                color: statusInfo.color,
                              }}
                            >
                              {statusInfo.label}
                            </div>
                          </div>

                          <div className="document-details">
                            {document.customer && (
                              <div className="document-row">
                                <span className="document-label">Cliente:</span>
                                <span className="document-value">
                                  {document.customer}
                                </span>
                              </div>
                            )}
                            {document.supplier && (
                              <div className="document-row">
                                <span className="document-label">
                                  Fornitore:
                                </span>
                                <span className="document-value">
                                  {document.supplier}
                                </span>
                              </div>
                            )}
                            {document.laboratory && (
                              <div className="document-row">
                                <span className="document-label">
                                  Laboratorio:
                                </span>
                                <span className="document-value">
                                  {document.laboratory}
                                </span>
                              </div>
                            )}
                            {document.courier && (
                              <div className="document-row">
                                <span className="document-label">
                                  Corriere:
                                </span>
                                <span className="document-value">
                                  {getCourierName(document.courier)}
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
                          const statusInfo = getStatusInfo(document.status);

                          return (
                            <tr key={document.id} className="table-row">
                              <td className="table-ddt-number">
                                {document.documentNumber}
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
                                {new Date(document.date).toLocaleDateString(
                                  "it-IT"
                                )}
                              </td>
                              <td>
                                {document.customer ||
                                  document.supplier ||
                                  document.laboratory ||
                                  "-"}
                              </td>
                              <td>
                                <span
                                  className="status-badge"
                                  style={{
                                    backgroundColor: statusInfo.color + "20",
                                    color: statusInfo.color,
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
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

                    {(formData.documentType === "SALE" ||
                      formData.documentType === "DDT_OUT") && (
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
                            <option key={lab.id} value={lab.id}>
                              {lab.name} - {lab.city}{" "}
                              {lab.isAffiliate ? "(Affiliato)" : "(Interno)"}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formData.documentType === "DDT_OUT" && (
                      <div className="form-group">
                        <label>Corriere *</label>
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
                            .filter((courier) => courier.active)
                            .map((courier) => (
                              <option key={courier.id} value={courier.id}>
                                {courier.name} - {courier.contact}
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
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowItemSearch(true)}
                        style={{ marginBottom: "16px" }}
                      >
                        <Plus className="btn-icon" />
                        Aggiungi Articoli
                      </button>
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
                  </div>
                )}

                {/* Sezione Riparazioni (per documenti REPAIR) */}
                {formData.documentType.includes("REPAIR") && (
                  <div className="form-section">
                    <h4>🔧 Riparazioni</h4>

                    {modalMode !== "view" && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowRepairSearch(true)}
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
        {/* Modal per ricerca articoli */}
        {showItemSearch && (
          <div
            className="modal-overlay"
            onClick={() => setShowItemSearch(false)}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h3>Seleziona Articoli</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowItemSearch(false)}
                >
                  <X />
                </button>
              </div>
              <div className="modal-body">
                {/* Implementa qui la logica per selezionare gli articoli */}
                <p>Interfaccia per la selezione degli articoli</p>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowItemSearch(false)}
                >
                  Chiudi
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowItemSearch(false)}
                >
                  Conferma Selezione
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal per ricerca riparazioni */}
        {showRepairSearch && (
          <div
            className="modal-overlay"
            onClick={() => setShowRepairSearch(false)}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h3>Seleziona Riparazioni</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowRepairSearch(false)}
                >
                  <X />
                </button>
              </div>
              <div className="modal-body">
                {/* Implementa qui la logica per selezionare le riparazioni */}
                <p>Interfaccia per la selezione delle riparazioni</p>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowRepairSearch(false)}
                >
                  Chiudi
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowRepairSearch(false)}
                >
                  Conferma Selezione
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
