import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

import styles from "./ricerca-vendite.styles.module.css";

// Interfacce TypeScript per i dati delle vendite
interface SaleDetailDto {
  id: number;
  saleId: string;
  saleCode: string;
  saleType: string;
  deviceId?: string;
  deviceRegistryId?: number;
  accessoryId?: number;
  brand?: string;
  model?: string;
  serialNumber?: string;
  imei?: string;
  customerId: string;
  customerName?: string;
  companyId: string;
  companyName?: string;
  multitenantId: string;
  salePrice: number;
  originalPrice?: number;
  discount?: number;
  vatRate: number;
  totalAmount: number;
  paymentType?: string;
  paymentStatus?: string;
  paidAmount: number;
  remainingAmount: number;
  installmentsCount?: number;
  installmentAmount?: number;
  saleStatus?: string;
  saleStatusCode?: string;
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  receiptId?: number;
  receiptNumber?: string;
  receiptDate?: string;
  sellerCode?: string;
  sellerName?: string;
  notes?: string;
  includedAccessories?: string;
  hasWarranty: boolean;
  warrantyMonths?: number;
  warrantyExpiryDate?: string;
  createdAt: string;
  saleDate?: string;
  deliveryDate?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  payments?: SalePaymentDetailDto[];
}

interface SalePaymentDetailDto {
  id: number;
  paymentId: string;
  saleId: string;
  amount: number;
  paymentMethod?: string;
  transactionReference?: string;
  paymentDate: string;
  notes?: string;
}

interface SaleSearchRequestDto {
  searchQuery?: string;
  saleCode?: string;
  saleGuid?: string;
  saleType?: string;
  customerId?: string;
  deviceId?: string;
  saleStatus?: string;
  saleStatusCode?: string;
  paymentStatus?: string;
  paymentType?: string;
  sellerCode?: string;
  fromDate?: string;
  toDate?: string;
  createdFrom?: string;
  createdTo?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  imei?: string;
  minPrice?: number;
  maxPrice?: number;
  minAmount?: number;
  maxAmount?: number;
  hasInvoice?: boolean;
  hasReceipt?: boolean;
  invoiceNumber?: string;
  hasWarranty?: boolean;
  multitenantId?: string;
  companyId?: string;
  page?: number;
  pageSize?: number;
}

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  avgSaleValue: number;
  pendingPayments: number;
  completedSales: number;
  salesByStatus: { [key: string]: number };
  salesByType: { [key: string]: number };
  salesByPaymentStatus: { [key: string]: number };
}

const RicercaVendite: React.FC = () => {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [companyName, setCompanyName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const API_URL = import.meta.env.VITE_API_URL;

  // Stati per la ricerca
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<SaleSearchRequestDto>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Stati per i risultati
  const [sales, setSales] = useState<SaleDetailDto[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleDetailDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stati per le statistiche
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    avgSaleValue: 0,
    pendingPayments: 0,
    completedSales: 0,
    salesByStatus: {},
    salesByType: {},
    salesByPaymentStatus: {},
  });

  // Stati per il modal dettagli vendita
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleDetailDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<any>(null);

  // Filtri disponibili
  const SALE_TYPES = [
    { value: "", label: "Tutti i tipi" },
    { value: "Device", label: "Dispositivo" },
    { value: "Accessory", label: "Accessorio" },
  ];

  const SALE_STATUSES = [
    { value: "", label: "Tutti gli stati" },
    { value: "PENDING", label: "⏳ In Attesa" },
    { value: "CONFIRMED", label: "✅ Confermata" },
    { value: "DELIVERED", label: "📦 Consegnata" },
    { value: "CANCELLED", label: "❌ Annullata" },
    { value: "RETURNED", label: "🔄 Reso" },
  ];

  const PAYMENT_STATUSES = [
    { value: "", label: "Tutti i pagamenti" },
    { value: "PENDING", label: "⏳ In Attesa" },
    { value: "PARTIAL", label: "📊 Parziale" },
    { value: "PAID", label: "✅ Pagato" },
    { value: "REFUNDED", label: "💰 Rimborsato" },
  ];

  const PAYMENT_TYPES = [
    { value: "", label: "Tutti i metodi" },
    { value: "Cash", label: "💵 Contanti" },
    { value: "Card", label: "💳 Carta" },
    { value: "BankTransfer", label: "🏦 Bonifico" },
    { value: "Installments", label: "📅 Rate" },
    { value: "Mixed", label: "🔀 Misto" },
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

  // Carica tutte le vendite all'avvio
  useEffect(() => {
    fetchSales();
  }, []);

  // Funzione per caricare le vendite
  const fetchSales = async (filters?: SaleSearchRequestDto) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const url = filters
        ? `${API_URL}/api/Sale/search`
        : `${API_URL}/api/Sale`;

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

      const data: SaleDetailDto[] = await response.json();
      setSales(data);
      setFilteredSales(data);
      calculateStats(data);
    } catch (err) {
      console.error("Errore nel caricamento delle vendite:", err);
      setError("Errore nel caricamento delle vendite");
      setSales([]);
      setFilteredSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcola le statistiche
  const calculateStats = (salesData: SaleDetailDto[]) => {
    const totalRevenue = salesData.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const avgSaleValue =
      salesData.length > 0 ? totalRevenue / salesData.length : 0;
    const pendingPayments = salesData.reduce(
      (sum, sale) => sum + sale.remainingAmount,
      0
    );
    const completedSales = salesData.filter(
      (s) => s.saleStatusCode === "DELIVERED"
    ).length;

    const salesByStatus: { [key: string]: number } = {};
    const salesByType: { [key: string]: number } = {};
    const salesByPaymentStatus: { [key: string]: number } = {};

    salesData.forEach((sale) => {
      // Conta per stato
      if (sale.saleStatusCode) {
        salesByStatus[sale.saleStatusCode] =
          (salesByStatus[sale.saleStatusCode] || 0) + 1;
      }

      // Conta per tipo
      if (sale.saleType) {
        salesByType[sale.saleType] = (salesByType[sale.saleType] || 0) + 1;
      }

      // Conta per stato pagamento
      if (sale.paymentStatus) {
        salesByPaymentStatus[sale.paymentStatus] =
          (salesByPaymentStatus[sale.paymentStatus] || 0) + 1;
      }
    });

    setStats({
      totalSales: salesData.length,
      totalRevenue,
      avgSaleValue,
      pendingPayments,
      completedSales,
      salesByStatus,
      salesByType,
      salesByPaymentStatus,
    });
  };

  // Gestione ricerca avanzata
  const handleAdvancedSearch = () => {
    const filters: SaleSearchRequestDto = {
      searchQuery: searchQuery || undefined,
      ...searchFilters,
    };

    // Rimuovi campi vuoti
    Object.keys(filters).forEach((key) => {
      if (
        filters[key as keyof SaleSearchRequestDto] === "" ||
        filters[key as keyof SaleSearchRequestDto] === undefined
      ) {
        delete filters[key as keyof SaleSearchRequestDto];
      }
    });

    fetchSales(filters);
  };

  // Gestione reset filtri
  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchFilters({});
    fetchSales();
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

  // Ottieni label stato vendita
  const getSaleStatusLabel = (code?: string) => {
    const status = SALE_STATUSES.find((s) => s.value === code);
    return status ? status.label : code || "-";
  };

  // Ottieni label stato pagamento
  const getPaymentStatusLabel = (code?: string) => {
    const status = PAYMENT_STATUSES.find((s) => s.value === code);
    return status ? status.label : code || "-";
  };

  // Calcola percentuale per grafico
  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  // Funzione per caricare i dettagli completi di una vendita includendo il cliente
  const loadSaleWithCustomer = async (sale: SaleDetailDto) => {
    setLoadingDetails(true);
    setCustomerDetails(null); // Reset dei dati cliente precedenti
    try {
      // Se c'è un customerId, carica i dettagli del cliente
      if (sale.customerId) {
        const token = getAuthToken();
        const customerResponse = await fetch(
          `${API_URL}/api/customer/${sale.customerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          // Salva i dati completi del cliente
          setCustomerDetails(customer);
          // Aggiorna la vendita con il nome completo del cliente
          const updatedSale = {
            ...sale,
            customerName:
              customer.tipologia === "Azienda"
                ? customer.ragioneSociale
                : `${customer.nome} ${customer.cognome}`,
          };
          setSelectedSale(updatedSale);
        } else {
          // Se non riesce a caricare il cliente, usa comunque la vendita
          setSelectedSale(sale);
        }
      } else {
        setSelectedSale(sale);
      }
      setShowDetailModal(true);
    } catch (error) {
      console.error("Errore nel caricamento dei dettagli:", error);
      // In caso di errore, mostra comunque il modal con i dati disponibili
      setSelectedSale(sale);
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
        activeMenu="vendite"
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
                <div className={styles.repairCode}>🔍 Vendite</div>
                <div className={styles.repairStatus}>
                  Gestione e ricerca vendite
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
              <span>Gestione Vendite</span>
            </div>
          </div>

          <div className={styles.repairFormContainer}>
            {/* Titolo della pagina */}
            <div className={styles.pageTitle}>
              <div>
                <h1>
                  <ShoppingCart size={28} />
                  Gestione Vendite
                </h1>
                <p>
                  Cerca e filtra le vendite per codice, cliente, dispositivo o
                  stato
                </p>
              </div>

              {/* Pulsante Nuova Vendita */}
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnNewSale}`}
                onClick={() => navigate("/vendite-apparati")}
                title="Inserisci nuova vendita"
              >
                <Plus className={styles.btnIcon} />
                Nuova Vendita
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
              Cerca e gestisci le vendite del tuo negozio
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
                      placeholder="Cerca per codice, cliente, marca, modello, IMEI..."
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
                          <label>Codice Vendita</label>
                          <input
                            type="text"
                            className={styles.formControl}
                            placeholder="SALE-2024-00001"
                            value={searchFilters.saleCode || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                saleCode: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={styles.formCol3}>
                          <label>Tipo Vendita</label>
                          <select
                            className={styles.formControl}
                            value={searchFilters.saleType || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                saleType: e.target.value,
                              })
                            }
                          >
                            {SALE_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formCol3}>
                          <label>Stato Vendita</label>
                          <select
                            className={styles.formControl}
                            value={searchFilters.saleStatusCode || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                saleStatusCode: e.target.value,
                              })
                            }
                          >
                            {SALE_STATUSES.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
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
                      </div>

                      <div className={styles.formRowEdit}>
                        <div className={styles.formCol3}>
                          <label>Marca</label>
                          <input
                            type="text"
                            className={styles.formControl}
                            placeholder="Samsung, Apple..."
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
                            placeholder="Galaxy S24..."
                            value={searchFilters.model || ""}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                model: e.target.value,
                              })
                            }
                          />
                        </div>
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
                      </div>

                      <div className={styles.formRowEdit}>
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
                  <h3>📋 Risultati ({filteredSales.length})</h3>

                  {loading && (
                    <div className={styles.loadingMessage}>
                      ⏳ Caricamento vendite in corso...
                    </div>
                  )}

                  {error && (
                    <div className={styles.errorMessage}>❌ {error}</div>
                  )}

                  {!loading && !error && filteredSales.length === 0 && (
                    <div className={styles.noResults}>
                      🔍 Nessuna vendita trovata con i criteri di ricerca
                      selezionati
                    </div>
                  )}

                  {!loading && !error && filteredSales.length > 0 && (
                    <div className={styles.salesTableWrapper}>
                      <table className={styles.salesTable}>
                        <thead>
                          <tr>
                            <th>Codice</th>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Prodotto</th>
                            <th>Tipo</th>
                            <th>Importo</th>
                            <th>Stato</th>
                            <th>Pagamento</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((sale) => (
                            <tr key={sale.id}>
                              <td>
                                <strong>{sale.saleCode}</strong>
                              </td>
                              <td>{formatDate(sale.saleDate)}</td>
                              <td>
                                {sale.customerName || (
                                  <span style={{ color: "#999" }}>
                                    Cliente non specificato
                                  </span>
                                )}
                              </td>
                              <td>
                                {sale.brand && sale.model ? (
                                  <>
                                    <strong>{sale.brand}</strong> {sale.model}
                                  </>
                                ) : (
                                  <span style={{ color: "#999" }}>
                                    Prodotto non specificato
                                  </span>
                                )}
                              </td>
                              <td>
                                {sale.saleType === "Device" ? "📱" : "🎧"}{" "}
                                {sale.saleType === "Device"
                                  ? "Dispositivo"
                                  : "Accessorio"}
                              </td>
                              <td>
                                <strong>
                                  {formatCurrency(sale.totalAmount)}
                                </strong>
                              </td>
                              <td>
                                <span
                                  className={`${styles.saleStatusBadge} ${
                                    sale.saleStatusCode === "PENDING"
                                      ? styles.pending
                                      : sale.saleStatusCode === "CONFIRMED"
                                      ? styles.confirmed
                                      : sale.saleStatusCode === "DELIVERED"
                                      ? styles.delivered
                                      : sale.saleStatusCode === "CANCELLED"
                                      ? styles.cancelled
                                      : styles.returned
                                  }`}
                                >
                                  {getSaleStatusLabel(sale.saleStatusCode)}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`${styles.paymentStatusBadge} ${
                                    sale.paymentStatus === "PENDING"
                                      ? styles.pending
                                      : sale.paymentStatus === "PARTIAL"
                                      ? styles.partial
                                      : sale.paymentStatus === "PAID"
                                      ? styles.paid
                                      : styles.refunded
                                  }`}
                                >
                                  {getPaymentStatusLabel(sale.paymentStatus)}
                                </span>
                              </td>
                              <td>
                                <div className={styles.actionButtons}>
                                  <button
                                    className={styles.actionBtn}
                                    onClick={() => loadSaleWithCustomer(sale)}
                                    title="Visualizza dettagli"
                                  >
                                    <Eye className={styles.actionIcon} />
                                  </button>
                                  <button
                                    className={styles.actionBtn}
                                    onClick={() =>
                                      navigate("/modifica-vendite", {
                                        state: {
                                          saleId: sale.saleId,
                                          id: sale.id,
                                        },
                                      })
                                    }
                                    title="Modifica vendita"
                                  >
                                    <Edit className={styles.actionIcon} />
                                  </button>
                                  <button
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Sei sicuro di voler eliminare questa vendita?"
                                        )
                                      ) {
                                        console.log(
                                          "Elimina vendita:",
                                          sale.saleId
                                        );
                                      }
                                    }}
                                    title="Elimina vendita"
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
                          {stats.totalSales}
                        </div>
                        <div className={styles.statLabel}>Vendite Totali</div>
                      </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.orange}`}>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>
                          {formatCurrency(stats.totalRevenue)}
                        </div>
                        <div className={styles.statLabel}>Ricavo Totale</div>
                      </div>
                    </div>

                    <div className={`${styles.statCard} ${styles.teal}`}>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>
                          {formatCurrency(stats.avgSaleValue)}
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

                {/* Grafico stato vendite */}
                <div className={styles.formSection}>
                  <h3>📈 Vendite per Stato</h3>
                  <div className={styles.chartContainer}>
                    {Object.keys(stats.salesByStatus).length > 0 ? (
                      Object.entries(stats.salesByStatus).map(
                        ([status, count]) => {
                          const percentage = calculatePercentage(
                            count,
                            stats.totalSales
                          );
                          return (
                            <div
                              key={status}
                              className={styles.chartBarWrapper}
                            >
                              <div className={styles.chartLabel}>
                                <span>{getSaleStatusLabel(status)}</span>
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
                    {Object.keys(stats.salesByPaymentStatus).length > 0 ? (
                      Object.entries(stats.salesByPaymentStatus).map(
                        ([status, count]) => {
                          const percentage = calculatePercentage(
                            count,
                            stats.totalSales
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

                {/* Grafico tipo vendite */}
                <div className={styles.formSection}>
                  <h3>🏷️ Vendite per Tipo</h3>
                  <div className={styles.chartContainer}>
                    {Object.keys(stats.salesByType).length > 0 ? (
                      Object.entries(stats.salesByType).map(([type, count]) => {
                        const percentage = calculatePercentage(
                          count,
                          stats.totalSales
                        );
                        return (
                          <div key={type} className={styles.chartBarWrapper}>
                            <div className={styles.chartLabel}>
                              <span>
                                {type === "Device"
                                  ? "📱 Dispositivo"
                                  : "🎧 Accessorio"}
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

        {/* Modal Dettagli Vendita */}
        {showDetailModal && selectedSale && (
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
                  <ShoppingCart className={styles.modalTitleIcon} />
                  <div>
                    <h2>Dettagli Vendita</h2>
                    <p className={styles.modalSubtitle}>
                      Codice: {selectedSale.saleCode}
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
                      <label>Tipo Vendita</label>
                      <span className={styles.modalValue}>
                        {selectedSale.saleType === "Device"
                          ? "📱 Dispositivo"
                          : "🎧 Accessorio"}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Stato Vendita</label>
                      <span
                        className={`${styles.modalBadge} ${
                          selectedSale.saleStatus === "PENDING"
                            ? styles.badgePending
                            : selectedSale.saleStatus === "CONFIRMED"
                            ? styles.badgeConfirmed
                            : selectedSale.saleStatus === "DELIVERED"
                            ? styles.badgeDelivered
                            : selectedSale.saleStatus === "CANCELLED"
                            ? styles.badgeCancelled
                            : styles.badgeReturned
                        }`}
                      >
                        {getSaleStatusLabel(selectedSale.saleStatus)}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Stato Pagamento</label>
                      <span
                        className={`${styles.modalBadge} ${
                          selectedSale.paymentStatus === "PENDING"
                            ? styles.badgePending
                            : selectedSale.paymentStatus === "PARTIAL"
                            ? styles.badgePartial
                            : selectedSale.paymentStatus === "PAID"
                            ? styles.badgePaid
                            : styles.badgeRefunded
                        }`}
                      >
                        {getPaymentStatusLabel(selectedSale.paymentStatus)}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Data Vendita</label>
                      <span className={styles.modalValue}>
                        {selectedSale.saleDate
                          ? formatDate(selectedSale.saleDate)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sezione Cliente */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>👤 Cliente</h3>
                  {loadingDetails ? (
                    <div className={styles.modalValue}>
                      ⏳ Caricamento dati cliente...
                    </div>
                  ) : (
                    <div className={styles.modalGrid}>
                      <div className={styles.modalField}>
                        <label>Nome Cliente</label>
                        <span className={styles.modalValue}>
                          {selectedSale.customerName || "Non disponibile"}
                        </span>
                      </div>
                      {customerDetails?.email && (
                        <div className={styles.modalField}>
                          <label>📧 Email</label>
                          <span className={styles.modalValue}>
                            {customerDetails.email}
                          </span>
                        </div>
                      )}
                      {customerDetails?.telefono && (
                        <div className={styles.modalField}>
                          <label>📱 Telefono</label>
                          <span className={styles.modalValue}>
                            {customerDetails.telefono}
                          </span>
                        </div>
                      )}
                      {customerDetails?.indirizzo && (
                        <div className={styles.modalField}>
                          <label>📍 Indirizzo</label>
                          <span className={styles.modalValue}>
                            {customerDetails.indirizzo}
                          </span>
                        </div>
                      )}
                      {customerDetails?.citta && (
                        <div className={styles.modalField}>
                          <label>🏙️ Città</label>
                          <span className={styles.modalValue}>
                            {customerDetails.citta}
                            {customerDetails.cap && ` - ${customerDetails.cap}`}
                            {customerDetails.provincia &&
                              ` (${customerDetails.provincia})`}
                          </span>
                        </div>
                      )}
                      {customerDetails?.fiscalCode && (
                        <div className={styles.modalField}>
                          <label>🆔 Codice Fiscale</label>
                          <span className={styles.modalValue}>
                            {customerDetails.fiscalCode}
                          </span>
                        </div>
                      )}
                      {customerDetails?.pIva && (
                        <div className={styles.modalField}>
                          <label>🏢 P.IVA</label>
                          <span className={styles.modalValue}>
                            {customerDetails.pIva}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sezione Prodotto */}
                {selectedSale.saleType === "Device" && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>📱 Dispositivo</h3>
                    <div className={styles.modalGrid}>
                      <div className={styles.modalField}>
                        <label>Marca</label>
                        <span className={styles.modalValue}>
                          {selectedSale.brand || "-"}
                        </span>
                      </div>
                      <div className={styles.modalField}>
                        <label>Modello</label>
                        <span className={styles.modalValue}>
                          {selectedSale.model || "-"}
                        </span>
                      </div>
                      <div className={styles.modalField}>
                        <label>IMEI</label>
                        <span className={styles.modalValue}>
                          {selectedSale.imei || "-"}
                        </span>
                      </div>
                      <div className={styles.modalField}>
                        <label>Serial Number</label>
                        <span className={styles.modalValue}>
                          {selectedSale.serialNumber || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sezione Prezzi */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>
                    💰 Dettagli Finanziari
                  </h3>
                  <div className={styles.modalGrid}>
                    <div className={styles.modalField}>
                      <label>Prezzo di Vendita</label>
                      <span className={styles.modalValue}>
                        {formatCurrency(selectedSale.salePrice)}
                      </span>
                    </div>
                    {selectedSale.originalPrice && (
                      <div className={styles.modalField}>
                        <label>Prezzo Originale</label>
                        <span className={styles.modalValue}>
                          {formatCurrency(selectedSale.originalPrice)}
                        </span>
                      </div>
                    )}
                    {selectedSale.discount && selectedSale.discount > 0 && (
                      <div className={styles.modalField}>
                        <label>Sconto</label>
                        <span className={styles.modalValue}>
                          {formatCurrency(selectedSale.discount)}
                        </span>
                      </div>
                    )}
                    <div className={styles.modalField}>
                      <label>IVA</label>
                      <span className={styles.modalValue}>
                        {selectedSale.vatRate}%
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Totale</label>
                      <span
                        className={`${styles.modalValue} ${styles.modalValueHighlight}`}
                      >
                        {formatCurrency(selectedSale.totalAmount)}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Importo Pagato</label>
                      <span className={styles.modalValue}>
                        {formatCurrency(selectedSale.paidAmount)}
                      </span>
                    </div>
                    <div className={styles.modalField}>
                      <label>Importo Residuo</label>
                      <span
                        className={`${styles.modalValue} ${
                          selectedSale.remainingAmount > 0
                            ? styles.modalValueDanger
                            : ""
                        }`}
                      >
                        {formatCurrency(selectedSale.remainingAmount)}
                      </span>
                    </div>
                    {selectedSale.paymentType && (
                      <div className={styles.modalField}>
                        <label>Metodo Pagamento</label>
                        <span className={styles.modalValue}>
                          {selectedSale.paymentType === "Cash"
                            ? "💵 Contanti"
                            : selectedSale.paymentType === "Card"
                            ? "💳 Carta"
                            : selectedSale.paymentType === "BankTransfer"
                            ? "🏦 Bonifico"
                            : selectedSale.paymentType === "Installments"
                            ? "📅 Rate"
                            : "🔀 Misto"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sezione Rate (se presenti) */}
                {selectedSale.installmentsCount &&
                  selectedSale.installmentsCount > 0 && (
                    <div className={styles.modalSection}>
                      <h3 className={styles.modalSectionTitle}>
                        📅 Piano Rate
                      </h3>
                      <div className={styles.modalGrid}>
                        <div className={styles.modalField}>
                          <label>Numero Rate</label>
                          <span className={styles.modalValue}>
                            {selectedSale.installmentsCount}
                          </span>
                        </div>
                        <div className={styles.modalField}>
                          <label>Importo per Rata</label>
                          <span className={styles.modalValue}>
                            {formatCurrency(
                              selectedSale.installmentAmount || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Sezione Garanzia */}
                {selectedSale.hasWarranty && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>🛡️ Garanzia</h3>
                    <div className={styles.modalGrid}>
                      <div className={styles.modalField}>
                        <label>Durata Garanzia</label>
                        <span className={styles.modalValue}>
                          {selectedSale.warrantyMonths} mesi
                        </span>
                      </div>
                      {selectedSale.warrantyExpiryDate && (
                        <div className={styles.modalField}>
                          <label>Scadenza Garanzia</label>
                          <span className={styles.modalValue}>
                            {formatDate(selectedSale.warrantyExpiryDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sezione Documenti */}
                {(selectedSale.invoiceNumber || selectedSale.receiptNumber) && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>📄 Documenti</h3>
                    <div className={styles.modalGrid}>
                      {selectedSale.invoiceNumber && (
                        <>
                          <div className={styles.modalField}>
                            <label>Numero Fattura</label>
                            <span className={styles.modalValue}>
                              {selectedSale.invoiceNumber}
                            </span>
                          </div>
                          {selectedSale.invoiceDate && (
                            <div className={styles.modalField}>
                              <label>Data Fattura</label>
                              <span className={styles.modalValue}>
                                {formatDate(selectedSale.invoiceDate)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {selectedSale.receiptNumber && (
                        <>
                          <div className={styles.modalField}>
                            <label>Numero Scontrino</label>
                            <span className={styles.modalValue}>
                              {selectedSale.receiptNumber}
                            </span>
                          </div>
                          {selectedSale.receiptDate && (
                            <div className={styles.modalField}>
                              <label>Data Scontrino</label>
                              <span className={styles.modalValue}>
                                {formatDate(selectedSale.receiptDate)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Sezione Venditore */}
                {selectedSale.sellerName && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>👨‍💼 Venditore</h3>
                    <div className={styles.modalGrid}>
                      <div className={styles.modalField}>
                        <label>Nome Venditore</label>
                        <span className={styles.modalValue}>
                          {selectedSale.sellerName}
                        </span>
                      </div>
                      {selectedSale.sellerCode && (
                        <div className={styles.modalField}>
                          <label>Codice Venditore</label>
                          <span className={styles.modalValue}>
                            {selectedSale.sellerCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sezione Pagamenti */}
                {selectedSale.payments && selectedSale.payments.length > 0 && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>
                      💳 Storico Pagamenti
                    </h3>
                    <div className={styles.paymentsTable}>
                      <table>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Importo</th>
                            <th>Metodo</th>
                            <th>Riferimento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{formatDate(payment.paymentDate)}</td>
                              <td className={styles.paymentAmount}>
                                {formatCurrency(payment.amount)}
                              </td>
                              <td>{payment.paymentMethod || "-"}</td>
                              <td>{payment.transactionReference || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sezione Note */}
                {selectedSale.notes && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>📝 Note</h3>
                    <div className={styles.modalNotes}>
                      {selectedSale.notes}
                    </div>
                  </div>
                )}

                {/* Sezione Accessori Inclusi */}
                {selectedSale.includedAccessories && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>
                      🎧 Accessori Inclusi
                    </h3>
                    <div className={styles.modalNotes}>
                      {selectedSale.includedAccessories}
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
                        {formatDate(selectedSale.createdAt)}
                      </span>
                    </div>
                    {selectedSale.updatedAt && (
                      <div className={styles.modalField}>
                        <label>Ultimo Aggiornamento</label>
                        <span className={styles.modalValue}>
                          {formatDate(selectedSale.updatedAt)}
                        </span>
                      </div>
                    )}
                    {selectedSale.deliveryDate && (
                      <div className={styles.modalField}>
                        <label>Data Consegna</label>
                        <span className={styles.modalValue}>
                          {formatDate(selectedSale.deliveryDate)}
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
                    navigate("/modifica-vendite", {
                      state: {
                        saleId: selectedSale.saleId,
                        id: selectedSale.id,
                      },
                    });
                  }}
                >
                  <Edit className={styles.btnIcon} />
                  Modifica Vendita
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

export default RicercaVendite;
