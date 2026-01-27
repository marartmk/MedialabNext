// src/components/Topbar.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./topbar-admin.css";
import logo from "../assets/LogoBaseBlack_300.png";

interface TopbarProps {
  toggleMenu: () => void;
}

const Topbar: React.FC<TopbarProps> = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const currentUserName =
    sessionStorage.getItem("userId") ||
    sessionStorage.getItem("fullName") ||
    "Utente";

  const logout = () => {
    sessionStorage.clear();
    window.location.href = "/login-admin";
  };

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };


  return (
    <>
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
            {/* ðŸ‘ˆ Aggiungi navigazione solo qui */}
            <li className="nav-item">
              <button 
                className="nav-link"
                onClick={() => navigate('/dashboard-admin')}
              >
                Home
              </button>
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
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/dashboard-admin')}
                  >
                    <i className="fa fa-home me-2"></i> Home
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/resoconto')}
                  >
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
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/iphone/display')}
                      >
                        Display
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/iphone/batteria')}
                      >
                        Batteria
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/iphone/altri-danni')}
                      >
                        Altri Danni
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/iphone/chip-livello2')}
                      >
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/iphone/danni-liquido')}
                      >
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/iphone/software')}
                      >
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni-attive')}
                      >
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni-archivio')}
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
                        onClick={() => navigate('/riparazioni/imac/display')}
                      >
                        Display
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/imac/batteria')}
                      >
                        Batteria
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/imac/altri-danni')}
                      >
                        Altri Danni
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/imac/chip-livello2')}
                      >
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/imac/danni-liquido')}
                      >
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/imac/software')}
                      >
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni-attive')}
                      >
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni-archivio')}
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
                        onClick={() => navigate('/riparazioni/macbook/air')}
                      >
                        MacBook Air
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/macbook/pro')}
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
                        onClick={() => navigate('/riparazioni/ipad/display')}
                      >
                        Display
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/ipad/batteria')}
                      >
                        Batteria
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/ipad/altri-danni')}
                      >
                        Altri Danni
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/ipad/chip-livello2')}
                      >
                        Danni Chip II Livello
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/ipad/danni-liquido')}
                      >
                        Danni Da Liquido
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/ipad/software')}
                      >
                        Interventi Software
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni-attive')}
                      >
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni-archivio')}
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
                        onClick={() => navigate('/riparazioni/apple-watch/display')}
                      >
                        Display
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni/apple-watch/batteria')}
                      >
                        Batteria
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni-attive')}
                      >
                        Riparazioni Attive
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigate('/riparazioni-archivio')}
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
                    onClick={() => navigate('/vendite/accessorio-rapido')}
                  >
                    Accessorio (Rapido)
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/vendite/accessorio-garanzia')}
                  >
                    Accessorio (Garanzia)
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/vendite/software')}
                  >
                    Software
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/vendite/dispositivo-usato')}
                  >
                    Dispositivo Usato
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/vendite/dispositivo-nuovo')}
                  >
                    Dispositivo Nuovo
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/vendite/spesa')}
                  >
                    Spesa
                  </button>
                </li>
              </ul>
            </li>

            {/* Registro Dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                Registro
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button 
                    className="dropdown-item"
                    onClick={() => navigate('/registro')}
                  >
                    Sub...
                  </button>
                </li>
              </ul>
            </li>

            {/* Clienti */}
            <li className="nav-item">
              <button 
                className="nav-link"
                onClick={() => navigate('/anagrafica-clienti')}
              >
                Clienti
              </button>
            </li>

            {/* Fatture Dropdown */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                id="navbarFattureAdmin"
                data-bs-toggle="dropdown"
              >
                Fatture
              </button>
              <ul className="dropdown-menu" aria-labelledby="navbarFattureAdmin">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/fatture?tab=nuove")}
                  >
                    Nuove Fatture
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/fatture?tab=scadute")}
                  >
                    Fatture Scadute
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/fatture?tab=completate")}
                  >
                    Fatture Completate
                  </button>
                </li>
              </ul>
            </li>
          </ul>

          {/* Right Side Icons */}
          <div className="d-flex align-items-center">
            <button 
              className="topbar-icon-button"
              onClick={() => navigate('/notifiche')}
            >
              <i className="fa-solid fa-bell"></i>
            </button>
            <button 
              className="topbar-icon-button"
              onClick={() => navigate("/user")}
              title={currentUserName}
              aria-label={`Profilo: ${currentUserName}`}
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
              title="Impostazioni"
            >
              <i className="fa-solid fa-gear"></i>
            </button>
            <button 
              className="topbar-icon-button"
              onClick={confirmLogout}
              title="Logout"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </div>
      </nav>
      {showLogoutModal && (
      <div className="topbar-modal-backdrop" role="dialog" aria-modal="true">
        <div className="topbar-modal">
          <div className="topbar-modal-header">
            <span>Conferma logout</span>
            <button
              type="button"
              className="topbar-modal-close"
              onClick={cancelLogout}
              aria-label="Chiudi"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
          <div className="topbar-modal-body">
            Sei sicuro di voler uscire dal portale?
          </div>
          <div className="topbar-modal-actions">
            <button
              type="button"
              className="topbar-modal-btn secondary"
              onClick={cancelLogout}
            >
              Annulla
            </button>
            <button
              type="button"
              className="topbar-modal-btn primary"
              onClick={logout}
            >
              Conferma
            </button>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default Topbar;
