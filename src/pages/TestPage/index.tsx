import React, { useState } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import "./styles.css";
import { useEffect } from "react";
import { CalendarDays } from "lucide-react";

// Definizione dei tipi per la diagnostica
interface DiagnosticItem {
  id: string;
  icon: string;
  label: string;
  active: boolean;
}

const TestPage: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");

  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  // Stato per gli elementi diagnostici
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticItem[]>([
    {
      id: "device-info",
      icon: "📱",
      label: "Info sul dispositivo",
      active: true,
    },
    { id: "apple-pay", icon: "💳", label: "Apple Pay", active: true },
    { id: "battery", icon: "🔋", label: "Condizione batteria", active: true },
    { id: "bluetooth", icon: "🔵", label: "Bluetooth", active: true },
    { id: "camera", icon: "📷", label: "Fotocamera", active: true },
    { id: "cellular", icon: "📡", label: "Rete dati cellulare", active: true },
    { id: "clock", icon: "⏰", label: "Orologio", active: true },
    { id: "sim", icon: "🔐", label: "SIM", active: true },
    { id: "face-id", icon: "😊", label: "Face ID", active: true },
    { id: "scanner", icon: "🔍", label: "Scanner UDID", active: true },
    { id: "magsafe", icon: "🔐", label: "MagSafe", active: true },
    { id: "sensors", icon: "📊", label: "Sensori", active: true },
    { id: "services", icon: "☁️", label: "Servizi", active: true },
    { id: "software", icon: "⚙️", label: "Software", active: true },
    { id: "system", icon: "📻", label: "Sistema", active: true },
    { id: "wifi", icon: "📶", label: "Wi-Fi", active: true },
    { id: "rf-cellular", icon: "🎵", label: "RF cellulare", active: true },
    {
      id: "wireless-problem",
      icon: "⚡",
      label: "Problema wireless",
      active: true,
    },
  ]);

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

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Funzione per cambiare lo stato di un elemento diagnostico
  const toggleDiagnosticItem = (id: string) => {
    setDiagnosticItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  return (
    <div className="main-layout">
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className="content-area">
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className="scheda-header">
          <div className="left-block">
            <div className="round-btn">
              <span className="plus-icon">+</span>
            </div>
            <div className="date-box">
              <CalendarDays className="calendar-icon" />
              <div className="date-text-inline">
                <span>{dateTime.date}</span>
                <span>{dateTime.time}</span>
              </div>
            </div>
          </div>

          <div className="breadcrumb">
            <span className="breadcrumb-item">Roma - Next srl</span>
            <span className="breadcrumb-separator"> &gt; </span>
            <span className="breadcrumb-current">Crea Riparazione</span>
          </div>
        </div>

        <div className="page-body">
          <div className="repair-form-container">
            {/* Header della pagina */}
            <div className="page-title">
              <h1>Crea Riparazione</h1>
              <p>Autorizzazione al Lavoro</p>
            </div>

            {/* Layout principale */}
            <div className="page-container">
              {/* Colonna sinistra */}
              <div className="left-column">
                <div className="top-row">
                  {/* Sezione Cliente */}
                  <div className="form-section">
                    <h3>Cliente</h3>
                    <div className="form-group">
                      <label>Cerca Cliente esistente</label>
                      <input type="text" className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>E-Mail</label>
                      <input
                        type="email"
                        className="form-control"
                        value="adriano@yahoo.it"
                      />
                    </div>
                    <div className="form-group">
                      <label>Nome</label>
                      <input
                        type="text"
                        className="form-control"
                        value="Adriano"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cognome</label>
                      <input
                        type="text"
                        className="form-control"
                        value="Massaccesi Loris"
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefono</label>
                      <input
                        type="tel"
                        className="form-control"
                        value="+39 334 5194881"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cap</label>
                      <input
                        type="text"
                        className="form-control"
                        value="00012"
                      />
                    </div>
                  </div>
                  {/* Sezione Dispositivo */}
                  <div className="form-section">
                    <h3>Dispositivo</h3>
                    <div className="form-group">
                      <label>Numero di serie/IMEI</label>
                      <input
                        type="text"
                        className="form-control"
                        value="359560232396424D"
                      />
                    </div>
                    <div className="form-group">
                      <label>Dispositivo</label>
                      <select className="form-control">
                        <option value="">-- Seleziona --</option>
                        <option value="iPhone" selected>
                          iPhone
                        </option>
                        <option value="iPad">iPad</option>
                        <option value="Mac">Mac</option>
                        <option value="Watch">Watch</option>
                        <option value="AirPods">AirPods</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Modello</label>
                      <input
                        type="text"
                        className="form-control"
                        value="14 Pro"
                      />
                    </div>
                    <div className="form-group">
                      <label>Colore</label>
                      <input
                        type="text"
                        className="form-control"
                        value="Oro Purple"
                      />
                    </div>
                    <div className="form-group">
                      <label>Codice di Sblocco</label>
                      <input
                        type="text"
                        className="form-control"
                        value="123456"
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefono di cortesia</label>
                      <input type="text" className="form-control" value="SI" />
                    </div>
                  </div>
                </div>
                {/* Sezione Diagnostica */}
                <div className="form-section diagnostica-section">
                  <h3>Diagnostica di ricezione</h3>
                  <div className="diagnostica-grid">
                    {diagnosticItems.map((item) => (
                      <div key={item.id} className="diagnostica-item-wrapper">
                        <div
                          className={`diagnostica-item ${
                            item.active ? "active" : "inactive"
                          }`}
                          onClick={() => toggleDiagnosticItem(item.id)}
                        >
                          <div className="diagnostica-icon">{item.icon}</div>
                        </div>
                        <div className="diagnostica-label">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colonna destra */}
              <div className="right-column">
                {/* Info generazione automatica */}
                <div className="auto-generation-info">
                  <div className="form-group">
                    <label>Data e ora di creazione</label>
                    <input
                      type="text"
                      className="form-control"
                      value="gg/mm/aa oo:mm generato automaticamente"
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Cod. scheda</label>
                    <input
                      type="text"
                      className="form-control"
                      value="generato automaticamente"
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Assegnata a</label>
                    <input
                      type="text"
                      className="form-control"
                      value="menu a tendina con lista tecnici"
                    />
                  </div>
                  <div className="form-group">
                    <label>Gestita in</label>
                    <input
                      type="text"
                      className="form-control"
                      value="menu a tendina"
                    />
                  </div>
                </div>

                {/* Sezione Riparazione */}
                <div className="form-section">
                  <h3>Riparazione</h3>
                  <div className="form-group">
                    <label>Componente/riparazione</label>
                    <select className="form-control">
                      <option value="">-- Seleziona --</option>
                      <option value="Schermo">Schermo</option>
                      <option value="Batteria">Batteria</option>
                      <option value="Altri Danni">Altri Danni</option>
                      <option value="Scheda Madre">Scheda Madre</option>
                      <option value="Software">Software</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Descrizione dell'intervento/problema</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value="Sostituzione del vetro dello schermo"
                    ></textarea>
                  </div>
                </div>

                {/* Sezione Prezzo */}
                <div className="form-section">
                  <h3>Prezzo</h3>
                  <div className="form-group">
                    <label>Prezzo Preventivo iva inclusa</label>
                    <input
                      type="text"
                      className="form-control"
                      value="399,00 Eur"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tipo di Pagamento</label>
                    <input type="text" className="form-control" value="Amex" />
                  </div>
                  <div className="form-group">
                    <label>Informazioni per la fatturazione</label>
                    <textarea className="form-control" rows={3}></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottoni */}
            <div className="form-actions">
              <button className="btn btn-success">Crea/Invia E-Mail</button>
              <button className="btn btn-secondary">Crea/Stampa</button>
              <button className="btn btn-secondary">
                Crea/Stampa etichetta
              </button>
              <button className="btn btn-dark">
                Crea/Stampa/Spedisci al Lab
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
