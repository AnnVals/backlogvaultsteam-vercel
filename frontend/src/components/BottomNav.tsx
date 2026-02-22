import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BookMarked, Search, Download, BarChart2, User, LogOut, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';

export default function BottomNav() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const toggleLanguage = () => {
    if (i18n.language === 'es') {
      i18n.changeLanguage('en');
    } else {
      i18n.changeLanguage('es');
    }
  };

  const getLanguageLabel = () => {
    if (i18n.language === 'es') {
      return 'ES';
    } else {
      return 'EN';
    }
  };

  const getUserInitial = () => {
    if (user?.username?.[0]) {
      return user.username[0].toUpperCase();
    } else {
      return '?';
    }
  };

  const items = [
    { to: '/library', icon: BookMarked, label: t('nav.library') },
    { to: '/explore', icon: Search,     label: t('nav.explore') },
    { to: '/import',  icon: Download,   label: t('nav.import')  },
    { to: '/stats',   icon: BarChart2,  label: t('nav.stats')   },
  ];

  const getNavClass = (isActive: boolean) => {
    if (isActive) {
      return 'bottom-nav-item active';
    } else {
      return 'bottom-nav-item';
    }
  };

  const renderMenu = () => {
    if (menuOpen) {
      return (
        <div className="bottom-nav-menu">
          <div className="bottom-nav-menu-header">
            <div className="bottom-nav-menu-avatar">{getUserInitial()}</div>
            <div>
              <div className="bottom-nav-menu-name">{user?.username}</div>
              {user?.steam_id && (
                <div className="bottom-nav-menu-badge">Steam ✓</div>
              )}
            </div>
            <button className="bottom-nav-menu-close" onClick={() => setMenuOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="bottom-nav-menu-actions">
            <button className="bottom-nav-menu-btn" onClick={toggleLanguage}>
              🌐 {getLanguageLabel()}
            </button>
            <button className="bottom-nav-menu-btn danger" onClick={handleLogout}>
              <LogOut size={15} /> {t('nav.logout') || 'Cerrar sesión'}
            </button>
          </div>
        </div>
      );
    } else {
      return null;
    }
  };

  const renderNav = () => {
    if (isMobile) {
      return (
        <>
          {renderMenu()}
          <nav className="bottom-nav">
            {items.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => getNavClass(isActive)}>
                <Icon size={22} />
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              className={menuOpen ? 'bottom-nav-item active' : 'bottom-nav-item'}
              onClick={() => setMenuOpen(prev => !prev)}
            >
              <div className="bottom-nav-user-dot">{getUserInitial()}</div>
              <span>{t('nav.profile') || 'Perfil'}</span>
            </button>
          </nav>
        </>
      );
    } else {
      return null;
    }
  };

  return renderNav();
}