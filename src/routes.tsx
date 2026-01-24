import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login/index";
import Dashboard from "@/pages/Dashboard";
import AccettazioneSmart from "@/pages/AccettazioneSmart";
import Accettazione from "@/pages/Accettazione";
import Customer from "./pages/Customer";
import LoginAdmin from "./pages/LoginAdmin";
import AreaRiservata from "./pages/ReservedArea";
import DashboardAdmin from "./pages/ReservedArea/DashboardAdmin";
import MasterCompany from "./pages/ReservedArea/AnagraficaMaster";
import AffiliateManagement from "./pages/ReservedArea/AffiliateManagement";
import AreaServizi from "./pages/ReservedArea/AreaServizi";
import DashboarLocaldAdmin from "./pages/LocalAreaConfig/DashboardLocalAdmin";
import LoginLocalAdmin from "./pages/LoginLocalAdmin";
import Device from "./pages/DeviceRegistry";
import RicercaSchede from "./pages/RicercaSchede";
import Modifica from "./pages/Modifica";
import Magazzino from "./pages/Magazzino";
import Logistica from "./pages/Logistica";
import Operators from "./pages/ReservedArea/AnagraficaOperatori";
import UserProfile from "./pages/User";
import ConsegnaCliente from "./pages/ConsegnaCliente";
import NotaRiparazione from "./pages/NotaRiparazione";
import RicercaNote from "./pages/RicercaNote";
import MagazzinoApparati from "./pages/MagazzinoApparati";
import Vendite from "./pages/Vendite";
import PagamentoVendite from "./pages/PagamentoVendite";
import RicercaVendite from "./pages/RicercaVendite";
import ModificaVendite from "./pages/ModificaVendite";
import Prenotazioni from "./pages/Prenotazioni";
import RicercaPrenotazioni from "./pages/RicercaPrenotazioni";
import CalendarioPrenotazioni from "./pages/RicercaPrenotazioni/CalendarioPrenotazioni";
import AcquistoUsato from "./pages/Acquisti/AcquistoUsato";
import RicercaAcquistiUsato from "./pages/RicercaAcquistiUsato";
import RicercaPreventivi from "./pages/RicercaPreventivi";
import Preventivi from "./pages/Preventivi";
import FirmaPreventivoExt from "./pages/Preventivi/FirmaPreventivoExt";
import FirmaAccettazioneExt from "./pages/Accettazione/FirmaAccettazioneExt";
import GestioneNews from "./pages/News";

// Componente per proteggere le route
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotta pubblica */}
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/firma-preventivo-ext" element={<FirmaPreventivoExt />} />
      <Route
        path="/firma-accettazione-ext"
        element={<FirmaAccettazioneExt />}
      />
      {/* Rotte protette */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accettazione-smart"
        element={
          <ProtectedRoute>
            <AccettazioneSmart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accettazione"
        element={
          <ProtectedRoute>
            <Accettazione />
          </ProtectedRoute>
        }
      />
      <Route
        path="/anagrafica-clienti"
        element={
          <ProtectedRoute>
            <Customer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/area-riservata"
        element={
          <ProtectedRoute>
            <AreaRiservata />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-admin"
        element={
          <ProtectedRoute>
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master-company/:id?"
        element={
          <ProtectedRoute>
            <MasterCompany />
          </ProtectedRoute>
        }
      />
      <Route
        path="/affiliate-management"
        element={
          <ProtectedRoute>
            <AffiliateManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/area-servizi"
        element={
          <ProtectedRoute>
            <AreaServizi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login-local-admin"
        element={
          <ProtectedRoute>
            <LoginLocalAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-local-admin"
        element={
          <ProtectedRoute>
            <DashboarLocaldAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/device-registry"
        element={
          <ProtectedRoute>
            <Device />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ricerca-schede"
        element={
          <ProtectedRoute>
            <RicercaSchede />
          </ProtectedRoute>
        }
      />
      <Route
        path="/modifica-schede"
        element={
          <ProtectedRoute>
            <Modifica />
          </ProtectedRoute>
        }
      />
      <Route
        path="/magazzino-ricambi"
        element={
          <ProtectedRoute>
            <Magazzino />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gestione-logistica"
        element={
          <ProtectedRoute>
            <Logistica />
          </ProtectedRoute>
        }
      />
      <Route
        path="/anagrafica-operatori"
        element={
          <ProtectedRoute>
            <Operators />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consegna-cliente"
        element={
          <ProtectedRoute>
            <ConsegnaCliente />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nota-riparazione"
        element={
          <ProtectedRoute>
            <NotaRiparazione />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ricerca-note"
        element={
          <ProtectedRoute>
            <RicercaNote />
          </ProtectedRoute>
        }
      />
      <Route
        path="/magazzino-apparati"
        element={
          <ProtectedRoute>
            <MagazzinoApparati />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendite-apparati"
        element={
          <ProtectedRoute>
            <Vendite />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagamento-vendite"
        element={
          <ProtectedRoute>
            <PagamentoVendite />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ricerca-vendite"
        element={
          <ProtectedRoute>
            <RicercaVendite />
          </ProtectedRoute>
        }
      />

      <Route
        path="/modifica-vendite"
        element={
          <ProtectedRoute>
            <ModificaVendite />
          </ProtectedRoute>
        }
      />

      <Route
        path="/prenotazioni"
        element={
          <ProtectedRoute>
            <Prenotazioni />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ricerca-prenotazioni"
        element={
          <ProtectedRoute>
            <RicercaPrenotazioni />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendario-prenotazioni"
        element={
          <ProtectedRoute>
            <CalendarioPrenotazioni />
          </ProtectedRoute>
        }
      />

      <Route
        path="/acquisto-usato"
        element={
          <ProtectedRoute>
            <AcquistoUsato />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ricerca-acquisto-usato"
        element={
          <ProtectedRoute>
            <RicercaAcquistiUsato />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ricerca-preventivi"
        element={
          <ProtectedRoute>
            <RicercaPreventivi />
          </ProtectedRoute>
        }
      />

      <Route
        path="/preventivi"
        element={
          <ProtectedRoute>
            <Preventivi />
          </ProtectedRoute>
        }
      />

      <Route
        path="/gestione-news"
        element={
          <ProtectedRoute>
            <GestioneNews />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
