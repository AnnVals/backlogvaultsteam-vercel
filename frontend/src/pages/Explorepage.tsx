import { useState } from 'react';
import { Search, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGameSearch, usePopularGames, useLibrary, useAddToLibrary } from '@/hooks/useBacklogVault';
import { PLATFORMS } from '@/types';
import { useTranslation } from 'react-i18next';

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('PC');
  const { t } = useTranslation();

  const { data: searchData, isLoading: isSearching } = useGameSearch(search, page);
  const { data: popularData, isLoading: isLoadingPopular } = usePopularGames(page);
  const { data: libraryData } = useLibrary();
  const { mutate: addToLibrary } = useAddToLibrary();

  const libraryRawgIds = new Set(
    libraryData?.data?.map((e: any) => e.rawg_id).filter(Boolean) || []
  );

  const isSearching_ = search.length > 2;
  const isLoading = isSearching_ ? isSearching : isLoadingPopular;
  const games = isSearching_ ? (searchData?.data || []) : (popularData?.data || []);
  const pagination = isSearching_ ? searchData?.pagination : popularData?.pagination;

  const getMetacriticClass = (score: number) => {
    if (score >= 75) {
      return 'metacritic green';
    } else if (score >= 50) {
      return 'metacritic yellow';
    } else {
      return 'metacritic red';
    }
  };

  const getPlatformBorderColor = (platformId: string, platformColor: string) => {
    if (selectedPlatform === platformId) {
      return platformColor;
    } else {
      return 'var(--border)';
    }
  };

  const getPlatformBackground = (platformId: string, platformColor: string) => {
    if (selectedPlatform === platformId) {
      return platformColor + '20';
    } else {
      return 'none';
    }
  };

  const getPlatformColor = (platformId: string, platformColor: string) => {
    if (selectedPlatform === platformId) {
      return platformColor;
    } else {
      return 'var(--text2)';
    }
  };

  const getOverlayBtnClass = (inLibrary: boolean) => {
    if (inLibrary) {
      return 'overlay-btn backlog';
    } else {
      return 'overlay-btn';
    }
  };

  const getOverlayBtnLabel = (inLibrary: boolean, gameId: number) => {
    if (inLibrary) {
      return '✓ ' + t('explore.in_library');
    } else if (addingId === gameId) {
      return t('explore.adding');
    } else {
      return <><Plus size={13} /> {t('explore.add')}</>;
    }
  };

  const getPageTitle = () => {
    if (search.length > 2) {
      return <><Search size={26} /> {t('explore.title_search')}</>;
    } else {
      return t('explore.title_popular');
    }
  };

  const handleAdd = (game: any) => {
    setAddingId(game.id);
    addToLibrary({
      rawg_id: game.id,
      title: game.name,
      cover_url: game.background_image,
      background_url: game.background_image,
      release_date: game.released || null,
      genres: game.genres?.map((g: any) => g.name) || null,
      platforms: game.platforms?.map((p: any) => p.platform.name) || null,
      platform: selectedPlatform,
      source: 'manual',
    }, {
      onSettled: () => setAddingId(null),
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{getPageTitle()}</h1>
          {pagination && (
            <p className="page-sub">{pagination.total.toLocaleString() + ' ' + t('explore.games')}</p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{t('explore.add_as')}</span>
          {PLATFORMS.slice(0, 5).map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: getPlatformBorderColor(p.id, p.color),
                  background: getPlatformBackground(p.id, p.color),
                  color: getPlatformColor(p.id, p.color),
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <Icon size={13} /> {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="search-wrap" style={{ marginBottom: '1.5rem' }}>
        <Search size={16} className="search-icon" />
        <input
          className="search-input"
          placeholder={t('explore.search_placeholder')}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>{'✕'}</button>
        )}
      </div>

      {isLoading && (
        <div className="games-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="game-card-skeleton" />
          ))}
        </div>
      )}

      {!isLoading && games.length === 0 && (
        <div className="empty-state">
          <p>{t('explore.not_found')}</p>
        </div>
      )}

      {!isLoading && games.length > 0 && (
        <div className="games-grid">
          {games.map((game: any, i: number) => {
            const inLibrary = libraryRawgIds.has(game.id);
            return (
              <motion.div
                key={game.id}
                className="game-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
              >
                <div className="card-img-wrap">
                  {game.background_image
                    ? <img src={game.background_image} alt={game.name} className="card-img" loading="lazy" />
                    : <div className="card-img-placeholder" />
                  }
                  {game.metacritic && (
                    <span className={getMetacriticClass(game.metacritic)}>
                      {game.metacritic}
                    </span>
                  )}
                  <div className="card-overlay">
                    <button
                      className={getOverlayBtnClass(inLibrary)}
                      onClick={() => {
                        if (!inLibrary) {
                          handleAdd(game);
                        }
                      }}
                      disabled={inLibrary || addingId === game.id}
                    >
                      {getOverlayBtnLabel(inLibrary, game.id)}
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{game.name}</h3>
                  <div className="card-meta">
                    {game.released && (
                      <span>{new Date(game.released).getFullYear()}</span>
                    )}
                    {game.genres?.[0] && (
                      <span className="genre-tag">{game.genres[0].name}</span>
                    )}
                  </div>
                  {game.rating > 0 && (
                    <div className="card-stats">
                      <span>
                        <Star size={11} fill="currentColor" style={{ color: 'var(--yellow)' }} />
                        {' ' + game.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            {t('explore.prev')}
          </button>
          <span className="page-info">{t('explore.page') + ' ' + page + ' / ' + pagination.totalPages}</span>
          <button className="page-btn" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
            {t('explore.next')}
          </button>
        </div>
      )}
    </div>
  );
}