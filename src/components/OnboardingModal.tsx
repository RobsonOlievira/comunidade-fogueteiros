import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { Hash, Phone, ArrowRight, Loader2, AlertCircle, Rocket, ShieldCheck } from 'lucide-react';

export default function OnboardingModal() {
  const { user, completeOnboarding } = useAuth();
  const [apelido, setApelido] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mustShow = !!user && user.needsOnboarding;

  useEffect(() => {
    if (!mustShow) return;

    const blockScroll = () => {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    };
    const releaseScroll = () => {
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (top) {
        const y = parseInt(top.replace('-', '').replace('px', ''), 10) || 0;
        window.scrollTo(0, y);
      }
    };

    blockScroll();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F5' || (e.ctrlKey && ['r', 'R', 'w', 'W'].includes(e.key))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onPop = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('keydown', onKey, { capture: true });
    window.addEventListener('popstate', onPop);

    return () => {
      releaseScroll();
      window.removeEventListener('keydown', onKey, { capture: true } as any);
      window.removeEventListener('popstate', onPop);
    };
  }, [mustShow]);

  if (!mustShow) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = value;
    if (value.length > 2) {
      formatted = `(${value.slice(0, 2)}) `;
      if (value.length > 3) {
        formatted += `${value.slice(2, 3)} `;
        if (value.length > 7) {
          formatted += `${value.slice(3, 7)}-${value.slice(7)}`;
        } else {
          formatted += value.slice(3);
        }
      } else {
        formatted += value.slice(2);
      }
    } else if (value.length > 0) {
      formatted = `(${value}`;
    }
    setPhone(formatted);
  };

  const handleApelidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setApelido(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (apelido.length < 3) {
      setError('Nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Informe um WhatsApp válido com DDD');
      return;
    }

    setSubmitting(true);
    const err = await completeOnboarding(apelido, phone);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }

    // Sucesso: notifica o app que o onboarding foi concluído
    // (usado pra disparar o popup de instalação do PWA)
    try {
      window.localStorage.setItem('cf_onboarding_completed', '1')
    } catch {}
    window.dispatchEvent(new CustomEvent('cf:onboarding-complete', { detail: { apelido, phone } }));
  };

  const canSubmit =
    apelido.length >= 3 &&
    phone.replace(/\D/g, '').length >= 10 &&
    !submitting;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md bg-[#0c0a1a] border-2 border-primary/40 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan shadow-lg shadow-primary/30 mb-3">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 mb-2">
            <ShieldCheck className="w-3 h-3 text-accent-cyan" />
            <span className="text-[10px] font-semibold text-accent-cyan uppercase tracking-wider">Cadastro obrigatório</span>
          </div>
          <h2 id="onboarding-title" className="font-display text-xl font-bold text-white">
            Bem-vindo, {user.name?.split(' ')[0]}!
          </h2>
          <p id="onboarding-desc" className="text-sm text-gray-400 mt-1.5">
            Pra entrar na comunidade, escolha seu <span className="text-white font-medium">@</span> e informe seu <span className="text-white font-medium">WhatsApp</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Como quer ser chamado?
            </label>
            <div className="flex items-center gap-2 bg-glass border border-glass-border rounded-xl px-4 py-3 focus-within:border-accent-lilac transition-colors">
              <Hash className="w-4 h-4 text-gray-500" />
              <span className="text-gray-500">@</span>
              <input
                type="text"
                value={apelido}
                onChange={handleApelidoChange}
                placeholder="seunome"
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600 text-sm"
                maxLength={20}
                required
                autoFocus
                autoComplete="off"
              />
              {apelido.length >= 3 && (
                <span className="text-[10px] text-green-400 font-medium">✓</span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-gray-500">Apenas letras minúsculas, números e _.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              WhatsApp
            </label>
            <div className="flex items-center gap-3 bg-glass border border-glass-border rounded-xl px-4 py-3 focus-within:border-accent-lilac transition-colors">
              <Phone className="w-4 h-4 text-gray-500" />
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 9 9999-9999"
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600 text-sm"
                required
                autoComplete="off"
              />
              {phone.replace(/\D/g, '').length >= 10 && (
                <span className="text-[10px] text-green-400 font-medium">✓</span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-gray-500">Usado pra você entrar no grupo da comunidade.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Entrar na comunidade
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-gray-500 pt-1">
            Estes dados são obrigatórios e não podem ser pulados.
          </p>
        </form>
      </div>
    </div>
  );
}
