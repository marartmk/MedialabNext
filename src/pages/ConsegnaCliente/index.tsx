import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { CalendarDays, ArrowLeft, FileText, Receipt } from "lucide-react";
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

const ConsegnaCliente: React.FC = () => {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  const location = useLocation();
  const [search] = useSearchParams();

  const navState = (location.state || {}) as {
    repairGuid?: string;
    id?: number;
    repairCode?: string;
  };

  const repairGuid = navState.repairGuid || search.get("rid") || "";
  const numericId = navState.id ?? Number(search.get("id") || 0);

  // Stati per i dati
  const [repairData, setRepairData] = useState<RepairData | null>(null);
  const [loadingRepairData, setLoadingRepairData] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Stati form pagamento
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

  // Aggiorna il resto da pagare
  useEffect(() => {
    const remaining = Math.max(0, finalAmount - depositAmount);
    setRemainingAmount(remaining);
  }, [finalAmount, depositAmount]);

  // Data e ora
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

  // Carica dati riparazione
  useEffect(() => {
    if (numericId > 0) {
      loadRepairData(String(numericId));
    }
  }, [numericId]);

  const loadRepairData = async (id: string) => {
    setLoadingRepairData(true);
    setLoadingError(null);

    try {
      const response = await fetch(`https://localhost:7148/api/repair/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data: RepairData = await response.json();
        setRepairData(data);
        setFinalAmount(data.estimatedPrice || 0);
        setPaymentMethod(data.paymentType || "");
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

      console.log("Payload consegna:", payload);

      const response = await fetch(
        `https://localhost:7148/api/repair/${repairData.repairId}/delivery`,
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
        console.error("Errore API:", errorText);
        alert("❌ Errore durante la registrazione:\n" + errorText);
      }
    } catch (error) {
      console.error("Errore durante la consegna:", error);
      alert("❌ Errore durante la registrazione della consegna. Riprova.");
    } finally {
      setIsProcessing(false);
    }
  };

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
        <div className={styles.contentArea}>
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
            <button className={styles.backBtn} onClick={handleGoBack}>
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
            <div className={styles.dateBox}>
              <CalendarDays className={styles.calendarIcon} />
              <div className={styles.dateTextInline}>
                <span>{dateTime.date}</span>
                <span>{dateTime.time}</span>
              </div>
            </div>
          </div>

          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Roma - Next srl</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>
              Consegna e Pagamento Cliente
            </span>
          </div>
        </div>

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

            {/* Layout principale */}
            <div className={styles.pageContainer}>
              {/* Colonna sinistra */}
              <div className={styles.leftColumn}>
                {/* Info Cliente e Dispositivo */}
                <div className={styles.formSection}>
                  <h3>Dati Cliente</h3>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>Nome Cliente</label>
                      <div className={styles.infoValue}>
                        {repairData.customer?.name || "N/A"}
                        {repairData.customer?.customerType === "Azienda" &&
                          " (Azienda)"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>Telefono</label>
                      <div className={styles.infoValue}>
                        {repairData.customer?.phone || "N/A"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>Email</label>
                      <div className={styles.infoValue}>
                        {repairData.customer?.email || "N/A"}
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>Indirizzo</label>
                      <div className={styles.infoValue}>
                        {repairData.customer?.address
                          ? `${repairData.customer.address}, ${repairData.customer.city} (${repairData.customer.province})`
                          : "N/A"}
                      </div>
                    </div>

                    {repairData.customer?.fiscalCode && (
                      <div className={styles.infoItem}>
                        <label>Codice Fiscale</label>
                        <div className={styles.infoValue}>
                          {repairData.customer.fiscalCode}
                        </div>
                      </div>
                    )}

                    {repairData.customer?.vatNumber && (
                      <div className={styles.infoItem}>
                        <label>Partita IVA</label>
                        <div className={styles.infoValue}>
                          {repairData.customer.vatNumber}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>Dispositivo Riparato</h3>

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
                        <span className={styles.detailLabel}>
                          Problema dichiarato:
                        </span>
                        <span className={styles.detailValue}>
                          {repairData.faultDeclared}
                        </span>
                      </div>
                      {repairData.repairAction && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>
                            Riparazione eseguita:
                          </span>
                          <span className={styles.detailValue}>
                            {repairData.repairAction}
                          </span>
                        </div>
                      )}
                      {repairData.technicianName && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Tecnico:</span>
                          <span className={styles.detailValue}>
                            {repairData.technicianName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonna destra */}
              <div className={styles.rightColumn}>
                {/* Tipo documento */}
                <div className={styles.formSection}>
                  <h3>Tipo Documento da Emettere</h3>

                  <div className={styles.documentTypeSelector}>
                    <button
                      type="button"
                      className={`${styles.documentTypeBtn} ${
                        documentType === "fattura" ? styles.active : ""
                      }`}
                      onClick={() => setDocumentType("fattura")}
                    >
                      <FileText className={styles.docIcon} />
                      <div className={styles.docInfo}>
                        <div className={styles.docTitle}>Fattura</div>
                        <div className={styles.docDesc}>
                          Documento fiscale completo
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`${styles.documentTypeBtn} ${
                        documentType === "ricevuta" ? styles.active : ""
                      }`}
                      onClick={() => setDocumentType("ricevuta")}
                    >
                      <Receipt className={styles.docIcon} />
                      <div className={styles.docInfo}>
                        <div className={styles.docTitle}>Ricevuta Fiscale</div>
                        <div className={styles.docDesc}>
                          Documento fiscale semplificato
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Dettagli pagamento */}
                <div className={styles.formSection}>
                  <h3>Dettagli Pagamento</h3>

                  <div className={styles.formGroup}>
                    <label>Importo Finale *</label>
                    <div className={styles.priceInputContainer}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`${styles.formControl} ${
                          validationErrors.includes(
                            "L'importo finale deve essere maggiore di zero"
                          )
                            ? styles.error
                            : ""
                        }`}
                        value={finalAmount}
                        onChange={(e) =>
                          setFinalAmount(parseFloat(e.target.value) || 0)
                        }
                      />
                      <span className={styles.currencyLabel}>€</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Acconto Versato</label>
                    <div className={styles.priceInputContainer}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={finalAmount}
                        className={styles.formControl}
                        value={depositAmount}
                        onChange={(e) =>
                          setDepositAmount(parseFloat(e.target.value) || 0)
                        }
                      />
                      <span className={styles.currencyLabel}>€</span>
                    </div>
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
                      className={`${styles.formControl} ${
                        validationErrors.includes(
                          "Selezionare il metodo di pagamento"
                        )
                          ? styles.error
                          : ""
                      }`}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="">-- Seleziona metodo --</option>
                      <option value="Contanti">💵 Contanti</option>
                      <option value="Carta di Credito">
                        💳 Carta di Credito
                      </option>
                      <option value="Bancomat">💳 Bancomat</option>
                      <option value="Bonifico">🏦 Bonifico</option>
                      <option value="Amex">💳 American Express</option>
                      <option value="PayPal">💰 PayPal</option>
                      <option value="Altro">📄 Altro</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Note Aggiuntive</label>
                    <textarea
                      className={styles.formControl}
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Eventuali note per la consegna o il pagamento..."
                    />
                  </div>
                </div>

                {/* Riepilogo */}
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

                {/* Errori validazione */}
                {validationErrors.length > 0 && (
                  <div className={styles.validationErrorsContainer}>
                    <h4>⚠️ Errori di validazione:</h4>
                    <ul>
                      {validationErrors.map((error, index) => (
                        <li key={index} className={styles.validationError}>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Azioni */}
            <div className={styles.formActions}>
              <button
                className={styles.btnSecondary}
                onClick={handleGoBack}
                disabled={isProcessing}
              >
                Annulla
              </button>

              <button
                className={styles.btnPrimary}
                onClick={handleProcessPayment}
                disabled={isProcessing}
              >
                {isProcessing
                  ? "Elaborazione..."
                  : "✅ Conferma Consegna e Pagamento"}
              </button>
            </div>
          </div>
        </div>
        <BottomBar />
      </div>
    </div>
  );
};

export default ConsegnaCliente;
