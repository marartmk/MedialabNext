import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { handleApiError } from "../../utils/errorHandler";
import {
  Smartphone,
  Search,
  BarChart3,
  X,
  Grid3X3,
  List,
  Download,
  AlertTriangle,
} from "lucide-react";
import accessoryInventoryService, {
  type AccessoryInventoryItem,
  type AccessoryInventoryStats,
  type AccessoryInventorySupplier,
  type AccessoryInventorySearchParams,
  type CreateAccessoryInventoryDto,
  type UpdateAccessoryInventoryDto,
} from "../../services/accessoryInventoryService";
import styles from "./magazzino-accessori.module.css";

type AccessoryType = AccessoryInventoryItem["accessoryType"];
type AccessoryCondition = AccessoryInventoryItem["accessoryCondition"];
type AccessoryStatus = AccessoryInventoryItem["accessoryStatus"];

const MagazzinoAccessori: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");

  const [accessories, setAccessories] = useState<AccessoryInventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<AccessoryInventorySupplier[]>([]);
  const [stats, setStats] = useState<AccessoryInventoryStats>({
    totalAccessories: 0,
    availableAccessories: 0,
    loanedAccessories: 0,
    soldAccessories: 0,
    courtesyAccessories: 0,
    lowStockAccessories: 0,
    outOfStockAccessories: 0,
    totalPurchaseValue: 0,
    totalSellingValue: 0,
    potentialProfit: 0,
    newAccessories: 0,
    usedAccessories: 0,
    refurbishedAccessories: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedAccessory, setSelectedAccessory] =
    useState<AccessoryInventoryItem | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    accessoryType: "power-cables" as AccessoryType,
    brand: "",
    model: "",
    esn: "",
    color: "",
    accessoryCondition: "new" as AccessoryCondition,
    isCourtesyAccessory: false,
    accessoryStatus: "available" as AccessoryStatus,
    supplierId: "",
    purchasePrice: 0,
    sellingPrice: 0,
    quantityInStock: 0,
    minimumStock: 0,
    location: "",
    notes: "",
  });

  const pageSize = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAccessoryData();
  }, [
    searchQuery,
    selectedType,
    selectedBrand,
    selectedSupplier,
    selectedCondition,
    selectedStatus,
    currentPage,
  ]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const multitenantId = sessionStorage.getItem("multitenantId");
      if (multitenantId) {
        accessoryInventoryService.setMultitenantId(multitenantId);
      }

      const suppliersData = await accessoryInventoryService.getSuppliers();
      setSuppliers(suppliersData);
    } catch (err) {
      console.error("Errore nel caricamento dati iniziali:", err);
      setError("Errore nel caricamento dei fornitori");
    } finally {
      setLoading(false);
    }
  };

  const loadAccessoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams: AccessoryInventorySearchParams = {
        searchQuery: searchQuery.trim() || undefined,
        accessoryType: selectedType || undefined,
        brand: selectedBrand || undefined,
        supplierId: selectedSupplier || undefined,
        accessoryCondition: selectedCondition || undefined,
        accessoryStatus: selectedStatus || undefined,
        page: currentPage,
        pageSize: pageSize,
        sortBy: "code",
        sortDescending: false,
      };

      const response = await accessoryInventoryService.searchItems(searchParams);

      setAccessories(response.items);
      setStats(response.stats);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Errore nel caricamento dei dati",
        "loadAccessoryData"
      );
      console.error("Errore nel caricamento accessori:", err);
      setError(errorMessage || "Errore nel caricamento dei dati");
      setAccessories([]);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedType,
    selectedBrand,
    selectedSupplier,
    selectedCondition,
    selectedStatus,
    currentPage,
  ]);

  const openModal = (
    mode: "add" | "edit" | "view",
    accessory?: AccessoryInventoryItem
  ) => {
    setModalMode(mode);
    setSelectedAccessory(accessory || null);

    if (accessory && (mode === "edit" || mode === "view")) {
      setFormData({
        code: accessory.code,
        accessoryType: accessory.accessoryType,
        brand: accessory.brand,
        model: accessory.model,
        esn: accessory.esn || "",
        color: accessory.color,
        accessoryCondition: accessory.accessoryCondition,
        isCourtesyAccessory: accessory.isCourtesyAccessory,
        accessoryStatus: accessory.accessoryStatus,
        supplierId: accessory.supplierId,
        purchasePrice: accessory.purchasePrice,
        sellingPrice: accessory.sellingPrice,
        quantityInStock: accessory.quantityInStock,
        minimumStock: accessory.minimumStock,
        location: accessory.location || "",
        notes: accessory.notes || "",
      });
    } else {
      resetForm();
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAccessory(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: "",
      accessoryType: "power-cables",
      brand: "",
      model: "",
      esn: "",
      color: "",
      accessoryCondition: "new",
      isCourtesyAccessory: false,
      accessoryStatus: "available",
      supplierId: "",
      purchasePrice: 0,
      sellingPrice: 0,
      quantityInStock: 0,
      minimumStock: 0,
      location: "",
      notes: "",
    });
  };

  const handleSaveAccessory = async () => {
    try {
      if (
        !formData.code.trim() ||
        !formData.brand.trim() ||
        !formData.model.trim() ||
        !formData.supplierId
      ) {
        alert("Compila tutti i campi obbligatori (contrassegnati con *)");
        return;
      }

      setLoading(true);

      const multitenantId = accessoryInventoryService.getMultitenantId() || "";

      if (modalMode === "add") {
        const newAccessoryData: CreateAccessoryInventoryDto = {
          code: formData.code.trim(),
          accessoryType: formData.accessoryType,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          esn: formData.esn.trim() || undefined,
          color: formData.color.trim(),
          accessoryCondition: formData.accessoryCondition,
          isCourtesyAccessory: formData.isCourtesyAccessory,
          accessoryStatus: formData.accessoryStatus,
          supplierId: formData.supplierId,
          purchasePrice: formData.purchasePrice,
          sellingPrice: formData.sellingPrice,
          quantityInStock: formData.quantityInStock,
          minimumStock: formData.minimumStock,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          multitenantId: multitenantId,
        };

        await accessoryInventoryService.createItem(newAccessoryData);
        alert("Accessorio aggiunto con successo!");
      } else if (modalMode === "edit" && selectedAccessory) {
        const updateData: UpdateAccessoryInventoryDto = {
          code: formData.code.trim(),
          accessoryType: formData.accessoryType,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          esn: formData.esn.trim() || undefined,
          color: formData.color.trim(),
          accessoryCondition: formData.accessoryCondition,
          isCourtesyAccessory: formData.isCourtesyAccessory,
          accessoryStatus: formData.accessoryStatus,
          supplierId: formData.supplierId,
          purchasePrice: formData.purchasePrice,
          sellingPrice: formData.sellingPrice,
          quantityInStock: formData.quantityInStock,
          minimumStock: formData.minimumStock,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };

        await accessoryInventoryService.updateItem(
          selectedAccessory.id,
          updateData
        );
        alert("Accessorio modificato con successo!");
      }

      closeModal();
      await loadAccessoryData();
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Errore nel salvataggio dei dati",
        "handleSaveAccessory"
      );
      console.error("Errore nel salvataggio:", err);
      alert(errorMessage || "Errore durante il salvataggio dell'accessorio");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccessory = async (accessory: AccessoryInventoryItem) => {
    if (
      confirm(
        `Sei sicuro di voler eliminare "${accessory.brand} ${accessory.model}"?`
      )
    ) {
      try {
        setLoading(true);
        await accessoryInventoryService.deleteItem(accessory.id);
        alert("Accessorio eliminato con successo!");
        await loadAccessoryData();
      } catch (err) {
        const errorMessage = handleApiError(
          err,
          "Errore nell'eliminazione dei dati",
          "handleDeleteAccessory"
        );
        console.error("Errore nell'eliminazione:", err);
        alert(errorMessage || "Errore durante l'eliminazione dell'accessorio");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      setLoading(true);
      const blob = await accessoryInventoryService.exportToCsv();
      accessoryInventoryService.downloadCsvFile(blob);
      alert("Export completato con successo!");
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Errore nell'export dei dati",
        "handleExportCsv"
      );
      console.error("Errore nell'export:", err);
      alert(errorMessage || "Errore durante l'export dei dati");
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const getBrands = (): string[] => {
    const brands = new Set(accessories.map((d) => d.brand));
    return Array.from(brands).sort();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return styles.statusAvailable;
      case "loaned":
        return styles.statusLoaned;
      case "sold":
        return styles.statusSold;
      case "unavailable":
        return styles.statusUnavailable;
      default:
        return styles.statusAvailable;
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
        return styles.conditionNew;
      case "used":
        return styles.conditionUsed;
      case "refurbished":
        return styles.conditionRefurbished;
      default:
        return styles.conditionNew;
    }
  };

  const getTypeLabel = (type: AccessoryType) => {
    switch (type) {
      case "power-cables":
        return "🔌 Alimentazione & Cavi";
      case "audio":
        return "🎧 Audio";
      case "protection":
        return "🛡️ Protezione";
      case "auto-mobility":
        return "🚗 Auto & Mobilità";
      case "stands":
        return "🧲 Supporti & Stand";
      case "wearables-extra":
        return "⌚ Wearable & Extra";
      case "other-services":
        return "🧰 Altri / Servizi";
      default:
        return "🧰 Altri / Servizi";
    }
  };

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

  if (loading && accessories.length === 0) {
    return (
      <div className={styles.mainLayout}>
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}>
          <Topbar toggleMenu={toggleMenu} />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <span>Caricamento magazzino accessori...</span>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  if (error && accessories.length === 0) {
    return (
      <div className={styles.mainLayout}>
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}>
          <Topbar toggleMenu={toggleMenu} />
          <div className={styles.errorContainer}>
            <h2>
              <AlertTriangle /> Errore nel caricamento
            </h2>
            <p>{error}</p>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={loadAccessoryData}
            >
              Riprova
            </button>
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

        <div className={styles.schedaHeader}>
          <div className={styles.leftBlock}>
            <div className={styles.warehouseIconBtn}>
              <Smartphone className={styles.warehouseIcon} />
            </div>
            <div className={styles.warehouseInfo}>
              <h2 className={styles.warehouseTitle}>Gestione Accessori</h2>
              <p className={styles.warehouseSubtitle}>Centro Assistenza Mobile</p>
            </div>
            <div className={styles.statsBox}>
              <BarChart3 className={styles.statsIcon} />
              <div className={styles.statsText}>
                <span>{stats.totalAccessories} Accessori Totali</span>
                <span>EUR {stats.totalPurchaseValue.toFixed(2)} Valore</span>
              </div>
            </div>
          </div>

          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Roma - Next srl</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>Magazzino Accessori</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          <div className={styles.warehouseContainer}>
            <div className={styles.pageTitle}>
              <h1>
                <Smartphone style={{ width: "32px", height: "32px" }} />
                Magazzino Accessori
              </h1>
              <p>Gestione accessori per il centro assistenza</p>
            </div>

            <div className={styles.quickStats}>
              <div className={styles.statCard}>
                <h3 className={styles.statNumber}>{stats.availableAccessories}</h3>
                <p className={styles.statLabel}>Disponibili</p>
              </div>
              <div className={styles.statCard}>
                <h3 className={styles.statNumber} style={{ color: "#ffc107" }}>
                  {stats.lowStockAccessories}
                </h3>
                <p className={styles.statLabel}>In Esaurimento</p>
              </div>
              <div className={styles.statCard}>
                <h3 className={styles.statNumber} style={{ color: "#17a2b8" }}>
                  {stats.outOfStockAccessories}
                </h3>
                <p className={styles.statLabel}>Esauriti</p>
              </div>
              <div className={styles.statCard}>
                <h3 className={styles.statNumber} style={{ color: "#28a745" }}>
                  EUR {stats.totalPurchaseValue.toFixed(0)}
                </h3>
                <p className={styles.statLabel}>Valore Totale</p>
              </div>
            </div>

            <div className={styles.warehouseLayout}>
              <div className={styles.filtersSidebar}>
                <div className={styles.filterSection}>
                  <h3>Ricerca</h3>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="Cerca per codice, marca, modello..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h3>Tipo Accessorio</h3>
                  <div className={styles.formGroup}>
                    <select
                      className={styles.formControl}
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tutti i tipi</option>
                      <option value="power-cables">🔌 Alimentazione & Cavi</option>
                      <option value="audio">🎧 Audio</option>
                      <option value="protection">🛡️ Protezione</option>
                      <option value="auto-mobility">🚗 Auto & Mobilità</option>
                      <option value="stands">🧲 Supporti & Stand</option>
                      <option value="wearables-extra">⌚ Wearable & Extra</option>
                      <option value="other-services">🧰 Altri / Servizi</option>
                    </select>
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h3>Marca</h3>
                  <div className={styles.formGroup}>
                    <select
                      className={styles.formControl}
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value);
                        setCurrentPage(1);
                      }}
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

                <div className={styles.filterSection}>
                  <h3>Fornitore</h3>
                  <div className={styles.formGroup}>
                    <select
                      className={styles.formControl}
                      value={selectedSupplier}
                      onChange={(e) => {
                        setSelectedSupplier(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tutti i fornitori</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.supplierId} value={supplier.supplierId}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h3>Condizione</h3>
                  <div className={styles.formGroup}>
                    <select
                      className={styles.formControl}
                      value={selectedCondition}
                      onChange={(e) => {
                        setSelectedCondition(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tutte le condizioni</option>
                      <option value="new">Nuovo</option>
                      <option value="used">Usato</option>
                      <option value="refurbished">Rigenerato</option>
                    </select>
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h3>Stato</h3>
                  <div className={styles.formGroup}>
                    <select
                      className={styles.formControl}
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tutti gli stati</option>
                      <option value="available">Disponibile</option>
                      <option value="sold">Venduto</option>
                      <option value="unavailable">Non Disponibile</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className={styles.warehouseMain}>
                <div className={styles.warehouseToolbar}>
                  <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Ricerca rapida nel magazzino accessori..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  <div className={styles.viewSelector}>
                    <button
                      className={`${styles.viewBtn} ${
                        viewMode === "grid" ? styles.active : ""
                      }`}
                      onClick={() => setViewMode("grid")}
                      title="Vista Griglia"
                    >
                      <Grid3X3 className={styles.viewIcon} />
                    </button>
                    <button
                      className={`${styles.viewBtn} ${
                        viewMode === "list" ? styles.active : ""
                      }`}
                      onClick={() => setViewMode("list")}
                      title="Vista Lista"
                    >
                      <List className={styles.viewIcon} />
                    </button>
                  </div>

                  <div className={styles.toolbarActions}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={handleExportCsv}
                    >
                      <Download size={16} className={styles.btnIcon} />
                      Export CSV
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSuccess}`}
                      onClick={() => openModal("add")}
                    >
                      Aggiungi Accessorio
                    </button>
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <div className={styles.itemsGrid}>
                    {accessories.map((item) => {
                      const supplierInfo = suppliers.find(
                        (s) => s.supplierId === item.supplierId
                      );

                      return (
                        <div key={item.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <div
                              className={`${styles.itemIcon} ${styles.accessory}`}
                            >
                              🧩
                            </div>
                            <div className={styles.itemInfo}>
                              <div className={styles.itemCode}>{item.code}</div>
                              <h4 className={styles.itemName}>
                                {item.brand} {item.model}
                              </h4>
                              <p className={styles.itemDescription}>
                                {getTypeLabel(item.accessoryType)} • {item.color}
                              </p>
                            </div>
                            <div className={styles.tableStatus}>
                              <span
                                className={`${styles.statusBadge} ${getStatusBadgeClass(
                                  item.accessoryStatus
                                )}`}
                              >
                                {getStatusText(item.accessoryStatus)}
                              </span>
                            </div>
                          </div>

                          <div className={styles.itemDetails}>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>ESN:</span>
                              <span className={styles.itemValue}>
                                {item.esn || "-"}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>Condizione:</span>
                              <span
                                className={`${styles.conditionBadge} ${getConditionBadgeClass(
                                  item.accessoryCondition
                                )}`}
                              >
                                {getConditionText(item.accessoryCondition)}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>Quantita:</span>
                              <span className={styles.itemValue}>
                                {item.quantityInStock}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>Scorta Minima:</span>
                              <span className={styles.itemValue}>
                                {item.minimumStock}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>
                                Prezzo Acquisto:
                              </span>
                              <span className={styles.priceValue}>
                                EUR {item.purchasePrice.toFixed(2)}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>
                                Prezzo Vendita:
                              </span>
                              <span className={styles.priceValue}>
                                EUR {item.sellingPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>Fornitore:</span>
                              <span className={styles.itemValue}>
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
                                className={`${styles.btn} ${styles.btnWarning}`}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.75rem",
                                }}
                                onClick={() => openModal("edit", item)}
                              >
                                Modifica
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnDanger}`}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.75rem",
                                }}
                                onClick={() => handleDeleteAccessory(item)}
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
                  <div className={styles.itemsTableContainer}>
                    <table className={styles.itemsTable}>
                      <thead>
                        <tr>
                          <th className={styles.colCode}>Codice</th>
                          <th>Tipo</th>
                          <th>Marca</th>
                          <th>Modello</th>
                          <th>ESN</th>
                          <th>Colore</th>
                          <th>Condizione</th>
                          <th>Stato</th>
                          <th>Prezzo Acquisto</th>
                          <th>Prezzo Vendita</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessories.map((item) => (
                          <tr key={item.id}>
                            <td className={styles.tableCode}>{item.code}</td>
                            <td>{getTypeLabel(item.accessoryType)}</td>
                            <td>{item.brand}</td>
                            <td>{item.model}</td>
                            <td>{item.esn || "-"}</td>
                            <td>{item.color}</td>
                            <td>
                              <span
                                className={`${styles.conditionBadge} ${getConditionBadgeClass(
                                  item.accessoryCondition
                                )}`}
                              >
                                {getConditionText(item.accessoryCondition)}
                              </span>
                            </td>
                            <td className={styles.tableStatus}>
                              <span
                                className={`${styles.statusBadge} ${getStatusBadgeClass(
                                  item.accessoryStatus
                                )}`}
                              >
                                {getStatusText(item.accessoryStatus)}
                              </span>
                            </td>
                            <td className={styles.tablePrice}>
                              EUR {item.purchasePrice.toFixed(2)}
                            </td>
                            <td className={styles.tablePrice}>
                              EUR {item.sellingPrice.toFixed(2)}
                            </td>
                            <td className={styles.tableActions}>
                              <button
                                className={`${styles.actionBtn} ${styles.btnView}`}
                                onClick={() => openModal("view", item)}
                                title="Visualizza dettagli"
                              >
                                V
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.btnEdit}`}
                                onClick={() => openModal("edit", item)}
                                title="Modifica accessorio"
                              >
                                M
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.btnDelete}`}
                                onClick={() => handleDeleteAccessory(item)}
                                title="Elimina accessorio"
                              >
                                X
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1 || loading}
                    >
                      Precedente
                    </button>

                    <span className={styles.paginationInfo}>
                      Pagina {currentPage} di {totalPages} ({totalCount} accessori)
                    </span>

                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages || loading}
                    >
                      Successiva
                    </button>
                  </div>
                )}

                {accessories.length === 0 && !loading && (
                  <div className={styles.errorContainer}>
                    <h2>
                      <AlertTriangle /> Nessun accessorio trovato
                    </h2>
                    <p>Modifica i filtri di ricerca o aggiungi nuovi accessori</p>
                    <button
                      className={`${styles.btn} ${styles.btnSuccess}`}
                      onClick={() => openModal("add")}
                    >
                      Aggiungi Primo Accessorio
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {modalMode === "add" && "Aggiungi Nuovo Accessorio"}
                  {modalMode === "edit" && "Modifica Accessorio"}
                  {modalMode === "view" && "Dettagli Accessorio"}
                </h3>
                <button className={styles.modalClose} onClick={closeModal}>
                  <X />
                </button>
              </div>

              <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <div className={styles.formGroup}>
                  <label>Codice Accessorio *</label>
                  <input
                    type="text"
                    className={styles.formControl}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="Es: ACC-001"
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
                  <div className={styles.formGroup}>
                    <label>Tipo Accessorio *</label>
                    <select
                      className={styles.formControl}
                      value={formData.accessoryType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accessoryType: e.target.value as AccessoryType,
                        })
                      }
                      disabled={modalMode === "view"}
                    >
                      <option value="power-cables">🔌 Alimentazione & Cavi</option>
                      <option value="audio">🎧 Audio</option>
                      <option value="protection">🛡️ Protezione</option>
                      <option value="auto-mobility">🚗 Auto & Mobilità</option>
                      <option value="stands">🧲 Supporti & Stand</option>
                      <option value="wearables-extra">⌚ Wearable & Extra</option>
                      <option value="other-services">🧰 Altri / Servizi</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Marca *</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      placeholder="Es: Apple"
                      readOnly={modalMode === "view"}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Modello *</label>
                  <input
                    type="text"
                    className={styles.formControl}
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    placeholder="Es: Cover iPhone 14 Pro"
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
                  <div className={styles.formGroup}>
                    <label>ESN</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={formData.esn}
                      onChange={(e) =>
                        setFormData({ ...formData, esn: e.target.value })
                      }
                      placeholder="Es: ESN123456789"
                      readOnly={modalMode === "view"}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Colore *</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder="Es: Nero"
                      readOnly={modalMode === "view"}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className={styles.formGroup}>
                    <label>Condizione *</label>
                    <select
                      className={styles.formControl}
                      value={formData.accessoryCondition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accessoryCondition: e.target.value as AccessoryCondition,
                        })
                      }
                      disabled={modalMode === "view"}
                    >
                      <option value="new">Nuovo</option>
                      <option value="used">Usato</option>
                      <option value="refurbished">Rigenerato</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Stato *</label>
                    <select
                      className={styles.formControl}
                      value={formData.accessoryStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accessoryStatus: e.target.value as AccessoryStatus,
                        })
                      }
                      disabled={modalMode === "view"}
                    >
                      <option value="available">Disponibile</option>
                      <option value="sold">Venduto</option>
                      <option value="unavailable">Non Disponibile</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Fornitore *</label>
                  <select
                    className={styles.formControl}
                    value={formData.supplierId}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierId: e.target.value })
                    }
                    disabled={modalMode === "view"}
                  >
                    <option value="">Seleziona fornitore</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplierId} value={supplier.supplierId}>
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
                  <div className={styles.formGroup}>
                    <label>Quantita in Stock *</label>
                    <input
                      type="number"
                      className={styles.formControl}
                      value={formData.quantityInStock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantityInStock: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      min="0"
                      readOnly={modalMode === "view"}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Scorta Minima *</label>
                    <input
                      type="number"
                      className={styles.formControl}
                      value={formData.minimumStock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimumStock: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      min="0"
                      readOnly={modalMode === "view"}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className={styles.formGroup}>
                    <label>Prezzo Acquisto EUR *</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.formControl}
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

                  <div className={styles.formGroup}>
                    <label>Prezzo Vendita EUR *</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.formControl}
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

                <div className={styles.formGroup}>
                  <label>Ubicazione Magazzino</label>
                  <input
                    type="text"
                    className={styles.formControl}
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Es: A-01-001"
                    readOnly={modalMode === "view"}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Note</label>
                  <textarea
                    className={styles.formControl}
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Note aggiuntive..."
                    readOnly={modalMode === "view"}
                  />
                </div>

                {modalMode === "view" && selectedAccessory && (
                  <>
                    <hr />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div className={styles.formGroup}>
                        <label>Creato il</label>
                        <input
                          type="text"
                          className={styles.formControl}
                          value={new Date(
                            selectedAccessory.createdAt
                          ).toLocaleDateString("it-IT")}
                          readOnly
                        />
                      </div>
                      {selectedAccessory.updatedAt && (
                        <div className={styles.formGroup}>
                          <label>Modificato il</label>
                          <input
                            type="text"
                            className={styles.formControl}
                            value={new Date(
                              selectedAccessory.updatedAt
                            ).toLocaleDateString("it-IT")}
                            readOnly
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={closeModal}
                >
                  {modalMode === "view" ? "Chiudi" : "Annulla"}
                </button>
                {modalMode !== "view" && (
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleSaveAccessory}
                  >
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

export default MagazzinoAccessori;
