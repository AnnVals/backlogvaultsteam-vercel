import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/library');
    } catch (err: any) {
      setError(err?.response?.data?.error || t('auth.invalid_credentials'));
    }
  };

  const getInputType = () => {
    if (showPass) {
      return 'text';
    } else {
      return 'password';
    }
  };

  const getEyeIcon = () => {
    if (showPass) {
      return <EyeOff size={16} />;
    } else {
      return <Eye size={16} />;
    }
  };

  const getSubmitLabel = () => {
    if (isLoading) {
      return t('auth.logging');
    } else {
      return t('auth.login');
    }
  };

  const renderError = () => {
    if (error) {
      return <div className="auth-error">{error}</div>;
    } else {
      return null;
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={toggleLanguage}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            {i18n.language === 'es' ? 'ES' : 'EN'}
          </button>
        </div>

        <div className="auth-logo">
          <Gamepad2 size={28} />
          <span>{'Backlog'}<strong>{'Vault'}</strong></span>
        </div>
        <h1 className="auth-title">{t('auth.welcome')}</h1>
        <p className="auth-sub">{t('auth.signin')}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>{t('auth.username')}</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder={t('auth.placeholder_username')}
            />
          </div>
          <div className="auth-field">
            <label>{t('auth.password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={getInputType()}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={t('auth.placeholder_password')}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {getEyeIcon()}
              </button>
            </div>
          </div>
          {renderError()}
          <button type="submit" className="auth-submit" disabled={isLoading}>
            {getSubmitLabel()}
          </button>
        </form>
        <p className="auth-footer">
          {t('auth.no_account') + ' '}<Link to="/register">{t('auth.create_here')}</Link>
        </p>
      </div>
    </div>
  );
}