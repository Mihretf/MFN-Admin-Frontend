import { Link, Outlet, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import { Button } from './ui/button';
import { Church, Home, MapPin, Users, FileText, LogOut, Menu, X, BookOpen, Image, Building } from 'lucide-react';
import { useState } from 'react';

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'super';

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    ...(isSuperAdmin
      ? [
          { to: '/dashboard/regions', icon: MapPin, label: 'Regions' },
          { to: '/dashboard/churches', icon: Building, label: 'Churches' },
          { to: '/dashboard/invitations', icon: Users, label: 'Invitations' },
          { to: '/dashboard/blogs', icon: BookOpen, label: 'Blogs' },
        ]
      : []),
    { to: '/dashboard/posts', icon: FileText, label: 'Services' },
    { to: '/dashboard/gallery', icon: Image, label: 'Gallery' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b" style={{ backgroundColor: '#1a3c34', borderColor: 'rgba(212, 175, 55, 0.2)' }}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#d4af37' }}>
              <Church className="w-6 h-6" style={{ color: '#1a3c34' }} />
            </div>
            <div>
              <h1 className="font-semibold" style={{ color: '#f5f5f5' }}>Church Admin</h1>
              <p className="text-xs" style={{ color: '#f0d082' }}>{user?.role === 'super' ? 'Super Admin' : 'Regional Admin'}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-white/10"
                style={{ color: '#f5f5f5' }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right mr-2">
              <p className="text-sm" style={{ color: '#f5f5f5' }}>{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex" style={{ color: '#f0d082' }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden" style={{ color: '#f5f5f5' }}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-white/10"
                  style={{ color: '#f5f5f5' }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <Button variant="ghost" onClick={handleLogout} className="justify-start" style={{ color: '#f0d082' }}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}