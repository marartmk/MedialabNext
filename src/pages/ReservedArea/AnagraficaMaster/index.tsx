import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../../components/sidebar-admin";
import Topbar from "../../../components/topbar";
import "./styles.css";
import { CalendarDays } from "lucide-react";

const CompanyMaster: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ragioneSocialeInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    tipo: "Azienda",
    cliente: true,
    fornitore: false,
    tipoCliente: "",
    ragioneSociale: "",
    indirizzo: "",
    cognome: "",
    nome: "",
    cap: "",
    regione: "",
    provincia: "",
    citta: "",
    telefono: "",
    email: "",
    codiceFiscale: "",
    partitaIva: "",
    emailPec: "",
    codiceSdi: "",
    iban: "",
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(
        `https://localhost:7148/api/customer/search?query=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowModal(true);
      } else {
        alert("Errore nella ricerca");
      }
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSelectCustomer = (c: any) => {
    setCustomerId(c.id); // salva l'ID del cliente selezionato
    setFormData({
      tipo: "Azienda", // sempre Azienda
      cliente: c.isCustomer ?? true,
      fornitore: !c.isCustomer,
      tipoCliente: c.tipoCliente || "",
      ragioneSociale: c.ragioneSociale || "",
      indirizzo: c.indirizzo || "",
      cognome: c.cognome || "",
      nome: c.nome || "",
      cap: c.cap || "",
      regione: c.regione || "",
      provincia: c.provincia || "",
      citta: c.citta || "",
      telefono: c.telefono || "",
      email: c.email || "",
      codiceFiscale: c.fiscalCode || "",
      partitaIva: c.pIva || "",
      emailPec: c.emailPec || "",
      codiceSdi: c.codiceSdi || "",
      iban: c.iban || "",
    });
    setShowModal(false);
  };

  const handleSaveCustomer = async () => {
    if (!formData.ragioneSociale) {
      alert("Inserire una ragione sociale");
      return;
    }

    if (!formData.indirizzo) {
      alert("Inserire un indirizzo");
      return;
    }

    if (!formData.cap) {
      alert("Inserire un CAP");
      return;
    }

    if (!formData.regione) {
      alert("Inserire una regione");
      return;
    }

    if (!formData.provincia) {
      alert("Inserire una provincia");
      return;
    }

    if (!formData.citta) {
      alert("Inserire una città");
      return;
    }

    if (!formData.telefono) {
      alert("Inserire un numero di telefono");
      return;
    }

    if (!formData.email) {
      alert("Inserire un'email");
      return;
    }

    const payload = {
      // Includi l'ID solo se esiste (per gli aggiornamenti)
      ...(customerId && { id: customerId }),
      tipologia: "0", // sempre 0 per Azienda
      isCustomer: formData.cliente,
      tipoCliente: formData.tipoCliente,
      ragioneSociale: formData.ragioneSociale,
      indirizzo: formData.indirizzo,
      cognome: null, // sempre null per Azienda
      nome: null, // sempre null per Azienda
      cap: formData.cap,
      regione: formData.regione,
      provincia: formData.provincia,
      citta: formData.citta,
      telefono: formData.telefono,
      email: formData.email,
      fiscalCode: formData.codiceFiscale,
      pIva: formData.partitaIva,
      emailPec: formData.emailPec,
      codiceSdi: formData.codiceSdi,
      iban: formData.iban,
    };

    try {
      const url = customerId
        ? `https://localhost:7148/api/customer/${customerId}`
        : `https://localhost:7148/api/customer`;

      const method = customerId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const message = customerId
          ? "Cliente aggiornato con successo!"
          : "Cliente creato con successo!";
        alert(message);

        // Se è una creazione, imposta l'ID restituito dal server
        if (!customerId) {
          const newCustomer = await response.json();
          setCustomerId(newCustomer.id);
        }
      } else {
        const errText = await response.text();
        alert("Errore nel salvataggio:\n" + errText);
      }
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore durante il salvataggio");
    }
  };

  return (
    <>
      {loading && (
        <div className="global-loading-overlay">
          <div className="spinner"></div>
          <p>Caricamento...</p>
        </div>
      )}
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />

          <div className="scheda-header">
            <div className="left-block">
              <div
                className="round-btn"
                title="Aggiungi un nuovo cliente"
                onClick={() => {
                  setCustomerId(null); // reset ID
                  setFormData({
                    tipo: "Azienda",
                    cliente: true,
                    fornitore: false,
                    tipoCliente: "",
                    ragioneSociale: "",
                    indirizzo: "",
                    cognome: "",
                    nome: "",
                    cap: "",
                    regione: "",
                    provincia: "",
                    citta: "",
                    telefono: "",
                    email: "",
                    codiceFiscale: "",
                    partitaIva: "",
                    emailPec: "",
                    codiceSdi: "",
                    iban: "",
                  });

                  // Imposta il focus sul campo ragione sociale
                  setTimeout(() => {
                    ragioneSocialeInputRef.current?.focus();
                  }, 0);
                }}
              >
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

            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Cerca cliente per nome, cognome o P.IVA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="btn btn-primary search-button"
                onClick={handleSearch}
              >
                Cerca
              </button>
            </div>

            <div className="breadcrumb">
              <span className="breadcrumb-item">Home</span>
              <span className="breadcrumb-separator"> &gt; </span>
              <span className="breadcrumb-item">Anagrafica</span>
              <span className="breadcrumb-separator"> &gt; </span>
              <span className="breadcrumb-current">Aggiungi</span>
            </div>
          </div>

          {/* Form */}
          <div className="page-body">
            <div
              className="card bg-light card text-black"
              style={{ borderRadius: "10px" }}
            >
              <div className="custom-card-header">Dati Cliente / Fornitore</div>
              <div className="card-body customer-form">
                <div className="row">
                  <div className="col-md-6 field-group">
                    <label>Ragione Sociale</label>
                    <input
                      className="form-control"
                      value={formData.ragioneSociale}
                      ref={ragioneSocialeInputRef}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ragioneSociale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 field-group">
                    <label>Indirizzo</label>
                    <input
                      className="form-control"
                      value={formData.indirizzo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          indirizzo: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-3 field-group">
                    <label>CAP</label>
                    <input
                      className="form-control"
                      value={formData.cap}
                      onChange={(e) =>
                        setFormData({ ...formData, cap: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 field-group">
                    <label>Regione</label>
                    <input
                      className="form-control"
                      value={formData.regione}
                      onChange={(e) =>
                        setFormData({ ...formData, regione: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 field-group">
                    <label>Provincia</label>
                    <input
                      className="form-control"
                      value={formData.provincia}
                      onChange={(e) =>
                        setFormData({ ...formData, provincia: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 field-group">
                    <label>Città</label>
                    <input
                      className="form-control"
                      value={formData.citta}
                      onChange={(e) =>
                        setFormData({ ...formData, citta: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-3 field-group">
                    <label>Telefono</label>
                    <input
                      className="form-control"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 field-group">
                    <label>Email</label>
                    <input
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 field-group">
                    <label>Codice Fiscale</label>
                    <input
                      className="form-control"
                      value={formData.codiceFiscale}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          codiceFiscale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-3 field-group">
                    <label>Partita IVA</label>
                    <input
                      className="form-control"
                      value={formData.partitaIva}
                      onChange={(e) =>
                        setFormData({ ...formData, partitaIva: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-3 field-group">
                    <label>Email PEC</label>
                    <input
                      className="form-control"
                      value={formData.emailPec}
                      onChange={(e) =>
                        setFormData({ ...formData, emailPec: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 field-group">
                    <label>Codice SDI</label>
                    <input
                      className="form-control"
                      value={formData.codiceSdi}
                      onChange={(e) =>
                        setFormData({ ...formData, codiceSdi: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3 field-group">
                    <label>IBAN</label>
                    <input
                      className="form-control"
                      value={formData.iban}
                      onChange={(e) =>
                        setFormData({ ...formData, iban: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row mt-4">
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveCustomer}
                    >
                      SALVA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Risultati ricerca</h4>
            <ul>
              {searchResults.map((c: any) => (
                <li
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  style={{ cursor: "pointer" }}
                >
                  <strong>{c.ragioneSociale}</strong> - {c.telefono} -{" "}
                  {c.indirizzo} - {c.citta} ({c.provincia})
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyMaster;
