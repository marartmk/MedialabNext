import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login/index";
import Dashboard from "@/pages/Dashboard";
import AccettazioneSmart from "@/pages/AccettazioneSmart"; // ✅ nuova importazione
import Customer from "./pages/Customer";

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
        path="/anagrafica-clienti"
        element={
          <ProtectedRoute>
            <Customer />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
