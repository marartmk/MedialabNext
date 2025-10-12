import React, { useState, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Calendar, Clock } from "lucide-react";
import styles from "./ricerca-note-styles.module.css";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import logoUrl from "../../assets/logo-black-white.jpg";

interface QuickRepairNote {
  id: number;
  noteId: string;
  noteCode: string;
  customerId?: string;
  deviceId?: string;
  companyId: string;
  multitenantId: string;
  ragioneSociale: string;
  cognome: string;
  nome: string;
  telefono: string;
  brand: string;
  model: string;
  codiceRiparazione: string;
  problema: string;
  prezzoPreventivo: number;
  stato: string;
  statoCode: string;
  receivedAt: string;
  createdAt: string;
  createdBy: string;
}

interface DateFilter {
  type: "none" | "today" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}

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

const RicercaNote: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [allData, setAllData] = useState<QuickRepairNote[]>([]);
  const [filteredData, setFilteredData] = useState<QuickRepairNote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stati filtri
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: "none" });
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Stati modal modifica
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNote, setEditNote] = useState<QuickRepairNote | null>(null);

  // Stati form modifica
  const [editCodiceRiparazione, setEditCodiceRiparazione] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editProblema, setEditProblema] = useState("");
  const [editPrezzoPreventivo, setEditPrezzoPreventivo] = useState("");

  // AGGIUNGI QUESTI NUOVI STATI PER LA RICERCA NEL MODAL
  const [editSearchQuery, setEditSearchQuery] = useState("");
  const [editSearchResults, setEditSearchResults] = useState<CustomerData[]>(
    []
  );
  const [editShowDropdown, setEditShowDropdown] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSelectedCustomer, setEditSelectedCustomer] =
    useState<CustomerData | null>(null);

  const [editDeviceSearchQuery, setEditDeviceSearchQuery] = useState("");
  const [editDeviceSearchResults, setEditDeviceSearchResults] = useState<
    DeviceData[]
  >([]);
  const [editShowDeviceDropdown, setEditShowDeviceDropdown] = useState(false);
  const [editDeviceLoading, setEditDeviceLoading] = useState(false);
  const [editSelectedDevice, setEditSelectedDevice] =
    useState<DeviceData | null>(null);

  // Refs per dropdown nel modal
  const editSearchInputRef = useRef<HTMLInputElement>(null);
  const editDropdownRef = useRef<HTMLDivElement>(null);
  const editDeviceSearchInputRef = useRef<HTMLInputElement>(null);
  const editDeviceDropdownRef = useRef<HTMLDivElement>(null);
  const editDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editDeviceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Stati modal dettagli
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<QuickRepairNote | null>(
    null
  );

  // Stati modal stampa
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printNote, setPrintNote] = useState<QuickRepairNote | null>(null);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const columnHelper = createColumnHelper<QuickRepairNote>();

  const columns = [
    columnHelper.accessor("noteCode", {
      header: "Codice Nota",
      cell: (info) => (
        <div className={styles.repairCodeCell}>{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("stato", {
      header: "Stato",
      cell: (info) => {
        const stato = info.getValue();
        const getStatusClass = (status: string) => {
          switch (status.toLowerCase()) {
            case "in attesa":
              return styles.statusPending;
            case "in lavorazione":
              return styles.statusInProgress;
            case "completato":
              return styles.statusCompleted;
            case "ricevuto":
              return styles.statusDelivered;
            default:
              return styles.statusDefault;
          }
        };
        return (
          <div className={`${styles.statusBadge} ${getStatusClass(stato)}`}>
            {stato}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "cliente",
      header: "Cliente",
      cell: (info) => {
        const note = info.row.original;
        return (
          <div className={styles.customerCell}>
            <div className={styles.customerName}>
              {note.cognome} {note.nome}
            </div>
            {note.ragioneSociale && (
              <div className={styles.customerContact}>
                {note.ragioneSociale}
              </div>
            )}
            <div className={styles.customerContact}>📞 {note.telefono}</div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "dispositivo",
      header: "Dispositivo",
      cell: (info) => {
        const note = info.row.original;
        return (
          <div className={styles.deviceCell}>
            <div className={styles.deviceName}>
              📱 {note.brand} {note.model}
            </div>
            <div className={styles.deviceSerial}>{note.codiceRiparazione}</div>
          </div>
        );
      },
    }),
    columnHelper.accessor("problema", {
      header: "Problema",
      cell: (info) => (
        <div className={styles.problemCell}>
          {info.getValue().length > 50
            ? `${info.getValue().substring(0, 50)}...`
            : info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("createdBy", {
      header: "Tecnico",
      cell: (info) => (
        <div className={styles.technicianCell}>
          {info.getValue() || (
            <span className={styles.noData}>Non assegnato</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("receivedAt", {
      header: "Data Accettazione",
      cell: (info) => (
        <div className={styles.dateCell}>
          {info.getValue() ? (
            new Date(info.getValue()).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          ) : (
            <span className={styles.noData}>N/A</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Data Creazione",
      cell: (info) => (
        <div className={styles.dateCell}>
          {new Date(info.getValue()).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Azioni",
      cell: (info) => (
        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionBtn} ${styles.viewBtn}`}
            onClick={() => handleViewNote(info.row.original)}
            title="Visualizza"
          >
            <i className="fa-solid fa-eye"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={() => handleEditNote(info.row.original)}
            title="Modifica"
          >
            <i className="fa-solid fa-edit"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.printBtn}`}
            onClick={() => handlePrintNote(info.row.original)}
            title="Stampa"
          >
            <i className="fa-solid fa-print"></i>
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 15 },
      sorting: [{ id: "createdAt", desc: true }],
    },
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    // Riapplica i filtri quando cambiano i dati o i filtri stessi
    applyFilters();
  }, [statusFilter, globalFilter, dateFilter, allData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Dropdown modal modifica - cliente
      if (
        editDropdownRef.current &&
        !editDropdownRef.current.contains(event.target as Node) &&
        editSearchInputRef.current &&
        !editSearchInputRef.current.contains(event.target as Node)
      ) {
        setEditShowDropdown(false);
      }

      // Dropdown modal modifica - dispositivo
      if (
        editDeviceDropdownRef.current &&
        !editDeviceDropdownRef.current.contains(event.target as Node) &&
        editDeviceSearchInputRef.current &&
        !editDeviceSearchInputRef.current.contains(event.target as Node)
      ) {
        setEditShowDeviceDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem("token");
      const multitenantId = sessionStorage.getItem("IdCompany");

      if (!multitenantId) {
        throw new Error("ID azienda non trovato");
      }

      // Range ultimi 12 mesi per il caricamento iniziale
      const now = new Date();
      const start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      const searchPayload = {
        multitenantId: multitenantId,
        fromDate: start.toISOString(),
        toDate: end.toISOString(),
        // Lascia vuoti gli altri campi per ottenere tutte le note
        statoCode: null,
        stato: null,
        searchTerm: null,
      };

      console.log("🔍 Caricamento note ultimi 12 mesi:", {
        from: start.toISOString(),
        to: end.toISOString(),
      });

      const response = await fetch(
        "https://localhost:7148/api/Repair/quick-note/search",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchPayload),
        }
      );

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Caricate ${data.length} note di riparazione`);

      setAllData(data);
      setFilteredData(data);
    } catch (error: unknown) {
      console.error("❌ Errore nel caricamento delle note:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Errore sconosciuto");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allData];

    if (statusFilter) {
      filtered = filtered.filter(
        (item) =>
          item.stato?.toLowerCase().includes(statusFilter.toLowerCase()) ||
          item.statoCode?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.noteCode?.toLowerCase().includes(searchTerm) ||
          item.cognome?.toLowerCase().includes(searchTerm) ||
          item.nome?.toLowerCase().includes(searchTerm) ||
          item.telefono?.toLowerCase().includes(searchTerm) ||
          item.brand?.toLowerCase().includes(searchTerm) ||
          item.model?.toLowerCase().includes(searchTerm) ||
          item.ragioneSociale?.toLowerCase().includes(searchTerm)
      );
    }

    if (dateFilter.type !== "none") {
      const dateRange = calculateDateRange(dateFilter.type);
      if (dateRange) {
        const { startDate, endDate } = dateRange;
        filtered = filtered.filter((item) => {
          const itemDate = (item.receivedAt || item.createdAt).split("T")[0];
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
    }

    setFilteredData(filtered);
  };

  // const applyLocalFilters = () => {
  //   applyFilters();
  // };

  const calculateDateRange = (filterType: string) => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (filterType) {
      case "today": {
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0
        );
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        );
        break;
      }
      case "week": {
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case "custom":
        if (dateFilter.startDate && dateFilter.endDate) {
          return {
            startDate: dateFilter.startDate,
            endDate: dateFilter.endDate,
          };
        }
        return null;
      default:
        return null;
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const handleDateFilterChange = (filterType: string) => {
    if (filterType === "custom") {
      setShowCustomDateRange(true);
      setDateFilter({ type: "custom" });
    } else {
      setShowCustomDateRange(false);
      setDateFilter({ type: filterType as DateFilter["type"] });
    }
  };

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setDateFilter({
        type: "custom",
        startDate: customStartDate,
        endDate: customEndDate,
      });
      setShowCustomDateRange(false);
    }
  };

  const resetCustomDateRange = () => {
    setCustomStartDate("");
    setCustomEndDate("");
    setShowCustomDateRange(false);
    setDateFilter({ type: "none" });
  };

  const handleViewNote = (note: QuickRepairNote) => {
    // Carica i dettagli della nota tramite API
    loadNoteDetails(note.id);
  };

  const loadNoteDetails = async (noteId: number) => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `https://localhost:7148/api/Repair/quick-note/${noteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const detailData = await response.json();
        setSelectedNote(detailData);
        setShowDetailModal(true);
      } else {
        throw new Error("Errore nel caricamento dei dettagli");
      }
    } catch (error) {
      console.error("Errore nel caricamento dettagli nota:", error);
      alert("Impossibile caricare i dettagli della nota");
    }
  };

  const handleEditNote = (note: QuickRepairNote) => {
    setEditNote(note);
    setEditCodiceRiparazione(note.codiceRiparazione || "");
    setEditTelefono(note.telefono || "");
    setEditProblema(note.problema || "");
    setEditPrezzoPreventivo(note.prezzoPreventivo?.toString() || "");

    // Inizializza campi di ricerca
    setEditSearchQuery(`${note.cognome} ${note.nome}`.trim());
    setEditDeviceSearchQuery(`${note.brand} ${note.model}`.trim());

    // Reset stati di ricerca
    setEditSelectedCustomer(null);
    setEditSelectedDevice(null);
    setEditSearchResults([]);
    setEditDeviceSearchResults([]);

    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editNote) return;

    // Validazione
    if (!editProblema.trim()) {
      alert("Inserisci la descrizione del problema!");
      return;
    }
    if (!editPrezzoPreventivo || parseFloat(editPrezzoPreventivo) <= 0) {
      alert("Inserisci un prezzo preventivo valido!");
      return;
    }

    // Estrai dati dispositivo
    let brand = editNote.brand;
    let model = editNote.model;
    let deviceId = editNote.deviceId;

    if (editSelectedDevice) {
      // Caso 1: Ho selezionato un dispositivo dalla ricerca
      brand = editSelectedDevice.brand;
      model = editSelectedDevice.model;
      deviceId = editSelectedDevice.deviceId;
    } else if (
      editDeviceSearchQuery.trim() &&
      editDeviceSearchQuery !== `${editNote.brand} ${editNote.model}`
    ) {
      // Caso 2: Ho modificato manualmente il dispositivo -> deviceId deve essere NULL
      const parts = editDeviceSearchQuery.trim().split(" ");
      if (parts.length >= 2) {
        brand = parts[0];
        model = parts.slice(1).join(" ");
      } else {
        brand = editDeviceSearchQuery.trim();
        model = "Non specificato";
      }
      deviceId = undefined; // ⭐ IMPORTANTE: NULL perché non è associato
    }
    // Caso 3: Non ho toccato nulla -> mantieni i valori originali

    // Estrai dati cliente
    let cognome = editNote.cognome;
    let nome = editNote.nome;
    let customerId = editNote.customerId;
    let ragioneSociale = editNote.ragioneSociale;

    if (editSelectedCustomer) {
      // Caso 1: Ho selezionato un cliente dalla ricerca
      cognome = editSelectedCustomer.cognome;
      nome = editSelectedCustomer.nome;
      customerId = editSelectedCustomer.id;
      ragioneSociale = editSelectedCustomer.ragioneSociale;
    } else if (
      editSearchQuery.trim() &&
      editSearchQuery !== `${editNote.cognome} ${editNote.nome}`.trim() &&
      editSearchQuery !== editNote.ragioneSociale
    ) {
      // Caso 2: Ho modificato manualmente il cliente -> customerId deve essere NULL
      const parts = editSearchQuery.trim().split(" ");
      cognome = parts[0] || "";
      nome = parts.slice(1).join(" ") || "";
      ragioneSociale = ""; // Reset ragione sociale se è un nuovo cliente manuale
      customerId = undefined; // ⭐ IMPORTANTE: NULL perché non è associato
    }
    // Caso 3: Non ho toccato nulla -> mantieni i valori originali

    const updateData = {
      id: editNote.id,
      noteCode: editNote.noteCode,
      deviceId: deviceId, // Può essere null se modificato manualmente
      customerId: customerId, // Può essere null se modificato manualmente
      companyId: editNote.companyId,
      multitenantId: editNote.multitenantId,
      brand: brand,
      model: model,
      ragioneSociale: ragioneSociale,
      cognome: cognome,
      nome: nome,
      telefono: editTelefono,
      codiceRiparazione: editCodiceRiparazione,
      problema: editProblema,
      prezzoPreventivo: parseFloat(editPrezzoPreventivo),
      stato: editNote.stato,
      statoCode: editNote.statoCode,
      receivedAt: editNote.receivedAt,
      createdAt: editNote.createdAt,
      createdBy: editNote.createdBy,
    };

    console.log("Dati aggiornati:", JSON.stringify(updateData, null, 2));

    try {
      const response = await fetch(
        `https://localhost:7148/api/Repair/quick-note/${editNote.noteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        alert("✅ Nota aggiornata con successo!");
        setShowEditModal(false);
        setEditNote(null);
        // Reset stati di ricerca
        setEditSelectedCustomer(null);
        setEditSelectedDevice(null);
        setEditSearchResults([]);
        setEditDeviceSearchResults([]);
        fetchNotes();
      } else {
        const errorData = await response.json();
        alert(
          `❌ Errore nell'aggiornamento: ${
            errorData.message || "Errore sconosciuto"
          }`
        );
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      alert("❌ Errore di connessione al server.");
    }
  };

  const handlePrintNote = (note: QuickRepairNote) => {
    setPrintNote(note);
    setShowPrintModal(true);
  };

  const companyName =
    (typeof window !== "undefined" && sessionStorage.getItem("companyName")) ||
    "CLINICA iPHONE STORE";
  const companyAddr =
    (typeof window !== "undefined" && sessionStorage.getItem("companyAddr")) ||
    "Indirizzo, CAP Città (PR)";
  const companyVat =
    (typeof window !== "undefined" && sessionStorage.getItem("companyVat")) ||
    "P.IVA 00000000000";
  const companyPhone =
    (typeof window !== "undefined" && sessionStorage.getItem("companyPhone")) ||
    "+39 000 000 0000";
  const logoUrlPage =
    (typeof window !== "undefined" &&
      sessionStorage.getItem("companyLogoUrl")) ||
    logoUrl;

  // === STAMPA NOTA: identica a Ricerca Schede ===
  const handlePrintNoteDocument = async () => {
    try {
      await new Promise((r) => setTimeout(r, 200)); // attesa per render del modal

      const printContent = document.querySelector(
        `.${styles.accSheet}`
      ) as HTMLElement | null;

      if (!printContent) {
        alert("Errore: impossibile trovare il contenuto da stampare");
        return;
      }

      const w = window.open("", "_blank", "width=800,height=600");
      if (!w) {
        alert("Impossibile aprire la finestra di stampa. Abilita i popup.");
        return;
      }

      // Copia TUTTI i CSS della pagina (link + style)
      const cssLinks = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]')
      )
        .map(
          (lnk) =>
            `<link rel="stylesheet" href="${(lnk as HTMLLinkElement).href}">`
        )
        .join("");
      const cssStyles = Array.from(document.querySelectorAll("style"))
        .map((st) => st.outerHTML)
        .join("");

      // HTML identico alla stampa di Ricerca Schede (wrapper .print-content)
      const html = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Nota ${printNote?.noteCode || ""}</title>
        ${cssLinks}${cssStyles}
        <style>
          @media print {
            * { visibility: hidden !important; box-sizing: border-box !important; }
            .print-content, .print-content * { visibility: visible !important; }
            .print-content {
              position: absolute !important; left: 0 !important; top: 0 !important;
              width: 100% !important; margin: 0 !important; padding: 5mm !important;
              background: white !important; border: none !important; box-shadow: none !important; border-radius: 0 !important;
              font-size: 10px !important; line-height: 1.2 !important; color: #000 !important; overflow: hidden !important;
            }
            @page { size: A4 portrait; margin: 10mm 8mm; }
          }
          @media screen {
            body { margin: 0; padding: 20px; background: #f5f5f5; font-family: -apple-system,BlinkMacSystemFont,sans-serif; }
            .print-content { max-width: 210mm; margin: 0 auto; background: #fff; padding: 32px;
              box-shadow: 0 4px 20px rgba(0,0,0,.15); border-radius: 8px; font-size: 13px; line-height: 1.4; color: #2c3e50; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-content">
          ${printContent.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 800); }, 400);
          };
        </script>
      </body>
      </html>
    `;

      w.document.write(html);
      w.document.close();
      w.focus();
    } catch (err) {
      console.error(err);
      alert("Si è verificato un errore durante la preparazione della stampa.");
    }
  };

  const fmt = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("it-IT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  console.log("fmt", fmt("2024-06-25T14:30:00Z"));

  const statusClass = (s?: string) => {
    if (!s) return styles.statusDefault;
    switch ((s || "").toLowerCase()) {
      case "in attesa":
        return styles.statusPending;
      case "in lavorazione":
        return styles.statusInProgress;
      case "completato":
        return styles.statusCompleted;
      case "ricevuto":
        return styles.statusDelivered;
      default:
        return styles.statusDefault;
    }
  };

  // Ricerca cliente nel modal - con debouncing
  const handleEditSearchChange = (value: string) => {
    setEditSearchQuery(value);

    if (editDebounceRef.current) {
      clearTimeout(editDebounceRef.current);
    }

    if (!value.trim()) {
      setEditShowDropdown(false);
      setEditSearchResults([]);
      return;
    }

    editDebounceRef.current = setTimeout(() => {
      performEditSearch(value);
    }, 300);
  };

  const performEditSearch = async (query: string) => {
    if (!query.trim()) return;

    setEditLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      const response = await fetch(
        `https://localhost:7148/api/customer/search?query=${encodeURIComponent(
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
        setEditSearchResults(data);
        setEditShowDropdown(true);
      } else {
        setEditSearchResults([]);
      }
    } catch (error) {
      console.error("Errore durante la ricerca cliente:", error);
      setEditSearchResults([]);
    } finally {
      setEditLoading(false);
    }
  };

  const onEditSelectCustomer = (customer: CustomerData) => {
    setEditSelectedCustomer(customer);
    setEditSearchQuery(customer.ragioneSociale);
    setEditTelefono(customer.telefono);
    setEditShowDropdown(false);
  };

  const clearEditSelection = () => {
    setEditSelectedCustomer(null);
    setEditSearchQuery("");
  };

  // Ricerca dispositivo nel modal - con debouncing
  const handleEditDeviceSearchChange = (value: string) => {
    setEditDeviceSearchQuery(value);

    if (editDeviceDebounceRef.current) {
      clearTimeout(editDeviceDebounceRef.current);
    }

    if (!value.trim()) {
      setEditShowDeviceDropdown(false);
      setEditDeviceSearchResults([]);
      return;
    }

    editDeviceDebounceRef.current = setTimeout(() => {
      performEditDeviceSearch(value);
    }, 300);
  };

  const performEditDeviceSearch = async (query: string) => {
    if (!query.trim()) return;

    setEditDeviceLoading(true);
    const multitenantId = sessionStorage.getItem("IdCompany");

    try {
      const response = await fetch(
        `https://localhost:7148/api/device/search?query=${encodeURIComponent(
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
        setEditDeviceSearchResults(data);
        setEditShowDeviceDropdown(true);
      } else {
        setEditDeviceSearchResults([]);
      }
    } catch (error) {
      console.error("Errore durante la ricerca dispositivo:", error);
      setEditDeviceSearchResults([]);
    } finally {
      setEditDeviceLoading(false);
    }
  };

  const onEditSelectDevice = (device: DeviceData) => {
    setEditSelectedDevice(device);
    setEditDeviceSearchQuery(
      `${device.brand} ${device.model} - ${device.serialNumber}`
    );
    setEditShowDeviceDropdown(false);
  };

  const clearEditDeviceSelection = () => {
    setEditSelectedDevice(null);
    setEditDeviceSearchQuery("");
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
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />

      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className={styles.schedaHeader}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Roma - Next srl</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>Ricerca Note</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          {/* Tabella Note */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>🔍 Ricerca Note di Riparazione</h3>
              <div className={styles.tableHeaderInfo}>
                {allData.length > 0 && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: "normal",
                    }}
                  >
                    {filteredData.length === allData.length
                      ? `Totale: ${allData.length} note`
                      : `Filtrate: ${filteredData.length}/${allData.length} note`}
                  </div>
                )}
              </div>
              <div className={styles.tableControls}>
                {/* Filtro per stato */}
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tutti gli stati</option>
                  <option value="Ricevuto">📥 Ricevuto</option>
                  <option value="In Attesa">⏳ In Attesa</option>
                  <option value="In Lavorazione">🔧 In Lavorazione</option>
                  <option value="Completato">✅ Completato</option>
                </select>

                {/* Filtro Temporale */}
                <div className={styles.dateFilterContainer}>
                  <Calendar className={styles.dateFilterIcon} />
                  <select
                    className={styles.dateFilterSelect}
                    value={dateFilter.type}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                  >
                    <option value="none">Tutte le date</option>
                    <option value="today">📅 Oggi</option>
                    <option value="week">📊 Questa settimana</option>
                    <option value="month">🗓️ Questo mese</option>
                    <option value="year">🗓️ Quest'anno</option>
                    <option value="custom">🎯 Range personalizzato</option>
                  </select>
                </div>

                {/* Campo di ricerca globale */}
                <div className={styles.searchContainerTable}>
                  <i className="fa-solid fa-magnifying-glass search-icon-table"></i>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchInput(value);
                      if (value.length >= 3 || value.length === 0) {
                        setGlobalFilter(value);
                      }
                    }}
                    className={styles.searchTableInput}
                    placeholder="Cerca per codice, cliente, telefono..."
                  />
                </div>
              </div>
            </div>

            {/* Range personalizzato per le date */}
            {showCustomDateRange && (
              <div className={styles.customDateRangeContainer}>
                <div className={styles.customDateRangeContent}>
                  <div className={styles.customDateRangeHeader}>
                    <Clock className={styles.clockIcon} />
                    <h4>Seleziona Range Personalizzato</h4>
                  </div>
                  <div className={styles.dateInputsRow}>
                    <div className={styles.dateInputGroup}>
                      <label>Data inizio:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={styles.dateInput}
                      />
                    </div>
                    <div className={styles.dateInputGroup}>
                      <label>Data fine:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={styles.dateInput}
                      />
                    </div>
                  </div>
                  <div className={styles.customDateRangeButtons}>
                    <button
                      onClick={applyCustomDateRange}
                      className={styles.applyDateBtn}
                      disabled={!customStartDate || !customEndDate}
                    >
                      ✅ Applica Filtro
                    </button>
                    <button
                      onClick={resetCustomDateRange}
                      className={styles.resetDateBtn}
                    >
                      🔄 Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Indicatori filtri attivi */}
            {(statusFilter || dateFilter.type !== "none" || globalFilter) && (
              <div className={styles.activeFiltersContainer}>
                <div className={styles.activeFiltersHeader}>
                  <span>🏷️ Filtri attivi:</span>
                </div>
                <div className={styles.activeFilterTags}>
                  {statusFilter && (
                    <div className={styles.filterTag}>
                      <span>Stato: {statusFilter}</span>
                      <button onClick={() => setStatusFilter("")}>×</button>
                    </div>
                  )}
                  {dateFilter.type !== "none" && (
                    <div className={styles.filterTag}>
                      <span>
                        Periodo:{" "}
                        {dateFilter.type === "custom"
                          ? `${dateFilter.startDate} - ${dateFilter.endDate}`
                          : {
                              today: "Oggi",
                              week: "Questa settimana",
                              month: "Questo mese",
                              year: "Quest'anno",
                            }[dateFilter.type]}
                      </span>
                      <button onClick={() => setDateFilter({ type: "none" })}>
                        ×
                      </button>
                    </div>
                  )}
                  {globalFilter && (
                    <div className={styles.filterTag}>
                      <span>Ricerca: "{globalFilter}"</span>
                      <button
                        onClick={() => {
                          setGlobalFilter("");
                          setSearchInput("");
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span>Caricamento riparazioni...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className={styles.errorContainer}>
                <i className="fa-solid fa-exclamation-triangle"></i>
                <span>Errore: {error}</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredData.length === 0 && (
              <div className={styles.emptyState}>
                <h4>Nessuna nota trovata</h4>
                <p>
                  {allData.length > 0
                    ? "Non ci sono note che corrispondono ai criteri di ricerca selezionati."
                    : "Non ci sono note disponibili."}
                </p>
              </div>
            )}

            {/* Tabella */}
            {!loading && !error && filteredData.length > 0 && (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table className={styles.modernTable}>
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                <span className={styles.sortIndicator}>
                                  {{ asc: "▲", desc: "▼" }[
                                    header.column.getIsSorted() as string
                                  ] ?? "⇅"}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginazione */}
                <div className={styles.paginationContainer}>
                  <div className={styles.paginationInfo}>
                    Mostrando{" "}
                    <strong>
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}
                    </strong>{" "}
                    -{" "}
                    <strong>
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        filteredData.length
                      )}
                    </strong>{" "}
                    di <strong>{filteredData.length}</strong> note
                  </div>
                  <div className={styles.paginationControls}>
                    <button
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      className={styles.paginationBtn}
                      title="Prima pagina"
                    >
                      ⟪
                    </button>
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className={styles.paginationBtn}
                      title="Pagina precedente"
                    >
                      ‹
                    </button>
                    <span className={styles.paginationInfoText}>
                      Pagina{" "}
                      <strong>
                        {table.getState().pagination.pageIndex + 1}
                      </strong>{" "}
                      di <strong>{table.getPageCount()}</strong>
                    </span>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className={styles.paginationBtn}
                      title="Pagina successiva"
                    >
                      ›
                    </button>
                    <button
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
                      disabled={!table.getCanNextPage()}
                      className={styles.paginationBtn}
                      title="Ultima pagina"
                    >
                      ⟫
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <BottomBar />
        {/* ===================== MODAL: RIEPILOGO NOTA ===================== */}
        {showDetailModal && selectedNote && (
          <div
            className={styles.modalOverlay}
            onClick={(e) =>
              e.target === e.currentTarget &&
              (setShowDetailModal(false), setSelectedNote(null))
            }
          >
            <div
              className={styles.detailModal}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleSection}>
                  <h2>📄 Riepilogo Nota</h2>
                  <div className={styles.codeAndStatus}>
                    <div className={styles.detailCode}>
                      {selectedNote.noteCode}
                    </div>
                    <span
                      className={`${styles.statusBadge} ${statusClass(
                        selectedNote.stato
                      )}`}
                    >
                      {selectedNote.stato}
                    </span>
                  </div>
                </div>

                <button
                  className={styles.detailCloseBtn}
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedNote(null);
                  }}
                  aria-label="Chiudi"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className={styles.detailBody}>
                <div className={styles.detailContent}>
                  {/* Cliente */}
                  <div className={styles.detailSection}>
                    <h3>INFORMAZIONI DEL CLIENTE</h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailField}>
                        <label>Cliente:</label>
                        <span>
                          {selectedNote.cognome} {selectedNote.nome}
                        </span>
                      </div>
                      {selectedNote.ragioneSociale && (
                        <div className={styles.detailField}>
                          <label>Ragione Sociale:</label>
                          <span>{selectedNote.ragioneSociale}</span>
                        </div>
                      )}
                      <div className={styles.detailField}>
                        <label>Telefono:</label>
                        <span>{selectedNote.telefono || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispositivo */}
                  <div className={styles.detailSection}>
                    <h3>DATI DEL DISPOSITIVO</h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailField}>
                        <label>Marca e Modello:</label>
                        <span>
                          {selectedNote.brand} {selectedNote.model}
                        </span>
                      </div>
                      <div className={styles.detailField}>
                        <label>Codice Riparazione:</label>
                        <span>{selectedNote.codiceRiparazione}</span>
                      </div>
                      <div className={styles.detailField}>
                        <label>Stato:</label>
                        <span>{selectedNote.stato}</span>
                      </div>
                      {selectedNote.createdBy && (
                        <div className={styles.detailField}>
                          <label>Tecnico Assegnato:</label>
                          <span>{selectedNote.createdBy}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Problema */}
                  <div className={styles.detailSection}>
                    <h3>DESCRIZIONE DEL PROBLEMA</h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailField}>
                        <label>Problema:</label>
                        <span>
                          {selectedNote.problema ||
                            "Nessuna descrizione fornita"}
                        </span>
                      </div>
                      {typeof selectedNote.prezzoPreventivo === "number" && (
                        <div className={styles.detailField}>
                          <label>Prezzo preventivo:</label>
                          <span>
                            € {selectedNote.prezzoPreventivo.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preventivo */}
                  <div className={styles.detailPreventivo}>
                    <h4>PREVENTIVO</h4>
                    <table className={styles.detailPreventivoTable}>
                      <thead>
                        <tr>
                          <th>Descrizione Intervento</th>
                          <th style={{ width: "80px", textAlign: "center" }}>
                            Q.tà
                          </th>
                          <th style={{ width: "120px", textAlign: "right" }}>
                            Importo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Diagnosi e preventivo riparazione</td>
                          <td style={{ textAlign: "center" }}>1</td>
                          <td style={{ textAlign: "right" }}>€ 0,00</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2}>TOTALE</td>
                          <td style={{ textAlign: "right" }}>€ 0,00</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={styles.detailFooter}>
                <button
                  className={styles.detailCloseBtn}
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedNote(null);
                  }}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MODAL: STAMPA NOTA (LIGHT) ===================== */}
        {showPrintModal && printNote && (
          <div
            className={styles.accOverlay}
            onClick={(e) =>
              e.target === e.currentTarget &&
              (setShowPrintModal(false), setPrintNote(null))
            }
          >
            <div
              className={styles.accModal}
              onClick={(e) => e.stopPropagation()}
            >
              {/* AREA CHE SI STAMPA */}
              <div className={styles.accSheet}>
                {/* Header professionale con logo */}
                <div className={styles.accHeaderPro}>
                  {/* Colonna sinistra - Dati azienda */}
                  <div className={styles.accLogoSection}>
                    <div className={styles.accLogo}>
                      <img
                        src={logoUrlPage}
                        alt="Logo"
                        className={styles.accLogoImage}
                      />
                      <div className={styles.accLogoText}>
                        <div className={styles.accCompanyTagline}>
                          ASSISTENZA TECNICA
                        </div>
                      </div>
                    </div>
                    <div className={styles.accCompanyDetails}>
                      <div>{companyName}</div>
                      <div>Città - AZIENDA</div>
                      <div>{companyAddr}</div>
                      <div>Tel. {companyPhone}</div>
                      <div>{companyVat}</div>
                    </div>
                  </div>

                  {/* Colonna destra - Dati documento */}
                  <div className={styles.accDocSection}>
                    <h1 className={styles.accDocTitle}>Modulo Nota</h1>
                    <div className={styles.accDocInfo}>
                      <div>
                        <strong>Numero Nota:</strong> {printNote.noteCode}
                      </div>
                      <div>
                        <strong>Data:</strong>{" "}
                        {new Date(printNote.createdAt || "").toLocaleDateString(
                          "it-IT"
                        )}{" "}
                        {new Date(printNote.createdAt || "").toLocaleTimeString(
                          "it-IT",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                      <div>
                        <strong>Stato:</strong> {printNote.stato}
                      </div>
                      {printNote.createdBy && (
                        <div>
                          <strong>Tecnico:</strong> {printNote.createdBy}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <hr className={styles.accDivider} />

                {/* Dati cliente / dispositivo */}
                <div className={styles.accInfoGrid}>
                  <div className={styles.accInfoSection}>
                    <div className={styles.accSectionTitle}>
                      INFORMAZIONI DEL CLIENTE
                    </div>
                    <div className={styles.accInfoRows}>
                      <div className={styles.accInfoRow}>
                        <span className={styles.accLabel}>Cliente:</span>
                        <span className={styles.accValue}>
                          {printNote.cognome} {printNote.nome}
                        </span>
                      </div>

                      {printNote.ragioneSociale && (
                        <div className={styles.accInfoRow}>
                          <span className={styles.accLabel}>
                            Ragione Sociale:
                          </span>
                          <span className={styles.accValue}>
                            {printNote.ragioneSociale}
                          </span>
                        </div>
                      )}

                      <div className={styles.accInfoRow}>
                        <span className={styles.accLabel}>Telefono:</span>
                        <span className={styles.accValue}>
                          {printNote.telefono || "Non specificato"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.accInfoSection}>
                    <div className={styles.accSectionTitle}>
                      DATI DEL DISPOSITIVO
                    </div>
                    <div className={styles.accInfoRows}>
                      <div className={styles.accInfoRow}>
                        <span className={styles.accLabel}>
                          Marca e Modello:
                        </span>
                        <span className={styles.accValue}>
                          {printNote.brand} {printNote.model}
                        </span>
                      </div>
                      <div className={styles.accInfoRow}>
                        <span className={styles.accLabel}>
                          Codice Riparazione:
                        </span>
                        <span className={styles.accValue}>
                          {printNote.codiceRiparazione}
                        </span>
                      </div>
                      <div className={styles.accInfoRow}>
                        <span className={styles.accLabel}>Stato:</span>
                        <span className={styles.accValue}>
                          {printNote.stato}
                        </span>
                      </div>
                      {printNote.createdBy && (
                        <div className={styles.accInfoRow}>
                          <span className={styles.accLabel}>
                            Tecnico Assegnato:
                          </span>
                          <span className={styles.accValue}>
                            {printNote.createdBy}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descrizione problema */}
                <div className={styles.accProblemSection}>
                  <div className={styles.accSectionTitle}>
                    DESCRIZIONE DEL PROBLEMA
                  </div>
                  <div className={styles.accProblemText}>
                    {printNote.problema || "Nessuna descrizione fornita"}
                  </div>
                  {typeof printNote.prezzoPreventivo === "number" && (
                    <div className={styles.accNotesText}>
                      <strong>Prezzo preventivo:</strong> €{" "}
                      {printNote.prezzoPreventivo.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Tabella preventivo (layout identico) */}
                <div className={styles.accTableSection}>
                  <div className={styles.accSectionTitle}>PREVENTIVO</div>
                  <table className={styles.accTable}>
                    <thead>
                      <tr>
                        <th className={styles.accTableHeader}>
                          Descrizione Intervento
                        </th>
                        <th
                          className={styles.accTableHeader}
                          style={{ width: "80px", textAlign: "center" }}
                        >
                          Q.tà
                        </th>
                        <th
                          className={styles.accTableHeader}
                          style={{ width: "120px", textAlign: "right" }}
                        >
                          Importo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={styles.accTableCell}>
                          Diagnosi e preventivo riparazione
                        </td>
                        <td
                          className={styles.accTableCell}
                          style={{ textAlign: "center" }}
                        >
                          1
                        </td>
                        <td
                          className={styles.accTableCell}
                          style={{ textAlign: "right" }}
                        >
                          € 0,00
                        </td>
                      </tr>
                      <tr>
                        <td className={styles.accTableCell} colSpan={2}>
                          <strong>TOTALE</strong>
                        </td>
                        <td
                          className={styles.accTableCell}
                          style={{ textAlign: "right" }}
                        >
                          <strong>€ 0,00</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className={styles.accFooter}>
                  <div className={styles.accFooterText}>
                    Documento generato automaticamente dal sistema di gestione
                    riparazioni - {companyName}
                  </div>
                </div>
              </div>

              {/* Azioni (non stampate) */}
              <div className={styles.accActions}>
                <button
                  className={styles.accBtnSecondary}
                  onClick={() => {
                    setShowPrintModal(false);
                    setPrintNote(null);
                  }}
                >
                  ✕ Chiudi
                </button>
                <button
                  className={styles.accBtnPrimary}
                  onClick={handlePrintNoteDocument}
                >
                  🖨️ Stampa Documento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MODAL: MODIFICA NOTA ===================== */}
        {showEditModal && editNote && (
          <div
            className={styles.editModalOverlay}
            onClick={(e) =>
              e.target === e.currentTarget &&
              (setShowEditModal(false), setEditNote(null))
            }
          >
            <div
              className={styles.editModalContainer}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={styles.editModalHeader}>
                <h2>Modifica Nota Riparazione</h2>
                <button
                  className={styles.editModalCloseBtn}
                  onClick={() => {
                    setShowEditModal(false);
                    setEditNote(null);
                  }}
                  aria-label="Chiudi"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className={styles.editModalBody}>
                {/* Info non modificabili */}
                <div className={styles.editInfoSection}>
                  <div className={styles.editInfoRow}>
                    <span className={styles.editInfoLabel}>Codice Nota:</span>
                    <span className={styles.editInfoValue}>
                      {editNote.noteCode}
                    </span>
                  </div>
                  <div className={styles.editInfoRow}>
                    <span className={styles.editInfoLabel}>
                      Data Creazione:
                    </span>
                    <span className={styles.editInfoValue}>
                      {new Date(editNote.createdAt).toLocaleString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Form campi modificabili */}
                <div className={styles.editFormSection}>
                  {/* Riga doppia: Dispositivo e Cliente */}
                  <div className={styles.editFormRowDouble}>
                    {/* DISPOSITIVO CON RICERCA */}
                    <div className={styles.editFormField}>
                      <label>Dispositivo</label>
                      <div className={styles.editSearchContainer}>
                        <input
                          ref={editDeviceSearchInputRef}
                          type="text"
                          className={styles.editFormControl}
                          placeholder="Cerca dispositivo..."
                          value={editDeviceSearchQuery}
                          onChange={(e) =>
                            handleEditDeviceSearchChange(e.target.value)
                          }
                          onFocus={() => {
                            if (editDeviceSearchResults.length > 0) {
                              setEditShowDeviceDropdown(true);
                            }
                          }}
                        />

                        {editSelectedDevice && (
                          <button
                            type="button"
                            className={styles.editClearBtn}
                            onClick={clearEditDeviceSelection}
                          >
                            ×
                          </button>
                        )}

                        {editDeviceLoading && (
                          <div className={styles.editLoadingIndicator}>
                            <div className={styles.editSpinner}></div>
                          </div>
                        )}

                        {editShowDeviceDropdown &&
                          editDeviceSearchResults.length > 0 && (
                            <div
                              ref={editDeviceDropdownRef}
                              className={styles.editDropdown}
                            >
                              {editDeviceSearchResults.map((device) => (
                                <div
                                  key={device.id}
                                  className={styles.editDropdownItem}
                                  onClick={() => onEditSelectDevice(device)}
                                >
                                  <strong>
                                    {getDeviceIcon(device.deviceType)}{" "}
                                    {device.brand} {device.model}
                                  </strong>
                                  <small>Seriale: {device.serialNumber}</small>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* CLIENTE CON RICERCA */}
                    <div className={styles.editFormField}>
                      <label>Cliente</label>
                      <div className={styles.editSearchContainer}>
                        <input
                          ref={editSearchInputRef}
                          type="text"
                          className={styles.editFormControl}
                          placeholder="Cerca cliente..."
                          value={editSearchQuery}
                          onChange={(e) =>
                            handleEditSearchChange(e.target.value)
                          }
                          onFocus={() => {
                            if (editSearchResults.length > 0) {
                              setEditShowDropdown(true);
                            }
                          }}
                        />

                        {editSelectedCustomer && (
                          <button
                            type="button"
                            className={styles.editClearBtn}
                            onClick={clearEditSelection}
                          >
                            ×
                          </button>
                        )}

                        {editLoading && (
                          <div className={styles.editLoadingIndicator}>
                            <div className={styles.editSpinner}></div>
                          </div>
                        )}

                        {editShowDropdown && editSearchResults.length > 0 && (
                          <div
                            ref={editDropdownRef}
                            className={styles.editDropdown}
                          >
                            {editSearchResults.map((customer) => (
                              <div
                                key={customer.id}
                                className={styles.editDropdownItem}
                                onClick={() => onEditSelectCustomer(customer)}
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
                    </div>
                  </div>

                  {/* Riga tripla: Codice, Telefono, Prezzo */}
                  <div className={styles.editFormRowTriple}>
                    <div className={styles.editFormField}>
                      <label>Codice di Sblocco</label>
                      <input
                        type="text"
                        className={styles.editFormControl}
                        value={editCodiceRiparazione}
                        onChange={(e) =>
                          setEditCodiceRiparazione(e.target.value)
                        }
                        placeholder="Inserisci codice..."
                      />
                    </div>

                    <div className={styles.editFormField}>
                      <label>Telefono</label>
                      <input
                        type="tel"
                        className={styles.editFormControl}
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                        placeholder="+39 334 5918481"
                      />
                    </div>

                    <div className={styles.editFormField}>
                      <label>Prezzo Preventivo IVA inclusa</label>
                      <div className={styles.editPriceInput}>
                        <input
                          type="number"
                          step="0.01"
                          className={styles.editFormControl}
                          value={editPrezzoPreventivo}
                          onChange={(e) =>
                            setEditPrezzoPreventivo(e.target.value)
                          }
                          placeholder="399.00"
                        />
                        <span className={styles.editCurrency}>€</span>
                      </div>
                    </div>
                  </div>

                  {/* Descrizione problema */}
                  <div className={styles.editFormRow}>
                    <label>Descrizione dell'intervento/problema</label>
                    <textarea
                      className={styles.editFormControl}
                      rows={4}
                      value={editProblema}
                      onChange={(e) => setEditProblema(e.target.value)}
                      placeholder="Sostituzione del vetro dello schermo"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={styles.editModalFooter}>
                <button
                  className={styles.editBtnCancel}
                  onClick={() => {
                    setShowEditModal(false);
                    setEditNote(null);
                  }}
                >
                  Annulla
                </button>

                <button className={styles.editBtnSave} onClick={handleSaveEdit}>
                  💾 Salva Modifiche
                </button>

                {/* 🆕 BOTTONE CREA RIPARAZIONE */}
                <button
                  className={styles.editBtnRepair}
                  onClick={() => {
                    // Naviga alla form di accettazione passando il noteId
                    window.location.href = `/accettazione?noteId=${editNote?.noteId}`;
                  }}
                >
                  🔧 Crea Riparazione
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RicercaNote;
