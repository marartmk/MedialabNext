import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { ArrowLeft } from "lucide-react";
import "./modifica-styles.css";

import {
  searchPartsQuick,
  type PartSearchItem,
} from "@/services/warehouseService";
// Tipi per i dati
interface DiagnosticItem {
  id: string;
  icon: string;
  label: string;
  active: boolean;
}

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  region: string;
  fiscalCode: string;
  vatNumber: string;
  customerType: string;

  // Campi opzionali per retrocompatibilità
  ragioneSociale?: string;
  nome?: string;
  cognome?: string;
  telefono?: string;
  cap?: string;
  pIva?: string;
  tipologia?: string;
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

interface RepairData {
  id: number;
  repairId: string;
  repairGuid: string;
  repairCode: string;
  deviceId: string;
  customerId?: string;
  companyId: string;
  multitenantId: string;
  faultDeclared: string;
  faultDetected?: string;
  repairAction?: string;
  repairStatusCode: string;
  repairStatus: string;
  technicianCode?: string;
  technicianName?: string;
  createdAt: string;
  receivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  notes?: string;
  estimatedPrice?: number;
  paymentType?: string;
  billingInfo?: string;
  unlockCode?: string;
  courtesyPhone?: string;
  device?: DeviceData;
  customer?: CustomerData;
}

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  codiceDipendente?: string;
  internalCode?: string;
  email?: string;
  phoneNumber?: string;
}

interface RepairPartLine {
  tempId: string;
  dbId?: number;
  warehouseItemId: number; // id numerico della riga di magazzino
  itemId: string; // GUID dell’articolo
  code: string;
  name: string; // es. "Display (Samsung S20)"
  qty: number; // quantità usata nella riparazione
  unitPrice: number;
  lineTotal: number; // qty * unitPrice
  stock: number; // giacenza disponibile al momento dell'aggiunta
}

const Modifica: React.FC = () => {
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<"open" | "closed">("open");

  const [companyName, setCompanyName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const location = useLocation();
  const [search] = useSearchParams();

  const API_URL = import.meta.env.VITE_API_URL;

  const navState = (location.state || {}) as {
    repairGuid?: string; // GUID
    id?: number; // id numerico tabella DeviceRepairs
    repairCode?: string;
  };

  const repairGuid = navState.repairGuid || search.get("rid") || "";
  const numericId = navState.id ?? Number(search.get("id") || 0);

  // Dati pagamento
  const [paymentData, setPaymentData] = useState<{
    id?: number;
    partsAmount: number;
    laborAmount: number;
    vatAmount: number;
    totalAmount: number;
    notes: string;
  } | null>(null);

  const [paymentLoading, setPaymentLoading] = useState(false);

  // Modalità diagnostica corrente
  const [diagnosticMode, setDiagnosticMode] = useState<"incoming" | "exit">(
    "incoming"
  );

  // Stato riparazione (code + label) — valore iniziale dal dato caricato
  const [repairStatusCode, setRepairStatusCode] = useState<string>("");

  // mappa codice↔︎label (riusa queste chiavi anche per il BE)
  const REPAIR_STATUS = [
    { code: "RECEIVED", label: "📥 Ricevuto" },
    { code: "PENDING", label: "⏳ In Attesa" },
    { code: "IN_PROGRESS", label: "🔧 In Lavorazione" },
    { code: "COMPLETED", label: "✅ Completato" },
    { code: "DELIVERED", label: "📦 Consegnato" },
    { code: "CANCELLED", label: "❌ Annullato" },
  ];

  // Ricerca ricambi + righe utilizzate
  const [partsQuery, setPartsQuery] = useState("");
  const [partsResults, setPartsResults] = useState<PartSearchItem[]>([]);
  const [partsSearching, setPartsSearching] = useState(false);
  const [usedParts, setUsedParts] = useState<RepairPartLine[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  // Totale ricambi
  const partsTotal = useMemo(
    () =>
      usedParts.reduce((s, l) => s + (l.lineTotal ?? l.qty * l.unitPrice), 0),
    [usedParts]
  );

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  // Stati per i dati della riparazione
  const [repairData, setRepairData] = useState<RepairData | null>(null);
  const [loadingRepairData, setLoadingRepairData] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Stati per il cliente
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );
  const [clienteData, setClienteData] = useState({
    email: "",
    nome: "",
    cognome: "",
    telefono: "",
    cap: "",
  });

  // Stati per il dispositivo
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [dispositivoData, setDispositivoData] = useState({
    serialNumber: "",
    brand: "",
    model: "",
    deviceType: "Mobile",
    color: "",
    unlockCode: "",
    courtesyPhone: "",
  });

  // Stati per la riparazione
  const [repairFormData, setRepairFormData] = useState({
    faultDeclared: "",
    repairAction: "",
    technicianCode: "",
    technicianName: "",
    estimatedPrice: 0,
    paymentType: "",
    billingInfo: "",
    unlockCode: "",
    courtesyPhone: "",
  });

  // Altri stati
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null
  );
  const [repairComponent, setRepairComponent] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Stati per la diagnostica
  // Stati per la diagnostica - LISTA COMPLETA 1:1 CON IL BACKEND
  const [diagnosticItems] = useState<DiagnosticItem[]>([
    // 1. Telefono Spento
    {
      id: "telefono-spento",
      icon: "📴",
      label: "Telefono spento",
      active: false,
    },

    // 2. Vetro Rotto
    { id: "vetro-rotto", icon: "🔨", label: "Vetro rotto", active: false },

    // 3. Touchscreen
    { id: "touchscreen", icon: "👆", label: "Touchscreen", active: true },

    // 4. LCD
    { id: "lcd", icon: "📱", label: "LCD", active: true },

    // 5. Frame Scollato
    {
      id: "frame-scollato",
      icon: "🔲",
      label: "Frame scollato",
      active: false,
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
      icon: "⏻",
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
      icon: "🔳",
      label: "Vetro posteriore",
      active: true,
    },
  ]);

  // Manteniamo due copie indipendenti degli item
  const [incomingDiagnosticItems, setIncomingDiagnosticItems] = useState<
    DiagnosticItem[]
  >([
    ...diagnosticItems, // clone iniziale
  ]);
  const [exitDiagnosticItems, setExitDiagnosticItems] = useState<
    DiagnosticItem[]
  >(diagnosticItems.map((i) => ({ ...i, active: false })));

  // 🆕 Logica "Telefono Spento" per entrambe le modalità
  const isPhoneOffIncoming = !(
    incomingDiagnosticItems.find((x) => x.id === "telefono-spento")?.active ??
    false
  );

  const isPhoneOffExit = !(
    exitDiagnosticItems.find((x) => x.id === "telefono-spento")?.active ?? false
  );

  // Determina quale usare in base alla modalità corrente
  const isPhoneOff =
    diagnosticMode === "incoming" ? isPhoneOffIncoming : isPhoneOffExit;

  const deviceTypes = [
    { value: "Mobile", label: "📱 Mobile" },
    { value: "TV", label: "📺 TV" },
    { value: "Other", label: "🔧 Altro" },
  ];

  // Manodopera
  const [laborAmount, setLaborAmount] = useState<number>(0);

  // Subtotale ricambi + manodopera
  const subTotal = useMemo(
    () => partsTotal + laborAmount,
    [partsTotal, laborAmount]
  );
  // IVA 22% su (ricambi + manodopera)
  const vatAmount = useMemo(
    () => Math.round((subTotal * 0.22 + Number.EPSILON) * 100) / 100,
    [subTotal]
  );

  // 🆕 Stati per il modal di modifica cliente
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState({
    tipo: "Privato",
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
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Totale IVA inclusa
  // const finalTotal = useMemo(
  //   () => Math.round((subTotal + vatAmount + Number.EPSILON) * 100) / 100,
  //   [subTotal, vatAmount]
  // );

  useEffect(() => {
    if (numericId > 0) {
      loadRepairData(String(numericId));
      loadOperators();
    }
  }, [numericId]);

  useEffect(() => {
    const company = sessionStorage.getItem("fullName") || "Azienda";
    const user = sessionStorage.getItem("userId") || "Utente";
    setCompanyName(company);
    setUserName(user);
  }, []);

  useEffect(() => {
    // 🔥 MODIFICA: Non ricalcolare se stiamo caricando i dati
    if (paymentLoading) return;

    const F = repairFormData.estimatedPrice ?? 0; // Prezzo IVA inclusa (editabile)
    const base = F / 1.22;
    const newLabor = round2(base - partsTotal); // L = F/1.22 - P

    // 🔥 MODIFICA: Aggiorna solo se c'è una differenza significativa
    if (!Number.isNaN(newLabor) && Math.abs(newLabor - laborAmount) > 0.01) {
      setLaborAmount(newLabor);
    }
  }, [partsTotal, repairFormData.estimatedPrice, paymentLoading]);

  // 🔄 SOSTITUISCI la funzione toggleDiagnosticItem esistente con questa:
  const toggleDiagnosticItem = (id: string) => {
    if (diagnosticMode === "incoming") {
      setIncomingDiagnosticItems((prev) => {
        // Se clicco "Telefono spento", imposto TUTTI allo stesso stato del nuovo valore
        if (id === "telefono-spento") {
          const current = prev.find((x) => x.id === id);
          const nextValue = !(current?.active ?? false);
          return prev.map((item) => ({ ...item, active: nextValue }));
        }

        // Per tutte le altre icone, toggle singolo (ma solo se il telefono NON è spento)
        return prev.map((item) =>
          item.id === id ? { ...item, active: !item.active } : item
        );
      });
    } else {
      // EXIT: stessa logica
      setExitDiagnosticItems((prev) => {
        if (id === "telefono-spento") {
          const current = prev.find((x) => x.id === id);
          const nextValue = !(current?.active ?? false);
          return prev.map((item) => ({ ...item, active: nextValue }));
        }

        return prev.map((item) =>
          item.id === id ? { ...item, active: !item.active } : item
        );
      });
    }
  };

  // 🆕 Funzione per aprire il modal di modifica cliente
  const openEditCustomerModal = () => {
    if (!selectedCustomer) {
      alert("⚠️ Nessun cliente selezionato");
      return;
    }

    // Pre-compila il form con i dati del cliente selezionato
    const { nome, cognome } = splitFullName(selectedCustomer.name || "");

    setEditingCustomer({
      tipo: selectedCustomer.customerType === "Azienda" ? "Azienda" : "Privato",
      cliente: true,
      fornitore: false,
      tipoCliente: "",
      ragioneSociale: selectedCustomer.name || "",
      indirizzo: selectedCustomer.address || "",
      cognome: cognome,
      nome: nome,
      cap: selectedCustomer.postalCode || "",
      regione: selectedCustomer.region || "",
      provincia: selectedCustomer.province || "",
      citta: selectedCustomer.city || "",
      telefono: selectedCustomer.phone || "",
      email: selectedCustomer.email || "",
      codiceFiscale: selectedCustomer.fiscalCode || "",
      partitaIva: selectedCustomer.vatNumber || "",
      emailPec: "",
      codiceSdi: "",
      iban: "",
    });

    setShowEditCustomerModal(true);
  };

  // 🆕 Funzione helper per dividere nome completo (riutilizzabile)
  const splitFullName = (fullName: string) => {
    if (!fullName) return { nome: "", cognome: "" };
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) {
      return { nome: parts[0], cognome: "" };
    } else if (parts.length === 2) {
      return { nome: parts[0], cognome: parts[1] };
    } else {
      return {
        nome: parts[0],
        cognome: parts.slice(1).join(" "),
      };
    }
  };

  // 🆕 Funzione per salvare le modifiche al cliente
  // 🆕 Funzione per salvare le modifiche al cliente
  const handleSaveCustomerChanges = async () => {
    if (!selectedCustomer?.id) {
      alert("⚠️ Nessun cliente selezionato");
      return;
    }

    // Validazioni
    if (!editingCustomer.tipo) {
      alert("⚠️ Selezionare un tipo di cliente");
      return;
    }

    const isPrivato = editingCustomer.tipo === "Privato";
    const tipologia = isPrivato ? "1" : "0";

    const ragioneSociale = isPrivato
      ? `${editingCustomer.cognome} ${editingCustomer.nome}`.trim()
      : editingCustomer.ragioneSociale;

    if (!isPrivato && ragioneSociale === "") {
      alert("⚠️ Inserire una ragione sociale");
      return;
    }

    if (!editingCustomer.indirizzo) {
      alert("⚠️ Inserire un indirizzo");
      return;
    }

    if (!editingCustomer.cap) {
      alert("⚠️ Inserire un CAP");
      return;
    }

    if (!editingCustomer.telefono) {
      alert("⚠️ Inserire un numero di telefono");
      return;
    }

    if (!editingCustomer.email) {
      alert("⚠️ Inserire un'email");
      return;
    }

    const payload = {
      id: selectedCustomer.id,
      tipologia: tipologia,
      isCustomer: editingCustomer.cliente,
      isSupplier: editingCustomer.fornitore,
      tipoCliente: editingCustomer.tipoCliente,
      ragioneSociale: ragioneSociale,
      indirizzo: editingCustomer.indirizzo,
      cognome: isPrivato ? editingCustomer.cognome : null,
      nome: isPrivato ? editingCustomer.nome : null,
      cap: editingCustomer.cap,
      regione: editingCustomer.regione,
      provincia: editingCustomer.provincia,
      citta: editingCustomer.citta,
      telefono: editingCustomer.telefono,
      email: editingCustomer.email,
      fiscalCode: editingCustomer.codiceFiscale,
      pIva: editingCustomer.partitaIva,
      emailPec: editingCustomer.emailPec,
      codiceSdi: editingCustomer.codiceSdi,
      iban: editingCustomer.iban,
      multitenantId: sessionStorage.getItem("IdCompany") || "",
    };

    setSavingCustomer(true);

    try {
      console.log("💾 Aggiornamento cliente:", payload);

      // 1️⃣ SALVA le modifiche (PUT - risposta 204)
      const updateResponse = await fetch(
        `${API_URL}/api/customer/${selectedCustomer.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!updateResponse.ok) {
        const errText = await updateResponse.text();
        throw new Error(errText || `Errore ${updateResponse.status}`);
      }

      console.log("✅ Cliente aggiornato con successo (204 No Content)");

      // 2️⃣ RICARICA i dati aggiornati dal server usando la funzione helper
      await reloadCustomerData(selectedCustomer.id);

      alert("✅ Cliente aggiornato con successo!");
      setShowEditCustomerModal(false);
    } catch (error) {
      console.error("❌ Errore durante il salvataggio:", error);
      alert(
        `❌ Errore durante il salvataggio del cliente:\n${
          error instanceof Error ? error.message : "Errore sconosciuto"
        }`
      );
    } finally {
      setSavingCustomer(false);
    }
  };

  const loadExistingDiagnostics = async (repairGuid: string) => {
    // Incoming
    try {
      const rIn = await fetch(
        `${API_URL}/api/repair/${repairGuid}/incoming-test`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      if (rIn.ok) {
        const inData = await rIn.json();
        setIncomingDiagnosticItems((prev) =>
          mapApiToDiagnosticItems(prev, inData)
        );
      }
    } catch (e) {
      console.warn("Incoming-test load error:", e);
    }

    // Exit
    try {
      const rEx = await fetch(`${API_URL}/api/repair/${repairGuid}/exit-test`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      if (rEx.ok) {
        const exData = await rEx.json();
        setExitDiagnosticItems((prev) => mapApiToDiagnosticItems(prev, exData));
      }
    } catch (e) {
      console.warn("Exit-test load error:", e);
    }
  };

  const mapApiToDiagnosticItems = (
    base: DiagnosticItem[],
    diagnosticData: any
  ) => {
    return base.map((item) => {
      let isActive = false;

      switch (item.id) {
        case "telefono-spento":
          isActive = diagnosticData.telefonoSpento || false;
          break;
        case "vetro-rotto":
          isActive = diagnosticData.vetroRotto || false;
          break;
        case "touchscreen":
          isActive = diagnosticData.touchscreen || false;
          break;
        case "lcd":
          isActive = diagnosticData.lcd || false;
          break;
        case "frame-scollato":
          isActive = diagnosticData.frameScollato || false;
          break;
        case "batteria":
          isActive = diagnosticData.batteria || false;
          break;
        case "dock-ricarica":
          isActive = diagnosticData.dockDiRicarica || false;
          break;
        case "back-cover":
          isActive = diagnosticData.backCover || false;
          break;
        case "telaio":
          isActive = diagnosticData.telaio || false;
          break;
        case "tasti-volume-muto":
          isActive = diagnosticData.tastiVolumeMuto || false;
          break;
        case "tasto-standby-power":
          isActive = diagnosticData.tastoStandbyPower || false;
          break;
        case "sensore-prossimita":
          isActive = diagnosticData.sensoreDiProssimita || false;
          break;
        case "microfono-chiamate":
          isActive = diagnosticData.microfonoChiamate || false;
          break;
        case "microfono-ambientale":
          isActive = diagnosticData.microfonoAmbientale || false;
          break;
        case "altoparlante-chiamata":
          // ⚠️ Gestisce entrambi i casi (con doppia T per Incoming, senza per Exit)
          isActive =
            diagnosticData.altoparlanteChiamata ||
            diagnosticData.altoparlanteChiamata ||
            false;
          break;
        case "speaker-buzzer":
          isActive = diagnosticData.speakerBuzzer || false;
          break;
        case "vetro-fotocamera-posteriore":
          isActive = diagnosticData.vetroFotocameraPosteriore || false;
          break;
        case "fotocamera-posteriore":
          isActive = diagnosticData.fotocameraPosteriore || false;
          break;
        case "fotocamera-anteriore":
          isActive = diagnosticData.fotocameraAnteriore || false;
          break;
        case "tasto-home":
          isActive = diagnosticData.tastoHome || false;
          break;
        case "touch-id":
          isActive = diagnosticData.touchId || false;
          break;
        case "face-id":
          isActive = diagnosticData.faceId || false;
          break;
        case "wifi":
          isActive = diagnosticData.wiFi || false;
          break;
        case "rete":
          isActive = diagnosticData.rete || false;
          break;
        case "chiamata":
          isActive = diagnosticData.chiamata || false;
          break;
        case "scheda-madre":
          isActive = diagnosticData.schedaMadre || false;
          break;
        case "vetro-posteriore":
          isActive = diagnosticData.vetroPosteriore || false;
          break;
        default:
          isActive = item.active;
      }

      return { ...item, active: isActive };
    });
  };

  // Funzioni per il caricamento dei dati
  const loadRepairData = async (id: string) => {
    setLoadingRepairData(true);
    setLoadingError(null);

    try {
      const response = await fetch(`${API_URL}/api/repair/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data: RepairData = await response.json();
        setRepairData(data);
        populateFormWithRepairData(data);

        // Carica diagnostica esistente
        await loadExistingDiagnostics(
          repairGuid || data.repairGuid || data.repairId
        );

        // 🔥 PRIMA carica i ricambi
        await loadExistingRepairParts(data.repairId);

        // 🔥 POI carica il pagamento (che dipende dai ricambi)
        await loadExistingPayment(data.repairId);
      } else {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati riparazione:", error);
      setLoadingError(
        error instanceof Error ? error.message : "Errore sconosciuto"
      );
    } finally {
      setLoadingRepairData(false);
    }
  };

  /**
   * Carica il pagamento associato alla riparazione (se esiste)
   */
  const loadExistingPayment = async (repairId: string) => {
    setPaymentLoading(true);
    try {
      console.log("💰 Caricamento pagamento per riparazione:", repairId);

      const response = await fetch(
        `${API_URL}/api/RepairPayments/repair/${repairId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const payment = await response.json();

        if (payment && payment.id) {
          console.log("✅ Pagamento trovato:", payment);

          setPaymentData({
            id: payment.id,
            partsAmount: payment.partsAmount,
            laborAmount: payment.laborAmount,
            vatAmount: payment.vatAmount,
            totalAmount: payment.totalAmount,
            notes: payment.notes || "",
          });

          // 🔥 IMPORTANTE: Aggiorna gli importi nella form
          // Usa setTimeout per assicurarti che il partsTotal sia già stato caricato
          setTimeout(() => {
            setLaborAmount(payment.laborAmount);
            setRepairFormData((prev) => ({
              ...prev,
              estimatedPrice: payment.totalAmount,
              billingInfo: payment.notes || prev.billingInfo,
            }));
          }, 100);

          console.log("✅ Dati pagamento caricati nella form");
        } else {
          console.log("ℹ️ Nessun pagamento associato a questa riparazione");
        }
      } else if (response.status === 404) {
        console.log(
          "ℹ️ Nessun pagamento trovato (404) - normale per riparazioni senza pagamento"
        );
      } else {
        console.warn(`⚠️ Errore ${response.status} nel caricamento pagamento`);
      }
    } catch (error) {
      console.error("❌ Errore caricamento pagamento:", error);
      // Non bloccare il flusso se il pagamento non esiste
    } finally {
      setPaymentLoading(false);
    }
  };

  /**
   * Salva o aggiorna il pagamento associato alla riparazione
   */
  const saveOrUpdatePayment = async (repairId: string) => {
    try {
      console.log("💾 Salvataggio pagamento...");

      const multitenantId = sessionStorage.getItem("IdCompany");

      const payload = {
        repairId: repairId,
        multitenantId: multitenantId || "",
        partsAmount: partsTotal,
        laborAmount: laborAmount,
        notes: repairFormData.billingInfo || null,
      };

      console.log("📦 Payload pagamento:", payload);

      // Se esiste già un pagamento, aggiorna (PUT)
      if (paymentData?.id) {
        console.log(
          `🔄 Aggiornamento pagamento esistente ID ${paymentData.id}`
        );

        const updateResponse = await fetch(
          `${API_URL}/api/RepairPayments/${paymentData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          throw new Error(`Errore aggiornamento pagamento: ${error}`);
        }

        console.log("✅ Pagamento aggiornato con successo");
      }
      // Altrimenti crea nuovo pagamento (POST)
      else {
        console.log("➕ Creazione nuovo pagamento");
        console.log("Payload pagamento:", JSON.stringify(payload, null, 2));

        const createResponse = await fetch(`${API_URL}/api/RepairPayments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        });

        if (!createResponse.ok) {
          const error = await createResponse.text();
          throw new Error(`Errore creazione pagamento: ${error}`);
        }

        const createdPayment = await createResponse.json();
        console.log("✅ Pagamento creato:", createdPayment);

        // Aggiorna lo state con il nuovo ID
        setPaymentData({
          id: createdPayment.id,
          partsAmount: createdPayment.partsAmount,
          laborAmount: createdPayment.laborAmount,
          vatAmount: createdPayment.vatAmount,
          totalAmount: createdPayment.totalAmount,
          notes: createdPayment.notes || "",
        });
      }

      console.log("✅ Operazione pagamento completata");
    } catch (error) {
      console.error("❌ Errore salvataggio pagamento:", error);
      throw new Error(
        `Impossibile salvare il pagamento: ${
          error instanceof Error ? error.message : "Errore sconosciuto"
        }`
      );
    }
  };

  /**
   * Carica i ricambi già associati alla riparazione dal backend
   */
  const loadExistingRepairParts = async (repairId: string) => {
    setLoadingParts(true);
    try {
      console.log("🔍 Caricamento ricambi per riparazione:", repairId);
      console.log("loadingParts stato prima fetch:", loadingParts);

      const response = await fetch(`${API_URL}/api/RepairParts/${repairId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const existingParts = await response.json();

        if (existingParts && existingParts.length > 0) {
          console.log("✅ Ricambi trovati:", existingParts.length);

          // ⭐ MODIFICA: Salva anche l'ID del database
          const partsForForm: RepairPartLine[] = existingParts.map(
            (part: any) => ({
              tempId: crypto.randomUUID(),
              dbId: part.id, // ⭐ AGGIUNGI QUESTO
              warehouseItemId: part.warehouseItemId,
              itemId: part.itemId,
              code: part.code,
              name: part.name,
              qty: part.quantity,
              unitPrice: part.unitPrice,
              lineTotal: part.lineTotal,
              stock: part.availableStock,
            })
          );

          setUsedParts(partsForForm);
          console.log("✅ Ricambi caricati nel form:", partsForForm);
        } else {
          console.log("ℹ️ Nessun ricambio associato a questa riparazione");
        }
      } else if (response.status === 404) {
        console.log("ℹ️ Nessun ricambio trovato (404)");
      } else {
        throw new Error(`Errore ${response.status}`);
      }
    } catch (error) {
      console.error("⚠️ Errore caricamento ricambi esistenti:", error);
    } finally {
      setLoadingParts(false);
    }
  };

  // const loadExistingDiagnostics = async (repairGuid: string) => {
  //   try {
  //     const response = await fetch(
  //       `${API_URL}/api/repair/${repairGuid}/incoming-test`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  //         },
  //       }
  //     );

  //     if (response.ok) {
  //       const diagnosticData = await response.json();
  //       updateDiagnosticItemsFromAPI(diagnosticData);
  //     }
  //   } catch (error) {
  //     console.warn("Errore nel caricamento diagnostica esistente:", error);
  //   }
  // };

  // const updateDiagnosticItemsFromAPI = (diagnosticData: any) => {
  //   setDiagnosticItems((prevItems) =>
  //     prevItems.map((item) => {
  //       let isActive = false;

  //       // Mappa i campi API ai nostri ID
  //       switch (item.id) {
  //         case "battery":
  //           isActive = diagnosticData.batteria || false;
  //           break;
  //         case "wifi":
  //           isActive = diagnosticData.wiFi || false;
  //           break;
  //         case "face-id":
  //           isActive = diagnosticData.faceId || false;
  //           break;
  //         case "scanner":
  //           isActive = diagnosticData.touchId || false;
  //           break;
  //         case "sensors":
  //           isActive = diagnosticData.sensoreDiProssimita || false;
  //           break;
  //         case "system":
  //           isActive = diagnosticData.schedaMadre || false;
  //           break;
  //         case "cellular":
  //           isActive = diagnosticData.rete || false;
  //           break;
  //         case "camera":
  //           isActive =
  //             diagnosticData.fotocameraPosteriore ||
  //             diagnosticData.fotocameraAnteriore ||
  //             false;
  //           break;
  //         default:
  //           isActive = item.active; // Mantieni lo stato corrente per gli altri
  //       }

  //       return { ...item, active: isActive };
  //     })
  //   );
  // };

  const populateFormWithRepairData = (data: RepairData) => {
    // Funzione helper per dividere nome e cognome - DEFINITA QUI DENTRO
    const splitFullName = (fullName: string) => {
      if (!fullName) return { nome: "", cognome: "" };

      const parts = fullName.trim().split(" ");
      if (parts.length === 1) {
        return { nome: parts[0], cognome: "" };
      } else if (parts.length === 2) {
        return { nome: parts[0], cognome: parts[1] };
      } else {
        return {
          nome: parts[0],
          cognome: parts.slice(1).join(" "),
        };
      }
    };

    console.log("🔍 Dati riparazione completi:", data);
    console.log("👤 Dati cliente dall'API:", data.customer);

    // Popola dati cliente
    if (data.customer) {
      setSelectedCustomer(data.customer);

      // Separa nome e cognome dal campo "name"
      const { nome, cognome } = splitFullName(data.customer.name || "");

      setClienteData({
        email: data.customer.email || "",
        nome: nome,
        cognome: cognome,
        telefono: data.customer.phone || "",
        cap: data.customer.postalCode || "",
      });

      console.log("✅ Dati cliente mappati:", {
        emailDaAPI: data.customer.email,
        nomeCompletoDaAPI: data.customer.name,
        nomeDiviso: nome,
        cognomeDiviso: cognome,
        telefonoDaAPI: data.customer.phone,
        capDaAPI: data.customer.postalCode,
      });
    }

    // Popola dati dispositivo
    if (data.device) {
      setSelectedDevice(data.device);
      setDispositivoData({
        serialNumber: data.device.serialNumber,
        brand: data.device.brand,
        model: data.device.model,
        deviceType: data.device.deviceType,
        color: "",
        unlockCode: data.unlockCode || "",
        courtesyPhone: data.courtesyPhone || "",
      });
    }

    // Popola dati riparazione
    setRepairFormData({
      faultDeclared: data.faultDeclared,
      repairAction: data.repairAction || "",
      technicianCode: data.technicianCode || "",
      technicianName: data.technicianName || "",
      estimatedPrice: data.estimatedPrice || 0,
      paymentType: data.paymentType || "",
      billingInfo: data.billingInfo || "",
      unlockCode: data.unlockCode || "",
      courtesyPhone: data.courtesyPhone || "",
    });

    // Determina il componente di riparazione dalla descrizione
    determineRepairComponent(data.faultDeclared);

    // Imposta lo stato della riparazione
    setRepairStatusCode(data.repairStatusCode || "");
  };

  // 3. SOSTITUISCI la parte JSX della sezione Cliente con questa:
  {
    /* Sezione Cliente */
  }
  <div className="form-section">
    <h3>Cliente</h3>

    <div className="form-group">
      <label>Cliente Selezionato</label>
      <div className="selected-customer">
        <strong>
          {selectedCustomer?.name || "Nome non disponibile"}
          {selectedCustomer?.customerType === "Azienda" && " (Azienda)"}
        </strong>
        <small>
          {selectedCustomer?.email} • {selectedCustomer?.phone}
          {selectedCustomer?.city && ` • ${selectedCustomer.city}`}
          {selectedCustomer?.fiscalCode &&
            ` • CF: ${selectedCustomer.fiscalCode}`}
        </small>
      </div>
    </div>

    <div className="form-group">
      <label>E-Mail *</label>
      <input
        type="email"
        className={`form-control ${
          validationErrors.includes("Inserire un'email valida per il cliente")
            ? "error"
            : ""
        }`}
        value={clienteData.email}
        onChange={(e) =>
          setClienteData({ ...clienteData, email: e.target.value })
        }
        placeholder="Email del cliente"
      />
    </div>

    <div className="form-group">
      <label>Nome *</label>
      <input
        type="text"
        className={`form-control ${
          validationErrors.includes("Inserire il nome del cliente")
            ? "error"
            : ""
        }`}
        value={clienteData.nome}
        onChange={(e) =>
          setClienteData({ ...clienteData, nome: e.target.value })
        }
        placeholder="Nome del cliente"
      />
    </div>

    <div className="form-group">
      <label>Cognome *</label>
      <input
        type="text"
        className={`form-control ${
          validationErrors.includes("Inserire il cognome del cliente")
            ? "error"
            : ""
        }`}
        value={clienteData.cognome}
        onChange={(e) =>
          setClienteData({ ...clienteData, cognome: e.target.value })
        }
        placeholder="Cognome del cliente"
      />
    </div>

    <div className="form-group">
      <label>Telefono *</label>
      <input
        type="tel"
        className={`form-control ${
          validationErrors.includes("Inserire il telefono del cliente")
            ? "error"
            : ""
        }`}
        value={clienteData.telefono}
        onChange={(e) =>
          setClienteData({ ...clienteData, telefono: e.target.value })
        }
        placeholder="Numero di telefono"
      />
    </div>

    <div className="form-group">
      <label>Cap</label>
      <input
        type="text"
        className="form-control"
        value={clienteData.cap}
        onChange={(e) =>
          setClienteData({ ...clienteData, cap: e.target.value })
        }
        placeholder="CAP"
      />
    </div>
  </div>;

  const determineRepairComponent = (faultDeclared: string) => {
    const lowerFault = faultDeclared.toLowerCase();

    if (
      lowerFault.includes("schermo") ||
      lowerFault.includes("display") ||
      lowerFault.includes("vetro")
    ) {
      setRepairComponent("Schermo");
    } else if (lowerFault.includes("batteria")) {
      setRepairComponent("Batteria");
    } else if (
      lowerFault.includes("software") ||
      lowerFault.includes("sistema")
    ) {
      setRepairComponent("Software");
    } else if (
      lowerFault.includes("scheda madre") ||
      lowerFault.includes("motherboard")
    ) {
      setRepairComponent("Scheda Madre");
    } else {
      setRepairComponent("Altri Danni");
    }
  };

  const loadOperators = async () => {
    try {
      // Dati fake per ora
      const fakeOperators = [
        {
          id: "1",
          firstName: "Mario",
          lastName: "Rossi",
          codiceDipendente: "TEC001",
          email: "mario.rossi@medialab.it",
          phoneNumber: "+39 333 1234567",
        },
        {
          id: "2",
          firstName: "Luigi",
          lastName: "Verdi",
          codiceDipendente: "TEC002",
          email: "luigi.verdi@medialab.it",
          phoneNumber: "+39 333 2345678",
        },
        {
          id: "3",
          firstName: "Giuseppe",
          lastName: "Bianchi",
          codiceDipendente: "TEC003",
          email: "giuseppe.bianchi@medialab.it",
          phoneNumber: "+39 333 3456789",
        },
      ];

      setOperators(fakeOperators);
    } catch (error) {
      console.error("Errore nel caricamento operatori:", error);
    }
  };

  // Trova l'operatore corrispondente quando i dati vengono caricati
  useEffect(() => {
    if (operators.length > 0 && repairFormData.technicianCode) {
      const operator = operators.find(
        (op) =>
          op.codiceDipendente === repairFormData.technicianCode ||
          op.internalCode === repairFormData.technicianCode
      );
      if (operator) {
        setSelectedOperator(operator);
      }
    }
  }, [operators, repairFormData.technicianCode]);

  // Funzioni di utilità
  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // const toggleDiagnosticItem = (id: string) => {
  //   setDiagnosticItems((prevItems) =>
  //     prevItems.map((item) =>
  //       item.id === id ? { ...item, active: !item.active } : item
  //     )
  //   );
  // };

  // 🆕 Funzione helper per ricaricare i dati del cliente dal server
  const reloadCustomerData = async (customerId: string) => {
    try {
      console.log("🔄 Ricaricamento dati cliente:", customerId);

      const response = await fetch(`${API_URL}/api/customer/${customerId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status} nel caricamento cliente`);
      }

      const reloadedCustomer: CustomerData = await response.json();
      console.log("✅ Dati cliente ricaricati dal server:", reloadedCustomer);

      // Mappa i dati nel formato CustomerData dell'interfaccia
      const mappedCustomer: CustomerData = {
        id: reloadedCustomer.id,
        name:
          reloadedCustomer.ragioneSociale ||
          `${reloadedCustomer.cognome || ""} ${
            reloadedCustomer.nome || ""
          }`.trim(),
        phone: reloadedCustomer.telefono || "",
        email: reloadedCustomer.email || "",
        address: reloadedCustomer.address || "",
        city: reloadedCustomer.city || "",
        province: reloadedCustomer.province || "",
        postalCode: reloadedCustomer.postalCode || "",
        region: reloadedCustomer.region || "",
        fiscalCode: reloadedCustomer.fiscalCode || "",
        vatNumber: reloadedCustomer.pIva || "",
        customerType:
          reloadedCustomer.tipologia === "1" ? "Privato" : "Azienda",
      };

      // Aggiorna lo stato del cliente selezionato
      setSelectedCustomer(mappedCustomer);

      // Separa nome e cognome per i campi della form
      const { nome, cognome } = splitFullName(mappedCustomer.name);

      // Aggiorna i dati del form cliente
      setClienteData({
        email: mappedCustomer.email,
        nome: nome,
        cognome: cognome,
        telefono: mappedCustomer.phone,
        cap: mappedCustomer.postalCode,
      });

      console.log("✅ Stati UI aggiornati con i dati ricaricati");
      return mappedCustomer;
    } catch (error) {
      console.error("❌ Errore ricaricamento cliente:", error);
      throw error;
    }
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validazione Cliente
    if (!selectedCustomer) {
      errors.push("Dati cliente mancanti");
    } else {
      if (!clienteData.email || !/\S+@\S+\.\S+/.test(clienteData.email)) {
        errors.push("Inserire un'email valida per il cliente");
      }
      if (!clienteData.nome?.trim()) {
        errors.push("Inserire il nome del cliente");
      }
      if (!clienteData.cognome?.trim()) {
        errors.push("Inserire il cognome del cliente");
      }
      if (!clienteData.telefono?.trim()) {
        errors.push("Inserire il telefono del cliente");
      }
    }

    // Validazione Dispositivo
    if (!selectedDevice) {
      errors.push("Dati dispositivo mancanti");
    }

    // Validazione Riparazione
    if (!repairComponent) {
      errors.push("Selezionare il componente/tipo di riparazione");
    }

    if (!repairFormData.faultDeclared?.trim()) {
      errors.push("Inserire la descrizione del problema");
    }

    if (!selectedOperator) {
      errors.push("Assegnare la riparazione a un tecnico");
    }

    if (repairFormData.estimatedPrice <= 0) {
      errors.push("Inserire un prezzo preventivo valido");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const buildIncomingTestDto = (items: { id: string; active: boolean }[]) => {
    const on = (id: string) => items.find((x) => x.id === id)?.active ?? false;

    return {
      telefonoSpento: on("telefono-spento"),
      vetroRotto: on("vetro-rotto"),
      touchscreen: on("touchscreen"),
      lcd: on("lcd"),
      frameScollato: on("frame-scollato"),
      batteria: on("batteria"),
      dockDiRicarica: on("dock-ricarica"),
      backCover: on("back-cover"),
      telaio: on("telaio"),
      tastiVolumeMuto: on("tasti-volume-muto"),
      tastoStandbyPower: on("tasto-standby-power"),
      sensoreDiProssimita: on("sensore-prossimita"),
      microfonoChiamate: on("microfono-chiamate"),
      microfonoAmbientale: on("microfono-ambientale"),
      altoparlanteChiamata: on("altoparlante-chiamata"),
      speakerBuzzer: on("speaker-buzzer"),
      vetroFotocameraPosteriore: on("vetro-fotocamera-posteriore"),
      fotocameraPosteriore: on("fotocamera-posteriore"),
      fotocameraAnteriore: on("fotocamera-anteriore"),
      tastoHome: on("tasto-home"),
      touchId: on("touch-id"),
      faceId: on("face-id"),
      wiFi: on("wifi"),
      rete: on("rete"),
      chiamata: on("chiamata"),
      schedaMadre: on("scheda-madre"),
      vetroPosteriore: on("vetro-posteriore"),
    };
  };

  const buildExitTestDto = (items: { id: string; active: boolean }[]) => {
    const on = (id: string) => items.find((x) => x.id === id)?.active ?? false;

    return {
      // ExitTest NON ha "telefonoSpento" nel DB
      telefonoSpento: on("telefono-spento"),
      vetroRotto: on("vetro-rotto"),
      touchscreen: on("touchscreen"),
      lcd: on("lcd"),
      frameScollato: on("frame-scollato"),
      batteria: on("batteria"),
      dockDiRicarica: on("dock-ricarica"),
      backCover: on("back-cover"),
      telaio: on("telaio"),
      tastiVolumeMuto: on("tasti-volume-muto"),
      tastoStandbyPower: on("tasto-standby-power"),
      sensoreDiProssimita: on("sensore-prossimita"),
      microfonoChiamate: on("microfono-chiamate"),
      microfonoAmbientale: on("microfono-ambientale"),
      altoparlanteChiamata: on("altoparlante-chiamata"), // ⚠️ Nota: ExitTest usa "altoparlanteChiamata" (senza doppia T)
      speakerBuzzer: on("speaker-buzzer"),
      vetroFotocameraPosteriore: on("vetro-fotocamera-posteriore"),
      fotocameraPosteriore: on("fotocamera-posteriore"),
      fotocameraAnteriore: on("fotocamera-anteriore"),
      tastoHome: on("tasto-home"),
      touchId: on("touch-id"),
      faceId: on("face-id"),
      wiFi: on("wifi"),
      rete: on("rete"),
      chiamata: on("chiamata"),
      schedaMadre: on("scheda-madre"),
      vetroPosteriore: on("vetro-posteriore"),
    };
  };

  const upsertIncomingTest = async (
    repairGuid: string,
    items: { id: string; active: boolean }[]
  ) => {
    const dto = buildIncomingTestDto(items);
    console.log("DTO diagnostica ingresso:", dto);
    const res = await fetch(
      `${API_URL}/api/repair/${repairGuid}/incoming-test`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(dto),
      }
    );
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Salvataggio diagnostica fallito (${res.status}) ${t}`);
    }
  };

  const upsertExitTest = async (
    repairGuid: string,
    items: { id: string; active: boolean }[]
  ) => {
    const dto = buildExitTestDto(items);
    const res = await fetch(`${API_URL}/api/repair/${repairGuid}/exit-test`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Salvataggio exit-test fallito (${res.status}) ${t}`);
    }
  };

  const updateStatusRepair = async (repairGuid: string) => {
    const payload = {
      StatusCode: repairStatusCode || null,
      Status:
        REPAIR_STATUS.find((s) => s.code === repairStatusCode)?.label?.replace(
          /^[^\p{L}\p{N}]+/u,
          ""
        ) || null,
    };
    const res = await fetch(`${API_URL}/api/repair/${repairGuid}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Salvataggio exit-test fallito (${res.status}) ${t}`);
    }
  };

  const handleUpdateRepair = async () => {
    if (!repairData) return;

    const validation = validateForm();
    const isCompleted = repairStatusCode;

    if (isCompleted && isCompleted === "COMPLETED") {
      const confirmCompleted = window.confirm(
        "La riparazione è nello stato 'COMPLETATO'. Sei sicuro di voler modificare la riparazione?"
      );
      if (!confirmCompleted) return;
    }

    if (isCompleted && isCompleted === "DELIVERED") {
      const confirmCompleted = window.confirm(
        "Lo stato delle riparazione è 'CONSEGNATO'. Sei sicuro di voler modificare la riparazione?"
      );
      if (!confirmCompleted) return;
    }

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      alert("Errori di validazione:\n\n" + validation.errors.join("\n"));
      return;
    }

    setValidationErrors([]);
    setIsUpdating(true);

    try {
      const payload = {
        customerId: selectedCustomer?.id || null,
        deviceId: selectedDevice?.deviceId || null,
        repairData: {
          faultDeclared: repairFormData.faultDeclared,
          repairAction: repairFormData.repairAction || null,
          technicianCode:
            selectedOperator?.codiceDipendente ||
            selectedOperator?.internalCode ||
            null,
          technicianName:
            `${selectedOperator?.firstName || ""} ${
              selectedOperator?.lastName || ""
            }`.trim() || null,
          estimatedPrice: repairFormData.estimatedPrice,
          paymentType: repairFormData.paymentType || null,
          billingInfo: repairFormData.billingInfo || null,
          unlockCode: dispositivoData.unlockCode || null,
          courtesyPhone: dispositivoData.courtesyPhone || null,
        },
        notes: repairFormData.billingInfo || null,
        repairStatusCode: repairStatusCode || null,
        repairStatus:
          REPAIR_STATUS.find(
            (s) => s.code === repairStatusCode
          )?.label?.replace(/^.\s/, "") || null,
      };

      console.log("Payload aggiornamento:", JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${API_URL}/api/repair/${repairData.repairId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        try {
          await upsertIncomingTest(
            repairData.repairId,
            incomingDiagnosticItems
          );
          await upsertExitTest(repairData.repairId, exitDiagnosticItems);

          // Salva i ricambi se ce ne sono
          if (usedParts.length > 0) {
            console.log("💾 Salvataggio ricambi...");
            await saveRepairPartsData(repairData.repairId);
          }

          // 🆕 AGGIUNGI: Salva/Aggiorna il pagamento
          console.log("💰 Salvataggio dati pagamento...");
          await saveOrUpdatePayment(repairData.repairId);

          alert("✅ Riparazione aggiornata con successo!");
          await updateStatusRepair(repairData.repairId);
        } catch (e: unknown) {
          console.error(e);
          const message = e instanceof Error ? e.message : String(e);
          alert(
            "⚠️ Riparazione aggiornata ma alcuni dati NON salvati.\n" + message
          );
        }
      } else {
        const errorText = await response.text();
        console.error("Errore aggiornamento API:", errorText);
        alert("❌ Errore durante l'aggiornamento:\n" + errorText);
      }
    } catch (error) {
      console.error("Errore durante aggiornamento:", error);
      alert("❌ Errore durante l'aggiornamento della riparazione. Riprova.");
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Salva/Aggiorna i ricambi associati alla riparazione
   * - Se il ricambio ha dbId → UPDATE
   * - Se il ricambio NON ha dbId → INSERT
   * - I ricambi rimossi dalla form vengono gestiti dal backend
   */
  const saveRepairPartsData = async (repairId: string) => {
    try {
      console.log("💾 Salvataggio ricambi per riparazione:", repairId);
      console.log("📦 Ricambi attuali nella form:", usedParts);

      // Separa ricambi da aggiornare e ricambi nuovi
      const ricambiDaAggiornare = usedParts.filter((p) => p.dbId !== undefined);
      const ricambiNuovi = usedParts.filter((p) => p.dbId === undefined);

      console.log("🔄 Ricambi da AGGIORNARE:", ricambiDaAggiornare.length);
      console.log("➕ Ricambi NUOVI da inserire:", ricambiNuovi.length);

      // 1. AGGIORNA i ricambi esistenti
      for (const part of ricambiDaAggiornare) {
        console.log(`🔄 Aggiornamento ricambio ID ${part.dbId}...`);

        const updatePayload = {
          quantity: part.qty,
          unitPrice: part.unitPrice,
          notes: undefined,
        };

        const updateResponse = await fetch(
          `${API_URL}/api/RepairParts/${repairId}/parts/${part.dbId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify(updatePayload),
          }
        );

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          throw new Error(
            `Errore aggiornamento ricambio ${part.code}: ${error}`
          );
        }

        console.log(`✅ Ricambio ${part.code} aggiornato`);
      }

      // 2. INSERISCI i ricambi nuovi
      if (ricambiNuovi.length > 0) {
        console.log("➕ Inserimento nuovi ricambi...");

        const partsToInsert = ricambiNuovi.map((part) => ({
          warehouseItemId: part.warehouseItemId,
          quantity: part.qty,
          notes: undefined,
        }));

        const insertPayload = {
          parts: partsToInsert,
        };

        const insertResponse = await fetch(
          `${API_URL}/api/RepairParts/${repairId}/batch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify(insertPayload),
          }
        );

        if (!insertResponse.ok) {
          const error = await insertResponse.text();
          throw new Error(`Errore inserimento nuovi ricambi: ${error}`);
        }

        const insertedParts = await insertResponse.json();
        console.log("✅ Nuovi ricambi inseriti:", insertedParts);
      }

      console.log("✅ Tutti i ricambi salvati/aggiornati con successo!");

      // 3. Ricarica i ricambi per aggiornare gli ID
      await loadExistingRepairParts(repairId);
    } catch (error) {
      console.error("❌ Errore salvataggio ricambi:", error);
      throw new Error(
        `Impossibile salvare i ricambi: ${
          error instanceof Error ? error.message : "Errore sconosciuto"
        }`
      );
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Ricerca ricambi (chiama il BE - endpoint placeholder)
  // const searchParts = async (q: string) => {
  //   setPartsQuery(q);
  //   if (!q || q.trim().length < 2) {
  //     setPartsResults([]);
  //     return;
  //   }
  //   setPartsSearching(true);
  //   try {
  //     const resp = await fetch(
  //       `${API_URL}/api/warehouse/search?q=${encodeURIComponent(
  //         q
  //       )}`,
  //       {
  //         headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
  //       }
  //     );
  //     if (resp.ok) {
  //       const data: PartSearchItem[] = await resp.json();
  //       setPartsResults(data);
  //     } else {
  //       setPartsResults([]);
  //     }
  //   } catch {
  //     setPartsResults([]);
  //   } finally {
  //     setPartsSearching(false);
  //   }
  // };

  const searchParts = async (q: string) => {
    setPartsQuery(q);
    if (!q || q.trim().length < 2) {
      setPartsResults([]);
      return;
    }
    setPartsSearching(true);
    try {
      const rows = await searchPartsQuick(q.trim()); // <-- chiama il BE reale
      setPartsResults(rows);
    } catch (e) {
      console.error("searchPartsQuick error:", e);
      setPartsResults([]);
    } finally {
      setPartsSearching(false);
    }
  };

  // Aggiunge una riga ricambio alla scheda
  const addPartLine = (item: PartSearchItem) => {
    setUsedParts((prev) => {
      // item.id è numerico (warehouse item id)
      const idx = prev.findIndex((p) => p.warehouseItemId === item.id);
      if (idx >= 0) {
        // incrementa ma non superare lo stock reale
        const clone = [...prev];
        const cur = clone[idx];
        const nextQty = Math.min(cur.qty + 1, item.quantity ?? cur.stock ?? 1);
        clone[idx] = {
          ...cur,
          qty: nextQty,
          lineTotal: nextQty * cur.unitPrice,
          stock: item.quantity ?? cur.stock ?? nextQty,
        };
        return clone;
      }

      // nuova riga: usa i campi REALI (id numerico + itemId GUID)
      const line: RepairPartLine = {
        tempId: crypto.randomUUID(),
        warehouseItemId: item.id, // <-- numero
        itemId: item.itemId, // <-- GUID dal BE
        code: item.code,
        name: `${item.name} (${item.brand} ${item.model})`,
        qty: 1,
        unitPrice: item.unitPrice ?? 0,
        lineTotal: item.unitPrice ?? 0,
        stock: item.quantity ?? 0,
      };
      return [...prev, line];
    });
    setPartsQuery(""); // Azzera il campo di ricerca
    setPartsResults([]); // Svuota i risultati della ricerca
  };

  // Aggiorna quantità
  const updateLineQty = (tempId: string, qty: number) => {
    const requested = Math.max(1, Math.floor(qty || 1));
    setUsedParts((prev) =>
      prev.map((l) => {
        if (l.tempId !== tempId) return l;
        const clamped = Math.min(requested, l.stock ?? requested);
        return { ...l, qty: clamped, lineTotal: clamped * l.unitPrice };
      })
    );
  };

  // Rimuove riga
  // Rimuove riga
  const removeLine = async (tempId: string) => {
    const partToRemove = usedParts.find((p) => p.tempId === tempId);

    if (!partToRemove) return;

    // Se il ricambio era già salvato nel DB, eliminalo anche lì
    if (partToRemove.dbId && repairData) {
      const confirmDelete = window.confirm(
        `Vuoi eliminare il ricambio "${partToRemove.name}" dalla scheda di lavorazione?\n\nSe clicchi OK, verrà eliminato immediatamente.`
      );

      if (confirmDelete) {
        try {
          console.log(`🗑️ Eliminazione ricambio ID ${partToRemove.dbId}...`);

          const response = await fetch(
            `${API_URL}/api/RepairParts/${repairData.repairId}/parts/${partToRemove.dbId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Errore ${response.status}`);
          }

          console.log("✅ Ricambio eliminato dal database");
        } catch (error) {
          console.error("❌ Errore eliminazione ricambio:", error);
          alert(
            `⚠️ Impossibile eliminare il ricambio dal database:\n${
              error instanceof Error ? error.message : "Errore sconosciuto"
            }`
          );
          return; // Non rimuoverlo dalla lista se l'eliminazione fallisce
        }
      } else {
        // L'utente ha annullato, non fare nulla
        return;
      }
    }

    // Rimuovi dalla lista locale
    setUsedParts((prev) => prev.filter((l) => l.tempId !== tempId));
  };

  // Scarica dal magazzino (consumo scorte) – endpoint placeholder
  // const handleConsumeFromWarehouse = async () => {
  //   if (!repairData) return;
  //   try {
  //     const payload = {
  //       repairGuid: repairData.repairGuid || repairData.repairId,
  //       lines: usedParts.map((l) => ({ itemId: l.itemId, qty: l.qty })),
  //     };
  //     const resp = await fetch(`${API_URL}/api/warehouse/consume`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  //       },
  //       body: JSON.stringify(payload),
  //     });
  //     if (!resp.ok) throw new Error();
  //     alert("Ricambi scaricati dal magazzino ✅");
  //   } catch {
  //     alert("Errore nello scarico dal magazzino ❌");
  //   }
  // };

  const handleConsumeFromWarehouse = async () => {
    if (!repairData) {
      alert("❌ Nessuna riparazione selezionata");
      return;
    }

    if (usedParts.length === 0) {
      alert("❌ Nessun ricambio da scaricare");
      return;
    }

    // Conferma dall'utente
    const confirm = window.confirm(
      `Vuoi scaricare ${usedParts.length} ricambi dal magazzino?\n\nQuesta operazione ridurrà le giacenze disponibili.`
    );

    if (!confirm) return;

    try {
      console.log("💾 Salvataggio ricambi prima dello scarico...");
      await saveRepairPartsData(repairData.repairId);

      console.log("📦 Scarico ricambi dal magazzino...");
      const response = await fetch(
        `${API_URL}/api/RepairParts/${repairData.repairId}/consume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Errore scarico magazzino");
      }

      const result = await response.json();

      if (result.success) {
        alert(
          `✅ ${result.message}\n\n${result.consumedItems} ricambi scaricati dal magazzino.`
        );
      } else {
        alert(
          `⚠️ Scarico parziale:\n\n${
            result.message
          }\n\nErrori:\n${result.errors?.join("\n")}`
        );
      }
    } catch (error) {
      console.error("❌ Errore scarico magazzino:", error);
      alert(
        `❌ Errore nello scarico dal magazzino:\n\n${
          error instanceof Error ? error.message : "Errore sconosciuto"
        }`
      );
    }
  };

  // Rendering condizionale per loading e errori
  if (loadingRepairData) {
    return (
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Caricamento dati riparazione...</span>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  if (loadingError || !repairData) {
    return (
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />
          <div className="error-container">
            <h2>❌ Errore nel caricamento</h2>
            <p>{loadingError || "Riparazione non trovata"}</p>
            <button className="btn btn-primary" onClick={handleGoBack}>
              ← Torna indietro
            </button>
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout">
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className="content-area">
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className="scheda-header">
          <div className="left-block">
            <button className="back-btn" onClick={handleGoBack}>
              <ArrowLeft className="back-icon" />
            </button>
            <div className="repair-info">
              <div className="repair-code">
                <strong>{repairData.repairCode}</strong>
              </div>
              <div className="repair-status">
                Status: {repairData.repairStatus}
              </div>
            </div>
          </div>

          <div className="breadcrumb">
            <span className="breadcrumb-item">{companyName}</span>
            <span className="breadcrumb-separator"> • </span>
            <span className="breadcrumb-item">{userName}</span>
          </div>
        </div>

        <div className="page-body">
          <div className="repair-form-container">
            {/* Header della pagina */}
            <div className="page-title">
              <h1>Modifica / Completa Riparazione</h1>
              <p>
                ID: {repairData.repairId} | Creata il:{" "}
                {new Date(repairData.createdAt).toLocaleDateString("it-IT")}
              </p>
            </div>

            {/* Layout principale */}
            <div className="page-container">
              {/* Colonna sinistra */}
              <div className="left-column">
                <div className="top-row">
                  {/* Sezione Cliente */}
                  <div className="form-section">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <h3 style={{ margin: 0 }}>Cliente</h3>
                      <button
                        type="button"
                        className="btn-edit-customer"
                        onClick={openEditCustomerModal}
                        title="Modifica dati cliente"
                      >
                        ✏️ Modifica Cliente
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Cliente Selezionato</label>
                      <div className="selected-customer">
                        <strong>
                          {selectedCustomer?.name || "Nome non disponibile"}
                          {selectedCustomer?.customerType === "Azienda" &&
                            " (Azienda)"}
                        </strong>
                        <small>
                          {selectedCustomer?.email} • {selectedCustomer?.phone}
                          {selectedCustomer?.city &&
                            ` • ${selectedCustomer.city}`}
                          {selectedCustomer?.vatNumber &&
                            ` • P.IVA: ${selectedCustomer.vatNumber}`}
                        </small>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>E-Mail</label>
                      <input
                        type="email"
                        className="form-control"
                        value={clienteData.email}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", color: "#666" }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Nome</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clienteData.nome}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", color: "#666" }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Cognome</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clienteData.cognome}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", color: "#666" }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Telefono</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={clienteData.telefono}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", color: "#666" }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Cap</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clienteData.cap}
                        readOnly
                        style={{ backgroundColor: "#f8f9fa", color: "#666" }}
                      />
                    </div>

                    {/* Informazioni aggiuntive dal sistema */}
                    {selectedCustomer?.address && (
                      <div className="form-group">
                        <label>Indirizzo</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${selectedCustomer.address}, ${selectedCustomer.city} (${selectedCustomer.province})`}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa", color: "#666" }}
                        />
                      </div>
                    )}

                    {selectedCustomer?.fiscalCode && (
                      <div className="form-group">
                        <label>Codice Fiscale</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedCustomer.fiscalCode}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa", color: "#666" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Sezione Dispositivo */}
                  <div className="form-section">
                    <h3>Dispositivo</h3>

                    <div className="form-group">
                      <label>Dispositivo Selezionato</label>
                      <div className="selected-device">
                        <strong>
                          📱 {selectedDevice?.brand} {selectedDevice?.model}
                        </strong>
                        <small>Seriale: {selectedDevice?.serialNumber}</small>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Numero di serie/IMEI *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={dispositivoData.serialNumber}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            serialNumber: e.target.value,
                          })
                        }
                        placeholder="Numero seriale del dispositivo"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Dispositivo *</label>
                      <select
                        className="form-control"
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
                    <div className="form-group">
                      <label>Marca *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={dispositivoData.brand}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            brand: e.target.value,
                          })
                        }
                        placeholder="Marca del dispositivo"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Modello *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={dispositivoData.model}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            model: e.target.value,
                          })
                        }
                        placeholder="Modello del dispositivo"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Colore</label>
                      <input
                        type="text"
                        className="form-control"
                        value={dispositivoData.color}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            color: e.target.value,
                          })
                        }
                        placeholder="Colore del dispositivo"
                      />
                    </div>
                    <div className="form-group">
                      <label>Codice di Sblocco</label>
                      <input
                        type="text"
                        className="form-control"
                        value={dispositivoData.unlockCode}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            unlockCode: e.target.value,
                          })
                        }
                        placeholder="Codice di sblocco"
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefono di cortesia</label>
                      <input
                        type="text"
                        className="form-control"
                        value={dispositivoData.courtesyPhone}
                        onChange={(e) =>
                          setDispositivoData({
                            ...dispositivoData,
                            courtesyPhone: e.target.value,
                          })
                        }
                        placeholder="Telefono di cortesia"
                      />
                    </div>
                  </div>
                </div>

                {/* Sezione Ricambi utilizzati */}
                <div className="form-section parts-section">
                  <h3>Ricambi utilizzati</h3>

                  {/* Search ricambi */}
                  <div className="form-group">
                    <label>Cerca ricambio</label>
                    <input
                      type="text"
                      className="form-control"
                      value={partsQuery}
                      onChange={(e) => searchParts(e.target.value)}
                      placeholder="Codice, nome, marca, modello..."
                    />
                    {partsSearching && <small>Ricerca in corso…</small>}
                  </div>

                  {/* Risultati ricerca */}
                  {partsResults.length > 0 && (
                    <div className="parts-results">
                      {partsResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className="parts-result-item"
                          onClick={() => addPartLine(r)}
                          title={`Disponibili: ${r.quantity}`}
                        >
                          <div className="pri-name">
                            <strong>{r.name}</strong>{" "}
                            <span className="muted">
                              ({r.brand} {r.model})
                            </span>
                          </div>
                          <div className="pri-meta">
                            <span className="code">{r.code}</span>
                            <span
                              className={`stock ${
                                r.quantity <= 0
                                  ? "out"
                                  : r.quantity < 5
                                  ? "low"
                                  : "ok"
                              }`}
                            >
                              {r.quantity <= 0
                                ? "Esaurito"
                                : `Disp: ${r.quantity}`}
                            </span>
                            <span className="price">
                              € {r.unitPrice?.toFixed(2) ?? "0.00"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tabella righe ricambi aggiunti */}
                  <div className="parts-table-container">
                    {usedParts.length === 0 ? (
                      <div className="empty-hint">
                        Nessun ricambio aggiunto. Cerca qui sopra e clicca per
                        aggiungere.
                      </div>
                    ) : (
                      <table className="parts-table">
                        <thead>
                          <tr>
                            <th style={{ width: "140px" }}>Codice</th>
                            <th>Descrizione</th>
                            <th style={{ width: "90px" }}>Q.tà</th>
                            <th style={{ width: "110px" }}>Prezzo</th>
                            <th style={{ width: "110px" }}>Totale</th>
                            <th style={{ width: "60px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {usedParts.map((line) => (
                            <tr key={line.tempId}>
                              <td>
                                <code>{line.code}</code>
                              </td>
                              <td>{line.name}</td>
                              <td>
                                <input
                                  type="number"
                                  min={1}
                                  className="form-control qty-input"
                                  value={line.qty}
                                  onChange={(e) =>
                                    updateLineQty(
                                      line.tempId,
                                      parseInt(e.target.value, 10)
                                    )
                                  }
                                />
                              </td>
                              <td>€ {line.unitPrice.toFixed(2)}</td>
                              <td>
                                <strong>€ {line.lineTotal.toFixed(2)}</strong>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="action-btn btn-delete"
                                  onClick={() => removeLine(line.tempId)}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={4} style={{ textAlign: "right" }}>
                              <strong>Totale ricambi:</strong>
                            </td>
                            <td colSpan={2}>
                              <strong>€ {partsTotal.toFixed(2)}</strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>

                  <div className="parts-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setUsedParts([])}
                    >
                      Svuota righe
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleConsumeFromWarehouse}
                      disabled={usedParts.length === 0}
                      title="Registra lo scarico scorte per questi ricambi"
                    >
                      Scarica da magazzino
                    </button>
                  </div>
                </div>

                {/* Sezione Diagnostica */}
                {/* Sezione Diagnostica */}
                <div className="form-section diagnostica-section">
                  <h3>Sezione diagnostica</h3>
                  <div className="diagnostic-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${
                        diagnosticMode === "incoming" ? "active" : ""
                      }`}
                      onClick={() => setDiagnosticMode("incoming")}
                      title="Diagnostica effettuata all'ingresso"
                    >
                      Ingresso
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${
                        diagnosticMode === "exit" ? "active" : ""
                      }`}
                      onClick={() => setDiagnosticMode("exit")}
                      title="Diagnostica effettuata in uscita"
                    >
                      Uscita
                    </button>
                  </div>

                  <div className="diagnostica-grid">
                    {(diagnosticMode === "incoming"
                      ? incomingDiagnosticItems
                      : exitDiagnosticItems
                    ).map((item) => {
                      const isDisabled =
                        isPhoneOff && item.id !== "telefono-spento";
                      return (
                        <div key={item.id} className="diagnostica-item-wrapper">
                          <div
                            className={`diagnostica-item ${
                              item.active ? "active" : "inactive"
                            } ${isDisabled ? "disabled" : ""}`}
                            onClick={() => {
                              if (!isDisabled) toggleDiagnosticItem(item.id);
                            }}
                            role="button"
                            tabIndex={0}
                            aria-disabled={isDisabled}
                          >
                            <span className="diagnostica-icon">
                              {item.icon}
                            </span>
                            <span
                              className={`diagnostica-status ${
                                item.active ? "ok" : "ko"
                              }`}
                            >
                              {item.active ? "✓" : "—"}
                            </span>
                          </div>
                          <div className="diagnostica-label">{item.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="diagnostic-actions"></div>
                </div>
              </div>

              {/* Colonna destra */}
              <div className="right-column">
                {/* Info riparazione */}
                <div className="auto-generation-info">
                  <div className="form-group">
                    <label>Data e ora di creazione</label>
                    <input
                      type="text"
                      className="form-control"
                      value={new Date(repairData.createdAt).toLocaleString(
                        "it-IT"
                      )}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Cod. scheda</label>
                    <input
                      type="text"
                      className="form-control"
                      value={repairData.repairCode}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Assegnata a *</label>
                    <select
                      className={`form-control ${
                        validationErrors.includes(
                          "Assegnare la riparazione a un tecnico"
                        )
                          ? "error"
                          : ""
                      }`}
                      value={selectedOperator?.id || ""}
                      onChange={(e) => {
                        const operator = operators.find(
                          (op) => op.id === e.target.value
                        );
                        setSelectedOperator(operator || null);
                      }}
                    >
                      <option value="">-- Seleziona Tecnico --</option>
                      {operators.map((operator) => (
                        <option key={operator.id} value={operator.id}>
                          {operator.firstName} {operator.lastName} (
                          {operator.codiceDipendente || "N/A"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status Attuale</label>
                    <input
                      type="text"
                      className="form-control"
                      value={repairData.repairStatus}
                      readOnly
                    />
                  </div>
                </div>

                {/* Sezione Riparazione */}
                <div className="form-section">
                  <h3>Riparazione</h3>

                  {/* Stato riparazione */}
                  <div className="form-group">
                    <label>Stato riparazione *</label>
                    <select
                      className="form-control status-select"
                      value={repairStatusCode}
                      onChange={(e) => setRepairStatusCode(e.target.value)}
                    >
                      <option value="">Tutti gli stati</option>
                      {REPAIR_STATUS.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <small className="hint">
                      Seleziona lo stato corrente della lavorazione.
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Componente/riparazione *</label>
                    <select
                      className={`form-control ${
                        validationErrors.includes(
                          "Selezionare il componente/tipo di riparazione"
                        )
                          ? "error"
                          : ""
                      }`}
                      value={repairComponent}
                      onChange={(e) => setRepairComponent(e.target.value)}
                    >
                      <option value="">-- Seleziona --</option>
                      <option value="Schermo">📱 Schermo</option>
                      <option value="Batteria">🔋 Batteria</option>
                      <option value="Altri Danni">🔧 Altri Danni</option>
                      <option value="Scheda Madre">💾 Scheda Madre</option>
                      <option value="Software">⚙️ Software</option>
                      <option value="Riparazione Completa">
                        🛠️ Riparazione Completa
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Descrizione dell'intervento/problema *</label>
                    <textarea
                      className={`form-control ${
                        validationErrors.includes(
                          "Inserire la descrizione del problema"
                        )
                          ? "error"
                          : ""
                      }`}
                      rows={4}
                      value={repairFormData.faultDeclared}
                      onChange={(e) =>
                        setRepairFormData({
                          ...repairFormData,
                          faultDeclared: e.target.value,
                        })
                      }
                      placeholder="Descrivi il problema riscontrato o l'intervento richiesto..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Azione di riparazione</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={repairFormData.repairAction}
                      onChange={(e) =>
                        setRepairFormData({
                          ...repairFormData,
                          repairAction: e.target.value,
                        })
                      }
                      placeholder="Descrivi le azioni che verranno eseguite..."
                    />
                  </div>
                </div>

                {/* Sezione Prezzo */}
                <div className="form-section">
                  <h3>Prezzo</h3>

                  {/* 🆕 AGGIUNGI: Indicatore caricamento pagamento */}
                  {paymentLoading && (
                    <div className="payment-loading-indicator">
                      <small>⏳ Caricamento dati pagamento...</small>
                    </div>
                  )}

                  {/* 🆕 AGGIUNGI: Info pagamento esistente */}
                  {paymentData?.id && (
                    <div className="payment-info-badge">
                      <small>
                        💰 Pagamento #{paymentData.id} | Totale: €
                        {paymentData.totalAmount.toFixed(2)}
                      </small>
                    </div>
                  )}

                  {/* Importo Ricambi (solo lettura) */}
                  <div className="form-group">
                    <label>Importo Ricambi</label>
                    <div className="price-input-container">
                      <input
                        type="number"
                        className="form-control"
                        value={partsTotal.toFixed(2)}
                        readOnly
                      />
                      <span className="currency-label">€</span>
                    </div>
                  </div>

                  {/* Manodopera (editabile) */}
                  <div className="form-group">
                    <label>Manodopera</label>
                    <div className="price-input-container">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={laborAmount}
                        onChange={(e) => {
                          const v =
                            parseFloat(e.target.value.replace(",", ".")) || 0;
                          setLaborAmount(v);
                          // Aggiorna il PREZZO in avanti: F = 1.22 * (P + L)
                          const newFinal = round2(1.22 * (partsTotal + v));
                          setRepairFormData((prev) => ({
                            ...prev,
                            estimatedPrice: newFinal,
                          }));
                        }}
                        placeholder="0.00"
                      />
                      <span className="currency-label">€</span>
                    </div>
                  </div>

                  {/* IVA 22% (solo lettura) */}
                  <div className="form-group">
                    <label>IVA (22% su Ricambi + Manodopera)</label>
                    <div className="price-input-container">
                      <input
                        type="number"
                        className="form-control"
                        value={vatAmount.toFixed(2)}
                        readOnly
                      />
                      <span className="currency-label">€</span>
                    </div>
                  </div>

                  {/* Totale IVA inclusa (solo lettura, ma rimane nel tuo estimatedPrice) */}
                  <div className="form-group">
                    <label>Prezzo Preventivo IVA inclusa *</label>
                    <div className="price-input-container">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control ${
                          validationErrors.includes(
                            "Inserire un prezzo preventivo valido"
                          )
                            ? "error"
                            : ""
                        }`}
                        value={repairFormData.estimatedPrice}
                        onChange={(e) => {
                          const newFinal =
                            parseFloat(e.target.value.replace(",", ".")) || 0;
                          // 1) aggiorna il prezzo nel form (continui a salvare come prima)
                          setRepairFormData((prev) => ({
                            ...prev,
                            estimatedPrice: newFinal,
                          }));
                          // 2) ricalcola MANODOPERA a ritroso: L = F/1.22 - P
                          const base = newFinal / 1.22;
                          const newLabor = round2(base - partsTotal);
                          setLaborAmount(newLabor); // può risultare anche < 0 (sconto)
                        }}
                        placeholder="0.00"
                      />
                      <span className="currency-label">€</span>
                    </div>
                    <small className="hint">
                      IVA calcolata automaticamente (22%) su Ricambi +
                      Manodopera.
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Tipo di Pagamento</label>
                    <select
                      className="form-control"
                      value={repairFormData.paymentType}
                      onChange={(e) =>
                        setRepairFormData({
                          ...repairFormData,
                          paymentType: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Seleziona --</option>
                      <option value="Contanti">💵 Contanti</option>
                      <option value="Carta di Credito">
                        💳 Carta di Credito
                      </option>
                      <option value="Bancomat">💳 Bancomat</option>
                      <option value="Bonifico">🏦 Bonifico</option>
                      <option value="Amex">💳 American Express</option>
                      <option value="PayPal">💰 PayPal</option>
                      <option value="Altro">📄 Altro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Informazioni per la fatturazione</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={repairFormData.billingInfo}
                      onChange={(e) =>
                        setRepairFormData({
                          ...repairFormData,
                          billingInfo: e.target.value,
                        })
                      }
                      placeholder="Note aggiuntive per la fatturazione..."
                    />
                  </div>
                  {/* Pulsanti Pagamento e Consegna */}
                  <div className="payment-delivery-actions">
                    <button
                      type="button"
                      className="btn btn-payment"
                      onClick={() =>
                        navigate("/consegna-cliente", {
                          state: {
                            repairGuid: repairData.repairGuid,
                            id: repairData.id,
                            repairCode: repairData.repairCode,
                          },
                        })
                      }
                    >
                      💳 Pagamento
                    </button>

                    <button
                      type="button"
                      className="btn btn-delivery"
                      onClick={() => {
                        // Logica per consegna - da definire
                        alert("Funzionalità Consegna in arrivo!");
                      }}
                    >
                      📦 Consegna
                    </button>
                  </div>
                </div>

                {/* Mostra errori di validazione se presenti */}
                {validationErrors.length > 0 && (
                  <div className="validation-errors-container">
                    <h4>⚠️ Errori di validazione:</h4>
                    <ul>
                      {validationErrors.map((error, index) => (
                        <li key={index} className="validation-error">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Bottoni azioni */}
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={handleGoBack}
                disabled={isUpdating}
              >
                Annulla
              </button>

              <button
                className="btn btn-primary"
                onClick={handleUpdateRepair}
                disabled={isUpdating}
              >
                {isUpdating ? "Aggiornando..." : "💾 Salva Modifiche"}
              </button>
            </div>
          </div>
        </div>
        <BottomBar />
      </div>
      {/* 🆕 MODAL MODIFICA CLIENTE */}
      {showEditCustomerModal && (
        <div
          className="modal-overlay-customer"
          onClick={() => setShowEditCustomerModal(false)}
        >
          <div
            className="modal-content-customer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-customer">
              <h4>✏️ Modifica Dati Cliente</h4>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setShowEditCustomerModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body-customer">
              <div className="customer-form-edit">
                {/* Tipo e checkboxes */}
                <div className="form-row-edit">
                  <div className="form-col-3">
                    <label>Tipo</label>
                    <select
                      className="form-control"
                      value={editingCustomer.tipo}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          tipo: e.target.value,
                        })
                      }
                    >
                      <option>Privato</option>
                      <option>Azienda</option>
                    </select>
                  </div>
                  <div className="form-col-3 checkbox-group-edit">
                    <label>
                      <input
                        type="checkbox"
                        checked={editingCustomer.cliente}
                        onChange={(e) =>
                          setEditingCustomer({
                            ...editingCustomer,
                            cliente: e.target.checked,
                          })
                        }
                      />
                      Cliente
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={editingCustomer.fornitore}
                        onChange={(e) =>
                          setEditingCustomer({
                            ...editingCustomer,
                            fornitore: e.target.checked,
                          })
                        }
                      />
                      Fornitore
                    </label>
                  </div>
                </div>

                {/* Ragione Sociale o Nome/Cognome */}
                <div className="form-row-edit">
                  {editingCustomer.tipo === "Azienda" ? (
                    <>
                      <div className="form-col-6">
                        <label>Ragione Sociale *</label>
                        <input
                          className="form-control"
                          value={editingCustomer.ragioneSociale}
                          onChange={(e) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              ragioneSociale: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-col-6">
                        <label>Indirizzo *</label>
                        <input
                          className="form-control"
                          value={editingCustomer.indirizzo}
                          onChange={(e) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              indirizzo: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-col-6 name-group-edit">
                        <div className="form-col-6">
                          <label>Cognome *</label>
                          <input
                            className="form-control"
                            value={editingCustomer.cognome}
                            onChange={(e) =>
                              setEditingCustomer({
                                ...editingCustomer,
                                cognome: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-col-6">
                          <label>Nome *</label>
                          <input
                            className="form-control"
                            value={editingCustomer.nome}
                            onChange={(e) =>
                              setEditingCustomer({
                                ...editingCustomer,
                                nome: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="form-col-6">
                        <label>Indirizzo *</label>
                        <input
                          className="form-control"
                          value={editingCustomer.indirizzo}
                          onChange={(e) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              indirizzo: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* CAP, Regione, Provincia, Città */}
                <div className="form-row-edit">
                  <div className="form-col-3">
                    <label>CAP *</label>
                    <input
                      className="form-control"
                      value={editingCustomer.cap}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          cap: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-col-3">
                    <label>Regione</label>
                    <input
                      className="form-control"
                      value={editingCustomer.regione}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          regione: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-col-3">
                    <label>Provincia</label>
                    <input
                      className="form-control"
                      value={editingCustomer.provincia}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          provincia: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-col-3">
                    <label>Città</label>
                    <input
                      className="form-control"
                      value={editingCustomer.citta}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          citta: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Telefono, Email, CF, P.IVA */}
                <div className="form-row-edit">
                  <div className="form-col-3">
                    <label>Telefono *</label>
                    <input
                      className="form-control"
                      value={editingCustomer.telefono}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          telefono: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-col-3">
                    <label>Email *</label>
                    <input
                      className="form-control"
                      value={editingCustomer.email}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-col-3">
                    <label>Codice Fiscale</label>
                    <input
                      className="form-control"
                      value={editingCustomer.codiceFiscale}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          codiceFiscale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-col-3">
                    <label>Partita IVA</label>
                    <input
                      className="form-control"
                      value={editingCustomer.partitaIva}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          partitaIva: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Email PEC, SDI, IBAN */}
                <div className="form-row-edit">
                  <div className="form-col-3">
                    <label>Email PEC</label>
                    <input
                      className="form-control"
                      value={editingCustomer.emailPec}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          emailPec: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-col-3">
                    <label>Codice SDI</label>
                    <input
                      className="form-control"
                      value={editingCustomer.codiceSdi}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          codiceSdi: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-col-3">
                    <label>IBAN</label>
                    <input
                      className="form-control"
                      value={editingCustomer.iban}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          iban: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-customer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEditCustomerModal(false)}
                disabled={savingCustomer}
              >
                Annulla
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveCustomerChanges}
                disabled={savingCustomer}
              >
                {savingCustomer ? "Salvando..." : "💾 Salva Modifiche"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modifica;
