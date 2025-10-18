import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardHome from '@/components/dashboard/DashboardHome';
import PartnersManagement from '@/components/dashboard/PartnersManagement';
import StockManagement from '@/components/dashboard/StockManagement';
import AccountingManagement from '@/components/dashboard/AccountingManagement';
import NotificationsPage from '@/components/dashboard/NotificationsPage';
import PartnerDashboard from '@/components/dashboard/PartnerDashboard';
import UserManagement from '@/components/dashboard/UserManagement';
import SettingsPage from '@/components/dashboard/SettingsPage';
import ExportPage from '@/components/dashboard/ExportPage';
import ProfilePage from '@/pages/ProfilePage';
import SalaryManagement from '@/components/dashboard/SalaryManagement';
import PartnerStockDetail from '@/components/dashboard/PartnerStockDetail';
import StatisticsPage from '@/components/dashboard/StatisticsPage';
import ActivityLogPage from '@/components/dashboard/ActivityLogPage';
import CeoDashboard from '@/components/dashboard/CeoDashboard';
import DocumentsPage from '@/components/dashboard/DocumentsPage';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const MainDashboardComponent = () => {
    switch (userRole) {
      case 'ceo':
        return <CeoDashboard />;
      case 'partner':
        return <PartnerDashboard />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Eno Livraison</title>
        <meta name="description" content="Tableau de bord de gestion pour Eno Livraison. Gérez vos stocks, partenaires, comptabilité et livraisons." />
      </Helmet>

      <div className="flex h-screen bg-transparent">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            <Routes>
              <Route path="/" element={<MainDashboardComponent />} />
              {userRole !== 'partner' && (
                <>
                  <Route path="/partners" element={<PartnersManagement />} />
                  <Route path="/partners/:partnerId" element={<PartnerStockDetail />} />
                  <Route path="/stock" element={<StockManagement />} />
                  <Route path="/accounting" element={<AccountingManagement />} />
                  <Route path="/salaries" element={<SalaryManagement />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/export" element={<ExportPage />} />
                  <Route path="/statistics" element={<StatisticsPage />} />
                  <Route path="/activity-log" element={<ActivityLogPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                </>
              )}
              {userRole === 'partner' && (
                 <Route path="/partner-view" element={<PartnerDashboard />} />
              )}
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
};

export default Dashboard;