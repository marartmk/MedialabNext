import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../../components/sidebar-admin";
import Topbar from "../../../components/topbar-admin";
import styles from "./anagrafica-master.module.css";
import { CalendarDays, Users, Shield } from "lucide-react";

// Interfacce TypeScript per tipizzazione corretta
interface SearchResult {
  id: string;
  ragioneSociale: string;
  telefono: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  isAffiliate?: boolean;
  isCustomer?: boolean;
  tipoCliente?: string;
  cognome?: string;
  nome?: string;
  cap?: string;
  regione?: string;
  email?: string;
  fiscalCode?: string;
  pIva?: string;
  emailPec?: string;
  codiceSdi?: string;
  iban?: string;
  affiliateCode?: string;
  affiliatedDataStart?: string;
  affiliatedDataEnd?: string;
  affiliateStatus?: boolean | number;
}

type UserDetail = {
  id: string;
  username?: string;
  userName?: string;
  email?: string | null;
  isEnabled: boolean;
  isAdmin: boolean;
  accessLevel?: string | null;
  createdAt: string;
};

// Interfacce TypeScript per tipizzazione corretta
interface SearchResult {
  id: string;
  ragioneSociale: string;
  telefono: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  isAffiliate?: boolean;
  isCustomer?: boolean;
  tipoCliente?: string;
  cognome?: string;
  nome?: string;
  cap?: string;
  regione?: string;
  email?: string;
  fiscalCode?: string;
  pIva?: string;
  emailPec?: string;
  codiceSdi?: string;
  iban?: string;
  affiliateCode?: string;
  affiliatedDataStart?: string;
  affiliatedDataEnd?: string;
  affiliateStatus?: boolean | number;
}

// Interfacce per la geolocalizzazione
interface GeolocationRequest {
  affiliateId: string;
  latitude?: number;
  longitude?: number;
  address: string;
  quality: string;
  notes?: string;
  geocodingSource: string;
}

interface GeolocationResponse {
  id: number;
  affiliateId: string;
  latitude?: number;
  longitude?: number;
  address: string;
  geocodedDate: string;
  quality: string;
  hasValidCoordinates: boolean;
}

const CompanyMaster: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const { id: customerIdFromUrl } = useParams<{ id: string }>(); // AGGIUNTO
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ragioneSocialeInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeocodingInProgress, setIsGeocodingInProgress] = useState(false);

  const [companyUsers, setCompanyUsers] = useState<UserDetail[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    accessLevel: "Affiliate",
    isEnabled: true,
    isAdmin: false,
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  const API_BASE = "https://localhost:7148";

  const authHeaders = () => ({
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const [formData, setFormData] = useState({
    tipo: "Azienda",
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
    // Campi affiliati
    isAffiliate: false,
    affiliateCode: "",
    affiliatedDataStart: "",
    affiliatedDataEnd: "",
    affiliateStatus: true,
  });

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

  // useEffect per caricare i dati del cliente dall'URL
  useEffect(() => {
    if (customerIdFromUrl) {
      console.log("ID cliente dall'URL:", customerIdFromUrl);
      loadCustomerData(customerIdFromUrl);
    }
  }, [customerIdFromUrl]);

  // Carica gli utenti affiliati quando cambia customerId o isAffiliate
  useEffect(() => {
    if (customerId) {
      loadCompanyUsers();
    }
  }, [customerId, formData.isAffiliate]);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // FUNZIONE AGGIUNTA - Carica i dati del cliente dall'ID
  const loadCustomerData = async (id: string) => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/customer/${id}`, {
        headers: authHeaders(),
      });

      if (response.ok) {
        const customerData = await response.json();
        console.log("Dati cliente caricati:", customerData);

        // Usa la funzione esistente per popolare il form
        onSelectCustomer(customerData);

        // Carica anche gli utenti affiliati se è un affiliato
        if (customerData.isAffiliate) {
          setTimeout(() => {
            loadCompanyUsers();
          }, 100);
        }
      } else {
        const errorText = await response.text();
        console.error("Errore caricamento cliente:", errorText);
        alert(`Errore nel caricamento del cliente: ${response.status}`);
      }
    } catch (error) {
      console.error("Errore di rete:", error);
      alert("Errore di connessione durante il caricamento del cliente");
    } finally {
      setLoading(false);
    }
  };

  // Funzione per generare codice affiliato automatico
  const generateAffiliateCode = () => {
    const prefix = "AFF";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newCode = `${prefix}${timestamp}${random}`;

    setFormData({
      ...formData,
      affiliateCode: newCode,
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(
        `https://localhost:7148/api/customer/search?query=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data: SearchResult[] = await response.json();
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

  // Carica gli utenti dell'azienda (companyId == customerId)
  const loadCompanyUsers = async () => {
    if (!customerId) return;

    try {
      const url = `${API_BASE}/api/Auth/users/${customerId}`;
      const resp = await fetch(url, { headers: authHeaders() });

      // 204/404 = nessun utente creato → UI in modalità "crea"
      if (resp.status === 204 || resp.status === 404) {
        setCompanyUsers([]);
        setSelectedUserId(null);
        setAccountForm((prev) => ({
          ...prev,
          username: "",
          email: formData.email || "",
          accessLevel: "Affiliate",
          isEnabled: true,
          isAdmin: false,
          password: "",
          confirmPassword: "",
        }));
        return;
      }

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || `HTTP ${resp.status}`);
      }

      const json = await resp.json();

      // >>> QUI: il backend restituisce { users: [...] }
      const listRaw: any[] = Array.isArray(json?.users)
        ? json.users
        : Array.isArray(json) // fallback: array “nudo”
        ? json
        : json && typeof json === "object"
        ? [json] // fallback: oggetto singolo
        : [];

      // Normalizza username / userName
      const list = listRaw.map((u) => ({
        ...u,
        username: u.username ?? u.userName ?? u.UserName ?? "",
        email: u.email ?? "",
        accessLevel: u.accessLevel ?? "Affiliate",
        isEnabled: !!u.isEnabled,
        isAdmin: !!u.isAdmin,
      }));

      setCompanyUsers(list);

      const first = list[0] ?? null;
      setSelectedUserId(first?.id ?? null);

      setAccountForm((prev) =>
        first
          ? {
              ...prev,
              username: first.username,
              email: first.email,
              accessLevel: first.accessLevel, // lascia quello del BE (es. "User")
              isEnabled: first.isEnabled,
              isAdmin: first.isAdmin,
              password: "",
              confirmPassword: "",
            }
          : {
              ...prev,
              username: "",
              email: formData.email || "",
              accessLevel: "Affiliate",
              isEnabled: true,
              isAdmin: false,
              password: "",
              confirmPassword: "",
            }
      );
    } catch (e: any) {
      console.error("loadCompanyUsers error:", e);
      alert(`Errore nel caricamento utenti affiliato: ${e?.message ?? e}`);
    }
  };

  // Crea account affiliato
  const createAffiliateAccount = async () => {
    if (!customerId) {
      alert("Seleziona o salva prima il cliente.");
      return;
    }
    if (!accountForm.username.trim() || !accountForm.password.trim()) {
      alert("Username e Password sono obbligatori.");
      return;
    }
    setIsSavingAccount(true);
    try {
      const body = {
        username: accountForm.username.trim(),
        password: accountForm.password,
        idCustomer: customerId, // come da Swagger
        email: accountForm.email || null,
        accessLevel: accountForm.accessLevel || null,
      };
      const resp = await fetch(`${API_BASE}/api/Auth/create-affiliate-user`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore creazione account");
      await loadCompanyUsers();
      alert("Account affiliato creato con successo.");
    } catch (e: unknown) {
      const error = e as Error;
      console.error("Errore createAffiliateAccount:", error);
      alert(error.message || "Errore nella creazione account.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Aggiorna dati account selezionato
  const updateSelectedUser = async () => {
    if (!selectedUserId) return;
    setIsSavingAccount(true);
    try {
      const body = {
        email: accountForm.email || null,
        isEnabled: accountForm.isEnabled,
        isAdmin: accountForm.isAdmin,
        accessLevel: accountForm.accessLevel || null,
      };
      const resp = await fetch(
        `${API_BASE}/api/Auth/update-user/${selectedUserId}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(body),
        }
      );
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore aggiornamento utente");
      await loadCompanyUsers();
      alert("Dati account aggiornati.");
    } catch (e: unknown) {
      const error = e as Error;
      console.error("Errore updateSelectedUser:", error);
      alert(error.message || "Errore aggiornamento.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Cambia password
  const changePassword = async () => {
    if (!selectedUserId) return;
    if (!accountForm.password.trim())
      return alert("Inserisci la nuova password.");
    if (
      accountForm.confirmPassword.trim() &&
      accountForm.confirmPassword !== accountForm.password
    ) {
      return alert("La conferma password non coincide.");
    }
    setIsSavingAccount(true);
    try {
      const body = {
        newPassword: accountForm.password,
        confirmPassword: accountForm.confirmPassword || undefined,
      };
      const resp = await fetch(
        `${API_BASE}/api/Auth/change-password/${selectedUserId}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(body),
        }
      );
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore cambio password");
      setAccountForm((p) => ({ ...p, password: "", confirmPassword: "" }));
      alert("Password aggiornata.");
    } catch (e: unknown) {
      const error = e as Error;
      console.error("Errore changePassword:", error);
      alert(error.message || "Errore cambio password.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Attiva/Disattiva
  const toggleUserStatus = async () => {
    if (!selectedUserId) return;
    try {
      const resp = await fetch(
        `${API_BASE}/api/Auth/toggle-user-status/${selectedUserId}`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );
      const text = await resp.text();
      if (!resp.ok) throw new Error(text || "Errore cambio stato");
      await loadCompanyUsers();
      alert("Stato utente aggiornato.");
    } catch (e: unknown) {
      const error = e as Error;
      console.error("Errore toggleUserStatus:", error);
      alert(error.message || "Errore nel cambio stato.");
    }
  };

  const onSelectCustomer = (c: SearchResult) => {
    setCustomerId(c.id);
    setFormData({
      tipo: "Azienda",
      cliente: c.isCustomer ?? true,
      fornitore: !c.isCustomer,
      tipoCliente: c.tipoCliente || "",
      ragioneSociale: c.ragioneSociale || "",
      indirizzo: c.indirizzo || "",
      cognome: c.cognome || "",
      nome: c.nome || "",
      cap: c.cap || "",
      regione: c.regione || "",
      provincia: c.provincia || "",
      citta: c.citta || "",
      telefono: c.telefono || "",
      email: c.email || "",
      codiceFiscale: c.fiscalCode || "",
      partitaIva: c.pIva || "",
      emailPec: c.emailPec || "",
      codiceSdi: c.codiceSdi || "",
      iban: c.iban || "",
      // Campi affiliati
      isAffiliate: c.isAffiliate || false,
      affiliateCode: c.affiliateCode || "",
      affiliatedDataStart: c.affiliatedDataStart
        ? c.affiliatedDataStart.split("T")[0]
        : "",
      affiliatedDataEnd: c.affiliatedDataEnd
        ? c.affiliatedDataEnd.split("T")[0]
        : "",
      affiliateStatus:
        typeof c.affiliateStatus === "number"
          ? c.affiliateStatus === 1
          : c.affiliateStatus ?? true,
    });
    setShowModal(false);

    // Se è un affiliato, carica automaticamente gli utenti
    if (c.isAffiliate) {
      // Piccolo delay per permettere al customerId di essere settato
      setTimeout(() => {
        loadCompanyUsers();
      }, 100);
    }
  };

  const resetForm = () => {
    setCustomerId(null);
    setFormData({
      tipo: "Azienda",
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
      isAffiliate: false,
      affiliateCode: "",
      affiliatedDataStart: "",
      affiliatedDataEnd: "",
      affiliateStatus: true,
    });

    // Pulisci l'URL se stiamo creando un nuovo cliente
    if (customerIdFromUrl) {
      window.history.pushState({}, "", "/master-company");
    }

    setTimeout(() => {
      ragioneSocialeInputRef.current?.focus();
    }, 0);
  };

  // Salva i dati del Customer
  const handleSaveCustomer = async () => {
    // ... [mantieni tutte le validazioni esistenti] ...

    const multitenantId = sessionStorage.getItem("IdCompanyAdmin");

    if (!multitenantId) {
      alert("Multitenant ID mancante");
      return;
    }

    if (!formData.ragioneSociale) {
      alert("Inserire una ragione sociale");
      return;
    }

    if (!formData.indirizzo) {
      alert("Inserire un indirizzo");
      return;
    }

    if (!formData.cap) {
      alert("Inserire un CAP");
      return;
    }

    if (!formData.regione) {
      alert("Inserire una regione");
      return;
    }

    if (!formData.provincia) {
      alert("Inserire una provincia");
      return;
    }

    if (!formData.citta) {
      alert("Inserire una città");
      return;
    }

    if (!formData.telefono) {
      alert("Inserire un numero di telefono");
      return;
    }

    if (!formData.email) {
      alert("Inserire un'email");
      return;
    }

    // Validazioni per affiliati
    if (formData.isAffiliate) {
      if (!formData.affiliateCode) {
        alert("Inserire un codice affiliato o generarlo automaticamente");
        return;
      }
      if (!formData.affiliatedDataStart) {
        alert("Inserire la data di inizio affiliazione");
        return;
      }
    }

    // PAYLOAD CORRETTO secondo lo schema API
    const payload = {
      ...(customerId && { id: customerId }),

      // Campi base - corrispondenti allo schema C_ANA_Company
      tipologia: "0",
      isCustomer: formData.cliente,
      isSupplier: formData.fornitore,
      tipoCliente: formData.tipoCliente || null,
      ragioneSociale: formData.ragioneSociale,
      indirizzo: formData.indirizzo,
      cognome: formData.tipo === "Persona" ? formData.cognome : null,
      nome: formData.tipo === "Persona" ? formData.nome : null,
      cap: formData.cap,
      regione: formData.regione,
      provincia: formData.provincia,
      citta: formData.citta,
      telefono: formData.telefono,
      email: formData.email,
      fiscalCode: formData.codiceFiscale || null,
      pIva: formData.partitaIva || null,
      emailPec: formData.emailPec || null,
      codiceSdi: formData.codiceSdi || null,
      iban: formData.iban || null,
      multitenantId: sessionStorage.getItem("IdCompanyAdmin"),

      // Campi affiliazione - CORRETTI secondo lo schema
      isAffiliate: formData.isAffiliate,
      affiliateCode: formData.isAffiliate ? formData.affiliateCode : null,
      affiliatedDataStart:
        formData.isAffiliate && formData.affiliatedDataStart
          ? new Date(formData.affiliatedDataStart).toISOString()
          : null,
      affiliatedDataEnd:
        formData.isAffiliate && formData.affiliatedDataEnd
          ? new Date(formData.affiliatedDataEnd).toISOString()
          : null,

      // IMPORTANTE: affiliateStatus deve essere un INTEGER, non boolean
      affiliateStatus: formData.isAffiliate
        ? formData.affiliateStatus
          ? 1
          : 0
        : null,

      // Altri campi che potrebbero essere richiesti
      active: true,
      isDeleted: false,
      nazione: "Italia",
      enabledFE: false,
      isVendolo: false,
      isVendoloFE: false,
    };

    try {
      const url = customerId
        ? `https://localhost:7148/api/customer/${customerId}`
        : `https://localhost:7148/api/customer`;

      const method = customerId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const message = customerId
          ? "Cliente aggiornato con successo!"
          : "Cliente creato con successo!";
        alert(message);

        let finalCustomerId = customerId;

        // Se è una creazione, ottieni l'ID del nuovo cliente
        if (!customerId) {
          try {
            const newCustomer = await response.json();
            finalCustomerId = newCustomer.id;
            setCustomerId(finalCustomerId);
          } catch {
            console.log(
              "Nessun JSON di risposta (normale per alcuni endpoint)"
            );
          }
        }

        // 🆕 GEOCODIFICA AUTOMATICA PER AFFILIATI
        if (formData.isAffiliate && finalCustomerId) {
          console.log(
            "Avvio geocodifica automatica per affiliato:",
            finalCustomerId
          );
          await handleAutomaticGeocoding(finalCustomerId, formData);
        }
      } else {
        const errorText = await response.text();
        let errorMessage = "Errore nel salvataggio";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors) {
            const validationErrors = Object.entries(errorJson.errors)
              .map(
                ([field, errors]) =>
                  `${field}: ${
                    Array.isArray(errors) ? errors.join(", ") : errors
                  }`
              )
              .join("\n");
            errorMessage = `Errori di validazione:\n${validationErrors}`;
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.title) {
            errorMessage = errorJson.title;
          }
        } catch (e) {
          errorMessage = `Errore nel salvataggio (${response.status}):\n${errorText}`;
          console.log("Errore parsing JSON:", e);
        }
        alert(errorMessage);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Errore di connessione: ${error.message}`);
      } else {
        alert("Errore di connessione sconosciuto");
      }
    }
  };

  // Handler per gli switch - con debug
  const handleAffiliateToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isAffiliate: checked,
      // Reset dei campi affiliati se disabilitato
      ...(!checked && {
        affiliateCode: "",
        affiliatedDataStart: "",
        affiliatedDataEnd: "",
        affiliateStatus: true,
      }),
    }));
  };

  const handleAffiliateStatusToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      affiliateStatus: checked,
    }));
  };

  // Funzione per costruire l'indirizzo completo
  const buildFullAddress = (formData: any): string => {
    const parts = [
      formData.indirizzo,
      formData.cap && formData.citta
        ? `${formData.cap} ${formData.citta}`
        : formData.citta,
      formData.provincia,
      formData.regione,
      "Italy",
    ].filter(Boolean);

    return parts.join(", ");
  };

  // Funzione per geocodificare un indirizzo tramite Google Maps
  const geocodeAddress = async (
    address: string
  ): Promise<{ lat: number; lng: number; quality: string } | null> => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps) {
        console.warn("Google Maps non disponibile per la geocodifica");
        resolve(null);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          const quality =
            results[0].geometry.location_type === "ROOFTOP"
              ? "EXACT"
              : "APPROXIMATE";

          resolve({
            lat: location.lat(),
            lng: location.lng(),
            quality,
          });
        } else {
          console.warn(`Geocodifica fallita per "${address}": ${status}`);
          resolve(null);
        }
      });
    });
  };

  // Funzione per salvare la geolocalizzazione nel database
  const saveGeolocation = async (
    affiliateId: string,
    coordinates: { lat: number; lng: number; quality: string },
    address: string
  ): Promise<boolean> => {
    try {
      const geolocationData: GeolocationRequest = {
        affiliateId,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address,
        quality: coordinates.quality,
        geocodingSource: "GoogleMaps",
        notes:
          "Geocodificato automaticamente durante il salvataggio anagrafica",
      };

      // Prima controlla se esiste già una geolocalizzazione
      const checkResponse = await fetch(
        `${API_BASE}/api/customer/${affiliateId}/geolocation`,
        {
          headers: authHeaders(),
        }
      );

      let method = "POST";
      let url = `${API_BASE}/api/customer/${affiliateId}/geolocation`;

      if (checkResponse.ok) {
        // Esiste già, aggiorna
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(geolocationData),
      });

      if (response.ok) {
        console.log("Geolocalizzazione salvata con successo");
        return true;
      } else {
        const errorText = await response.text();
        console.error("Errore nel salvataggio geolocalizzazione:", errorText);
        return false;
      }
    } catch (error) {
      console.error("Errore nella richiesta di geolocalizzazione:", error);
      return false;
    }
  };

  // Funzione per gestire la geocodifica automatica
  const handleAutomaticGeocoding = async (
    affiliateId: string,
    formData: any
  ): Promise<void> => {
    // Solo per affiliati con dati di indirizzo completi
    if (
      !formData.isAffiliate ||
      !formData.indirizzo ||
      !formData.citta ||
      !formData.provincia
    ) {
      return;
    }

    setIsGeocodingInProgress(true);

    try {
      const fullAddress = buildFullAddress(formData);
      console.log("Geocodifica indirizzo:", fullAddress);

      // Carica Google Maps se non è già disponibile
      if (!window.google || !window.google.maps) {
        console.log("Caricamento Google Maps per geocodifica...");
        await loadGoogleMaps();
      }

      // Geocodifica l'indirizzo
      const coordinates = await geocodeAddress(fullAddress);

      if (coordinates) {
        const success = await saveGeolocation(
          affiliateId,
          coordinates,
          fullAddress
        );

        if (success) {
          console.log(
            `Geolocalizzazione salvata: ${coordinates.lat}, ${coordinates.lng} (${coordinates.quality})`
          );
          // Opzionale: mostra un toast di successo
          // showToast('Indirizzo geocodificato automaticamente', 'success');
        } else {
          console.warn("Geocodifica riuscita ma salvataggio fallito");
        }
      } else {
        console.warn("Impossibile geocodificare l'indirizzo fornito");
        // Salva comunque i dati senza coordinate
        await saveGeolocation(
          affiliateId,
          { lat: 0, lng: 0, quality: "FAILED" },
          fullAddress
        );
      }
    } catch (error) {
      console.error("Errore durante la geocodifica automatica:", error);
    } finally {
      setIsGeocodingInProgress(false);
    }
  };

  // Funzione per caricare Google Maps dinamicamente
  const loadGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBdIcimFZ-qXj-7YzYX0kbCGGxIpAnOA0I&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Impossibile caricare Google Maps"));

      document.head.appendChild(script);
    });
  };

  return (
    <>
      {loading && (
        <div className={styles.globalLoadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Caricamento dati cliente...</p>
        </div>
      )}
      <div className="main-layout">
        <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
        <div className="content-area">
          <Topbar toggleMenu={toggleMenu} />

          <div className={styles.schedaHeader}>
            <div className={styles.leftBlock}>
              <div
                className={styles.roundBtn}
                title="Aggiungi un nuovo cliente"
                onClick={resetForm}
              >
                <span>+</span>
              </div>

              <div className={styles.dateBox}>
                <CalendarDays className="calendar-icon" />
                <div className={styles.dateTextInline}>
                  <span>{dateTime.date}</span>
                  <span>{dateTime.time}</span>
                </div>
              </div>
            </div>

            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cerca cliente per nome, cognome o P.IVA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.searchButton}`}
                onClick={handleSearch}
              >
                Cerca
              </button>
            </div>

            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Home</span>
              <span className={styles.breadcrumbSeparator}> &gt; </span>
              <span className={styles.breadcrumbItem}>Anagrafica</span>
              <span className={styles.breadcrumbSeparator}> &gt; </span>
              <span className={styles.breadcrumbCurrent}>Aggiungi</span>
            </div>
          </div>

          {/* Form */}
          <div className="page-body">
            <div
              className="card bg-light card text-black"
              style={{ borderRadius: "10px" }}
            >
              <div className="custom-card-header">Dati Cliente / Fornitore</div>
              <div className={`card-body ${styles.customerForm}`}>
                <div className="row">
                  <div className={`col-md-6 ${styles.fieldGroup}`}>
                    <label>Ragione Sociale</label>
                    <input
                      className="form-control"
                      value={formData.ragioneSociale}
                      ref={ragioneSocialeInputRef}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ragioneSociale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={`col-md-6 ${styles.fieldGroup}`}>
                    <label>Indirizzo</label>
                    <input
                      className="form-control"
                      value={formData.indirizzo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          indirizzo: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>CAP</label>
                    <input
                      className="form-control"
                      value={formData.cap}
                      onChange={(e) =>
                        setFormData({ ...formData, cap: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Regione</label>
                    <input
                      className="form-control"
                      value={formData.regione}
                      onChange={(e) =>
                        setFormData({ ...formData, regione: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Provincia</label>
                    <input
                      className="form-control"
                      value={formData.provincia}
                      onChange={(e) =>
                        setFormData({ ...formData, provincia: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Città</label>
                    <input
                      className="form-control"
                      value={formData.citta}
                      onChange={(e) =>
                        setFormData({ ...formData, citta: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Telefono</label>
                    <input
                      className="form-control"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Email</label>
                    <input
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Codice Fiscale</label>
                    <input
                      className="form-control"
                      value={formData.codiceFiscale}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          codiceFiscale: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={`col-md-3 ${styles.fieldGroup}`}>
                    <label>Partita IVA</label>
                    <input
                      className="form-control"
                      value={formData.partitaIva}
                      onChange={(e) =>
                        setFormData({ ...formData, partitaIva: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className={`col-md-4 ${styles.fieldGroup}`}>
                    <label>Email PEC</label>
                    <input
                      className="form-control"
                      value={formData.emailPec}
                      onChange={(e) =>
                        setFormData({ ...formData, emailPec: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-4 ${styles.fieldGroup}`}>
                    <label>Codice SDI</label>
                    <input
                      className="form-control"
                      value={formData.codiceSdi}
                      onChange={(e) =>
                        setFormData({ ...formData, codiceSdi: e.target.value })
                      }
                    />
                  </div>
                  <div className={`col-md-4 ${styles.fieldGroup}`}>
                    <label>IBAN</label>
                    <input
                      className="form-control"
                      value={formData.iban}
                      onChange={(e) =>
                        setFormData({ ...formData, iban: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Sezione Affiliazione */}
                <div className={styles.affiliateSection}>
                  <div className={styles.affiliateTitle}>
                    <Shield size={20} />
                    Gestione Affiliazione
                  </div>

                  <div className="row">
                    <div className={`col-md-6 ${styles.fieldGroup}`}>
                      <div className={styles.switchGroup}>
                        <label htmlFor="isAffiliateSwitch">
                          È un affiliato?
                        </label>
                        <div className={styles.switchContainer}>
                          <input
                            id="isAffiliateSwitch"
                            type="checkbox"
                            className={styles.switchInput}
                            checked={formData.isAffiliate}
                            onChange={(e) =>
                              handleAffiliateToggle(e.target.checked)
                            }
                          />
                          <span
                            className={styles.switchSlider}
                            onClick={() =>
                              handleAffiliateToggle(!formData.isAffiliate)
                            }
                          ></span>
                        </div>
                        <span
                          className={`${styles.statusText} ${
                            formData.isAffiliate
                              ? styles.statusTextActive
                              : styles.statusTextInactive
                          }`}
                        >
                          {formData.isAffiliate ? "Sì" : "No"}
                        </span>
                      </div>
                    </div>

                    {formData.isAffiliate && (
                      <div className={`col-md-6 ${styles.fieldGroup}`}>
                        <div className={styles.switchGroup}>
                          <label htmlFor="affiliateStatusSwitch">
                            Stato affiliazione
                          </label>
                          <div className={styles.switchContainer}>
                            <input
                              id="affiliateStatusSwitch"
                              type="checkbox"
                              className={styles.switchInput}
                              checked={formData.affiliateStatus}
                              onChange={(e) =>
                                handleAffiliateStatusToggle(e.target.checked)
                              }
                            />
                            <span
                              className={styles.switchSlider}
                              onClick={() =>
                                handleAffiliateStatusToggle(
                                  !formData.affiliateStatus
                                )
                              }
                            ></span>
                          </div>
                          <span
                            className={`${styles.statusBadge} ${
                              formData.affiliateStatus
                                ? styles.statusActive
                                : styles.statusInactive
                            }`}
                          >
                            {formData.affiliateStatus ? "Attivo" : "Inattivo"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.isAffiliate && (
                    <>
                      <div className="row">
                        <div className={`col-md-8 ${styles.fieldGroup}`}>
                          <div className={styles.affiliateCodeGroup}>
                            <div className={styles.fieldGroup}>
                              <label>Codice Affiliato</label>
                              <input
                                className="form-control"
                                value={formData.affiliateCode}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    affiliateCode: e.target.value,
                                  })
                                }
                                placeholder="Es: AFF123456ABC"
                                readOnly={
                                  !!formData.affiliateCode && !!customerId
                                }
                                style={{
                                  backgroundColor:
                                    !!formData.affiliateCode && !!customerId
                                      ? "#f8f9fa"
                                      : "white",
                                  cursor:
                                    !!formData.affiliateCode && !!customerId
                                      ? "not-allowed"
                                      : "text",
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              className={styles.codeGenerateBtn}
                              onClick={generateAffiliateCode}
                              title={
                                !!formData.affiliateCode && !!customerId
                                  ? "Codice affiliato esistente - non modificabile"
                                  : "Genera codice automatico"
                              }
                              disabled={
                                !!formData.affiliateCode && !!customerId
                              }
                              style={{
                                opacity:
                                  !!formData.affiliateCode && !!customerId
                                    ? 0.5
                                    : 1,
                                cursor:
                                  !!formData.affiliateCode && !!customerId
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              Genera
                            </button>
                          </div>
                          {!!formData.affiliateCode && !!customerId && (
                            <small className="text-muted mt-1">
                              ⚠️ Il codice affiliato non può essere modificato
                              per preservare l'integrità dei dati esistenti
                            </small>
                          )}
                        </div>
                      </div>

                      <div className="row">
                        <div className={`col-md-6 ${styles.fieldGroup}`}>
                          <label>Data Inizio Affiliazione</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.affiliatedDataStart}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                affiliatedDataStart: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={`col-md-6 ${styles.fieldGroup}`}>
                          <label>Data Fine Affiliazione (opzionale)</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.affiliatedDataEnd}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                affiliatedDataEnd: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* === ACCOUNT DI ACCESSO AFFILIATO === */}
                <div
                  className={styles.customerFormContainer}
                  style={{ marginTop: 16 }}
                >
                  <div className={styles.affiliateTitle}>
                    <Shield size={20} />
                    Account di accesso affiliato
                  </div>

                  {/* Messaggio se manca il cliente */}
                  {!customerId ? (
                    <div className="text-muted">
                      Seleziona o salva prima un cliente per abilitare la
                      gestione account.
                    </div>
                  ) : (
                    <>
                      <div className="d-flex gap-2 mb-3">
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnSecondary}`}
                          onClick={loadCompanyUsers}
                        >
                          Carica/aggiorna utenti
                        </button>

                        {selectedUserId && (
                          <span
                            className={`${styles.statusBadge} ${
                              accountForm.isEnabled
                                ? styles.statusActive
                                : styles.statusInactive
                            }`}
                          >
                            {accountForm.isEnabled ? "Attivo" : "Disattivo"}
                          </span>
                        )}
                      </div>

                      {/* Se ci sono utenti, seleziona quello da modificare */}
                      {companyUsers.length > 0 && (
                        <div className="row mb-3">
                          <div className={`col-md-6 ${styles.fieldGroup}`}>
                            <label>Utente affiliato</label>
                            <select
                              className="form-select"
                              value={selectedUserId ?? ""}
                              onChange={(e) => {
                                const id = e.target.value || null;
                                setSelectedUserId(id);
                                const u = companyUsers.find(
                                  (x) => x.id === id!
                                );
                                if (u) {
                                  const uname =
                                    (u as any).username ??
                                    (u as any).userName ??
                                    "";
                                  setAccountForm((p) => ({
                                    ...p,
                                    username: uname,
                                    email: u.email ?? "",
                                    accessLevel: u.accessLevel ?? "Affiliate",
                                    isEnabled: u.isEnabled,
                                    isAdmin: u.isAdmin,
                                    password: "",
                                    confirmPassword: "",
                                  }));
                                }
                              }}
                            >
                              {companyUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.username} {u.email ? `(${u.email})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Form creazione/modifica */}
                      <div className="row">
                        <div className={`col-md-4 ${styles.fieldGroup}`}>
                          <label>Username</label>
                          <input
                            className="form-control"
                            value={accountForm.username}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                username: e.target.value,
                              })
                            }
                            disabled={!!selectedUserId} // username fisso in modifica
                          />
                        </div>
                        <div className={`col-md-4 ${styles.fieldGroup}`}>
                          <label>Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={accountForm.email}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={`col-md-4 ${styles.fieldGroup}`}>
                          <label>Access level</label>
                          <input
                            className="form-control"
                            value={accountForm.accessLevel}
                            onChange={(e) =>
                              setAccountForm({
                                ...accountForm,
                                accessLevel: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Password: in creazione oppure azione dedicata in modifica */}
                      {!selectedUserId ? (
                        <div className="row">
                          <div className={`col-md-4 ${styles.fieldGroup}`}>
                            <label>Password</label>
                            <input
                              type="password"
                              className="form-control"
                              value={accountForm.password}
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  password: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className={`col-md-4 ${styles.fieldGroup}`}>
                            <label>Conferma Password (opz.)</label>
                            <input
                              type="password"
                              className="form-control"
                              value={accountForm.confirmPassword}
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="row">
                          <div className={`col-md-4 ${styles.fieldGroup}`}>
                            <label>Nuova Password</label>
                            <input
                              type="password"
                              className="form-control"
                              value={accountForm.password}
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  password: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className={`col-md-4 ${styles.fieldGroup}`}>
                            <label>Conferma (opz.)</label>
                            <input
                              type="password"
                              className="form-control"
                              value={accountForm.confirmPassword}
                              onChange={(e) =>
                                setAccountForm({
                                  ...accountForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Azioni */}
                      <div className="d-flex gap-2 mt-3">
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          onClick={
                            selectedUserId
                              ? updateSelectedUser
                              : createAffiliateAccount
                          }
                          disabled={isSavingAccount}
                        >
                          {selectedUserId
                            ? "Aggiorna account affiliato"
                            : "Crea account affiliato"}
                        </button>

                        {/* Questi restano visibili solo se sto modificando un utente esistente */}
                        {selectedUserId && (
                          <>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnSecondary}`}
                              onClick={changePassword}
                              disabled={
                                isSavingAccount || !accountForm.password
                              }
                              title="Imposta la nuova password"
                            >
                              Cambia password
                            </button>

                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnDanger}`}
                              onClick={toggleUserStatus}
                            >
                              {accountForm.isEnabled ? "Disattiva" : "Attiva"}{" "}
                              utente
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="row mt-4">
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={handleSaveCustomer}
                    >
                      SALVA
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={resetForm}
                    >
                      NUOVO
                    </button>
                  </div>

                  {/* Indicatore geocodifica */}
                  {isGeocodingInProgress && (
                    <div className={styles.geocodingProgress}>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <div className={styles.spinner}></div>
                        <span>Geocodifica indirizzo in corso...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Risultati ricerca</h4>
            <ul>
              {searchResults.map((c: SearchResult) => (
                <li
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{c.ragioneSociale}</strong> - {c.telefono} -{" "}
                      {c.indirizzo} - {c.citta} ({c.provincia})
                    </div>
                    {c.isAffiliate && (
                      <span
                        className={`${styles.statusBadge} ${styles.statusActive}`}
                      >
                        <Users size={12} /> Affiliato
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowModal(false)}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyMaster;
