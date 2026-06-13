import React, { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { Hash, Phone, ArrowRight, Loader2, AlertCircle, Rocket } from 'lucide-react';

export default function OnboardingModal() {
  const { user, completeOnboarding } = useAuth();
  const [apelido, setApelido] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user || !user.needsOnboarding) return null;

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
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0c0a1a] border border-glass-border rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan shadow-lg shadow-primary/30 mb-3">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">Falta pouco, {user.name?.split(' ')[0]}!</h2>
          <p className="text-sm text-gray-400 mt-1.5">
            Escolha seu @ na comunidade e seu WhatsApp pra completar o cadastro.
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
              />
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
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 9 9999-9999"
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600 text-sm"
                required
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-500">Usado para entrar no grupo e receber avisos.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
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
        </form>
      </div>
    </div>
  );
}
