import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/store';
import { Check, X as XIcon, UserPlus, Send, Inbox, Clock } from 'lucide-react';

export default function Requests() {
  const { currentUser } = useStore();
  
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`/api/expenses/pending/${currentUser?.id}`);
      setReceived(res.data.received);
      setSent(res.data.sent);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const approveRequest = async (id: string) => {
    await axios.post(`/api/expenses/${id}/approve`);
    fetchData();
  };

  const rejectRequest = async (id: string) => {
    await axios.post(`/api/expenses/${id}/reject`);
    fetchData();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  const hasNoRequests = received.length === 0 && sent.length === 0;

  return (
    <div className="space-y-10 animate-fade-in">
      
      {hasNoRequests && (
        <div className="text-center py-20 border border-dashed border-border rounded-xl bg-white/50 animate-fade-in">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-5 h-5 text-tertiary" />
          </div>
          <h3 className="text-sm font-medium text-primary mb-1">Inbox Zero</h3>
          <p className="text-xs text-secondary max-w-xs mx-auto">You have no pending requests to approve, and no pending requests sent.</p>
        </div>
      )}

      {/* Received Requests */}
      {received.length > 0 && (
        <div className="animate-fade-in stagger-1">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Needs Your Approval ({received.length})
          </h2>
          <div className="grid gap-3">
            {received.map(p => (
              <div key={p.id} className="card p-5 border-accent/20 bg-accent/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-accent border border-accent/10">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    {p.status === 'REMINDER' ? (
                      <span className="text-sm text-primary">
                        <span className="font-semibold">{p.userWhoCreated.name}</span> sent a reminder that you owe them
                      </span>
                    ) : (
                      <span className="text-sm text-primary">
                        <span className="font-semibold">{p.userWhoCreated.name}</span> recorded an expense where <span className="font-semibold">{p.paidByUserId === currentUser?.id ? 'you' : 'they'} paid</span>
                      </span>
                    )}
                    <div className="text-lg font-semibold text-primary mt-0.5">${p.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  {p.status === 'REMINDER' ? (
                    <button onClick={() => rejectRequest(p.id)} className="btn btn-primary h-9 px-4 gap-2 shadow-sm"><Check className="w-4 h-4" /> Okay</button>
                  ) : (
                    <>
                      <button onClick={() => rejectRequest(p.id)} className="btn btn-secondary h-9 px-4 gap-2 text-secondary hover:text-negative"><XIcon className="w-4 h-4" /> Reject</button>
                      <button onClick={() => approveRequest(p.id)} className="btn btn-primary h-9 px-4 gap-2 shadow-sm"><Check className="w-4 h-4" /> Approve</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sent.length > 0 && (
        <div className="animate-fade-in stagger-2">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-tertiary" /> Sent Requests ({sent.length})
          </h2>
          <div className="grid gap-3">
            {sent.map(p => (
              <div key={p.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-secondary border border-border">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    {p.status === 'REMINDER' ? (
                      <span className="text-sm text-primary">
                        Waiting for <span className="font-semibold">{p.otherUser?.name || 'them'}</span> to see your reminder of
                      </span>
                    ) : (
                      <span className="text-sm text-primary">
                        Waiting for <span className="font-semibold">{p.otherUser?.name || 'them'}</span> to approve your request of
                      </span>
                    )}
                    <div className="text-lg font-semibold text-primary mt-0.5">${p.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-medium text-tertiary bg-gray-100 px-3 py-1.5 rounded-full border border-border">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
