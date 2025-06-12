// src/components/Topbar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./topbar.css";
import logo from "../assets/LogoBaseBlack_300.png";

interface TopbarProps {
  toggleMenu: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ toggleMenu }) => {
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
            <li className="nav-item">
              <button className="nav-link">Home</button>
            </li>

            {/* Gestionale Dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                id="navbarGestionale"
                data-bs-toggle="dropdown"
              >
                Gestionale
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button className="dropdown-item">
                    <i className="fa fa-home me-2"></i> Home
                  </button>
                </li>
                <li>
                  <button className="dropdown-item">
                    <i className="fa fa-cog me-2"></i> Resoconto
                  </button>
                </li>
              </ul>
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
                      <button className="dropdown-item">Display</button>
                    </li>
                    <li>
                      <button className="dropdown-item">Batteria</button>
                    </li>
                    <li>
                      <button className="dropdown-item">Altri Danni</button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
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
                      <button className="dropdown-item">Display</button>
                    </li>
                    <li>
                      <button className="dropdown-item">Batteria</button>
                    </li>
                    <li>
                      <button className="dropdown-item">Altri Danni</button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
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
                      <button className="dropdown-item">MacBook Air</button>
                    </li>
                    <li>
                      <button className="dropdown-item">MacBook Pro</button>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-submenu">
                  <button className="dropdown-item dropdown-toggle">
                    IPad
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item">Display</button>
                    </li>
                    <li>
                      <button className="dropdown-item">Batteria</button>
                    </li>
                    <li>
                      <button className="dropdown-item">Altri Danni</button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
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
                      <button className="dropdown-item">Display</button>
                    </li>
                    <li>
                      <button className="dropdown-item">Batteria</button>
                    </li>
                    <li>
                      <button className="dropdown-item">
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item">
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

            {/* Altri menu... */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Vendite
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button className="dropdown-item">Accessorio (Rapido)</button>
                </li>
                <li>
                  <button className="dropdown-item">
                    Accessorio (Garanzia)
                  </button>
                </li>
                <li>
                  <button className="dropdown-item">Software</button>
                </li>
                <li>
                  <button className="dropdown-item">Dispositivo Usato</button>
                </li>
                <li>
                  <button className="dropdown-item">Dispositivo Nuovo</button>
                </li>
                <li>
                  <button className="dropdown-item">Spesa</button>
                </li>
              </ul>
            </li>

            <li className="nav-item">
              <button className="nav-link">Clienti</button>
            </li>

            <li className="nav-item">
              <button className="nav-link">Fatture</button>
            </li>
          </ul>

          {/* Right Side Icons */}
          <div className="d-flex align-items-center">
            <button className="btn btn-link p-2">
              <i className="fa-solid fa-bell"></i>
            </button>
            <button className="btn btn-link p-2">
              <i className="fa-solid fa-user"></i>
            </button>
            <button
              className="btn btn-link p-2"
              onClick={() => navigate("/report-lavorazioni")}
            >
              <i className="fa-solid fa-chart-bar"></i>
            </button>
            <button className="btn btn-link p-2">
              <i className="fa-solid fa-cog"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Topbar;
