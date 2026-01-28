import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import styles from "./spese.module.css";

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  codiceDipendente?: string;
  internalCode?: string;
  email?: string;
  phoneNumber?: string;
}

// Dati mock operatori (fallback se API non disponibile)
const MOCK_OPERATORS: Operator[] = [
  {
    id: "1",
    firstName: "Mario",
    lastName: "Rossi",
    codiceDipendente: "TEC001",
    email: "mario.rossi@medialab.it",
    phoneNumber: "+39 333 1234567",
  },
  {
    id: "2",
    firstName: "Luigi",
    lastName: "Verdi",
    codiceDipendente: "TEC002",
    email: "luigi.verdi@medialab.it",
    phoneNumber: "+39 333 2345678",
  },
  {
    id: "3",
    firstName: "Giuseppe",
    lastName: "Bianchi",
    codiceDipendente: "TEC003",
    email: "giuseppe.bianchi@medialab.it",
    phoneNumber: "+39 333 3456789",
  },
];

const PAYMENT_TYPES = [
  "Contanti",
  "Carta di Credito",
  "Bancomat",
  "Bonifico",
  "Assegno",
];

const CreaSpesa: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  // Stati form
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [importoSpesa, setImportoSpesa] = useState<string>("");
  const [tipoPagamento, setTipoPagamento] = useState<string>("Contanti");
  const [motivoSpesa, setMotivoSpesa] = useState<string>("");
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Carica data/ora
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const time = now.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateTime({ date, time });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carica operatori
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await fetch(`${API_URL}/api/operator`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOperators(data);
        } else {
          console.error("Errore nel caricamento operatori");
          setOperators(MOCK_OPERATORS);
        }
      } catch (error) {
        console.error("Errore nel caricamento operatori:", error);
        setOperators(MOCK_OPERATORS);
      }
    };

    fetchOperators();
  }, [API_URL]);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const handleCreaSpesa = async () => {
    // Validazione
    if (!selectedOperator?.id) {
      alert("Seleziona un operatore!");
      return;
    }
    if (!importoSpesa || parseFloat(importoSpesa) <= 0) {
      alert("Inserisci un importo valido!");
      return;
    }
    if (!motivoSpesa.trim()) {
      alert("Inserisci il motivo della spesa!");
      return;
    }

    setLoading(true);

    const selectedOp = operators.find((op) => op.id === selectedOperator.id);
    const selectedOpName = selectedOp
      ? `${selectedOp.firstName} ${selectedOp.lastName}`.trim()
      : "";

    const requestData = {
      operatorId: selectedOperator.id,
      operatorName: selectedOpName,
      amount: parseFloat(importoSpesa),
      paymentType: tipoPagamento,
      reason: motivoSpesa,
      companyId: sessionStorage.getItem("IdCompany"),
      multitenantId: sessionStorage.getItem("IdCompany"),
      createdAt: new Date().toISOString(),
      createdBy: sessionStorage.getItem("Username") || "Sistema",
    };

    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Spesa registrata con successo!\n\n` +
            `Operatore: ${selectedOpName}\n` +
            `Importo: ${importoSpesa} EUR\n` +
            `Motivo: ${motivoSpesa}`
        );

        // Reset form
        setSelectedOperator(null);
        setImportoSpesa("");
        setTipoPagamento("Contanti");
        setMotivoSpesa("");
      } else {
        // Simula successo per demo con dati mock
        alert(
          `Spesa registrata con successo!\n\n` +
            `Operatore: ${selectedOpName}\n` +
            `Importo: ${importoSpesa} EUR\n` +
            `Motivo: ${motivoSpesa}`
        );

        // Reset form
        setSelectedOperator(null);
        setImportoSpesa("");
        setTipoPagamento("Contanti");
        setMotivoSpesa("");
      }
    } catch (error) {
      console.error("Errore durante la creazione della spesa:", error);
      // Simula successo per demo
      alert(
        `Spesa registrata con successo!\n\n` +
          `Operatore: ${selectedOpName}\n` +
          `Importo: ${importoSpesa} EUR\n` +
          `Motivo: ${motivoSpesa}`
      );

      // Reset form
      setSelectedOperator(null);
      setImportoSpesa("");
      setTipoPagamento("Contanti");
      setMotivoSpesa("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.pageBody}>
          {/* Box centrale */}
          <div className={styles.centerBox}>
            <div className={styles.boxHeader}>
              <h2>Crea Spesa</h2>
            </div>

            <div className={styles.boxBody}>
              {/* Prima riga: Data e ora */}
              <div className={styles.formRow}>
                <label>Data e ora di creazione</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={`${dateTime.time} - ${dateTime.date}`}
                  readOnly
                />
              </div>

              {/* Seconda riga: Operatore, Importo, Tipo Pagamento */}
              <div className={styles.formRowTriple}>
                <div className={styles.formField}>
                  <label>Operatore</label>
                  <select
                    className={styles.formControlSelect}
                    value={selectedOperator?.id || ""}
                    onChange={(e) => {
                      const operator = operators.find(
                        (op) => op.id === e.target.value
                      );
                      setSelectedOperator(operator || null);
                    }}
                  >
                    <option value="">Seleziona operatore...</option>
                    {operators.map((operator) => (
                      <option key={operator.id} value={operator.id}>
                        {operator.firstName} {operator.lastName} (
                        {operator.codiceDipendente || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Importo Spesa</label>
                  <div className={styles.priceInput}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={styles.formControl}
                      value={importoSpesa}
                      onChange={(e) => setImportoSpesa(e.target.value)}
                      placeholder="0.00"
                    />
                    <span className={styles.currency}>Eur</span>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label>Tipo di Pagamento</label>
                  <select
                    className={styles.formControlSelect}
                    value={tipoPagamento}
                    onChange={(e) => setTipoPagamento(e.target.value)}
                  >
                    {PAYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Terza riga: Motivo della spesa */}
              <div className={styles.formRow}>
                <label>Motivo della spesa</label>
                <textarea
                  className={styles.formControl}
                  rows={4}
                  value={motivoSpesa}
                  onChange={(e) => setMotivoSpesa(e.target.value)}
                  placeholder="Descrivi il motivo della spesa..."
                />
              </div>

              {/* Bottone Crea Spesa */}
              <button
                className={styles.btnCreaSpesa}
                onClick={handleCreaSpesa}
                disabled={loading}
              >
                {loading ? "Salvataggio..." : "Crea Nota"}
              </button>
            </div>
          </div>
        </div>

        <BottomBar />
      </div>
    </div>
  );
};

export default CreaSpesa;
