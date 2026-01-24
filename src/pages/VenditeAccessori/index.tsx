import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";
import BottomBar from "../../components/BottomBar";
import accessoryInventoryService, {
  type AccessoryInventoryItem,
  type AccessoryInventorySearchParams,
} from "../../services/accessoryInventoryService";
import styles from "./vendita-accessori.module.css";

const VenditeAccessori: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  const [operatore, setOperatore] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("");
  const [fornitore, setFornitore] = useState("");
  const [prezzo, setPrezzo] = useState("");
  const [accessorySuggestions, setAccessorySuggestions] = useState<
    AccessoryInventoryItem[]
  >([]);
  const [isSearchingAccessories, setIsSearchingAccessories] = useState(false);
  const [showAccessorySuggestions, setShowAccessorySuggestions] =
    useState(false);
  const skipNextAccessorySearch = useRef(false);

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

  useEffect(() => {
    const multitenantId = sessionStorage.getItem("multitenantId");
    if (multitenantId) {
      accessoryInventoryService.setMultitenantId(multitenantId);
    }
  }, []);

  useEffect(() => {
    const query = descrizione.trim();
    if (skipNextAccessorySearch.current) {
      skipNextAccessorySearch.current = false;
      setAccessorySuggestions([]);
      setShowAccessorySuggestions(false);
      return;
    }
    if (query.length < 3) {
      setAccessorySuggestions([]);
      setShowAccessorySuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearchingAccessories(true);
        const searchParams: AccessoryInventorySearchParams = {
          searchQuery: query,
          page: 1,
          pageSize: 5,
          sortBy: "code",
          sortDescending: false,
        };
        const response = await accessoryInventoryService.searchItems(searchParams);
        setAccessorySuggestions(response.items);
        setShowAccessorySuggestions(true);
      } catch (error) {
        console.error("Errore nella ricerca accessori:", error);
        setAccessorySuggestions([]);
        setShowAccessorySuggestions(false);
      } finally {
        setIsSearchingAccessories(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [descrizione]);

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  const handleSelectAccessory = (accessory: AccessoryInventoryItem) => {
    skipNextAccessorySearch.current = true;
    setDescrizione(`${accessory.brand} ${accessory.model}`);
    setFornitore(accessory.supplierName || "");
    setPrezzo(accessory.sellingPrice.toFixed(2));
    setShowAccessorySuggestions(false);
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />
      <div className={styles.contentArea}>
        <Topbar toggleMenu={toggleMenu} />

        <div className={styles.pageBody}>
          <div className={styles.centerBox}>
            <div className={styles.boxHeader}>
              <h2>Crea Vendita Accessori</h2>
            </div>

            <form className={styles.boxBody} onSubmit={handleSubmit}>
              <div className={styles.formRowDouble}>
                <div className={styles.formField}>
                  <label>Data e ora di vendita</label>
                  <input
                    type="text"
                    className={styles.formControl}
                    value={`${dateTime.time} - ${dateTime.date}`}
                    readOnly
                  />
                </div>

                <div className={styles.formField}>
                  <label>Operata da</label>
                  <select
                    className={styles.formControl}
                    value={operatore}
                    onChange={(e) => setOperatore(e.target.value)}
                  >
                    <option value="">Seleziona Operatore</option>
                    <option value="Tecnico 1">Tecnico 1</option>
                    <option value="Tecnico 2">Tecnico 2</option>
                    <option value="Tecnico 3">Tecnico 3</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <label>Descrizione del prodotto</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  onFocus={() => {
                    if (accessorySuggestions.length > 0) {
                      setShowAccessorySuggestions(true);
                    }
                  }}
                  placeholder="Cover originale Apple per iPhone 14 Pro"
                />
                {showAccessorySuggestions && (
                  <div className={styles.suggestions}>
                    {isSearchingAccessories && (
                      <div className={styles.suggestionEmpty}>Ricerca in corso...</div>
                    )}
                    {!isSearchingAccessories && accessorySuggestions.length === 0 && (
                      <div className={styles.suggestionEmpty}>
                        Nessun accessorio trovato
                      </div>
                    )}
                    {!isSearchingAccessories &&
                      accessorySuggestions.map((accessory) => (
                        <button
                          key={accessory.id}
                          type="button"
                          className={styles.suggestionItem}
                          onMouseDown={() => handleSelectAccessory(accessory)}
                        >
                          <span className={styles.suggestionTitle}>
                            {accessory.brand} {accessory.model}
                          </span>
                          <span className={styles.suggestionMeta}>
                            {accessory.code} | Stock: {accessory.quantityInStock}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className={styles.formRowDouble}>
                <div className={styles.formField}>
                  <label>Tipo di pagamento</label>
                  <input
                    type="text"
                    className={styles.formControl}
                    value={tipoPagamento}
                    onChange={(e) => setTipoPagamento(e.target.value)}
                    placeholder="Amex"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Fornitore (nota privata)</label>
                  <input
                    type="text"
                    className={styles.formControl}
                    value={fornitore}
                    onChange={(e) => setFornitore(e.target.value)}
                    placeholder="Amazon"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>Prezzo preventivato iva inclusa</label>
                  <div className={styles.priceInput}>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.formControl}
                      value={prezzo}
                      onChange={(e) => setPrezzo(e.target.value)}
                      placeholder="59.00"
                    />
                    <span className={styles.currency}>Eur</span>
                  </div>
                </div>
              </div>

              <button type="submit" className={styles.btnCreaVendita}>
                Crea Vendita
              </button>
            </form>
          </div>
        </div>

        <BottomBar />
      </div>
    </div>
  );
};

export default VenditeAccessori;
