import React, { useState, useEffect, useCallback } from "react";
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
import deviceInventoryService, {
  type DeviceInventoryItem,
  type DeviceInventoryStats,
  type DeviceInventorySupplier,
  type CreateDeviceInventoryDto,
  type UpdateDeviceInventoryDto,
  type DeviceInventorySearchParams,
} from "../../services/deviceInventoryService";
import styles from "./magapp.styles.module.css";

const MagazzinoApparati: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");

  // Stati per i dati
  const [devices, setDevices] = useState<DeviceInventoryItem[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<DeviceInventoryItem[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<DeviceInventorySupplier[]>([]);
  const [stats, setStats] = useState<DeviceInventoryStats>({
    totalDevices: 0,
    availableDevices: 0,
    loanedDevices: 0,
    soldDevices: 0,
    courtesyDevices: 0,
    smartphones: 0,
    tablets: 0,
    totalPurchaseValue: 0,
    totalSellingValue: 0,
    potentialProfit: 0,
    newDevices: 0,
    usedDevices: 0,
    refurbishedDevices: 0,
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
  const [selectedDevice, setSelectedDevice] =
    useState<DeviceInventoryItem | null>(null);

  // Stati per il form
  const [formData, setFormData] = useState({
    code: "",
    deviceType: "smartphone" as "smartphone" | "tablet",
    brand: "",
    model: "",
    imei: "",
    esn: "",
    color: "",
    deviceCondition: "new" as "new" | "used" | "refurbished",
    isCourtesyDevice: false,
    deviceStatus: "available" as
      | "available"
      | "loaned"
      | "sold"
      | "unavailable",
    supplierId: "",
    purchasePrice: 0,
    sellingPrice: 0,
    location: "",
    notes: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadDeviceData();
  }, [
    searchQuery,
    selectedType,
    selectedBrand,
    selectedSupplier,
    selectedCondition,
    selectedStatus,
    showCourtesyOnly,
    currentPage,
  ]);

  // Funzioni per il caricamento dei dati
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Imposta il multitenantId (dovresti prenderlo dal contesto/auth)
      const multitenantId = localStorage.getItem("multitenantId");
      if (multitenantId) {
        deviceInventoryService.setMultitenantId(multitenantId);
      }

      // Carica fornitori
      const suppliersData = await deviceInventoryService.getSuppliers();
      setSuppliers(suppliersData);
    } catch (err) {
      console.error("Errore nel caricamento dati iniziali:", err);
      setError("Errore nel caricamento dei fornitori");
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams: DeviceInventorySearchParams = {
        searchQuery: searchQuery.trim() || undefined,
        deviceType: selectedType || undefined,
        brand: selectedBrand || undefined,
        supplierId: selectedSupplier || undefined,
        deviceCondition: selectedCondition || undefined,
        deviceStatus: selectedStatus || undefined,
        isCourtesyDevice: showCourtesyOnly ? true : undefined,
        page: currentPage,
        pageSize: pageSize,
        sortBy: "code",
        sortDescending: false,
      };

      const response = await deviceInventoryService.searchItems(searchParams);

      setDevices(response.items);
      setFilteredDevices(response.items);
      setStats(response.stats);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Errore nel caricamento dei dati",
        "loadDeviceData"
      );
      console.error("Errore nel caricamento apparati:", err);
      setError(errorMessage || "Errore nel caricamento dei dati");
      setDevices([]);
      setFilteredDevices([]);
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
    showCourtesyOnly,
    currentPage,
  ]);

  // Funzioni per la gestione del modal
  const openModal = (
    mode: "add" | "edit" | "view",
    device?: DeviceInventoryItem
  ) => {
    setModalMode(mode);
    setSelectedDevice(device || null);

    if (device && (mode === "edit" || mode === "view")) {
      setFormData({
        code: device.code,
        deviceType: device.deviceType,
        brand: device.brand,
        model: device.model,
        imei: device.imei,
        esn: device.esn || "",
        color: device.color,
        deviceCondition: device.deviceCondition,
        isCourtesyDevice: device.isCourtesyDevice,
        deviceStatus: device.deviceStatus,
        supplierId: device.supplierId,
        purchasePrice: device.purchasePrice,
        sellingPrice: device.sellingPrice,
        location: device.location || "",
        notes: device.notes || "",
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
      deviceType: "smartphone",
      brand: "",
      model: "",
      imei: "",
      esn: "",
      color: "",
      deviceCondition: "new",
      isCourtesyDevice: false,
      deviceStatus: "available",
      supplierId: "",
      purchasePrice: 0,
      sellingPrice: 0,
      location: "",
      notes: "",
    });
  };

  const handleSaveDevice = async () => {
    try {
      // Validazione
      if (
        !formData.code.trim() ||
        !formData.brand.trim() ||
        !formData.model.trim() ||
        !formData.imei.trim() ||
        !formData.supplierId
      ) {
        alert("Compila tutti i campi obbligatori (contrassegnati con *)");
        return;
      }

      setLoading(true);

      const multitenantId = deviceInventoryService.getMultitenantId() || "";

      if (modalMode === "add") {
        const newDeviceData: CreateDeviceInventoryDto = {
          code: formData.code.trim(),
          deviceType: formData.deviceType,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          imei: formData.imei.trim(),
          esn: formData.esn.trim() || undefined,
          color: formData.color.trim(),
          deviceCondition: formData.deviceCondition,
          isCourtesyDevice: formData.isCourtesyDevice,
          deviceStatus: formData.deviceStatus,
          supplierId: formData.supplierId,
          purchasePrice: formData.purchasePrice,
          sellingPrice: formData.sellingPrice,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          multitenantId: multitenantId,
        };

        await deviceInventoryService.createItem(newDeviceData);
        alert("Apparato aggiunto con successo!");
      } else if (modalMode === "edit" && selectedDevice) {
        const updateData: UpdateDeviceInventoryDto = {
          code: formData.code.trim(),
          deviceType: formData.deviceType,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          imei: formData.imei.trim(),
          esn: formData.esn.trim() || undefined,
          color: formData.color.trim(),
          deviceCondition: formData.deviceCondition,
          isCourtesyDevice: formData.isCourtesyDevice,
          deviceStatus: formData.deviceStatus,
          supplierId: formData.supplierId,
          purchasePrice: formData.purchasePrice,
          sellingPrice: formData.sellingPrice,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };

        await deviceInventoryService.updateItem(selectedDevice.id, updateData);
        alert("Apparato modificato con successo!");
      }

      closeModal();
      await loadDeviceData();
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Errore nel caricamento dei dati",
        "loadDeviceData"
      );
      console.error("Errore nel salvataggio:", err);
      alert(errorMessage || "Errore durante il salvataggio dell'apparato");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (device: DeviceInventoryItem) => {
    if (
      confirm(
        `Sei sicuro di voler eliminare l'apparato "${device.brand} ${device.model}"?`
      )
    ) {
      try {
        setLoading(true);
        await deviceInventoryService.deleteItem(device.id);
        alert("Apparato eliminato con successo!");
        await loadDeviceData();
      } catch (err) {
        const errorMessage = handleApiError(
          err,
          "Errore nel caricamento dei dati",
          "loadDeviceData"
        );
        console.error("Errore nell'eliminazione:", err);
        alert(errorMessage || "Errore durante l'eliminazione dell'apparato");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      setLoading(true);
      const blob = await deviceInventoryService.exportToCsv();
      deviceInventoryService.downloadCsvFile(blob);
      alert("Export completato con successo!");
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Errore nel caricamento dei dati",
        "loadDeviceData"
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
    const brands = new Set(devices.map((d) => d.brand));
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

  // Handlers per filtri
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setCurrentPage(1);
  };

  const handleSupplierChange = (value: string) => {
    setSelectedSupplier(value);
    setCurrentPage(1);
  };

  const handleConditionChange = (value: string) => {
    setSelectedCondition(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleCourtesyChange = (checked: boolean) => {
    setShowCourtesyOnly(checked);
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
  if (loading && devices.length === 0) {
    return (
      <div className={styles.mainLayout}>
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}>
          <Topbar toggleMenu={toggleMenu} />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <span>Caricamento magazzino apparati...</span>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  if (error && devices.length === 0) {
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
              onClick={loadDeviceData}
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

        {/* Header */}
        <div className={styles.schedaHeader}>
          <div className={styles.leftBlock}>
            <div className={styles.warehouseIconBtn}>
              <Smartphone className={styles.warehouseIcon} />
            </div>
            <div className={styles.warehouseInfo}>
              <h2 className={styles.warehouseTitle}>Gestione Apparati</h2>
              <p className={styles.warehouseSubtitle}>
                Centro Assistenza Mobile
              </p>
            </div>
            <div className={styles.statsBox}>
              <BarChart3 className={styles.statsIcon} />
              <div className={styles.statsText}>
                <span>{stats.totalDevices} Apparati Totali</span>
                <span>€ {stats.totalPurchaseValue.toFixed(2)} Valore</span>
              </div>
            </div>
          </div>

          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Roma - Next srl</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>Magazzino Apparati</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          <div className={styles.warehouseContainer}>
            {/* Header della pagina */}
            <div className={styles.pageTitle}>
              <h1>
                <Smartphone style={{ width: "32px", height: "32px" }} />
                Magazzino Apparati
              </h1>
              <p>Gestione smartphone e tablet per il centro assistenza</p>
            </div>

            {/* Statistiche rapide */}
            <div className={styles.quickStats}>
              <div className={styles.statCard}>
                <h3 className={styles.statNumber}>{stats.availableDevices}</h3>
                <p className={styles.statLabel}>Disponibili</p>
              </div>
              <div className={styles.statCard}>
                <h3 className={styles.statNumber} style={{ color: "#ffc107" }}>
                  {stats.loanedDevices}
                </h3>
                <p className={styles.statLabel}>In Prestito</p>
              </div>
              <div className={styles.statCard}>
                <h3 className={styles.statNumber} style={{ color: "#17a2b8" }}>
                  {stats.courtesyDevices}
                </h3>
                <p className={styles.statLabel}>Cortesia Disponibili</p>
              </div>
              <div className={styles.statCard}>
                <h3 className={styles.statNumber} style={{ color: "#28a745" }}>
                  € {stats.totalPurchaseValue.toFixed(0)}
                </h3>
                <p className={styles.statLabel}>Valore Totale</p>
              </div>
            </div>

            {/* Layout principale */}
            <div className={styles.warehouseLayout}>
              {/* Sidebar filtri */}
              <div className={styles.filtersSidebar}>
                <div className={styles.filterSection}>
                  <h3>Ricerca</h3>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="Cerca per codice, marca, IMEI..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h3>Tipo Apparato</h3>
                  <div className={styles.formGroup}>
                    <select
                      className={styles.formControl}
                      value={selectedType}
                      onChange={(e) => handleTypeChange(e.target.value)}
                    >
                      <option value="">Tutti i tipi</option>
                      <option value="smartphone">📱 Smartphone</option>
                      <option value="tablet">📋 Tablet</option>
                    </select>
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h3>Marca</h3>
                  <div className={styles.formGroup}>
                    <select
                      className={styles.formControl}
                      value={selectedBrand}
                      onChange={(e) => handleBrandChange(e.target.value)}
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

                <div className={styles.filterSection}>
                  <h3>Condizione</h3>
                  <div className={styles.formGroup}>
                    <select
                      className={styles.formControl}
                      value={selectedCondition}
                      onChange={(e) => handleConditionChange(e.target.value)}
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
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value="">Tutti gli stati</option>
                      <option value="available">Disponibile</option>
                      <option value="loaned">In Prestito</option>
                      <option value="sold">Venduto</option>
                      <option value="unavailable">Non Disponibile</option>
                    </select>
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h3>Cortesia</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={showCourtesyOnly}
                        onChange={(e) => handleCourtesyChange(e.target.checked)}
                      />
                      <span>Solo apparati di cortesia</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Area principale */}
              <div className={styles.mainArea}>
                {/* Toolbar */}
                <div className={styles.warehouseToolbar}>
                  <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Ricerca rapida nel magazzino apparati..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>

                  {/* Selettore visualizzazione */}
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
                      className={`${styles.btn} ${styles.btnSuccess}`}
                      onClick={() => openModal("add")}
                      disabled={loading}
                    >
                      Aggiungi Apparato
                    </button>
                  </div>
                </div>

                {/* Loading overlay per operazioni */}
                {loading && devices.length > 0 && (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.loadingSpinner}></div>
                  </div>
                )}

                {/* Area contenuto - Vista condizionale */}
                {viewMode === "grid" ? (
                  /* Griglia apparati */
                  <div className={styles.itemsGrid}>
                    {filteredDevices.map((device) => {
                      const supplierInfo = suppliers.find(
                        (s) => s.supplierId === device.supplierId
                      );

                      return (
                        <div key={device.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <div
                              className={`${styles.itemIcon} ${
                                styles[device.deviceType]
                              }`}
                            >
                              {device.deviceType === "smartphone" ? "📱" : "📋"}
                            </div>
                            <div className={styles.itemInfo}>
                              <div className={styles.itemCode}>
                                {device.code}
                              </div>
                              <h4 className={styles.itemName}>
                                {device.brand} {device.model}
                              </h4>
                              <p className={styles.itemDescription}>
                                {device.color} •{" "}
                                {getConditionText(device.deviceCondition)}
                              </p>
                            </div>
                            <div className={styles.tableStatus}>
                              <span
                                className={`${
                                  styles.statusBadge
                                } ${getStatusBadgeClass(device.deviceStatus)}`}
                              >
                                {getStatusText(device.deviceStatus)}
                              </span>
                            </div>
                          </div>

                          {device.isCourtesyDevice && (
                            <div className={styles.courtesyBadge}>
                              🤝 Dispositivo di Cortesia
                            </div>
                          )}

                          <div className={styles.itemDetails}>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>IMEI:</span>
                              <span
                                className={`${styles.itemValue} ${styles.itemImei}`}
                              >
                                {device.imei}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>ESN:</span>
                              <span className={styles.itemValue}>
                                {device.esn || "-"}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>
                                Condizione:
                              </span>
                              <span
                                className={`${
                                  styles.conditionBadge
                                } ${getConditionBadgeClass(
                                  device.deviceCondition
                                )}`}
                              >
                                {getConditionText(device.deviceCondition)}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>
                                Prezzo Acquisto:
                              </span>
                              <span className={styles.priceValue}>
                                € {device.purchasePrice.toFixed(2)}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>
                                Prezzo Vendita:
                              </span>
                              <span className={styles.priceValue}>
                                € {device.sellingPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>
                                Ubicazione:
                              </span>
                              <span className={styles.itemValue}>
                                {device.location || "Non specificata"}
                              </span>
                            </div>
                            <div className={styles.itemRow}>
                              <span className={styles.itemLabel}>
                                Fornitore:
                              </span>
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
                                onClick={() => openModal("edit", device)}
                              >
                                Modifica
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnDanger}`}
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
                  <div className={styles.itemsTableContainer}>
                    <table className={styles.itemsTable}>
                      <thead>
                        <tr>
                          <th className={styles.colCode}>Codice</th>
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
                            <tr key={device.id} className={styles.tableRow}>
                              <td className={styles.tableCode}>
                                {device.code}
                              </td>
                              <td>
                                <span className={styles.typeBadge}>
                                  {device.deviceType === "smartphone"
                                    ? "📱"
                                    : "📋"}
                                </span>
                              </td>
                              <td className={styles.tableName}>
                                <div className={styles.nameWithIcon}>
                                  <div
                                    className={`${styles.tableIcon} ${
                                      styles[device.deviceType]
                                    }`}
                                  >
                                    {device.deviceType === "smartphone"
                                      ? "📱"
                                      : "📋"}
                                  </div>
                                  <div>
                                    <div className={styles.tableItemName}>
                                      {device.brand} {device.model}
                                    </div>
                                    <div className={styles.tableItemDesc}>
                                      {device.color}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={styles.imeiText}>
                                  {device.imei}
                                </span>
                              </td>
                              <td>{device.esn || "-"}</td>
                              <td>{device.color}</td>
                              <td>
                                <span
                                  className={`${
                                    styles.conditionBadge
                                  } ${getConditionBadgeClass(
                                    device.deviceCondition
                                  )}`}
                                >
                                  {getConditionText(device.deviceCondition)}
                                </span>
                              </td>
                              <td className={styles.tableStatus}>
                                <span
                                  className={`${
                                    styles.statusBadge
                                  } ${getStatusBadgeClass(
                                    device.deviceStatus
                                  )}`}
                                >
                                  {getStatusText(device.deviceStatus)}
                                </span>
                              </td>
                              <td>
                                {device.isCourtesyDevice ? (
                                  <span className={styles.courtesyIndicator}>
                                    🤝
                                  </span>
                                ) : (
                                  <span className={styles.noCourtesy}>-</span>
                                )}
                              </td>
                              <td className={styles.tablePrice}>
                                € {device.purchasePrice.toFixed(2)}
                              </td>
                              <td className={styles.tablePrice}>
                                € {device.sellingPrice.toFixed(2)}
                              </td>
                              <td className={styles.tableActions}>
                                <button
                                  className={`${styles.actionBtn} ${styles.btnView}`}
                                  onClick={() => openModal("view", device)}
                                  title="Visualizza dettagli"
                                >
                                  👁️
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${styles.btnEdit}`}
                                  onClick={() => openModal("edit", device)}
                                  title="Modifica apparato"
                                >
                                  ✏️
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${styles.btnDelete}`}
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

                {/* Paginazione */}
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
                      Pagina {currentPage} di {totalPages} ({totalCount}{" "}
                      apparati totali)
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

                {/* Messaggio se non ci sono risultati */}
                {filteredDevices.length === 0 && !loading && (
                  <div className={styles.errorContainer}>
                    <h2>📱 Nessun apparato trovato</h2>
                    <p>
                      Modifica i filtri di ricerca o aggiungi nuovi apparati al
                      magazzino
                    </p>
                    <button
                      className={`${styles.btn} ${styles.btnSuccess}`}
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
            className={styles.modalOverlay}
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {modalMode === "add" && "Aggiungi Nuovo Apparato"}
                  {modalMode === "edit" && "Modifica Apparato"}
                  {modalMode === "view" && "Dettagli Apparato"}
                </h3>
                <button className={styles.modalClose} onClick={closeModal}>
                  <X />
                </button>
              </div>

              <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <div className={styles.formGroup}>
                  <label>Codice Apparato *</label>
                  <input
                    type="text"
                    className={styles.formControl}
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
                  <div className={styles.formGroup}>
                    <label>Tipo Apparato *</label>
                    <select
                      className={styles.formControl}
                      value={formData.deviceType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deviceType: e.target.value as "smartphone" | "tablet",
                        })
                      }
                      disabled={modalMode === "view"}
                    >
                      <option value="smartphone">📱 Smartphone</option>
                      <option value="tablet">📋 Tablet</option>
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
                  <div className={styles.formGroup}>
                    <label>IMEI *</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={formData.imei}
                      onChange={(e) =>
                        setFormData({ ...formData, imei: e.target.value })
                      }
                      placeholder="Es: 353456789012345"
                      readOnly={modalMode === "view"}
                    />
                  </div>

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
                  <div className={styles.formGroup}>
                    <label>Condizione *</label>
                    <select
                      className={styles.formControl}
                      value={formData.deviceCondition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deviceCondition: e.target.value as
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

                  <div className={styles.formGroup}>
                    <label>Stato *</label>
                    <select
                      className={styles.formControl}
                      value={formData.deviceStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deviceStatus: e.target.value as
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

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
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
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className={styles.formGroup}>
                    <label>Prezzo Acquisto € *</label>
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
                    <label>Prezzo Vendita € *</label>
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
                      <div className={styles.formGroup}>
                        <label>Creato il</label>
                        <input
                          type="text"
                          className={styles.formControl}
                          value={new Date(
                            selectedDevice.createdAt
                          ).toLocaleDateString("it-IT")}
                          readOnly
                        />
                      </div>
                      {selectedDevice.updatedAt && (
                        <div className={styles.formGroup}>
                          <label>Modificato il</label>
                          <input
                            type="text"
                            className={styles.formControl}
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

              <div className={styles.modalActions}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={closeModal}
                  disabled={loading}
                >
                  {modalMode === "view" ? "Chiudi" : "Annulla"}
                </button>
                {modalMode !== "view" && (
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
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
