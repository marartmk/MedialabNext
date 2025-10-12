import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import styles from "./styles.module.css";
import { Smartphone, Tv, HardDrive } from "lucide-react";

interface DeviceRegistry {
  id: number;
  deviceId: string;
  customerId?: string;
  companyId?: string;
  multitenantId?: string;
  serialNumber: string;
  brand: string;
  model: string;
  deviceType: string;
  purchaseDate?: string;
  receiptNumber?: string;
  retailer?: string;
  notes?: string;
  createdAt: string;
  isDeleted: boolean;
}

const Device: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DeviceRegistry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const brandInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    deviceId: "",
    customerId: "",
    companyId: "",
    multitenantId: "",
    serialNumber: "",
    brand: "",
    model: "",
    deviceType: "Mobile",
    purchaseDate: "",
    receiptNumber: "",
    retailer: "",
    notes: "",
  });

  const deviceTypes = [
    { value: "Mobile", label: "📱 Mobile", icon: Smartphone },
    { value: "TV", label: "📺 TV", icon: Tv },
    { value: "Other", label: "🔧 Altro", icon: HardDrive },
  ];
  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Genera un nuovo GUID per il device
  const generateGuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      const response = await fetch(
        `https://localhost:7148/api/device/search?query=${encodeURIComponent(
          searchQuery
        )}&multitenantId=${encodeURIComponent(multitenantId || "")}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
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

  const onSelectDevice = (device: DeviceRegistry) => {
    setDeviceId(device.id);
    setFormData({
      deviceId: device.deviceId,
      customerId: device.customerId || "",
      companyId: device.companyId || "",
      multitenantId: device.multitenantId || "",
      serialNumber: device.serialNumber,
      brand: device.brand,
      model: device.model,
      deviceType: device.deviceType,
      purchaseDate: device.purchaseDate || "",
      receiptNumber: device.receiptNumber || "",
      retailer: device.retailer || "",
      notes: device.notes || "",
    });
    setShowModal(false);
  };

  const handleSaveDevice = async () => {
    // Validazioni
    if (!formData.serialNumber.trim()) {
      alert("Inserire il numero seriale");
      return;
    }

    if (!formData.brand.trim()) {
      alert("Inserire la marca");
      return;
    }

    if (!formData.model.trim()) {
      alert("Inserire il modello");
      return;
    }

    if (!formData.deviceType) {
      alert("Selezionare un tipo di device");
      return;
    }

    const payload = {
      // Includi l'ID solo se esiste (per gli aggiornamenti)
      ...(deviceId && { id: deviceId }),
      deviceId: formData.deviceId || generateGuid(),
      customerId: formData.customerId || null,
      companyId: formData.companyId || null,
      multitenantId: sessionStorage.getItem("IdCompany") || null,
      serialNumber: formData.serialNumber,
      brand: formData.brand,
      model: formData.model,
      deviceType: formData.deviceType,
      purchaseDate: formData.purchaseDate || null,
      receiptNumber: formData.receiptNumber || null,
      retailer: formData.retailer || null,
      notes: formData.notes || null,
    };

    try {
      const url = deviceId
        ? `https://localhost:7148/api/device/${deviceId}`
        : `https://localhost:7148/api/device`;

      const method = deviceId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const message = deviceId
          ? "Device aggiornato con successo!"
          : "Device creato con successo!";
        alert(message);

        // Se è una creazione, imposta l'ID restituito dal server
        if (!deviceId) {
          const newDevice = await response.json();
          setDeviceId(newDevice.id);
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
    setDeviceId(null);
    setFormData({
      deviceId: generateGuid(),
      customerId: "",
      companyId: "",
      multitenantId: "",
      serialNumber: "",
      brand: "",
      model: "",
      deviceType: "Mobile",
      purchaseDate: "",
      receiptNumber: "",
      retailer: "",
      notes: "",
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "Mobile":
        return "📱";
      case "TV":
        return "📺";
      case "Other":
        return "🔧";
      default:
        return "📱";
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
                title="Aggiungi un nuovo device"
                onClick={() => {
                  resetForm();
                  // Imposta il focus sul campo marca
                  setTimeout(() => {
                    brandInputRef.current?.focus();
                  }, 0);
                }}
              >
                <span className="plus-icon">+</span>
              </div>              
            </div>

            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Cerca per marca, modello, numero seriale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
              <span className="breadcrumb-item">Dispositivi</span>
              <span className="breadcrumb-separator"> &gt; </span>
              <span className="breadcrumb-current">Gestione</span>
            </div>
          </div>

          {/* Form */}
          <div className="page-body">
            <div
              className="card bg-light card text-black"
              style={{ borderRadius: "10px" }}
            >
              <div className="custom-card-header">
                Dati Apparati
              </div>
              <div className={`card-body ${styles.deviceForm}`}>
                <div className="row">
                  <div className="col-md-6 field-group">
                    <label>Device ID</label>
                    <input
                      className="form-control"
                      value={formData.deviceId}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceId: e.target.value })
                      }
                      placeholder="Generato automaticamente"
                      readOnly
                    />
                    <small className={styles.textMuted}>
                      GUID univoco del dispositivo
                    </small>
                  </div>
                  <div className="col-md-6 field-group">
                    <label>Numero Seriale *</label>
                    <input
                      className="form-control"
                      value={formData.serialNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, serialNumber: e.target.value })
                      }
                      placeholder="IMEI, ESN o altro codice seriale"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 field-group">
                    <label>Marca *</label>
                    <input
                      className="form-control"
                      value={formData.brand}
                      ref={brandInputRef}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      placeholder="es. Samsung, LG, Apple..."
                    />
                  </div>
                  <div className="col-md-4 field-group">
                    <label>Modello *</label>
                    <input
                      className="form-control"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      placeholder="es. Galaxy S21, iPhone 13..."
                    />
                  </div>
                  <div className="col-md-4 field-group">
                    <label>Tipo Device *</label>
                    <select
                      className="form-control"
                      value={formData.deviceType}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceType: e.target.value })
                      }
                    >
                      {deviceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 field-group">
                    <label>Customer ID</label>
                    <input
                      className="form-control"
                      value={formData.customerId}
                      onChange={(e) =>
                        setFormData({ ...formData, customerId: e.target.value })
                      }
                      placeholder="GUID del cliente (opzionale)"
                    />
                  </div>
                  <div className="col-md-6 field-group">
                    <label>Company ID</label>
                    <input
                      className="form-control"
                      value={formData.companyId}
                      onChange={(e) =>
                        setFormData({ ...formData, companyId: e.target.value })
                      }
                      placeholder="GUID dell'azienda (opzionale)"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 field-group">
                    <label>Data Acquisto</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-4 field-group">
                    <label>Numero Scontrino</label>
                    <input
                      className="form-control"
                      value={formData.receiptNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, receiptNumber: e.target.value })
                      }
                      placeholder="Numero per la garanzia"
                    />
                  </div>
                  <div className="col-md-4 field-group">
                    <label>Rivenditore</label>
                    <input
                      className="form-control"
                      value={formData.retailer}
                      onChange={(e) =>
                        setFormData({ ...formData, retailer: e.target.value })
                      }
                      placeholder="Nome del negozio"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12 field-group">
                    <label>Note</label>
                    <textarea
                      className="form-control"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Note aggiuntive sul dispositivo..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="row mt-4">
                  <div className={`d-flex justify-content-center ${styles.gapTwo}`}>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveDevice}
                    >
                      {deviceId ? "AGGIORNA" : "SALVA"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={resetForm}
                    >
                      NUOVO
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal per i risultati della ricerca */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h4>🔍 Risultati ricerca device</h4>
            <ul className={styles.deviceResults}>
              {searchResults.map((device) => (
                <li
                  key={device.id}
                  onClick={() => onSelectDevice(device)}
                  className={styles.deviceResultItem}
                >
                  <div className={styles.deviceInfo}>
                    <span className={styles.deviceIcon}>
                      {getDeviceIcon(device.deviceType)}
                    </span>
                    <div className={styles.deviceDetails}>
                      <strong>
                        {device.brand} {device.model}
                      </strong>
                      <br />
                      <small>
                        Seriale: <code>{device.serialNumber}</code> | 
                        Tipo: {device.deviceType}
                        {device.purchaseDate && (
                          <> | Acquisto: {new Date(device.purchaseDate).toLocaleDateString("it-IT")}</>
                        )}
                      </small>
                    </div>
                    <div className={styles.deviceStatus}>
                      <span className={`${styles.statusBadge} ${device.isDeleted ? styles.deleted : styles.active}`}>
                        {device.isDeleted ? '🚫 Eliminato' : '✅ Attivo'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowModal(false)}
                className={`btn ${styles.btnSecondary}`}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Device;