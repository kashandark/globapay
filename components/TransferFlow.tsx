
import React, { useState } from 'react';
import { 
  SUPPORTED_CURRENCIES, 
  MOCK_RATES, 
  PKR_PROVIDERS, 
  PAK_BANKS, 
  ONELINK_CLIENT_ID, 
  ONELINK_CLIENT_SECRET, 
  ONELINK_BASE_URL
} from '../constants';
import { 
  RecipientDetails, 
  AIInsight, 
  Transfer, 
  PayoutMethodType 
} from '../types';
import { getMarketInsights } from '../services/geminiService';

interface TransferFlowProps {
  onComplete: (transfer: Transfer) => void;
}

const TransferFlow: React.FC<TransferFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState<number>(100);
  const [sourceCurr, setSourceCurr] = useState('USD');
  const [targetCurr, setTargetCurr] = useState('PKR');
  const [liveRate, setLiveRate] = useState<number>(MOCK_RATES['USD-PKR'] || 278.45);
  
  // 1LINK State
  const [isVerifying1Link, setIsVerifying1Link] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [lastGatewayResponse, setLastGatewayResponse] = useState<any>(null);
  const [lastGatewayRequest, setLastGatewayRequest] = useState<any>(null);
  
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethodType>('EASYPAISA');
  const [recipient, setRecipient] = useState<RecipientDetails>({
    name: '',
    iban: '',
    mobile: '',
    currency: 'PKR',
    method: 'EASYPAISA',
    bankId: '',
    isVerified: false
  });
  
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');

  // Helper to generate 1LINK standard date format: YYYYMMDDHHMMSS
  const get1LinkTimestamp = () => {
    const d = new Date();
    return d.toISOString().replace(/[-:T]/g, '').split('.')[0];
  };

  /**
   * REAL 1LINK TITLE FETCH
   * Strictly calls the 1LINK Gateway API to resolve account titles.
   */
  const fetch1LinkTitle = async () => {
    const accountId = selectedMethod === 'BANK' ? recipient.iban : recipient.mobile;
    if (!accountId) {
      setVerificationError("Account identifier is required for resolution.");
      return;
    }
    
    setVerificationError(null);
    setIsVerifying1Link(true);
    setLastGatewayResponse(null);
    
    const cleanAccountId = accountId.replace(/\D/g, '');
    const targetBankCode = selectedMethod === 'BANK' 
      ? PAK_BANKS.find(b => b.id === recipient.bankId)?.code 
      : (selectedMethod === 'EASYPAISA' ? '037' : '038');
    
    // 1LINK standard payload for Title Fetch
    const payload = {
      accountNumber: cleanAccountId,
      bankCode: targetBankCode,
      stan: Math.floor(100000 + Math.random() * 899999).toString(),
      transmissionDateTime: get1LinkTimestamp(),
      transactionType: 'TITLE_FETCH'
    };

    setLastGatewayRequest(payload);

    try {
      const response = await fetch(`${ONELINK_BASE_URL}/title-fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-IBM-Client-Id': ONELINK_CLIENT_ID,
          'X-IBM-Client-Secret': ONELINK_CLIENT_SECRET,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setLastGatewayResponse(data);

      if (!response.ok) {
        throw new Error(data.message || `Gateway returned HTTP ${response.status}`);
      }

      // Check for success code '00' (standard for 1LINK/ISO8583 switches)
      if (data.responseCode === "00") {
        const title = data.accountTitle || data.account_title || data.beneficiaryName || data.title;
        if (title) {
          setRecipient(prev => ({ ...prev, name: title, isVerified: true }));
        } else {
          setVerificationError("1LINK: Account resolved, but no account title was returned in the response.");
        }
      } else {
        const errorDesc = data.responseDescription || data.message || "Invalid account details or unsupported bank code.";
        setVerificationError(`1LINK Rejection (${data.responseCode}): ${errorDesc}`);
      }
    } catch (err: any) {
      console.error("[1LINK API ERROR]", err);
      // Reporting real gateway error, avoiding any "Bridge" or "Demo" fallback mentions.
      setVerificationError(`Gateway Connectivity Error: ${err.message}. If this persists, verify CORS headers or network reachability of the 1LINK Gateway.`);
    } finally {
      setIsVerifying1Link(false);
    }
  };

  /**
   * REAL 1LINK FUNDS TRANSFER
   */
  const execute1LinkTransfer = async () => {
    setIsProcessing(true);
    setVerificationError(null);
    
    try {
      setProcessStatus('Transmitting to 1LINK Switch...');
      const stan = Math.floor(100000 + Math.random() * 899999).toString();
      const rrn = `1L${Date.now().toString().slice(-10)}`;
      const cleanAccountId = (selectedMethod === 'BANK' ? recipient.iban : recipient.mobile)?.replace(/\D/g, '');
      const targetBankCode = selectedMethod === 'BANK' 
        ? PAK_BANKS.find(b => b.id === recipient.bankId)?.code 
        : (selectedMethod === 'EASYPAISA' ? '037' : '038');

      const payload = {
        amount: (amount * liveRate).toFixed(0),
        beneficiaryAccountNumber: cleanAccountId,
        beneficiaryBankCode: targetBankCode,
        stan: stan,
        rrn: rrn,
        transmissionDateTime: get1LinkTimestamp()
      };

      setLastGatewayRequest(payload);

      const response = await fetch(`${ONELINK_BASE_URL}/funds-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-IBM-Client-Id': ONELINK_CLIENT_ID,
          'X-IBM-Client-Secret': ONELINK_CLIENT_SECRET,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      setLastGatewayResponse(data);

      if (!response.ok) {
        throw new Error(data.message || "Disbursement failed at the gateway level.");
      }

      setProcessStatus('Disbursement finalized.');
      await new Promise(r => setTimeout(r, 1500));

      onComplete({
        id: `IBFT-${rrn}`,
        amount: amount,
        sourceCurrency: sourceCurr,
        targetCurrency: targetCurr,
        recipientName: recipient.name,
        status: 'COMPLETED',
        date: new Date().toISOString(),
        estimatedArrival: 'Instant',
        payoutMethod: selectedMethod,
        orchestrator: '1LINK_IBFT',
        referenceNumber: rrn,
        stan: stan
      });
    } catch (error: any) {
      setVerificationError(`Transfer Failure: ${error.message}`);
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  const startOrchestration = async () => {
    setIsProcessing(true);
    setStep(3);
    const aiData = await getMarketInsights(sourceCurr, targetCurr, amount, selectedMethod);
    setInsight(aiData);
    setIsProcessing(false);
  };

  // UI Helpers for Provider Selection
  const getProviderColors = (id: PayoutMethodType, isSelected: boolean) => {
    switch (id) {
      case 'BANK':
        return isSelected ? 'border-slate-800 bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-300';
      case 'JAZZCASH':
        return isSelected ? 'border-red-600 bg-red-50' : 'border-slate-100 bg-white hover:border-red-200';
      case 'EASYPAISA':
        return isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200';
      default:
        return 'border-slate-100 bg-white';
    }
  };

  const getProviderIconColors = (id: PayoutMethodType, isSelected: boolean) => {
    switch (id) {
      case 'BANK': return isSelected ? 'text-slate-900' : 'text-slate-400';
      case 'JAZZCASH': return isSelected ? 'text-red-600' : 'text-red-400';
      case 'EASYPAISA': return isSelected ? 'text-emerald-600' : 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
      <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
             <i className="fa-solid fa-bolt text-sm"></i>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">1LINK IBFT Gateway</p>
            <p className="text-xs font-bold">Native API Direct Access</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase">Rate</p>
          <p className="text-sm font-black">{liveRate.toFixed(2)} PKR</p>
        </div>
      </div>

      <div className="p-10">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-slate-900 leading-tight text-center">Select Payout <br/><span className="text-blue-600">Provider.</span></h2>
            
            <div className="space-y-6">
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Send Amount (USD)</label>
                <div className="flex items-center border-2 border-slate-100 rounded-3xl group-focus-within:border-blue-500 transition-all p-5 bg-white shadow-sm">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="flex-1 bg-transparent text-3xl font-bold outline-none text-slate-900"
                  />
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 font-bold text-slate-700">🇺🇸 USD</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Payout Method</label>
                <div className="grid grid-cols-3 gap-4">
                  {PKR_PROVIDERS.map((p) => {
                    const isSelected = selectedMethod === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedMethod(p.id);
                          setRecipient(prev => ({ ...prev, isVerified: false, name: '', bankId: '' }));
                          setVerificationError(null);
                        }}
                        className={`group relative flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 shadow-sm ${getProviderColors(p.id, isSelected)}`}
                      >
                        <div className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${isSelected ? 'bg-white shadow-md scale-110' : 'bg-slate-50'}`}>
                           <i className={`fa-solid ${p.icon} text-2xl ${getProviderIconColors(p.id, isSelected)}`}></i>
                        </div>
                        <div className="text-center">
                          <span className={`text-[11px] font-black uppercase tracking-tight block ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                            {p.name}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 block">
                            {p.id === 'EASYPAISA' ? 'Telenor' : p.id === 'JAZZCASH' ? 'Jazz' : '1LINK'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95">
              Configure Recipient
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Title Resolution</h2>
              <p className="text-slate-500 text-sm">Direct lookup via 1LINK switch.</p>
            </div>

            <div className="space-y-5">
              {selectedMethod === 'BANK' ? (
                <>
                  <select 
                    value={recipient.bankId}
                    onChange={(e) => setRecipient({...recipient, bankId: e.target.value, isVerified: false, name: ''})}
                    className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                  >
                    <option value="">Select Local Bank...</option>
                    {PAK_BANKS.map(bank => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
                  </select>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Account Number / IBAN"
                      value={recipient.iban}
                      onChange={(e) => setRecipient({...recipient, iban: e.target.value, isVerified: false, name: ''})}
                      className="w-full border-2 border-slate-100 rounded-2xl p-4 pr-32 focus:border-blue-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                    />
                    <button onClick={fetch1LinkTitle} className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white text-[10px] px-4 rounded-xl font-black hover:bg-blue-700 transition-colors">
                      {isVerifying1Link ? <i className="fa-solid fa-spinner fa-spin"></i> : 'FETCH TITLE'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="bg-slate-100 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-600 shrink-0">+92</div>
                    <input 
                      type="text"
                      placeholder="e.g. 3335181241"
                      value={recipient.mobile}
                      onChange={(e) => setRecipient({...recipient, mobile: e.target.value, isVerified: false, name: ''})}
                      className="flex-1 border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                    />
                    <button onClick={fetch1LinkTitle} disabled={!recipient.mobile || isVerifying1Link} className="absolute right-2 top-2 bottom-2 bg-emerald-600 text-white text-[10px] px-4 rounded-xl font-black hover:bg-emerald-700">
                      {isVerifying1Link ? <i className="fa-solid fa-spinner fa-spin"></i> : 'RESOLVE TITLE'}
                    </button>
                  </div>
                </div>
              )}

              {verificationError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                  <i className="fa-solid fa-circle-xmark text-red-500 mt-1"></i>
                  <div className="space-y-1">
                    <p className="text-red-700 text-[10px] font-black uppercase tracking-widest">Gateway Response Message</p>
                    <p className="text-red-600 text-[10px] font-medium leading-relaxed">{verificationError}</p>
                  </div>
                </div>
              )}

              <div className="relative">
                <input 
                  type="text"
                  placeholder={isVerifying1Link ? "Querying Switch..." : "Resolved Account Title"}
                  value={recipient.name}
                  readOnly={true}
                  className={`w-full border-2 rounded-2xl p-4 outline-none font-black text-slate-800 transition-all ${
                    recipient.isVerified 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                />
                {recipient.isVerified && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase">
                     <i className="fa-solid fa-circle-check text-xs"></i>
                     Verified Title
                  </div>
                )}
              </div>

              {lastGatewayResponse && (
                <div className="mt-4 p-4 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">1LINK Gateway Logs</p>
                   <pre className="text-[9px] text-blue-400 font-mono whitespace-pre-wrap opacity-80">
                     {JSON.stringify(lastGatewayResponse, null, 2)}
                   </pre>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-5 rounded-2xl">Back</button>
              <button onClick={startOrchestration} disabled={!recipient.isVerified} className="flex-[2] bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]">
                Final Review
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            {isProcessing ? (
              <div className="py-20 text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                   <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-building-columns text-blue-600 text-2xl"></i>
                   </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{processStatus}</h3>
                  <p className="text-xs text-slate-500 font-medium">Network: 1LINK Sandbox</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">IBFT Summary</h2>
                    <p className="text-slate-500 text-sm">Real-time local switch authorized.</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                     Instant Payout
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 relative overflow-hidden shadow-2xl">
                   <div className="flex justify-between items-center pb-6 border-b border-white/10 relative z-10">
                      <div>
                         <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Payout Amount</p>
                         <p className="text-3xl font-black">{(amount * liveRate).toLocaleString()} PKR</p>
                         <p className="text-[10px] font-bold text-slate-500">Exch. {liveRate.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Network</p>
                         <p className="text-xl font-black">1LINK</p>
                      </div>
                   </div>

                   <div className="space-y-4 relative z-10">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-widest">Title</span>
                        <span className="font-black text-white">{recipient.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-widest">Method</span>
                        <span className="font-black text-white uppercase">{selectedMethod}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-widest">Account</span>
                        <span className="font-black text-white">{selectedMethod === 'BANK' ? recipient.iban : recipient.mobile}</span>
                      </div>
                   </div>
                </div>

                {insight && (
                  <div className="bg-blue-50 border-2 border-blue-100 p-5 rounded-3xl">
                     <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-wand-magic-sparkles text-blue-600 text-sm"></i>
                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">AI Market Pulse</p>
                     </div>
                     <p className="text-xs text-blue-900 font-bold leading-relaxed">{insight.advice}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-5 rounded-2xl">Back</button>
                  <button onClick={execute1LinkTransfer} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-95">
                    Send {amount} {sourceCurr}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferFlow;
