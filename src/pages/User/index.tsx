import React, { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";
import SidebarAdmin from "../../components/sidebar-admin";
import Topbar from "../../components/topbar";
import TopbarAdmin from "../../components/topbar-admin";
import styles from "./user.module.css";

interface Operator {
  id: string;
  idWhr: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  regione: string;
  provincia: string;
  citta: string;
  cap: string;
  indirizzo: string | null;
  idcompany: string | null;
  codiceDipendente: string;
  codiceFiscale: string | null;
  dataNascita: string | null;
  comuneNascita: string | null;
  prNascita: string | null;
  iban: string | null;
  matricola: string | null;
  qualificaImpiegato: string | null;
  descriQualifica: string | null;
  active: boolean | null;
  dataCreazione: string;
  isEmployee: boolean | null;
  multiTenantId: string | null;
}

type AuthUser = {
  id: string;
  username?: string;
  userName?: string;
  UserName?: string;
  email?: string | null;
  isEnabled?: boolean;
  isAdmin?: boolean;
  accessLevel?: string | null;
};

const UserProfile: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    codiceDipendente: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const isAdmin =
    sessionStorage.getItem("userLevel") === "admin" ||
    !!sessionStorage.getItem("IdCompanyAdmin");
  const SidebarComponent = (isAdmin ? SidebarAdmin : Sidebar) as React.ComponentType<{
    menuState: "open" | "closed";
    toggleMenu: () => void;
  }>;
  const TopbarComponent = (isAdmin ? TopbarAdmin : Topbar) as React.ComponentType<{
    toggleMenu: () => void;
  }>;

  const toggleMenu = () => {
    setMenuState(menuState === "open" ? "closed" : "open");
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");
      const username = sessionStorage.getItem("userId") || "";
      let currentEmail = "";
      let currentOperatorId = "";
      const companyId =
        sessionStorage.getItem("IdCompanyAdmin") ||
        sessionStorage.getItem("IdCompany");

      if (!token) {
        setError("Token mancante. Effettua di nuovo il login.");
        return;
      }

      if (companyId) {
        const resp = await fetch(`${API_URL}/api/Auth/users/${companyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (resp.ok) {
          const json = await resp.json();
          const listRaw: Array<AuthUser & { idOperator?: string; IdOperator?: string; idoperator?: string }> =
            Array.isArray(json?.users)
            ? json.users
            : Array.isArray(json)
            ? json
            : json && typeof json === "object"
            ? [json]
            : [];

          const normalized = (value: string) => value.trim().toLowerCase();
          const target = normalized(username);
          const current = listRaw.find((u) => {
            const name =
              u.username || u.userName || u.UserName || "";
            return normalized(name) === target;
          });

          if (current) {
            setAuthUserId(current.id);
            currentEmail = current.email || "";
            currentOperatorId =
              current.idOperator || current.IdOperator || current.idoperator || "";
            setAccountForm((prev) => ({
              ...prev,
              username:
                current.username || current.userName || current.UserName || "",
              email: currentEmail,
            }));
          }
        }
      }

      let matched: Operator | null = null;

      if (currentOperatorId) {
        const opByIdResp = await fetch(`${API_URL}/api/Operator/${currentOperatorId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (opByIdResp.ok) {
          matched = await opByIdResp.json();
        }
      }

      if (!matched) {
        const opResp = await fetch(`${API_URL}/api/operator`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!opResp.ok) {
          throw new Error(await opResp.text());
        }

        const operators: Operator[] = await opResp.json();
        const normalized = (value: string) => value.trim().toLowerCase();
        const target = normalized(username);
        matched = (operators || []).find((op) => {
          if (currentOperatorId && op.id) {
            return String(op.id) === String(currentOperatorId);
          }
          if (op.userName && normalized(op.userName) === target) {
            return true;
          }
          if (currentEmail && op.email) {
            return normalized(op.email) === normalized(currentEmail);
          }
          return false;
        }) || null;
      }

      if (!matched) {
        setError("Impossibile trovare l'anagrafica dell'utente.");
        return;
      }

      setOperatorId(matched.id);
      setFormData({
        userName: matched.userName || "",
        email: matched.email || "",
        firstName: matched.firstName || "",
        lastName: matched.lastName || "",
        phoneNumber: matched.phoneNumber || "",
        codiceDipendente: matched.codiceDipendente || "",
      });

      if (!accountForm.username) {
        setAccountForm((prev) => ({
          ...prev,
          username: matched.userName || prev.username,
          email: matched.email || prev.email || currentEmail,
        }));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Errore nel caricamento dati.");
      } else {
        setError("Errore nel caricamento dati.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!operatorId) return;

    if (!formData.firstName) {
      alert("Inserire il nome");
      return;
    }
    if (!formData.lastName) {
      alert("Inserire il cognome");
      return;
    }
    if (!formData.email) {
      alert("Inserire un'email");
      return;
    }
    if (!formData.userName) {
      alert("Inserire un username");
      return;
    }
    if (!formData.phoneNumber) {
      alert("Inserire un numero di telefono");
      return;
    }

    const companyId =
      sessionStorage.getItem("IdCompany") ||
      sessionStorage.getItem("IdCompanyAdmin") ||
      null;
    const payload = {
      id: operatorId,
      userName: formData.userName,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      codiceDipendente: formData.codiceDipendente,
      idcompany: companyId,
      multiTenantId: companyId,
      active: 1,
      isEmployee: 1,
      dataModifica: new Date().toISOString(),
      isDeleted: false,
    };

    setIsSaving(true);
    try {
      const resp = await fetch(`${API_URL}/api/operator/${operatorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Errore durante il salvataggio.");
      }

      alert("Dati utente aggiornati.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Errore durante il salvataggio.");
      } else {
        alert("Errore durante il salvataggio.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (!authUserId) {
      setPasswordError(
        "Impossibile determinare l'utente per il cambio password."
      );
      return;
    }
    if (!accountForm.oldPassword.trim()) {
      setPasswordError("Inserisci la vecchia password.");
      return;
    }
    if (!accountForm.password.trim() || !accountForm.confirmPassword.trim()) {
      setPasswordError("Inserisci la nuova password in entrambi i campi.");
      return;
    }
    if (accountForm.confirmPassword !== accountForm.password) {
      setPasswordError("La conferma password non coincide.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const verifyResp = await fetch(
        `${API_URL}/api/Auth/verify-current-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            CurrentPassword: accountForm.oldPassword,
          }),
        }
      );

      if (!verifyResp.ok) {
        const verifyText = await verifyResp.text();
        try {
          const parsed = JSON.parse(verifyText || "{}");
          if (parsed?.valid === false) {
            setPasswordError("Vecchia password non corretta.");
            return;
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(verifyText || "Errore verifica password.");
      }

      const verifyJson = await verifyResp.json();
      if (!verifyJson?.valid) {
        setPasswordError("Vecchia password non corretta.");
        return;
      }

      const body = {
        newPassword: accountForm.password,
        confirmPassword: accountForm.confirmPassword || undefined,
      };
      const resp = await fetch(
        `${API_URL}/api/Auth/change-password/${authUserId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const text = await resp.text();
      if (!resp.ok) {
        let errorMessage = text || "Errore cambio password";
        try {
          const parsed = JSON.parse(text || "{}");
          if (parsed?.errors && typeof parsed.errors === "object") {
            errorMessage = Object.entries(parsed.errors)
              .map(([field, errors]) => {
                const list = Array.isArray(errors) ? errors.join(", ") : errors;
                return `${field}: ${list}`;
              })
              .join("\n");
          } else if (parsed?.message) {
            errorMessage = parsed.message;
          } else if (parsed?.title) {
            errorMessage = parsed.title;
          }
        } catch {
          // keep text as fallback
        }
        throw new Error(errorMessage);
      }
      setAccountForm((prev) => ({
        ...prev,
        oldPassword: "",
        password: "",
        confirmPassword: "",
      }));
      alert("Password aggiornata.");
      sessionStorage.clear();
      window.location.href = "/";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message || "Errore cambio password.");
      } else {
        setPasswordError("Errore cambio password.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      {loading && (
        <div className={styles.globalLoadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Caricamento...</p>
        </div>
      )}

      <div className={styles.mainLayout}>
        <SidebarComponent menuState={menuState} toggleMenu={toggleMenu} />
        <div className={styles.contentArea}>
          <TopbarComponent toggleMenu={toggleMenu} />

          <div className={styles.schedaHeader}>
            <div className={styles.headerLeft}>
              <h2 className={styles.pageTitle}>Dettaglio Utente</h2>
              <span className={styles.pageSubtitle}>
                Anagrafica e sicurezza account
              </span>
            </div>
          </div>

          <div className={styles.pageBody}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <section className={styles.inlineEditorCard}>
              <div className={styles.inlineEditorHeader}>
                <h3>Dettaglio Utente</h3>
              </div>

              <div className={styles.inlineEditorBody}>
                <div className={styles.customerForm}>
                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label>Nome *</label>
                      <input
                        className={styles.formControl}
                        value={formData.firstName}
                        readOnly
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Cognome *</label>
                      <input
                        className={styles.formControl}
                        value={formData.lastName}
                        readOnly
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label>Username *</label>
                      <input
                        className={styles.formControl}
                        value={formData.userName}
                        readOnly
                        onChange={(e) =>
                          setFormData({ ...formData, userName: e.target.value })
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Email *</label>
                      <input
                        type="email"
                        className={styles.formControl}
                        value={formData.email}
                        readOnly
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label>Telefono *</label>
                      <input
                        className={styles.formControl}
                        value={formData.phoneNumber}
                        readOnly
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Codice Dipendente</label>
                      <input
                        className={styles.formControl}
                        value={formData.codiceDipendente}
                        readOnly
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            codiceDipendente: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                </div>

                <div className={styles.sectionTitle}>Account di accesso</div>
                <div className={styles.row}>
                  <div className={styles.fieldGroup}>
                    <label>Username</label>
                    <input
                      className={styles.formControl}
                      value={accountForm.username}
                      disabled
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Email</label>
                    <input
                      className={styles.formControl}
                      value={accountForm.email ?? ""}
                      disabled
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.fieldGroup}>
                    <label>Vecchia Password</label>
                    <input
                      className={styles.formControl}
                      type="password"
                      value={accountForm.oldPassword}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          oldPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Nuova Password</label>
                    <input
                      className={styles.formControl}
                      type="password"
                      value={accountForm.password}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Conferma Password</label>
                    <input
                      className={styles.formControl}
                      type="password"
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
              </div>

              <div className={styles.inlineEditorFooter}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={changePassword}
                  disabled={isChangingPassword}
                >
                  Cambia password
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
      {passwordError && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <span>Errore cambio password</span>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPasswordError(null)}
                aria-label="Chiudi"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              {passwordError.split("\n").map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setPasswordError(null)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;
