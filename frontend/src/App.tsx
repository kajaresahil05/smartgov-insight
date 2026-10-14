import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Import components (removing explicit .jsx extensions for TS compatibility)
import PortalSelection from './components/PortalSelection';
import CitizenRegistration from './components/CitizenRegistration';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GovernmentLogin from './components/government/GovernmentLogin';
import GovernmentDashboard from './components/government/GovernmentDashboard';
import VendorRegistration from './components/vendor/VendorRegistration';
import VendorLogin from './components/vendor/VendorLogin';
import VendorDashboard from './components/vendor/VendorDashboard';

function AppRoutes() {
  const navigate = useNavigate();

  const [activeUserId, setActiveUserId] = useState(() => {
    try {
      const saved = localStorage.getItem('smartgov_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id) return u.id;
      }
    } catch (e) {}
    return 1;
  });

  const [activeVendorId, setActiveVendorId] = useState(() => {
    try {
      const saved = localStorage.getItem('smartgov_vendor_user');
      if (saved) {
        const v = JSON.parse(saved);
        if (v && (v.vendor_id || v.id)) return v.vendor_id || v.id;
      }
    } catch (e) {}
    return 'VND-4080';
  });

  // Check auth loops on load
  useEffect(() => {
    // Basic logic to handle landing page redirects if already logged in can go here
  }, []);

  return (
    <Routes>
      {/* LANDING PAGE */}
      <Route path="/" element={<PortalSelection onSelectPortal={(portalId) => {
        if (portalId === 'citizen') navigate('/citizen/register');
        if (portalId === 'government') navigate('/government/login');
        if (portalId === 'vendor') navigate('/vendor/dashboard');
      }} />} />

      {/* CITIZEN PORTAL */}
      <Route path="/citizen/register" element={
        <CitizenRegistration 
          onNavigateLogin={() => navigate('/citizen/login')}
          onNavigateDashboard={(id) => { setActiveUserId(id); navigate('/citizen/dashboard'); }}
        />
      } />
      <Route path="/citizen/login" element={
        <Login 
          onNavigateRegister={() => navigate('/citizen/register')}
          onNavigateDashboard={(id) => { setActiveUserId(id); navigate('/citizen/dashboard'); }}
          onNavigateHome={() => navigate('/')}
        />
      } />
      <Route path="/citizen/dashboard" element={
        <Dashboard userId={activeUserId || 1} onLogout={() => {
          localStorage.removeItem('smartgov_user');
          navigate('/');
        }} />
      } />

      {/* GOVERNMENT PORTAL */}
      <Route path="/government/login" element={
        <GovernmentLogin 
          onNavigateDashboard={() => navigate('/government/dashboard')}
          onNavigateHome={() => navigate('/')}
        />
      } />
      <Route path="/government/dashboard" element={
        <GovernmentDashboard onLogout={() => {
          localStorage.removeItem('smartgov_govt_user');
          navigate('/');
        }} />
      } />

      {/* VENDOR PORTAL */}
      <Route path="/vendor/register" element={
        <VendorRegistration 
          onNavigateLogin={() => navigate('/vendor/login')}
          onNavigateDashboard={(id) => { setActiveVendorId(id); navigate('/vendor/dashboard'); }}
        />
      } />
      <Route path="/vendor/login" element={
        <VendorLogin 
          onNavigateRegister={() => navigate('/vendor/register')}
          onNavigateDashboard={(id) => { setActiveVendorId(id); navigate('/vendor/dashboard'); }}
          onNavigateHome={() => navigate('/')}
        />
      } />
      <Route path="/vendor/dashboard" element={
        <VendorDashboard vendorId={String(activeVendorId || 'VND-4080')} onLogout={() => {
          localStorage.removeItem('smartgov_vendor_user');
          navigate('/vendor/login');
        }} />
      } />

      {/* CATCH ALL */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center">
      <Router>
        <AppRoutes />
      </Router>
    </div>
  );
}
