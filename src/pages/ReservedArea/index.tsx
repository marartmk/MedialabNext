import React, { useState } from "react";
import "./Styles.css";

const AreaRiservata = () => {
  const [azienda, setAzienda] = useState({
    ragioneSociale: "",
    piva: "",
    email: "",
    telefono: "",
  });

  const [admin, setAdmin] = useState({
    username: "",
    password: "",
    email: "",
  });

  const handleSave = async () => {
    const payload = {
      tenant: azienda,
      user: admin,
    };

    try {
      const res = await fetch("/api/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Tenant e utente creati con successo!");
      } else {
        alert("Errore durante la creazione.");
      }
    } catch (error) {
      console.error("Errore:", error);
    }
  };

  return (
    <div className="reserved-container">
      <h2>Setup Azienda Medialab</h2>

      <div className="form-section">
        <h4>Dati Azienda</h4>
        <label>Ragione Sociale</label>
        <input
          type="text"
          value={azienda.ragioneSociale}
          onChange={(e) =>
            setAzienda({ ...azienda, ragioneSociale: e.target.value })
          }
        />

        <label>P.IVA</label>
        <input
          type="text"
          value={azienda.piva}
          onChange={(e) => setAzienda({ ...azienda, piva: e.target.value })}
        />

        <label>Email</label>
        <input
          type="email"
          value={azienda.email}
          onChange={(e) => setAzienda({ ...azienda, email: e.target.value })}
        />

        <label>Telefono</label>
        <input
          type="text"
          value={azienda.telefono}
          onChange={(e) =>
            setAzienda({ ...azienda, telefono: e.target.value })
          }
        />
      </div>

      <div className="form-section">
        <h4>Utente Amministratore</h4>
        <label>Username</label>
        <input
          type="text"
          value={admin.username}
          onChange={(e) => setAdmin({ ...admin, username: e.target.value })}
        />

        <label>Password</label>
        <input
          type="password"
          value={admin.password}
          onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
        />

        <label>Email</label>
        <input
          type="email"
          value={admin.email}
          onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
        />
      </div>

      <button className="save-btn" onClick={handleSave}>
        Salva e Attiva
      </button>
    </div>
  );
};

export default AreaRiservata;
