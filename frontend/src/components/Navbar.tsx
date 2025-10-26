import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { Activity, LogOut, Users, LayoutGrid, Inbox } from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to || (to === '/' && location.pathname.startsWith('/groups'));
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-gray-100 text-primary' 
            : 'text-secondary hover:text-primary hover:bg-gray-50'
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : ''}`} /> {label}
      </Link>
    );
  };

  return (
    <>
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-primary group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-lg">Balance</span>
          </Link>
          
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" icon={LayoutGrid} label="Groups" />
              <NavLink to="/people" icon={Users} label="People" />
              <NavLink to="/requests" icon={Inbox} label="Requests" />
            </nav>
          )}
          
          <div className="flex items-center gap-4 text-sm">
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-secondary">
                  <div className="w-7 h-7 rounded-full bg-gray-100 border border-border flex items-center justify-center text-xs font-semibold text-primary">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium">{currentUser.name}</span>
                </div>
                <div className="w-px h-4 bg-border hidden sm:block" />
                <button 
                  onClick={handleLogout} 
                  className="text-tertiary hover:text-negative transition-colors p-1" 
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-sm font-medium text-secondary">Not logged in</div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {currentUser && (
        <div className="md:hidden glass-header border-t border-border border-b-0 sticky top-16 z-40">
          <nav className="flex items-center p-2 gap-2 overflow-x-auto">
            <NavLink to="/" icon={LayoutGrid} label="Groups" />
            <NavLink to="/people" icon={Users} label="People" />
            <NavLink to="/requests" icon={Inbox} label="Requests" />
          </nav>
        </div>
      )}
    </>
  );
}
