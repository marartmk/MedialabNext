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
                <li className="dropdown-submenu">
                  <button className="dropdown-item dropdown-toggle">
                    IPhone
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/iphone/display")}
                      >
                        Display
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/iphone/batteria")}
                      >
                        Batteria
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/iphone/altri-danni")
                        }
                      >
                        Altri Danni
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/iphone/chip-livello2")
                        }
                      >
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/iphone/danni-liquido")
                        }
                      >
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/iphone/software")}
                      >
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni-attive")}
                      >
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni-archivio")}
                      >
                        Riparazioni in Archivio
                      </button>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-submenu">
                  <button className="dropdown-item dropdown-toggle">
                    IMac
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/imac/display")}
                      >
                        Display
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/imac/batteria")}
                      >
                        Batteria
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/imac/altri-danni")
                        }
                      >
                        Altri Danni
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/imac/chip-livello2")
                        }
                      >
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/imac/danni-liquido")
                        }
                      >
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/imac/software")}
                      >
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni-attive")}
                      >
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni-archivio")}
                      >
                        Riparazioni in Archivio
                      </button>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-submenu">
                  <button className="dropdown-item dropdown-toggle">
                    MacBook
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/macbook/air")}
                      >
                        MacBook Air
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/macbook/pro")}
                      >
                        MacBook Pro
                      </button>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-submenu">
                  <button className="dropdown-item dropdown-toggle">
                    IPad
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/ipad/display")}
                      >
                        Display
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/ipad/batteria")}
                      >
                        Batteria
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/ipad/altri-danni")
                        }
                      >
                        Altri Danni
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/ipad/chip-livello2")
                        }
                      >
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/ipad/danni-liquido")
                        }
                      >
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni/ipad/software")}
                      >
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni-attive")}
                      >
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni-archivio")}
                      >
                        Riparazioni in Archivio
                      </button>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-submenu">
                  <button className="dropdown-item dropdown-toggle">
                    Apple Watch
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/apple-watch/display")
                        }
                      >
                        Display
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          navigate("/riparazioni/apple-watch/batteria")
                        }
                      >
                        Batteria
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni-attive")}
                      >
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/riparazioni-archivio")}
                      >
                        Riparazioni in Archivio
                      </button>
                    </li>
                  </ul>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/nota-riparazione")}
                  >
                    Crea Nota di Riparazione Veloce
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
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item custom-bg-green"
                    onClick={() => navigate("/riparazioni-attive")}
                  >
                    Tutte le Riparazioni Attive
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item custom-bg-red"
                    onClick={() => navigate("/riparazioni-archivio")}
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
