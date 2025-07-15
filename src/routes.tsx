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
import DashboarLocaldAdmin from "./pages/LocalAreaConfig/DashboardLocalAdmin";
import LoginLocalAdmin from "./pages/LoginLocalAdmin";
import TestPage from "./pages/TestPage";
// Componente per proteggere le route
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotta pubblica */}
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<LoginAdmin />} />

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
        path="/master-company"
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
        path="/testpage"
        element={
          <ProtectedRoute>
            <TestPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
