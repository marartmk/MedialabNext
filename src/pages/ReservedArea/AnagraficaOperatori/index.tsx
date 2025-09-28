import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../../components/sidebar";
import Topbar from "../../../components/topbar";
import "./styles.css";
import { CalendarDays } from "lucide-react";

interface Operator {
  id: string;
  idWhr: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  regione: string;
  provincia: string;
  citta: string;
  cap: string;
  indirizzo: string | null;
  idcompany: string | null;
  codiceDipendente: string;
  codiceFiscale: string | null;
  dataNascita: string | null;
  comuneNascita: string | null;
  prNascita: string | null;
  iban: string | null;
  matricola: string | null;
  qualificaImpiegato: string | null;
  descriQualifica: string | null;
  active: boolean | null;
  dataCreazione: string;
  isEmployee: boolean | null;
  multiTenantId: string | null;
}

const Operators: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Operator[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    regione: "",
    provincia: "",
    citta: "",
    cap: "",
    indirizzo: "",
    codiceDipendente: "",
    codiceFiscale: "",
    dataNascita: "",
    comuneNascita: "",
    prNascita: "",
    iban: "",
    matricola: "",
    qualificaImpiegato: "",
    descriQualifica: "",
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
        `https://localhost:7148/api/operator/search?query=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowModal(true);
      } else {
        const errorText = await response.text();
        alert(`Errore nella ricerca: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
      alert("Errore di connessione durante la ricerca");
    } finally {
      setLoading(false);
    }
  };

  const onSelectOperator = (operator: Operator) => {
    setOperatorId(operator.id);
    setFormData({
      userName: operator.userName || "",
      email: operator.email || "",
      firstName: operator.firstName || "",
      lastName: operator.lastName || "",
      phoneNumber: operator.phoneNumber || "",
      regione: operator.regione || "",
      provincia: operator.provincia || "",
      citta: operator.citta || "",
      cap: operator.cap || "",
      indirizzo: operator.indirizzo || "",
      codiceDipendente: operator.codiceDipendente || "",
      codiceFiscale: operator.codiceFiscale || "",
      dataNascita: operator.dataNascita
        ? operator.dataNascita.split("T")[0]
        : "",
      comuneNascita: operator.comuneNascita || "",
      prNascita: operator.prNascita || "",
      iban: operator.iban || "",
      matricola: operator.matricola || "",
      qualificaImpiegato: operator.qualificaImpiegato || "",
      descriQualifica: operator.descriQualifica || "",
    });
    setShowModal(false);
  };

  const handleSaveOperator = async () => {
    if (!formData.firstName) {
      alert("Inserire il nome");
      return;
    }

    if (!formData.lastName) {
      alert("Inserire il cognome");
      return;
    }

    if (!formData.email) {
      alert("Inserire un'email");
      return;
    }

    if (!formData.userName) {
      alert("Inserire un username");
      return;
    }

    if (!formData.phoneNumber) {
      alert("Inserire un numero di telefono");
      return;
    }

    if (!formData.codiceDipendente) {
      alert("Inserire il codice dipendente");
      return;
    }

    // Payload secondo lo schema C_ANA_Operators dello swagger
    const payload = {
      ...(operatorId && { id: operatorId }),
      userName: formData.userName,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      regione: formData.regione,
      provincia: formData.provincia,
      citta: formData.citta,
      cap: formData.cap,
      indirizzo: formData.indirizzo,
      codiceDipendente: formData.codiceDipendente,
      codiceFiscale: formData.codiceFiscale,
      dataNascita: formData.dataNascita
        ? new Date(formData.dataNascita).toISOString()
        : null,
      comuneNascita: formData.comuneNascita,
      prNascita: formData.prNascita,
      iban: formData.iban,
      matricola: formData.matricola,
      qualificaImpiegato: formData.qualificaImpiegato,
      descriQualifica: formData.descriQualifica,
      idcompany: sessionStorage.getItem("IdCompany") || null,
      multiTenantId: sessionStorage.getItem("IdCompany") || null,
      active: 1, // Stato attivo
      isEmployee: 1, // È un dipendente
      dataCreazione: operatorId ? undefined : new Date().toISOString(),
      dataModifica: operatorId ? new Date().toISOString() : undefined,
      isDeleted: false,
      createdAt: operatorId ? undefined : new Date().toISOString(),
    };

    try {
      const url = operatorId
        ? `https://localhost:7148/api/operator/${operatorId}`
        : `https://localhost:7148/api/operator`;

      const method = operatorId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const message = operatorId
          ? "Operatore aggiornato con successo!"
          : "Operatore creato con successo!";
        alert(message);

        if (!operatorId) {
          const newOperator = await response.json();
          setOperatorId(newOperator.id);
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

  const resetForm = () => {
    setOperatorId(null);
    setFormData({
      userName: "",
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      regione: "",
      provincia: "",
      citta: "",
      cap: "",
      indirizzo: "",
      codiceDipendente: "",
      codiceFiscale: "",
      dataNascita: "",
      comuneNascita: "",
      prNascita: "",
      iban: "",
      matricola: "",
      qualificaImpiegato: "",
      descriQualifica: "",
    });
    setTimeout(() => {
      firstNameInputRef.current?.focus();
    }, 0);
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
                title="Aggiungi un nuovo operatore"
                onClick={resetForm}
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
                placeholder="Cerca operatore per nome, cognome o codice..."
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
              <span className="breadcrumb-current">Operatori</span>
            </div>
          </div>

          {/* Form */}
          <div className="page-body">
            <div
              className="card bg-light card text-black"
              style={{ borderRadius: "10px" }}
            >
              <div className="custom-card-header">Dati Operatore</div>
              <div className="card-body customer-form">
                <div className="row">
                  <div className="col-md-6 d-flex gap-3 align-items-end">
                    <div className="field-group w-50">
                      <label>Nome *</label>
                      <input
                        className="form-control"
                        value={formData.firstName}
                        ref={firstNameInputRef}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="field-group w-50">
                      <label>Cognome *</label>
                      <input
                        className="form-control"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6 field-group">
                    <label>Codice Dipendente *</label>
                    <input
                      className="form-control"
                      value={formData.codiceDipendente}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          codiceDipendente: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 field-group">
                    <label>Username *</label>
                    <input
                      className="form-control"
                      value={formData.userName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          userName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 field-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 field-group">
                    <label>Telefono *</label>
                    <input
                      className="form-control"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-4 field-group">
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
                  <div className="col-md-4 field-group">
                    <label>Matricola</label>
                    <input
                      className="form-control"
                      value={formData.matricola}
                      onChange={(e) =>
                        setFormData({ ...formData, matricola: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 field-group">
                    <label>Data di Nascita</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dataNascita}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dataNascita: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-4 field-group">
                    <label>Comune di Nascita</label>
                    <input
                      className="form-control"
                      value={formData.comuneNascita}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          comuneNascita: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-4 field-group">
                    <label>Provincia di Nascita</label>
                    <input
                      className="form-control"
                      value={formData.prNascita}
                      onChange={(e) =>
                        setFormData({ ...formData, prNascita: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12 field-group">
                    <label>Indirizzo</label>
                    <input
                      className="form-control"
                      value={formData.indirizzo}
                      onChange={(e) =>
                        setFormData({ ...formData, indirizzo: e.target.value })
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
                  <div className="col-md-6 field-group">
                    <label>Qualifica Impiegato</label>
                    <input
                      className="form-control"
                      value={formData.qualificaImpiegato}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qualificaImpiegato: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 field-group">
                    <label>Descrizione Qualifica</label>
                    <input
                      className="form-control"
                      value={formData.descriQualifica}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descriQualifica: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12 field-group">
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
                      onClick={handleSaveOperator}
                    >
                      SALVA
                    </button>
                    <button className="btn btn-secondary" onClick={resetForm}>
                      NUOVO
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
            <h4>Risultati ricerca operatori</h4>
            <ul>
              {searchResults.map((operator) => (
                <li
                  key={operator.id}
                  onClick={() => onSelectOperator(operator)}
                  style={{ cursor: "pointer" }}
                >
                  <strong>
                    {operator.firstName} {operator.lastName}
                  </strong>{" "}
                  - {operator.codiceDipendente}
                  <br />
                  <small>
                    {operator.email} - {operator.phoneNumber}
                    {operator.citta && operator.provincia && (
                      <span>
                        {" "}
                        - {operator.citta} ({operator.provincia})
                      </span>
                    )}
                    {operator.matricola && (
                      <span> - Matricola: {operator.matricola}</span>
                    )}
                  </small>
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

export default Operators;
