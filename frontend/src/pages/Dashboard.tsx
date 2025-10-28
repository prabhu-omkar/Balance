import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../store/store';
import { Plus, ChevronRight, X as XIcon, Users, Activity, LayoutGrid, Search, Check } from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [netBalance, setNetBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [groupsRes, balanceRes] = await Promise.all([
        axios.get(`/api/groups?userId=${currentUser?.id}`),
        axios.get(`/api/users/${currentUser?.id}/dashboard`)
      ]);
      setGroups(groupsRes.data);
      setNetBalance(balanceRes.data.netBalance);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q) return setSearchResults([]);
    try {
      const res = await axios.get(`/api/users/search?q=${q}&currentUserId=${currentUser?.id}`);
      setSearchResults(res.data.filter((u: any) => !selectedFriends.find(f => f.id === u.id)));
    } catch (err) { console.error(err); }
  };

  const toggleFriend = (user: any) => {
    if (selectedFriends.find(f => f.id === user.id)) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== user.id));
    } else {
      setSelectedFriends([...selectedFriends, user]);
    }
    setSearchResults(prev => prev.filter(u => u.id !== user.id));
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !groupName) return;
    
    try {
      const memberIds = [currentUser.id, ...selectedFriends.map(f => f.id)];
      await axios.post('/api/groups', { name: groupName, createdById: currentUser.id, memberIds });
      fetchData();
      setIsCreating(false);
      setGroupName('');
      setSelectedFriends([]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in relative">
      {/* Hero Balance Summary */}
      <div className="relative overflow-hidden rounded-2xl bg-primary text-white p-8 md:p-12 shadow-hover">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent opacity-20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-start space-y-2">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wider uppercase">Total Net Balance</span>
          </div>
          <div className="text-5xl md:text-7xl font-semibold tracking-tighter tabular-nums">
            {netBalance >= 0 ? '' : '-'}<span className={netBalance >= 0 ? 'text-white' : 'text-white/90'}>${Math.abs(netBalance).toFixed(2)}</span>
          </div>
          <p className="text-sm text-white/60 mt-4 max-w-sm leading-relaxed">
            {netBalance > 0 ? "You're in the green. People owe you money across your network." : netBalance < 0 ? "You currently owe money across your network." : "You're completely settled up across all groups and direct debts."}
          </p>
        </div>
      </div>

      {/* Groups List */}
      <div className="animate-fade-in stagger-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium tracking-tight text-primary">Your Groups</h2>
          <button onClick={() => setIsCreating(true)} className="btn btn-primary h-9 px-4 gap-2 text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            New Group
          </button>
        </div>

        {isCreating && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl w-full max-w-lg animate-fade-in-up max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-primary">Create New Group</h2>
                  <p className="text-sm text-secondary mt-1">Start tracking expenses with friends</p>
                </div>
                <button type="button" onClick={() => setIsCreating(false)} className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors self-end sm:self-auto flex-shrink-0"><XIcon className="w-4 h-4 text-secondary" /></button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">Group Name</label>
                  <input required type="text" className="input h-11 bg-white focus:bg-gray-50" placeholder="e.g. Miami Trip 2026" value={groupName} onChange={e => setGroupName(e.target.value)} />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary">Add Members</label>
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-tertiary absolute left-3" />
                      <input 
                        type="text" 
                        placeholder="Search network by username..." 
                        className="input h-11 bg-white focus:bg-gray-50 w-full"
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchQuery}
                        onChange={handleSearch}
                      />
                    </div>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-1 border border-border rounded-lg bg-white shadow-sm overflow-hidden flex flex-col">
                      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
                        {searchResults.map(user => {
                          const isSelected = selectedFriends.find(f => f.id === user.id);
                          return (
                            <button 
                              key={user.id} 
                              type="button"
                              onClick={() => toggleFriend(user)}
                              className={`w-full flex items-center justify-between p-3 text-sm transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-gray-50'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-100 text-secondary">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-primary">{user.name}</span>
                              </div>
                              {isSelected ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-white border border-border px-2 py-1 rounded-md shadow-sm">
                                  <Check className="w-3 h-3" /> Added
                                </div>
                              ) : (
                                <div className="text-xs font-medium text-secondary border border-transparent px-2 py-1">
                                  Select
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {selectedFriends.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider">Selected ({selectedFriends.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedFriends.map(f => (
                          <span key={f.id} className="bg-gray-50 text-primary border border-gray-200 pl-2.5 pr-1.5 py-1.5 rounded-lg text-sm flex items-center gap-2 shadow-sm animate-fade-in">
                            {f.name}
                            <button type="button" onClick={() => toggleFriend(f)} className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-50 text-tertiary hover:text-negative transition-colors"><XIcon className="w-3.5 h-3.5"/></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button type="submit" className="btn btn-primary h-11 w-full shadow-md text-base">Create Group</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group, i) => (
            <Link 
              key={group.id} 
              to={`/groups/${group.id}`}
              className="card p-5 hover:border-gray-300 transition-all duration-300 group cursor-pointer flex flex-col justify-between h-32"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-primary text-lg leading-tight">{group.name}</h3>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-secondary">
                <Users className="w-3.5 h-3.5" />
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </div>
            </Link>
          ))}
        </div>
        
        {groups.length === 0 && !isCreating && (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-white/50">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-5 h-5 text-tertiary" />
            </div>
            <h3 className="text-sm font-medium text-primary mb-1">No groups found</h3>
            <p className="text-xs text-secondary max-w-xs mx-auto">Create a group to start tracking shared expenses with your network.</p>
          </div>
        )}
      </div>
    </div>
  );
}
