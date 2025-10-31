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
                                    onClick={() =>
                                      navigate("/dettaglio-vendita", {
                                        state: {
                                          saleId: sale.saleId,
                                          id: sale.id,
                                        },
                                      })
                                    }
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

        <BottomBar />
      </div>
    </div>
  );
};

export default RicercaVendite;
