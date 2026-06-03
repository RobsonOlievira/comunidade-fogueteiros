import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { TOPIC_TAGS } from '@/src/constants/tags';
import {
  Rocket, Mail, User as UserIcon, Eye, EyeOff, AlertCircle, Phone, Loader2, Check, Hash
} from 'lucide-react';

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    pass: '',
    confirmPass: '',
  });
  const [interests, setInterests] = useState<string[]>([]);

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

    setFormData({ ...formData, phone: formatted });
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData({ ...formData, username: value });
  };

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) return setError('Nome é obrigatório.');
    if (!formData.email.trim()) return setError('E-mail é obrigatório.');
    if (!formData.username.trim()) return setError('Nome de usuário é obrigatório.');
    if (interests.length === 0) return setError('Escolha pelo menos um tema de interesse.');

    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) return setError('WhatsApp inválido. Informe o DDD e o número.');
    }

    if (formData.pass.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    if (formData.pass !== formData.confirmPass) return setError('As senhas não coincidem.');

    const cleanUsername = formData.username.trim().replace(/^@/, '');
    const cleanPhone = formData.phone.replace(/\D/g, '');

    setIsSubmitting(true);
    const err = await signUp({
      email: formData.email,
      password: formData.pass,
      name: formData.name,
      username: cleanUsername,
      phone: cleanPhone,
      interests,
    });

    if (err) {
      if (err.includes('already registered') || err.includes('user_already_exists')) {
        setError('Este e-mail já está cadastrado. Por favor, faça login.');
      } else if (err.includes('apelido') || err.includes('duplicate')) {
        setError('Este nome de usuário já está em uso. Escolha outro.');
      } else {
        setError(err);
      }
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Erro ao entrar com Google');
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background"
        style={{ backgroundImage: 'radial-gradient(at 10% 10%, rgba(138,43,226,0.15) 0px, transparent 40%), radial-gradient(at 90% 90%, rgba(0,229,255,0.1) 0px, transparent 40%)' }}>
        <div className="w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan shadow-lg shadow-primary/30 mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Conta criada!</h1>
          <p className="text-gray-400 mb-6">
            Verifique seu email para confirmar o cadastro e fazer login.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(at 10% 10%, rgba(138,43,226,0.15) 0px, transparent 40%), radial-gradient(at 90% 90%, rgba(0,229,255,0.1) 0px, transparent 40%)' }}>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-glass backdrop-blur-xl rounded-3xl shadow-2xl border border-glass-border overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="p-8 pb-0 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-inner">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2 uppercase tracking-tight">
            Criar Conta
          </h1>
          <p className="text-gray-400 text-sm px-4">
            Preencha seus dados abaixo para iniciar seu cadastro na Comunidade Fogueteiros.
          </p>
        </div>

        <div className="p-8">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-glass-border bg-glass hover:bg-white/10 transition-all text-white font-medium mb-3 disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            {googleLoading ? 'Abrindo Google...' : 'Cadastrar com Google'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-glass-border"></div></div>
            <div className="relative flex justify-center"><span className="px-3 text-xs text-gray-500 bg-[#070314]">ou cadastre-se com email</span></div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">E-mail</label>
                <div className="relative group">
                  <Mail className="h-5 w-5 text-gray-500 absolute left-3 top-3 pointer-events-none group-focus-within:text-primary" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 bg-white/[0.03] border border-glass-border rounded-lg focus:border-primary outline-none text-white transition-all focus:ring-1 focus:ring-primary text-sm placeholder:text-gray-600"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Nome Completo</label>
                <div className="relative group">
                  <UserIcon className="h-5 w-5 text-gray-500 absolute left-3 top-3 pointer-events-none group-focus-within:text-primary" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 bg-white/[0.03] border border-glass-border rounded-lg focus:border-primary outline-none text-white transition-all focus:ring-1 focus:ring-primary text-sm placeholder:text-gray-600"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  WhatsApp <span className="text-gray-600 normal-case">(opcional)</span>
                </label>
                <div className="relative group">
                  <Phone className="h-5 w-5 text-gray-500 absolute left-3 top-3 pointer-events-none group-focus-within:text-primary" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/[0.03] border border-glass-border rounded-lg focus:border-primary outline-none text-white transition-all focus:ring-1 focus:ring-primary text-sm placeholder:text-gray-600"
                    placeholder="(11) 9 9999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Usuário</label>
                <div className="relative group">
                  <span className="absolute left-3 top-3 text-gray-500 font-medium pointer-events-none group-focus-within:text-primary">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={handleUsernameChange}
                    className="block w-full pl-8 pr-3 py-3 bg-white/[0.03] border border-glass-border rounded-lg focus:border-primary outline-none text-white transition-all focus:ring-1 focus:ring-primary text-sm placeholder:text-gray-600"
                    placeholder="seunome"
                    required
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-gray-500 uppercase tracking-widest leading-tight">
                  Apenas letras minúsculas, números e _.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="relative group">
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Senha</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={formData.pass}
                  onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                  className="block w-full px-3 py-3 bg-white/[0.03] border border-glass-border rounded-lg focus:border-primary outline-none text-white transition-all focus:ring-1 focus:ring-primary text-sm placeholder:text-gray-600"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative group">
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Confirmar Senha</label>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={formData.confirmPass}
                  onChange={(e) => setFormData({ ...formData, confirmPass: e.target.value })}
                  className="block w-full px-3 py-3 bg-white/[0.03] border border-glass-border rounded-lg focus:border-primary outline-none text-white transition-all focus:ring-1 focus:ring-primary text-sm placeholder:text-gray-600"
                  placeholder="Repita sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                <Hash className="w-3.5 h-3.5" />
                Seus temas de interesse
                <span className="text-gray-600 normal-case">— escolha pelo menos 1</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_TAGS.map((tag) => {
                  const active = interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-primary/20 text-primary border-primary/40 shadow-sm shadow-primary/20'
                          : 'bg-white/[0.02] text-gray-400 border-glass-border hover:text-white hover:border-white/20'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      {tag}
                    </button>
                  );
                })}
              </div>
              {interests.length > 0 && (
                <p className="mt-2 text-[10px] text-gray-500">
                  {interests.length} tema{interests.length > 1 ? 's' : ''} selecionado{interests.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold font-display tracking-wide shadow-lg transition-all disabled:opacity-50 mt-4 bg-gradient-to-r from-primary to-accent-cyan hover:opacity-90 text-white hover:-translate-y-0.5"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CADASTRAR'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
