import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ArrowRight, ShieldCheck } from 'lucide-react';

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export default function SettleUp() {
  const { id } = useParams<{ id: string }>();
  
  const [rawDebts, setRawDebts] = useState<Transaction[]>([]);
  const [simplified, setSimplified] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, any>>({});
  
  const [viewSimplified, setViewSimplified] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [simRes, groupRes] = await Promise.all([
          axios.get(`/api/groups/${id}/simplified`),
          axios.get(`/api/groups/${id}`)
        ]);
        
        setRawDebts(simRes.data.rawDebts);
        setSimplified(simRes.data.simplified);
        
        const userMap: Record<string, any> = {};
        groupRes.data.members.forEach((m: any) => {
          userMap[m.user.id] = m.user;
        });
        setUsers(userMap);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  const displayList = viewSimplified ? simplified : rawDebts;

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to={`/groups/${id}`} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border text-secondary hover:text-primary transition-colors shadow-sm">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Simplification Preview</h1>
      </div>

      <div className="card p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-medium text-primary">Debt Routing</h2>
            <p className="text-sm text-secondary mt-1">
              Preview how group debts will be settled.
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-md w-max border border-border">
            <button 
              onClick={() => setViewSimplified(false)}
              className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all ${!viewSimplified ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
            >
              Raw View ({rawDebts.length})
            </button>
            <button 
              onClick={() => setViewSimplified(true)}
              className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all ${viewSimplified ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
            >
              Optimized ({simplified.length})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {displayList.map((tx, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-gray-50 hover:bg-white hover:shadow-sm transition-all animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-3 w-full sm:w-1/3">
                <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-xs font-semibold text-secondary shadow-sm">
                  {users[tx.from]?.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-primary">{users[tx.from]?.name}</span>
              </div>
              
              <div className="flex flex-col items-center flex-1 w-full sm:w-auto px-4">
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Pays</div>
                <div className="flex items-center gap-2 w-full">
                  <div className="h-px bg-border flex-1" />
                  <div className="font-bold tabular-nums text-accent bg-white px-3 py-1 rounded-full border border-border shadow-sm">
                    ${tx.amount.toFixed(2)}
                  </div>
                  <div className="h-px bg-border flex-1" />
                </div>
                <ArrowRight className="w-4 h-4 text-tertiary mt-1" />
              </div>

              <div className="flex items-center gap-3 justify-end w-full sm:w-1/3">
                <span className="font-semibold text-primary">{users[tx.to]?.name}</span>
                <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-xs font-semibold text-secondary shadow-sm">
                  {users[tx.to]?.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          ))}

          {displayList.length === 0 && (
            <div className="text-center py-12 bg-white border border-border rounded-xl">
              <ShieldCheck className="w-8 h-8 text-positive mx-auto mb-3" />
              <p className="text-sm font-medium text-primary">Everyone is settled up!</p>
              <p className="text-xs text-secondary mt-1">No transactions are required to balance this group.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
