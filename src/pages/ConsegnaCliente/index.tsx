import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { ArrowLeft, FileText, Receipt, Eye, Printer, X } from "lucide-react";
import styles from "./consegna-cliente.styles.module.css";

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  region: string;
  fiscalCode: string;
  vatNumber: string;
  customerType: string;
}

interface DeviceData {
  id: number;
  deviceId: string;
  serialNumber: string;
  brand: string;
  model: string;
  deviceType: string;
}

interface RepairData {
  id: number;
  repairId: string;
  repairGuid: string;
  repairCode: string;
  deviceId: string;
  customerId?: string;
  companyId: string;
  multitenantId: string;
  faultDeclared: string;
  repairAction?: string;
  repairStatusCode: string;
  repairStatus: string;
  technicianCode?: string;
  technicianName?: string;
  createdAt: string;
  completedAt?: string;
  estimatedPrice?: number;
  paymentType?: string;
  device?: DeviceData;
  customer?: CustomerData;
}

interface RepairPartLine {
  dbId?: number;
  code: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal?: number;
}

const ConsegnaCliente: React.FC = () => {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const location = useLocation();
  const [search] = useSearchParams();

  const [companyName, setCompanyName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [repairParts, setRepairParts] = useState<RepairPartLine[]>([]);

  const partsTotal = repairParts.reduce(
    (s, l) => s + (l.lineTotal ?? l.qty * l.unitPrice),
    0
  );

  const API_URL = import.meta.env.VITE_API_URL;

  const navState = (location.state || {}) as {
    repairGuid?: string;
    id?: number;
    repairCode?: string;
  };

  const numericId = navState.id ?? Number(search.get("id") || 0);

  const [repairData, setRepairData] = useState<RepairData | null>(null);
  const [loadingRepairData, setLoadingRepairData] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState<"fattura" | "ricevuta">(
    "fattura"
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [finalAmount, setFinalAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [laborAmount, setLaborAmount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const vatAmount = Math.max(0, finalAmount - (partsTotal + laborAmount));

  useEffect(() => {
    const remaining = Math.max(0, finalAmount - depositAmount);
    setRemainingAmount(remaining);
  }, [finalAmount, depositAmount]);

  useEffect(() => {
    if (numericId > 0) {
      loadRepairData(String(numericId));
    }
  }, [numericId]);

  useEffect(() => {
    const company = sessionStorage.getItem("fullName") || "Azienda";
    const user = sessionStorage.getItem("userId") || "Utente";
    setCompanyName(company);
    setUserName(user);
  }, []);

  // Funzione per chiudere il modal con animazione
  const handleClosePreview = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowPreview(false);
      setIsClosing(false);
    }, 300); // Deve corrispondere alla durata dell'animazione fadeOut
  };

  const loadRepairData = async (id: string) => {
    setLoadingRepairData(true);
    setLoadingError(null);

    try {
      const response = await fetch(`${API_URL}/api/repair/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data: RepairData = await response.json();
        setRepairData(data);
        setFinalAmount(data.estimatedPrice || 0);
        setPaymentMethod(data.paymentType || "");
        await loadRepairParts(data.repairId);
        await loadExistingPayment(data.repairId);
      } else {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati riparazione:", error);
      setLoadingError(
        error instanceof Error ? error.message : "Errore sconosciuto"
      );
    } finally {
      setLoadingRepairData(false);
    }
  };

  const loadRepairParts = async (repairId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/RepairParts/${repairId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      if (!res.ok) return;

      const rows = await res.json();
      const mapped: RepairPartLine[] = rows.map((p: any) => ({
        dbId: p.id,
        code: p.code,
        name: p.name,
        qty: p.quantity,
        unitPrice: p.unitPrice ?? 0,
        lineTotal: p.lineTotal ?? p.quantity * (p.unitPrice ?? 0),
      }));
      setRepairParts(mapped);
    } catch (e) {
      console.warn("Ricambi non disponibili:", e);
    }
  };

  const loadExistingPayment = async (repairId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/RepairPayments/repair/${repairId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (res.ok) {
        const pay = await res.json();
        if (pay && pay.id) {
          setFinalAmount(pay.totalAmount ?? 0);
          setLaborAmount(pay.laborAmount ?? 0);
          setNotes(pay.notes ?? "");
        }
      }
    } catch (e) {
      console.warn("Errore loadExistingPayment:", e);
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

    if (finalAmount <= 0) {
      errors.push("L'importo finale deve essere maggiore di zero");
    }

    if (
      documentType === "fattura" &&
      !repairData?.customer?.vatNumber &&
      !repairData?.customer?.fiscalCode
    ) {
      errors.push("Per emettere fattura è necessario P.IVA o Codice Fiscale");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleProcessPayment = async () => {
    if (!repairData) return;

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
        repairId: repairData.repairId,
        documentType,
        paymentMethod,
        finalAmount,
        depositAmount,
        remainingAmount,
        notes,
        deliveryDate: new Date().toISOString(),
      };

      const response = await fetch(
        `${API_URL}/api/repair/${repairData.repairId}/delivery`,
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
        alert("✅ Consegna registrata con successo!");
        navigate(-1);
      } else {
        const errorText = await response.text();
        alert("❌ Errore durante la registrazione:\n" + errorText);
      }
    } catch (error) {
      alert("❌ Errore durante la registrazione della consegna. Riprova.");
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
            <strong>Codice:</strong> {repairData?.repairCode}
          </p>
          <p style={{ margin: "3px 0", fontSize: "10px" }}>
            <strong>Cliente:</strong> {repairData?.customer?.name || "N/A"}
          </p>
          <p style={{ margin: "3px 0", fontSize: "10px" }}>
            <strong>Dispositivo:</strong> {repairData?.device?.brand}{" "}
            {repairData?.device?.model}
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
            <tbody>
              {repairParts.map((part, idx) => (
                <tr key={idx} style={{ borderBottom: "1px dotted #ddd" }}>
                  <td style={{ padding: "5px 0" }}>
                    {part.qty} x {part.name}
                  </td>
                  <td style={{ textAlign: "right", padding: "5px 0" }}>
                    {(part.lineTotal ?? part.qty * part.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
              {laborAmount > 0 && (
                <tr style={{ borderBottom: "1px dotted #ddd" }}>
                  <td style={{ padding: "5px 0" }}>Manodopera</td>
                  <td style={{ textAlign: "right", padding: "5px 0" }}>
                    {laborAmount.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
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
            € {finalAmount.toFixed(2)}
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
          {depositAmount > 0 && (
            <p style={{ margin: "5px 0" }}>
              Acconto versato: € {depositAmount.toFixed(2)}
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
              N. {repairData?.repairCode}/{new Date().getFullYear()}
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
            {repairData?.customer?.name || "N/A"}
          </p>
          {repairData?.customer?.vatNumber && (
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              P.IVA: {repairData.customer.vatNumber}
            </p>
          )}
          {repairData?.customer?.fiscalCode && (
            <p style={{ margin: "3px 0", fontSize: "12px" }}>
              C.F.: {repairData.customer.fiscalCode}
            </p>
          )}
          <p style={{ margin: "3px 0", fontSize: "12px" }}>
            {repairData?.customer?.address}, {repairData?.customer?.city} (
            {repairData?.customer?.province})
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
            <strong>Codice Riparazione:</strong> {repairData?.repairCode}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>Dispositivo:</strong> {repairData?.device?.brand}{" "}
            {repairData?.device?.model}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong>S/N:</strong> {repairData?.device?.serialNumber || "N/A"}
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
            {repairParts.map((part, idx) => (
              <tr key={idx}>
                <td style={{ padding: "8px", border: "1px solid #dee2e6" }}>
                  {idx + 1}
                </td>
                <td style={{ padding: "8px", border: "1px solid #dee2e6" }}>
                  {part.name}
                </td>
                <td
                  style={{
                    padding: "8px",
                    textAlign: "center",
                    border: "1px solid #dee2e6",
                  }}
                >
                  {part.qty}
                </td>
                <td
                  style={{
                    padding: "8px",
                    textAlign: "right",
                    border: "1px solid #dee2e6",
                  }}
                >
                  € {part.unitPrice.toFixed(2)}
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
                  € {(part.lineTotal ?? part.qty * part.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
            {laborAmount > 0 && (
              <tr>
                <td style={{ padding: "8px", border: "1px solid #dee2e6" }}>
                  {repairParts.length + 1}
                </td>
                <td style={{ padding: "8px", border: "1px solid #dee2e6" }}>
                  Manodopera
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
                  € {laborAmount.toFixed(2)}
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
                  € {laborAmount.toFixed(2)}
                </td>
              </tr>
            )}
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
              <span>€ {(finalAmount / 1.22).toFixed(2)}</span>
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
              <span>€ {(finalAmount - finalAmount / 1.22).toFixed(2)}</span>
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
                € {finalAmount.toFixed(2)}
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
          {depositAmount > 0 && (
            <p style={{ margin: "5px 0" }}>
              <strong>Acconto versato:</strong> € {depositAmount.toFixed(2)}
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

  if (loadingRepairData) {
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

  if (loadingError || !repairData) {
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
                <strong>{repairData.repairCode}</strong>
              </div>
              <div className={styles.repairStatus}>
                Status: {repairData.repairStatus}
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
                Scheda: {repairData.repairCode} | Completata il:{" "}
                {repairData.completedAt
                  ? new Date(repairData.completedAt).toLocaleDateString("it-IT")
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
                        {repairData.customer?.name || "N/A"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>TELEFONO</label>
                      <div className={styles.infoValue}>
                        {repairData.customer?.phone || "N/A"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>EMAIL</label>
                      <div className={styles.infoValue}>
                        {repairData.customer?.email || "N/A"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>INDIRIZZO</label>
                      <div className={styles.infoValue}>
                        {repairData.customer?.address || "N/A"}
                      </div>
                    </div>

                    <div
                      className={styles.infoItem}
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <label>CODICE FISCALE</label>
                      <div className={styles.infoValue}>
                        {repairData.customer?.fiscalCode || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sezione Dispositivo Riparato */}
                <div className={styles.formSection}>
                  <h3>DISPOSITIVO RIPARATO</h3>
                  <div className={styles.deviceCard}>
                    <div className={styles.deviceHeader}>
                      <span className={styles.deviceIcon}>📱</span>
                      <div>
                        <div className={styles.deviceName}>
                          {repairData.device?.brand} {repairData.device?.model}
                        </div>
                        <div className={styles.deviceSerial}>
                          S/N: {repairData.device?.serialNumber || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.deviceDetails}>
                      <div className={styles.detailItem}>
                        <label className={styles.detailLabel}>
                          PROBLEMA DICHIARATO:
                        </label>
                        <div className={styles.detailValue}>
                          {repairData.faultDeclared || "N/A"}
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <label className={styles.detailLabel}>TECNICO:</label>
                        <div className={styles.detailValue}>
                          {repairData.technicianName || "N/A"}
                        </div>
                      </div>

                      {repairParts.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          <label className={styles.detailLabel}>
                            RICAMBI UTILIZZATI:
                          </label>

                          {repairParts.map((p, i) => (
                            <div
                              key={i}
                              style={{
                                padding: "8px 0",
                                borderTop:
                                  i > 0 ? "1px dashed #e5e5e5" : "none",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  marginBottom: "2px",
                                }}
                              >
                                {p.code} – {p.name} × {p.qty}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#333",
                                  textAlign: "right",
                                }}
                              >
                                €{" "}
                                {(p.lineTotal ?? p.qty * p.unitPrice).toFixed(
                                  2
                                )}
                              </div>
                            </div>
                          ))}

                          <div
                            style={{
                              textAlign: "right",
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop: "2px solid #28a745",
                              fontWeight: "bold",
                              fontSize: "0.95rem",
                            }}
                          >
                            Totale ricambi: € {partsTotal.toFixed(2)}
                          </div>
                        </div>
                      )}
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
                      value={finalAmount}
                      onChange={(e) =>
                        setFinalAmount(parseFloat(e.target.value) || 0)
                      }
                      className={styles.formControl}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Manodopera</label>
                    <input
                      type="number"
                      step="0.01"
                      value={laborAmount}
                      onChange={(e) =>
                        setLaborAmount(parseFloat(e.target.value) || 0)
                      }
                      className={styles.formControl}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Acconto Versato</label>
                    <input
                      type="number"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) =>
                        setDepositAmount(parseFloat(e.target.value) || 0)
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
                      <span className={styles.summaryValue}>
                        € {partsTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Manodopera:</span>
                      <span className={styles.summaryValue}>
                        € {laborAmount.toFixed(2)}
                      </span>
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
                        € {finalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Acconto:</span>
                      <span className={styles.summaryValue}>
                        € {depositAmount.toFixed(2)}
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

export default ConsegnaCliente;
