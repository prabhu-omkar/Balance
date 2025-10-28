import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/store';
import { Search, UserPlus, Check, X as XIcon } from 'lucide-react';

export default function Friends() {
  const { currentUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [directDebts, setDirectDebts] = useState<Record<string, number>>({});
  const [amount, setAmount] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [friendsRes, pendingRes, debtsRes] = await Promise.all([
        axios.get(`/api/friends/${currentUser.id}`),
        axios.get(`/api/friends/${currentUser.id}/pending`),
        axios.get(`/api/users/${currentUser.id}/direct-debts`)
      ]);
      setFriends(friendsRes.data);
      setPending(pendingRes.data);
      setDirectDebts(debtsRes.data);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return setSearchResults([]);
    try {
      const res = await axios.get(`/api/users/search?q=${searchQuery}&currentUserId=${currentUser?.id}`);
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
  };

  const sendRequest = async (userId: string) => {
    try {
      await axios.post('/api/friends/request', { user1Id: currentUser?.id, user2Id: userId });
      setSearchResults(searchResults.filter(u => u.id !== userId));
      alert('Friend request sent!');
    } catch (err) { console.error(err); }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      await axios.post('/api/friends/accept', { friendshipId });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDirectExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedFriend) return;
    
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    try {
      await axios.post('/api/expenses', {
        groupId: null, // direct 1-on-1 expense
        description: 'Direct Split',
        totalAmount: val,
        paidByUserId: currentUser.id,
        splits: [
          { userId: selectedFriend.id, amountOwed: val / 2 },
          { userId: currentUser.id, amountOwed: val / 2 }
        ]
      });
      setAmount('');
      setSelectedFriend(null);
      fetchData(); // refresh debts
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">
      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="card p-4 space-y-3 border-accent/20 bg-orange-50/30">
          <h2 className="text-sm font-medium text-primary">Pending Requests</h2>
          {pending.map(p => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-sm">{p.user1.name}</span>
              <div className="flex gap-2">
                <button onClick={() => acceptRequest(p.id)} className="p-1 hover:bg-green-100 text-positive rounded-sm transition-colors"><Check className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-red-100 text-accent rounded-sm transition-colors"><XIcon className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Friend Search */}
      <div>
        <h2 className="text-lg font-medium text-primary tracking-tight mb-4">Add Friend</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Search by username..." 
            className="input flex-1"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary px-3"><Search className="w-4 h-4" /></button>
        </form>
        
        {searchResults.length > 0 && (
          <div className="card divide-y divide-border">
            {searchResults.map(user => (
              <div key={user.id} className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{user.name}</span>
                <button onClick={() => sendRequest(user.id)} className="btn btn-secondary h-7 text-xs gap-1">
                  <UserPlus className="w-3 h-3" /> Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends List & Direct Expenses */}
      <div>
        <h2 className="text-lg font-medium text-primary tracking-tight mb-4">My Friends</h2>
        <div className="grid gap-3">
          {friends.map(friend => {
            const balance = directDebts[friend.id] || 0;
            return (
              <div key={friend.id} className="card p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{friend.name}</span>
                  <span className={`text-sm font-medium ${balance > 0 ? 'text-positive' : balance < 0 ? 'text-accent' : 'text-secondary'}`}>
                    {balance > 0 ? `Owes you $${balance.toFixed(2)}` : balance < 0 ? `You owe $${Math.abs(balance).toFixed(2)}` : 'Settled up'}
                  </span>
                </div>
                
                {selectedFriend?.id === friend.id ? (
                  <form onSubmit={handleDirectExpense} className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="I paid..." 
                      className="input text-sm h-8"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary h-8 text-sm px-3">Split</button>
                    <button type="button" onClick={() => setSelectedFriend(null)} className="btn btn-secondary h-8 text-sm px-3">Cancel</button>
                  </form>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedFriend(friend)} className="btn btn-secondary h-8 text-xs flex-1">I paid this much amount, split</button>
                  </div>
                )}
              </div>
            );
          })}
          
          {friends.length === 0 && (
            <div className="text-center py-8 border border-dashed border-border rounded-sm">
              <p className="text-secondary text-sm">You haven't added any friends yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
