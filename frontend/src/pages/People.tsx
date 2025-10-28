import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useStore } from '../store/store';
import { Search, X as XIcon, ShieldAlert, ShieldCheck, ArrowUpRight, ArrowDownRight, CheckCircle2, Send } from 'lucide-react';

export default function People() {
  const { currentUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [amount, setAmount] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [iOweThem, setIOweThem] = useState(false);
  
  const [expandedDebtUserId, setExpandedDebtUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const debtsRes = await axios.get(`/api/users/${currentUser?.id}/direct-debts`);
      setDebts(debtsRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return setSearchResults([]);
    try {
      const res = await axios.get(`/api/users/search?q=${searchQuery}&currentUserId=${currentUser?.id}`);
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDirectExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUser) return;
    
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    try {
      await axios.post('/api/expenses/direct', {
        description: 'Direct 1-on-1',
        totalAmount: val,
        paidByUserId: iOweThem ? selectedUser.id : currentUser.id,
        createdByUserId: currentUser.id,
        splits: [
          { userId: iOweThem ? currentUser.id : selectedUser.id, amountOwed: val }
        ]
      });
      setAmount('');
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      alert('Request sent for approval!');
    } catch (err) { console.error(err); }
  };

  const handleSettleDebt = async (debt: any) => {
    if (!currentUser) return;
    const isPositive = debt.balance > 0; // they owe me
    const amt = Math.abs(debt.balance);

    if (isPositive) {
      if (!window.confirm(`Send a reminder to ${debt.name} for $${amt.toFixed(2)}?`)) return;
      try {
        await axios.post('/api/expenses/direct', {
          description: 'Payment Reminder',
          totalAmount: amt,
          paidByUserId: currentUser.id,
          createdByUserId: currentUser.id,
          splits: [{ userId: debt.userId, amountOwed: amt }],
          status: 'REMINDER'
        });
        alert('Reminder sent!');
        setExpandedDebtUserId(null);
      } catch (err) { console.error(err); }
    } else {
      if (!window.confirm(`Send a settlement request for $${amt.toFixed(2)} to ${debt.name}?`)) return;
      try {
        await axios.post('/api/expenses/direct', {
          description: 'Debt Settlement',
          totalAmount: amt,
          paidByUserId: currentUser.id, // I paid
          createdByUserId: currentUser.id,
          splits: [{ userId: debt.userId, amountOwed: amt }], // Cancels the debt
          status: 'PENDING'
        });
        alert('Settlement request sent for approval!');
        setExpandedDebtUserId(null);
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in relative">
      
      {/* Network Search */}
      <div className="animate-fade-in stagger-1">
        <h2 className="text-xl font-medium tracking-tight text-primary mb-5">Search Network</h2>
        <div className="card p-2 shadow-sm mb-6 flex items-center bg-white relative z-10">
          <Search className="w-5 h-5 text-tertiary absolute left-5" />
          <form onSubmit={handleSearch} className="flex-1 flex pr-2">
            <input 
              type="text" 
              placeholder="Search by username to add a debt..." 
              className="w-full bg-transparent border-none focus:outline-none text-primary placeholder-tertiary py-2"
              style={{ paddingLeft: '3rem' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary h-9 text-xs px-4 ml-2">Search</button>
          </form>
        </div>
        
        {searchResults.length > 0 && (
          <div className="card shadow-sm overflow-hidden animate-fade-in flex flex-col mt-[-1rem] mb-6 border-t-0 rounded-t-none relative z-0">
            <div className="max-h-64 overflow-y-auto divide-y divide-border custom-scrollbar">
              {searchResults.map((user, i) => (
                <div key={user.id} className="p-4 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-secondary border border-border">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-primary block text-sm">{user.name}</span>
                      {user.upiId && <span className="text-xs text-secondary mt-0.5 block">{user.upiId}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(user)} className="btn btn-secondary h-8 text-xs px-4 shadow-sm bg-white">Select</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal for creating debt */}
      {selectedUser && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl w-full max-w-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl tracking-tight">Record Debt</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors"><XIcon className="w-4 h-4 text-secondary" /></button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-6">
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-semibold text-secondary border border-border shadow-sm">
                 {selectedUser.name.charAt(0).toUpperCase()}
               </div>
               <div>
                 <div className="font-semibold text-sm">{selectedUser.name}</div>
                 <div className="text-xs text-secondary">{selectedUser.upiId || 'No UPI ID'}</div>
               </div>
            </div>

            <form onSubmit={handleDirectExpense} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Who owes who?</label>
                <select 
                  className="input h-11 w-full bg-white shadow-sm"
                  value={iOweThem ? 'iOwe' : 'theyOwe'}
                  onChange={e => setIOweThem(e.target.value === 'iOwe')}
                >
                  <option value="theyOwe">They owe me</option>
                  <option value="iOwe">I owe them</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary font-medium">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    required
                    className="input h-11 w-full bg-white shadow-sm font-medium text-lg"
                    style={{ paddingLeft: '2.5rem' }}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="btn btn-primary h-11 w-full text-base shadow-md">Send Request</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Active Debts */}
      <div className="animate-fade-in stagger-2">
        <h2 className="text-xl font-medium tracking-tight text-primary mb-5">Active Debts</h2>

        <div className="grid gap-4">
          {debts.map((debt, i) => {
            const isExpanded = expandedDebtUserId === debt.userId;
            return (
              <div 
                key={debt.userId} 
                className={`card flex flex-col shadow-sm transition-all duration-300 cursor-pointer overflow-hidden ${isExpanded ? 'border-primary ring-1 ring-primary/20' : 'hover:border-gray-300'}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => setExpandedDebtUserId(isExpanded ? null : debt.userId)}
              >
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${debt.balance > 0 ? 'bg-positive/10 text-positive' : 'bg-accent/10 text-accent'}`}>
                      {debt.balance > 0 ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-primary">{debt.name}</span>
                        {debt.globalOptIn ? (
                          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-positive bg-positive/10 px-2 py-0.5 rounded-full border border-positive/20">
                            <ShieldCheck className="w-3 h-3" /> Opted In
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-secondary bg-gray-100 px-2 py-0.5 rounded-full border border-border">
                            <ShieldAlert className="w-3 h-3" /> Raw Debt
                          </div>
                        )}
                      </div>
                      {debt.upiId ? (
                        <div className="text-sm text-secondary mt-1">{debt.upiId}</div>
                      ) : (
                        <div className="text-sm text-tertiary mt-1">No payment info</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col sm:items-end">
                    <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                      {debt.balance > 0 ? 'Owes you' : 'You owe'}
                    </div>
                    <div className={`text-2xl font-semibold tabular-nums tracking-tight ${debt.balance > 0 ? 'text-positive' : 'text-primary'}`}>
                      ${Math.abs(debt.balance).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Expanded Settle Action */}
                <div className={`bg-gray-50 border-t border-border px-6 flex items-center justify-between overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-20 py-4' : 'max-h-0 py-0 border-transparent'}`}>
                   <div className="text-sm text-secondary font-medium hidden sm:block">
                     {debt.balance > 0 ? 'Remind them to pay you?' : 'Ready to clear this balance?'}
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleSettleDebt(debt); }}
                     className="btn btn-primary h-10 px-6 gap-2 w-full sm:w-auto shadow-sm"
                   >
                     {debt.balance > 0 ? (
                       <><Send className="w-4 h-4" /> Send Reminder</>
                     ) : (
                       <><CheckCircle2 className="w-4 h-4" /> Record as Paid</>
                     )}
                   </button>
                </div>
              </div>
            );
          })}
          
          {debts.length === 0 && (
            <div className="text-center py-16 border border-dashed border-border rounded-xl bg-white/50">
              <p className="text-sm font-medium text-primary">You are completely settled up.</p>
              <p className="text-xs text-secondary mt-1">Search for someone above to add a new debt.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
