import { FiMenu, FiLogOut } from 'react-icons/fi';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export default function AdminSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  adminUser,
  handleLogout,
  menuItems,
  activeTab,
  setActiveTab
}) {
  const theme = useContext(ThemeContext);

  return (
    <aside className={`sticky top-0 h-screen ${isSidebarOpen ? 'w-64' : 'w-20'} bg-accent text-white border-r border-accent-light shadow-xl flex flex-col transition-all duration-300 z-50`}>
      {/* Sidebar Header */}
      <div className={`p-5 border-b border-white/10 flex items-center`}>
        <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'max-w-[200px] opacity-100 mr-auto' : 'max-w-0 opacity-0 mr-0'}`}>
          <h1 className="text-xl font-bold text-white tracking-wide truncate">
            Admin Panel
          </h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors flex-shrink-0 ${!isSidebarOpen ? 'mx-auto' : ''}`}
        >
          <FiMenu className="text-xl" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={!isSidebarOpen ? item.label : ''}
            className={`w-full text-left p-3 rounded-xl transition-all flex items-center font-medium text-sm ${activeTab === item.id
              ? 'bg-secondary text-white shadow-md'
              : `text-white/70 hover:bg-white/10 hover:text-white`
              }`}
          >
            <span className={`text-xl flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'mr-4 ml-1' : 'mx-auto'}`}>{item.icon}</span>
            <span className={`truncate transition-all duration-300 tracking-wide ${isSidebarOpen ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className={`p-4 border-t border-white/10`}>
        <button
          onClick={handleLogout}
          title={!isSidebarOpen ? 'Logout' : ''}
          className={`w-full border border-red-400/50 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-xl transition-all flex items-center py-2.5 font-medium text-sm`}
        >
          <FiLogOut className={`text-xl flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'ml-4 mr-3' : 'mx-auto'}`} />
          <span className={`truncate transition-all duration-300 tracking-wide ${isSidebarOpen ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'}`}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
