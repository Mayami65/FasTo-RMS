import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { AppGate } from "./components/AppGate";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import UpdateChecker from "./components/UpdateChecker";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import HirePurchase from "./pages/HirePurchase";
import Marketing from "./pages/Marketing";
import Setup from "./pages/Setup";
import AuditLogs from "./pages/AuditLogs";
import Refunds from "./pages/Refunds";
import WebLanding from "./pages/WebLanding";

function App() {
  const isElectronApp = typeof window !== "undefined" && "api" in window;

  if (!isElectronApp) {
    return <WebLanding />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AppGate>
          <SettingsProvider>
            <AuthProvider>
              <UpdateChecker />
              <Routes>
                <Route path="/setup" element={<Setup />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route
                      path="/customers/:id"
                      element={<CustomerDetails />}
                    />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/hire-purchase" element={<HirePurchase />} />

                    {/* Owner Only Routes */}
                    <Route
                      element={<ProtectedRoute allowedRoles={["OWNER"]} />}
                    >
                      <Route path="/marketing" element={<Marketing />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/refunds" element={<Refunds />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/audit" element={<AuditLogs />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </AuthProvider>
          </SettingsProvider>
        </AppGate>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
