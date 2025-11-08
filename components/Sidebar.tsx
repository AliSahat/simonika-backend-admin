import { useState } from 'react';
import { LayoutDashboard, Bell, History, Settings, ChevronLeft, ChevronRight, User, LogOut } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Notifikasi', icon: Bell, path: '/notifications', badge: 3 },
  { name: 'Histori', icon: History, path: '/history' },
  { name: 'Pengaturan', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <aside className={`fixed left-0 top-0 z-40 ${isMinimized ? 'w-20' : 'w-72'} h-screen bg-white/95 backdrop-blur-lg border-r border-gray-200 shadow-lg p-4 flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Header */}
      <div className="mb-8 relative">
        <div className={`flex items-center ${isMinimized ? 'justify-center' : 'justify-between'} gap-3`}>
          {!isMinimized && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">SIMONIKA</h1>
                <p className="text-xs text-gray-500">Smart Farming</p>
              </div>
            </div>
          )}

          {isMinimized && (
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute -right-3 top-3 w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
        >
          {isMinimized ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.name;

          return (
            <a
              key={item.name}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                setActiveItem(item.name);
                if (item.path === '/dashboard') {
                  window.location.href = '/dashboard';
                }
              }}
              className={`relative flex items-center ${isMinimized ? 'justify-center' : 'justify-start'} gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                isActive ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:scale-110'} transition-transform flex-shrink-0`} />

              {!isMinimized && (
                <>
                  <span className="font-medium">{item.name}</span>
                  {item.badge && <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{item.badge}</span>}
                </>
              )}

              {/* Tooltip untuk minimized state */}
              {isMinimized && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {item.name}
                  {item.badge && <span className="ml-2 px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded-full">{item.badge}</span>}
                </div>
              )}
            </a>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        {!isMinimized ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@simonika.com</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:text-red-700">
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Keluar</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex justify-center p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:text-red-700 group relative">
              <LogOut className="w-5 h-5" />
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">Keluar</div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
