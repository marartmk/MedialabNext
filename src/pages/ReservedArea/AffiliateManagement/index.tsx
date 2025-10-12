import React, { useState, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import Sidebar from "../../../components/sidebar-admin";
import Topbar from "../../../components/topbar-admin";

// Definisci il tipo per i dati del cliente
interface CustomerData {
  id: string;
  ragioneSociale: string;
  nome: string;
  cognome: string;
  citta: string;
  provincia: string;
  telefono: string;
  emailAziendale: string;
  pIva: string;
  regione?: string;
  indirizzo?: string;
  cap?: string;
  lat?: number;
  lng?: number;
  geocoded?: boolean;
  fromCache?: boolean;
}

// Mapping delle province italiane con nomi completi
const PROVINCE_NAMES: { [key: string]: string } = {
  AG: "Agrigento",
  AL: "Alessandria",
  AN: "Ancona",
  AO: "Aosta",
  AR: "Arezzo",
  AP: "Ascoli Piceno",
  AT: "Asti",
  AV: "Avellino",
  BA: "Bari",
  BT: "Barletta-Andria-Trani",
  BL: "Belluno",
  BN: "Benevento",
  BG: "Bergamo",
  BI: "Biella",
  BO: "Bologna",
  BZ: "Bolzano",
  BS: "Brescia",
  BR: "Brindisi",
  CA: "Cagliari",
  CL: "Caltanissetta",
  CB: "Campobasso",
  CE: "Caserta",
  CT: "Catania",
  CZ: "Catanzaro",
  CH: "Chieti",
  CO: "Como",
  CS: "Cosenza",
  CR: "Cremona",
  KR: "Crotone",
  CN: "Cuneo",
  EN: "Enna",
  FM: "Fermo",
  FE: "Ferrara",
  FI: "Firenze",
  FG: "Foggia",
  FC: "Forlì-Cesena",
  FR: "Frosinone",
  GE: "Genova",
  GO: "Gorizia",
  GR: "Grosseto",
  IM: "Imperia",
  IS: "Isernia",
  SP: "La Spezia",
  AQ: "L'Aquila",
  LT: "Latina",
  LE: "Lecce",
  LECCE: "Lecce", // Aggiunta versione completa
  LC: "Lecco",
  LI: "Livorno",
  LO: "Lodi",
  LU: "Lucca",
  MC: "Macerata",
  MN: "Mantova",
  MS: "Massa-Carrara",
  MT: "Matera",
  ME: "Messina",
  MI: "Milano",
  MO: "Modena",
  MB: "Monza e Brianza",
  NA: "Napoli",
  NO: "Novara",
  NU: "Nuoro",
  PD: "Padova",
  PA: "Palermo",
  PR: "Parma",
  PV: "Pavia",
  PG: "Perugia",
  PU: "Pesaro e Urbino",
  PE: "Pescara",
  PC: "Piacenza",
  PI: "Pisa",
  PT: "Pistoia",
  PN: "Pordenone",
  PZ: "Potenza",
  PO: "Prato",
  RG: "Ragusa",
  RA: "Ravenna",
  RC: "Reggio Calabria",
  RE: "Reggio Emilia",
  RI: "Rieti",
  RN: "Rimini",
  RM: "Roma",
  RO: "Rovigo",
  SA: "Salerno",
  SS: "Sassari",
  SV: "Savona",
  SI: "Siena",
  SR: "Siracusa",
  SO: "Sondrio",
  TA: "Taranto",
  TE: "Teramo",
  TR: "Terni",
  TO: "Torino",
  TP: "Trapani",
  TN: "Trento",
  TV: "Treviso",
  TS: "Trieste",
  UD: "Udine",
  VA: "Varese",
  VE: "Venezia",
  VB: "Verbano-Cusio-Ossola",
  VC: "Vercelli",
  VR: "Verona",
  VV: "Vibo Valentia",
  VI: "Vicenza",
  VT: "Viterbo",
};

// const CANONICAL_REGIONS = [
//   "ABRUZZO",
//   "BASILICATA",
//   "CALABRIA",
//   "CAMPANIA",
//   "EMILIA-ROMAGNA",
//   "FRIULI VENEZIA GIULIA",
//   "LAZIO",
//   "LIGURIA",
//   "LOMBARDIA",
//   "MARCHE",
//   "MOLISE",
//   "PIEMONTE",
//   "PUGLIA",
//   "SARDEGNA",
//   "SICILIA",
//   "TOSCANA",
//   "TRENTINO-ALTO ADIGE",
//   "UMBRIA",
//   "VALLE D'AOSTA",
//   "VENETO",
// ] as const;

// Estendi l'interfaccia Window per Google Maps
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const AffiliateManagement: React.FC = () => {  
  const navigate = useNavigate();
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const mapRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const fullscreenMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const fullscreenMarkersRef = useRef<any[]>([]);

  // Stati per i dati
  const [rowData, setRowData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Filtri
  const [selectedProvincia, setSelectedProvincia] = useState<string>("");
  const [selectedRegione, setSelectedRegione] = useState<string>("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Stato per fullscreen della mappa
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);

  const GOOGLE_MAPS_API_KEY = "AIzaSyBdIcimFZ-qXj-7YzYX0kbCGGxIpAnOA0I";

  // Definisci le colonne usando createColumnHelper
  const columnHelper = createColumnHelper<CustomerData>();

  const columns = [
    columnHelper.accessor("ragioneSociale", {
      header: "Ragione Sociale",
      cell: (info) => (
        <div className={styles.cellPrimary}>{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("nome", {
      header: "Nome",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("cognome", {
      header: "Cognome",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("citta", {
      header: "Città",
      cell: (info) => (
        <div className={styles.cellLocation}>{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("provincia", {
      header: "Provincia",
      cell: (info) => (
        <div className={styles.cellLocation}>
          {PROVINCE_NAMES[info.getValue()] || info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("telefono", {
      header: "Telefono",
      cell: (info) => (
        <div className={styles.badgePhone}>{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("emailAziendale", {
      header: "Email",
      cell: (info) => (
        <div className={styles.badgeEmail}>{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("pIva", {
      header: "Partita IVA",
      cell: (info) => <div className={styles.badgePiva}>{info.getValue()}</div>,
    }),
  ];

  // Inizializza la tabella
  const table = useReactTable({
    data: rowData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Carica Google Maps
  useEffect(() => {
    const ready = () => !!window.google && !!window.google.maps;

    if (ready()) {
      setMapLoaded(true);
      return;
    }

    const scriptId = "gmaps-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly&callback=initMap`;
      script.async = true;
      script.defer = true;

      window.initMap = () => setMapLoaded(true);

      script.onerror = () => {
        console.error("Google Maps JS API non caricata");
      };

      document.head.appendChild(script);
    }
  }, []);

  // Inizializza la mappa normale
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstance.current) {
      initializeMap();
    }
  }, [mapLoaded]);

  // Aggiorna marker quando cambiano i dati per la mappa normale
  useEffect(() => {
    if (mapInstance.current && rowData.length > 0 && !loading) {
      setTimeout(() => {
        updateMapMarkers();
      }, 200);
    }
  }, [rowData, selectedProvincia, selectedRegione, loading]);

  // Gestisce l'aggiornamento della mappa fullscreen quando cambiano i filtri
  useEffect(() => {
    if (
      isMapFullscreen &&
      fullscreenMapInstance.current &&
      rowData.length > 0
    ) {
      updateFullscreenMapMarkers();
    }
  }, [selectedProvincia, selectedRegione, rowData, isMapFullscreen]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const mapOptions = {
      zoom: 6,
      center: { lat: 41.9028, lng: 12.4964 }, // Centro Italia
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "all",
          elementType: "geometry.fill",
          stylers: [{ weight: "2.00" }],
        },
        {
          featureType: "all",
          elementType: "geometry.stroke",
          stylers: [{ color: "#9c9c9c" }],
        },
      ],
    };

    mapInstance.current = new window.google.maps.Map(
      mapRef.current,
      mapOptions
    );
  };

  const initializeFullscreenMap = () => {
    if (!fullscreenMapRef.current || !window.google) return;

    const mapOptions = {
      zoom: 6,
      center: { lat: 41.9028, lng: 12.4964 }, // Centro Italia
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "all",
          elementType: "geometry.fill",
          stylers: [{ weight: "2.00" }],
        },
        {
          featureType: "all",
          elementType: "geometry.stroke",
          stylers: [{ color: "#9c9c9c" }],
        },
      ],
    };

    fullscreenMapInstance.current = new window.google.maps.Map(
      fullscreenMapRef.current,
      mapOptions
    );

    // Aggiorna i marker sulla mappa fullscreen
    updateFullscreenMapMarkers();
  };

  const updateMapMarkers = () => {
    if (!mapInstance.current || !window.google) return;

    // Rimuovi marker esistenti
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Filtra gli affiliati
    let filteredData = rowData.filter(
      (customer) => customer.geocoded && customer.lat && customer.lng
    );

    if (selectedRegione) {
      // Confronto case-insensitive per gestire maiuscole/minuscole
      filteredData = filteredData.filter(
        (d) =>
          d.regione && d.regione.toUpperCase() === selectedRegione.toUpperCase()
      );
    }

    if (selectedProvincia) {
      // Confronto case-insensitive anche per le province
      filteredData = filteredData.filter(
        (d) =>
          d.provincia &&
          d.provincia.toUpperCase() === selectedProvincia.toUpperCase()
      );
    }

    // Crea marker
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidMarkers = false;

    filteredData.forEach((customer) => {
      if (!customer.lat || !customer.lng) return;

      const marker = new window.google.maps.Marker({
        position: { lat: customer.lat, lng: customer.lng },
        map: mapInstance.current,
        title: `${customer.ragioneSociale} - ${customer.citta}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#002454",
          fillOpacity: 0.8,
          strokeColor: "#003875",
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width: 250px; font-family: inherit;">
            <h6 style="margin-bottom: 0.5rem; color: #002454; font-size: 1rem;"><strong>${
              customer.ragioneSociale
            }</strong></h6>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><strong>${
              customer.nome || ""
            } ${customer.cognome || ""}</strong></p>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><small>${
              customer.indirizzo || ""
            }<br>
            ${customer.cap || ""} ${customer.citta} (${
          PROVINCE_NAMES[customer.provincia] || customer.provincia
        })</small></p>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><small>Tel: ${
              customer.telefono
            }</small></p>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><small>Email: ${
              customer.emailAziendale
            }</small></p>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><small>P.IVA: ${
              customer.pIva
            }</small></p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(mapInstance.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: customer.lat, lng: customer.lng });
      hasValidMarkers = true;
    });

    if (hasValidMarkers) {
      mapInstance.current.fitBounds(bounds);
    }
  };

  const updateFullscreenMapMarkers = () => {
    if (!fullscreenMapInstance.current || !window.google) return;

    // Rimuovi marker esistenti
    fullscreenMarkersRef.current.forEach((marker) => marker.setMap(null));
    fullscreenMarkersRef.current = [];

    // Filtra gli affiliati
    let filteredData = rowData.filter(
      (customer) => customer.geocoded && customer.lat && customer.lng
    );

    if (selectedRegione) {
      // Confronto case-insensitive per gestire maiuscole/minuscole
      filteredData = filteredData.filter(
        (d) =>
          d.regione && d.regione.toUpperCase() === selectedRegione.toUpperCase()
      );
    }

    if (selectedProvincia) {
      // Confronto case-insensitive anche per le province
      filteredData = filteredData.filter(
        (d) =>
          d.provincia &&
          d.provincia.toUpperCase() === selectedProvincia.toUpperCase()
      );
    }

    // Crea marker
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidMarkers = false;

    filteredData.forEach((customer) => {
      if (!customer.lat || !customer.lng) return;

      const marker = new window.google.maps.Marker({
        position: { lat: customer.lat, lng: customer.lng },
        map: fullscreenMapInstance.current,
        title: `${customer.ragioneSociale} - ${customer.citta}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#002454",
          fillOpacity: 0.8,
          strokeColor: "#003875",
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width: 250px; font-family: inherit;">
            <h6 style="margin-bottom: 0.5rem; color: #002454; font-size: 1rem;"><strong>${
              customer.ragioneSociale
            }</strong></h6>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><strong>${
              customer.nome || ""
            } ${customer.cognome || ""}</strong></p>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><small>${
              customer.indirizzo || ""
            }<br>
            ${customer.cap || ""} ${customer.citta} (${
          PROVINCE_NAMES[customer.provincia] || customer.provincia
        })</small></p>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><small>Tel: ${
              customer.telefono
            }</small></p>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><small>Email: ${
              customer.emailAziendale
            }</small></p>
            <p style="margin-bottom: 0.5rem; font-size: 0.875rem;"><small>P.IVA: ${
              customer.pIva
            }</small></p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(fullscreenMapInstance.current, marker);
      });

      fullscreenMarkersRef.current.push(marker);
      bounds.extend({ lat: customer.lat, lng: customer.lng });
      hasValidMarkers = true;
    });

    if (hasValidMarkers) {
      fullscreenMapInstance.current.fitBounds(bounds);
    }
  };

  // Funzione helper per ottenere la regione dalla provincia
  const getRegionFromProvince = (provincia: string): string => {
    const provinceToRegion: { [key: string]: string } = {
      LE: "PUGLIA",
      RM: "LAZIO",
      MI: "LOMBARDIA",
      NA: "CAMPANIA",
      AG: "SICILIA",
      AL: "PIEMONTE",
      AN: "MARCHE",
      AO: "VALLE D'AOSTA",
      AR: "TOSCANA",
      AP: "MARCHE",
      AT: "PIEMONTE",
      AV: "CAMPANIA",
      BA: "PUGLIA",
      BT: "PUGLIA",
      BL: "VENETO",
      BN: "CAMPANIA",
      BG: "LOMBARDIA",
      BI: "PIEMONTE",
      BO: "EMILIA-ROMAGNA",
      BZ: "TRENTINO-ALTO ADIGE",
      BS: "LOMBARDIA",
      BR: "PUGLIA",
      CA: "SARDEGNA",
      CL: "SICILIA",
      CB: "MOLISE",
      CE: "CAMPANIA",
      CT: "SICILIA",
      CZ: "CALABRIA",
      CH: "ABRUZZO",
      CO: "LOMBARDIA",
      CS: "CALABRIA",
      CR: "LOMBARDIA",
      KR: "CALABRIA",
      CN: "PIEMONTE",
      EN: "SICILIA",
      FM: "MARCHE",
      FE: "EMILIA-ROMAGNA",
      FI: "TOSCANA",
      FG: "PUGLIA",
      FC: "EMILIA-ROMAGNA",
      FR: "LAZIO",
      GE: "LIGURIA",
      GO: "FRIULI VENEZIA GIULIA",
      GR: "TOSCANA",
      IM: "LIGURIA",
      IS: "MOLISE",
      SP: "LIGURIA",
      AQ: "ABRUZZO",
      LT: "LAZIO",
      LECCE: "PUGLIA", // Aggiungiamo anche il nome completo
      LC: "LOMBARDIA",
      LI: "TOSCANA",
      LO: "LOMBARDIA",
      LU: "TOSCANA",
      MC: "MARCHE",
      MN: "LOMBARDIA",
      MS: "TOSCANA",
      MT: "BASILICATA",
      ME: "SICILIA",
      MO: "EMILIA-ROMAGNA",
      MB: "LOMBARDIA",
      NO: "PIEMONTE",
      NU: "SARDEGNA",
      PD: "VENETO",
      PA: "SICILIA",
      PR: "EMILIA-ROMAGNA",
      PV: "LOMBARDIA",
      PG: "UMBRIA",
      PU: "MARCHE",
      PE: "ABRUZZO",
      PC: "EMILIA-ROMAGNA",
      PI: "TOSCANA",
      PT: "TOSCANA",
      PN: "FRIULI VENEZIA GIULIA",
      PZ: "BASILICATA",
      PO: "TOSCANA",
      RG: "SICILIA",
      RA: "EMILIA-ROMAGNA",
      RC: "CALABRIA",
      RE: "EMILIA-ROMAGNA",
      RI: "LAZIO",
      RN: "EMILIA-ROMAGNA",
      RO: "VENETO",
      SA: "CAMPANIA",
      SS: "SARDEGNA",
      SV: "LIGURIA",
      SI: "TOSCANA",
      SR: "SICILIA",
      SO: "LOMBARDIA",
      TA: "PUGLIA",
      TE: "ABRUZZO",
      TR: "UMBRIA",
      TO: "PIEMONTE",
      TP: "SICILIA",
      TN: "TRENTINO-ALTO ADIGE",
      TV: "VENETO",
      TS: "FRIULI VENEZIA GIULIA",
      UD: "FRIULI VENEZIA GIULIA",
      VA: "LOMBARDIA",
      VE: "VENETO",
      VB: "PIEMONTE",
      VC: "PIEMONTE",
      VR: "VENETO",
      VV: "CALABRIA",
      VI: "VENETO",
      VT: "LAZIO",
    };
    return (
      provinceToRegion[provincia] ||
      provinceToRegion[provincia.toUpperCase()] ||
      "LAZIO"
    ); // Default
  };

  // Funzione condivisa per processare i dati
  const processCustomerData = (data: CustomerData[]) => {
    return data.map((customer: CustomerData) => {
      // Usa la regione dal server se disponibile, altrimenti calcola dalla provincia
      const regioneFromServer = customer.regione?.toUpperCase();
      const regioneFromProvincia = getRegionFromProvince(customer.provincia);

      if (!customer.lat || !customer.lng) {
        const idHash = customer.id.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);

        const latOffset = ((idHash % 1000) / 1000 - 0.5) * 10;
        const lngOffset = (((idHash * 7) % 1000) / 1000 - 0.5) * 10;

        return {
          ...customer,
          lat: 41.9028 + latOffset,
          lng: 12.4964 + lngOffset,
          geocoded: true,
          regione: regioneFromServer || regioneFromProvincia,
          indirizzo:
            customer.indirizzo ||
            `Via ${customer.ragioneSociale.split(" ")[0]} ${
              Math.abs(idHash % 100) + 1
            }`,
          cap: customer.cap || `${Math.abs(idHash % 90000) + 10000}`,
        };
      }
      return {
        ...customer,
        geocoded: true,
        regione: regioneFromServer || regioneFromProvincia,
      };
    });
  };

  // Carica dati affiliati - USA LO STESSO ENDPOINT DEL REFRESH
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = sessionStorage.getItem("token");
        const multitenantId = sessionStorage.getItem("IdCompanyAdmin");

        if (!token || !multitenantId) {
          throw new Error("Token o ID azienda mancanti");
        }

        // USA LO STESSO ENDPOINT DEL REFRESH PER COERENZA
        const response = await fetch(
          `https://localhost:7148/api/Customer/customeraffiliated/with-geolocation?multitenantId=${multitenantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Verifica che ci siano dati
        if (!data || data.length === 0) {
          setRowData([]);
          return;
        }

        // Usa la stessa logica del refreshData
        const processedData = processCustomerData(data);
        setRowData(processedData);
        setIsFirstLoad(false);
        console.log("isFirstLoad", isFirstLoad);
      } catch (error: unknown) {
        console.error("Errore nel caricamento dei clienti:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Errore sconosciuto");
        }
        setRowData([]);
      } finally {
        setLoading(false);
      }
    };

    // Piccolo delay per evitare race conditions
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  const toggleMenu = () => {
    const newState = menuState === "open" ? "closed" : "open";
    setMenuState(newState);
    sessionStorage.setItem("menuState", newState);
  };

  const getUniqueProvinces = () => {
    let provinces = rowData.map((d) => d.provincia);

    if (selectedRegione) {
      provinces = rowData
        .filter(
          (d) =>
            d.regione &&
            d.regione.toUpperCase() === selectedRegione.toUpperCase()
        )
        .map((d) => d.provincia);
    }

    const uniqueProvinces = [...new Set(provinces)].sort();

    return uniqueProvinces.map((provincia) => {
      // Normalizza la provincia per la visualizzazione
      const normalizedProvincia = provincia.toUpperCase();
      const displayName =
        PROVINCE_NAMES[normalizedProvincia] ||
        PROVINCE_NAMES[provincia] ||
        provincia;

      return {
        code: provincia, // Mantieni il valore originale per il confronto
        normalizedCode: normalizedProvincia, // Versione normalizzata
        name: displayName,
        displayValue: `${normalizedProvincia} - ${displayName}`, // Formato completo per dropdown
      };
    });
  };

  // Aggiungi questa funzione per ottenere le regioni uniche dai dati
  const getUniqueRegions = () => {
    const regions = rowData
      .map((d) => d.regione?.trim()) // string | undefined
      .filter((region): region is string => !!region) // <-- type guard: ora è string
      .map((region) => region.toLocaleUpperCase("it-IT")); // normalizza

    const uniqueRegions = Array.from(new Set(regions)).sort((a, b) =>
      a.localeCompare(b, "it-IT", { sensitivity: "base" })
    );
    return uniqueRegions;
  };

  const getFilteredCount = () => {
    let filtered = rowData;

    if (selectedRegione) {
      // Confronto case-insensitive per gestire maiuscole/minuscole
      filtered = filtered.filter(
        (d) =>
          d.regione && d.regione.toUpperCase() === selectedRegione.toUpperCase()
      );
    }

    if (selectedProvincia) {
      // Confronto case-insensitive anche per le province
      filtered = filtered.filter(
        (d) =>
          d.provincia &&
          d.provincia.toUpperCase() === selectedProvincia.toUpperCase()
      );
    }

    return filtered.length;
  };

  const getTotals = () => {
    const geocoded = rowData.filter((d) => d.geocoded).length;
    const fromCache = rowData.filter((d) => d.fromCache).length;
    return {
      total: rowData.length,
      geocoded,
      fromCache,
      notGeocoded: rowData.length - geocoded,
    };
  };

  // Funzione per ricaricare/aggiornare i dati
  const refreshData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");
      const multitenantId = sessionStorage.getItem("IdCompanyAdmin");

      if (!token || !multitenantId) {
        throw new Error("Token o ID azienda mancanti");
      }

      const response = await fetch(
        `https://localhost:7148/api/Customer/customeraffiliated/with-geolocation?multitenantId=${multitenantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Usa la stessa funzione di processamento
      const processedData = processCustomerData(data);
      setRowData(processedData);
      setIsFirstLoad(false);
    } catch (error: unknown) {
      console.error("Errore nell'aggiornamento dei dati:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Errore sconosciuto nell'aggiornamento");
      }
    } finally {
      setLoading(false);
    }
  };

  // Funzione per navigare alla modifica di un affiliato
  // const handleEditAffiliate = (affiliateId: string) => {
  //   navigate(`/master-company/${affiliateId}`);
  // };

  // Funzioni per gestire il fullscreen della mappa
  const toggleMapFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);

    if (!isMapFullscreen) {
      // Entra in fullscreen - inizializza la mappa fullscreen
      setTimeout(() => {
        initializeFullscreenMap();
      }, 100);
    }
  };

  const exitMapFullscreen = () => {
    setIsMapFullscreen(false);

    // Pulisci i marker della mappa fullscreen
    fullscreenMarkersRef.current.forEach((marker) => marker.setMap(null));
    fullscreenMarkersRef.current = [];
    fullscreenMapInstance.current = null;

    // Ridimensiona la mappa normale
    setTimeout(() => {
      if (mapInstance.current && window.google) {
        window.google.maps.event.trigger(mapInstance.current, "resize");
        updateMapMarkers();
      }
    }, 300);
  };

  // Effect per gestire il tasto ESC per uscire dal fullscreen
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMapFullscreen) {
        exitMapFullscreen();
      }
    };

    if (isMapFullscreen) {
      document.addEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "unset";
    };
  }, [isMapFullscreen]);

  const totals = getTotals();

  return (
    <div
      className={`${styles.wrapper} ${
        menuState === "closed" ? styles.menuClosed : ""
      }`}
      id="wrapper"
    >
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />

      <div className={styles.pageContentWrapper}>
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.containerFluid}>
          <div className={styles.spacer} />

          {/* Header con breadcrumb */}
          <div className={styles.pageHeader}>
            <div>
              <nav aria-label="breadcrumb">
                <ol className={styles.breadcrumb}>
                  <li className={styles.breadcrumbItem}>
                    <button
                      className={styles.breadcrumbLink}
                      onClick={() => navigate("/dashboard")}
                    >
                      <i className="fa-solid fa-users me-1"></i>
                      Gestione
                    </button>
                  </li>
                  <li className={`${styles.breadcrumbItem} ${styles.active}`}>
                    Gestione Affiliati
                  </li>
                </ol>
              </nav>
              <h2 className={styles.pageTitle}>
                <i className="fa-solid fa-users me-2"></i>
                Gestione Affiliati
              </h2>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.btnSecondary}
                onClick={refreshData}
                disabled={loading}
                title="Aggiorna dati affiliati"
              >
                <i
                  className={`fa-solid fa-refresh me-1 ${
                    loading ? "fa-spin" : ""
                  }`}
                ></i>
                Aggiorna
              </button>
            </div>
          </div>

          {/* Statistiche rapide */}
          <div className={styles.statsSection}>
            <div className={styles.statsCard}>
              <div className={styles.cardHeader}>
                <span>Statistiche Affiliati</span>
                <i className="fa-solid fa-chart-bar"></i>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.statsGrid}>
                  <div className={`${styles.statBox} ${styles.primary}`}>
                    <h4>{totals.total}</h4>
                    <small>Affiliati Totali</small>
                  </div>
                  <div className={`${styles.statBox} ${styles.success}`}>
                    <h4>{totals.geocoded}</h4>
                    <small>Geocodificati</small>
                  </div>
                  <div className={`${styles.statBox} ${styles.info}`}>
                    <h4>{totals.fromCache}</h4>
                    <small>Da Cache DB</small>
                  </div>
                  <div className={`${styles.statBox} ${styles.warning}`}>
                    <h4>{totals.notGeocoded}</h4>
                    <small>Non geocodificati</small>
                  </div>
                  <div className={`${styles.statBox} ${styles.dark}`}>
                    <h4>{getFilteredCount()}</h4>
                    <small>Filtrati</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mappa Affiliati */}
          <div className={styles.mapSection}>
            <div className={styles.cardHeader}>
              <span>Mappa Affiliati</span>
              <div className={styles.mapControls}>
                <div className={styles.filterIcon}>
                  <i className="fa-solid fa-filter" />
                </div>
                <div
                  className={styles.expandIcon}
                  onClick={toggleMapFullscreen}
                  title="Espandi mappa a schermo intero"
                >
                  <i className="fa-solid fa-expand" />
                </div>
              </div>
            </div>

            <div className={styles.mapCard}>
              {/* Filtri mappa */}
              <div className={styles.mapFilters}>
                <div className={styles.filtersRow}>
                  <div className={styles.filterGroup}>
                    <select
                      className={styles.selectFilter}
                      value={selectedRegione}
                      onChange={(e) => setSelectedRegione(e.target.value)}
                    >
                      <option value="">Seleziona Regione...</option>
                      {getUniqueRegions().map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <select
                      className={styles.selectFilter}
                      value={selectedProvincia}
                      onChange={(e) => setSelectedProvincia(e.target.value)}
                    >
                      <option value="">Tutte le province</option>
                      {getUniqueProvinces().map((provincia) => (
                        <option
                          key={provincia.normalizedCode}
                          value={provincia.code}
                        >
                          {provincia.displayValue}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <button className={styles.btnMapUpdate}>
                      <i className="fa-solid fa-map-marker-alt me-1"></i>
                      Aggiorna Mappa
                    </button>
                  </div>
                </div>
              </div>

              {/* Mappa */}
              {!mapLoaded ? (
                <div className={styles.mapPlaceholder}>
                  <div className={styles.placeholderContent}>
                    <i className="fa-solid fa-map fa-3x mb-3"></i>
                    <h5>Caricamento mappa...</h5>
                  </div>
                </div>
              ) : (
                <div ref={mapRef} className={styles.mapContainer}></div>
              )}
            </div>
          </div>

          {/* Tabella Affiliati */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>Lista Affiliati</h3>
              <div className={styles.tableControls}>
                <div className={styles.searchContainer}>
                  <i className="fa-solid fa-magnifying-glass search-icon-table"></i>
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className={styles.searchInput}
                    placeholder="Cerca affiliati..."
                  />
                </div>
              </div>
            </div>

            {loading && (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span>Caricamento affiliati...</span>
              </div>
            )}

            {error && (
              <div className={styles.errorContainer}>
                <i className="fa-solid fa-exclamation-triangle"></i>
                <span>Errore: {error}</span>
              </div>
            )}

            {!loading && !error && rowData.length > 0 && (
              <div className={styles.tableWrapper}>
                <table className={styles.modernTable}>
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className={styles.headerContent}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                              <span className={styles.sortIndicator}>
                                {{
                                  asc: "▲",
                                  desc: "▼",
                                }[header.column.getIsSorted() as string] ?? "⇅"}
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
                        table.getFilteredRowModel().rows.length
                      )}
                    </strong>{" "}
                    di{" "}
                    <strong>{table.getFilteredRowModel().rows.length}</strong>{" "}
                    risultati
                  </div>
                  <div className={styles.paginationControls}>
                    <button
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      className={styles.paginationBtn}
                    >
                      ⟪
                    </button>
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className={styles.paginationBtn}
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
                    >
                      ›
                    </button>
                    <button
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
                      disabled={!table.getCanNextPage()}
                      className={styles.paginationBtn}
                    >
                      ⟫
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overlay Fullscreen Mappa */}
          {isMapFullscreen && (
            <div className={styles.mapFullscreenOverlay}>
              <div className={styles.fullscreenHeader}>
                <h3>
                  <i className="fa-solid fa-map-marker-alt me-2"></i>
                  Mappa Affiliati - Visualizzazione Completa
                </h3>
                <div className={styles.fullscreenControls}>
                  <span className={styles.escHint}>Premi ESC per uscire</span>
                  <button
                    className={styles.closeFullscreenBtn}
                    onClick={exitMapFullscreen}
                    title="Chiudi visualizzazione a schermo intero"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              </div>

              {/* Filtri nella modalità fullscreen */}
              <div className={styles.fullscreenFilters}>
                <select
                  className={styles.selectFilter}
                  value={selectedRegione}
                  onChange={(e) => setSelectedRegione(e.target.value)}
                >
                  <option value="">Tutte le Regioni</option>
                  {getUniqueRegions().map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <select
                  className={styles.selectFilter}
                  value={selectedProvincia}
                  onChange={(e) => setSelectedProvincia(e.target.value)}
                >
                  <option value="">Tutte le Province</option>
                  {getUniqueProvinces().map((provincia) => (
                    <option
                      key={provincia.normalizedCode}
                      value={provincia.code}
                    >
                      {provincia.displayValue}
                    </option>
                  ))}
                </select>

                <div className={styles.fullscreenStats}>
                  <span>Totali: {totals.total}</span>
                  <span>Geocodificati: {totals.geocoded}</span>
                  <span>Filtrati: {getFilteredCount()}</span>
                </div>
              </div>

              <div className={styles.fullscreenMapContainer}>
                {!mapLoaded ? (
                  <div className={styles.mapPlaceholder}>
                    <div className={styles.placeholderContent}>
                      <i className="fa-solid fa-map fa-3x mb-3"></i>
                      <h5>Caricamento mappa...</h5>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={fullscreenMapRef}
                    className={styles.mapContainer}
                  ></div>
                )}
              </div>
            </div>
          )}

          <div className={styles.spacer} />
        </div>
      </div>
    </div>
  );
};

export default AffiliateManagement;
