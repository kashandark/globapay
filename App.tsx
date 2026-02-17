
import React, { useState } from 'react';
import TransferFlow from './components/TransferFlow';
import SupportChat from './components/SupportChat';
import { Transfer } from './types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ONELINK_CLIENT_ID } from './constants';

const MOCK_CHART_DATA = [
  { name: 'Mon', rate: 277.2 },
  { name: 'Tue', rate: 278.5 },
  { name: 'Wed', rate: 278.1 },
  { name: 'Thu', rate: 279.4 },
  { name: 'Fri', rate: 278.8 },
  { name: 'Sat', rate: 278.4 },
  { name: 'Sun', rate: 278.6 },
];

const App: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [showFlow, setShowFlow] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [lastTransfer, setLastTransfer] = useState<Transfer | null>(null);
  const [isSyncingId, setIsSyncingId] = useState<string | null>(null);

  const handleTransferComplete = (newTransfer: Transfer) => {
    setTransfers([newTransfer, ...transfers]);
    setLastTransfer(newTransfer);
    setShowFlow(false);
    setActiveTab('history');
  };

  const updateTransferStatus = async (id: string) => {
    setIsSyncingId(id);
    console.log(`[1LINK] Querying IBFT Status for ${id} using ${ONELINK_CLIENT_ID}`);
    await new Promise(r => setTimeout(r, 2000));
    setTransfers(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'COMPLETED' } : t
    ));
    setIsSyncingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      <SupportChat />
      
      <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => {setShowFlow(false); setActiveTab('dashboard'); setLastTransfer(null);}}
          >
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-bolt text-white text-lg"></i>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">GlobaPay</span>
          </div>

          <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <button 
              onClick={() => {setActiveTab('dashboard'); setLastTransfer(null);}}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Gateway
            </button>
            <button 
              onClick={() => {setActiveTab('history'); setLastTransfer(null);}}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              History
            </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 pl-2">
                <div className="hidden sm:block text-right">
                    <p className="text-xs font-black text-slate-900">Alex Thompson</p>
                    <p className="text-[10px] font-bold text-blue-600">Enterprise Access</p>
                </div>
                <img src="https://picsum.photos/seed/globa/100/100" className="w-10 h-10 rounded-2xl border-2 border-white shadow-md" alt="Avatar" />
             </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {showFlow ? (
          <div className="py-4 animate-in slide-in-from-bottom-8 duration-500">
            <div className="mb-8 max-w-2xl mx-auto">
              <button 
                onClick={() => setShowFlow(false)}
                className="group flex items-center gap-3 text-slate-500 font-bold hover:text-slate-900 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50">
                  <i className="fa-solid fa-arrow-left text-xs"></i>
                </div>
                Back to Dashboard
              </button>
            </div>
            <TransferFlow onComplete={handleTransferComplete} />
          </div>
        ) : (
          <div className="space-y-10">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  <div className="lg:col-span-8 space-y-10">
                    <div className="space-y-4">
                      <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                        1LINK IBFT <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-slate-900">Direct Switch.</span>
                      </h1>
                      <p className="text-slate-500 text-xl font-medium max-w-xl">
                        Real-time Pakistani disbursements with zero intermediary delays.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Switch Liquidity</p>
                        <h3 className="text-4xl font-black text-slate-900 mb-8">$12,890.00</h3>
                        <div className="flex gap-2">
                           <button className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl text-xs hover:bg-black transition-all">Manage Switch</button>
                        </div>
                      </div>

                      <div className="bg-blue-600 rounded-[2rem] p-8 text-white border border-blue-500 shadow-2xl relative group">
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">IBFT Uptime</p>
                        <div className="flex items-center gap-3 mb-8">
                           <h3 className="text-4xl font-black text-white">99.9%</h3>
                           <span className="text-[10px] font-black bg-white/20 text-white px-2 py-1 rounded-lg">LIVE</span>
                        </div>
                        <p className="text-[10px] text-blue-100 leading-relaxed font-medium">
                          1LINK Handshake ID: {ONELINK_CLIENT_ID.substring(0,10)}...
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h4 className="font-black text-slate-900 text-lg">USD/PKR Market Pulse</h4>
                          <p className="text-xs text-slate-400 font-bold">1LINK Mid-Market Performance</p>
                        </div>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={MOCK_CHART_DATA}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={['auto', 'auto']} hide />
                            <Tooltip cursor={{ stroke: '#2563eb' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                            <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={4} dot={{ r: 0 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                      <h3 className="text-3xl font-black mb-2">Disburse.</h3>
                      <p className="text-slate-400 text-sm mb-10 font-medium">Verified real-time IBFT switch using native 1LINK protocols.</p>
                      <button 
                        onClick={() => setShowFlow(true)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-2xl shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-4 animate-float"
                      >
                        New IBFT Transfer
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                           <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <i className="fa-solid fa-shield-check"></i>
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Title Matching</p>
                              <p className="text-xs font-bold text-slate-800">1LINK Account Resolution</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                              <i className="fa-solid fa-wallet"></i>
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Flash Payouts</p>
                              <p className="text-xs font-bold text-slate-800">JazzCash / Easypaisa Direct</p>
                           </div>
                        </div>
                    </div>
                  </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {lastTransfer && (
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                        <i className="fa-solid fa-circle-check text-emerald-400 text-2xl"></i>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">IBFT Successful</h2>
                        <p className="text-slate-400 font-medium">RRN: {lastTransfer.referenceNumber} • STAN: {lastTransfer.stan}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setLastTransfer(null)} className="bg-white/5 hover:bg-white/10 text-white font-black px-6 py-3 rounded-xl backdrop-blur-sm transition-all">Dismiss</button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center px-4">
                   <h2 className="text-3xl font-black text-slate-900">IBFT Logs</h2>
                </div>

                {transfers.length === 0 ? (
                  <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100">
                    <i className="fa-solid fa-receipt text-slate-200 text-6xl mb-6"></i>
                    <h3 className="text-slate-800 font-black text-2xl">No transactions found</h3>
                    <p className="text-slate-400 font-medium">Your 1LINK IBFT history will appear here.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout (PKR)</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">1LINK Status</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">RRN / STAN</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transfers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">{t.recipientName.charAt(0)}</div>
                                <div>
                                  <p className="font-black text-slate-900">{t.recipientName}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t.payoutMethod}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                               <p className="font-black text-slate-900">{(t.amount * 278.45).toLocaleString()} PKR</p>
                               <p className="text-[10px] text-slate-400 font-bold">From {t.amount} USD</p>
                            </td>
                            <td className="px-10 py-8">
                               <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600">
                                  <i className="fa-solid fa-check-circle"></i>
                                  Disbursed
                               </span>
                            </td>
                            <td className="px-10 py-8">
                               <p className="text-[10px] font-black text-slate-900">{t.referenceNumber}</p>
                               <p className="text-[10px] text-slate-400 font-bold">STAN: {t.stan}</p>
                            </td>
                            <td className="px-10 py-8 text-right">
                               <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                                  <i className="fa-solid fa-file-invoice-dollar text-xs"></i>
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white py-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch: 1LINK Pakistan • Client: {ONELINK_CLIENT_ID.substring(0,8)}... • Secure IBFT Handshake Verified</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
