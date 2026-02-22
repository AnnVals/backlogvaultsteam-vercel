import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const passwordsMatch = form.confirmPassword === '' || form.password === form.confirmPassword;
  const confirmDirty = form.confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(form.email)) {
      setError(t('auth.invalid_email'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('auth.passwords_no_match'));
      return;
    }
    try {
      await register(form.username, form.email, form.password);
      navigate('/library');
    } catch (err: any) {
      setError(err?.response?.data?.error || t('auth.register_error'));
    }
  };

  const getSubmitLabel = () => {
    if (isLoading) {
      return t('auth.creating');
    } else {
      return t('auth.create_account');
    }
  };

  const isSubmitDisabled = () => {
    return isLoading || (confirmDirty && !passwordsMatch);
  };

  const renderError = () => {
    if (error) {
      return <div className="auth-error">{error}</div>;
    } else {
      return null;
    }
  };

  const getEmailBorderColor = () => {
    if (form.email && !isValidEmail(form.email)) {
      return 'var(--red)';
    } else {
      return undefined;
    }
  };

  const getConfirmBorderColor = () => {
    if (confirmDirty && !passwordsMatch) {
      return 'var(--red)';
    } else if (confirmDirty && passwordsMatch) {
      return 'var(--green)';
    } else {
      return undefined;
    }
  };

  const renderEmailHint = () => {
    if (form.email && !isValidEmail(form.email)) {
      return <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{t('auth.invalid_email')}</span>;
    } else {
      return null;
    }
  };

  const renderConfirmHint = () => {
    if (confirmDirty && !passwordsMatch) {
      return (
        <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>
          {t('auth.passwords_no_match')}
        </span>
      );
    } else if (confirmDirty && passwordsMatch) {
      return (
        <span style={{ fontSize: '0.75rem', color: 'var(--green)' }}>
          {t('auth.passwords_match')}
        </span>
      );
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
        <h1 className="auth-title">{t('auth.create_account')}</h1>
        <p className="auth-sub">{t('auth.start_tracking')}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>{t('auth.username')}</label>
            <input
              type="text"
              value={form.username}
              onChange={set('username')}
              required
              minLength={3}
              placeholder={t('auth.placeholder_username')}
            />
          </div>
          <div className="auth-field">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder={t('auth.placeholder_email')}
              style={{ borderColor: getEmailBorderColor() }}
            />
            {renderEmailHint()}
          </div>
          <div className="auth-field">
            <label>{t('auth.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              placeholder={t('auth.placeholder_password')}
            />
          </div>
          <div className="auth-field">
            <label>{t('auth.confirm_password')}</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              required
              minLength={6}
              placeholder={t('auth.placeholder_confirm_password')}
              style={{ borderColor: getConfirmBorderColor() }}
            />
            {renderConfirmHint()}
          </div>
          {renderError()}
          <button type="submit" className="auth-submit" disabled={isSubmitDisabled()}>
            {getSubmitLabel()}
          </button>
        </form>
        <p className="auth-footer">
          {t('auth.already_account') + ' '}<Link to="/login">{t('auth.login_link')}</Link>
        </p>
      </div>
    </div>
  );
}