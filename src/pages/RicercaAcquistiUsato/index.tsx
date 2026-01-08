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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import styles from "./ricerca-acquisto-usato.module.css";

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

  console.log ("companyName",companyName);
  console.log ("userName",userName);

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

  console.log("purchases:", purchases);

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

  console.log("loadingDetails:", loadingDetails);
  console.log("supplierDetails:", supplierDetails);

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

  // const PAYMENT_TYPES = [
  //   { value: "", label: "Tutti i metodi" },
  //   { value: "Contanti", label: "💵 Contanti" },
  //   { value: "Carta", label: "💳 Carta" },
  //   { value: "Bonifico", label: "🏦 Bonifico" },
  //   { value: "Assegno", label: "📝 Assegno" },
  // ];

  const QUALITY_CHECK_STATUSES = [
    { value: "", label: "Tutti" },
    { value: "Da Verificare", label: "⏳ Da Verificare" },
    { value: "In Verifica", label: "🔍 In Verifica" },
    { value: "Approvato", label: "✅ Approvato" },
    { value: "Rifiutato", label: "❌ Rifiutato" },
  ];
  const getPurchaseStatusLabel = (code?: string) => {
    const status = PURCHASE_STATUSES.find((s) => s.value === code);
    return status ? status.label : code || "-";
  };

  // Ottieni label stato pagamento
  const getPaymentStatusLabel = (status?: string) => {
    const paymentStatus = PAYMENT_STATUSES.find((s) => s.value === status);
    return paymentStatus ? paymentStatus.label : status || "-";
  };

  // Colori per i grafici donut
  const COLORS = [
    "#ffa726", // Arancione
    "#26a69a", // Teal
    "#42a5f5", // Blu
    "#ef5350", // Rosso
    "#ab47bc", // Viola
    "#8d6e63", // Marrone
    "#78909c", // Grigio
    "#66bb6a", // Verde
  ];

  // Prepara i dati per il grafico donut (Acquisti per Stato)
  const statusChartData = React.useMemo(() => {
    const dataArray = Object.entries(stats.purchasesByStatus).map(([name, value]) => ({
      name: getPurchaseStatusLabel(name),
      value,
    }));
    // Ordina per valore discendente
    return dataArray.sort((a, b) => b.value - a.value);
  }, [stats.purchasesByStatus]);

  // Dati per grafico - Pagamenti per Stato
  const paymentChartData = React.useMemo(() => {
    return Object.entries(stats.purchasesByPaymentStatus).map(([name, value]) => ({
      name: getPaymentStatusLabel(name),
      value,
    })).sort((a, b) => b.value - a.value);
  }, [stats.purchasesByPaymentStatus]);

  // Dati per grafico - Condizione
  const conditionChartData = React.useMemo(() => {
    return Object.entries(stats.purchasesByCondition).map(([name, value]) => ({
      name: name === "Nuovo" ? "🆕 Nuovo" : name === "Usato" ? "♻️ Usato" : "🔧 Rigenerato",
      value,
    })).sort((a, b) => b.value - a.value);
  }, [stats.purchasesByCondition]);

  // Carica dati utente dal sessionStorage
  useEffect(() => {
    const storedCompanyName = sessionStorage.getItem("companyName");
    const storedUserName = sessionStorage.getItem("userName");
    if (storedCompanyName) setCompanyName(storedCompanyName);
    if (storedUserName) setUserName(storedUserName);
  }, []);

  // Funzione per ottenere il token di autenticazione
  // const getAuthToken = () => {
  //   return sessionStorage.getItem("token") || "";
  // };

  // Funzione per ottenere gli headers di autenticazione completi
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    const multitenantId = sessionStorage.getItem("IdCompany");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-Multitenant-Id": multitenantId || "",
    };
  };

  // Carica tutti gli acquisti all'avvio
  useEffect(() => {
    fetchPurchases();
  }, []);

  // Funzione per caricare gli acquisti
  const fetchPurchases = async (filters?: PurchaseSearchRequestDto) => {
    setLoading(true);
    setError(null);

    try {
      // Prepara il payload per la ricerca
      const searchPayload: PurchaseSearchRequestDto = {
        ...filters,
        page: 1,
        pageSize: 100, // Recupera i primi 100 risultati
      };

      console.log("Chiamata API Purchase/search con payload:", searchPayload);
      console.log("Headers:", getAuthHeaders());

      const response = await fetch(`${API_URL}/api/Purchase/search`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(searchPayload),
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error("Errore risposta API:", response.status, errorText);
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("=== DEBUG API RESPONSE ===");
      console.log("🌐 RESPONSE COMPLETA RAW:", JSON.stringify(data, null, 2));
      console.log("Dati ricevuti dall'API:", data);
      console.log("Tipo di data:", typeof data);
      console.log("data.items esiste?", data.hasOwnProperty('items'));
      console.log("data.items è array?", Array.isArray(data.items));
      console.log("data è array?", Array.isArray(data));
      
      // Estrai i dati in modo più sicuro
      let purchasesData: any[] = [];
      
      if (Array.isArray(data.data)) {
        // Nuova struttura: { data: [...], pagination: {...} }
        purchasesData = data.data;
        console.log("✅ Usando data.data (array di", purchasesData.length, "elementi)");
        console.log("📊 Paginazione:", data.pagination);
      } else if (Array.isArray(data.items)) {
        // Vecchia struttura: { items: [...] }
        purchasesData = data.items;
        console.log("✅ Usando data.items (array di", purchasesData.length, "elementi)");
      } else if (Array.isArray(data)) {
        // Struttura diretta: [...]
        purchasesData = data;
        console.log("✅ Usando data direttamente (array di", purchasesData.length, "elementi)");
      } else {
        console.warn("⚠️ Struttura dati non riconosciuta. Keys disponibili:", Object.keys(data));
        purchasesData = [];
      }
      
      console.log("Acquisti processati:", purchasesData.length);
      console.log("📦 PAYLOAD COMPLETO purchasesData:", JSON.stringify(purchasesData, null, 2));
      console.log("📦 PAYLOAD COMPLETO purchasesData (oggetto):", purchasesData);
      console.log("=== FINE DEBUG ===");

      setPurchases(purchasesData);
      setFilteredPurchases(purchasesData);
      calculateStats(purchasesData);
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
    // Controllo di sicurezza: verifica che purchasesData sia un array
    if (!purchasesData || !Array.isArray(purchasesData)) {
      console.warn("calculateStats chiamato con dati non validi:", purchasesData);
      purchasesData = [];
    }

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
  // const formatDateTime = (dateString?: string) => {
  //   if (!dateString) return "-";
  //   return new Date(dateString).toLocaleString("it-IT", {
  //     day: "2-digit",
  //     month: "2-digit",
  //     year: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // };

  // Ottieni label stato acquisto

  // Calcola percentuale per grafico
  // const calculatePercentage = (value: number, total: number) => {
  //   return total > 0 ? (value / total) * 100 : 0;
  // };

  // Funzione per caricare i dettagli completi di un acquisto includendo il fornitore
  const loadPurchaseWithSupplier = async (purchase: PurchaseDetailDto) => {
    setLoadingDetails(true);
    setSupplierDetails(null);
    try {
      // Carica i dettagli completi dell'acquisto dal backend
      const response = await fetch(`${API_URL}/api/Purchase/${purchase.purchaseId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const purchaseDetails = await response.json();
      setSelectedPurchase(purchaseDetails);

      // Opzionale: Carica anche i dati del fornitore se necessario
      if (purchaseDetails.supplierId) {
        try {
          const supplierResponse = await fetch(
            `${API_URL}/api/Customer/${purchaseDetails.supplierId}`,
            {
              method: "GET",
              headers: getAuthHeaders(),
            }
          );

          if (supplierResponse.ok) {
            const supplier = await supplierResponse.json();
            setSupplierDetails(supplier);
          }
        } catch (supplierError) {
          console.warn("Impossibile caricare i dettagli del fornitore:", supplierError);
        }
      }

      setShowDetailModal(true);
    } catch (error) {
      console.error("Errore nel caricamento dei dettagli:", error);
      // In caso di errore, mostra comunque i dati disponibili
      setSelectedPurchase(purchase);
      setShowDetailModal(true);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Funzione per eliminare un acquisto (soft delete)
  const handleDeletePurchase = async (purchaseId: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo acquisto?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/Purchase/${purchaseId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      // Ricarica la lista dopo l'eliminazione
      alert("Acquisto eliminato con successo");
      fetchPurchases(searchFilters);
    } catch (error) {
      console.error("Errore nell'eliminazione dell'acquisto:", error);
      alert("Errore nell'eliminazione dell'acquisto");
    }
  };

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  return (
    <div className={styles.mainLayout}>
    <Sidebar menuState={menuState} toggleMenu={toggleMenu}/>
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

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

          {/* === RIEPILOGO GRAFICO & CARDS === */}
          <section className={styles.statsRow}>
            {/* Card larga con 3 grafici affiancati */}
            <div className={styles.statsChartCard}>
              <div className={styles.statsCardHeader}>
                📊 Distribuzione Acquisti
              </div>
              <div className={styles.statsCardBody}>
                <div className={styles.threeChartsRow}>
                  {/* GRAFICO 1: Acquisti per Stato */}
                  <div className={styles.miniChartContainer}>
                    <h4 className={styles.miniChartTitle}>📈 Per Stato</h4>
                    <div className={styles.miniDonutWrapper}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Tooltip />
                          <Pie
                            data={statusChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {statusChartData.map((_entry, idx) => (
                              <Cell
                                key={`cell-status-${idx}`}
                                fill={COLORS[idx % COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={styles.miniLegendList}>
                      {statusChartData.slice(0, 3).map((s, i) => (
                        <div key={s.name} className={styles.miniLegendItem}>
                          <span
                            className={styles.legendDot}
                            style={{ background: COLORS[i % COLORS.length] }}
                          />
                          <span className={styles.miniLegendText}>{s.name}</span>
                          <span className={styles.miniLegendValue}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GRAFICO 2: Pagamenti per Stato */}
                  <div className={styles.miniChartContainer}>
                    <h4 className={styles.miniChartTitle}>💳 Per Pagamento</h4>
                    <div className={styles.miniDonutWrapper}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Tooltip />
                          <Pie
                            data={paymentChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {paymentChartData.map((_entry, idx) => (
                              <Cell
                                key={`cell-payment-${idx}`}
                                fill={COLORS[idx % COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={styles.miniLegendList}>
                      {paymentChartData.slice(0, 3).map((s, i) => (
                        <div key={s.name} className={styles.miniLegendItem}>
                          <span
                            className={styles.legendDot}
                            style={{ background: COLORS[i % COLORS.length] }}
                          />
                          <span className={styles.miniLegendText}>{s.name}</span>
                          <span className={styles.miniLegendValue}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GRAFICO 3: Per Condizione */}
                  <div className={styles.miniChartContainer}>
                    <h4 className={styles.miniChartTitle}>🏷️ Per Condizione</h4>
                    <div className={styles.miniDonutWrapper}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Tooltip />
                          <Pie
                            data={conditionChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {conditionChartData.map((_entry, idx) => (
                              <Cell
                                key={`cell-condition-${idx}`}
                                fill={COLORS[idx % COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className={styles.miniLegendList}>
                      {conditionChartData.map((s, i) => (
                        <div key={s.name} className={styles.miniLegendItem}>
                          <span
                            className={styles.legendDot}
                            style={{ background: COLORS[i % COLORS.length] }}
                          />
                          <span className={styles.miniLegendText}>{s.name}</span>
                          <span className={styles.miniLegendValue}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards di riepilogo (4 cards) */}
            <div className={styles.statCardsGrid}>
              <div className={`${styles.statCard} ${styles.statCard0}`}>
                <h3>{formatCurrency(stats.totalCost)}</h3>
                <small>COSTO TOTALE</small>
              </div>
              <div className={`${styles.statCard} ${styles.statCard1}`}>
                <h3>{formatCurrency(stats.avgPurchaseValue)}</h3>
                <small>VALORE MEDIO</small>
              </div>
              <div className={`${styles.statCard} ${styles.statCard2}`}>
                <h3>{formatCurrency(stats.pendingPayments)}</h3>
                <small>DA PAGARE</small>
              </div>
              <div className={`${styles.statCard} ${styles.statCard3}`}>
                <h3>{stats.completedPurchases}</h3>
                <small>COMPLETATI</small>
              </div>
            </div>
          </section>

          {/* === TABELLA ACQUISTI === */}
          <div className={styles.tableSection}>
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
                    className={`${styles.btn} ${styles.btnSecondary} ${styles.btnToggleFilters}`}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <span className={styles.btnIcon}>
                      {showAdvancedFilters ? "🔽" : "▶️"}
                    </span>
                    Filtri Avanzati
                    {!showAdvancedFilters && (
                      <span className={styles.filterBadge}>
                        {Object.keys(searchFilters).filter(k => (searchFilters as any)[k]).length > 0 
                          ? Object.keys(searchFilters).filter(k => (searchFilters as any)[k]).length 
                          : ""}
                      </span>
                    )}
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
                                    onClick={() => handleDeletePurchase(purchase.purchaseId)}
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