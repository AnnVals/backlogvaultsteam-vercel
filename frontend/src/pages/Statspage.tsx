import { useStats, useLibrary } from '@/hooks/useBacklogVault';
import { useAuthStore } from '@/store/authStore';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Clock, Gamepad2, TrendingUp } from 'lucide-react';
import { STATUS_CONFIG } from '@/types';
import { useTranslation } from 'react-i18next';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0070d1', '#9b59b6', '#e4000f'];

export default function StatsPage() {
  const { data, isLoading } = useStats();
  const { data: libraryData } = useLibrary();
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const stats = data?.data;

  const getStatusName = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (config) {
      return config.label;
    } else {
      return status;
    }
  };

  const getStatusCount = (key: string) => {
    const count = stats?.games_by_status?.[key as keyof typeof stats.games_by_status] as number;
    if (count) {
      return count;
    } else {
      return 0;
    }
  };

  const getCompletionRate = () => {
    if (stats && stats.total_games > 0) {
      return stats.completion_rate + '%';
    } else {
      return '0%';
    }
  };

  const getBarWidth = (count: number) => {
    if (stats && stats.total_games > 0) {
      return Math.round((count / stats.total_games) * 100);
    } else {
      return 0;
    }
  };

  const renderCoverImage = (entry: any) => {
    if (entry.cover_url) {
      return (
        <img
          src={entry.cover_url}
          alt={entry.title}
          style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }}
        />
      );
    } else {
      return (
        <div style={{ width: 36, height: 36, borderRadius: 4, background: 'var(--surface2)', display: 'grid', placeItems: 'center' }} />
      );
    }
  };

  if (isLoading) {
    return <div className="page"><div className="loading-spinner" /></div>;
  }

  if (!stats || stats.total_games === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">{t('stats.title')}</h1>
        </div>
        <div className="empty-state">
          <p>{t('stats.empty')}</p>
        </div>
      </div>
    );
  }

  const statusData = Object.entries(stats.games_by_status)
    .filter(([, v]) => (v as number) > 0)
    .map(([status, value]) => ({
      name: getStatusName(status),
      value,
    }));

  const recentGames = (libraryData?.data || [])
    .slice()
    .sort((a: any, b: any) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
    .slice(0, 10);

  const getDateLocale = () => {
    if (i18n.language === 'es') {
      return 'es-ES';
    } else {
      return 'en-GB';
    }
  };

  const renderDonut = () => {
    if (statusData.length > 0) {
      return (
        <div className="chart-card" style={{ minWidth: 260, flex: '0 0 300px' }}>
          <h3 className="chart-title">{t('stats.by_status_chart')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f0f18', border: '1px solid #1e1e2e', borderRadius: 6 }} />
              <Legend formatter={val => <span style={{ color: '#aaa', fontSize: 12 }}>{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('stats.title')}</h1>
          <p className="page-sub">{t('stats.profile') + ' ' + user?.username}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="kpi-grid" style={{ flex: 1, minWidth: 260 }}>
          <div className="kpi-card">
            <Gamepad2 size={20} style={{ color: 'var(--accent)', marginBottom: '0.75rem' }} />
            <div className="kpi-value">{stats.total_games}</div>
            <div className="kpi-label">{t('stats.total_games')}</div>
          </div>
          <div className="kpi-card">
            <Trophy size={20} style={{ color: 'var(--yellow)', marginBottom: '0.75rem' }} />
            <div className="kpi-value">{stats.games_by_status?.completed || 0}</div>
            <div className="kpi-label">{t('stats.completed')}</div>
          </div>
          <div className="kpi-card">
            <Clock size={20} style={{ color: '#3b82f6', marginBottom: '0.75rem' }} />
            <div className="kpi-value">{stats.total_hours.toLocaleString() + 'h'}</div>
            <div className="kpi-label">{t('stats.hours')}</div>
          </div>
          <div className="kpi-card">
            <TrendingUp size={20} style={{ color: 'var(--green)', marginBottom: '0.75rem' }} />
            <div className="kpi-value">{getCompletionRate()}</div>
            <div className="kpi-label">{t('stats.completion_rate')}</div>
          </div>
        </div>

        <div className="chart-card" style={{ flex: 1, minWidth: 260 }}>
          <h3 className="chart-title">{t('stats.by_status')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = getStatusCount(key);
              const pct = getBarWidth(count);
              const Icon = cfg.icon;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text2)' }}>
                      <Icon size={13} style={{ color: cfg.color }} /> {cfg.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{count + ' · ' + pct + '%'}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', borderRadius: 99, background: cfg.color, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {renderDonut()}
      </div>

      <div className="chart-card">
        <h3 className="chart-title">{t('stats.recent')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {recentGames.map((e: any, i: number) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem', minWidth: 18 }}>{i + 1}</span>
              {renderCoverImage(e)}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{e.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{e.platform}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {new Date(e.added_at).toLocaleDateString(getDateLocale(), { day: '2-digit', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}