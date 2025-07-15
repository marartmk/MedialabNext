import React, { useState } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import "./styles.css";
import { useEffect } from "react";
import { CalendarDays } from "lucide-react";

const Accettazione: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");

  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

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
            <div className="form-layout">
              {/* Colonna sinistra */}
              <div className="left-column">
                {/* Sezione Cliente */}
                <div className="form-section">
                  <h3>Cliente</h3>
                  <div className="form-group">
                    <label>Cerca Cliente esistente</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>E-Mail</label>
                    <input type="email" className="form-control" value="adriano@yahoo.it" />
                  </div>
                  <div className="form-group">
                    <label>Nome</label>
                    <input type="text" className="form-control" value="Adriano" />
                  </div>
                  <div className="form-group">
                    <label>Cognome</label>
                    <input type="text" className="form-control" value="Massaccesi Loris" />
                  </div>
                  <div className="form-group">
                    <label>Telefono</label>
                    <input type="tel" className="form-control" value="+39 334 5194881" />
                  </div>
                  <div className="form-group">
                    <label>Cap</label>
                    <input type="text" className="form-control" value="00012" />
                  </div>
                </div>

                {/* Sezione Diagnostica */}
                <div className="form-section diagnostica-section">
                  <h3>Diagnostica di ricezione</h3>
                  <div className="diagnostica-grid">
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">📱</div>
                      <span>Informazioni sul dispositivo</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">💳</div>
                      <span>Apple Pay</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">🔋</div>
                      <span>Condizione della batteria</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">🔵</div>
                      <span>Bluetooth</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">📷</div>
                      <span>Fotocamera</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">📡</div>
                      <span>Rete dati cellulare</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">⏰</div>
                      <span>Orologio</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">🔐</div>
                      <span>SIM</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">😊</div>
                      <span>Face ID</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">🔍</div>
                      <span>Scanner UDID</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">🔐</div>
                      <span>MagSafe</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">📊</div>
                      <span>Sensori</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">☁️</div>
                      <span>Servizi</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">⚙️</div>
                      <span>Software</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">📻</div>
                      <span>Sistema</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">📶</div>
                      <span>Wi-Fi</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">🎵</div>
                      <span>RF cellulare</span>
                    </div>
                    <div className="diagnostica-item active">
                      <div className="diagnostica-icon">⚡</div>
                      <span>Problema wireless</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonna centrale */}
              <div className="center-column">
                {/* Sezione Dispositivo */}
                <div className="form-section">
                  <h3>Dispositivo</h3>
                  <div className="form-group">
                    <label>Numero di serie/IMEI</label>
                    <input type="text" className="form-control" value="359560232396424D" />
                  </div>
                  <div className="form-group">
                    <label>Dispositivo</label>
                    <select className="form-control">
                      <option value="">-- Seleziona --</option>
                      <option value="iPhone" selected>iPhone</option>
                      <option value="iPad">iPad</option>
                      <option value="Mac">Mac</option>
                      <option value="Watch">Watch</option>
                      <option value="AirPods">AirPods</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Modello</label>
                    <input type="text" className="form-control" value="14 Pro" />
                  </div>
                  <div className="form-group">
                    <label>Colore</label>
                    <input type="text" className="form-control" value="Oro Purple" />
                  </div>
                  <div className="form-group">
                    <label>Codice di Sblocco</label>
                    <input type="text" className="form-control" value="123456" />
                  </div>
                  <div className="form-group">
                    <label>Telefono di cortesia</label>
                    <input type="text" className="form-control" value="SI" />
                  </div>
                </div>
              </div>

              {/* Colonna destra */}
              <div className="right-column">
                {/* Info generazione automatica */}
                <div className="auto-generation-info">
                  <div className="form-group">
                    <label>Data e ora di creazione</label>
                    <input type="text" className="form-control" value="gg/mm/aa oo:mm generato automaticamente" readOnly />
                  </div>
                  <div className="form-group">
                    <label>Cod. scheda</label>
                    <input type="text" className="form-control" value="generato automaticamente" readOnly />
                  </div>
                  <div className="form-group">
                    <label>Assegnata a</label>
                    <input type="text" className="form-control" value="menu a tendina con lista tecnici" />
                  </div>
                  <div className="form-group">
                    <label>Gestita in</label>
                    <input type="text" className="form-control" value="menu a tendina" />
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
                    <textarea className="form-control" rows={4} value="Sostituzione del vetro dello schermo"></textarea>
                  </div>
                </div>

                {/* Sezione Prezzo */}
                <div className="form-section">
                  <h3>Prezzo</h3>
                  <div className="form-group">
                    <label>Prezzo Preventivo iva inclusa</label>
                    <input type="text" className="form-control" value="399,00 Eur" />
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
              <button className="btn btn-secondary">Crea/Stampa etichetta</button>
              <button className="btn btn-dark">Crea/Stampa/Spedisci al Lab</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accettazione;