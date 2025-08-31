import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import {
  Package,
  Search,
  Filter,
  BarChart3,
  X,
  ChevronDown,
  AlertTriangle,
  Smartphone,
  Battery,
  Camera,
  Volume2,
  Cpu,
  Settings,
} from "lucide-react";
import "./magazzino-styles.css";

// Tipi per i dati
interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  model: string;
  supplier: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
  totalValue: number;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
}

const Magazzino: React.FC = () => {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  // Stati per i dati
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stati per i filtri
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  // Stati per il modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);

  // Stati per il form
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    category: "",
    brand: "",
    model: "",
    supplier: "",
    quantity: 0,
    minQuantity: 0,
    unitPrice: 0,
    location: "",
    notes: "",
  });

  // Dati statici
  const categories: Category[] = [
    { id: "screens", name: "Schermi", icon: "📱", color: "#17a2b8" },
    { id: "batteries", name: "Batterie", icon: "🔋", color: "#28a745" },
    { id: "cameras", name: "Fotocamere", icon: "📷", color: "#6f42c1" },
    { id: "speakers", name: "Speaker", icon: "🔊", color: "#fd7e14" },
    { id: "motherboards", name: "Schede Madri", icon: "💾", color: "#dc3545" },
    { id: "connectors", name: "Connettori", icon: "🔌", color: "#20c997" },
    { id: "buttons", name: "Pulsanti", icon: "⚫", color: "#6c757d" },
    { id: "chassis", name: "Telai", icon: "🔧", color: "#ffc107" },
    { id: "other", name: "Altri", icon: "📦", color: "#6c757d" },
  ];

  const suppliers: Supplier[] = [
    { id: "supplier1", name: "TechParts Italy", contact: "info@techparts.it" },
    { id: "supplier2", name: "Mobile Components", contact: "order@mobile.com" },
    {
      id: "supplier3",
      name: "RepairPro Supply",
      contact: "sales@repairpro.it",
    },
    {
      id: "supplier4",
      name: "GlobalTech Parts",
      contact: "support@global.com",
    },
  ];

  // Dati di esempio
  const sampleItems: WarehouseItem[] = [
    {
      id: "1",
      code: "SCR-IP14-BLK",
      name: "Schermo iPhone 14",
      description: "Display OLED con touch integrato - Colore Nero",
      category: "screens",
      subcategory: "OLED",
      brand: "Apple",
      model: "iPhone 14",
      supplier: "supplier1",
      quantity: 15,
      minQuantity: 5,
      maxQuantity: 50,
      unitPrice: 89.99,
      totalValue: 1349.85,
      location: "A-01-015",
      createdAt: "2024-01-15T09:30:00Z",
      updatedAt: "2024-02-01T14:22:00Z",
    },
    {
      id: "2",
      code: "BAT-IP13-PRO",
      name: "Batteria iPhone 13 Pro",
      description: "Batteria Li-Ion 3095mAh originale",
      category: "batteries",
      subcategory: "Li-Ion",
      brand: "Apple",
      model: "iPhone 13 Pro",
      supplier: "supplier2",
      quantity: 3,
      minQuantity: 8,
      maxQuantity: 30,
      unitPrice: 45.5,
      totalValue: 136.5,
      location: "B-02-008",
      createdAt: "2024-01-10T11:15:00Z",
      updatedAt: "2024-02-08T16:45:00Z",
    },
    {
      id: "3",
      code: "CAM-SAM-S23",
      name: "Fotocamera Samsung S23",
      description: "Fotocamera posteriore principale 50MP",
      category: "cameras",
      subcategory: "Principale",
      brand: "Samsung",
      model: "Galaxy S23",
      supplier: "supplier3",
      quantity: 12,
      minQuantity: 6,
      maxQuantity: 25,
      unitPrice: 67.8,
      totalValue: 813.6,
      location: "C-01-012",
      createdAt: "2024-01-20T08:45:00Z",
      updatedAt: "2024-02-05T10:30:00Z",
    },
    {
      id: "4",
      code: "SPK-IP12-MIN",
      name: "Speaker iPhone 12 Mini",
      description: "Altoparlante auricolare interno",
      category: "speakers",
      subcategory: "Auricolare",
      brand: "Apple",
      model: "iPhone 12 Mini",
      supplier: "supplier1",
      quantity: 0,
      minQuantity: 4,
      maxQuantity: 20,
      unitPrice: 23.9,
      totalValue: 0,
      location: "D-03-007",
      createdAt: "2024-01-08T15:20:00Z",
      updatedAt: "2024-02-10T12:15:00Z",
    },
    {
      id: "5",
      code: "MB-OPPO-A54",
      name: "Scheda Madre OPPO A54",
      description: "Mainboard completa con processore",
      category: "motherboards",
      subcategory: "Completa",
      brand: "OPPO",
      model: "A54",
      supplier: "supplier4",
      quantity: 8,
      minQuantity: 3,
      maxQuantity: 15,
      unitPrice: 125.0,
      totalValue: 1000.0,
      location: "E-01-003",
      createdAt: "2024-01-25T13:40:00Z",
      updatedAt: "2024-02-03T09:20:00Z",
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
    loadWarehouseData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    searchQuery,
    selectedCategory,
    selectedSupplier,
    stockStatus,
    warehouseItems,
  ]);

  // Funzioni per il caricamento dei dati
  const loadWarehouseData = async () => {
    setLoading(true);
    try {
      // Simula chiamata API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setWarehouseItems(sampleItems);
      setError(null);
    } catch (err) {
      setError("Errore nel caricamento dei dati del magazzino");
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per i filtri
  const applyFilters = () => {
    let filtered = warehouseItems;

    // Filtro ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.model.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Filtro categoria
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filtro fornitore
    if (selectedSupplier) {
      filtered = filtered.filter((item) => item.supplier === selectedSupplier);
    }

    // Filtro stato scorte
    if (stockStatus) {
      filtered = filtered.filter((item) => {
        if (stockStatus === "available")
          return item.quantity > item.minQuantity;
        if (stockStatus === "low")
          return item.quantity > 0 && item.quantity <= item.minQuantity;
        if (stockStatus === "out") return item.quantity === 0;
        return true;
      });
    }

    setFilteredItems(filtered);
  };

  // Funzioni per la gestione del modal
  const openModal = (mode: "add" | "edit" | "view", item?: WarehouseItem) => {
    setModalMode(mode);
    setSelectedItem(item || null);

    if (item && (mode === "edit" || mode === "view")) {
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description,
        category: item.category,
        brand: item.brand,
        model: item.model,
        supplier: item.supplier,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        unitPrice: item.unitPrice,
        location: item.location,
        notes: item.notes || "",
      });
    } else {
      resetForm();
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      category: "",
      brand: "",
      model: "",
      supplier: "",
      quantity: 0,
      minQuantity: 0,
      unitPrice: 0,
      location: "",
      notes: "",
    });
  };

  const handleSaveItem = async () => {
    try {
      if (modalMode === "add") {
        // Logica per aggiungere nuovo item
        const newItem: WarehouseItem = {
          id: Date.now().toString(),
          ...formData,
          subcategory: "",
          maxQuantity: formData.minQuantity * 5,
          totalValue: formData.quantity * formData.unitPrice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setWarehouseItems((prev) => [...prev, newItem]);
      } else if (modalMode === "edit" && selectedItem) {
        // Logica per modificare item esistente
        setWarehouseItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  ...formData,
                  totalValue: formData.quantity * formData.unitPrice,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
      }

      closeModal();
      alert(
        modalMode === "add"
          ? "Articolo aggiunto con successo!"
          : "Articolo modificato con successo!"
      );
    } catch (error) {
      alert("Errore durante il salvataggio dell'articolo");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo articolo?")) {
      setWarehouseItems((prev) => prev.filter((item) => item.id !== itemId));
      alert("Articolo eliminato con successo!");
    }
  };

  // Funzioni di utilità
  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const getStockStatus = (item: WarehouseItem) => {
    if (item.quantity === 0) return "out";
    if (item.quantity <= item.minQuantity) return "low";
    return "available";
  };

  const getStockBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "stock-available";
      case "low":
        return "stock-low";
      case "out":
        return "stock-out";
      default:
        return "stock-available";
    }
  };

  const getStockBadgeText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponibile";
      case "low":
        return "In Esaurimento";
      case "out":
        return "Esaurito";
      default:
        return "Disponibile";
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.icon || "📦";
  };

  const getItemIcon = (categoryId: string) => {
    switch (categoryId) {
      case "screens":
        return <Smartphone className="item-icon-lucide" />;
      case "batteries":
        return <Battery className="item-icon-lucide" />;
      case "cameras":
        return <Camera className="item-icon-lucide" />;
      case "speakers":
        return <Volume2 className="item-icon-lucide" />;
      case "motherboards":
        return <Cpu className="item-icon-lucide" />;
      default:
        return <Settings className="item-icon-lucide" />;
    }
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((sup) => sup.id === supplierId);
    return supplier?.name || "Sconosciuto";
  };

  // Statistiche
  const stats = useMemo(() => {
    const total = warehouseItems.length;
    const available = warehouseItems.filter(
      (item) => getStockStatus(item) === "available"
    ).length;
    const low = warehouseItems.filter(
      (item) => getStockStatus(item) === "low"
    ).length;
    const out = warehouseItems.filter(
      (item) => getStockStatus(item) === "out"
    ).length;
    const totalValue = warehouseItems.reduce(
      (sum, item) => sum + item.totalValue,
      0
    );

    return { total, available, low, out, totalValue };
  }, [warehouseItems]);

  // Rendering condizionale per loading e errori
  if (loading) {
    return (
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Caricamento magazzino...</span>
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
            <button className="btn btn-primary" onClick={loadWarehouseData}>
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
            <div className="warehouse-icon-btn">
              <Package className="warehouse-icon" />
            </div>
            <div className="warehouse-info">
              <h2 className="warehouse-title">Gestione Magazzino</h2>
              <p className="warehouse-subtitle">Centro Assistenza Mobile</p>
            </div>
            <div className="stats-box">
              <BarChart3 className="stats-icon" />
              <div className="stats-text">
                <span>{stats.total} Articoli Totali</span>
                <span>€ {stats.totalValue.toFixed(2)} Valore</span>
              </div>
            </div>
          </div>

          <div className="breadcrumb">
            <span className="breadcrumb-item">Roma - Next srl</span>
            <span className="breadcrumb-separator"> &gt; </span>
            <span className="breadcrumb-current">Magazzino Ricambi</span>
          </div>
        </div>

        <div className="page-body">
          <div className="warehouse-container">
            {/* Header della pagina */}
            <div className="page-title">
              <h1>
                <Package style={{ width: "32px", height: "32px" }} />
                Magazzino Ricambi
              </h1>
              <p>Gestione scorte e componenti per il centro assistenza</p>
            </div>

            {/* Statistiche rapide */}
            <div className="quick-stats">
              <div className="stat-card">
                <h3 className="stat-number">{stats.available}</h3>
                <p className="stat-label">Disponibili</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#ffc107" }}>
                  {stats.low}
                </h3>
                <p className="stat-label">In Esaurimento</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#dc3545" }}>
                  {stats.out}
                </h3>
                <p className="stat-label">Esauriti</p>
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
                  <h3>🔍 Ricerca</h3>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca per nome, codice, marca..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-section">
                  <h3>📂 Categoria</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">Tutte le categorie</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>🏪 Fornitore</h3>
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
                  <h3>📊 Stato Scorte</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value)}
                    >
                      <option value="">Tutti gli stati</option>
                      <option value="available">✅ Disponibili</option>
                      <option value="low">⚠️ In Esaurimento</option>
                      <option value="out">❌ Esauriti</option>
                    </select>
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
                      placeholder="Ricerca rapida nel magazzino..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="toolbar-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => openModal("add")}
                    >
                      Aggiungi Articolo
                    </button>
                  </div>
                </div>

                {/* Griglia articoli */}
                <div className="items-grid">
                  {filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item);

                    return (
                      <div key={item.id} className="item-card">
                        <div className="item-header">
                          <div className={`item-icon ${item.category}`}>
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="item-info">
                            <div className="item-code">{item.code}</div>
                            <h4 className="item-name">{item.name}</h4>
                            <p className="item-description">
                              {item.description}
                            </p>
                          </div>
                          <div
                            className={`stock-badge ${getStockBadgeClass(
                              stockStatus
                            )}`}
                          >
                            {getStockBadgeText(stockStatus)}
                          </div>
                        </div>

                        <div className="item-details">
                          <div className="item-row">
                            <span className="item-label">Marca:</span>
                            <span className="item-value">{item.brand}</span>
                          </div>
                          <div className="item-row">
                            <span className="item-label">Modello:</span>
                            <span className="item-value">{item.model}</span>
                          </div>
                          <div className="item-row">
                            <span className="item-label">Scorte:</span>
                            <span
                              className={`stock-quantity ${
                                stockStatus === "low"
                                  ? "quantity-low"
                                  : stockStatus === "out"
                                  ? "quantity-out"
                                  : ""
                              }`}
                            >
                              {item.quantity} / {item.minQuantity}+ unità
                            </span>
                          </div>
                          <div className="item-row">
                            <span className="item-label">Prezzo:</span>
                            <span className="price-value">
                              € {item.unitPrice.toFixed(2)}
                            </span>
                          </div>
                          <div className="item-row">
                            <span className="item-label">Ubicazione:</span>
                            <span className="item-value">{item.location}</span>
                          </div>
                          <div className="item-row">
                            <span className="item-label">Fornitore:</span>
                            <span className="item-value">
                              {getSupplierName(item.supplier)}
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
                              onClick={() => openModal("view", item)}
                            >
                              Dettagli
                            </button>
                            <button
                              className="btn btn-warning"
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                              }}
                              onClick={() => openModal("edit", item)}
                            >
                              Modifica
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                              }}
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Messaggio se non ci sono risultati */}
                {filteredItems.length === 0 && (
                  <div className="error-container">
                    <h2>📦 Nessun articolo trovato</h2>
                    <p>
                      Modifica i filtri di ricerca o aggiungi nuovi articoli al
                      magazzino
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal per gestione articoli */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalMode === "add" && "➕ Aggiungi Nuovo Articolo"}
                  {modalMode === "edit" && "✏️ Modifica Articolo"}
                  {modalMode === "view" && "👁️ Dettagli Articolo"}
                </h3>
                <button className="modal-close" onClick={closeModal}>
                  <X />
                </button>
              </div>

              <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <div className="form-group">
                  <label>Codice Articolo *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="Es: SCR-IP14-BLK"
                    readOnly={modalMode === "view"}
                  />
                </div>

                <div className="form-group">
                  <label>Nome Articolo *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Es: Schermo iPhone 14"
                    readOnly={modalMode === "view"}
                  />
                </div>

                <div className="form-group">
                  <label>Descrizione</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descrizione dettagliata dell'articolo"
                    readOnly={modalMode === "view"}
                  />
                </div>

                <div className="form-group">
                  <label>Categoria *</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    disabled={modalMode === "view"}
                  >
                    <option value="">Seleziona categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
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

                  <div className="form-group">
                    <label>Modello *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      placeholder="Es: iPhone 14"
                      readOnly={modalMode === "view"}
                    />
                  </div>
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
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className="form-group">
                    <label>Quantità *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      readOnly={modalMode === "view"}
                    />
                  </div>

                  <div className="form-group">
                    <label>Scorta Minima *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.minQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      readOnly={modalMode === "view"}
                    />
                  </div>

                  <div className="form-group">
                    <label>Prezzo Unitario €</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.unitPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unitPrice: parseFloat(e.target.value) || 0,
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
                    placeholder="Es: A-01-015"
                    readOnly={modalMode === "view"}
                  />
                </div>

                <div className="form-group">
                  <label>Note</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Note aggiuntive..."
                    readOnly={modalMode === "view"}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeModal}>
                  {modalMode === "view" ? "Chiudi" : "Annulla"}
                </button>
                {modalMode !== "view" && (
                  <button className="btn btn-primary" onClick={handleSaveItem}>
                    {modalMode === "add" ? "Aggiungi" : "Salva Modifiche"}
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

export default Magazzino;
