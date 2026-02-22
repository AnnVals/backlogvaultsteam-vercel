import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Loader, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importApi, authApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import type { SteamPreview } from "@/types";

type Tab = "steam";

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("steam");
  const { t } = useTranslation();

  const getTabClass = (tab: Tab) => {
    if (activeTab === tab) {
      return 'import-tab active';
    } else {
      return 'import-tab';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('import.title')}</h1>
          <p className="page-sub">{t('import.subtitle')}</p>
        </div>
      </div>

      <div className="import-tabs">
        <button className={getTabClass("steam")} onClick={() => setActiveTab("steam")}>
          {'Steam'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "steam" && <SteamImporter />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SteamImporter() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [steamInput, setSteamInput] = useState('');
  const [preview, setPreview] = useState<SteamPreview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<'input' | 'preview' | 'done'>('input');

  const previewMutation = useMutation({
    mutationFn: (id: string) => importApi.steamPreview(id),
    onSuccess: (data) => {
      setPreview(data.data!);
      const nonOwned = data.data.games
        .filter((g: { already_in_library: boolean }) => !g.already_in_library)
        .map((g: { appid: number }) => g.appid);
      setSelectedIds(new Set(nonOwned));
      setStep('preview');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t('import.load_error'));
    },
  });

  const importMutation = useMutation({
    mutationFn: (data: { steam_id: string; selected_appids: number[] }) =>
      importApi.importSteam(data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      authApi.me().then(res => {
        useAuthStore.setState({ user: res.data });
      });
      toast.success(data.data!.imported + ' ' + t('import.imported'));
      setStep('done');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t('import.import_error'));
    },
  });

  const handlePreview = () => {
    const input = steamInput.trim();
    if (!input) return;
    const idMatch = input.match(/\/profiles\/(\d{17})/) || input.match(/^(\d{17})$/);
    const id = idMatch ? idMatch[1] : input.replace(/^.*\/id\//, '').replace(/\/$/, '');
    previewMutation.mutate(id);
  };

  const handleSync = () => {
    if (!user?.steam_id) return;
    previewMutation.mutate(user.steam_id);
  };

  const handleImport = () => {
    if (!preview) return;
    importMutation.mutate({
      steam_id: preview.steam_id,
      selected_appids: Array.from(selectedIds),
    });
  };

  const toggleAll = () => {
    if (!preview) return;
    const nonOwned = preview.games.filter((g) => !g.already_in_library).map((g) => g.appid);
    if (selectedIds.size === nonOwned.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(nonOwned));
    }
  };

  const getToggleLabel = () => {
    if (!preview) return '';
    const nonOwned = preview.games.filter((g) => !g.already_in_library);
    if (selectedIds.size === nonOwned.length) {
      return t('import.deselect_all');
    } else {
      return t('import.select_all');
    }
  };

  const getSyncButtonContent = () => {
    if (previewMutation.isPending) {
      return <><Loader size={14} className="spin" /> {t('import.loading')}</>;
    } else {
      return <><RefreshCw size={14} /> {t('import.sync')}</>;
    }
  };

  const getImportButtonContent = () => {
    if (importMutation.isPending) {
      return <><Loader size={14} className="spin" /> {t('import.importing')}</>;
    } else {
      return t('import.import_btn') + ' ' + selectedIds.size + ' ' + t('import.games');
    }
  };

  const getPreviewButtonContent = () => {
    if (previewMutation.isPending) {
      return <Loader size={16} className="spin" />;
    } else {
      return t('import.preview_btn');
    }
  };

  const getPreviewGameClass = (alreadyInLibrary: boolean, appid: number) => {
    let cls = 'preview-game';
    if (alreadyInLibrary) {
      cls = cls + ' owned';
    }
    if (selectedIds.has(appid)) {
      cls = cls + ' selected';
    }
    return cls;
  };

  const handleGameClick = (appid: number, alreadyInLibrary: boolean) => {
    if (alreadyInLibrary) return;
    const next = new Set(selectedIds);
    if (next.has(appid)) {
      next.delete(appid);
    } else {
      next.add(appid);
    }
    setSelectedIds(next);
  };

  if (step === 'done') {
    return (
      <div className="import-success">
        <CheckCircle size={48} color="#22c55e" />
        <h2>{t('import.success_title')}</h2>
        <p>{t('import.success_msg')}</p>
        <button className="btn-primary" onClick={() => { setStep('input'); setPreview(null); }}>
          {t('import.import_again')}
        </button>
      </div>
    );
  }

  return (
    <div className="import-section">
      <div className="import-card">
        <div className="import-card-header">
          <h2>{t('import.steam_title')}</h2>
          <p>{t('import.steam_subtitle')}</p>
        </div>

        {user?.steam_id && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
              {t('import.linked') + ' '}
              <strong style={{ color: 'var(--text)' }}>{user.steam_id}</strong>
            </div>
            <button
              className="btn-primary"
              onClick={handleSync}
              disabled={previewMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {getSyncButtonContent()}
            </button>
          </div>
        )}

        <div className="import-requirements">
          <div className="req-item">
            <AlertCircle size={14} />
            {t('import.public_warning') + ' '}<strong>{t('import.public')}</strong>
          </div>
          <div className="req-item">
            <AlertCircle size={14} />
            {t('import.public_hint') + ' '}<strong>{t('import.public')}</strong>
          </div>
        </div>

        <div className="field">
          <label className="field-label">{t('import.steam_id_label')}</label>
          <div className="input-row">
            <input
              className="field-input"
              placeholder={t('import.steam_placeholder')}
              value={steamInput}
              onChange={(e) => setSteamInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { handlePreview(); } }}
              disabled={previewMutation.isPending}
            />
            <button
              className="btn-primary"
              onClick={handlePreview}
              disabled={!steamInput || previewMutation.isPending}
            >
              {getPreviewButtonContent()}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {preview && step === 'preview' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="import-preview"
          >
            <div className="preview-header">
              <div className="preview-user">
                <img src={preview.steam_avatar} alt="" className="preview-avatar" />
                <div>
                  <strong>{preview.steam_username}</strong>
                  <span>{preview.total_games + ' ' + t('import.games_in_steam')}</span>
                </div>
              </div>
              <div className="preview-actions">
                <button className="btn-ghost" onClick={toggleAll}>
                  {getToggleLabel()}
                </button>
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={selectedIds.size === 0 || importMutation.isPending}
                >
                  {getImportButtonContent()}
                </button>
              </div>
            </div>

            <div className="preview-grid">
              {preview.games.map((game) => (
                <div
                  key={game.appid}
                  className={getPreviewGameClass(game.already_in_library, game.appid)}
                  onClick={() => handleGameClick(game.appid, game.already_in_library)}
                >
                  <img
                    src={game.cover_url}
                    alt={game.name}
                    className="preview-game-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x160/111118/555';
                    }}
                  />
                  {game.already_in_library && <div className="already-owned">{'✓'}</div>}
                  {selectedIds.has(game.appid) && !game.already_in_library && (
                    <div className="selected-mark">{'✓'}</div>
                  )}
                  <div className="preview-game-info">
                    <span className="preview-game-name">{game.name}</span>
                    {game.playtime_hours > 0 && (
                      <span className="preview-game-hours">{game.playtime_hours + 'h'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}