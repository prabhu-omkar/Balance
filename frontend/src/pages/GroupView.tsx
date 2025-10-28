import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRightLeft, Plus, Receipt, CheckCircle, Trash2, ArrowLeft, X as XIcon } from 'lucide-react';
import { useStore } from '../store/store';

export default function GroupView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useStore();
  
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  const fetchData = async () => {
    try {
      const [groupRes, expRes] = await Promise.all([
        axios.get(`/api/groups/${id}`),
        axios.get(`/api/groups/${id}/expenses`)
      ]);
      setGroup(groupRes.data);
      setExpenses(expRes.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !group) return;

    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    try {
      await axios.post('/api/expenses', {
        groupId: id,
        description: desc,
        totalAmount: val,
        paidByUserId: currentUser.id,
        splits: group.members.map((m: any) => ({
          userId: m.user.id,
          amountOwed: val / group.members.length
        }))
      });
      fetchData();
      setDesc('');
      setAmount('');
      setIsAdding(false);
    } catch (err) { console.error(err); }
  };

  const handleSettle = async (endGroup: boolean) => {
    if (!window.confirm(endGroup ? 'Are you sure you want to settle and end this group?' : 'Are you sure you want to settle all debts? This will give the group a fresh start.')) return;
    try {
      await axios.post(`/api/groups/${id}/settle`, { endGroup });
      if (endGroup) {
        navigate('/');
      } else {
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );
  
  if (!group) return <div className="text-center py-20 font-medium text-secondary">Group not found</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/" className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border text-secondary hover:text-primary transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-sm font-medium text-tertiary">Back to Dashboard</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">{group.name}</h1>
          <p className="text-sm text-secondary mt-1">{group.members.length} members sharing expenses</p>
        </div>
        <Link to={`/groups/${id}/settle`} className="btn btn-secondary h-10 text-sm gap-2 shadow-sm">
          <ArrowRightLeft className="w-4 h-4" />
          Simplification Preview
        </Link>
      </div>

      {expenses.length > 0 && group.createdByUserId === currentUser?.id && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in stagger-1">
          <button onClick={() => handleSettle(false)} className="card p-5 border-l-4 border-l-positive hover:border-positive hover:shadow-md transition-all group flex flex-col items-start text-left">
            <div className="flex items-center gap-2 text-positive font-semibold mb-2">
              <CheckCircle className="w-5 h-5" /> Fresh Start Settle
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Calculates minimal cash flow within this group, converts debts to 1-on-1, and resets group expenses to zero.
            </p>
          </button>
          
          <button onClick={() => handleSettle(true)} className="card p-5 border-l-4 border-l-accent hover:border-accent hover:shadow-md transition-all group flex flex-col items-start text-left">
            <div className="flex items-center gap-2 text-accent font-semibold mb-2">
              <Trash2 className="w-5 h-5" /> Settle & End Group
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Performs the same minimal cash flow conversion as above, but permanently deletes this group afterwards.
            </p>
          </button>
        </div>
      )}

      <div className="animate-fade-in stagger-2 pt-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-primary tracking-tight">Timeline</h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="btn btn-primary text-sm h-9 px-4 gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddExpense} className="card p-6 mb-8 border-t-4 border-t-primary shadow-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">New Expense</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-md transition-colors"><XIcon className="w-5 h-5 text-secondary" /></button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">What was it for?</label>
                <input required type="text" placeholder="e.g. Dinner at Mario's" className="input h-11" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">Total Amount ($)</label>
                <input required type="number" step="0.01" placeholder="0.00" className="input h-11 font-semibold" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary h-11 px-6 w-full md:w-auto shadow-sm">Save</button>
            </div>
            <p className="text-xs text-secondary mt-4 italic">Note: This will be split equally among all {group.members.length} members.</p>
          </form>
        )}

        <div className="space-y-4">
          {expenses.map((exp, i) => (
            <div key={exp.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-gray-300 transition-colors" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-xl border border-border">
                  <Receipt className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary text-base">{exp.description}</h3>
                  <p className="text-xs text-secondary mt-1">Paid by <span className="font-medium text-primary">{exp.paidBy.id === currentUser?.id ? 'you' : exp.paidBy.name}</span> on {new Date(exp.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right flex flex-col sm:items-end">
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Total</div>
                <div className="font-semibold text-xl tabular-nums tracking-tight text-primary">${exp.totalAmount.toFixed(2)}</div>
              </div>
            </div>
          ))}
          
          {expenses.length === 0 && !isAdding && (
            <div className="text-center py-16 border border-dashed border-border rounded-xl bg-white/50">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-5 h-5 text-tertiary" />
              </div>
              <p className="text-sm font-medium text-primary mb-1">No expenses yet.</p>
              <p className="text-xs text-secondary">Click "Add Expense" to start logging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
