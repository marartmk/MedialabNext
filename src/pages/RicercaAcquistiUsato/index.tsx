import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

import styles from "./ricerca-acquisto-usato.modules.css";

// Interfacce TypeScript per i dati degli acquisti
interface PurchaseDetailDto {
  id: number;
  purchaseId: string;
  purchaseCode: string;
  purchaseType: string;
  deviceCondition: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  imei?: string;
  supplierId: string;
  supplierName?: string;
  companyId: string;
  companyName?: string;
  multitenantId: string;
  purchasePrice: number;
  shippingCost?: number;
  otherCosts?: number;
  vatRate: number;
  totalAmount: number;
  paymentType?: string;
  paymentStatus?: string;
  paidAmount: number;
  remainingAmount: number;
  installmentsCount?: number;
  installmentAmount?: number;
  purchaseStatus?: string;
  purchaseStatusCode?: string;
  supplierInvoiceNumber?: string;
  supplierInvoiceDate?: string;
  ddtNumber?: string;
  ddtDate?: string;
  buyerCode?: string;
  buyerName?: string;
  notes?: string;
  qualityCheckStatus?: string;
  qualityCheckDate?: string;
  hasSupplierWarranty: boolean;
  supplierWarrantyMonths?: number;
  purchaseDate?: string;
  receivedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

interface PurchaseSearchRequestDto {
  searchQuery?: string;
  purchaseCode?: string;
  purchaseGuid?: string;
  purchaseType?: string;
  deviceCondition?: string;
  supplierId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  imei?: string;
  purchaseStatus?: string;
  purchaseStatusCode?: string;
  paymentStatus?: string;
  paymentType?: string;
  buyerCode?: string;
  fromDate?: string;
  toDate?: string;
  minPrice?: number;
  maxPrice?: number;
  minAmount?: number;
  maxAmount?: number;
  hasInvoice?: boolean;
  qualityCheckStatus?: string;
  multitenantId?: string;
  companyId?: string;
  page?: number;
  pageSize?: number;
}

interface PurchasesStats {
  totalPurchases: number;
  totalCost: number;
  avgPurchaseValue: number;
  pendingPayments: number;
  completedPurchases: number;
  purchasesByStatus: { [key: string]: number };
  purchasesByCondition: { [key: string]: number };
  purchasesByPaymentStatus: { [key: string]: number };
}

const RicercaAcquistiUsato: React.FC = () => {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [companyName, setCompanyName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const API_URL = import.meta.env.VITE_API_URL;

  // Stati per la ricerca
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<PurchaseSearchRequestDto>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Stati per i risultati
  const [purchases, setPurchases] = useState<PurchaseDetailDto[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseDetailDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stati per le statistiche
  const [stats, setStats] = useState<PurchasesStats>({
    totalPurchases: 0,
    totalCost: 0,
    avgPurchaseValue: 0,
    pendingPayments: 0,
    completedPurchases: 0,
    purchasesByStatus: {},
    purchasesByCondition: {},
    purchasesByPaymentStatus: {},
  });

  // Stati per il modal dettagli acquisto
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDetailDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);

  // Filtri disponibili
  const PURCHASE_TYPES = [
    { value: "", label: "Tutti i tipi" },
    { value: "Apparato", label: "Apparato" },
    { value: "Accessorio", label: "Accessorio" },
  ];

  const DEVICE_CONDITIONS = [
    { value: "", label: "Tutte le condizioni" },
    { value: "Nuovo", label: "🆕 Nuovo" },
    { value: "Usato", label: "♻️ Usato" },
    { value: "Rigenerato", label: "🔧 Rigenerato" },
  ];

  const PURCHASE_STATUSES = [
    { value: "", label: "Tutti gli stati" },
    { value: "DRAFT", label: "📝 Bozza" },
    { value: "ORDERED", label: "📦 Ordinato" },
    { value: "RECEIVED", label: "✅ Ricevuto" },
    { value: "QUALITY_CHECK", label: "🔍 Controllo Qualità" },
    { value: "APPROVED", label: "✔️ Approvato" },
    { value: "REJECTED", label: "❌ Rifiutato" },
  ];

  const PAYMENT_STATUSES = [
    { value: "", label: "Tutti i pagamenti" },
    { value: "Da Pagare", label: "⏳ Da Pagare" },
    { value: "Parziale", label: "📊 Parziale" },
    { value: "Pagato", label: "✅ Pagato" },
    { value: "Rimborsato", label: "💰 Rimborsato" },
  ];

  const PAYMENT_TYPES = [
    { value: "", label: "Tutti i metodi" },
    { value: "Contanti", label: "💵 Contanti" },
    { value: "Carta", label: "💳 Carta" },
    { value: "Bonifico", label: "🏦 Bonifico" },
    { value: "Assegno", label: "📝 Assegno" },
  ];

  const QUALITY_CHECK_STATUSES = [
    { value: "", label: "Tutti" },
    { value: "Da Verificare", label: "⏳ Da Verificare" },
    { value: "In Verifica", label: "🔍 In Verifica" },
    { value: "Approvato", label: "✅ Approvato" },
    { value: "Rifiutato", label: "❌ Rifiutato" },
  ];

  // Carica dati utente dal sessionStorage
  useEffect(() => {
    const storedCompanyName = sessionStorage.getItem("companyName");
    const storedUserName = sessionStorage.getItem("userName");
    if (storedCompanyName) setCompanyName(storedCompanyName);
    if (storedUserName) setUserName(storedUserName);
  }, []);

  // Funzione per ottenere il token di autenticazione
  const getAuthToken = () => {
    return sessionStorage.getItem("token") || "";
  };

  // Carica tutti gli acquisti all'avvio
  useEffect(() => {
    fetchPurchases();
  }, []);

  // Funzione per caricare gli acquisti (FAKE DATA per ora)
  const fetchPurchases = async (filters?: PurchaseSearchRequestDto) => {
    setLoading(true);
    setError(null);

    try {
      // SIMULAZIONE: Per ora usiamo dati fake
      // TODO: Sostituire con chiamata API reale quando il BE sarà pronto

      await new Promise(resolve => setTimeout(resolve, 800)); // Simula latenza

      // Dati fake per demo
      const fakeData: PurchaseDetailDto[] = [
        {
          id: 1,
          purchaseId: "pur-001",
          purchaseCode: "ACQ-2024-00001",
          purchaseType: "Apparato",
          deviceCondition: "Usato",
          brand: "Apple",
          model: "iPhone 14 Pro",
          serialNumber: "ABC123456789",
          imei: "123456789012345",
          supplierId: "sup-001",
          supplierName: "Mario Rossi",
          companyId: "comp-001",
          companyName: "MediaLab",
          multitenantId: "tenant-001",
          purchasePrice: 650.00,
          shippingCost: 0,
          otherCosts: 0,
          vatRate: 22.0,
          totalAmount: 793.00,
          paymentType: "Bonifico",
          paymentStatus: "Da Pagare",
          paidAmount: 0,
          remainingAmount: 793.00,
          purchaseStatus: "Ricevuto",
          purchaseStatusCode: "RECEIVED",
          ddtNumber: "DDT-001",
          ddtDate: "2024-12-01",
          buyerName: "Marco Bianchi",
          notes: "iPhone in ottime condizioni",
          qualityCheckStatus: "Da Verificare",
          hasSupplierWarranty: false,
          purchaseDate: "2024-12-01T10:30:00",
          createdAt: "2024-12-01T10:30:00",
        },
        {
          id: 2,
          purchaseId: "pur-002",
          purchaseCode: "ACQ-2024-00002",
          purchaseType: "Apparato",
          deviceCondition: "Usato",
          brand: "Samsung",
          model: "Galaxy S23",
          serialNumber: "DEF987654321",
          imei: "987654321098765",
          supplierId: "sup-002",
          supplierName: "Luigi Verdi",
          companyId: "comp-001",
          companyName: "MediaLab",
          multitenantId: "tenant-001",
          purchasePrice: 480.00,
          shippingCost: 0,
          otherCosts: 0,
          vatRate: 22.0,
          totalAmount: 585.60,
          paymentType: "Contanti",
          paymentStatus: "Pagato",
          paidAmount: 585.60,
          remainingAmount: 0,
          purchaseStatus: "Approvato",
          purchaseStatusCode: "APPROVED",
          ddtNumber: "DDT-002",
          ddtDate: "2024-12-02",
          buyerName: "Marco Bianchi",
          notes: "Samsung Galaxy in buone condizioni",
          qualityCheckStatus: "Approvato",
          hasSupplierWarranty: false,
          purchaseDate: "2024-12-02T14:15:00",
          createdAt: "2024-12-02T14:15:00",
        },
        {
          id: 3,
          purchaseId: "pur-003",
          purchaseCode: "ACQ-2024-00003",
          purchaseType: "Apparato",
          deviceCondition: "Rigenerato",
          brand: "Apple",
          model: "iPhone 13",
          serialNumber: "GHI456789123",
          imei: "456789123456789",
          supplierId: "sup-003",
          supplierName: "Anna Neri",
          companyId: "comp-001",
          companyName: "MediaLab",
          multitenantId: "tenant-001",
          purchasePrice: 520.00,
          shippingCost: 0,
          otherCosts: 0,
          vatRate: 22.0,
          totalAmount: 634.40,
          paymentType: "Bonifico",
          paymentStatus: "Parziale",
          paidAmount: 300.00,
          remainingAmount: 334.40,
          purchaseStatus: "Bozza",
          purchaseStatusCode: "DRAFT",
          ddtNumber: "DDT-003",
          ddtDate: "2024-12-03",
          buyerName: "Marco Bianchi",
          notes: "iPhone rigenerato con batteria nuova",
          qualityCheckStatus: "In Verifica",
          hasSupplierWarranty: true,
          supplierWarrantyMonths: 6,
          purchaseDate: "2024-12-03T09:00:00",
          createdAt: "2024-12-03T09:00:00",
        },
      ];

      setPurchases(fakeData);
      setFilteredPurchases(fakeData);
      calculateStats(fakeData);

      /*
      // CODICE REALE (da attivare quando il BE sarà pronto):
      const token = getAuthToken();
      const url = filters
        ? `${API_URL}/api/Purchase/search`
        : `${API_URL}/api/Purchase`;

      const options: RequestInit = {
        method: filters ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (filters) {
        options.body = JSON.stringify(filters);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data: PurchaseDetailDto[] = await response.json();
      setPurchases(data);
      setFilteredPurchases(data);
      calculateStats(data);
      */
    } catch (err) {
      console.error("Errore nel caricamento degli acquisti:", err);
      setError("Errore nel caricamento degli acquisti");
      setPurchases([]);
      setFilteredPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcola le statistiche
  const calculateStats = (purchasesData: PurchaseDetailDto[]) => {
    const totalCost = purchasesData.reduce(
      (sum, purchase) => sum + purchase.totalAmount,
      0
    );
    const avgPurchaseValue =
      purchasesData.length > 0 ? totalCost / purchasesData.length : 0;
    const pendingPayments = purchasesData.reduce(
      (sum, purchase) => sum + purchase.remainingAmount,
      0
    );
    const completedPurchases = purchasesData.filter(
      (p) => p.purchaseStatusCode === "APPROVED"
    ).length;

    const purchasesByStatus: { [key: string]: number } = {};
    const purchasesByCondition: { [key: string]: number } = {};
    const purchasesByPaymentStatus: { [key: string]: number } = {};

    purchasesData.forEach((purchase) => {
      // Conta per stato
      if (purchase.purchaseStatusCode) {
        purchasesByStatus[purchase.purchaseStatusCode] =
          (purchasesByStatus[purchase.purchaseStatusCode] || 0) + 1;
      }

      // Conta per condizione
      if (purchase.deviceCondition) {
        purchasesByCondition[purchase.deviceCondition] =
          (purchasesByCondition[purchase.deviceCondition] || 0) + 1;
      }

      // Conta per stato pagamento
      if (purchase.paymentStatus) {
        purchasesByPaymentStatus[purchase.paymentStatus] =
          (purchasesByPaymentStatus[purchase.paymentStatus] || 0) + 1;
      }
    });

    setStats({
      totalPurchases: purchasesData.length,
      totalCost,
      avgPurchaseValue,
      pendingPayments,
      completedPurchases,
      purchasesByStatus,
      purchasesByCondition,
      purchasesByPaymentStatus,
    });
  };

  // Gestione ricerca avanzata
  const handleAdvancedSearch = () => {
    const filters: PurchaseSearchRequestDto = {
      searchQuery: searchQuery || undefined,
      ...searchFilters,
    };

    // Rimuovi campi vuoti
    Object.keys(filters).forEach((key) => {
      if (
        filters[key as keyof PurchaseSearchRequestDto] === "" ||
        filters[key as keyof PurchaseSearchRequestDto] === undefined
      ) {
        delete filters[key as keyof PurchaseSearchRequestDto];
      }
    });

    fetchPurchases(filters);
  };

  // Gestione reset filtri
  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchFilters({});
    fetchPurchases();
  };

  // Formattazione valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  // Formattazione data
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formattazione data e ora
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Ottieni label stato acquisto
  const getPurchaseStatusLabel = (code?: string) => {
    const status = PURCHASE_STATUSES.find((s) => s.value === code);
    return status ? status.label : code || "-";
  };

  // Ottieni label stato pagamento
  const getPaymentStatusLabel = (status?: string) => {
    const paymentStatus = PAYMENT_STATUSES.find((s) => s.value === status);
    return paymentStatus ? paymentStatus.label : status || "-";
  };

  // Calcola percentuale per grafico
  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  // Funzione per caricare i dettagli completi di un acquisto includendo il fornitore
  const loadPurchaseWithSupplier = async (purchase: PurchaseDetailDto) => {
    setLoadingDetails(true);
    setSupplierDetails(null);
    try {
      // TODO: Implementare caricamento dati fornitore quando il BE sarà pronto
      /*
      if (purchase.supplierId) {
        const token = getAuthToken();
        const supplierResponse = await fetch(
          `${API_URL}/api/customer/${purchase.supplierId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (supplierResponse.ok) {
          const supplier = await supplierResponse.json();
          setSupplierDetails(supplier);
        }
      }
      */
      setSelectedPurchase(purchase);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Errore nel caricamento dei dettagli:", error);
      setSelectedPurchase(purchase);
      setShowDetailModal(true);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar
        menuState={menuState}
        setMenuState={setMenuState}
        activeMenu="acquisti"
      />
      <div className={styles.contentArea}>
        <Topbar companyName={companyName} userName={userName} />

        <div className={styles.pageBody}>
          {/* Header della pagina */}
          <div className={styles.schedaHeader}>
            <div className={styles.leftBlock}>
              <button
                className={styles.backBtn}
                onClick={() => navigate("/dashboard")}
                aria-label="Torna indietro"
              >
                <ArrowLeft className={styles.backIcon} />
              </button>
              <div className={styles.repairInfo}>
                <div className={styles.repairCode}>🛒 Acquisti Usato</div>
                <div className={styles.repairStatus}>
                  Gestione e ricerca acquisti apparati usati
                </div>
              </div>
            </div>

            <div className={styles.breadcrumb}>
              <span
                className={styles.breadcrumbItem}
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </span>
              <span className={styles.breadcrumbSeparator}>›</span>
              <span>Gestione Acquisti Usato</span>
            </div>
          </div>

          <div className={styles.repairFormContainer}>
            {/* Titolo della pagina */}
            <div className={styles.pageTitle}>
              <div>
                <h1>
                  <ShoppingBag size={28} />
                  Gestione Acquisti Usato
                </h1>
                <p>
                  Cerca e filtra gli acquisti per codice, fornitore, dispositivo o
                  stato
                </p>
              </div>

              {/* Pulsante Nuovo Acquisto */}
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnNewSale}`}
                onClick={() => navigate("/acquisti/acquisto-usato")}
                title="Inserisci nuovo acquisto"
              >
                <Plus className={styles.btnIcon} />
                Nuovo Acquisto
              </button>
            </div>
            <p
              style={{
                marginTop: "-16px",
                marginBottom: "24px",
                color: "#666",
                fontSize: "0.9rem",
              }}
            >
              Cerca e gestisci gli acquisti di apparati usati
            </p>

            {/* Layout principale */}
            <div className={styles.pageContainer}>
              {/* Colonna sinistra - Ricerca e Risultati */}
              <div className={styles.leftColumn}>
                {/* Barra di ricerca */}
                <div className={styles.formSection}>
                  <h3>🔍 Ricerca</h3>
                  <div className={styles.searchBar}>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="Cerca per codice, fornitore, marca, modello, IMEI..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAdvancedSearch();
                        }
                      }}
                    />
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={handleAdvancedSearch}
                      disabled={loading}
                    >
                      <Search size={18} />
                      {loading ? "Ricerca..." : "Cerca"}
                    </button>
                  </div>

                  {/* Toggle filtri avanzati */}
                  <button
                    className={styles.btnLink}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    {showAdvancedFilters ? "▼" : "▶"} Filtri Avanzati
                  </button>

                  {/* Filtri avanzati */}
                  {showAdvancedFilters && (
                    <div className={styles.advancedFilters}>
                      <div className={styles.formRowEdit}>
                        <div className={styles.formCol3}>
                          <label>Codice Acquisto</label>
                          <input
                            type="text"
                            className={styles.formControl}
                            placeholder="ACQ-2024-00001"
                            value={searchFilters.purchaseCode || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                purchaseCode: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={styles.formCol3}>
                          <label>Tipo Acquisto</label>
                          <select
                            className={styles.formControl}
                            value={searchFilters.purchaseType || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                purchaseType: e.target.value,
                              })
                            }
                          >
                            {PURCHASE_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formCol3}>
                          <label>Condizione</label>
                          <select
                            className={styles.formControl}
                            value={searchFilters.deviceCondition || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                deviceCondition: e.target.value,
                              })
                            }
                          >
                            {DEVICE_CONDITIONS.map((condition) => (
                              <option key={condition.value} value={condition.value}>
                                {condition.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formCol3}>
                          <label>Stato Acquisto</label>
                          <select
                            className={styles.formControl}
                            value={searchFilters.purchaseStatusCode || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                purchaseStatusCode: e.target.value,
                              })
                            }
                          >
                            {PURCHASE_STATUSES.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.formRowEdit}>
                        <div className={styles.formCol3}>
                          <label>Stato Pagamento</label>
                          <select
                            className={styles.formControl}
                            value={searchFilters.paymentStatus || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                paymentStatus: e.target.value,
                              })
                            }
                          >
                            {PAYMENT_STATUSES.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formCol3}>
                          <label>Controllo Qualità</label>
                          <select
                            className={styles.formControl}
                            value={searchFilters.qualityCheckStatus || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                qualityCheckStatus: e.target.value,
                              })
                            }
                          >
                            {QUALITY_CHECK_STATUSES.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formCol3}>
                          <label>Marca</label>
                          <input
                            type="text"
                            className={styles.formControl}
                            placeholder="Apple, Samsung..."
                            value={searchFilters.brand || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                brand: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={styles.formCol3}>
                          <label>Modello</label>
                          <input
                            type="text"
                            className={styles.formControl}
                            placeholder="iPhone 14 Pro..."
                            value={searchFilters.model || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                model: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className={styles.formRowEdit}>
                        <div className={styles.formCol3}>
                          <label>Numero Seriale</label>
                          <input
                            type="text"
                            className={styles.formControl}
                            placeholder="SN123456..."
                            value={searchFilters.serialNumber || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                serialNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={styles.formCol3}>
                          <label>IMEI</label>
                          <input
                            type="text"
                            className={styles.formControl}
                            placeholder="123456789012345"
                            value={searchFilters.imei || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                imei: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={styles.formCol3}>
                          <label>Data Da</label>
                          <input
                            type="date"
                            className={styles.formControl}
                            value={searchFilters.fromDate || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                fromDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={styles.formCol3}>
                          <label>Data A</label>
                          <input
                            type="date"
                            className={styles.formControl}
                            value={searchFilters.toDate || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                toDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className={styles.formRowEdit}>
                        <div className={styles.formCol3}>
                          <label>Importo Min (€)</label>
                          <input
                            type="number"
                            className={styles.formControl}
                            placeholder="0.00"
                            step="0.01"
                            value={searchFilters.minAmount || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                minAmount:
                                  parseFloat(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                        <div className={styles.formCol3}>
                          <label>Importo Max (€)</label>
                          <input
                            type="number"
                            className={styles.formControl}
                            placeholder="0.00"
                            step="0.01"
                            value={searchFilters.maxAmount || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                maxAmount:
                                  parseFloat(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className={styles.formActions}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary}`}
                          onClick={handleResetFilters}
                          disabled={loading}
                        >
                          🔄 Reset Filtri
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          onClick={handleAdvancedSearch}
                          disabled={loading}
                        >
                          <Search size={18} />
                          Applica Filtri
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Risultati */}
                <div className={styles.formSection}>
                  <h3>📋 Risultati ({filteredPurchases.length})</h3>

                  {loading && (
                    <div className={styles.loadingMessage}>
                      ⏳ Caricamento acquisti in corso...
                    </div>
                  )}

                  {error && (
                    <div className={styles.errorMessage}>❌ {error}</div>
                  )}

                  {!loading && !error && filteredPurchases.length === 0 && (
                    <div className={styles.noResults}>
                      🔍 Nessun acquisto trovato con i criteri di ricerca
                      selezionati
                    </div>
                  )}

                  {!loading && !error && filteredPurchases.length > 0 && (
                    <div className={styles.salesTableWrapper}>
                      <table className={styles.salesTable}>
                        <thead>
                          <tr>
                            <th>Codice</th>
                            <th>Data</th>
                            <th>Fornitore</th>
                            <th>Prodotto</th>
                            <th>Condizione</th>
                            <th>Importo</th>
                            <th>Stato</th>
                            <th>Pagamento</th>
                            <th>Qualità</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPurchases.map((purchase) => (
                            <tr key={purchase.id}>
                              <td>
                                <strong>{purchase.purchaseCode}</strong>
                              </td>
                              <td>{formatDate(purchase.purchaseDate)}</td>
                              <td>
                                {purchase.supplierName || (
                                  <span style={{ color: "#999" }}>
                                    Fornitore non specificato
                                  </span>
                                )}
                              </td>
                              <td>
                                {purchase.brand && purchase.model ? (
                                  <>
                                    <strong>{purchase.brand}</strong> {purchase.model}
                                  </>
                                ) : (
                                  <span style={{ color: "#999" }}>
                                    Prodotto non specificato
                                  </span>
                                )}
                              </td>
                              <td>
                                {purchase.deviceCondition === "Nuovo" ? "🆕" :
                                 purchase.deviceCondition === "Usato" ? "♻️" : "🔧"}{" "}
                                {purchase.deviceCondition}
                              </td>
                              <td>
                                <strong>
                                  {formatCurrency(purchase.totalAmount)}
                                </strong>
                              </td>
                              <td>
                                <span
                                  className={`${styles.saleStatusBadge} ${
                                    purchase.purchaseStatusCode === "DRAFT"
                                      ? styles.pending
                                      : purchase.purchaseStatusCode === "ORDERED"
                                      ? styles.confirmed
                                      : purchase.purchaseStatusCode === "RECEIVED"
                                      ? styles.delivered
                                      : purchase.purchaseStatusCode === "APPROVED"
                                      ? styles.delivered
                                      : styles.cancelled
                                  }`}
                                >
                                  {getPurchaseStatusLabel(purchase.purchaseStatusCode)}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`${styles.paymentStatusBadge} ${
                                    purchase.paymentStatus === "Da Pagare"
                                      ? styles.pending
                                      : purchase.paymentStatus === "Parziale"
                                      ? styles.partial
                                      : purchase.paymentStatus === "Pagato"
                                      ? styles.paid
                                      : styles.refunded
                                  }`}
                                >
                                  {getPaymentStatusLabel(purchase.paymentStatus)}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: "0.85rem" }}>
                                  {purchase.qualityCheckStatus || "-"}
                                </span>
                              </td>
                              <td>
                                <div className={styles.actionButtons}>
                                  <button
                                    className={styles.actionBtn}
                                    onClick={() => loadPurchaseWithSupplier(purchase)}
                                    title="Visualizza dettagli"
                                  >
                                    <Eye className={styles.actionIcon} />
                                  </button>
                                  <button
                                    className={styles.actionBtn}
                                    onClick={() =>
                                      navigate("/acquisti/acquisto-usato", {
                                        state: {
                                          purchaseId: purchase.purchaseId,
                                          id: purchase.id,
                                        },
                                      })
                                    }
                                    title="Modifica acquisto"
                                  >
                                    <Edit className={styles.actionIcon} />
                                  </button>
                                  <button
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Sei sicuro di voler eliminare questo acquisto?"
                                        )
                                      ) {
                                        console.log(
                                          "Elimina acquisto:",
                                          purchase.purchaseId
                                        );
                                      }
                                    }}
                                    title="Elimina acquisto"
                                  >
                                    <Trash2 className={styles.actionIcon} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonna destra - Statistiche e Grafici */}
              <div className={styles.rightColumn}>
                {/* Riepilogo statistiche */}
                <div className={`${styles.formSection} ${styles.statsSection}`}>
                  <h3>📊 Riepilogo</h3>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>
                          {stats.totalPurchases}
                        </div>
                        <div className={styles.statLabel}>Acquisti Totali</div>
                      </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.orange}`}>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>
                          {formatCurrency(stats.totalCost)}
                        </div>
                        <div className={styles.statLabel}>Costo Totale</div>
                      </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.teal}`}>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>
                          {formatCurrency(stats.avgPurchaseValue)}
                        </div>
                        <div className={styles.statLabel}>Valore Medio</div>
                      </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.red}`}>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>
                          {formatCurrency(stats.pendingPayments)}
                        </div>
                        <div className={styles.statLabel}>
                          Pagamenti in Sospeso
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grafico stato acquisti */}
                <div className={styles.formSection}>
                  <h3>📈 Acquisti per Stato</h3>
                  <div className={styles.chartContainer}>
                    {Object.keys(stats.purchasesByStatus).length > 0 ? (
                      Object.entries(stats.purchasesByStatus).map(
                        ([status, count]) => {
                          const percentage = calculatePercentage(
                            count,
                            stats.totalPurchases
                          );
                          return (
                            <div
                              key={status}
                              className={styles.chartBarWrapper}
                            >
                              <div className={styles.chartLabel}>
                                <span>{getPurchaseStatusLabel(status)}</span>
                                <span className={styles.chartValue}>
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className={styles.chartBarBg}>
                                <div
                                  className={styles.chartBar}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className={styles.noData}>
                        Nessun dato disponibile
                      </div>
                    )}
                  </div>
                </div>

                {/* Grafico stato pagamenti */}
                <div className={styles.formSection}>
                  <h3>💳 Pagamenti per Stato</h3>
                  <div className={styles.chartContainer}>
                    {Object.keys(stats.purchasesByPaymentStatus).length > 0 ? (
                      Object.entries(stats.purchasesByPaymentStatus).map(
                        ([status, count]) => {
                          const percentage = calculatePercentage(
                            count,
                            stats.totalPurchases
                          );
                          return (
                            <div
                              key={status}
                              className={styles.chartBarWrapper}
                            >
                              <div className={styles.chartLabel}>
                                <span>{getPaymentStatusLabel(status)}</span>
                                <span className={styles.chartValue}>
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className={styles.chartBarBg}>
                                <div
                                  className={`${styles.chartBar} ${styles.chartBarPayment}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className={styles.noData}>
                        Nessun dato disponibile
                      </div>
                    )}
                  </div>
                </div>

                {/* Grafico condizione dispositivi */}
                <div className={styles.formSection}>
                  <h3>🏷️ Acquisti per Condizione</h3>
                  <div className={styles.chartContainer}>
                    {Object.keys(stats.purchasesByCondition).length > 0 ? (
                      Object.entries(stats.purchasesByCondition).map(([condition, count]) => {
                        const percentage = calculatePercentage(
                          count,
                          stats.totalPurchases
                        );
                        return (
                          <div key={condition} className={styles.chartBarWrapper}>
                            <div className={styles.chartLabel}>
                              <span>
                                {condition === "Nuovo"
                                  ? "🆕 Nuovo"
                                  : condition === "Usato"
                                  ? "♻️ Usato"
                                  : "🔧 Rigenerato"}
                              </span>
                              <span className={styles.chartValue}>
                                {count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className={styles.chartBarBg}>
                              <div
                                className={`${styles.chartBar} ${styles.chartBarType}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.noData}>
                        Nessun dato disponibile
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Dettagli Acquisto */}
        {showDetailModal && selectedPurchase && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>
                  <ShoppingBag className={styles.modalTitleIcon} />
                  <div>
                    <h2>Dettagli Acquisto</h2>
                    <p className={styles.modalSubtitle}>
                      Codice: {selectedPurchase.purchaseCode}
                    </p>
                  </div>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setShowDetailModal(false)}
                  title="Chiudi"
                >
                  ✕
                </button>
              </div>

              {/* Body del Modal */}
              <div className={styles.modalBody}>
                {/* Sezione Informazioni Generali */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>
                    📋 Informazioni Generali
                  </h3>
                  <div className={styles.modalGrid}>
                    <div className={styles.modalField}>
                      <label>Tipo Acquisto</label>
                      <span className={styles.modalValue}>
                        {selectedPurchase.purchaseType}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Condizione</label>
                      <span className={styles.modalValue}>
                        {selectedPurchase.deviceCondition}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Stato Acquisto</label>
                      <span className={styles.modalValue}>
                        {getPurchaseStatusLabel(selectedPurchase.purchaseStatusCode)}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Data Acquisto</label>
                      <span className={styles.modalValue}>
                        {formatDate(selectedPurchase.purchaseDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sezione Fornitore */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>👤 Fornitore</h3>
                  <div className={styles.modalGrid}>
                    <div className={styles.modalField}>
                      <label>Nome Fornitore</label>
                      <span className={styles.modalValue}>
                        {selectedPurchase.supplierName || "Non disponibile"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sezione Prodotto */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>📱 Dispositivo</h3>
                  <div className={styles.modalGrid}>
                    <div className={styles.modalField}>
                      <label>Marca</label>
                      <span className={styles.modalValue}>
                        {selectedPurchase.brand || "-"}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Modello</label>
                      <span className={styles.modalValue}>
                        {selectedPurchase.model || "-"}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>IMEI</label>
                      <span className={styles.modalValue}>
                        {selectedPurchase.imei || "-"}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Serial Number</label>
                      <span className={styles.modalValue}>
                        {selectedPurchase.serialNumber || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sezione Prezzi */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>
                    💰 Dettagli Finanziari
                  </h3>
                  <div className={styles.modalGrid}>
                    <div className={styles.modalField}>
                      <label>Prezzo di Acquisto</label>
                      <span className={styles.modalValue}>
                        {formatCurrency(selectedPurchase.purchasePrice)}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>IVA</label>
                      <span className={styles.modalValue}>
                        {selectedPurchase.vatRate}%
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Totale</label>
                      <span
                        className={`${styles.modalValue} ${styles.modalValueHighlight}`}
                      >
                        {formatCurrency(selectedPurchase.totalAmount)}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Importo Pagato</label>
                      <span className={styles.modalValue}>
                        {formatCurrency(selectedPurchase.paidAmount)}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Importo Residuo</label>
                      <span
                        className={`${styles.modalValue} ${
                          selectedPurchase.remainingAmount > 0
                            ? styles.modalValueDanger
                            : ""
                        }`}
                      >
                        {formatCurrency(selectedPurchase.remainingAmount)}
                      </span>
                    </div>
                    {selectedPurchase.paymentType && (
                      <div className={styles.modalField}>
                        <label>Metodo Pagamento</label>
                        <span className={styles.modalValue}>
                          {selectedPurchase.paymentType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sezione Controllo Qualità */}
                {selectedPurchase.qualityCheckStatus && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>🔍 Controllo Qualità</h3>
                    <div className={styles.modalGrid}>
                      <div className={styles.modalField}>
                        <label>Stato Verifica</label>
                        <span className={styles.modalValue}>
                          {selectedPurchase.qualityCheckStatus}
                        </span>
                      </div>
                      {selectedPurchase.qualityCheckDate && (
                        <div className={styles.modalField}>
                          <label>Data Verifica</label>
                          <span className={styles.modalValue}>
                            {formatDate(selectedPurchase.qualityCheckDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sezione Note */}
                {selectedPurchase.notes && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>📝 Note</h3>
                    <div className={styles.modalNotes}>
                      {selectedPurchase.notes}
                    </div>
                  </div>
                )}

                {/* Sezione Date Sistema */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>
                    🕒 Informazioni Sistema
                  </h3>
                  <div className={styles.modalGrid}>
                    <div className={styles.modalField}>
                      <label>Creato il</label>
                      <span className={styles.modalValue}>
                        {formatDate(selectedPurchase.createdAt)}
                      </span>
                    </div>
                    {selectedPurchase.updatedAt && (
                      <div className={styles.modalField}>
                        <label>Ultimo Aggiornamento</label>
                        <span className={styles.modalValue}>
                          {formatDate(selectedPurchase.updatedAt)}
                        </span>
                      </div>
                    )}
                    {selectedPurchase.receivedDate && (
                      <div className={styles.modalField}>
                        <label>Data Ricezione</label>
                        <span className={styles.modalValue}>
                          {formatDate(selectedPurchase.receivedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer del Modal */}
              <div className={styles.modalFooter}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setShowDetailModal(false)}
                >
                  Chiudi
                </button>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => {
                    setShowDetailModal(false);
                    navigate("/acquisti/acquisto-usato", {
                      state: {
                        purchaseId: selectedPurchase.purchaseId,
                        id: selectedPurchase.id,
                      },
                    });
                  }}
                >
                  <Edit className={styles.btnIcon} />
                  Modifica Acquisto
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

export default RicercaAcquistiUsato;
