import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { BookMarked, Search, Download, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

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

  const renderNav = () => {
    if (isMobile) {
      return (
        <nav className="bottom-nav">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => getNavClass(isActive)}>
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      );
    } else {
      return null;
    }
  };

  return renderNav();
}