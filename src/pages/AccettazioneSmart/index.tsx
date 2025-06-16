import React, { useState } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import "./styles.css";
import { useEffect } from "react";
import { CalendarDays } from "lucide-react";

const AccettazioneSmart: React.FC = () => {
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
      setDateTime({ date, time }); // Cambia per passare un oggetto
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

        {/* ✅ INTESTAZIONE SCHEDA */}
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
            <span className="breadcrumb-item">Home</span>
            <span className="breadcrumb-separator"> &gt; </span>
            <span className="breadcrumb-item">Schede Lavorazione</span>
            <span className="breadcrumb-separator"> &gt; </span>
            <span className="breadcrumb-current">Aggiungi</span>
          </div>
        </div>

        <div className="page-body">
          <div
            className="card bg-light card text-black"
            style={{ borderRadius: "10px" }}
          >
            <div className="custom-card-header">
              Dati della nuova scheda di Lavorazione
            </div>
            <div className="card-body p-md-12">
              <div className="row">
                <div className="col-md-2">
                  <label>Codice Scheda*</label>
                  <div>XX-12345ABCDE</div>
                </div>
                <div className="col-md-2">
                  <label>Data Scheda</label>
                  <input id="TbDataScheda" className="form-control" readOnly />
                </div>
              </div>
              <hr />

              <div className="row">
                <div className="col-md-2">
                  <label>Tipo Riparazione</label>
                  <select className="form-control">
                    <option>-- Seleziona --</option>
                    <option value="Y">Gestita in Clinica</option>
                    <option value="N">Spedita a Laboratorio</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label>Assegnata a</label>
                  <select className="form-control">
                    <option>-- Seleziona --</option>
                    <option value="Y">Operatore 1</option>
                    <option value="N">Operatore 2</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label>Cliente Esistente</label>
                  <select className="form-control">
                    <option>-- Seleziona --</option>
                    <option>Cliente 1</option>
                    <option>Cliente 2</option>
                    <option>Cliente 3</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label>Codice Cliente*</label>
                  <input className="form-control" readOnly value="ISIFIAJJ35" />
                </div>
                <div className="col-md-3">
                  <label>E-Mail*</label>
                  <input className="form-control" type="email" />
                </div>
              </div>

              <div className="row">
                <div className="col-md-2">
                  <label>Cognome*</label>
                  <input className="form-control" />
                </div>
                <div className="col-md-2">
                  <label>Nome*</label>
                  <input className="form-control" />
                </div>
                <div className="col-md-2">
                  <label>Tel. principale*</label>
                  <input className="form-control" />
                </div>
                <div className="col-md-2">
                  <label>Tel. secondario</label>
                  <input className="form-control" />
                </div>
                <div className="col-md-2">
                  <label>Data Nascita</label>
                  <input className="form-control" type="date" />
                </div>
              </div>

              <div className="row">
                <div className="col-md-2">
                  <label>Regione</label>
                  <input className="form-control" value="Regione 1" />
                </div>
                <div className="col-md-2">
                  <label>Provincia</label>
                  <input className="form-control" value="Provincia 1" />
                </div>
                <div className="col-md-2">
                  <label>Città</label>
                  <select className="form-control">
                    <option>-- Seleziona --</option>
                    <option>Città 1</option>
                    <option>Città 2</option>
                    <option>Città 3</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label>Cap</label>
                  <input className="form-control" />
                </div>
              </div>

              <div className="row">
                <div className="col-md-2">
                  <label>Prodotto*</label>
                  <select className="form-control">
                    <option>-- Seleziona --</option>
                    <option>IPhone</option>
                    <option>IMac</option>
                    <option>MacBook</option>
                    <option>IPad</option>
                    <option>Scheda Madre</option>
                    <option>Apple Watch</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label>Modello*</label>
                  <select className="form-control">
                    <option>-- Seleziona --</option>
                    <option>Modello 1</option>
                    <option>Modello 2</option>
                    <option>Modello 3</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label>Imei/Seriale*</label>
                  <input className="form-control" />
                </div>
                <div className="col-md-2">
                  <label>SKU*</label>
                  <input className="form-control" />
                </div>
              </div>

              <div className="row">
                <div className="col-md-8">
                  <label>Condizioni Estetiche*</label>
                  <textarea className="form-control" rows={5}></textarea>
                </div>
              </div>

              <div className="row mt-4">
                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-primary" disabled>
                    AGGIUNGI
                  </button>
                  <button className="btn btn-primary" disabled>
                    SALVA
                  </button>
                  <button className="btn btn-primary" disabled>
                    ELIMINA
                  </button>
                  <button className="btn btn-primary" disabled>
                    CONFERMA
                  </button>
                  <button className="btn btn-primary" disabled>
                    ANNULLA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccettazioneSmart;
