import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import type { View, Event } from "react-big-calendar";
import moment from "moment";
//import "moment/locale/it";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import styles from "../RicercaPrenotazioni/styles.module.css";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import { useNavigate } from "react-router-dom";

// Configura moment in italiano
moment.locale("it");
const localizer = momentLocalizer(moment);

// Interfaccia per le prenotazioni
interface Booking {
  id: number;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deviceType: string;
  deviceModel: string;
  scheduledDate: string;
  scheduledTime: string;
  bookingStatus: string;
  technicianAssigned?: string;
  estimatedPrice?: number;
  paymentType?: string;
  notes?: string;
  createdAt: string;
}

// Interfaccia per gli eventi del calendario
interface CalendarEvent extends Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
}

// Funzione helper per ottenere l'icona del dispositivo
const getDeviceIcon = (deviceType: string): string => {
  const type = deviceType?.toLowerCase() || "";
  if (type.includes("smartphone") || type.includes("telefono")) return "📱";
  if (type.includes("tablet")) return "📱";
  if (type.includes("laptop") || type.includes("notebook")) return "💻";
  if (type.includes("pc") || type.includes("computer")) return "🖥️";
  if (type.includes("console")) return "🎮";
  if (type.includes("smartwatch") || type.includes("watch")) return "⌚";
  return "🔧";
};

// Funzione helper per ottenere la classe CSS dello stato
const getStatusClass = (status: string): string => {
  const statusLower = status?.toLowerCase() || "";
  if (statusLower.includes("confermata") || statusLower.includes("confermato"))
    return "statusConfirmed";
  if (statusLower.includes("attesa") || statusLower.includes("pending"))
    return "statusPending";
  if (statusLower.includes("completata") || statusLower.includes("completato"))
    return "statusCompleted";
  if (statusLower.includes("annullata") || statusLower.includes("annullato"))
    return "statusCancelled";
  if (statusLower.includes("corso") || statusLower.includes("progress"))
    return "statusInProgress";
  return "statusDefault";
};

// Funzione helper per ottenere l'icona dello stato
const getStatusIcon = (status: string): string => {
  const statusLower = status?.toLowerCase() || "";
  if (statusLower.includes("confermata") || statusLower.includes("confermato"))
    return "✓";
  if (statusLower.includes("attesa") || statusLower.includes("pending"))
    return "⏳";
  if (statusLower.includes("completata") || statusLower.includes("completato"))
    return "✓";
  if (statusLower.includes("annullata") || statusLower.includes("annullato"))
    return "✗";
  if (statusLower.includes("corso") || statusLower.includes("progress"))
    return "⚙️";
  return "•";
};

const CalendarioPrenotazioni: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  // Stati per i dati
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Stati per il calendario
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());

  // Stati per il filtro
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [technicianFilter, setTechnicianFilter] = useState<string>("");

  // Stati per il modal di dettaglio
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Caricamento dati
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const multitenantId = sessionStorage.getItem("IdCompany");
      if (!multitenantId) throw new Error("ID azienda non trovato");

      const response = await fetch(`${API_URL}/api/booking?multitenantid=${multitenantId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error("Errore nel caricamento delle prenotazioni:", err);
      setError("Impossibile caricare le prenotazioni. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  // Conversione prenotazioni in eventi calendario
  const events = useMemo<CalendarEvent[]>(() => {
    return bookings
      .filter((booking) => {
        // Filtra per stato
        if (statusFilter && booking.bookingStatus !== statusFilter) {
          return false;
        }
        // Filtra per tecnico
        if (
          technicianFilter &&
          booking.technicianAssigned !== technicianFilter
        ) {
          return false;
        }
        return true;
      })
      .map((booking) => {
        // Combina data e ora
        const [hours, minutes] = (booking.scheduledTime || "09:00").split(":");
        const startDate = moment(booking.scheduledDate)
          .hour(parseInt(hours))
          .minute(parseInt(minutes))
          .toDate();

        // Durata stimata: 1 ora
        const endDate = moment(startDate).add(1, "hour").toDate();

        return {
          id: booking.id,
          title: `${getDeviceIcon(booking.deviceType)} ${booking.customerName}`,
          start: startDate,
          end: endDate,
          resource: booking,
        };
      });
  }, [bookings, statusFilter, technicianFilter]);

  // Lista unica di stati
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(bookings.map((b) => b.bookingStatus));
    return Array.from(statuses).sort();
  }, [bookings]);

  // Lista unica di tecnici
  const uniqueTechnicians = useMemo(() => {
    const technicians = new Set(
      bookings
        .map((b) => b.technicianAssigned)
        .filter((t) => t !== undefined && t !== null && t !== "")
    );
    return Array.from(technicians).sort();
  }, [bookings]);

  // Gestione selezione evento
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedBooking(event.resource);
    setShowDetailModal(true);
  }, []);

  // Gestione navigazione
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Chiusura modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
  };

  // Stile personalizzato per gli eventi
  const eventStyleGetter = (event: CalendarEvent) => {
    const statusClass = getStatusClass(event.resource.bookingStatus);
    let backgroundColor = "#666666";

    switch (statusClass) {
      case "statusConfirmed":
        backgroundColor = "#26a69a";
        break;
      case "statusPending":
        backgroundColor = "#ffa726";
        break;
      case "statusCompleted":
        backgroundColor = "#42a5f5";
        break;
      case "statusCancelled":
        backgroundColor = "#ef5350";
        break;
      case "statusInProgress":
        backgroundColor = "#ab47bc";
        break;
      default:
        backgroundColor = "#666666";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "13px",
        fontWeight: "500",
        padding: "4px 8px",
      },
    };
  };

  // Formattazione data per il modal
  const formatDetailDate = (dateString: string): string => {
    return moment(dateString).format("DD/MM/YYYY HH:mm");
  };

  // Formattazione data per il breadcrumb
  const formatCurrentDate = (): string => {
    return moment(date).format("MMMM YYYY");
  };

  // Messaggi personalizzati
  const messages = {
    date: "Data",
    time: "Ora",
    event: "Evento",
    allDay: "Tutto il giorno",
    week: "Settimana",
    work_week: "Settimana lavorativa",
    day: "Giorno",
    month: "Mese",
    previous: "Precedente",
    next: "Successivo",
    yesterday: "Ieri",
    tomorrow: "Domani",
    today: "Oggi",
    agenda: "Agenda",
    noEventsInRange: "Nessuna prenotazione in questo periodo.",
    showMore: (total: number) => `+${total} altre`,
  };

  // Custom toolbar
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate("PREV");
    };

    const goToNext = () => {
      toolbar.onNavigate("NEXT");
    };

    const goToCurrent = () => {
      toolbar.onNavigate("TODAY");
    };

    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className={styles.calendarToolbarLabel}>
          {view === "month" && date.format("MMMM YYYY")}
          {view === "week" && `Settimana del ${date.format("DD MMMM YYYY")}`}
          {view === "day" && date.format("DD MMMM YYYY")}
          {view === "agenda" && "Agenda"}
        </span>
      );
    };

    return (
      <div className={styles.calendarToolbar}>
        <div className={styles.calendarToolbarLeft}>
          <button
            className={styles.calendarNavBtn}
            onClick={goToBack}
            title="Precedente"
          >
            <ChevronLeft size={20} />
          </button>
          <button className={styles.calendarTodayBtn} onClick={goToCurrent}>
            Oggi
          </button>
          <button
            className={styles.calendarNavBtn}
            onClick={goToNext}
            title="Successivo"
          >
            <ChevronRight size={20} />
          </button>
          <div className={styles.calendarToolbarDate}>{label()}</div>
        </div>

        <div className={styles.calendarToolbarRight}>
          <button
            className={`${styles.calendarViewBtn} ${
              view === "day" ? styles.active : ""
            }`}
            onClick={() => toolbar.onView("day")}
          >
            Giorno
          </button>
          <button
            className={`${styles.calendarViewBtn} ${
              view === "week" ? styles.active : ""
            }`}
            onClick={() => toolbar.onView("week")}
          >
            Settimana
          </button>
          <button
            className={`${styles.calendarViewBtn} ${
              view === "month" ? styles.active : ""
            }`}
            onClick={() => toolbar.onView("month")}
          >
            Mese
          </button>
          <button
            className={`${styles.calendarViewBtn} ${
              view === "agenda" ? styles.active : ""
            }`}
            onClick={() => toolbar.onView("agenda")}
          >
            Agenda
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />

      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        {/* Header */}
        <div className={styles.schedaHeader}>
          <div className={styles.leftBlock}>
            <button
              className={styles.roundBtn}
              onClick={() => navigate("/ricerca-prenotazioni")}
              title="Torna alla ricerca"
            >
              <span className={styles.plusIcon}>←</span>
            </button>

            <div className={styles.dateBox}>
              <CalendarIcon className={styles.calendarIcon} />
              <div className={styles.dateTextInline}>
                <span style={{ fontWeight: "600" }}>{formatCurrentDate()}</span>
                <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                  Calendario Prenotazioni
                </span>
              </div>
            </div>
          </div>

          <div className={styles.breadcrumb}>
            <span
              className={styles.breadcrumbItem}
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            >
              Home
            </span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span
              className={styles.breadcrumbItem}
              onClick={() => navigate("/ricerca-prenotazioni")}
              style={{ cursor: "pointer" }}
            >
              Prenotazioni
            </span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>Calendario</span>
          </div>
        </div>

        {/* Body */}
        <div className={styles.pageBody}>
          {/* Sezione Filtri */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderInfo}>
                <h3>📅 Calendario Prenotazioni</h3>
                <span style={{ fontSize: "14px", color: "#666" }}>
                  {events.length} prenotazion{events.length !== 1 ? "i" : "e"}{" "}
                  visualizzat{events.length !== 1 ? "e" : "a"}
                </span>
              </div>

              <div className={styles.tableControls}>
                {/* Filtro Stato */}
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tutti gli stati</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                {/* Filtro Tecnico */}
                <select
                  className={styles.filterSelect}
                  value={technicianFilter}
                  onChange={(e) => setTechnicianFilter(e.target.value)}
                >
                  <option value="">Tutti i tecnici</option>
                  {uniqueTechnicians.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>

                {/* Pulsante Reset Filtri */}
                {(statusFilter || technicianFilter) && (
                  <button
                    className={styles.clearFiltersBtn}
                    onClick={() => {
                      setStatusFilter("");
                      setTechnicianFilter("");
                    }}
                  >
                    Pulisci Filtri
                  </button>
                )}
              </div>
            </div>

            {/* Calendario */}
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span>Caricamento calendario...</span>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <i className="fa-solid fa-exclamation-triangle"></i>
                <span>{error}</span>
              </div>
            ) : (
              <div className={styles.calendarContainer}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  onView={handleViewChange}
                  date={date}
                  onNavigate={handleNavigate}
                  onSelectEvent={handleSelectEvent}
                  eventPropGetter={eventStyleGetter}
                  messages={messages}
                  style={{ height: "700px" }}
                  components={{
                    toolbar: CustomToolbar,
                  }}
                  step={30}
                  timeslots={2}
                  min={moment("08:00", "HH:mm").toDate()}
                  max={moment("20:00", "HH:mm").toDate()}
                  formats={{
                    dayFormat: "DD ddd",
                    weekdayFormat: "dddd",
                    monthHeaderFormat: "MMMM YYYY",
                    dayHeaderFormat: "dddd DD MMMM",
                    dayRangeHeaderFormat: ({ start, end }) =>
                      `${moment(start).format("DD MMM")} - ${moment(end).format(
                        "DD MMM YYYY"
                      )}`,
                  }}
                />
              </div>
            )}

            {/* Legenda Stati */}
            <div className={styles.calendarLegend}>
              <h4>Legenda Stati:</h4>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <span
                    className={styles.legendColor}
                    style={{ backgroundColor: "#26a69a" }}
                  ></span>
                  <span>Confermata</span>
                </div>
                <div className={styles.legendItem}>
                  <span
                    className={styles.legendColor}
                    style={{ backgroundColor: "#ffa726" }}
                  ></span>
                  <span>In Attesa</span>
                </div>
                <div className={styles.legendItem}>
                  <span
                    className={styles.legendColor}
                    style={{ backgroundColor: "#ab47bc" }}
                  ></span>
                  <span>In Corso</span>
                </div>
                <div className={styles.legendItem}>
                  <span
                    className={styles.legendColor}
                    style={{ backgroundColor: "#42a5f5" }}
                  ></span>
                  <span>Completata</span>
                </div>
                <div className={styles.legendItem}>
                  <span
                    className={styles.legendColor}
                    style={{ backgroundColor: "#ef5350" }}
                  ></span>
                  <span>Annullata</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BottomBar />
      </div>

      {/* Modal Dettagli Prenotazione */}
      {showDetailModal && selectedBooking && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div
            className={styles.repairDetailModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className={styles.repairDetailHeader}>
              <div className={styles.repairDetailTitleSection}>
                <h2>📋 Dettagli Prenotazione</h2>
                <div className={styles.repairDetailCodeAndStatus}>
                  <span className={styles.repairDetailCode}>
                    {selectedBooking.bookingCode}
                  </span>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[getStatusClass(selectedBooking.bookingStatus)]
                    }`}
                  >
                    {getStatusIcon(selectedBooking.bookingStatus)}{" "}
                    {selectedBooking.bookingStatus}
                  </span>
                </div>
              </div>
              <button
                className={styles.repairDetailCloseBtn}
                onClick={closeDetailModal}
                title="Chiudi"
              >
                ×
              </button>
            </div>

            {/* Body Modal */}
            <div className={styles.repairDetailBody}>
              <div className={styles.repairDetailContent}>
                {/* Timeline */}
                <div className={styles.repairDetailSection}>
                  <h3>🕒 Timeline Prenotazione</h3>
                  <div className={styles.repairTimeline}>
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineIcon}>📝</div>
                      <div className={styles.timelineContent}>
                        <strong>Creazione</strong>
                        <span>
                          {formatDetailDate(selectedBooking.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.timelineItem}>
                      <div className={styles.timelineIcon}>📅</div>
                      <div className={styles.timelineContent}>
                        <strong>Data Prenotata</strong>
                        <span>
                          {formatDetailDate(selectedBooking.scheduledDate)} -{" "}
                          {selectedBooking.scheduledTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layout a due colonne */}
                <div className={styles.repairDetailColumns}>
                  {/* Colonna sinistra */}
                  <div className={styles.repairDetailLeftColumn}>
                    {/* Dati Cliente */}
                    <div className={styles.repairDetailSection}>
                      <h3>👤 Cliente</h3>
                      <div className={styles.repairDetailGrid}>
                        <div className={styles.repairDetailField}>
                          <label>Nome:</label>
                          <span>{selectedBooking.customerName || "N/A"}</span>
                        </div>
                        <div className={styles.repairDetailField}>
                          <label>Telefono:</label>
                          <span>{selectedBooking.customerPhone || "N/A"}</span>
                        </div>
                        <div className={styles.repairDetailField}>
                          <label>Email:</label>
                          <span>{selectedBooking.customerEmail || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dati Dispositivo */}
                    <div className={styles.repairDetailSection}>
                      <h3>
                        {getDeviceIcon(selectedBooking.deviceType)} Dispositivo
                      </h3>
                      <div className={styles.repairDetailGrid}>
                        <div className={styles.repairDetailField}>
                          <label>Tipo:</label>
                          <span>{selectedBooking.deviceType}</span>
                        </div>
                        <div className={styles.repairDetailField}>
                          <label>Modello:</label>
                          <span>{selectedBooking.deviceModel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colonna destra */}
                  <div className={styles.repairDetailRightColumn}>
                    {/* Dettagli Servizio */}
                    <div className={styles.repairDetailSection}>
                      <h3>🔧 Dettagli Servizio</h3>
                      <div className={styles.repairDetailGrid}>
                        <div className={styles.repairDetailField}>
                          <label>Stato:</label>
                          <span>{selectedBooking.bookingStatus}</span>
                        </div>
                        {selectedBooking.technicianAssigned && (
                          <div className={styles.repairDetailField}>
                            <label>Tecnico Assegnato:</label>
                            <span>{selectedBooking.technicianAssigned}</span>
                          </div>
                        )}
                        {selectedBooking.estimatedPrice !== undefined && (
                          <div className={styles.repairDetailField}>
                            <label>Prezzo Stimato:</label>
                            <span>
                              € {selectedBooking.estimatedPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {selectedBooking.paymentType && (
                          <div className={styles.repairDetailField}>
                            <label>Tipo Pagamento:</label>
                            <span>{selectedBooking.paymentType}</span>
                          </div>
                        )}
                        {selectedBooking.notes && (
                          <div className={styles.repairDetailField}>
                            <label>Note:</label>
                            <span>{selectedBooking.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className={styles.repairDetailFooter}>
              <button
                className={styles.repairDetailCloseBtn}
                onClick={closeDetailModal}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioPrenotazioni;
