import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Auth/Login';
import DashboardLayout from './Pages/Dashboard/Layout';
import DashboardHome from './Pages/Dashboard/DashboardHome';
import UserManagement from './Pages/UserManagement/UserManagement';
import ActiveProjects from './Pages/ProjectManagement/ActiveProjects';
import OngoingProjects from './Pages/ProjectManagement/OngoingProjects';
import CompletedProjects from './Pages/ProjectManagement/CompletedProjects';
import ExpiredProjects from './Pages/ProjectManagement/ExpiredProjects';
import ProjectDetails from './Pages/ProjectManagement/ProjectDetails';
import SettlementManagement from './Pages/ProjectManagement/SettlementManagement';
import RecentTransactions from './Pages/RecentTransactions/RecentTransactions';
import Enquiries from './Pages/Enquiries/Enquiries';
import ExclusiveEnquiries from './Pages/Enquiries/ExclusiveEnquiries';
import ExclusiveProjects from './Pages/ExclusiveProjects/ExclusiveProjects';
import SpecialEnquiries from './Pages/Enquiries/SpecialEnquiries';
import SpecialProjects from './Pages/SpecialProjects/SpecialProjects';
import SpecialProjectDetails from './Pages/SpecialProjects/SpecialProjectDetails';
import SpecialSettlementManagement from './Pages/SpecialProjects/SpecialSettlementManagement';
import Chat from './Pages/Chat/Chat';
import ProtectedRoute from './Components/Common/ProtectedRoute';
import ScrollToTop from './Components/Common/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Chat Route - Full Screen */}
        <Route path="/dashboard/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="projects" element={<Navigate to="active" replace />} />
          <Route path="projects/active" element={<ActiveProjects />} />
          <Route path="projects/ongoing" element={<OngoingProjects />} />
          <Route path="projects/completed" element={<CompletedProjects />} />
          <Route path="projects/expired" element={<ExpiredProjects />} />
          <Route path="projects/details/:id" element={<ProjectDetails />} />
          <Route path="projects/settlement/:id" element={<SettlementManagement />} />

          <Route path="special-projects" element={<SpecialProjects />} />
          <Route path="special-projects/details/:id" element={<SpecialProjectDetails />} />
          <Route path="special-projects/settlement/:id" element={<SpecialSettlementManagement />} />

          <Route path="exclusive-projects" element={<ExclusiveProjects />} />

          <Route path="transactions" element={<RecentTransactions />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="enquiries/exclusive" element={<ExclusiveEnquiries />} />
          <Route path="enquiries/special" element={<SpecialEnquiries />} />
        </Route>

        {/* Redirect root to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
