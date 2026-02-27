
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { EventsProvider } from './features/events/EventsContext';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Layout } from './components/Layout';
import { AdminRoutes } from './features/admin/routes';
import { EventDetails } from './pages/EventDetails';
import { MyPlans } from './pages/MyPlans';
import { Admin } from './pages/Admin';
import { AdminRoute } from './features/auth/AdminRoute';
import { PrivacyPolicy, TermsAndConditions, CookiePolicy, LegalNotice } from './features/legal/LegalPages';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <EventsProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin Module */}
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route
                path="/admin-legacy"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />

              <Route path="/event/:id" element={<EventDetails />} />
              <Route path="/my-plans" element={<MyPlans />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/legal" element={<LegalNotice />} />
            </Routes>
          </Layout>
        </HashRouter>
      </EventsProvider>
    </AuthProvider>
  );
};

export default App;
