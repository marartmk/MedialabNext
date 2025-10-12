import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import styles from "./nota-riparazione-styles.module.css";

// Interfacce (riutilizziamo quelle della pagina di accettazione)
interface CustomerData {
  id: string;
  tipologia: string;
  ragioneSociale: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  cap: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  regione: string;
  fiscalCode: string;
  pIva: string;
  emailPec: string;
  codiceSdi: string;
  iban: string;
}

interface DeviceData {
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

const NotaRiparazioneVeloce: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  // Stati per la ricerca cliente
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );

  // Stati per la ricerca dispositivo
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const [deviceSearchResults, setDeviceSearchResults] = useState<DeviceData[]>(
    []
  );
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);

  // Stati form
  const [codiceRiparazione, setCodiceRiparazione] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [problema, setProblema] = useState("");
  const [prezzoPreventivo, setPrezzoPreventivo] = useState("");

  // Refs per dropdown
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const deviceSearchInputRef = useRef<HTMLInputElement>(null);
  const deviceDropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deviceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Carica data/ora
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const date = now.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const time = now.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateTime({ date, time });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Gestione click fuori dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      if (
        deviceDropdownRef.current &&
        !deviceDropdownRef.current.contains(event.target as Node) &&
        deviceSearchInputRef.current &&
        !deviceSearchInputRef.current.contains(event.target as Node)
      ) {
        setShowDeviceDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Ricerca cliente con debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Esegui ricerca cliente
  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      const response = await fetch(
        `${API_URL}/api/customer/search?query=${encodeURIComponent(
          query
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
        setShowDropdown(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Ricerca dispositivo con debouncing
  const handleDeviceSearchChange = (value: string) => {
    setDeviceSearchQuery(value);

    if (deviceDebounceRef.current) {
      clearTimeout(deviceDebounceRef.current);
    }

    if (!value.trim()) {
      setShowDeviceDropdown(false);
      setDeviceSearchResults([]);
      return;
    }

    deviceDebounceRef.current = setTimeout(() => {
      performDeviceSearch(value);
    }, 300);
  };

  // Esegui ricerca dispositivo
  const performDeviceSearch = async (query: string) => {
    if (!query.trim()) return;

    setDeviceLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      const response = await fetch(
        `${API_URL}/api/device/search?query=${encodeURIComponent(
          query
        )}&multitenantId=${encodeURIComponent(multitenantId || "")}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeviceSearchResults(data);
        setShowDeviceDropdown(true);
      } else {
        setDeviceSearchResults([]);
      }
    } catch (error) {
      console.error("Errore durante la ricerca dispositivo:", error);
      setDeviceSearchResults([]);
    } finally {
      setDeviceLoading(false);
    }
  };

  // Seleziona cliente
  const onSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.ragioneSociale);
    setCognome(`${customer.cognome} ${customer.nome}`.trim());
    setTelefono(customer.telefono);
    setShowDropdown(false);
  };

  // Seleziona dispositivo
  const onSelectDevice = (device: DeviceData) => {
    setSelectedDevice(device);
    setDeviceSearchQuery(
      `${device.brand} ${device.model} - ${device.serialNumber}`
    );
    setShowDeviceDropdown(false);
  };

  // Cancella selezione cliente
  const clearSelection = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
    setCognome("");
    setTelefono("");
  };

  // Cancella selezione dispositivo
  const clearDeviceSelection = () => {
    setSelectedDevice(null);
    setDeviceSearchQuery("");
  };

  // Icona dispositivo
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

  // Handler Crea Nota
  // Modifica solo la funzione handleCreaNota nel componente esistente

  // Handler Crea Nota - VERSIONE AGGIORNATA
  const handleCreaNota = async () => {
    // Validazione base - SOLO campi obbligatori minimi
    if (!problema.trim()) {
      alert("Inserisci la descrizione del problema!");
      return;
    }
    if (!prezzoPreventivo || parseFloat(prezzoPreventivo) <= 0) {
      alert("Inserisci un prezzo preventivo valido!");
      return;
    }

    // Estrai brand e model
    let brand = "";
    let model = "";

    if (selectedDevice) {
      // Se è stato selezionato un device dalla ricerca
      brand = selectedDevice.brand;
      model = selectedDevice.model;
    } else if (deviceSearchQuery.trim()) {
      // Se è stato inserito manualmente del testo
      const parts = deviceSearchQuery.trim().split(" ");
      if (parts.length >= 2) {
        brand = parts[0];
        model = parts.slice(1).join(" ");
      } else {
        brand = deviceSearchQuery.trim();
        model = "Non specificato";
      }
    } else {
      // Se non c'è nessun input
      alert("Inserisci almeno il modello del dispositivo!");
      return;
    }

    // Estrai cognome e nome
    let cognomeValue = "";
    let nomeValue = "";

    if (selectedCustomer) {
      // Se è stato selezionato un customer
      cognomeValue = selectedCustomer.cognome || "";
      nomeValue = selectedCustomer.nome || "";
    } else if (cognome.trim()) {
      // Se è stato inserito manualmente
      const parts = cognome.trim().split(" ");
      cognomeValue = parts[0] || "";
      nomeValue = parts.slice(1).join(" ") || "";
    } else {
      // Nome/cognome non obbligatorio, ma avvisa
      if (
        !confirm(
          "Non hai inserito il nome del cliente. Vuoi continuare comunque?"
        )
      ) {
        return;
      }
    }

    // Prepara i dati per l'API
    const requestData = {
      // DeviceId e CustomerId sono NULL se non selezionati
      deviceId: selectedDevice?.deviceId || null,
      customerId: selectedCustomer?.id || null,

      companyId: sessionStorage.getItem("IdCompany"),
      multitenantId: sessionStorage.getItem("IdCompany"),

      brand: brand,
      model: model,

      ragioneSociale: selectedCustomer?.ragioneSociale || "",
      cognome: cognomeValue,
      nome: nomeValue,
      telefono: telefono || "",

      codiceRiparazione: codiceRiparazione || "",
      problema: problema,
      prezzoPreventivo: parseFloat(prezzoPreventivo),

      notes: "",
      receivedAt: new Date().toISOString(),
      createdBy: sessionStorage.getItem("Username") || "Sistema",
    };

    try {
      const response = await fetch(
        `${API_URL}/api/repair/quick-note`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      if (response.ok) {
        const result = await response.json();

        alert(
          `✅ Nota di riparazione creata con successo!\n\n` +
            `Codice Nota: ${result.noteCode}\n` +
            `Cliente: ${cognomeValue} ${nomeValue}\n` +
            `Dispositivo: ${brand} ${model}\n` +
            `Prezzo: €${prezzoPreventivo}`
        );

        // Reset del form
        setSelectedCustomer(null);
        setSelectedDevice(null);
        setSearchQuery("");
        setDeviceSearchQuery("");
        setCodiceRiparazione("");
        setCognome("");
        setTelefono("");
        setProblema("");
        setPrezzoPreventivo("");
      } else {
        const errorData = await response.json();
        alert(
          `❌ Errore nella creazione della nota:\n${
            errorData.message || "Errore sconosciuto"
          }`
        );
      }
    } catch (error) {
      console.error("Errore durante la creazione della nota:", error);
      alert("❌ Errore di connessione al server. Riprova più tardi.");
    }
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.pageBody}>
          {/* Sidebar con menu dispositivi */}
          <div className={styles.deviceSidebar}>
            <button className={styles.deviceBtn}>iPhone</button>
            <button className={styles.deviceBtn}>iPad</button>
            <button className={styles.deviceBtn}>Mac</button>
            <button className={styles.deviceBtn}>Watch</button>
            <button className={styles.deviceBtn}>AirPods</button>
          </div>

          {/* Box centrale */}
          <div className={styles.centerBox}>
            <div className={styles.boxHeader}>
              <h2>Crea Nota Riparazione</h2>
            </div>

            <div className={styles.boxBody}>
              {/* Prima riga: Data */}
              <div className={styles.formRow}>
                <label>Data e ora di ricezione</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={`${dateTime.time} - ${dateTime.date}`}
                  readOnly
                />
              </div>

              {/* Seconda riga: Dispositivo e Cognome */}
              <div className={styles.formRowDouble}>
                <div className={styles.formField}>
                  <label>Dispositivo</label>
                  <div className={styles.searchContainer}>
                    <input
                      ref={deviceSearchInputRef}
                      type="text"
                      className={styles.formControl}
                      placeholder="Cerca dispositivo..."
                      value={deviceSearchQuery}
                      onChange={(e) => handleDeviceSearchChange(e.target.value)}
                      onFocus={() => {
                        if (deviceSearchResults.length > 0) {
                          setShowDeviceDropdown(true);
                        }
                      }}
                    />

                    {selectedDevice && (
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={clearDeviceSelection}
                      >
                        ×
                      </button>
                    )}

                    {deviceLoading && (
                      <div className={styles.loadingIndicator}>
                        <div className={styles.spinner}></div>
                      </div>
                    )}

                    {showDeviceDropdown && deviceSearchResults.length > 0 && (
                      <div ref={deviceDropdownRef} className={styles.dropdown}>
                        {deviceSearchResults.map((device) => (
                          <div
                            key={device.id}
                            className={styles.dropdownItem}
                            onClick={() => onSelectDevice(device)}
                          >
                            <strong>
                              {getDeviceIcon(device.deviceType)} {device.brand}{" "}
                              {device.model}
                            </strong>
                            <small>Seriale: {device.serialNumber}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formField}>
                  <label>Cognome</label>
                  <div className={styles.searchContainer}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      className={styles.formControl}
                      placeholder="Cerca cliente..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowDropdown(true);
                        }
                      }}
                    />

                    {selectedCustomer && (
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={clearSelection}
                      >
                        ×
                      </button>
                    )}

                    {loading && (
                      <div className={styles.loadingIndicator}>
                        <div className={styles.spinner}></div>
                      </div>
                    )}

                    {showDropdown && searchResults.length > 0 && (
                      <div ref={dropdownRef} className={styles.dropdown}>
                        {searchResults.map((customer) => (
                          <div
                            key={customer.id}
                            className={styles.dropdownItem}
                            onClick={() => onSelectCustomer(customer)}
                          >
                            <strong>{customer.ragioneSociale}</strong>
                            <small>
                              {customer.email} • {customer.telefono}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCustomer && (
                    <input
                      type="text"
                      className={`${styles.formControl} ${styles.readonlyField}`}
                      value={cognome}
                      readOnly
                    />
                  )}
                </div>
              </div>

              {/* Terza riga: Codice Sblocco, Telefono, Prezzo */}
              <div className={styles.formRowTriple}>
                <div className={styles.formField}>
                  <label>Codice di Sblocco</label>
                  <input
                    type="text"
                    className={styles.formControl}
                    value={codiceRiparazione}
                    onChange={(e) => setCodiceRiparazione(e.target.value)}
                    placeholder="Inserisci codice..."
                  />
                </div>

                <div className={styles.formField}>
                  <label>Telefono</label>
                  <input
                    type="tel"
                    className={styles.formControl}
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+39 334 5918481"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Prezzo Preventivo Iva inclusa</label>
                  <div className={styles.priceInput}>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.formControl}
                      value={prezzoPreventivo}
                      onChange={(e) => setPrezzoPreventivo(e.target.value)}
                      placeholder="399.00"
                    />
                    <span className={styles.currency}>Eur</span>
                  </div>
                </div>
              </div>

              {/* Quarta riga: Descrizione problema */}
              <div className={styles.formRow}>
                <label>Descrizione dell'intervento/problema</label>
                <textarea
                  className={styles.formControl}
                  rows={3}
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  placeholder="Sostituzione del vetro dello schermo"
                />
              </div>

              {/* Bottone Crea Nota */}
              <button className={styles.btnCreaNota} onClick={handleCreaNota}>
                Crea Nota
              </button>
            </div>
          </div>
        </div>

        <BottomBar />
      </div>
    </div>
  );
};

export default NotaRiparazioneVeloce;
