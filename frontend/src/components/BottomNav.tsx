import { NavLink } from 'react-router-dom';
import { BookMarked, Search, Download, BarChart2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const { t } = useTranslation();

  const items = [
    { to: '/library',  icon: BookMarked, label: t('nav.library')  },
    { to: '/explore',  icon: Search,     label: t('nav.explore')  },
    { to: '/import',   icon: Download,   label: t('nav.import')   },
    { to: '/stats',    icon: BarChart2,  label: t('nav.stats')    },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}