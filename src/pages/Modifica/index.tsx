import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { CalendarDays, ArrowLeft } from "lucide-react";
import "./modifica-styles.css";

import {
  searchPartsQuick,
  consumeWarehouseLines,
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
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  const location = useLocation();
  const [search] = useSearchParams();

  const navState = (location.state || {}) as {
    repairGuid?: string; // GUID
    id?: number; // id numerico tabella DeviceRepairs
    repairCode?: string;
  };

  const repairGuid = navState.repairGuid || search.get("rid") || "";
  const numericId = navState.id ?? Number(search.get("id") || 0);

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

  // Totale ricambi
  const partsTotal = usedParts.reduce((s, l) => s + l.lineTotal, 0);

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
  const [diagnosticItems] = useState<DiagnosticItem[]>([
    {
      id: "device-info",
      icon: "📱",
      label: "Info sul dispositivo",
      active: true,
    },
    { id: "apple-pay", icon: "💳", label: "Apple Pay", active: true },
    { id: "battery", icon: "🔋", label: "Condizione batteria", active: true },
    { id: "bluetooth", icon: "🔵", label: "Bluetooth", active: true },
    { id: "camera", icon: "📷", label: "Fotocamera", active: true },
    { id: "cellular", icon: "📡", label: "Rete dati cellulare", active: true },
    { id: "clock", icon: "⏰", label: "Orologio", active: true },
    { id: "sim", icon: "📋", label: "SIM", active: true },
    { id: "face-id", icon: "😊", label: "Face ID", active: true },
    { id: "scanner", icon: "📄", label: "Scanner UDID", active: true },
    { id: "magsafe", icon: "🧲", label: "MagSafe", active: true },
    { id: "sensors", icon: "📊", label: "Sensori", active: true },
    { id: "services", icon: "☁️", label: "Servizi", active: true },
    { id: "software", icon: "⚙️", label: "Software", active: true },
    { id: "system", icon: "💻", label: "Sistema", active: true },
    { id: "wifi", icon: "📶", label: "Wi-Fi", active: true },
    { id: "rf-cellular", icon: "🎵", label: "RF cellulare", active: true },
    {
      id: "wireless-problem",
      icon: "⚡",
      label: "Problema wireless",
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

  const deviceTypes = [
    { value: "Mobile", label: "📱 Mobile" },
    { value: "TV", label: "📺 TV" },
    { value: "Other", label: "🔧 Altro" },
  ];

  // Effetti
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

  useEffect(() => {
    if (numericId > 0) {
      loadRepairData(String(numericId));
      loadOperators();
    }
  }, [numericId]);

  const toggleDiagnosticItem = (id: string) => {
    if (diagnosticMode === "incoming") {
      setIncomingDiagnosticItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: !item.active } : item
        )
      );
    } else {
      setExitDiagnosticItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: !item.active } : item
        )
      );
    }
  };

  const loadExistingDiagnostics = async (repairGuid: string) => {
    // Incoming
    try {
      const rIn = await fetch(
        `https://localhost:7148/api/repair/${repairGuid}/incoming-test`,
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
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
      const rEx = await fetch(
        `https://localhost:7148/api/repair/${repairGuid}/exit-test`,
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        }
      );
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
        case "battery":
          isActive = diagnosticData.batteria || false;
          break;
        case "wifi":
          isActive = diagnosticData.wiFi || false;
          break;
        case "face-id":
          isActive = diagnosticData.faceId || false;
          break;
        case "scanner":
          isActive = diagnosticData.touchId || false;
          break;
        case "sensors":
          isActive = diagnosticData.sensoreDiProssimita || false;
          break;
        case "system":
          isActive = diagnosticData.schedaMadre || false;
          break;
        case "cellular":
          isActive = diagnosticData.rete || diagnosticData.chiamata || false;
          break;
        case "camera":
          isActive =
            diagnosticData.fotocameraPosteriore ||
            diagnosticData.fotocameraAnteriore ||
            false;
          break;
        // altri mapping a necessità…
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
      const response = await fetch(`https://localhost:7148/api/repair/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data: RepairData = await response.json();
        setRepairData(data);
        populateFormWithRepairData(data);

        // Carica anche la diagnostica esistente
        await loadExistingDiagnostics(
          repairGuid || data.repairGuid || data.repairId
        );
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

  // const loadExistingDiagnostics = async (repairGuid: string) => {
  //   try {
  //     const response = await fetch(
  //       `https://localhost:7148/api/repair/${repairGuid}/incoming-test`,
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
      telefonoSpento: false,
      batteria: on("battery"),
      wiFi: on("wifi"),
      faceId: on("face-id"),
      touchId: on("scanner"),
      sensoreDiProssimita: on("sensors"),
      schedaMadre: on("system"),
      rete: on("cellular") || on("rf-cellular"),
      chiamata: on("cellular"),
      fotocameraPosteriore: on("camera"),
      fotocameraAnteriore: on("camera"),
      vetroRotto: false,
      touchscreen: false,
      lcd: false,
      frameScollato: false,
      dockDiRicarica: false,
      backCover: false,
      telaio: false,
      tastiVolumeMuto: false,
      tastoStandbyPower: false,
      microfonoChiamate: false,
      microfonoAmbientale: false,
      altoparlantteChiamata: false,
      speakerBuzzer: false,
      vetroFotocameraPosteriore: false,
      tastoHome: false,
      vetroPosteriore: false,
    };
  };

  const buildExitTestDto = (items: { id: string; active: boolean }[]) => {
    const on = (id: string) => items.find((x) => x.id === id)?.active ?? false;

    return {
      telefonoSpento: false,
      batteria: on("battery"),
      wiFi: on("wifi"),
      faceId: on("face-id"),
      touchId: on("scanner"),
      sensoreDiProssimita: on("sensors"),
      schedaMadre: on("system"),
      rete: on("cellular") || on("rf-cellular"),
      chiamata: on("cellular"),
      fotocameraPosteriore: on("camera"),
      fotocameraAnteriore: on("camera"),
      vetroRotto: false,
      touchscreen: false,
      lcd: false,
      frameScollato: false,
      dockDiRicarica: false,
      backCover: false,
      telaio: false,
      tastiVolumeMuto: false,
      tastoStandbyPower: false,
      microfonoChiamate: false,
      microfonoAmbientale: false,
      altoparlantteChiamata: false,
      speakerBuzzer: false,
      vetroFotocameraPosteriore: false,
      tastoHome: false,
      vetroPosteriore: false,
    };
  };

  const upsertIncomingTest = async (
    repairGuid: string,
    items: { id: string; active: boolean }[]
  ) => {
    const dto = buildIncomingTestDto(items);
    console.log("DTO diagnostica ingresso:", dto);
    const res = await fetch(
      `https://localhost:7148/api/repair/${repairGuid}/incoming-test`,
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
    const res = await fetch(
      `https://localhost:7148/api/repair/${repairGuid}/exit-test`,
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
      throw new Error(`Salvataggio exit-test fallito (${res.status}) ${t}`);
    }
  };

  const handleUpdateRepair = async () => {
    if (!repairData) return;

    const validation = validateForm();

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

      console.log("Payload aggiornamento:", payload);

      const response = await fetch(
        `https://localhost:7148/api/repair/${repairData.repairId}`,
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
          await upsertIncomingTest(repairData.repairId, diagnosticItems);
          await upsertExitTest(repairData.repairId, exitDiagnosticItems);
          alert("✅ Riparazione aggiornata con successo!");
        } catch (e: unknown) {
          console.error(e);
          const message = e instanceof Error ? e.message : String(e);
          alert(
            "⚠️ Riparazione aggiornata ma diagnostica NON salvata.\n" + message
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
  //       `https://localhost:7148/api/warehouse/search?q=${encodeURIComponent(
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
  const removeLine = (tempId: string) => {
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
  //     const resp = await fetch(`https://localhost:7148/api/warehouse/consume`, {
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
    if (usedParts.length === 0) return;
    try {
      await consumeWarehouseLines(
        usedParts.map((l) => ({ id: l.warehouseItemId, qty: l.qty }))
      );
      alert("Ricambi scaricati dal magazzino ✅");
    } catch (e) {
      console.error(e);
      alert("Errore nello scarico dal magazzino ❌");
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
            <div className="date-box">
              <CalendarDays className="calendar-icon" />
              <div className="date-text-inline">
                <span>{dateTime.date}</span>
                <span>{dateTime.time}</span>
              </div>
            </div>
          </div>

          <div className="breadcrumb">
            <span className="breadcrumb-item">Roma - Next srl</span>
            <span className="breadcrumb-separator"> &gt; </span>
            <span className="breadcrumb-current">
              Modifica - Completa Riparazione
            </span>
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
                    <h3>Cliente</h3>

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
                      <label>E-Mail *</label>
                      <input
                        type="email"
                        className={`form-control ${
                          validationErrors.includes(
                            "Inserire un'email valida per il cliente"
                          )
                            ? "error"
                            : ""
                        }`}
                        value={clienteData.email}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            email: e.target.value,
                          })
                        }
                        placeholder="Email del cliente"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nome *</label>
                      <input
                        type="text"
                        className={`form-control ${
                          validationErrors.includes(
                            "Inserire il nome del cliente"
                          )
                            ? "error"
                            : ""
                        }`}
                        value={clienteData.nome}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            nome: e.target.value,
                          })
                        }
                        placeholder="Nome del cliente"
                      />
                    </div>

                    <div className="form-group">
                      <label>Cognome *</label>
                      <input
                        type="text"
                        className={`form-control ${
                          validationErrors.includes(
                            "Inserire il cognome del cliente"
                          )
                            ? "error"
                            : ""
                        }`}
                        value={clienteData.cognome}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            cognome: e.target.value,
                          })
                        }
                        placeholder="Cognome del cliente"
                      />
                    </div>

                    <div className="form-group">
                      <label>Telefono *</label>
                      <input
                        type="tel"
                        className={`form-control ${
                          validationErrors.includes(
                            "Inserire il telefono del cliente"
                          )
                            ? "error"
                            : ""
                        }`}
                        value={clienteData.telefono}
                        onChange={(e) =>
                          setClienteData({
                            ...clienteData,
                            telefono: e.target.value,
                          })
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
                          setClienteData({
                            ...clienteData,
                            cap: e.target.value,
                          })
                        }
                        placeholder="CAP"
                      />
                    </div>

                    {/* Informazioni aggiuntive dal sistema */}
                    {selectedCustomer?.address && (
                      <div className="form-group">
                        <label>Indirizzo (dal sistema)</label>
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
                    ).map((item) => (
                      <div key={item.id} className="diagnostica-item-wrapper">
                        <div
                          className={`diagnostica-item ${
                            item.active ? "active" : "inactive"
                          }`}
                          onClick={() => toggleDiagnosticItem(item.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="diagnostica-icon">{item.icon}</span>
                          <span className="diagnostica-status {item.active ? 'ok' : 'ko'}">
                            {item.active ? "✓" : "–"}
                          </span>
                        </div>
                        <div className="diagnostica-label">{item.label}</div>
                      </div>
                    ))}
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
                        onChange={(e) =>
                          setRepairFormData({
                            ...repairFormData,
                            estimatedPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                      <span className="currency-label">€</span>
                    </div>
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
    </div>
  );
};

export default Modifica;
