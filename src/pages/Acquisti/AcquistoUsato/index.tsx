import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../../components/sidebar";
import Topbar from "../../../components/topbar";
import styles from "./styles.module.css";
import BottomBar from "../../../components/BottomBar";
import { useNavigate } from "react-router-dom";

// Definizione dei tipi per la diagnostica
interface DiagnosticItem {
  id: string;
  icon: string;
  label: string;
  active: boolean;
}

// Tipo per i dati del cliente
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

// Tipo per il tipo di documento
type TipoDocumento =
  | "Patente"
  | "Carta d'Identità"
  | "Passaporto"
  | "Codice Fiscale";

const AcquistoUsato: React.FC = () => {
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

  // Refs per gestire i dropdown
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPurchaseId, setCurrentPurchaseId] = useState<string | null>(
    null
  );
  const [currentPurchaseCode, setCurrentPurchaseCode] = useState<string | null>(
    null
  );

  // Stati per i campi del form cliente
  const [clienteData, setClienteData] = useState({
    email: "",
    nome: "",
    cognome: "",
    telefono: "",
    cap: "",
    tipoDocumento: "Patente" as TipoDocumento,
    numeroDocumento: "",
  });

  // Stati per i campi del form dispositivo
  const [dispositivoData, setDispositivoData] = useState({
    serialNumber: "",
    brand: "Apple",
    model: "",
    deviceType: "iPhone",
    colore: "",
    memoria: "512 GB",
  });

  // Stato per i dati di acquisto
  const [acquistoData, setAcquistoData] = useState({
    dataAcquisto: "",
    codScheda: "",
    prezzoTotale: "",
    tipoPagamento: "Bonifico",
  });

  // Stati per il modal nuovo cliente
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    tipo: "Privato",
    tipoCliente: "Cliente", // Cliente o Fornitore
    cognome: "",
    nome: "",
    indirizzo: "",
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

  const [savingNewClient, setSavingNewClient] = useState(false);  
  const [showPurchaseReceipt, setShowPurchaseReceipt] = useState(false);
  
  // Stati per la firma digitale
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Tipi di dispositivo
  const deviceTypes = [
    { value: "iPhone", label: "📱 iPhone" },
    { value: "iPad", label: "📱 iPad" },
    { value: "Mac", label: "💻 Mac" },
    { value: "Watch", label: "⌚ Watch" },
    { value: "AirPods", label: "🎧 AirPods" },
  ];

  const memoriaOptions = [
    "64 GB",
    "128 GB",
    "256 GB",
    "512 GB",
    "1 TB",
    "2 TB",
  ];

  const tipoDocumentoOptions: TipoDocumento[] = [
    "Patente",
    "Carta d'Identità",
    "Passaporto",
    "Codice Fiscale",
  ];

  const tipoPagamentoOptions = ["Bonifico", "Contanti", "Assegno", "Carta"];

  // Stato per gli elementi diagnostici
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticItem[]>([
    // 1. Telefono Spento
    {
      id: "telefono-spento",
      icon: "📴",
      label: "Telefono spento",
      active: true,
    },

    // 2. Vetro Rotto
    { id: "vetro-rotto", icon: "🔨", label: "Vetro rotto", active: true },

    // 3. Touchscreen
    { id: "touchscreen", icon: "👆", label: "Touchscreen", active: true },

    // 4. LCD
    { id: "lcd", icon: "📱", label: "LCD", active: true },

    // 5. Frame Scollato
    {
      id: "frame-scollato",
      icon: "🔲",
      label: "Frame scollato",
      active: true,
    },

    // 6. Batteria
    { id: "batteria", icon: "🔋", label: "Batteria", active: true },

    // 7. Dock di Ricarica
    {
      id: "dock-ricarica",
      icon: "🔌",
      label: "Dock di ricarica",
      active: true,
    },

    // 8. Back Cover
    { id: "back-cover", icon: "📲", label: "Back cover", active: true },

    // 9. Telaio
    { id: "telaio", icon: "🔧", label: "Telaio", active: true },

    // 10. Tasti Volume/Muto
    {
      id: "tasti-volume-muto",
      icon: "🔊",
      label: "Tasti volume/muto",
      active: true,
    },

    // 11. Tasto Standby/Power
    {
      id: "tasto-standby-power",
      icon: "⻏",
      label: "Tasto standby/power",
      active: true,
    },

    // 12. Sensore di Prossimità
    {
      id: "sensore-prossimita",
      icon: "📡",
      label: "Sensore di prossimità",
      active: true,
    },

    // 13. Microfono Chiamate
    {
      id: "microfono-chiamate",
      icon: "🎤",
      label: "Microfono chiamate",
      active: true,
    },

    // 14. Microfono Ambientale
    {
      id: "microfono-ambientale",
      icon: "🎙️",
      label: "Microfono ambientale",
      active: true,
    },

    // 15. Altoparlante Chiamata
    {
      id: "altoparlante-chiamata",
      icon: "🔉",
      label: "Altoparlante chiamata",
      active: true,
    },

    // 16. Speaker/Buzzer
    { id: "speaker-buzzer", icon: "🔔", label: "Speaker/buzzer", active: true },

    // 17. Vetro Fotocamera Posteriore
    {
      id: "vetro-fotocamera-posteriore",
      icon: "📸",
      label: "Vetro fotocamera posteriore",
      active: true,
    },

    // 18. Fotocamera Posteriore
    {
      id: "fotocamera-posteriore",
      icon: "📷",
      label: "Fotocamera posteriore",
      active: true,
    },

    // 19. Fotocamera Anteriore
    {
      id: "fotocamera-anteriore",
      icon: "🤳",
      label: "Fotocamera anteriore",
      active: true,
    },

    // 20. Tasto Home
    { id: "tasto-home", icon: "🏠", label: "Tasto home", active: true },

    // 21. Touch ID
    { id: "touch-id", icon: "👆", label: "Touch ID", active: true },

    // 22. Face ID
    { id: "face-id", icon: "😊", label: "Face ID", active: true },

    // 23. Wi-Fi
    { id: "wifi", icon: "📶", label: "Wi-Fi", active: true },

    // 24. Rete
    { id: "rete", icon: "📡", label: "Rete cellulare", active: true },

    // 25. Chiamata
    { id: "chiamata", icon: "📞", label: "Chiamata", active: true },

    // 26. Scheda Madre
    { id: "scheda-madre", icon: "💻", label: "Scheda madre", active: true },

    // 27. Vetro Posteriore
    {
      id: "vetro-posteriore",
      icon: "📳",
      label: "Vetro posteriore",
      active: true,
    },
  ]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);

  const navigate = useNavigate();

  // API URL
  const API_URL = import.meta.env.VITE_API_URL;

  // Nome azienda e utente (prelevati dalla sessionStorage se presenti)
  const companyName =
    sessionStorage.getItem("companyName") ||
    sessionStorage.getItem("CompanyName") ||
    "";

  // Aggiorna data e ora ogni secondo
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("it-IT");
      const time = now.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateTime({ date, time });

      // Imposta automaticamente la data di acquisto se vuota
      if (!acquistoData.dataAcquisto) {
        const formattedDate = now.toISOString().split("T")[0];
        setAcquistoData((prev) => ({ ...prev, dataAcquisto: formattedDate }));
      }
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [acquistoData.dataAcquisto]);

  // Funzione per la ricerca cliente con debouncing
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

  // Funzione per eseguire la ricerca cliente
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
        console.error("Errore nella ricerca");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per selezionare un cliente
  const onSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setSearchQuery(`${customer.nome} ${customer.cognome}`);
    setShowDropdown(false);

    setClienteData({
      email: customer.email || "",
      nome: customer.nome || "",
      cognome: customer.cognome || "",
      telefono: customer.telefono || "",
      cap: customer.cap || "",
      tipoDocumento: clienteData.tipoDocumento,
      numeroDocumento: clienteData.numeroDocumento,
    });
  };

  // Funzione per cancellare la selezione cliente
  const clearSelection = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setClienteData({
      email: "",
      nome: "",
      cognome: "",
      telefono: "",
      cap: "",
      tipoDocumento: "Patente",
      numeroDocumento: "",
    });
  };

  // Chiudi dropdown quando si clicca fuori
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle diagnostica
  const toggleDiagnosticItem = (id: string) => {
    setDiagnosticItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  // Salva nuovo cliente
  const handleSaveNewClient = async () => {
    // Validazione base
    if (!newClientData.cognome.trim() || !newClientData.nome.trim()) {
      alert("Nome e Cognome sono obbligatori");
      return;
    }

    if (!newClientData.email.trim()) {
      alert("Email è obbligatoria");
      return;
    }

    if (!newClientData.telefono.trim()) {
      alert("Telefono è obbligatorio");
      return;
    }

    setSavingNewClient(true);

    const multitenantId = sessionStorage.getItem("IdCompany");
    const token = sessionStorage.getItem("token");

    try {
      const customerPayload = {
        tipologia: newClientData.tipo, // Privato o Azienda
        ragioneSociale: `${newClientData.nome.trim()} ${newClientData.cognome.trim()}`,
        nome: newClientData.nome.trim(),
        cognome: newClientData.cognome.trim(),
        email: newClientData.email.trim(),
        telefono: newClientData.telefono.trim(),
        cap: newClientData.cap.trim(),
        indirizzo: newClientData.indirizzo.trim(),
        citta: newClientData.citta.trim(),
        provincia: newClientData.provincia.trim(),
        regione: newClientData.regione.trim(),
        fiscalCode: newClientData.codiceFiscale.trim(),
        pIva: newClientData.partitaIva.trim(),
        emailPec: newClientData.emailPec.trim(),
        codiceSdi: newClientData.codiceSdi.trim(),
        iban: newClientData.iban.trim(),
        multitenantId: multitenantId || "",
      };

      const response = await fetch(`${API_URL}/api/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(customerPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Errore HTTP: ${response.status}`);
      }

      const savedCustomer = await response.json();

      // Mappa la risposta del backend al formato CustomerData
      const newCustomer: CustomerData = {
        id: savedCustomer.id || savedCustomer.customerId || String(Date.now()),
        tipologia: savedCustomer.tipologia || newClientData.tipo,
        ragioneSociale:
          savedCustomer.ragioneSociale ||
          `${newClientData.nome} ${newClientData.cognome}`,
        nome: savedCustomer.nome || newClientData.nome,
        cognome: savedCustomer.cognome || newClientData.cognome,
        email: savedCustomer.email || newClientData.email,
        telefono: savedCustomer.telefono || newClientData.telefono,
        cap: savedCustomer.cap || newClientData.cap,
        indirizzo: savedCustomer.indirizzo || newClientData.indirizzo,
        citta: savedCustomer.citta || newClientData.citta,
        provincia: savedCustomer.provincia || newClientData.provincia,
        regione: savedCustomer.regione || newClientData.regione,
        fiscalCode: savedCustomer.fiscalCode || newClientData.codiceFiscale,
        pIva: savedCustomer.pIva || newClientData.partitaIva,
        emailPec: savedCustomer.emailPec || newClientData.emailPec,
        codiceSdi: savedCustomer.codiceSdi || newClientData.codiceSdi,
        iban: savedCustomer.iban || newClientData.iban,
      };

      // Seleziona automaticamente il nuovo cliente
      onSelectCustomer(newCustomer);

      // Chiudi modal e resetta form
      setShowNewClientModal(false);
      setNewClientData({
        tipo: "Privato",
        tipoCliente: "Cliente",
        cognome: "",
        nome: "",
        indirizzo: "",
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

      // Mostra messaggio di successo
      alert("Cliente salvato con successo!");
    } catch (error) {
      console.error("Errore durante il salvataggio del cliente:", error);
      alert(
        `Errore durante il salvataggio del cliente: ${
          error instanceof Error ? error.message : "Errore sconosciuto"
        }`
      );
    } finally {
      setSavingNewClient(false);
    }
  };

  // Validazione form
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Valida cliente
    if (!clienteData.nome.trim())
      errors.push("Il nome del cliente è obbligatorio");
    if (!clienteData.cognome.trim())
      errors.push("Il cognome del cliente è obbligatorio");
    if (!clienteData.email.trim())
      errors.push("L'email del cliente è obbligatoria");
    if (!clienteData.telefono.trim())
      errors.push("Il telefono del cliente è obbligatorio");
    if (!clienteData.numeroDocumento.trim())
      errors.push("Il numero di documento è obbligatorio");

    // Valida dispositivo
    if (!dispositivoData.serialNumber.trim())
      errors.push("Il numero seriale/IMEI è obbligatorio");
    if (!dispositivoData.model.trim())
      errors.push("Il modello del dispositivo è obbligatorio");
    if (!dispositivoData.colore.trim())
      errors.push("Il colore del dispositivo è obbligatorio");

    // Valida acquisto
    if (!acquistoData.prezzoTotale.trim())
      errors.push("Il prezzo totale è obbligatorio");

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Crea acquisto (chiamata API reale con fetch)
  const handleCreatePurchase = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Verifica che ci sia un cliente selezionato
    if (!selectedCustomer) {
      alert("Devi selezionare un cliente prima di procedere");
      return;
    }

    setIsCreatingPurchase(true);

    try {
      const token = sessionStorage.getItem("token");
      const multitenantId = sessionStorage.getItem("IdCompany");
      const idCompany = sessionStorage.getItem("IdCompany");

      if (!token || !multitenantId) {
        alert("Sessione scaduta. Effettua di nuovo il login.");
        setIsCreatingPurchase(false);
        return;
      }

      // Prepara i dati per il backend nel formato del model DevicePurchase
      const purchaseData = {
        // ==================== TIPO E CONDIZIONE ====================
        purchaseType: "Apparato",
        deviceCondition: "Usato",

        // ==================== IDENTIFICATIVI ====================
        CompanyId: idCompany,

        // ==================== DATI PRODOTTO ====================
        brand: dispositivoData.brand,
        model: dispositivoData.model,
        serialNumber: dispositivoData.serialNumber || null,
        imei: dispositivoData.serialNumber || null,

        // ==================== IDs RELAZIONALI ====================
        supplierId: selectedCustomer.id,

        // ==================== PREZZI ====================
        purchasePrice: parseFloat(acquistoData.prezzoTotale) || 0,
        shippingCost: 0,
        otherCosts: 0,
        vatRate: 22.0,
        totalAmount: parseFloat(acquistoData.prezzoTotale) || 0,

        // ==================== PAGAMENTO ====================
        paymentType: acquistoData.tipoPagamento,
        paymentStatus: "Da Pagare",
        paidAmount: 0,
        remainingAmount: parseFloat(acquistoData.prezzoTotale) || 0,
        installmentsCount: null,
        installmentAmount: null,

        // ==================== STATO ACQUISTO ====================
        purchaseStatus: "Bozza",
        purchaseStatusCode: "DRAFT",

        // ==================== DOCUMENTI FORNITORE ====================
        supplierInvoiceId: null,
        supplierInvoiceNumber: null,
        supplierInvoiceDate: null,
        orderNumber: null,
        orderDate: null,

        // ==================== DDT ====================
        ddtNumber: acquistoData.codScheda || null,
        ddtDate: acquistoData.dataAcquisto
          ? new Date(acquistoData.dataAcquisto).toISOString()
          : null,

        // ==================== ACQUIRENTE/RESPONSABILE ====================
        buyerCode: null,
        buyerName: `${selectedCustomer.nome} ${selectedCustomer.cognome}`,

        // ==================== NOTE E ACCESSORI ====================
        notes: `Acquisto da ${selectedCustomer.nome} ${selectedCustomer.cognome}. Documento: ${clienteData.tipoDocumento} n. ${clienteData.numeroDocumento}`,
        includedAccessories: null,

        // ==================== CONTROLLO QUALITÀ ====================
        qualityCheckStatus: "Da Verificare",
        qualityCheckNotes: null,
        qualityCheckDate: null,
        qualityCheckedBy: null,

        // ==================== GARANZIA FORNITORE ====================
        hasSupplierWarranty: false,
        supplierWarrantyMonths: null,
        supplierWarrantyExpiryDate: null,

        // ==================== DATE ====================
        purchaseDate: acquistoData.dataAcquisto
          ? new Date(acquistoData.dataAcquisto).toISOString()
          : new Date().toISOString(),
        receivedDate: null,
      };

      console.log(
        "Invio dati acquisto:",
        JSON.stringify(purchaseData, null, 2)
      );

      // Chiamata API con fetch
      const response = await fetch(`${API_URL}/api/Purchase`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Multitenant-Id": multitenantId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            errorData?.title ||
            `Errore ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Acquisto creato con successo:", data);

      // ============ NUOVA LOGICA: PASSA IN MODALITÀ EDIT ============
      setIsEditMode(true);
      setCurrentPurchaseId(data.purchaseId); // Salva l'ID per gli aggiornamenti
      setCurrentPurchaseCode(data.purchaseCode); // Salva il codice per visualizzazione

      alert(`Acquisto usato creato con successo! Codice: ${data.purchaseCode}`);

      // ============ NON RESETTARE PIÙ IL FORM ============
      // COMMENTA O RIMUOVI QUESTE RIGHE:
      /*
    setSelectedCustomer(null);
    setClienteData({
      email: "",
      nome: "",
      cognome: "",
      telefono: "",
      cap: "",
      tipoDocumento: "Patente",
      numeroDocumento: "",
    });
    setDispositivoData({
      serialNumber: "",
      brand: "Apple",
      model: "",
      deviceType: "iPhone",
      colore: "",
      memoria: "512 GB",
    });
    setAcquistoData({
      dataAcquisto: "",
      codScheda: "",
      prezzoTotale: "",
      tipoPagamento: "Bonifico",
    });
    setDiagnosticItems((prev) =>
      prev.map((item) => ({ ...item, active: true }))
    );
    */
    } catch (error) {
      console.error("Errore durante la creazione dell'acquisto:", error);

      let errorMessage = "Errore durante la creazione dell'acquisto";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsCreatingPurchase(false);
    }
  };

  const handleUpdatePurchase = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!selectedCustomer || !currentPurchaseId) {
      alert("Errore: dati mancanti per l'aggiornamento");
      return;
    }

    setIsCreatingPurchase(true);

    try {
      const token = sessionStorage.getItem("token");
      const multitenantId = sessionStorage.getItem("IdCompany");

      if (!token || !multitenantId) {
        alert("Sessione scaduta. Effettua di nuovo il login.");
        setIsCreatingPurchase(false);
        return;
      }

      // Prepara i dati per l'update (stessa struttura ma senza i campi read-only)
      const updateData = {
        // ==================== TIPO E CONDIZIONE ====================
        purchaseType: "Apparato",
        deviceCondition: "Usato",

        // ==================== DATI PRODOTTO ====================
        brand: dispositivoData.brand,
        model: dispositivoData.model,
        serialNumber: dispositivoData.serialNumber || null,
        imei: dispositivoData.serialNumber || null,

        // ==================== IDs RELAZIONALI ====================
        supplierId: selectedCustomer.id,

        // ==================== PREZZI ====================
        purchasePrice: parseFloat(acquistoData.prezzoTotale) || 0,
        shippingCost: 0,
        otherCosts: 0,
        vatRate: 22.0,
        totalAmount: parseFloat(acquistoData.prezzoTotale) || 0,

        // ==================== PAGAMENTO ====================
        paymentType: acquistoData.tipoPagamento,
        paymentStatus: "Da Pagare",
        paidAmount: 0,
        remainingAmount: parseFloat(acquistoData.prezzoTotale) || 0,
        installmentsCount: null,
        installmentAmount: null,

        // ==================== STATO ACQUISTO ====================
        purchaseStatus: "Bozza",
        purchaseStatusCode: "DRAFT",

        // ==================== DOCUMENTI FORNITORE ====================
        supplierInvoiceNumber: null,
        supplierInvoiceDate: null,
        orderNumber: null,
        orderDate: null,

        // ==================== DDT ====================
        ddtNumber: acquistoData.codScheda || null,
        ddtDate: acquistoData.dataAcquisto
          ? new Date(acquistoData.dataAcquisto).toISOString()
          : null,

        // ==================== ACQUIRENTE/RESPONSABILE ====================
        buyerCode: null,
        buyerName: `${selectedCustomer.nome} ${selectedCustomer.cognome}`,

        // ==================== NOTE E ACCESSORI ====================
        notes: `Acquisto da ${selectedCustomer.nome} ${selectedCustomer.cognome}. Documento: ${clienteData.tipoDocumento} n. ${clienteData.numeroDocumento}`,
        includedAccessories: null,

        // ==================== CONTROLLO QUALITÀ ====================
        qualityCheckStatus: "Da Verificare",
        qualityCheckNotes: null,
        qualityCheckDate: null,
        qualityCheckedBy: null,

        // ==================== GARANZIA FORNITORE ====================
        hasSupplierWarranty: false,
        supplierWarrantyMonths: null,
        supplierWarrantyExpiryDate: null,

        // ==================== DATE ====================
        purchaseDate: acquistoData.dataAcquisto
          ? new Date(acquistoData.dataAcquisto).toISOString()
          : new Date().toISOString(),
        receivedDate: null,
      };

      console.log(
        "Invio dati aggiornamento:",
        JSON.stringify(updateData, null, 2)
      );

      // Chiamata API PUT per l'update
      const response = await fetch(
        `${API_URL}/api/Purchase/${currentPurchaseId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Multitenant-Id": multitenantId,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            errorData?.title ||
            `Errore ${response.status}: ${response.statusText}`
        );
      }

      console.log("Acquisto aggiornato con successo");
      alert(`Acquisto ${currentPurchaseCode} aggiornato con successo!`);
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'acquisto:", error);

      let errorMessage = "Errore durante l'aggiornamento dell'acquisto";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsCreatingPurchase(false);
    }
  };

  // ============ AGGIUNGI QUESTA FUNZIONE PER NUOVO ACQUISTO ============
  const handleNewPurchase = () => {
    setIsEditMode(false);
    setCurrentPurchaseId(null);
    setCurrentPurchaseCode(null);

    setSelectedCustomer(null);
    setClienteData({
      email: "",
      nome: "",
      cognome: "",
      telefono: "",
      cap: "",
      tipoDocumento: "Patente",
      numeroDocumento: "",
    });
    setDispositivoData({
      serialNumber: "",
      brand: "Apple",
      model: "",
      deviceType: "iPhone",
      colore: "",
      memoria: "512 GB",
    });
    setAcquistoData({
      dataAcquisto: "",
      codScheda: "",
      prezzoTotale: "",
      tipoPagamento: "Bonifico",
    });
    setDiagnosticItems((prev) =>
      prev.map((item) => ({ ...item, active: true }))
    );
  };

  // ============ AGGIUNGI QUESTA FUNZIONE PER LA STAMPA ============
  // ============ FUNZIONI PER LA GESTIONE DELLA FIRMA DIGITALE ============
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);

    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    // Converti il canvas in base64
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureData(dataUrl);
    setShowSignatureModal(false);

    alert("✅ Firma acquisita con successo!");
  };

  const openSignatureModal = () => {
    setShowSignatureModal(true);

    // Inizializza il canvas dopo che il modal è stato renderizzato
    setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Imposta lo sfondo bianco
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 100);
  };

  const handlePrintReceipt = () => {
    if (isEditMode && currentPurchaseId) {
      setShowPurchaseReceipt(true);
    } else {
      alert("Salva prima l'acquisto per stampare la ricevuta");
    }
  };

  // Genera codice scheda automatico (MOCK)
  useEffect(() => {
    if (!acquistoData.codScheda) {
      const codiceGenerato = `ACQ-${Date.now().toString().slice(-6)}`;
      setAcquistoData((prev) => ({ ...prev, codScheda: codiceGenerato }));
    }
  }, [acquistoData.codScheda]);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />

      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.pageBody}>
          {/* Header con Breadcrumb */}
          <div className={styles.schedaHeader}>
            <div className={styles.leftBlock}>
              <button
                className={styles.roundBtn}
                onClick={() => navigate("/acquisti")}
                title="Torna indietro"
              >
                <span className={styles.plusIcon}>←</span>
              </button>
              <div className={styles.breadcrumb}>
                <span className={styles.breadcrumbItem}>
                  {companyName || "Azienda"}
                </span>
                <span className={styles.breadcrumbSeparator}>→</span>
                <span>Crea Acquisto Usato</span>
              </div>
            </div>
          </div>

          {/* Container Form */}
          <div className={styles.repairFormContainer}>
            {/* Titolo Pagina */}
            <div className={styles.pageTitle}>
              <h1>Crea Acquisto Usato</h1>
              <p>
                Data e ora acquisizione: {dateTime.date} - {dateTime.time}
              </p>
            </div>

            {/* Errori di validazione */}
            {validationErrors.length > 0 && (
              <div className={styles.validationErrorsContainer}>
                <h4>⚠️ Correggi i seguenti errori:</h4>
                <ul className={styles.validationErrorsList}>
                  {validationErrors.map((error, index) => (
                    <li key={index} className={styles.validationError}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Layout principale */}
            <div className={styles.pageContainer}>
              {/* COLONNA SINISTRA */}
              <div className={styles.leftColumn}>
                {/* Sezione Cliente */}
                <div className={styles.topRow}>
                  <div className={styles.formSection}>
                    <h3>Cliente</h3>

                    <div className={styles.formGroup}>
                      <label>Cerca Cliente esistente</label>
                      <div className={styles.searchContainer}>
                        <input
                          ref={searchInputRef}
                          type="text"
                          className={`${styles.formControl} ${styles.searchInput}`}
                          placeholder="Cerca per nome, email o telefono..."
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        <button
                          className={styles.addClientButton}
                          onClick={() => setShowNewClientModal(true)}
                          title="Aggiungi nuovo cliente"
                        >
                          +
                        </button>
                        {searchQuery && (
                          <button
                            className={styles.clearButton}
                            onClick={clearSelection}
                            title="Cancella ricerca"
                          >
                            ×
                          </button>
                        )}
                        {loading && (
                          <div className={styles.loadingIndicator}>
                            <div className={styles.spinner}></div>
                          </div>
                        )}

                        {/* Dropdown risultati ricerca */}
                        {showDropdown && searchResults.length > 0 && (
                          <div ref={dropdownRef} className={styles.dropdown}>
                            {searchResults.map((customer) => (
                              <div
                                key={customer.id}
                                className={styles.dropdownItem}
                                onClick={() => onSelectCustomer(customer)}
                              >
                                <div className={styles.customerInfo}>
                                  <div className={styles.customerName}>
                                    {customer.nome} {customer.cognome}
                                  </div>
                                  <div className={styles.customerDetails}>
                                    {customer.email} - {customer.telefono}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>E-Mail</label>
                      <input
                        type="email"
                        className={styles.formControl}
                        value={clienteData.email}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Nome</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={clienteData.nome}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            nome: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Cognome</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={clienteData.cognome}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            cognome: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Telefono</label>
                      <input
                        type="tel"
                        className={styles.formControl}
                        value={clienteData.telefono}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            telefono: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Cap</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={clienteData.cap}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            cap: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Tipo di Documento</label>
                      <select
                        className={styles.formControl}
                        value={clienteData.tipoDocumento}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            tipoDocumento: e.target.value as TipoDocumento,
                          })
                        }
                      >
                        {tipoDocumentoOptions.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Documento N.</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={clienteData.numeroDocumento}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            numeroDocumento: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Sezione Dispositivo */}
                  <div className={styles.formSection}>
                    <h3>Dispositivo</h3>

                    <div className={styles.formGroup}>
                      <label>Numero di seriale/IMEI</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        value={dispositivoData.serialNumber}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            serialNumber: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Dispositivo</label>
                      <select
                        className={styles.formControl}
                        value={dispositivoData.deviceType}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            deviceType: e.target.value,
                          })
                        }
                      >
                        {deviceTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Modello</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        placeholder="es. 14 Pro"
                        value={dispositivoData.model}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            model: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Colore</label>
                      <input
                        type="text"
                        className={styles.formControl}
                        placeholder="es. Deep Purple"
                        value={dispositivoData.colore}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            colore: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Memoria</label>
                      <select
                        className={styles.formControl}
                        value={dispositivoData.memoria}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            memoria: e.target.value,
                          })
                        }
                      >
                        {memoriaOptions.map((memoria) => (
                          <option key={memoria} value={memoria}>
                            {memoria}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sezione Diagnostica */}
                <div className={styles.formSection}>
                  <h3>Diagnostica di ricezione</h3>
                  <div className={styles.diagnosticaGrid}>
                    {diagnosticItems.map((item) => (
                      <div
                        key={item.id}
                        className={styles.diagnosticaItemWrapper}
                      >
                        <div
                          className={`${styles.diagnosticaItem} ${
                            item.active ? styles.active : styles.inactive
                          }`}
                          onClick={() => toggleDiagnosticItem(item.id)}
                        >
                          <span className={styles.diagnosticaIcon}>
                            {item.icon}
                          </span>
                        </div>
                        <div className={styles.diagnosticaLabel}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLONNA DESTRA */}
              <div className={styles.rightColumn}>
                {/* Sezione Prezzo di acquisto */}
                <div className={styles.formSection}>
                  <h3>Prezzo di acquisto</h3>

                  <div className={styles.formGroup}>
                    <label>Data e ora di acquisto</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={`${dateTime.date} ${dateTime.time}`}
                      readOnly
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Cod. scheda</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      value={acquistoData.codScheda}
                      readOnly
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Prezzo Totale</label>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="1299.00 Eur"
                      value={acquistoData.prezzoTotale}
                      onChange={(e) =>
                        setAcquistoData({
                          ...acquistoData,
                          prezzoTotale: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo di Pagamento</label>
                    <select
                      className={styles.formControl}
                      value={acquistoData.tipoPagamento}
                      onChange={(e) =>
                        setAcquistoData({
                          ...acquistoData,
                          tipoPagamento: e.target.value,
                        })
                      }
                    >
                      {tipoPagamentoOptions.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottoni azione */}
            <div className={styles.formActions}>
              {!isEditMode ? (
                // ============ MODALITÀ CREAZIONE ============
                <>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={handleNewPurchase}
                    disabled={isCreatingPurchase}
                  >
                    Annulla
                  </button>

                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleCreatePurchase}
                    disabled={isCreatingPurchase || !selectedCustomer}
                  >
                    {isCreatingPurchase
                      ? "Creazione in corso..."
                      : "Crea/Invia E-Mail"}
                  </button>

                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={true}
                  >
                    Crea/Stampa Ricevuta
                  </button>
                </>
              ) : (
                // ============ MODALITÀ MODIFICA ============
                <>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={handleNewPurchase}
                    disabled={isCreatingPurchase}
                  >
                    Nuovo Acquisto
                  </button>

                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleUpdatePurchase}
                    disabled={isCreatingPurchase || !selectedCustomer}
                  >
                    {isCreatingPurchase ? "Aggiornamento..." : "Aggiorna"}
                  </button>

                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handlePrintReceipt}
                    disabled={isCreatingPurchase}
                  >
                    Stampa Ricevuta
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <BottomBar />
      </div>

      {/* Modal Nuovo Cliente */}
      {showNewClientModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>Aggiungi Nuovo Cliente</h4>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowNewClientModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.customerForm}>
                {/* Riga 1: Tipo e Tipo Cliente */}
                <div className={styles.formRow}>
                  <div className={styles.formCol4}>
                    <label>Tipo</label>
                    <select
                      className={styles.formControl}
                      value={newClientData.tipo}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          tipo: e.target.value,
                        })
                      }
                    >
                      <option value="Privato">Privato</option>
                      <option value="Azienda">Azienda</option>
                    </select>
                  </div>
                  <div className={styles.formCol8}>
                    <label>Tipo Cliente</label>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={newClientData.tipoCliente === "Cliente"}
                          onChange={(e) =>
                            setNewClientData({
                              ...newClientData,
                              tipoCliente: e.target.checked
                                ? "Cliente"
                                : "Fornitore",
                            })
                          }
                        />
                        <span>Cliente</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={newClientData.tipoCliente === "Fornitore"}
                          onChange={(e) =>
                            setNewClientData({
                              ...newClientData,
                              tipoCliente: e.target.checked
                                ? "Fornitore"
                                : "Cliente",
                            })
                          }
                        />
                        <span>Fornitore</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Riga 2: Cognome, Nome, Indirizzo */}
                <div className={styles.formRow}>
                  <div className={styles.formCol4}>
                    <label>Cognome</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.cognome}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          cognome: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol4}>
                    <label>Nome</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.nome}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          nome: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol4}>
                    <label>Indirizzo</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.indirizzo}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          indirizzo: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Riga 3: CAP, Regione, Provincia */}
                <div className={styles.formRow}>
                  <div className={styles.formCol4}>
                    <label>CAP</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.cap}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          cap: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol4}>
                    <label>Regione</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.regione}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          regione: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol4}>
                    <label>Provincia</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.provincia}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          provincia: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Riga 4: Città */}
                <div className={styles.formRow}>
                  <div className={styles.formCol12}>
                    <label>Città</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.citta}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          citta: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Riga 5: Telefono, Email, Codice Fiscale */}
                <div className={styles.formRow}>
                  <div className={styles.formCol4}>
                    <label>Telefono</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.telefono}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          telefono: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol4}>
                    <label>Email</label>
                    <input
                      className={styles.formControl}
                      type="email"
                      value={newClientData.email}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol4}>
                    <label>Codice Fiscale</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.codiceFiscale}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          codiceFiscale: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Riga 6: Partita IVA */}
                <div className={styles.formRow}>
                  <div className={styles.formCol12}>
                    <label>Partita IVA</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.partitaIva}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          partitaIva: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Riga 7: Email PEC, Codice SDI, IBAN */}
                <div className={styles.formRow}>
                  <div className={styles.formCol4}>
                    <label>Email PEC</label>
                    <input
                      className={styles.formControl}
                      type="email"
                      value={newClientData.emailPec}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          emailPec: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol4}>
                    <label>Codice SDI</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.codiceSdi}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          codiceSdi: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.formCol4}>
                    <label>IBAN</label>
                    <input
                      className={styles.formControl}
                      value={newClientData.iban}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          iban: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowNewClientModal(false)}
              >
                ANNULLA
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSaveNewClient}
                disabled={savingNewClient}
              >
                {savingNewClient ? "Salvando..." : "SALVA CLIENTE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL RICEVUTA ACQUISTO ============ */}
      {showPurchaseReceipt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalReceiptLarge}>
            <div className={styles.modalHeader}>
              <h2>Ricevuta Acquisto Dispositivo Usato</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowPurchaseReceipt(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className="accSheet">
                {/* Header professionale con logo */}
                <div className="accHeaderPro">
                  {/* Colonna sinistra - Dati azienda */}
                  <div className="accLogoSection">
                    <div className="accLogo">
                      <div style={{ 
                        fontSize: '28px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ 
                          background: '#2c3e50',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          CLINICA <span style={{ fontSize: '32px' }}>📱</span> iPHONE
                        </span>
                      </div>
                    </div>
                    <div className="accCompanyTagline">ASSISTENZA TECNICA</div>

                    <div className="accCompanyDetails">
                      <div>CLINICA iPHONE STORE</div>
                      <div>Città - AZIENDA</div>
                      <div>Via Prova 1 – 73100 Lecce (LE)</div>
                      <div>Tel. 0832 123456</div>
                      <div>P.IVA 01234567890</div>
                    </div>
                  </div>

                  {/* Colonna destra - Documento */}
                  <div className="accDocSection">
                    <h1 className="accDocTitle">RICEVUTA ACQUISTO USATO</h1>
                    <div className="accDocInfo">
                      <div>
                        <strong>Tipo di operazione:</strong> Acquisto dispositivo usato
                      </div>
                      <div>
                        <strong>Codice Acquisto:</strong> {currentPurchaseCode || 'N/A'}
                      </div>
                      <div>
                        <strong>Data:</strong> {acquistoData.dataAcquisto || new Date().toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="accDivider" />

                {/* Dati venditore / dispositivo */}
                <div className="accInfoGrid">
                  <div className="accInfoSection">
                    <div className="accSectionTitle">DATI VENDITORE</div>
                    <div className="accInfoRows">
                      <div className="accInfoRow">
                        <span className="accLabel">Nome e Cognome:</span>
                        <span className="accValue">{clienteData.nome} {clienteData.cognome}</span>
                      </div>
                      <div className="accInfoRow">
                        <span className="accLabel">Email:</span>
                        <span className="accValue">{clienteData.email || 'Non specificato'}</span>
                      </div>
                      <div className="accInfoRow">
                        <span className="accLabel">Telefono:</span>
                        <span className="accValue">{clienteData.telefono || 'Non specificato'}</span>
                      </div>
                      <div className="accInfoRow">
                        <span className="accLabel">CAP:</span>
                        <span className="accValue">{clienteData.cap || 'Non specificato'}</span>
                      </div>
                      <div className="accInfoRow">
                        <span className="accLabel">Documento:</span>
                        <span className="accValue">{clienteData.tipoDocumento} - {clienteData.numeroDocumento}</span>
                      </div>
                    </div>
                  </div>

                  <div className="accInfoSection">
                    <div className="accSectionTitle">DATI DEL DISPOSITIVO</div>
                    <div className="accInfoRows">
                      <div className="accInfoRow">
                        <span className="accLabel">Tipo:</span>
                        <span className="accValue">{dispositivoData.deviceType}</span>
                      </div>
                      <div className="accInfoRow">
                        <span className="accLabel">Marca e Modello:</span>
                        <span className="accValue">{dispositivoData.brand} {dispositivoData.model}</span>
                      </div>
                      <div className="accInfoRow">
                        <span className="accLabel">Serial Number:</span>
                        <span className="accValue">{dispositivoData.serialNumber || 'Non specificato'}</span>
                      </div>
                      <div className="accInfoRow">
                        <span className="accLabel">Colore:</span>
                        <span className="accValue">{dispositivoData.colore || 'Non specificato'}</span>
                      </div>
                      <div className="accInfoRow">
                        <span className="accLabel">Memoria:</span>
                        <span className="accValue">{dispositivoData.memoria}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabella pagamento */}
                <div className="accTableSection">
                  <div className="accSectionTitle">DETTAGLI PAGAMENTO</div>
                  <table className="accTable">
                    <thead>
                      <tr>
                        <th className="accTableHeader">Metodo di Pagamento</th>
                        <th className="accTableHeader" style={{ width: '80px', textAlign: 'center' }}>Q.tà</th>
                        <th className="accTableHeader" style={{ width: '120px', textAlign: 'right' }}>Importo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="accTableCell">{acquistoData.tipoPagamento}</td>
                        <td className="accTableCell" style={{ textAlign: 'center' }}>1</td>
                        <td className="accTableCell" style={{ textAlign: 'right' }}>€ {acquistoData.prezzoTotale || '0.00'}</td>
                      </tr>
                      <tr>
                        <td className="accTableCell" colSpan={2}><strong>TOTALE</strong></td>
                        <td className="accTableCell" style={{ textAlign: 'right' }}>
                          <strong>€ {acquistoData.prezzoTotale || '0.00'}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Clausole */}
                <div className="accPrivacySection">
                  <div className="accPrivacyTitle">DICHIARAZIONI E CLAUSOLE</div>
                  <div className="accPrivacyText">
                    <p>
                      <strong>1. DICHIARAZIONE DI PROVENIENZA LECITA:</strong> Il venditore dichiara espressamente che il dispositivo oggetto della presente vendita è di sua legittima proprietà, non proviene da attività illecite, furti o ricettazione ed è libero da vincoli, gravami o diritti di terzi. Il venditore si assume ogni responsabilità civile e penale in merito alla provenienza del dispositivo.
                    </p>
                    <p>
                      <strong>2. TRATTAMENTO DATI PERSONALI (GDPR 679/2016):</strong> Il venditore dichiara di aver preso visione dell'informativa privacy e di acconsentire al trattamento dei propri dati personali per le finalità connesse all'operazione di acquisto, in conformità al Regolamento UE 2016/679 (GDPR). I dati saranno conservati per il tempo necessario agli adempimenti fiscali e contabili di legge.
                    </p>
                    <p>
                      <strong>3. CANCELLAZIONE DATI DAL DISPOSITIVO:</strong> Il venditore dichiara di aver provveduto alla cancellazione di tutti i dati personali presenti sul dispositivo e di aver disattivato eventuali blocchi di attivazione (es. Find My iPhone, Google Account, Samsung Account, ecc.). CLINICA iPHONE non sarà responsabile per eventuali dati residui presenti sul dispositivo.
                    </p>
                    <p>
                      <strong>4. CONDIZIONI DEL DISPOSITIVO:</strong> Il dispositivo viene acquistato nello stato in cui si trova ("as is"). L'acquirente ha provveduto a verificare le condizioni estetiche e funzionali del dispositivo prima della conclusione della transazione. Il prezzo concordato tiene conto dello stato d'uso e di eventuali difetti riscontrati.
                    </p>
                    <p>
                      <strong>5. NORMATIVA ANTIRICICLAGGIO:</strong> Ai sensi del D.Lgs. 231/2007 e successive modifiche, per operazioni di importo superiore a € 3.000,00 è stata acquisita copia del documento di identità del venditore agli atti della società.
                    </p>
                  </div>

                  <div className="accConsentSection">
                    <div className="accConsentTitle">RICEVUTA DI ACQUISTO</div>
                    <div className="accSignatureArea">
                      <div className="accSignatureBox">
                        <div className="accSignatureLabel">Firma del Venditore</div>
                        <div 
                          className="accSignatureLine"
                          onClick={openSignatureModal}
                          style={{
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {signatureData ? (
                            <img
                              src={signatureData}
                              alt="Firma"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <div style={{ 
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: '#95a5a6',
                              fontSize: '0.85rem',
                              textAlign: 'center',
                              width: '100%'
                            }}>
                              ✍️ Clicca qui per firmare
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="accDateBox">
                        <div className="accDateLabel">
                          Data: {new Date().toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="accFooter">
                  <div className="accFooterText">
                    Documento generato automaticamente dal sistema di gestione - CLINICA iPHONE STORE
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowPurchaseReceipt(false)}
              >
                CHIUDI
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  const printContent = document.querySelector('.accSheet');
                  if (!printContent) return;
                  
                  const printWindow = window.open('', '_blank', 'width=800,height=600');
                  if (!printWindow) return;
                  
                  const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                    .map(link => `<link rel="stylesheet" href="${(link as HTMLLinkElement).href}">`)
                    .join('');
                  
                  const cssStyles = Array.from(document.querySelectorAll('style'))
                    .map(style => style.outerHTML)
                    .join('');
                  
                  const printHTML = `
                    <!DOCTYPE html>
                    <html lang="it">
                    <head>
                      <meta charset="UTF-8">
                      <title>Ricevuta Acquisto - ${currentPurchaseCode || 'N/A'}</title>
                      ${cssLinks}
                      ${cssStyles}
                      <style>
                        @media print {
                          * { visibility: hidden !important; box-sizing: border-box !important; }
                          .print-content, .print-content * { visibility: visible !important; }
                          .print-content {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 5mm !important;
                          }
                          @page { size: A4 portrait; margin: 10mm 8mm; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="print-content">
                        ${printContent.innerHTML}
                      </div>
                      <script>
                        window.onload = function() {
                          setTimeout(() => {
                            window.print();
                            setTimeout(() => window.close(), 1000);
                          }, 500);
                        };
                      </script>
                    </body>
                    </html>
                  `;
                  
                  printWindow.document.write(printHTML);
                  printWindow.document.close();
                }}
              >
                🖨️ STAMPA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL FIRMA DIGITALE ============ */}
      {showSignatureModal && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSignatureModal(false);
            }
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
          >
            <div className={styles.modalHeader}>
              <h4>✍️ Apponi la tua firma</h4>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowSignatureModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div
                style={{
                  padding: "12px 16px",
                  background: "#e7f3ff",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "0.9rem",
                  color: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>ℹ️</span>
                <span>
                  Firma nell'area sottostante utilizzando il mouse o il touch screen
                </span>
              </div>

              <div
                style={{
                  border: "2px solid #333",
                  borderRadius: "8px",
                  background: "white",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <canvas
                  ref={signatureCanvasRef}
                  width={600}
                  height={250}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    cursor: "crosshair",
                    touchAction: "none",
                  }}
                />

                {/* Watermark quando vuoto */}
                {!isDrawing && !signatureData && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      color: "#ccc",
                      fontSize: "1.2rem",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    Firma qui
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={clearSignature}
              >
                🗑️ Cancella
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={saveSignature}
              >
                ✅ Salva Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcquistoUsato;