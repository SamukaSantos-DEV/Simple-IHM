import { Navigate, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Wrench, Settings, Users } from 'lucide-react';
import logo from '../../assets/hero.png';

export default function AdminLayout() {
  const token = localStorage.getItem('admin_auth_token');
  const navigate = useNavigate();
  const location = useLocation();

  // Se não estiver autenticado, manda pro login
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-700 bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
      <header className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-black/10 dark:border-white/10 gap-4 bg-white/20 dark:bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="font-bold tracking-tight">Admin <span className="opacity-50">Panel</span></h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
          <Link
            to="/admin/machines"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all
              ${location.pathname === '/admin/machines'
                ? 'bg-ios-blue text-white shadow-md shadow-ios-blue/25'
                : 'opacity-70 hover:opacity-100'
              }`}
          >
            <Settings size={14} />
            MÁQUINAS
          </Link>
          <Link
            to="/admin/funcionarios"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all
              ${location.pathname === '/admin/funcionarios'
                ? 'bg-ios-blue text-white shadow-md shadow-ios-blue/25'
                : 'opacity-70 hover:opacity-100'
              }`}
          >
            <Users size={14} />
            FUNCIONÁRIOS
          </Link>
          <Link
            to="/admin/maintenance"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all
              ${location.pathname === '/admin/maintenance'
                ? 'bg-ios-blue text-white shadow-md shadow-ios-blue/25'
                : 'opacity-70 hover:opacity-100'
              }`}
          >
            <Wrench size={14} />
            MANUTENÇÕES
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 py-2 px-4 rounded-lg cursor-pointer text-xs font-bold opacity-80 hover:opacity-100 transition-colors border border-red-200/50 dark:border-red-900/30"
          >
            <LogOut size={14} />
            <span>SAIR</span>
          </button>
        </div>
      </header>
      
      <main className="flex-1 bg-transparent">
        <Outlet />
      </main>
    </div>
  );
}
