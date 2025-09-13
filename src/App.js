import 'primereact/resources/themes/saga-green/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import AuthPage from './pages/AuthPage';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfirmDialog } from 'primereact/confirmdialog';
import SuppliersPage from './pages/SuppliersPage';
import OrdersPage from './pages/OrdersPage';
import StockMonitoringPage from './pages/StockMonitoringPage';
import PointOfSalePage from './pages/PointOfSalePage';
import ClientsPage from './pages/ClientsPage';
import PaymentsPage from './pages/PaymentsPage';
import SalesReportsPage from './pages/SalesReportsPage';
import SortirPage from './pages/SortirPage';
import PayrollPage from './pages/PayrollPage';
import ExpensesPage from './pages/ExpensesPage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import ReportsAnalyticsPage from './pages/ReportsAnalyticsPage';
import PriceConfigurationPage from './pages/PriceConfigurationPage';
import SpecificPriceManagementPage from './pages/SpecificPriceManagementPage';
import PriceSimulationPage from './pages/PriceSimulationPage';
import PriceMonitoringPage from './pages/PriceMonitoringPage';
import CompleteDashboardPage from './pages/CompleteDashboardPage';
import StrategicAssistantPage from './pages/StrategicAssistantPage';
//import './App.css';

function App() {
  return (
    <Router>
      {/* ConfirmDialog global (accessible partout) */}
      <ConfirmDialog />

      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/fournisseur" element={<SuppliersPage />} />
        <Route path="/commande" element={<OrdersPage />} />
        <Route path="/stock" element={<StockMonitoringPage />} />
        <Route path="/pointVente" element={<PointOfSalePage />} />
        <Route path="/client" element={<ClientsPage />} />
        <Route path="/paiement" element={<PaymentsPage />} />
        <Route path="/historique_vente" element={<SalesReportsPage />} />
        <Route path="/sortir" element={<SortirPage />} />
        <Route path="/gestionSalaire" element={<PayrollPage />} />
        <Route path="/depense" element={<ExpensesPage />} />
        <Route path="/finance" element={<FinancialDashboardPage />} />
        <Route path="/rapportFinance" element={<ReportsAnalyticsPage />} />
        <Route path="/prixMed" element={<PriceConfigurationPage />} />
        <Route path="/prixMedSpecifique" element={<SpecificPriceManagementPage />} />
        <Route path="/simulationPrixMed" element={<PriceSimulationPage />} />
        <Route path="/monotoringPrixMed" element={<PriceMonitoringPage />} />
        <Route path="/dashboard" element={<CompleteDashboardPage />} />
        <Route path="/strategic-assistant" element={<StrategicAssistantPage />} />
      </Routes>
    </Router>
  );
}

export default App;
