import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import {
  Smartphone,
  Search,
  BarChart3,
  X,
  Grid3X3,
  List,
  Download,
  AlertTriangle,
  Tablet,
} from "lucide-react";
import styles from "./magapp.styles.module.css";

// Types
interface Device {
  id: string;
  code: string;
  type: "smartphone" | "tablet";
  brand: string;
  model: string;
  imei: string;
  esn: string;
  color: string;
  condition: "new" | "used" | "refurbished";
  isCourtesyDevice: boolean;
  status: "available" | "loaned" | "sold" | "unavailable";
  supplier: string;
  purchasePrice: number;
  sellingPrice: number;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

interface DeviceStats {
  totalDevices: number;
  availableDevices: number;
  loanedDevices: number;
  courtesyDevices: number;
  totalValue: number;
  smartphones: number;
  tablets: number;
}

interface Supplier {
  id: string;
  name: string;
}

// Mock Data
const mockSuppliers: Supplier[] = [
  { id: "SUP001", name: "TechDistribution S.p.A." },
  { id: "SUP002", name: "Mobile Italy" },
  { id: "SUP003", name: "Ingram Micro" },
  { id: "SUP004", name: "Esprinet" },
  { id: "SUP005", name: "Altro Fornitore" },
];

const mockDevices: Device[] = [
  {
    id: "1",
    code: "IPH14-001",
    type: "smartphone",
    brand: "Apple",
    model: "iPhone 14 Pro",
    imei: "353456789012345",
    esn: "ESN123456789",
    color: "Space Black",
    condition: "new",
    isCourtesyDevice: true,
    status: "available",
    supplier: "SUP001",
    purchasePrice: 950.0,
    sellingPrice: 1199.0,
    location: "A-01-001",
    notes: "Disponibile per cortesia",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "2",
    code: "SAM-S23-002",
    type: "smartphone",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    imei: "354567890123456",
    esn: "ESN234567890",
    color: "Phantom Black",
    condition: "new",
    isCourtesyDevice: false,
    status: "available",
    supplier: "SUP002",
    purchasePrice: 880.0,
    sellingPrice: 1099.0,
    location: "A-01-002",
    notes: "",
    createdAt: "2025-01-16T11:30:00Z",
  },
  {
    id: "3",
    code: "IPH13-003",
    type: "smartphone",
    brand: "Apple",
    model: "iPhone 13",
    imei: "355678901234567",
    esn: "ESN345678901",
    color: "Midnight",
    condition: "refurbished",
    isCourtesyDevice: true,
    status: "loaned",
    supplier: "SUP001",
    purchasePrice: 450.0,
    sellingPrice: 599.0,
    location: "A-01-003",
    notes: "In prestito a cliente XYZ dal 10/10/2025",
    createdAt: "2025-01-10T09:00:00Z",
  },
  {
    id: "4",
    code: "IPAD-PRO-004",
    type: "tablet",
    brand: "Apple",
    model: 'iPad Pro 11"',
    imei: "356789012345678",
    esn: "ESN456789012",
    color: "Silver",
    condition: "new",
    isCourtesyDevice: false,
    status: "available",
    supplier: "SUP003",
    purchasePrice: 750.0,
    sellingPrice: 949.0,
    location: "B-02-001",
    notes: "",
    createdAt: "2025-01-20T14:00:00Z",
  },
  {
    id: "5",
    code: "SAM-TAB-005",
    type: "tablet",
    brand: "Samsung",
    model: "Galaxy Tab S9",
    imei: "357890123456789",
    esn: "ESN567890123",
    color: "Graphite",
    condition: "new",
    isCourtesyDevice: true,
    status: "available",
    supplier: "SUP002",
    purchasePrice: 550.0,
    sellingPrice: 699.0,
    location: "B-02-002",
    notes: "Disponibile per cortesia",
    createdAt: "2025-01-22T16:00:00Z",
  },
  {
    id: "6",
    code: "XIR-MI13-006",
    type: "smartphone",
    brand: "Xiaomi",
    model: "Mi 13 Pro",
    imei: "358901234567890",
    esn: "ESN678901234",
    color: "Ceramic White",
    condition: "new",
    isCourtesyDevice: false,
    status: "available",
    supplier: "SUP004",
    purchasePrice: 650.0,
    sellingPrice: 799.0,
    location: "A-01-004",
    notes: "",
    createdAt: "2025-01-25T10:30:00Z",
  },
  {
    id: "7",
    code: "IPH12-007",
    type: "smartphone",
    brand: "Apple",
    model: "iPhone 12",
    imei: "359012345678901",
    esn: "ESN789012345",
    color: "Blue",
    condition: "used",
    isCourtesyDevice: false,
    status: "sold",
    supplier: "SUP001",
    purchasePrice: 350.0,
    sellingPrice: 499.0,
    location: "A-02-001",
    notes: "Venduto il 01/10/2025",
    createdAt: "2025-01-05T08:00:00Z",
  },
  {
    id: "8",
    code: "OPP-FIN-008",
    type: "smartphone",
    brand: "Oppo",
    model: "Find X5 Pro",
    imei: "360123456789012",
    esn: "ESN890123456",
    color: "Ceramic White",
    condition: "refurbished",
    isCourtesyDevice: true,
    status: "available",
    supplier: "SUP004",
    purchasePrice: 420.0,
    sellingPrice: 549.0,
    location: "A-01-005",
    notes: "Rigenerato, come nuovo",
    createdAt: "2025-01-28T12:00:00Z",
  },
];

const MagazzinoApparati: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");

  // Stati per i dati
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>(mockDevices);
  const [suppliers] = useState<Supplier[]>(mockSuppliers);
  const [stats, setStats] = useState<DeviceStats>({
    totalDevices: 0,
    availableDevices: 0,
    loanedDevices: 0,
    courtesyDevices: 0,
    totalValue: 0,
    smartphones: 0,
    tablets: 0,
  });

  const [loading, setLoading] = useState(false);

  // Stati per i filtri
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showCourtesyOnly, setShowCourtesyOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Stati per il modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Stati per il form
  const [formData, setFormData] = useState({
    code: "",
    type: "smartphone" as "smartphone" | "tablet",
    brand: "",
    model: "",
    imei: "",
    esn: "",
    color: "",
    condition: "new" as "new" | "used" | "refurbished",
    isCourtesyDevice: false,
    status: "available" as "available" | "loaned" | "sold" | "unavailable",
    supplier: "",
    purchasePrice: 0,
    sellingPrice: 0,
    location: "",
    notes: "",
  });

  useEffect(() => {
    calculateStats();
    applyFilters();
  }, [devices]);

  useEffect(() => {
    applyFilters();
  }, [
    searchQuery,
    selectedType,
    selectedBrand,
    selectedSupplier,
    selectedCondition,
    selectedStatus,
    showCourtesyOnly,
  ]);

  const calculateStats = () => {
    const totalDevices = devices.length;
    const availableDevices = devices.filter(
      (d) => d.status === "available"
    ).length;
    const loanedDevices = devices.filter((d) => d.status === "loaned").length;
    const courtesyDevices = devices.filter(
      (d) => d.isCourtesyDevice && d.status === "available"
    ).length;
    const totalValue = devices.reduce((sum, d) => sum + d.purchasePrice, 0);
    const smartphones = devices.filter((d) => d.type === "smartphone").length;
    const tablets = devices.filter((d) => d.type === "tablet").length;

    setStats({
      totalDevices,
      availableDevices,
      loanedDevices,
      courtesyDevices,
      totalValue,
      smartphones,
      tablets,
    });
  };

  const applyFilters = () => {
    let filtered = [...devices];

    // Ricerca testuale
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (device) =>
          device.code.toLowerCase().includes(query) ||
          device.brand.toLowerCase().includes(query) ||
          device.model.toLowerCase().includes(query) ||
          device.imei.toLowerCase().includes(query) ||
          device.esn.toLowerCase().includes(query) ||
          device.color.toLowerCase().includes(query)
      );
    }

    // Filtro tipo
    if (selectedType) {
      filtered = filtered.filter((device) => device.type === selectedType);
    }

    // Filtro marca
    if (selectedBrand) {
      filtered = filtered.filter((device) => device.brand === selectedBrand);
    }

    // Filtro fornitore
    if (selectedSupplier) {
      filtered = filtered.filter(
        (device) => device.supplier === selectedSupplier
      );
    }

    // Filtro condizione
    if (selectedCondition) {
      filtered = filtered.filter(
        (device) => device.condition === selectedCondition
      );
    }

    // Filtro stato
    if (selectedStatus) {
      filtered = filtered.filter((device) => device.status === selectedStatus);
    }

    // Filtro solo cortesia
    if (showCourtesyOnly) {
      filtered = filtered.filter((device) => device.isCourtesyDevice);
    }

    setFilteredDevices(filtered);
  };

  // Funzioni per il modal
  const openModal = (mode: "add" | "edit" | "view", device?: Device) => {
    setModalMode(mode);
    setSelectedDevice(device || null);

    if (device && (mode === "edit" || mode === "view")) {
      setFormData({
        code: device.code,
        type: device.type,
        brand: device.brand,
        model: device.model,
        imei: device.imei,
        esn: device.esn,
        color: device.color,
        condition: device.condition,
        isCourtesyDevice: device.isCourtesyDevice,
        status: device.status,
        supplier: device.supplier,
        purchasePrice: device.purchasePrice,
        sellingPrice: device.sellingPrice,
        location: device.location,
        notes: device.notes,
      });
    } else {
      resetForm();
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDevice(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: "",
      type: "smartphone",
      brand: "",
      model: "",
      imei: "",
      esn: "",
      color: "",
      condition: "new",
      isCourtesyDevice: false,
      status: "available",
      supplier: "",
      purchasePrice: 0,
      sellingPrice: 0,
      location: "",
      notes: "",
    });
  };

  const handleSaveDevice = () => {
    if (
      !formData.code.trim() ||
      !formData.brand.trim() ||
      !formData.model.trim() ||
      !formData.imei.trim() ||
      !formData.supplier
    ) {
      alert("Compila tutti i campi obbligatori (contrassegnati con *)");
      return;
    }

    setLoading(true);

    if (modalMode === "add") {
      const newDevice: Device = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setDevices([...devices, newDevice]);
      alert("Apparato aggiunto con successo!");
    } else if (modalMode === "edit" && selectedDevice) {
      const updatedDevices = devices.map((device) =>
        device.id === selectedDevice.id
          ? { ...device, ...formData, updatedAt: new Date().toISOString() }
          : device
      );
      setDevices(updatedDevices);
      alert("Apparato modificato con successo!");
    }

    setLoading(false);
    closeModal();
  };

  const handleDeleteDevice = (device: Device) => {
    if (
      confirm(
        `Sei sicuro di voler eliminare l'apparato "${device.brand} ${device.model}"?`
      )
    ) {
      setDevices(devices.filter((d) => d.id !== device.id));
      alert("Apparato eliminato con successo!");
    }
  };

  const handleExportCsv = () => {
    alert("Funzionalità export CSV in arrivo!");
  };

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const getBrands = (): string[] => {
    const brands = new Set(devices.map((d) => d.brand));
    return Array.from(brands).sort();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "status-available";
      case "loaned":
        return "status-loaned";
      case "sold":
        return "status-sold";
      case "unavailable":
        return "status-unavailable";
      default:
        return "status-available";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponibile";
      case "loaned":
        return "In Prestito";
      case "sold":
        return "Venduto";
      case "unavailable":
        return "Non Disponibile";
      default:
        return "Disponibile";
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case "new":
        return "Nuovo";
      case "used":
        return "Usato";
      case "refurbished":
        return "Rigenerato";
      default:
        return "Nuovo";
    }
  };

  const getConditionBadgeClass = (condition: string) => {
    switch (condition) {
      case "new":
        return "condition-new";
      case "used":
        return "condition-used";
      case "refurbished":
        return "condition-refurbished";
      default:
        return "condition-new";
    }
  };

  return (
    <div className="main-layout">
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className="content-area">
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className="scheda-header">
          <div className="left-block">
            <div className="warehouse-icon-btn">
              <Smartphone className="warehouse-icon" />
            </div>
            <div className="warehouse-info">
              <h2 className="warehouse-title">Gestione Apparati</h2>
              <p className="warehouse-subtitle">Centro Assistenza Mobile</p>
            </div>
            <div className="stats-box">
              <BarChart3 className="stats-icon" />
              <div className="stats-text">
                <span>{stats.totalDevices} Apparati Totali</span>
                <span>€ {stats.totalValue.toFixed(2)} Valore</span>
              </div>
            </div>
          </div>

          <div className="breadcrumb">
            <span className="breadcrumb-item">Roma - Next srl</span>
            <span className="breadcrumb-separator"> &gt; </span>
            <span className="breadcrumb-current">Magazzino Apparati</span>
          </div>
        </div>

        <div className="page-body">
          <div className="warehouse-container">
            {/* Header della pagina */}
            <div className="page-title">
              <h1>
                <Smartphone style={{ width: "32px", height: "32px" }} />
                Magazzino Apparati
              </h1>
              <p>Gestione smartphone e tablet per il centro assistenza</p>
            </div>

            {/* Statistiche rapide */}
            <div className="quick-stats">
              <div className="stat-card">
                <h3 className="stat-number">{stats.availableDevices}</h3>
                <p className="stat-label">Disponibili</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#ffc107" }}>
                  {stats.loanedDevices}
                </h3>
                <p className="stat-label">In Prestito</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#17a2b8" }}>
                  {stats.courtesyDevices}
                </h3>
                <p className="stat-label">Cortesia Disponibili</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#28a745" }}>
                  € {stats.totalValue.toFixed(0)}
                </h3>
                <p className="stat-label">Valore Totale</p>
              </div>
            </div>

            {/* Layout principale */}
            <div className="warehouse-layout">
              {/* Sidebar filtri */}
              <div className="filters-sidebar">
                <div className="filter-section">
                  <h3>Ricerca</h3>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca per codice, marca, IMEI..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Tipo Apparato</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <option value="">Tutti i tipi</option>
                      <option value="smartphone">📱 Smartphone</option>
                      <option value="tablet">📋 Tablet</option>
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Marca</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      <option value="">Tutte le marche</option>
                      {getBrands().map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Fornitore</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                    >
                      <option value="">Tutti i fornitori</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Condizione</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                    >
                      <option value="">Tutte le condizioni</option>
                      <option value="new">Nuovo</option>
                      <option value="used">Usato</option>
                      <option value="refurbished">Rigenerato</option>
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Stato</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="">Tutti gli stati</option>
                      <option value="available">Disponibile</option>
                      <option value="loaned">In Prestito</option>
                      <option value="sold">Venduto</option>
                      <option value="unavailable">Non Disponibile</option>
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Cortesia</h3>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showCourtesyOnly}
                        onChange={(e) => setShowCourtesyOnly(e.target.checked)}
                      />
                      <span>Solo apparati di cortesia</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Area principale */}
              <div className="main-area">
                {/* Toolbar */}
                <div className="warehouse-toolbar">
                  <div className="search-bar">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Ricerca rapida nel magazzino apparati..."
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
                      className="btn btn-secondary"
                      onClick={handleExportCsv}
                      title="Esporta CSV"
                    >
                      <Download
                        style={{
                          width: "16px",
                          height: "16px",
                          marginRight: "4px",
                        }}
                      />
                      Export CSV
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => openModal("add")}
                    >
                      Aggiungi Apparato
                    </button>
                  </div>
                </div>

                {/* Area contenuto - Vista condizionale */}
                {viewMode === "grid" ? (
                  /* Griglia apparati */
                  <div className="items-grid">
                    {filteredDevices.map((device) => {
                      const supplierInfo = suppliers.find(
                        (s) => s.id === device.supplier
                      );

                      return (
                        <div key={device.id} className="item-card">
                          <div className="item-header">
                            <div className={`item-icon ${device.type}`}>
                              {device.type === "smartphone" ? "📱" : "📋"}
                            </div>
                            <div className="item-info">
                              <div className="item-code">{device.code}</div>
                              <h4 className="item-name">
                                {device.brand} {device.model}
                              </h4>
                              <p className="item-description">
                                {device.color} •{" "}
                                {getConditionText(device.condition)}
                              </p>
                            </div>
                            <div
                              className={`stock-badge ${getStatusBadgeClass(
                                device.status
                              )}`}
                            >
                              {getStatusText(device.status)}
                            </div>
                          </div>

                          {device.isCourtesyDevice && (
                            <div className="courtesy-badge">
                              🤝 Dispositivo di Cortesia
                            </div>
                          )}

                          <div className="item-details">
                            <div className="item-row">
                              <span className="item-label">IMEI:</span>
                              <span className="item-value item-imei">
                                {device.imei}
                              </span>
                            </div>
                            <div className="item-row">
                              <span className="item-label">ESN:</span>
                              <span className="item-value">{device.esn}</span>
                            </div>
                            <div className="item-row">
                              <span className="item-label">Condizione:</span>
                              <span
                                className={`condition-badge ${getConditionBadgeClass(
                                  device.condition
                                )}`}
                              >
                                {getConditionText(device.condition)}
                              </span>
                            </div>
                            <div className="item-row">
                              <span className="item-label">
                                Prezzo Acquisto:
                              </span>
                              <span className="price-value">
                                € {device.purchasePrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="item-row">
                              <span className="item-label">
                                Prezzo Vendita:
                              </span>
                              <span className="price-value">
                                € {device.sellingPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="item-row">
                              <span className="item-label">Ubicazione:</span>
                              <span className="item-value">
                                {device.location || "Non specificata"}
                              </span>
                            </div>
                            <div className="item-row">
                              <span className="item-label">Fornitore:</span>
                              <span className="item-value">
                                {supplierInfo?.name || "Sconosciuto"}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop: "12px",
                                display: "flex",
                                gap: "8px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                className="btn btn-primary"
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.75rem",
                                }}
                                onClick={() => handleDeleteDevice(device)}
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
                  <div className="items-table-container">
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th className="col-code">Codice</th>
                          <th>Tipo</th>
                          <th>Marca/Modello</th>
                          <th>IMEI</th>
                          <th>ESN</th>
                          <th>Colore</th>
                          <th>Condizione</th>
                          <th>Stato</th>
                          <th>Cortesia</th>
                          <th>Prezzo Acq.</th>
                          <th>Prezzo Vend.</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDevices.map((device) => {
                          return (
                            <tr key={device.id} className="table-row">
                              <td className="table-code">{device.code}</td>
                              <td>
                                <span className="type-badge">
                                  {device.type === "smartphone" ? "📱" : "📋"}
                                </span>
                              </td>
                              <td className="table-name">
                                <div className="name-with-icon">
                                  <div className={`table-icon ${device.type}`}>
                                    {device.type === "smartphone" ? "📱" : "📋"}
                                  </div>
                                  <div>
                                    <div className="table-item-name">
                                      {device.brand} {device.model}
                                    </div>
                                    <div className="table-item-desc">
                                      {device.color}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="imei-text">{device.imei}</span>
                              </td>
                              <td>{device.esn}</td>
                              <td>{device.color}</td>
                              <td>
                                <span
                                  className={`condition-badge ${getConditionBadgeClass(
                                    device.condition
                                  )}`}
                                >
                                  {getConditionText(device.condition)}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`stock-badge ${getStatusBadgeClass(
                                    device.status
                                  )}`}
                                >
                                  {getStatusText(device.status)}
                                </span>
                              </td>
                              <td>
                                {device.isCourtesyDevice ? (
                                  <span className="courtesy-indicator">🤝</span>
                                ) : (
                                  <span className="no-courtesy">-</span>
                                )}
                              </td>
                              <td className="table-price">
                                € {device.purchasePrice.toFixed(2)}
                              </td>
                              <td className="table-price">
                                € {device.sellingPrice.toFixed(2)}
                              </td>
                              <td className="table-actions">
                                <button
                                  className="action-btn btn-view"
                                  onClick={() => openModal("view", device)}
                                  title="Visualizza dettagli"
                                >
                                  👁️
                                </button>
                                <button
                                  className="action-btn btn-edit"
                                  onClick={() => openModal("edit", device)}
                                  title="Modifica apparato"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="action-btn btn-delete"
                                  onClick={() => handleDeleteDevice(device)}
                                  title="Elimina apparato"
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
                {filteredDevices.length === 0 && !loading && (
                  <div className="error-container">
                    <h2>📱 Nessun apparato trovato</h2>
                    <p>
                      Modifica i filtri di ricerca o aggiungi nuovi apparati al
                      magazzino
                    </p>
                    <button
                      className="btn btn-success"
                      onClick={() => openModal("add")}
                    >
                      Aggiungi Primo Apparato
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal per gestione apparati */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalMode === "add" && "Aggiungi Nuovo Apparato"}
                  {modalMode === "edit" && "Modifica Apparato"}
                  {modalMode === "view" && "Dettagli Apparato"}
                </h3>
                <button className="modal-close" onClick={closeModal}>
                  <X />
                </button>
              </div>

              <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <div className="form-group">
                  <label>Codice Apparato *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="Es: IPH14-001"
                    readOnly={modalMode === "view"}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className="form-group">
                    <label>Tipo Apparato *</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "smartphone" | "tablet",
                        })
                      }
                      disabled={modalMode === "view"}
                    >
                      <option value="smartphone">📱 Smartphone</option>
                      <option value="tablet">📋 Tablet</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Marca *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      placeholder="Es: Apple"
                      readOnly={modalMode === "view"}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Modello *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    placeholder="Es: iPhone 14 Pro"
                    readOnly={modalMode === "view"}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className="form-group">
                    <label>IMEI *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.imei}
                      onChange={(e) =>
                        setFormData({ ...formData, imei: e.target.value })
                      }
                      placeholder="Es: 353456789012345"
                      readOnly={modalMode === "view"}
                    />
                  </div>

                  <div className="form-group">
                    <label>ESN</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.esn}
                      onChange={(e) =>
                        setFormData({ ...formData, esn: e.target.value })
                      }
                      placeholder="Es: ESN123456789"
                      readOnly={modalMode === "view"}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Colore *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="Es: Space Black"
                    readOnly={modalMode === "view"}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className="form-group">
                    <label>Condizione *</label>
                    <select
                      className="form-control"
                      value={formData.condition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          condition: e.target.value as
                            | "new"
                            | "used"
                            | "refurbished",
                        })
                      }
                      disabled={modalMode === "view"}
                    >
                      <option value="new">Nuovo</option>
                      <option value="used">Usato</option>
                      <option value="refurbished">Rigenerato</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Stato *</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as
                            | "available"
                            | "loaned"
                            | "sold"
                            | "unavailable",
                        })
                      }
                      disabled={modalMode === "view"}
                    >
                      <option value="available">Disponibile</option>
                      <option value="loaned">In Prestito</option>
                      <option value="sold">Venduto</option>
                      <option value="unavailable">Non Disponibile</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isCourtesyDevice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isCourtesyDevice: e.target.checked,
                        })
                      }
                      disabled={modalMode === "view"}
                    />
                    <span>🤝 Dispositivo di Cortesia</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Fornitore *</label>
                  <select
                    className="form-control"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    disabled={modalMode === "view"}
                  >
                    <option value="">Seleziona fornitore</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className="form-group">
                    <label>Prezzo Acquisto € *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchasePrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      readOnly={modalMode === "view"}
                    />
                  </div>

                  <div className="form-group">
                    <label>Prezzo Vendita € *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.sellingPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sellingPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      readOnly={modalMode === "view"}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Ubicazione Magazzino</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Es: A-01-001"
                    readOnly={modalMode === "view"}
                  />
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
                    placeholder="Note aggiuntive..."
                    readOnly={modalMode === "view"}
                  />
                </div>

                {/* Informazioni aggiuntive in modalità view */}
                {modalMode === "view" && selectedDevice && (
                  <>
                    <hr />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div className="form-group">
                        <label>Creato il</label>
                        <input
                          type="text"
                          className="form-control"
                          value={new Date(
                            selectedDevice.createdAt
                          ).toLocaleDateString("it-IT")}
                          readOnly
                        />
                      </div>
                      {selectedDevice.updatedAt && (
                        <div className="form-group">
                          <label>Modificato il</label>
                          <input
                            type="text"
                            className="form-control"
                            value={new Date(
                              selectedDevice.updatedAt
                            ).toLocaleDateString("it-IT")}
                            readOnly
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={loading}
                >
                  {modalMode === "view" ? "Chiudi" : "Annulla"}
                </button>
                {modalMode !== "view" && (
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveDevice}
                    disabled={loading}
                  >
                    {loading
                      ? "Salvando..."
                      : modalMode === "add"
                      ? "Aggiungi"
                      : "Salva Modifiche"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <BottomBar />
      </div>
    </div>
  );
};

export default MagazzinoApparati;
