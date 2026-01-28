import React, { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import styles from "./ricerca-spese.module.css";

interface Expense {
  id: number;
  createdAt: string;
  operatorName: string;
  amount: number;
  paymentType: string;
  reason: string;
}

interface DateFilter {
  type: "none" | "today" | "week" | "month" | "year";
}

const MOCK_EXPENSES: Expense[] = [
  {
    id: 1,
    createdAt: "2026-01-18T09:31:00",
    operatorName: "Daniele Rossi",
    amount: 9.0,
    paymentType: "Contanti",
    reason: "Cartoleria",
  },
  {
    id: 2,
    createdAt: "2026-01-16T14:05:00",
    operatorName: "Marco Bianchi",
    amount: 120.5,
    paymentType: "Carta di Credito",
    reason: "Materiale tecnico",
  },
  {
    id: 3,
    createdAt: "2026-01-12T11:20:00",
    operatorName: "Luca Verdi",
    amount: 65.0,
    paymentType: "Bonifico",
    reason: "Corriere urgente",
  },
  {
    id: 4,
    createdAt: "2026-01-08T18:45:00",
    operatorName: "Giuseppe Neri",
    amount: 35.2,
    paymentType: "Bancomat",
    reason: "Cancelleria",
  },
  {
    id: 5,
    createdAt: "2026-01-05T10:15:00",
    operatorName: "Andrea Greco",
    amount: 210.0,
    paymentType: "Assegno",
    reason: "Acquisto attrezzatura",
  },
];

const RicercaSpese: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: "none" });

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const calculateDateRange = (
    filterType: DateFilter["type"]
  ): { startDate: string; endDate: string } | null => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (filterType) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
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
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        return null;
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const filteredData = useMemo(() => {
    let data = [...MOCK_EXPENSES];

    if (paymentFilter) {
      data = data.filter((item) => item.paymentType === paymentFilter);
    }

    if (operatorFilter) {
      data = data.filter((item) => item.operatorName === operatorFilter);
    }

    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      data = data.filter(
        (item) =>
          item.operatorName.toLowerCase().includes(searchTerm) ||
          item.reason.toLowerCase().includes(searchTerm) ||
          item.paymentType.toLowerCase().includes(searchTerm)
      );
    }

    if (dateFilter.type !== "none") {
      const range = calculateDateRange(dateFilter.type);
      if (range) {
        data = data.filter((item) => {
          const date = new Date(item.createdAt).toISOString().split("T")[0];
          return date >= range.startDate && date <= range.endDate;
        });
      }
    }

    return data;
  }, [paymentFilter, operatorFilter, globalFilter, dateFilter]);

  const operatorOptions = useMemo(
    () => Array.from(new Set(MOCK_EXPENSES.map((item) => item.operatorName))),
    []
  );

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.schedaHeader}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Gestione Spese</span>
            <span className={styles.breadcrumbSeparator}> &gt; </span>
            <span className={styles.breadcrumbCurrent}>Spese Completate</span>
          </div>
        </div>

        <div className={styles.pageBody}>
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>Spese Completate</h3>
              <div className={styles.tableControls}>
                <select
                  className={styles.filterSelect}
                  value={operatorFilter}
                  onChange={(e) => setOperatorFilter(e.target.value)}
                >
                  <option value="">Tutti gli operatori</option>
                  {operatorOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  className={styles.filterSelect}
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="">Tutti i pagamenti</option>
                  <option value="Contanti">Contanti</option>
                  <option value="Carta di Credito">Carta di Credito</option>
                  <option value="Bancomat">Bancomat</option>
                  <option value="Bonifico">Bonifico</option>
                  <option value="Assegno">Assegno</option>
                </select>

                <div className={styles.dateFilterContainer}>
                  <Calendar className={styles.dateFilterIcon} />
                  <select
                    className={styles.dateFilterSelect}
                    value={dateFilter.type}
                    onChange={(e) =>
                      setDateFilter({ type: e.target.value as DateFilter["type"] })
                    }
                  >
                    <option value="none">Tutte le date</option>
                    <option value="today">Oggi</option>
                    <option value="week">Questa settimana</option>
                    <option value="month">Questo mese</option>
                    <option value="year">Quest'anno</option>
                  </select>
                </div>

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
                    placeholder="Cerca per operatore, motivo..."
                  />
                </div>
              </div>
            </div>

            {filteredData.length === 0 ? (
              <div className={styles.emptyState}>
                <h4>Nessuna spesa trovata</h4>
                <p>Non ci sono spese che corrispondono ai filtri selezionati.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className={styles.modernTable}>
                  <thead>
                    <tr>
                      <th>Data e ora di creazione</th>
                      <th>Operatore</th>
                      <th>Importo Spesa</th>
                      <th>Tipo di pagamento</th>
                      <th>Motivo della spesa</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id}>
                        <td className={styles.dateCell}>
                          {new Date(item.createdAt).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className={styles.operatorCell}>{item.operatorName}</td>
                        <td className={styles.amountCell}>{item.amount.toFixed(2)} Eur</td>
                        <td className={styles.paymentCell}>{item.paymentType}</td>
                        <td className={styles.reasonCell}>{item.reason}</td>
                        <td className={styles.actionsCell}>
                          <button className={styles.receiptBtn}>Stampa ricevuta spesa</button>
                          <button className={styles.cancelBtn}>Richiedi cancellazione</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <BottomBar />
      </div>
    </div>
  );
};

export default RicercaSpese;
