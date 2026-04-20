import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Auth/Login';
import DashboardLayout from './Pages/Dashboard/Layout';
import DashboardHome from './Pages/Dashboard/DashboardHome';
import UserManagement from './Pages/UserManagement/UserManagement';
import ActiveProjects from './Pages/ProjectManagement/ActiveProjects';
import OngoingProjects from './Pages/ProjectManagement/OngoingProjects';
import CompletedProjects from './Pages/ProjectManagement/CompletedProjects';
import RecentTransactions from './Pages/RecentTransactions/RecentTransactions';
import Enquiries from './Pages/Enquiries/Enquiries';
import Chat from './Pages/Chat/Chat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="projects" element={<Navigate to="active" replace />} />
          <Route path="projects/active" element={<ActiveProjects />} />
          <Route path="projects/ongoing" element={<OngoingProjects />} />
          <Route path="projects/completed" element={<CompletedProjects />} />

          <Route path="transactions" element={<RecentTransactions />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="chat" element={<Chat />} />
        </Route>

        {/* Redirect root to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
