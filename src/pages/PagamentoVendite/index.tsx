import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { ArrowLeft, FileText, Receipt, Eye, Printer, X } from "lucide-react";
import styles from "./pag-vendite.styles.module.css";

interface CustomerData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address?: string;
  customerFiscalCode?: string;
  customerVatNumber?: string;
  customerType?: string;
}

interface DeviceData {
  deviceId: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  imei?: string;
  deviceType?: string;
}

interface SalePaymentDetailDto {
  id: number;
  paymentId: string;
  saleId: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  paymentDate: string;
  notes?: string;
  receivedBy?: string;
  createdAt: string;
  isDeleted: boolean;
}

interface SaleData {
  id: number;
  saleId: string;
  saleCode: string;
  saleType: string;
  saleStatus: string;
  saleStatusCode: string;
  paymentStatus: string;
  paymentType?: string;
  salePrice: number;
  saleAmount: number;
  estimatedCost: number;
  profit: number;
  device?: DeviceData;
  customer?: CustomerData;
  notes?: string;
  sellerCode?: string;
  sellerName?: string;
  hasInvoice: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  hasReceipt: boolean;
  receiptNumber?: string;
  receiptDate?: string;
  includedAccessories?: string;
  hasWarranty: boolean;
  warrantyMonths?: number;
  warrantyExpiryDate?: string;
  createdAt: string;
  saleDate?: string;
  deliveryDate?: string;
  payments?: SalePaymentDetailDto[];
}

const PagamentoVendite: React.FC = () => {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const location = useLocation();
  const [search] = useSearchParams();

  const [companyName, setCompanyName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const API_URL = import.meta.env.VITE_API_URL;

  const navState = (location.state || {}) as {
    saleId?: string; // GUID della vendita
    id?: number;
    saleCode?: string;
  };

  const numericId = navState.id ?? Number(search.get("id") || 0);
  const saleGuid = navState.saleId ?? (search.get("saleId") || "");
  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [loadingSaleData, setLoadingSaleData] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState<"fattura" | "ricevuta">(
    "ricevuta"
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [transactionReference, setTransactionReference] = useState("");
  const [receivedBy, setReceivedBy] = useState("");

  const [notes, setNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Calcola totale già pagato
  const totalPaid =
    saleData?.payments
      ?.filter((p) => !p.isDeleted)
      ?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

  // Calcola rimanente da pagare
  const remainingAmount = (saleData?.saleAmount ?? 0) - totalPaid;

  // Calcolo IVA (22% inclusa nel prezzo)
  const vatRate = 0.22;
  const baseAmount = (saleData?.saleAmount ?? 0) / (1 + vatRate);
  const vatAmount = (saleData?.saleAmount ?? 0) - baseAmount;

  useEffect(() => {
    // Imposta l'importo di default al rimanente da pagare
    if (saleData) {
      const remaining = (saleData.saleAmount ?? 0) - totalPaid;
      setPaymentAmount(remaining > 0 ? remaining : 0);
    }
  }, [saleData, totalPaid]);

  useEffect(() => {
    if (numericId > 0) {
      loadSaleData(numericId);
    } else if (saleGuid) {
      loadSaleDataByGuid(saleGuid);
    }
  }, [numericId, saleGuid]);

  useEffect(() => {
    const company = sessionStorage.getItem("fullName") || "Azienda";
    const user = sessionStorage.getItem("userId") || "Utente";
    setCompanyName(company);
    setUserName(user);
    setReceivedBy(user);
  }, []);

  // Funzione per chiudere il modal con animazione
  const handleClosePreview = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowPreview(false);
      setIsClosing(false);
    }, 300); // Deve corrispondere alla durata dell'animazione fadeOut
  };

  const loadSaleData = async (id: number) => {
    setLoadingSaleData(true);
    setLoadingError(null);

    try {
      const response = await fetch(`${API_URL}/api/Sale/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data: SaleData = await response.json();
        setSaleData(data);
        setPaymentMethod(data.paymentType || "");
        setNotes(data.notes || "");
      } else {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati vendita:", error);
      setLoadingError(
        error instanceof Error ? error.message : "Errore sconosciuto"
      );
    } finally {
      setLoadingSaleData(false);
    }
  };

  const loadSaleDataByGuid = async (guid: string) => {
    setLoadingSaleData(true);
    setLoadingError(null);

    try {
      const response = await fetch(`${API_URL}/api/Sale/guid/${guid}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data: SaleData = await response.json();
        setSaleData(data);
        setPaymentMethod(data.paymentType || "");
        setNotes(data.notes || "");
      } else {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati vendita:", error);
      setLoadingError(
        error instanceof Error ? error.message : "Errore sconosciuto"
      );
    } finally {
      setLoadingSaleData(false);
    }
  };

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!documentType) {
      errors.push("Selezionare il tipo di documento da emettere");
    }

    if (!paymentMethod) {
      errors.push("Selezionare il metodo di pagamento");
    }

    if (paymentAmount <= 0) {
      errors.push("L'importo del pagamento deve essere maggiore di zero");
    }

    if (paymentAmount > remainingAmount) {
      errors.push(
        `L'importo non può superare il rimanente da pagare (€${remainingAmount.toFixed(
          2
        )})`
      );
    }

    if (
      documentType === "fattura" &&
      !saleData?.customer?.customerVatNumber &&
      !saleData?.customer?.customerFiscalCode
    ) {
      errors.push("Per emettere fattura è necessario P.IVA o Codice Fiscale");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleProcessPayment = async () => {
    if (!saleData) return;

    const validation = validateForm();

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      alert("Errori di validazione:\n\n" + validation.errors.join("\n"));
      return;
    }

    setValidationErrors([]);
    setIsProcessing(true);

    try {
      const payload = {
        amount: paymentAmount,
        paymentMethod: paymentMethod,
        transactionReference: transactionReference || null,
        paymentDate: new Date().toISOString(),
        notes: notes || null,
        receivedBy: receivedBy || userName,
      };

      const response = await fetch(
        `${API_URL}/api/Sale/${saleData.saleId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        alert("✅ Pagamento registrato con successo!");

        // Ricarica i dati della vendita per aggiornare i pagamenti
        if (numericId > 0) {
          await loadSaleData(numericId);
        } else if (saleGuid) {
          await loadSaleDataByGuid(saleGuid);
        }

        // Reset form
        setPaymentAmount(0);
        setTransactionReference("");
        setNotes("");
      } else {
        const errorData = await response.json();
        alert(
          "❌ Errore durante la registrazione:\n" +
            (errorData.message || response.statusText)
        );
      }
    } catch (error) {
      console.error("Errore:", error);
      alert("❌ Errore durante la registrazione del pagamento. Riprova.");
    } finally {
      setIsProcessing(false);
    }
  };

  // I componenti Preview rimangono con stili inline perché sono modali
  const ScontrinoPreview = () => (
    <div
      className={`${styles.modalOverlay} ${isClosing ? styles.closing : ""}`}
      onClick={handleClosePreview}
    >
      <div
        className={styles.modalContent}
        style={{
          backgroundColor: "white",
          width: "320px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "8px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          fontFamily: "monospace",
          fontSize: "12px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Contenuto dello scontrino rimane uguale */}
        <div
          style={{
            padding: "20px",
            borderBottom: "2px dashed #333",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
            {companyName}
          </h3>
          <p style={{ margin: "2px 0", fontSize: "10px" }}>
            Via dei Verardi, 7
          </p>
          <p style={{ margin: "2px 0", fontSize: "10px" }}>
            73100 - LECCE (LE)
          </p>
          <p style={{ margin: "2px 0", fontSize: "10px" }}>
            P.IVA: 05347360751
          </p>
        </div>

        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #ddd",
            textAlign: "center",
          }}
        >
          <strong style={{ fontSize: "11px" }}>DOCUMENTO COMMERCIALE</strong>
          <p style={{ margin: "5px 0 0 0", fontSize: "9px" }}>
            di vendita a prestazione
          </p>
        </div>

        <div style={{ padding: "15px 20px", borderBottom: "1px solid #ddd" }}>
          <p style={{ margin: "3px 0", fontSize: "10px" }}>
            <strong>Codice:</strong> {saleData?.saleCode}
          </p>
          <p style={{ margin: "3px 0", fontSize: "10px" }}>
            <strong>Cliente:</strong>{" "}
            {saleData?.customer?.customerName || "N/A"}
          </p>
          <p style={{ margin: "3px 0", fontSize: "10px" }}>
            <strong>Dispositivo:</strong> {saleData?.device?.brand}{" "}
            {saleData?.device?.model}
          </p>
        </div>

        <div style={{ padding: "15px 20px" }}>
          <table
            style={{
              width: "100%",
              fontSize: "10px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th style={{ textAlign: "left", padding: "5px 0" }}>
                  Descrizione
                </th>
                <th style={{ textAlign: "right", padding: "5px 0" }}>
                  Prezzo €
                </th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>

        <div
          style={{
            padding: "15px 20px",
            borderTop: "2px solid #333",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "5px 0", fontSize: "14px" }}>
            <strong>TOTALE COMPLESSIVO</strong>
          </p>
          <p style={{ margin: "5px 0", fontSize: "16px", fontWeight: "bold" }}>
            € {(saleData?.saleAmount ?? 0).toFixed(2)}
          </p>
        </div>

        <div
          style={{
            padding: "15px 20px",
            borderTop: "1px solid #ddd",
            fontSize: "10px",
          }}
        >
          <p style={{ margin: "5px 0" }}>
            <strong>Pagamento:</strong> {paymentMethod || "Non specificato"}
          </p>
          {totalPaid > 0 && (
            <p style={{ margin: "5px 0" }}>
              Acconto versato: € {totalPaid.toFixed(2)}
            </p>
          )}
          {remainingAmount > 0 && (
            <p style={{ margin: "5px 0" }}>
              Resto da pagare: € {remainingAmount.toFixed(2)}
            </p>
          )}
        </div>

        <div
          style={{
            padding: "15px 20px",
            borderTop: "2px dashed #333",
            textAlign: "center",
            fontSize: "9px",
          }}
        >
          <p style={{ margin: "3px 0" }}>
            Data: {new Date().toLocaleDateString("it-IT")}
          </p>
          <p style={{ margin: "3px 0" }}>Operatore: {userName}</p>
          <p style={{ margin: "10px 0 0 0" }}>Grazie per la fiducia!</p>
        </div>

        <div
          style={{
            padding: "15px 20px",
            display: "flex",
            gap: "10px",
            borderTop: "1px solid #ddd",
          }}
        >
          <button
            onClick={handleClosePreview}
            className={styles.btnSecondary}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <X size={16} /> Chiudi
          </button>
          <button
            onClick={() => window.print()}
            className={styles.btnPrimary}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Printer size={16} /> Stampa
          </button>
        </div>
      </div>
    </div>
  );

  const FatturaPreview = () => (
    <div
      className={`${styles.modalOverlay} ${isClosing ? styles.closing : ""}`}
      onClick={handleClosePreview}
    >
      <div
        className={styles.modalContent}
        style={{
          backgroundColor: "white",
          width: "794px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "8px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "30px",
            paddingBottom: "20px",
            borderBottom: "2px solid #333",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>
              {companyName}
            </h2>
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              Via dei Verardi, 7
            </p>
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              73100 LECCE (LE)
            </p>
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              P.IVA: 05347360751
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3
              style={{
                margin: "0 0 10px 0",
                fontSize: "20px",
                color: "#007bff",
              }}
            >
              FATTURA PROFORMA
            </h3>
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              N. {saleData?.saleCode}/{new Date().getFullYear()}
            </p>
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              Data: {new Date().toLocaleDateString("it-IT")}
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "30px",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#666" }}>
            INTESTATO A:
          </h4>
          <p style={{ margin: "3px 0", fontSize: "13px", fontWeight: "bold" }}>
            {saleData?.customer?.customerName || "N/A"}
          </p>
          {saleData?.customer?.customerVatNumber && (
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              P.IVA: {saleData.customer.customerVatNumber}
            </p>
          )}
          {saleData?.customer?.customerFiscalCode && (
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              C.F.: {saleData.customer.customerFiscalCode}
            </p>
          )}
          <p style={{ margin: "3px 0", fontSize: "12px" }}>
            Indirizzo non disponibile
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#e3f2fd",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "12px",
          }}
        >
          <p style={{ margin: "3px 0" }}>
            <strong>Codice Vendita:</strong> {saleData?.saleCode}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>Dispositivo:</strong> {saleData?.device?.brand}{" "}
            {saleData?.device?.model}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>S/N:</strong> {saleData?.device?.serialNumber || "N/A"}
          </p>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  border: "1px solid #dee2e6",
                }}
              >
                #
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  border: "1px solid #dee2e6",
                }}
              >
                Descrizione
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "center",
                  border: "1px solid #dee2e6",
                }}
              >
                Q.tà
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "right",
                  border: "1px solid #dee2e6",
                }}
              >
                Prezzo Unit.
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "right",
                  border: "1px solid #dee2e6",
                }}
              >
                IVA %
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "right",
                  border: "1px solid #dee2e6",
                }}
              >
                Totale
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                1
              </td>
              <td
                style={{
                  padding: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                Vendita dispositivo {saleData?.device?.brand}{" "}
                {saleData?.device?.model}
              </td>
              <td
                style={{
                  padding: "8px",
                  textAlign: "center",
                  border: "1px solid #dee2e6",
                }}
              >
                1
              </td>
              <td
                style={{
                  padding: "8px",
                  textAlign: "right",
                  border: "1px solid #dee2e6",
                }}
              >
                € {baseAmount.toFixed(2)}
              </td>
              <td
                style={{
                  padding: "8px",
                  textAlign: "right",
                  border: "1px solid #dee2e6",
                }}
              >
                22%
              </td>
              <td
                style={{
                  padding: "8px",
                  textAlign: "right",
                  border: "1px solid #dee2e6",
                }}
              >
                € {(saleData?.saleAmount ?? 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "30px",
          }}
        >
          <div style={{ width: "300px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                fontSize: "13px",
                borderBottom: "1px solid #dee2e6",
              }}
            >
              <span>Imponibile:</span>
              <span>€ {baseAmount.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                fontSize: "13px",
                borderBottom: "1px solid #dee2e6",
              }}
            >
              <span>IVA 22%:</span>
              <span>€ {vatAmount.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 10px",
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                marginTop: "10px",
              }}
            >
              <span>TOTALE:</span>
              <span style={{ color: "#007bff" }}>
                € {(saleData?.saleAmount ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fff3cd",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "30px",
            fontSize: "12px",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", fontSize: "13px" }}>
            MODALITÀ DI PAGAMENTO
          </h4>
          <p style={{ margin: "5px 0" }}>
            <strong>Metodo:</strong> {paymentMethod || "Non specificato"}
          </p>
          {totalPaid > 0 && (
            <p style={{ margin: "5px 0" }}>
              <strong>Acconto versato:</strong> € {totalPaid.toFixed(2)}
            </p>
          )}
          {remainingAmount > 0 && (
            <p style={{ margin: "5px 0" }}>
              <strong>Saldo da versare:</strong> € {remainingAmount.toFixed(2)}
            </p>
          )}
        </div>

        {notes && (
          <div
            style={{
              fontSize: "11px",
              color: "#666",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <strong>Note:</strong> {notes}
          </div>
        )}

        <div
          style={{
            borderTop: "2px solid #333",
            paddingTop: "20px",
            fontSize: "10px",
            color: "#666",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "5px 0" }}>
            Documento fiscalmente non rilevante - Proforma per visione
          </p>
          <p style={{ margin: "5px 0" }}>
            Operatore: {userName} | Data emissione:{" "}
            {new Date().toLocaleString("it-IT")}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #dee2e6",
          }}
        >
          <button
            onClick={handleClosePreview}
            className={styles.btnSecondary}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <X size={18} /> Chiudi Anteprima
          </button>
          <button
            onClick={() => window.print()}
            className={styles.btnPrimary}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Printer size={18} /> Stampa Fattura
          </button>
        </div>
      </div>
    </div>
  );

  if (loadingSaleData) {
    return (
      <div className={styles.mainLayout}>
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}>
          <Topbar toggleMenu={toggleMenu} />
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <span>Caricamento dati riparazione...</span>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  if (loadingError || !saleData) {
    return (
      <div className={styles.mainLayout}>
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}></div>
        <Topbar toggleMenu={toggleMenu} />
        <div className={styles.errorContainer}>
          <h2>❌ Errore nel caricamento</h2>
          <p>{loadingError || "Riparazione non trovata"}</p>
          <button className={styles.btnPrimary} onClick={handleGoBack}>
            ← Torna indietro
          </button>
        </div>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        {/* Header della scheda */}
        <div className={styles.schedaHeader}>
          <div className={styles.leftBlock}>
            <button onClick={handleGoBack} className={styles.backBtn}>
              <ArrowLeft className={styles.backIcon} />
            </button>
            <div className={styles.repairInfo}>
              <div className={styles.repairCode}>
                <strong>{saleData.saleCode}</strong>
              </div>
              <div className={styles.repairStatus}>
                Status: {saleData.saleStatus}
              </div>
            </div>
          </div>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>{companyName}</span>
            <span className={styles.breadcrumbSeparator}>•</span>
            <span className={styles.breadcrumbItem}>{userName}</span>
          </div>
        </div>

        {/* Body della pagina */}
        <div className={styles.pageBody}>
          <div className={styles.deliveryFormContainer}>
            {/* Titolo */}
            <div className={styles.pageTitle}>
              <h1>Consegna e Pagamento Cliente</h1>
              <p>
                Scheda: {saleData.saleCode} | Completata il:{" "}
                {saleData.deliveryDate
                  ? new Date(saleData.deliveryDate).toLocaleDateString("it-IT")
                  : "Non completata"}
              </p>
            </div>

            {/* Container principale */}
            <div className={styles.pageContainer}>
              {/* Colonna Sinistra */}
              <div className={styles.leftColumn}>
                {/* Sezione Dati Cliente */}
                <div className={styles.formSection}>
                  <h3>DATI CLIENTE</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>NOME CLIENTE</label>
                      <div className={styles.infoValue}>
                        {saleData.customer?.customerName || "N/A"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>TELEFONO</label>
                      <div className={styles.infoValue}>
                        {saleData.customer?.customerPhone || "N/A"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>EMAIL</label>
                      <div className={styles.infoValue}>
                        {saleData.customer?.customerEmail || "N/A"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>INDIRIZZO</label>
                      <div className={styles.infoValue}>
                        {saleData.customer?.address || "N/A"}
                      </div>
                    </div>

                    <div
                      className={styles.infoItem}
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <label>CODICE FISCALE</label>
                      <div className={styles.infoValue}>
                        {saleData.customer?.customerFiscalCode || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sezione Dispositivo Riparato */}
                <div className={styles.formSection}>
                  <h3>APPARATO VENDUTO</h3>
                  <div className={styles.deviceCard}>
                    <div className={styles.deviceHeader}>
                      <span className={styles.deviceIcon}>📱</span>
                      <div>
                        <div className={styles.deviceName}>
                          {saleData.device?.brand} {saleData.device?.model}
                        </div>
                        <div className={styles.deviceSerial}>
                          S/N: {saleData.device?.serialNumber || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.deviceDetails}>
                      <div className={styles.detailItem}>
                        <label className={styles.detailLabel}>
                          TIPO APPARATO:
                        </label>
                        <div className={styles.detailValue}>
                          {saleData.device?.deviceType || "N/A"}
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <label className={styles.detailLabel}>IMEI:</label>
                        <div className={styles.detailValue}>
                          {saleData.device?.imei || "N/A"}
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <label className={styles.detailLabel}>GARANZIA:</label>
                        <div className={styles.detailValue}>
                          {saleData.hasWarranty
                            ? `${saleData.warrantyMonths ?? 0} mesi` +
                              (saleData.warrantyExpiryDate
                                ? ` (scad. ${new Date(
                                    saleData.warrantyExpiryDate
                                  ).toLocaleDateString("it-IT")})`
                                : "")
                            : "No"}
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <label className={styles.detailLabel}>
                          ACCESSORI INCLUSI:
                        </label>
                        <div className={styles.detailValue}>
                          {saleData.includedAccessories || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonna Destra */}
              <div className={styles.rightColumn}>
                {/* Sezione Tipo Documento */}
                <div className={styles.formSection}>
                  <h3>Tipo Documento</h3>
                  <div className={styles.documentTypeSelector}>
                    <button
                      onClick={() => setDocumentType("fattura")}
                      className={`${styles.documentTypeBtn} ${
                        documentType === "fattura" ? styles.active : ""
                      }`}
                    >
                      <FileText className={styles.docIcon} size={32} />
                      <div className={styles.docInfo}>
                        <div className={styles.docTitle}>Fattura</div>
                        <div className={styles.docDesc}>Documento fiscale</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setDocumentType("ricevuta")}
                      className={`${styles.documentTypeBtn} ${
                        documentType === "ricevuta" ? styles.active : ""
                      }`}
                    >
                      <Receipt className={styles.docIcon} size={32} />
                      <div className={styles.docInfo}>
                        <div className={styles.docTitle}>Ricevuta</div>
                        <div className={styles.docDesc}>Semplificato</div>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPreview(true)}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      padding: "12px",
                      backgroundColor: "#17a2b8",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontWeight: 600,
                    }}
                  >
                    <Eye size={18} /> Anteprima{" "}
                    {documentType === "fattura" ? "Fattura" : "Scontrino"}
                  </button>
                </div>

                {/* Sezione Dettagli Pagamento */}
                <div className={styles.formSection}>
                  <h3>Dettagli Pagamento</h3>

                  <div className={styles.formGroup}>
                    <label>Importo Finale *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={saleData?.saleAmount ?? 0}
                      onChange={() => {}}
                      className={styles.formControl}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Manodopera</label>
                    <div className={styles.formGroup}>
                      <label>Manodopera</label>
                      <input
                        type="number"
                        step="0.01"
                        value={0}
                        onChange={() => {}}
                        className={styles.formControl}
                      />
                    </div>
                    <label>Acconto Versato</label>
                    <input
                      type="number"
                      step="0.01"
                      value={totalPaid}
                      onChange={(e) =>
                        setPaymentAmount(parseFloat(e.target.value) || 0)
                      }
                      className={styles.formControl}
                    />
                  </div>

                  <div className={styles.remainingAmount}>
                    <span className={styles.remainingLabel}>
                      Resto da Pagare:
                    </span>
                    <span className={styles.remainingValue}>
                      € {remainingAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Metodo di Pagamento *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className={styles.formControl}
                    >
                      <option value="">-- Seleziona --</option>
                      <option value="Contanti">💵 Contanti</option>
                      <option value="Carta">💳 Carta</option>
                      <option value="Bonifico">🏦 Bonifico</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Note</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className={styles.formControl}
                      placeholder="Note aggiuntive..."
                    />
                  </div>
                </div>

                {/* Sezione Riepilogo */}
                <div className={styles.summarySection}>
                  <h3>Riepilogo Consegna</h3>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Documento:</span>
                      <span className={styles.summaryValue}>
                        {documentType === "fattura"
                          ? "Fattura"
                          : "Ricevuta Fiscale"}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>
                        Importo Ricambi:
                      </span>
                      <span className={styles.summaryValue}>€ {0}</span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Manodopera:</span>
                      <span className={styles.summaryValue}>€ {0}</span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>IVA:</span>
                      <span className={styles.summaryValue}>
                        € {vatAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>
                        Importo Totale:
                      </span>
                      <span className={styles.summaryValue}>
                        € {(saleData?.saleAmount ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Acconto:</span>
                      <span className={styles.summaryValue}>
                        € {totalPaid.toFixed(2)}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Da Pagare:</span>
                      <span
                        className={`${styles.summaryValue} ${styles.highlight}`}
                      >
                        € {remainingAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Pagamento:</span>
                      <span className={styles.summaryValue}>
                        {paymentMethod || "Non selezionato"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Errori di validazione */}
                {validationErrors.length > 0 && (
                  <div className={styles.validationErrorsContainer}>
                    <h4>⚠️ Errori di validazione:</h4>
                    <ul>
                      {validationErrors.map((err, i) => (
                        <li key={i} className={styles.validationError}>
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Bottoni azioni */}
            <div className={styles.formActions}>
              <button
                onClick={handleGoBack}
                disabled={isProcessing}
                className={styles.btnSecondary}
              >
                Annulla
              </button>

              <button
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className={styles.btnPrimary}
              >
                {isProcessing ? "Elaborazione..." : "✅ Conferma Consegna"}
              </button>
            </div>
          </div>
        </div>
        <BottomBar />
      </div>

      {/* Preview modals */}
      {showPreview &&
        (documentType === "ricevuta" ? (
          <ScontrinoPreview />
        ) : (
          <FatturaPreview />
        ))}
    </div>
  );
};

export default PagamentoVendite;
