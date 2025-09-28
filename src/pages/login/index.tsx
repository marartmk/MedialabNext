import { useState, useEffect } from "react";
import type { FC, FormEvent, ChangeEvent } from "react";
import { Eye, EyeOff, User, LogIn } from "lucide-react";
import "./Login.css";
import logo from "../../assets/LogoBaseBlack_300.png";

const API_URL = import.meta.env.VITE_API_URL;

interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  idCompany: string;
  companyName: string;
  userId: string;
  level: string;
  isExternalUser: boolean;
}

const Login: FC = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message] = useState("Accedi");

  /* redirect se già loggato */
  useEffect(() => {
    if (sessionStorage.getItem("isAuthenticated") === "true") {
      //window.location.href = "/dashboard";
    }
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "username" ? value : value,
    }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username è richiesto");
      return false;
    }
    if (!formData.password.trim()) {
      setError("Password è richiesta");
      return false;
    }
    return true;
  };

  // helper per leggere messaggi di errore robustamente (JSON o testo)
  async function readErrorMessage(res: Response): Promise<string> {
    const ct = res.headers.get("content-type") || "";
    const raw = await res.text(); // leggiamo una sola volta
    if (ct.includes("application/json")) {
      try {
        const j = raw ? JSON.parse(raw) : {};
        // prova campi comuni
        return j.message || j.error || j.title || JSON.stringify(j);
      } catch {
        // cade su testo se JSON malformato
      }
    }
    return raw || ""; // testo semplice
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    const urlLogin = `${API_URL}/api/auth/login`;

    try {
      const res = await fetch(urlLogin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // hint al BE
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const serverMsg = await readErrorMessage(res);

        // mapping messaggi per status
        let friendly = "";
        switch (res.status) {
          case 400:
            friendly = serverMsg || "Richiesta non valida.";
            break;
          case 401:
            friendly =
              "User ID o Password errati.";
            break;
          case 403:
            friendly = "Accesso negato. Permessi insufficienti.";
            break;
          case 423:
            friendly = "Account bloccato. Contatta l’amministratore.";
            break;
          case 429:
            friendly = "Troppe richieste. Riprova tra poco.";
            break;
          case 500:
            friendly = "Errore interno del server. Riprova più tardi.";
            break;
          default:
            friendly =
              serverMsg ||
              `Errore durante l’accesso (HTTP ${res.status}). Riprova.`;
        }

        setError(friendly);
        return; // stop qui, niente parsing success
      }

      // ✅ Successo: corpo JSON
      const result: LoginResponse = await res.json();

      // Salva token + info
      sessionStorage.setItem("token", result.token);
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("IdCompany", result.idCompany || "");
      sessionStorage.setItem("fullName", result.companyName || "");

      // Decodifica JWT (se valido)
      try {
        const payload = JSON.parse(atob(result.token.split(".")[1] || ""));
        sessionStorage.setItem("userId", payload.unique_name || "");
        sessionStorage.setItem("userLevel", payload.role || "");
        sessionStorage.setItem(
          "isExternalUser",
          String(payload.role === "External")
        );
        window.location.href =
          payload.role === "External" ? "/external-dashboard" : "/dashboard";
      } catch {
        // Se il token non è decodificabile, vai comunque in dashboard
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      console.error("Errore durante il login:", err);
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError("Impossibile connettersi al server. Verifica la rete.");
      } else if (err instanceof Error) {
        setError(err.message || "Errore sconosciuto durante la connessione.");
      } else {
        setError("Errore sconosciuto durante la connessione.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* overlay scuro sopra lo sfondo */}
      <div className="login-overlay" />

      {/* logo */}
      <div className="login-logo">
        <img src={logo} alt="Medialab Logo" />
      </div>

      {/* form */}
      <form onSubmit={handleLogin} className="login-form-wrapper">
        <h1 className="login-title">{message}</h1>

        <div className="login-form">
          {/* username */}
          <div className="input-group">
            <input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Username"
              autoComplete="off"
              className="input"
              disabled={loading}
            />
            <div className="input-icon">
              <User size={20} />
            </div>
          </div>

          {/* password */}
          <div className="input-group">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              autoComplete="off"
              className="input"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="input-icon toggle-btn"
              disabled={loading}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* submit */}
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? (
              <>
                <div className="spinner" />
                <span>Accesso…</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Login</span>
              </>
            )}
          </button>

          {/* error */}
          {error && <p className="error-msg">{error}</p>}
        </div>

        <p className="login-footer">Sistema di gestione assistenza tecnica</p>
      </form>
    </div>
  );
};

export default Login;
