import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../context/AdminContext';
import { ThemeContext } from '../context/ThemeContext';
import StatisticsPage from './AdminPages/StatisticsPage';
import TestsPage from './AdminPages/TestsPage';
import StudentsPage from './AdminPages/StudentsPage';
import AdminSidebar from './AdminSidebar';
import { FiBarChart2, FiFileText, FiUsers } from 'react-icons/fi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminUser, logout, fetchStudents, fetchTests, streamConnected, lastUpdated } = useContext(AdminContext);
  const theme = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('statistics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initial data load — polling will keep it updated automatically afterward
  useEffect(() => {
    fetchStudents();
    fetchTests();
  }, [fetchStudents, fetchTests]);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const menuItems = [
    { id: 'statistics', label: 'Statistics', icon: <FiBarChart2 /> },
    { id: 'tests', label: 'Tests', icon: <FiFileText /> },
    { id: 'students', label: 'Students', icon: <FiUsers /> },
  ];

  const formatUpdated = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`h-screen overflow-hidden ${theme.bg.gradient} flex`}>
      <AdminSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        adminUser={adminUser}
        handleLogout={handleLogout}
        menuItems={menuItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Content Area */}
      <main className="flex-1 bg-slate-50 h-screen overflow-y-auto">
        <div className="p-8">

          {/* Live status bar */}
          <div className="flex items-center justify-end gap-3 mb-5">
            {lastUpdated && (
              <span className="text-xs text-slate-400 font-medium">
                Updated {formatUpdated(lastUpdated)}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              streamConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${streamConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              {streamConnected ? 'Live' : 'Polling (5s)'}
            </span>
          </div>

          {activeTab === 'statistics' && <StatisticsPage />}
          {activeTab === 'tests' && <TestsPage />}
          {activeTab === 'students' && <StudentsPage />}
        </div>
      </main>
    </div>
  );
}
