import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Copy, ExternalLink, ShoppingCart } from 'lucide-react';

const TESSERACT_URL = 'https://bgpygirvzfjvfathywjb.supabase.co';
const TESSERACT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncHlnaXJ2emZqdmZhdGh5d2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTUzMjYsImV4cCI6MjA4NTIzMTMyNn0.XhISEn_lCjb_ZejanwZDE98lBDDsCI4bwHZr6bdEKCA';
const MP_PUBLIC_KEY = 'APP_USR-76ab7025-3464-4e2b-b5fd-793afa73a6f0';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cursoId: string;
  perfilId: string;
  onSuccess: () => void;
}

export default function CheckoutModal({ isOpen, onClose, cursoId, perfilId, onSuccess }: Props) {
  const [tab, setTab] = useState<'pix' | 'cartao' | 'boleto'>('pix');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'pending'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; copyPaste: string } | null>(null);
  const [produto, setProduto] = useState<{ preco: number; installments: number; nome: string; success_url: string } | null>(null);
  const [cpf, setCpf] = useState('');
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '',
    numeroCartao: '', nomeCartao: '', validade: '', cvv: '', installment: '1',
  });

  useEffect(() => {
    if (!isOpen) return;
    setStatus('idle');
    setErrorMsg('');
    setPixData(null);
    setCpf('');
    setFormData({ nome: '', email: '', telefone: '', numeroCartao: '', nomeCartao: '', validade: '', cvv: '', installment: '1' });

    fetch(`${TESSERACT_URL}/rest/v1/produtos?id=eq.${cursoId}&select=preco,installments,nome,success_url`, {
      headers: { apikey: TESSERACT_KEY, Authorization: `Bearer ${TESSERACT_KEY}` },
    })
      .then(r => r.json())
      .then(data => { if (data?.[0]) setProduto(data[0]); });
  }, [isOpen, cursoId]);

  const valor = produto?.preco || 0;

  const processPayment = async (method: string) => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      setErrorMsg('Preencha nome e email.');
      return;
    }
    if ((method === 'pix' || method === 'boleto') && !formData.telefone.trim()) {
      setErrorMsg('Informe o WhatsApp.');
      return;
    }
    if ((method === 'pix' || method === 'boleto' || method === 'credit_card') && (!cpf.trim() || cpf.replace(/\D/g, '').length < 11)) {
      setErrorMsg('Informe um CPF valido.');
      return;
    }
    if (method === 'credit_card' && (!formData.numeroCartao || !formData.nomeCartao || !formData.validade || !formData.cvv)) {
      setErrorMsg('Preencha todos os dados do cartao.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      let paymentMethodId = method;
      let extra: any = {};

      if (method === 'credit_card') {
        const rawValidade = formData.validade.replace(/\D/g, '');
        const expMonth = rawValidade.slice(0, 2) || '12';
        let expYear = rawValidade.slice(2, 6);
        if (expYear.length === 2) expYear = '20' + expYear;

        const tokenRes = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_number: formData.numeroCartao.replace(/\D/g, ''),
            cardholder: { name: formData.nomeCartao },
            expiration_month: parseInt(expMonth) || 12,
            expiration_year: expYear || '27',
            security_code: formData.cvv,
          }),
        });
        const cardToken = await tokenRes.json();
        if (!cardToken?.id) {
          setStatus('error');
          setErrorMsg(cardToken?.message || 'Dados do cartao invalidos.');
          return;
        }
        paymentMethodId = cardToken.payment_method_id;
        extra = { token: cardToken.id, installments: parseInt(formData.installment) || 1 };
        if (cardToken.issuer_id) extra.issuer_id = String(cardToken.issuer_id);
      }

      if (method === 'boleto') {
        paymentMethodId = 'bolbradesco';
        const nameParts = formData.nome.trim().split(' ');
        extra = {
          payer: {
            first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || nameParts[0] || '',
            phone: { area_code: formData.telefone.replace(/\D/g, '').slice(0, 2), number: formData.telefone.replace(/\D/g, '').slice(2) },
            identification: { type: 'CPF', number: cpf.replace(/\D/g, '') },
            address: { zip_code: '01001000', street_name: 'Rua Example', street_number: 'S/N', neighborhood: 'Centro', city: 'Sao Paulo', federal_unit: 'SP' },
          },
        };
      }

      const payload: any = {
        transaction_amount: valor,
        payment_method_id: paymentMethodId,
        payer: { email: formData.email, first_name: formData.nome },
        external_reference: perfilId,
        statement_descriptor: 'CURSO DIGITAL',
        notification_url: `${TESSERACT_URL}/functions/v1/mp-processar-pagamento`,
        curso_id: cursoId,
        ...extra,
      };

      if (method === 'pix' || method === 'boleto') {
        payload.payer.identification = { type: 'CPF', number: cpf.replace(/\D/g, '') };
      }

      const res = await fetch(`${TESSERACT_URL}/functions/v1/mp-processar-pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: TESSERACT_KEY, Authorization: `Bearer ${TESSERACT_KEY}` },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.status === 'approved') {
        setStatus('success');
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      } else if (result.status === 'pending') {
        if (result.payment_method_id === 'pix' && result.point_of_interaction?.transaction_data) {
          setPixData({
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
            copyPaste: result.point_of_interaction.transaction_data.qr_code,
          });
          setStatus('pending');
        } else if (result.ticket_url || result.transaction_details?.external_resource_url) {
          setPixData({
            qrCodeBase64: '',
            copyPaste: result.ticket_url || result.transaction_details?.external_resource_url || '',
          });
          setStatus('pending');
        }
      } else {
        setStatus('error');
        setErrorMsg(result.status_detail ? `Pagamento recusado: ${result.status_detail}` : 'Pagamento recusado. Tente novamente.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Erro ao processar pagamento. Verifique sua conexao.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); alert('Copiado!'); }
    catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('Copiado!'); }
  };

  if (!isOpen) return null;

  const cpfMask = (v: string) => {
    let val = v.replace(/\D/g, '').slice(0, 11);
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d{2})$/, '$1-$2');
    return val;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-white px-4 py-2 flex items-center justify-center gap-2 border-b border-gray-100">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0a0080" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span className="text-[10px] font-bold text-[#0a0080] uppercase tracking-widest">Pagamento 100% seguro via Mercado Pago</span>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Pagamento seguro</p>
            <p className="text-[#0a0080] font-bold text-xl">R$ {valor.toFixed(2).replace('.', ',')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-gray-200">
          {(['pix', 'cartao', 'boleto'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition ${tab === t ? 'text-[#07b848] border-b-2 border-[#07b848] bg-green-50/30' : 'text-gray-400 hover:text-gray-600'}`}
            >{t === 'pix' ? 'PIX' : t === 'cartao' ? 'Cartao' : 'Boleto'}</button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {status === 'loading' && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#07b848]" />
              <p className="text-gray-500">Processando pagamento...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h3 className="text-gray-900 font-bold text-xl">Pagamento aprovado!</h3>
              <p className="text-gray-500">Seu acesso foi liberado.</p>
            </div>
          )}

          {status === 'idle' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Nome Completo *</label>
                <input type="text" value={formData.nome} onChange={e => setFormData(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Seu nome completo"
                  className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">E-mail *</label>
                <input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  placeholder="seu@email.com"
                  className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
              </div>

              {(tab === 'pix' || tab === 'boleto') && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">WhatsApp com DDD *</label>
                  <input type="tel" value={formData.telefone} onChange={e => setFormData(f => ({ ...f, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
                </div>
              )}

              {tab === 'cartao' && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">WhatsApp com DDD *</label>
                  <input type="tel" value={formData.telefone} onChange={e => setFormData(f => ({ ...f, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
                </div>
              )}

              {tab !== 'pix' && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">CPF{tab === 'cartao' ? ' do Titular' : ''} *</label>
                  <input type="text" value={cpf} onChange={e => setCpf(cpfMask(e.target.value))}
                    placeholder="000.000.000-00" maxLength={14}
                    className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
                </div>
              )}

              {tab === 'pix' && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">CPF <span className="text-gray-400 normal-case font-normal">(opcional)</span></label>
                  <input type="text" value={cpf} onChange={e => setCpf(cpfMask(e.target.value))}
                    placeholder="000.000.000-00" maxLength={14}
                    className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
                </div>
              )}

              {tab === 'cartao' && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Numero do Cartao</label>
                    <input type="text" value={formData.numeroCartao}
                      onChange={e => { let val = e.target.value.replace(/\D/g, '').slice(0, 16); val = val.replace(/(\d{4})(?=\d)/g, '$1 '); setFormData(f => ({ ...f, numeroCartao: val })); }}
                      placeholder="0000 0000 0000 0000" maxLength={19}
                      className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Nome no Cartao</label>
                    <input type="text" value={formData.nomeCartao} onChange={e => setFormData(f => ({ ...f, nomeCartao: e.target.value }))}
                      placeholder="Nome como esta no cartao"
                      className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Validade</label>
                      <input type="text" value={formData.validade}
                        onChange={e => { let val = e.target.value.replace(/\D/g, '').slice(0, 6); if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2); setFormData(f => ({ ...f, validade: val })); }}
                        placeholder="MM/AAAA" maxLength={7}
                        className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">CVV</label>
                      <input type="text" value={formData.cvv} onChange={e => setFormData(f => ({ ...f, cvv: e.target.value }))}
                        placeholder="000"
                        className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Parcelas</label>
                    <select value={formData.installment} onChange={e => setFormData(f => ({ ...f, installment: e.target.value }))}
                      className="w-full bg-white border border-gray-300 text-gray-800 text-base p-3 rounded-lg focus:ring-2 focus:ring-[#07b848] focus:border-[#07b848] outline-none transition">
                      {Array.from({ length: produto?.installments || 3 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}x de R$ {(valor / n).toFixed(2).replace('.', ',')} {n > 1 ? `(total R$ ${valor.toFixed(2).replace('.', ',')})` : '(sem juros)'}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {tab === 'boleto' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">O boleto sera gerado apos a confirmacao. Voce recebera por e-mail.</p>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</p>
                </div>
              )}

              <button onClick={() => processPayment(tab === 'cartao' ? 'credit_card' : tab)}
                className="w-full py-3 bg-[#07b848] hover:bg-[#06a03d] text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wider">
                {tab === 'pix' ? 'Pagar com PIX' : tab === 'cartao' ? 'Pagar com Cartao' : 'Gerar Boleto'}
              </button>
            </div>
          )}

          {status === 'pending' && pixData && (
            <div className="flex flex-col items-center py-6 gap-5 text-center">
              <CheckCircle className="w-16 h-16 text-[#07b848]" />
              <h3 className="text-gray-900 font-bold text-xl">
                {pixData.qrCodeBase64 ? 'Escaneie o QR Code' : 'Boleto gerado com sucesso'}
              </h3>
              <p className="text-gray-500">O acesso e liberado apos a confirmacao do pagamento.</p>

              {pixData.qrCodeBase64 && (
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" className="w-48 h-48" />
                </div>
              )}

              {pixData.copyPaste && pixData.qrCodeBase64 && (
                <div className="w-full max-w-sm space-y-2">
                  <p className="text-gray-500 text-xs uppercase tracking-widest font-bold text-left px-1">Codigo Copia e Cola</p>
                  <div className="relative flex items-center">
                    <textarea readOnly value={pixData.copyPaste} className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs p-3 rounded-xl pr-24 h-24 resize-none" />
                    <button onClick={() => copyToClipboard(pixData.copyPaste)}
                      className="absolute right-1 px-3 py-2 bg-[#07b848] text-white text-xs font-bold rounded-lg hover:bg-[#06a03d] transition-colors">COPIAR</button>
                  </div>
                </div>
              )}

              {pixData.copyPaste && !pixData.qrCodeBase64 && (
                <div className="w-full">
                  <a href={pixData.copyPaste} target="_blank" rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-[#07b848] text-white font-bold rounded-lg hover:bg-[#06a03d] transition text-center">
                    VISUALIZAR BOLETO <ExternalLink className="inline w-4 h-4 ml-1" />
                  </a>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">Erro no pagamento</p>
              <p className="text-gray-500 text-sm mb-4">{errorMsg}</p>
              <button onClick={() => setStatus('idle')}
                className="px-6 py-2.5 bg-[#07b848] text-white font-bold rounded-lg hover:bg-[#06a03d] transition-colors text-sm">
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
