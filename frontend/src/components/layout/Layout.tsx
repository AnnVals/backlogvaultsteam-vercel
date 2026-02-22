import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { BookOpen, Compass, Download, BarChart2, LogOut, Gamepad2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavClass = (isActive: boolean) => {
    if (isActive) {
      return 'nav-item active';
    } else {
      return 'nav-item';
    }
  };

  const getUserInitial = () => {
    if (user?.username?.[0]) {
      return user.username[0].toUpperCase();
    } else {
      return '';
    }
  };

  const getSteamBadge = () => {
    if (user?.steam_id) {
      return <span className="user-badge">{'Steam ✓'}</span>;
    } else {
      return null;
    }
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Gamepad2 size={22} className="logo-icon" />
          <span>{'Backlog'}<strong>{'Vault'}</strong></span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/library" className={({ isActive }) => getNavClass(isActive)}>
            <BookOpen size={17} /> {t('nav.library')}
          </NavLink>
          <NavLink to="/import" className={({ isActive }) => getNavClass(isActive)}>
            <Download size={17} /> {t('nav.import')}
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => getNavClass(isActive)}>
            <Compass size={17} /> {t('nav.explore')}
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => getNavClass(isActive)}>
            <BarChart2 size={17} /> {t('nav.stats')}
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getUserInitial()}</div>
            <div className="user-details">
              <span className="user-name">{user?.username}</span>
              {getSteamBadge()}
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={toggleLanguage}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            {getLanguageLabel()}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}