import React, { useState, useEffect, useMemo, useCallback } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import {
  Package,
  Search,
  BarChart3,
  X,
  Grid3X3,
  List,
  Download,
  AlertTriangle,
} from "lucide-react";
import warehouseService, {
  type WarehouseItem,
  type WarehouseStats,
  type CategoryInfo,
  type WarehouseSupplier,
  type CreateWarehouseItem,
  type UpdateWarehouseItem,
} from "../../services/warehouseService";
import "./magazzino-styles.css";

const Magazzino: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  // Stati per i dati
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WarehouseItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [suppliers, setSuppliers] = useState<WarehouseSupplier[]>([]);
  const [stats, setStats] = useState<WarehouseStats>({
    totalItems: 0,
    availableItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    totalCategories: 0,
    totalSuppliers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stati per la paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Stati per i filtri
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

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
    maxQuantity: 0,
    unitPrice: 0,
    location: "",
    notes: "",
  });

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
    loadInitialData();
  }, []);

  useEffect(() => {
    loadWarehouseData();
  }, [
    searchQuery,
    selectedCategory,
    selectedSupplier,
    stockStatus,
    currentPage,
  ]);

  // Funzioni per il caricamento dei dati
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Carica categorie e fornitori in parallelo
      const [categoriesData, suppliersData] = await Promise.all([
        warehouseService.getCategories(),
        warehouseService.getSuppliers(),
      ]);

      setCategories(categoriesData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error("Errore nel caricamento dati iniziali:", err);
      setError("Errore nel caricamento delle categorie e fornitori");
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = {
        searchQuery: searchQuery.trim() || undefined,
        category: selectedCategory || undefined,
        supplier: selectedSupplier || undefined,
        stockStatus: stockStatus || undefined,
        page: currentPage,
        pageSize: pageSize,
        sortBy: "name",
        sortDescending: false,
      };

      const response = await warehouseService.searchItems(searchParams);

      setWarehouseItems(response.items);
      setFilteredItems(response.items);
      setStats(response.stats);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      console.error("Errore nel caricamento magazzino:", err);
      setError(err.message || "Errore nel caricamento dei dati del magazzino");
      setWarehouseItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedSupplier,
    stockStatus,
    currentPage,
  ]);

  // Funzioni per la gestione del modal
  const openModal = (mode: "add" | "edit" | "view", item?: WarehouseItem) => {
    setModalMode(mode);
    setSelectedItem(item || null);

    if (item && (mode === "edit" || mode === "view")) {
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || "",
        category: item.category,
        brand: item.brand,
        model: item.model,
        supplier: item.supplier,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
        unitPrice: item.unitPrice,
        location: item.location || "",
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
      maxQuantity: 0,
      unitPrice: 0,
      location: "",
      notes: "",
    });
  };

  const handleSaveItem = async () => {
    try {
      // Validazione basic
      if (
        !formData.code.trim() ||
        !formData.name.trim() ||
        !formData.category ||
        !formData.brand.trim() ||
        !formData.model.trim() ||
        !formData.supplier
      ) {
        alert("Compila tutti i campi obbligatori (contrassegnati con *)");
        return;
      }

      setLoading(true);

      if (modalMode === "add") {
        const newItemData: CreateWarehouseItem = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          supplier: formData.supplier,
          quantity: formData.quantity,
          minQuantity: formData.minQuantity,
          maxQuantity: formData.maxQuantity || formData.minQuantity * 5,
          unitPrice: formData.unitPrice,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          multitenantId: warehouseService.getMultitenantId() || "",
        };

        await warehouseService.createItem(newItemData);
        alert("Articolo aggiunto con successo!");
      } else if (modalMode === "edit" && selectedItem) {
        const updateData: UpdateWarehouseItem = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          supplier: formData.supplier,
          quantity: formData.quantity,
          minQuantity: formData.minQuantity,
          maxQuantity: formData.maxQuantity,
          unitPrice: formData.unitPrice,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };

        await warehouseService.updateItem(selectedItem.id, updateData);
        alert("Articolo modificato con successo!");
      }

      closeModal();
      await loadWarehouseData(); // Ricarica i dati
    } catch (err: any) {
      console.error("Errore nel salvataggio:", err);
      alert(err.message || "Errore durante il salvataggio dell'articolo");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item: WarehouseItem) => {
    if (confirm(`Sei sicuro di voler eliminare l'articolo "${item.name}"?`)) {
      try {
        setLoading(true);
        await warehouseService.deleteItem(item.id);
        alert("Articolo eliminato con successo!");
        await loadWarehouseData(); // Ricarica i dati
      } catch (err: any) {
        console.error("Errore nell'eliminazione:", err);
        alert(err.message || "Errore durante l'eliminazione dell'articolo");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      setLoading(true);
      const blob = await warehouseService.exportToCsv();
      warehouseService.downloadCsvFile(blob);
      alert("Export completato con successo!");
    } catch (err: any) {
      console.error("Errore nell'export:", err);
      alert(err.message || "Errore durante l'export dei dati");
    } finally {
      setLoading(false);
    }
  };

  // Funzioni di utilità
  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const getCategoryInfo = (categoryId: string): CategoryInfo | undefined => {
    return categories.find((cat) => cat.id === categoryId);
  };

  const getSupplierInfo = (
    supplierId: string
  ): WarehouseSupplier | undefined => {
    return suppliers.find((sup) => sup.supplierId === supplierId);
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

  // Handlers per filtri
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset alla prima pagina
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleSupplierChange = (value: string) => {
    setSelectedSupplier(value);
    setCurrentPage(1);
  };

  const handleStockStatusChange = (value: string) => {
    setStockStatus(value);
    setCurrentPage(1);
  };

  // Paginazione
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Rendering condizionale per loading e errori
  if (loading && warehouseItems.length === 0) {
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

  if (error && warehouseItems.length === 0) {
    return (
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />
          <div className="error-container">
            <h2>
              <AlertTriangle /> Errore nel caricamento
            </h2>
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
                <span>{stats.totalItems} Articoli Totali</span>
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
                <h3 className="stat-number">{stats.availableItems}</h3>
                <p className="stat-label">Disponibili</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#ffc107" }}>
                  {stats.lowStockItems}
                </h3>
                <p className="stat-label">In Esaurimento</p>
              </div>
              <div className="stat-card">
                <h3 className="stat-number" style={{ color: "#dc3545" }}>
                  {stats.outOfStockItems}
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
                  <h3>Ricerca</h3>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca per nome, codice, marca..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Categoria</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
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
                  <h3>Fornitore</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={selectedSupplier}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                    >
                      <option value="">Tutti i fornitori</option>
                      {suppliers.map((supplier) => (
                        <option
                          key={supplier.supplierId}
                          value={supplier.supplierId}
                        >
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-section">
                  <h3>Stato Scorte</h3>
                  <div className="form-group">
                    <select
                      className="form-control"
                      value={stockStatus}
                      onChange={(e) => handleStockStatusChange(e.target.value)}
                    >
                      <option value="">Tutti gli stati</option>
                      <option value="available">Disponibili</option>
                      <option value="low">In Esaurimento</option>
                      <option value="out">Esauriti</option>
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
                      onChange={(e) => handleSearchChange(e.target.value)}
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
                      disabled={loading}
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
                      disabled={loading}
                    >
                      Aggiungi Articolo
                    </button>
                  </div>
                </div>

                {/* Loading overlay per operazioni */}
                {loading && warehouseItems.length > 0 && (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                  </div>
                )}

                {/* Area contenuto - Vista condizionale */}
                {viewMode === "grid" ? (
                  /* Griglia articoli */
                  <div className="items-grid">
                    {filteredItems.map((item) => {
                      const categoryInfo = getCategoryInfo(item.category);
                      const supplierInfo = getSupplierInfo(item.supplier);

                      return (
                        <div key={item.id} className="item-card">
                          <div className="item-header">
                            <div className={`item-icon ${item.category}`}>
                              {categoryInfo?.icon || "📦"}
                            </div>
                            <div className="item-info">
                              <div className="item-code">{item.code}</div>
                              <h4 className="item-name">{item.name}</h4>
                              <p className="item-description">
                                {item.description || "Nessuna descrizione"}
                              </p>
                            </div>
                            <div
                              className={`stock-badge ${getStockBadgeClass(
                                item.stockStatus
                              )}`}
                            >
                              {getStockBadgeText(item.stockStatus)}
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
                                  item.stockStatus === "low"
                                    ? "quantity-low"
                                    : item.stockStatus === "out"
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
                              <span className="item-value">
                                {item.location || "Non specificata"}
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
                                onClick={() => handleDeleteItem(item)}
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
                          <th>Nome</th>
                          <th>Marca</th>
                          <th>Modello</th>
                          <th>Categoria</th>
                          <th>Scorte</th>
                          <th>Prezzo</th>
                          <th>Ubicazione</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => {
                          const categoryInfo = getCategoryInfo(item.category);

                          return (
                            <tr key={item.id} className="table-row">
                              <td className="table-code">{item.code}</td>
                              <td className="table-name">
                                <div className="name-with-icon">
                                  <div
                                    className={`table-icon ${item.category}`}
                                  >
                                    {categoryInfo?.icon || "📦"}
                                  </div>
                                  <div>
                                    <div className="table-item-name">
                                      {item.name}
                                    </div>
                                    <div className="table-item-desc">
                                      {item.description ||
                                        "Nessuna descrizione"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>{item.brand}</td>
                              <td>{item.model}</td>
                              <td>
                                <span
                                  className="category-badge"
                                  style={{
                                    backgroundColor: categoryInfo?.color + "20",
                                    color: categoryInfo?.color,
                                  }}
                                >
                                  {categoryInfo?.icon} {categoryInfo?.name}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`stock-quantity ${
                                    item.stockStatus === "low"
                                      ? "quantity-low"
                                      : item.stockStatus === "out"
                                      ? "quantity-out"
                                      : ""
                                  }`}
                                >
                                  {item.quantity} / {item.minQuantity}+
                                </span>
                              </td>
                              <td className="table-price">
                                € {item.unitPrice.toFixed(2)}
                              </td>
                              <td>{item.location || "Non specificata"}</td>
                              <td className="table-actions">
                                <button
                                  className="action-btn btn-view"
                                  onClick={() => openModal("view", item)}
                                  title="Visualizza dettagli"
                                >
                                  👁️
                                </button>
                                <button
                                  className="action-btn btn-edit"
                                  onClick={() => openModal("edit", item)}
                                  title="Modifica articolo"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="action-btn btn-delete"
                                  onClick={() => handleDeleteItem(item)}
                                  title="Elimina articolo"
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

                {/* Paginazione */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-secondary"
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1 || loading}
                    >
                      Precedente
                    </button>

                    <span className="pagination-info">
                      Pagina {currentPage} di {totalPages}({totalCount} articoli
                      totali)
                    </span>

                    <button
                      className="btn btn-secondary"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages || loading}
                    >
                      Successiva
                    </button>
                  </div>
                )}

                {/* Messaggio se non ci sono risultati */}
                {filteredItems.length === 0 && !loading && (
                  <div className="error-container">
                    <h2>📦 Nessun articolo trovato</h2>
                    <p>
                      Modifica i filtri di ricerca o aggiungi nuovi articoli al
                      magazzino
                    </p>
                    <button
                      className="btn btn-success"
                      onClick={() => openModal("add")}
                    >
                      Aggiungi Primo Articolo
                    </button>
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
                  {modalMode === "add" && "Aggiungi Nuovo Articolo"}
                  {modalMode === "edit" && "Modifica Articolo"}
                  {modalMode === "view" && "Dettagli Articolo"}
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
                      <option
                        key={supplier.supplierId}
                        value={supplier.supplierId}
                      >
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
                    <label>Scorta Massima</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.maxQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      readOnly={modalMode === "view"}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Prezzo Unitario € *</label>
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

                {/* Informazioni aggiuntive in modalità view */}
                {modalMode === "view" && selectedItem && (
                  <>
                    <hr />
                    <div className="form-group">
                      <label>Valore Totale</label>
                      <input
                        type="text"
                        className="form-control"
                        value={`€ ${selectedItem.totalValue.toFixed(2)}`}
                        readOnly
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
                        <label>Creato il</label>
                        <input
                          type="text"
                          className="form-control"
                          value={new Date(
                            selectedItem.createdAt
                          ).toLocaleDateString("it-IT")}
                          readOnly
                        />
                      </div>
                      {selectedItem.updatedAt && (
                        <div className="form-group">
                          <label>Modificato il</label>
                          <input
                            type="text"
                            className="form-control"
                            value={new Date(
                              selectedItem.updatedAt
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
                    onClick={handleSaveItem}
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

export default Magazzino;
