import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Health from './pages/Health';
import Finance from './pages/Finance';
import Community from './pages/Community';
import Settings from './pages/Settings';
import Family from './pages/Family';
import Admin from './pages/Admin';
import Login from './pages/Login';
import InstallPrompt from './components/InstallPrompt';

import { LocationProvider } from './contexts/LocationContext';
import { HealthProvider } from './contexts/HealthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { CommunityProvider } from './contexts/CommunityContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // New Import

// Protected Route Component
const RequireAuth = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <LocationProvider>
      <AuthProvider>
        <HealthProvider>
          <FinanceProvider>
            <CommunityProvider>
              <FamilyProvider>
                <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/*" element={
                      <RequireAuth>
                        <Layout>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/health" element={<Health />} />
                            <Route path="/finance" element={<Finance />} />
                            <Route path="/family" element={<Family />} />
                            <Route path="/community" element={<Community />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/settings" element={<Settings />} />
                          </Routes>
                        </Layout>
                        <InstallPrompt />
                      </RequireAuth>
                    } />
                  </Routes>
                </Router>
              </FamilyProvider>
            </CommunityProvider>
          </FinanceProvider>
        </HealthProvider>
      </AuthProvider>
    </LocationProvider>
  );
}

export default App;
