// src/components/Topbar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./topbar.css";
import logo from "../assets/LogoBaseBlack_300.png";

interface TopbarProps {
  toggleMenu: () => void;
}

const Topbar: React.FC<TopbarProps> = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom">
      <div className="container-fluid">
        {/* Logo */}
        <div className="logo-container">
          <img src={logo} alt="Medialab Logo" />;
          <span className="ms-2">Medialab (Admin)</span>
        </div>

        {/* Navbar Collapse */}
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          {/* Main Navigation */}
          <ul className="navbar-nav me-auto">
            {/* 👈 Aggiungi navigazione solo qui */}
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => navigate("/dashboard")}
              >
                Home
              </button>
            </li>

            {/* Riparazione Dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                id="navbarRiparazione"
                data-bs-toggle="dropdown"
              >
                Riparazione
              </button>
              <ul className="dropdown-menu">                                                 
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/accettazione")}
                  >
                    Crea Riparazione
                  </button>
                </li>               
                 <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/nota-riparazione")}
                  >
                    Crea Nota Riparazione
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/ricerca-note")}
                  >
                    Lista Note di Riparazione
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/preventivi")}
                  >
                    Crea Preventivo Riparazione
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/ricerca-preventivi")}
                  >
                    Lista Preventivi
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item custom-bg-green"
                    onClick={() => navigate("/ricerca-schede")}
                  >
                    Tutte le Riparazioni Attive
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item custom-bg-red"
                    onClick={() => navigate("/ricerca-schede")}
                  >
                    Tutte le Riparazioni In Archivio
                  </button>
                </li>
              </ul>
            </li>

            {/* Vendite Dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Vendite
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/vendite-apparati")}
                  >
                    Crea Vendita
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/vendite/dispositivo-usato")}
                  >
                    Dispositivo Usato
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/vendite/dispositivo-nuovo")}
                  >
                    Dispositivo Nuovo
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/ricerca-vendite")}
                  >
                    Ricerca Vendite
                  </button>
                </li>
              </ul>
            </li>

            {/* Acquisto Dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Acquisti
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/acquisto-usato")}
                  >
                    Crea Acquisto Usato
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/ricerca-acquisto-usato")}
                  >
                    Ricerca Acquisti
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/Acquisti/crea-valutazione-usato")}
                  >
                    Crea Valutazione Usato
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/Acquisti/valutazioni-completate")}
                  >
                    Ricerca Valutazioni
                  </button>
                </li>                
              </ul>
            </li>

            {/* Servizi B2B Dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Servizi B2B
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/registro")}
                  >
                    Sub...
                  </button>
                </li>
              </ul>
            </li>

            {/* Prenotazioni */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Prenotazioni
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/prenotazioni")}
                  >
                    Crea Prenotazione
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/ricerca-prenotazioni")}
                  >
                    Prenotazioni Attive
                  </button>
                </li>
                 <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/calendario-prenotazioni")}
                  >
                    Calendario Prenotazioni
                  </button>
                </li>
              </ul>
            </li>

            {/* Fatture */}
            <li className="nav-item">
              <button className="nav-link" onClick={() => navigate("/fatture")}>
                Fatture
              </button>
            </li>

            {/* Spese */}
            <li className="nav-item">
              <button className="nav-link" onClick={() => navigate("/fatture")}>
                Spese
              </button>
            </li>
          </ul>

          {/* Right Side Icons */}
          <div className="d-flex align-items-center">
            <button
              className="topbar-icon-button"
              onClick={() => navigate("/notifiche")}
            >
              <i className="fa-solid fa-bell"></i>
            </button>
            <button
              className="topbar-icon-button"
              onClick={() => navigate("/profilo")}
            >
              <i className="fa-solid fa-user"></i>
            </button>
            <button
              className="topbar-icon-button"
              onClick={() => navigate("/report-lavorazioni")}
            >
              <i className="fa-solid fa-chart-bar"></i>
            </button>
            <button
              className="topbar-icon-button"
              onClick={() => navigate("/impostazioni")}
            >
              <i className="fa-solid fa-cog"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Topbar;
