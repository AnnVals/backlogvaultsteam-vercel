import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, List, Search, Trash2, Clock, Star, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLibrary, useRemoveFromLibrary, useClearLibrary } from '@/hooks/useBacklogVault';
import { libraryApi } from '@/services/api';
import { PLATFORMS, STATUS_CONFIG, SOURCE_CONFIG, GameStatus, GameSource } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

type SortField = 'title' | 'platform' | 'status' | 'hours_played' | 'rating';
type SortDir = 'asc' | 'desc';

function StatusIcon({ status, size = 14 }: { status: GameStatus; size?: number }) {
  const Icon = STATUS_CONFIG[status].icon;
  return <Icon size={size} />;
}

function SourceIcon({ source, size = 14 }: { source: GameSource; size?: number }) {
  const Icon = SOURCE_CONFIG[source].icon;
  return <Icon size={size} />;
}

function PlatformBadge({ platform }: { platform: string }) {
  const config = PLATFORMS.find(p => p.id === platform);
  const Icon = config?.icon;

  const getIcon = () => {
    if (Icon) {
      return <Icon size={14} />;
    } else {
      return null;
    }
  };

  return (
    <span
      className="platform-badge-inline"
      style={{ color: config?.color || '#aaa', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
    >
      {getIcon()} {platform}
    </span>
  );
}

function StarRating({ value, onChange }: { value: number | null | undefined; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const stars = [1, 2, 3, 4, 5];
  const current = value ? Math.round(value / 2) : 0;

  const getStarColor = (s: number) => {
    if (s <= (hover ?? current)) {
      return 'var(--yellow)';
    } else {
      return 'var(--border2)';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {stars.map(s => (
        <button
          key={s}
          onClick={() => onChange(s * 2)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: getStarColor(s), padding: '0', fontSize: '1rem', lineHeight: 1 }}
        >
          {'★'}
        </button>
      ))}
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} style={{ opacity: 0.35 }} />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} style={{ color: 'var(--accent, #7c6af7)' }} />
    : <ChevronDown size={12} style={{ color: 'var(--accent, #7c6af7)' }} />;
}

const STATUS_ORDER: Record<string, number> = {};
Object.keys(STATUS_CONFIG).forEach((k, i) => { STATUS_ORDER[k] = i; });

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const { data, isLoading } = useLibrary({ platform: platform || undefined, status: status || undefined });
  const { mutate: remove } = useRemoveFromLibrary();
  const { mutate: clearAll, isPending: isClearing } = useClearLibrary();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const entries = useMemo(() => {
    const all = data?.data || [];
    let filtered = all;
    if (search) {
      filtered = filtered.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (source) {
      filtered = filtered.filter(e => e.source === source);
    }

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'platform':
          cmp = (a.platform || '').localeCompare(b.platform || '');
          break;
        case 'status':
          cmp = (STATUS_ORDER[a.status ?? ''] ?? 99) - (STATUS_ORDER[b.status ?? ''] ?? 99);
          break;
        case 'hours_played':
          cmp = (a.hours_played ?? 0) - (b.hours_played ?? 0);
          break;
        case 'rating':
          cmp = (a.rating ?? 0) - (b.rating ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [data, search, source, sortField, sortDir]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === entries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map(e => e.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const getSelectAllLabel = () => {
    if (selected.size === entries.length) {
      return t('library.deselect_all');
    } else {
      return t('library.select_all');
    }
  };

  const getViewBtnClass = (v: 'grid' | 'list') => {
    if (view === v) {
      return 'view-btn active';
    } else {
      return 'view-btn';
    }
  };

  const getStatusFilterClass = (s: GameStatus | '') => {
    if (status === s) {
      return 'status-filter active';
    } else {
      return 'status-filter';
    }
  };

  const getRowClass = (id: string) => {
    if (selected.has(id)) {
      return 'list-row row-selected';
    } else {
      return 'list-row';
    }
  };

  const getCardClass = (id: string) => {
    if (selected.has(id)) {
      return 'game-card selectable card-selected';
    } else {
      return 'game-card selectable';
    }
  };

  const getCheckboxClass = (id: string) => {
    if (selected.has(id)) {
      return 'card-checkbox checked';
    } else {
      return 'card-checkbox';
    }
  };

  const getClearBtnLabel = () => {
    if (isClearing) {
      return t('library.clearing');
    } else {
      return t('library.yes_clear');
    }
  };

  const getEmptyMessage = () => {
    if (platform || status || search) {
      return t('library.empty_filters');
    } else {
      return <><br />{t('library.empty_hint')}</>;
    }
  };

  const getHoursLabel = (hours: number | undefined) => {
    if (hours) {
      return hours + 'h';
    } else {
      return '—';
    }
  };

  const getCardPlaceholder = (coverUrl: string | undefined, title: string) => {
    if (coverUrl) {
      return <img src={coverUrl} alt={title} className="card-img" loading="lazy" />;
    } else {
      return <div className="card-img-placeholder" />;
    }
  };

  const getListThumb = (coverUrl: string | undefined) => {
    if (coverUrl) {
      return <img src={coverUrl} alt="" className="list-thumb" />;
    } else {
      return null;
    }
  };

  const getBulkBarClass = () => {
    if (selected.size > 0) {
      return 'bulk-bar visible';
    } else {
      return 'bulk-bar';
    }
  };

  const getStatusBadgeBackground = (entryStatus: GameStatus | null) => {
    if (entryStatus) {
      return STATUS_CONFIG[entryStatus]?.bgSolid;
    } else {
      return undefined;
    }
  };

  const getStatusBadgeColor = (entryStatus: GameStatus | null) => {
    if (entryStatus) {
      return STATUS_CONFIG[entryStatus]?.color;
    } else {
      return undefined;
    }
  };

  const getStatusBadgeIcon = (entryStatus: GameStatus | null) => {
    if (entryStatus) {
      return <StatusIcon status={entryStatus} />;
    } else {
      return null;
    }
  };

  const getSelectBackground = (entryStatus: GameStatus | null) => {
    if (entryStatus) {
      return STATUS_CONFIG[entryStatus]?.bg;
    } else {
      return 'var(--surface2)';
    }
  };

  const getSelectColor = (entryStatus: GameStatus | null) => {
    if (entryStatus) {
      return STATUS_CONFIG[entryStatus]?.color;
    } else {
      return 'var(--muted)';
    }
  };

  const getCheckboxContent = (id: string) => {
    if (selected.has(id)) {
      return '✓';
    } else {
      return '';
    }
  };

  const getLoadingClass = () => {
    if (view === 'grid') {
      return 'games-grid';
    } else {
      return '';
    }
  };

  const { mutate: updateMany, isPending: isUpdating } = useMutation({
    mutationFn: async ({ ids, payload }: { ids: string[]; payload: any }) =>
      Promise.all(ids.map(id => libraryApi.update(id, payload))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      clearSelection();
      toast.success(t('library.updated'));
    },
    onError: () => toast.error(t('library.update_error')),
  });

  const { mutate: removeMany, isPending: isRemoving } = useMutation({
    mutationFn: async (ids: string[]) =>
      Promise.all(ids.map(id => libraryApi.remove(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      clearSelection();
      toast.success(t('library.deleted'));
    },
    onError: () => toast.error(t('library.delete_error')),
  });

  const bulkUpdate = (payload: any) => {
    if (selected.size === 0) return;
    updateMany({ ids: Array.from(selected), payload });
  };

  const isBusy = isUpdating || isRemoving;

  const renderConfirmClear = () => {
    if (confirmClear) {
      return (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('library.confirm')}</span>
          <button
            className="btn-ghost"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setConfirmClear(false)}
          >
            {t('library.no')}
          </button>
          <button
            className="btn-primary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: 'var(--red)' }}
            onClick={() => { clearAll(); setConfirmClear(false); }}
            disabled={isClearing}
          >
            {getClearBtnLabel()}
          </button>
        </div>
      );
    } else {
      return (
        <button
          className="btn-ghost"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--red)', borderColor: 'rgba(239,68,68,.3)' }}
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 size={14} /> {t('library.clear')}
        </button>
      );
    }
  };

  const renderHours = (hours: number | undefined) => {
    if (hours && hours > 0) {
      return <span><Clock size={11} /> {hours + 'h'}</span>;
    } else {
      return null;
    }
  };

  const renderRating = (rating: number | undefined) => {
    if (rating) {
      return <span><Star size={11} fill="currentColor" /> {rating + '/10'}</span>;
    } else {
      return null;
    }
  };

  const renderSearch = () => {
    if (search) {
      return <button className="search-clear" onClick={() => setSearch('')}>{'✕'}</button>;
    } else {
      return null;
    }
  };

  // Sortable column header helper
  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <span
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
    >
      {label}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </span>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('library.title')}</h1>
          <p className="page-sub">{(data?.pagination?.total || entries.length) + ' ' + t('explore.games')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {renderConfirmClear()}
          <div className="view-toggle">
            <button className={getViewBtnClass('grid')} onClick={() => setView('grid')}>
              <Grid size={16} />
            </button>
            <button className={getViewBtnClass('list')} onClick={() => setView('list')}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="search-wrap" style={{ marginBottom: '1rem' }}>
        <Search size={16} className="search-icon" />
        <input
          className="search-input"
          placeholder={t('library.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {renderSearch()}
      </div>

      <div className="status-filter-bar">
        {(['', ...Object.keys(STATUS_CONFIG)] as (GameStatus | '')[]).map(s => (
          <button key={s} className={getStatusFilterClass(s)} onClick={() => setStatus(s)}>
            {s ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <StatusIcon status={s} /> {t(`status.${s}`)}
              </span>
            ) : t('library.all')}
          </button>
        ))}
      </div>

      <div className={getBulkBarClass()}>
        <div className="bulk-bar-left">
          <button className="btn-ghost small" onClick={toggleSelectAll}>
            {getSelectAllLabel()}
          </button>
          <span className="bulk-count">{selected.size + ' ' + t('library.selected')}</span>
        </div>
        <div className="bulk-bar-actions">
          {(Object.keys(STATUS_CONFIG) as GameStatus[]).map(s => (
            <button
              key={s}
              className="bulk-action"
              disabled={isBusy}
              onClick={() => bulkUpdate({ status: s })}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <StatusIcon status={s} /> {t(`status.${s}`)}
            </button>
          ))}
          <button
            className="bulk-action danger"
            disabled={isBusy}
            onClick={() => removeMany(Array.from(selected))}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Trash2 size={13} /> {t('library.delete')}
          </button>
          <button className="btn-ghost small" onClick={clearSelection}>{'✕'}</button>
        </div>
      </div>

      {isLoading && (
        <div className={getLoadingClass()}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="game-card-skeleton" />
          ))}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="empty-state">
          <p>{getEmptyMessage()}</p>
        </div>
      )}

      {!isLoading && entries.length > 0 && view === 'grid' && (
        <div className="games-grid">
          <AnimatePresence>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                className={getCardClass(entry.id)}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: Math.min(i * 0.02, 0.3) } }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => toggleSelect(entry.id)}
                onContextMenu={e => { e.preventDefault(); toggleSelect(entry.id); }}
              >
                <div className={getCheckboxClass(entry.id)}>
                  {getCheckboxContent(entry.id)}
                </div>
                <div className="card-img-wrap">
                  {getCardPlaceholder(entry.cover_url, entry.title)}
                  {entry.status && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        left: 'unset',
                        width: '34px',
                        height: '34px',
                        minWidth: '34px',
                        minHeight: '34px',
                        borderRadius: '50%',
                        background: getStatusBadgeBackground(entry.status) || 'rgba(20,20,35,0.85)',
                        color: '#fffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.6), inset 0 0 0 1.5px rgba(255,255,255,0.1)',
                        zIndex: 5,
                        flexShrink: 0,
                      }}
                    >
                      <StatusIcon status={entry.status} size={17} />
                    </div>
                  )}
                  {selected.size === 0 && (
                    <div className="card-overlay" onClick={e => e.stopPropagation()}>
                      <div className="overlay-status-row">
                        {(Object.keys(STATUS_CONFIG) as GameStatus[]).map(s => (
                          <button
                            key={s}
                            className="overlay-status-btn"
                            title={t(`status.${s}`)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() =>
                              libraryApi.update(entry.id, { status: s })
                                .then(() => queryClient.invalidateQueries({ queryKey: ['library'] }))
                            }
                          >
                            <StatusIcon status={s} />
                          </button>
                        ))}
                      </div>
                      <button className="overlay-btn danger" onClick={() => remove(entry.id)}>
                        <Trash2 size={13} /> {t('library.remove')}
                      </button>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <h3 className="card-title">{entry.title}</h3>
                  <div className="card-meta">
                    <PlatformBadge platform={entry.platform} />
                  </div>
                  <div className="card-stats">
                    {renderHours(entry.hours_played)}
                    {renderRating(entry.rating)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!isLoading && entries.length > 0 && view === 'list' && (
        <div className="games-list-table">
          <div className="list-header">
            <span>
              <input
                type="checkbox"
                checked={selected.size === entries.length && entries.length > 0}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
            </span>
            <span><SortHeader field="title" label={t('library.game')} /></span>
            <span><SortHeader field="platform" label={t('library.platform')} /></span>
            <span><SortHeader field="status" label={t('library.status')} /></span>
            <span><SortHeader field="hours_played" label={t('library.hours')} /></span>
            <span><SortHeader field="rating" label={t('library.score')} /></span>
            <span></span>
          </div>
          <AnimatePresence>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                className={getRowClass(entry.id)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i * 0.015, 0.25) } }}
                exit={{ opacity: 0 }}
                layout
              >
                <span onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(entry.id)}
                    onChange={() => toggleSelect(entry.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </span>
                <div className="list-game-info">
                  {getListThumb(entry.cover_url)}
                  <span>{entry.title}</span>
                </div>
                <PlatformBadge platform={entry.platform} />
                <select
                  className="status-select-inline"
                  value={entry.status || ''}
                  style={{
                    background: getSelectBackground(entry.status),
                    color: getSelectColor(entry.status),
                  }}
                  onChange={e =>
                    libraryApi.update(entry.id, { status: e.target.value || null })
                      .then(() => queryClient.invalidateQueries({ queryKey: ['library'] }))
                  }
                >
                  <option value="">{t('library.no_status')}</option>
                  {(Object.keys(STATUS_CONFIG) as GameStatus[]).map(s => (
                    <option key={s} value={s}>{t(`status.${s}`)}</option>
                  ))}
                </select>
                <span>{getHoursLabel(entry.hours_played)}</span>
                <StarRating
                  value={entry.rating}
                  onChange={rating =>
                    libraryApi.update(entry.id, { rating })
                      .then(() => queryClient.invalidateQueries({ queryKey: ['library'] }))
                  }
                />
                <button className="btn-icon danger" onClick={() => remove(entry.id)}>
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}