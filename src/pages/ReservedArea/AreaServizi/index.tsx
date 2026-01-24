import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/sidebar-admin";
import Topbar from "../../../components/topbar-admin";
import styles from "./areaservizi.module.css";
import {
  BarChart3,
  FileText,
  Gift,
  Package,
  Landmark,
  Calculator,
  ShoppingCart,
  Shield,
  Truck,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Zap,
  Sparkles,
  TrendingUp,
  Activity,
  Grid3x3,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";

type ServiceItem = {
  name: string;
  description: string;
  isActive: boolean;
};

type ServiceGroup = {
  title: string;
  subtitle: string;
  items: ServiceItem[];
  icon: React.ReactNode;
};

const AreaServizi: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup | null>(null);
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "success">("idle");
  const navigate = useNavigate();

  const serviceGroups: ServiceGroup[] = [
    {
      title: "Dashboard e Controllo di Gestione",
      subtitle: "Monitoraggio e analisi delle performance aziendali",
      icon: <BarChart3 size={24} />,
      items: [
        {
          name: "Dashboard",
          description:
            "Pannello di controllo centralizzato che mostra in tempo reale gli indicatori economici, finanziari e operativi dell'attività.",
          isActive: false,
        },
        {
          name: "Analisi",
          description:
            "Modulo di analisi avanzata dei dati per il controllo di gestione, il monitoraggio delle performance e il supporto alle decisioni strategiche.",
          isActive: false,
        },
      ],
    },
    {
      title: "Fatturazione Elettronica",
      subtitle: "Gestione completa del ciclo di fatturazione",
      icon: <FileText size={24} />,
      items: [
        {
          name: "Crea Fattura",
          description:
            "Creazione guidata e manuale di fatture elettroniche conformi alla normativa vigente.",
          isActive: false,
        },
        {
          name: "Sezionali",
          description:
            "Gestione dei sezionali di fatturazione per una corretta organizzazione fiscale e amministrativa.",
          isActive: false,
        },
        {
          name: "Fatture Emesse",
          description:
            "Consultazione, gestione e monitoraggio delle fatture attive.",
          isActive: false,
        },
        {
          name: "Fatture Ricevute",
          description:
            "Raccolta, archiviazione e gestione strutturata delle fatture passive.",
          isActive: false,
        },
        {
          name: "Bozze e ProForma",
          description:
            "Creazione di bozze e fatture proforma, pronte per la conversione in fattura elettronica.",
          isActive: false,
        },
      ],
    },
    {
      title: "Marketing e Fidelizzazione",
      subtitle: "Strumenti per promozioni e customer engagement",
      icon: <Gift size={24} />,
      items: [
        {
          name: "Voucher",
          description:
            "Creazione e gestione di voucher digitali per campagne promozionali, scontistiche e programmi di fidelizzazione clienti.",
          isActive: false,
        },
        {
          name: "Vendolo",
          description:
            "Canale TV digitale: una vetrina interattiva ed e-marketplace di prossimità che promuove prodotti, offerte e storytelling locale, connessa al magazzino Profit+ per vendere e comunicare in tempo reale.",
          isActive: false,
        },
      ],
    },
    {
      title: "Magazzino",
      subtitle: "Gestione integrata di inventario e giacenze",
      icon: <Package size={24} />,
      items: [
        {
          name: "Magazzino Profit+",
          description:
            "Magazzino gestionale integrato nativamente con l'intera piattaforma, non un semplice inventario: consente il controllo delle giacenze, la sincronizzazione con fatturazione, cassa, Vendolo e dashboard, garantendo coerenza e continuità nei flussi operativi e commerciali.",
          isActive: false,
        },
      ],
    },
    {
      title: "Open Banking",
      subtitle: "Connessione diretta con il sistema bancario",
      icon: <Landmark size={24} />,
      items: [
        {
          name: "Conti Correnti",
          description:
            "Gestione centralizzata di uno o più conti correnti bancari collegati all'attività.",
          isActive: false,
        },
        {
          name: "Lista Movimenti",
          description:
            "Consultazione dettagliata e aggiornata dei movimenti bancari importati automaticamente.",
          isActive: false,
        },
        {
          name: "Documentazione Bancaria",
          description:
            "Archivio digitale della documentazione bancaria associata ai conti correnti.",
          isActive: false,
        },
      ],
    },
    {
      title: "Ragioneria Digitale",
      subtitle: "Contabilità e gestione amministrativa",
      icon: <Calculator size={24} />,
      items: [
        {
          name: "Prima Nota",
          description:
            "Registrazione strutturata delle operazioni contabili quotidiane.",
          isActive: false,
        },
        {
          name: "Scadenzario",
          description:
            "Gestione e monitoraggio di scadenze, incassi e pagamenti futuri.",
          isActive: false,
        },
        {
          name: "Piano dei Conti",
          description:
            "Consultazione e organizzazione del piano dei conti aziendale.",
          isActive: false,
        },
        {
          name: "Export DATEV",
          description:
            "Esportazione dei dati contabili in formato standard DATEV per l'integrazione con studi e commercialisti.",
          isActive: false,
        },
      ],
    },
    {
      title: "Cassa Digitale",
      subtitle: "Sistema di gestione vendite e incassi",
      icon: <ShoppingCart size={24} />,
      items: [
        {
          name: "Scontrino 4U",
          description:
            "Visualizzazione e gestione digitale degli scontrini di vendita.",
          isActive: false,
        },
        {
          name: "Preventivi",
          description:
            "Creazione e gestione dei preventivi commerciali, pronti per la conversione in vendita.",
          isActive: false,
        },
        {
          name: "Casse",
          description:
            "Gestione delle operazioni di incasso e delle casse digitali del punto vendita.",
          isActive: false,
        },
      ],
    },
    {
      title: "Compliance Digitale & Customer Trust",
      subtitle: "Gestione privacy e conformità normativa",
      icon: <Shield size={24} />,
      items: [
        {
          name: "Firma grafica su tablet",
          description:
            "Raccolta della firma del cliente su tablet per la gestione dell'informativa privacy e della policy aziendale, con tracciabilità, archiviazione digitale e supporto alla conformità normativa nel rapporto con il cliente finale.",
          isActive: false,
        },
      ],
    },
    {
      title: "Mobilità Operativa & Trasferte",
      subtitle: "Ottimizzazione percorsi e gestione flotta",
      icon: <Truck size={24} />,
      items: [
        {
          name: "Gestione Trasferte IoT",
          description:
            "Gestione avanzata delle trasferte operative tramite tecnologia IoT per il tracciamento del mezzo e API per l'ottimizzazione dei percorsi degli operatori, con monitoraggio degli spostamenti, riduzione dei tempi e dei costi e integrazione con il resto della piattaforma per una pianificazione efficiente delle attività sul territorio.",
          isActive: false,
        },
      ],
    },
  ];

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      return newSet;
    });
  };

  const handleRequestActivation = () => {
    setRequestStatus("loading");
    setTimeout(() => {
      setRequestStatus("success");
    }, 2000);
  };

  const handleCloseModal = () => {
    setSelectedGroup(null);
    setRequestStatus("idle");
  };

  const totalServices = serviceGroups.reduce(
    (acc, group) => acc + group.items.length,
    0
  );
  const activeServices = serviceGroups.reduce(
    (acc, group) =>
      acc + group.items.filter((item) => item.isActive).length,
    0
  );
  const availableServices = totalServices - activeServices;

  return (
    <div className="main-layout">
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className="content-area">
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.schedaHeader}>
          <div className={styles.leftBlock}>
            <div className={styles.headerTitle}>Area Servizi</div>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Home</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbItem}>Area Riservata</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>Area Servizi</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/master-company")}
          >
            Torna a Master Company
          </button>
        </div>

        <div className="page-body">
          <div className={styles.servicesCard}>
            <div className={styles.servicesHeader}>
              <Sparkles size={24} color="#fff" />
              <h2 className={styles.servicesTitle}>Servizi Disponibili</h2>
            </div>

            <div className={styles.statsContainer}>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}>
                  <Grid3x3 size={24} color="#fff" />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{totalServices}</div>
                  <div className={styles.statLabel}>Servizi Totali</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}>
                  <Activity size={24} color="#fff" />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{activeServices}</div>
                  <div className={styles.statLabel}>Servizi Attivi</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}>
                  <TrendingUp size={24} color="#fff" />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{availableServices}</div>
                  <div className={styles.statLabel}>Da Attivare</div>
                </div>
              </div>
            </div>

            <div className={styles.servicesGrid}>
              {serviceGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.title);
                const hasActiveServices = group.items.some(
                  (item) => item.isActive
                );

                return (
                  <section key={group.title} className={styles.serviceGroup}>
                    <div
                      className={styles.groupHeader}
                      onClick={() => toggleGroup(group.title)}
                    >
                      <div className={styles.groupHeaderLeft}>
                        <div className={styles.groupIcon}>{group.icon}</div>
                        <div className={styles.groupTitleWrapper}>
                          <h3 className={styles.groupTitle}>{group.title}</h3>
                          <p className={styles.groupSubtitle}>
                            {group.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className={styles.groupHeaderRight}>
                        <span
                          className={`${styles.statusBadge} ${
                            hasActiveServices
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {hasActiveServices ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
                          {hasActiveServices ? "Attivo" : "Non attivo"}
                        </span>
                        <button
                          type="button"
                          className={styles.requestBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(group);
                          }}
                        >
                          <Zap size={14} />
                          Richiedi Attivazione
                        </button>
                        <div
                          className={`${styles.expandIcon} ${
                            isExpanded ? styles.expanded : ""
                          }`}
                        >
                          <ChevronDown size={20} />
                        </div>
                      </div>
                    </div>

                    <div
                      className={`${styles.groupContent} ${
                        isExpanded ? styles.expanded : ""
                      }`}
                    >
                      <ul className={styles.groupList}>
                        {group.items.map((item) => (
                          <li key={item.name} className={styles.groupItem}>
                            <div className={styles.itemIconWrapper}>
                              <Sparkles size={20} color="#fff" />
                            </div>
                            <div className={styles.itemContent}>
                              <div className={styles.itemHeader}>
                                <h4 className={styles.itemName}>
                                  {item.name}
                                </h4>
                                {item.isActive && (
                                  <span className={styles.itemBadge}>
                                    Attivo
                                  </span>
                                )}
                              </div>
                              <p className={styles.itemDescription}>
                                {item.description}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedGroup && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={handleCloseModal}
            >
              <X size={20} />
            </button>

            {requestStatus === "success" ? (
              <div className={styles.successContent}>
                <div className={styles.successIconWrapper}>
                  <CheckCircle size={48} />
                </div>
                <h3 className={styles.successTitle}>Richiesta di attivazione Inviata</h3>
                <p className={styles.successMessage}>
                  La tua richiesta per <strong>{selectedGroup.title}</strong> è stata inviata con successo.
                  Sarai contattato al più presto.
                </p>
                <button
                  type="button"
                  className={styles.modalConfirmBtn}
                  onClick={handleCloseModal}
                >
                  Chiudi
                </button>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <div className={styles.modalIcon}>{selectedGroup.icon}</div>
                  <div className={styles.modalTitleWrapper}>
                    <h3 className={styles.modalTitle}>{selectedGroup.title}</h3>
                    <p className={styles.modalSubtitle}>{selectedGroup.subtitle}</p>
                  </div>
                </div>

                <div className={styles.modalBody}>
                  <h4 className={styles.modalSectionTitle}>
                    Servizi che verranno attivati:
                  </h4>
                  <ul className={styles.modalServiceList}>
                    {selectedGroup.items.map((item) => (
                      <li key={item.name} className={styles.modalServiceItem}>
                        <CheckCircle2 size={18} className={styles.modalCheckIcon} />
                        <div>
                          <span className={styles.modalServiceName}>{item.name}</span>
                          <p className={styles.modalServiceDesc}>{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.modalCancelBtn}
                    onClick={handleCloseModal}
                    disabled={requestStatus === "loading"}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    className={styles.modalConfirmBtn}
                    onClick={handleRequestActivation}
                    disabled={requestStatus === "loading"}
                  >
                    {requestStatus === "loading" ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Richiedi Attivazione
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaServizi;