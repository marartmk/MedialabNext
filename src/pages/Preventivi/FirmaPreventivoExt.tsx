import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import logoUrl from "../../assets/logo-black-white.jpg";
import styles from "./styles.module.css";

interface AccessQuotationResponse {
  quotationId?: string;
  quotationCode?: string;
  quotationStatus?: string;
  createdAt?: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    province?: string;
    fiscalCode?: string;
    vatNumber?: string;
  };
  device?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    deviceType?: string;
  };
  technicianName?: string;
  componentIssue?: string;
  problemDescription?: string;
  estimatedPrice?: number | null;
  notes?: string | null;
}

const FirmaPreventivoExt: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [searchParams] = useSearchParams();
  const accessKey = searchParams.get("accessKey") || "";

  const [quotationData, setQuotationData] =
    useState<AccessQuotationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const signatureCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const companyName =
    (typeof window !== "undefined" && sessionStorage.getItem("fullName")) ||
    "CLINICA iPHONE STORE";
  const companyAddr =
    (typeof window !== "undefined" &&
      sessionStorage.getItem("companyAddress")) ||
    "Via Prova 1 73100 Lecce (LE)";
  const companyVat =
    (typeof window !== "undefined" && sessionStorage.getItem("companyVat")) ||
    "P.IVA 01234567890";
  const companyPhone =
    (typeof window !== "undefined" && sessionStorage.getItem("companyPhone")) ||
    "0832 123456";

  useEffect(() => {
    if (!accessKey) {
      setError("AccessKey mancante.");
      return;
    }

    const fetchQuotation = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_URL}/api/quotations/access/${encodeURIComponent(accessKey)}`
        );
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Errore nel caricamento dei dati");
        }
        const data = await response.json();
        setQuotationData(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Errore inatteso";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [API_URL, accessKey]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);

    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    setSignatureData(dataUrl);
    setShowSignatureModal(false);

    if (!quotationData?.quotationId) {
      alert("Impossibile associare la firma al preventivo.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/quotations/${quotationData.quotationId}/signature`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quotationId: quotationData.quotationId,
            accessKey,
            signatureBase64: dataUrl,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Errore salvataggio firma");
      }

      alert("Firma salvata con successo.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore inatteso";
      alert("Errore nel salvataggio firma:\n" + message);
    }
  };

  const openSignatureModal = () => {
    setShowSignatureModal(true);
    setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 100);
  };

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "0,00";
    }
    return value.toLocaleString("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return <div style={{ padding: "24px" }}>Caricamento...</div>;
  }

  if (error) {
    return <div style={{ padding: "24px", color: "#dc3545" }}>{error}</div>;
  }

  if (!quotationData) {
    return (
      <div style={{ padding: "24px" }}>
        Nessun dato disponibile per la firma.
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "24px" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div className="accSheet">
          <div className="accHeaderPro">
            <div className="accLogoSection">
              <div className="accLogo">
                <img src={logoUrl} alt="Logo" className="accLogoImage" />
              </div>
              <div className="accCompanyTagline">ASSISTENZA TECNICA</div>

              <div className="accCompanyDetails">
                <div>{companyName}</div>
                <div>{companyAddr}</div>
                <div>Tel. {companyPhone}</div>
                <div>{companyVat}</div>
              </div>
            </div>

            <div className="accDocSection">
              <h1 className="accDocTitle">Preventivo di riparazione</h1>
              <div className="accDocInfo">
                <div>
                  <strong>Numero Preventivo:</strong>{" "}
                  {quotationData.quotationCode || ""}
                </div>
                <div>
                  <strong>Stato:</strong> {quotationData.quotationStatus || ""}
                </div>
                <div>
                  <strong>Data:</strong>{" "}
                  {new Date(
                    quotationData.createdAt || ""
                  ).toLocaleDateString("it-IT")}{" "}
                  {new Date(
                    quotationData.createdAt || ""
                  ).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
          <hr className="accDivider" />
          <div className="accInfoGrid">
            <div className="accInfoSection">
              <div className="accSectionTitle">INFORMAZIONI DEL CLIENTE</div>
              <div className="accInfoRows">
                <div className="accInfoRow">
                  <span className="accLabel">Cliente:</span>
                  <span className="accValue">
                    {quotationData.customer?.name || "Non specificato"}
                  </span>
                </div>
                <div className="accInfoRow">
                  <span className="accLabel">Telefono:</span>
                  <span className="accValue">
                    {quotationData.customer?.phone || "Non specificato"}
                  </span>
                </div>
                <div className="accInfoRow">
                  <span className="accLabel">Email:</span>
                  <span className="accValue">
                    {quotationData.customer?.email || "Non specificato"}
                  </span>
                </div>
                <div className="accInfoRow">
                  <span className="accLabel">Indirizzo:</span>
                  <span className="accValue">
                    {[
                      quotationData.customer?.address,
                      quotationData.customer?.postalCode,
                      quotationData.customer?.city,
                      quotationData.customer?.province,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Non specificato"}
                  </span>
                </div>
                {quotationData.customer?.fiscalCode && (
                  <div className="accInfoRow">
                    <span className="accLabel">Codice Fiscale:</span>
                    <span className="accValue">
                      {quotationData.customer.fiscalCode}
                    </span>
                  </div>
                )}
                {quotationData.customer?.vatNumber && (
                  <div className="accInfoRow">
                    <span className="accLabel">P.IVA:</span>
                    <span className="accValue">
                      {quotationData.customer.vatNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="accInfoSection">
              <div className="accSectionTitle">DATI DEL DISPOSITIVO</div>
              <div className="accInfoRows">
                <div className="accInfoRow">
                  <span className="accLabel">Marca e Modello:</span>
                  <span className="accValue">
                    {quotationData.device?.brand}{" "}
                    {quotationData.device?.model}
                  </span>
                </div>
                <div className="accInfoRow">
                  <span className="accLabel">Numero Seriale:</span>
                  <span className="accValue">
                    {quotationData.device?.serialNumber || "Non specificato"}
                  </span>
                </div>
                <div className="accInfoRow">
                  <span className="accLabel">Tipologia:</span>
                  <span className="accValue">
                    {quotationData.device?.deviceType || "Non specificato"}
                  </span>
                </div>
                {quotationData.technicianName && (
                  <div className="accInfoRow">
                    <span className="accLabel">Tecnico Assegnato:</span>
                    <span className="accValue">
                      {quotationData.technicianName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="accProblemSection">
            <div className="accSectionTitle">DESCRIZIONE DEL PROBLEMA</div>
            <div className="accProblemText">
              {quotationData.problemDescription || "Nessuna descrizione fornita"}
            </div>
            {quotationData.componentIssue && (
              <div className="accNotesText">
                <strong>Componente:</strong> {quotationData.componentIssue}
              </div>
            )}
          </div>

          <div className="accTableSection">
            <div className="accSectionTitle">PREVENTIVO</div>
            <table className="accTable">
              <thead>
                <tr>
                  <th className="accTableHeader">Descrizione Intervento</th>
                  <th
                    className="accTableHeader"
                    style={{ width: "80px", textAlign: "center" }}
                  >
                    Q.ta
                  </th>
                  <th
                    className="accTableHeader"
                    style={{ width: "120px", textAlign: "right" }}
                  >
                    Importo
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="accTableCell">
                    {quotationData.problemDescription ||
                      "Diagnosi e preventivo riparazione"}
                  </td>
                  <td
                    className="accTableCell"
                    style={{ textAlign: "center" }}
                  >
                    1
                  </td>
                  <td
                    className="accTableCell"
                    style={{ textAlign: "right" }}
                  >
                    € {formatCurrency(quotationData.estimatedPrice || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="accTableCell" colSpan={2}>
                    <strong>TOTALE</strong>
                  </td>
                  <td
                    className="accTableCell"
                    style={{ textAlign: "right" }}
                  >
                    <strong>
                      € {formatCurrency(quotationData.estimatedPrice || 0)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="accPrivacySection">
            <div className="accPrivacyTitle">
              AUTORIZZAZIONE DEL SERVIZIO DI ASSISTENZA
            </div>
            <div className="accPrivacyText">
              <p>
                Accetto che i Termini e condizioni di riparazione riportati sul
                retro di questa pagina verranno applicati al servizio di
                assistenza per il prodotto sopra indicato, che, poiche
                l'espletamento del servizio di assistenza puo comportare
                l'accidentale perdita dei dati, sara responsabilita esclusiva
                mia quella di backed archiviare i dati per recuperarli in caso
                di necessita e che quindi CLINICA IPHONE non e responsabile
                dell'eventuale perdita o danneggiamento dei dati archiviati sul
                prodotto che i componenti potranno essere riparati o sostituiti
                con componenti nuovi o ricondizionati e che gli eventuali
                componenti difettosi rimossi dal prodotto non potranno essere
                ritirati o recuperati dal Cliente.
              </p>
              <p>
                Ai sensi ed in conformita degli artt. 13 Dlgs 196/03 e 14 del
                GDPR regolamento UE 2016/679, per il trattamento dei dati
                personali, i dati raccolti con la presente scheda sono destinati
                ad essere archiviati (sia manualmente su supporti cartacei sia
                mediante l'utilizzo di moderni sistemi informatici su supporti
                magnetici) nel pieno rispetto dei dettami normativi vigenti e
                potranno essere oggetto di trattamento solo ed esclusivamente
                da parte di soggetti appositamente nominati incaricati ai sensi
                del citato Decreto legislativo. I dati medesimi saranno
                utilizzati unicamente per gli scopi indicati nella presente
                scheda e non saranno utilizzati per ulteriori comunicazioni o
                per usi diversi dal trattamento della "riparazione".
              </p>
            </div>

            <div className="accConsentSection">
              <div className="accConsentTitle">COPIA DI ASSISTENZA</div>
              <div className="accSignatureArea">
                <div className="accSignatureBox">
                  <div className="accSignatureLabel">Firma per accettazione</div>
                  <div
                    className="accSignatureLine"
                    onClick={openSignatureModal}
                    style={{
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {signatureData ? (
                      <img
                        src={signatureData}
                        alt="Firma"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          color: "#95a5a6",
                          fontSize: "0.85rem",
                          textAlign: "center",
                          width: "100%",
                        }}
                      >
                        Clicca qui per firmare
                      </div>
                    )}
                  </div>
                </div>
                <div className="accDateBox">
                  <div className="accDateLabel">
                    Data: {new Date().toLocaleDateString("it-IT")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="accFooter">
            <div className="accFooterText">
              Documento generato automaticamente dal sistema di gestione
              preventivi - {companyName}
            </div>
          </div>
        </div>
      </div>

      {showSignatureModal && (
        <div
          className={styles.signatureModalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSignatureModal(false);
            }
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
          >
            <div className={styles.modalHeader}>
              <h4>Apponi la tua firma</h4>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowSignatureModal(false)}
              >
                x
              </button>
            </div>

            <div className={styles.modalBody}>
              <div
                style={{
                  padding: "12px 16px",
                  background: "#e7f3ff",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "0.9rem",
                  color: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>Nota:</span>
                <span>
                  Firma nell'area sottostante utilizzando il mouse o il touch
                  screen
                </span>
              </div>

              <div
                style={{
                  border: "2px solid #333",
                  borderRadius: "8px",
                  background: "white",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <canvas
                  ref={signatureCanvasRef}
                  width={600}
                  height={250}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    cursor: "crosshair",
                    touchAction: "none",
                  }}
                />

                {!isDrawing && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      color: "#ccc",
                      fontSize: "1.2rem",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    Firma qui
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={clearSignature}
              >
                Cancella
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={saveSignature}
              >
                Salva Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirmaPreventivoExt;
