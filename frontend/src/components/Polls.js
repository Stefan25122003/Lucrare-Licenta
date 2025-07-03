import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  User, 
  Calendar, 
  Vote, 
  Trophy, 
  TrendingDown, 
  AlphabeticallyOrder,
  X,
  Eye,
  BarChart3,
  Clock,
  UserCheck,
  Users,
  Lock,
  CheckCircle
} from 'lucide-react';

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ title: '', options: ['', ''] });
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [filters, setFilters] = useState({
    status: 'active', 
    sortBy: 'newest', 
    searchTerm: '',
    createdBy: 'all', 
    minVotes: '',
    maxVotes: '',
    dateRange: 'all'
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);

  const apiCall = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get('http://localhost:5000/polls/');
      setPolls(response.data);
      
      console.log('📊 Polls fetched:', response.data);
      console.log('🟢 Active polls:', response.data.filter(p => p.is_active).length);
      console.log('🔴 Closed polls:', response.data.filter(p => !p.is_active).length);
      
      if (response.data.length > 0) {
        console.log('📋 Sample poll structure:', response.data[0]);
      }
      
    } catch (error) {
      console.error('Eroare la preluarea sondajelor', error);
      setMessage('Eroare la încărcarea sondajelor');
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!pollId || pollId === 'undefined') {
      console.error('Poll ID is missing or undefined');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('❌ Trebuie să fii autentificat pentru a vota');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/polls/${pollId}/vote`,
        { option_index: optionIndex },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      fetchPolls();
    } catch (error) {
      console.error('Error voting:', error);
      if (error.response?.status === 401) {
        setMessage('❌ Trebuie să fii autentificat pentru a vota');
      } else if (error.response?.status === 400 && error.response?.data?.detail?.includes('already voted')) {
        setMessage('⚠️ Ai votat deja la acest sondaj cu acest cont');
      } else {
        setMessage(`❌ ${error.response?.data?.detail || 'Eroare la votare'}`);
      }
    }
  };

  const createPoll = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiCall.post('/polls/', {
        title: newPoll.title,
        options: newPoll.options.filter(opt => opt.trim() !== '')
      });
      
      setPolls([...polls, response.data]);
      setNewPoll({ title: '', options: ['', ''] });
      setMessage('Sondaj creat cu succes!');
    } catch (error) {
      console.error('Error creating poll:', error);
      setMessage(error.response?.data?.detail || 'Creare sondaj eșuată');
    } finally {
      setLoading(false);
    }
  };

  const deletePoll = async (pollId) => {
    if (window.confirm('Sigur vrei să ștergi acest sondaj?')) {
      try {
        await apiCall.delete(`/polls/${pollId}`);
        setPolls(polls.filter(poll => poll._id !== pollId));
        setMessage('Sondaj șters cu succes!');
      } catch (error) {
        console.error('Error deleting poll:', error);
        setMessage(error.response?.data?.detail || 'Ștergere eșuată');
      }
    }
  };

  const hasUserVoted = (poll) => {
    if (!poll.is_active) {
      return false;
    }
    return poll.user_has_voted || false;
  };

  const renderPollOption = (poll, option, index) => {
    const totalVotes = poll.total_votes || poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100) : 0;
    const userHasVoted = hasUserVoted(poll);
    const isClosedPoll = !poll.is_active;
    
    return (
      <div 
        key={index} 
        className={`mb-3 p-2 rounded transition-colors ${
          isClosedPoll || userHasVoted
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-gray-50 cursor-pointer hover:bg-gray-100'
        }`}
        onClick={() => !userHasVoted && !isClosedPoll && handleVote(poll.id, index)}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium">{option.text}</span>
          <span className="text-sm">
            {option.votes} voturi ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded">
          <div 
            className={`h-3 rounded transition-all duration-500 ${
              isClosedPoll ? 'bg-red-400' : userHasVoted ? 'bg-gray-400' : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {isClosedPoll && (
          <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Sondaj închis - nu se mai pot adăuga voturi
          </div>
        )}
        {userHasVoted && !isClosedPoll && (
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Ai votat deja la acest sondaj
          </div>
        )}
      </div>
    );
  };


  const getFilteredAndSortedPolls = () => {
    let filtered = [...polls];
    if (filters.status === 'active') {
      filtered = filtered.filter(poll => poll.is_active);
    } else if (filters.status === 'closed') {
      filtered = filtered.filter(poll => !poll.is_active);
    }
    if (filters.createdBy === 'me') {
      filtered = filtered.filter(poll => poll.created_by === user?.id);
    } else if (filters.createdBy === 'others') {
      filtered = filtered.filter(poll => poll.created_by !== user?.id);
    }
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(poll => 
        poll.title.toLowerCase().includes(searchLower) ||
        poll.creator_username.toLowerCase().includes(searchLower) ||
        poll.options.some(option => option.text.toLowerCase().includes(searchLower))
      );
    }


    if (filters.minVotes) {
      filtered = filtered.filter(poll => poll.total_votes >= parseInt(filters.minVotes));
    }
    if (filters.maxVotes) {
      filtered = filtered.filter(poll => poll.total_votes <= parseInt(filters.maxVotes));
    }
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const pollDate = new Date();
      
      filtered = filtered.filter(poll => {
        const createdAt = new Date(poll.created_at);
        
        switch (filters.dateRange) {
          case 'today':
            return createdAt.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createdAt >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return createdAt >= monthAgo;
          default:
            return true;
        }
      });
    }
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'most_votes':
          return b.total_votes - a.total_votes;
        case 'least_votes':
          return a.total_votes - b.total_votes;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const resetFilters = () => {
    setFilters({
      status: 'active',
      sortBy: 'newest',
      searchTerm: '',
      createdBy: 'all',
      minVotes: '',
      maxVotes: '',
      dateRange: 'all'
    });
  };
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredPolls = getFilteredAndSortedPolls();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl mb-6 flex items-center gap-2">
        <Vote className="w-8 h-8 text-blue-600" />
        Sondaje ({filteredPolls.length})
      </h1>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('succes') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Caută sondaje, creatori sau opțiuni..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">🟢 Active</option>
            <option value="closed">🔴 Închise</option>
            <option value="all">📊 Toate</option>
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">📅 Cele mai noi</option>
            <option value="oldest">⏰ Cele mai vechi</option>
            <option value="most_votes">🏆 Cele mai votate</option>
            <option value="least_votes">📉 Cele mai puțin votate</option>
            <option value="title">🔤 Alfabetic</option>
          </select>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            {showAdvancedFilters ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Mai puține filtre
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Mai multe filtre
              </>
            )}
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        {showAdvancedFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Creator
                </label>
                <select
                  value={filters.createdBy}
                  onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toți</option>
                  <option value="me">Sondajele mele</option>
                  <option value="others">Ale altora</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Perioada
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Oricând</option>
                  <option value="today">Astăzi</option>
                  <option value="week">Ultima săptămână</option>
                  <option value="month">Ultima lună</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Vote className="w-4 h-4" />
                  Voturi min
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.minVotes}
                  onChange={(e) => handleFilterChange('minVotes', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Voturi max
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={filters.maxVotes}
                  onChange={(e) => handleFilterChange('maxVotes', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Total sondaje: {polls.length}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Afișate: {filteredPolls.length}
                </span>
                <span>🟢 Active: {polls.filter(p => p.is_active).length}</span>
                <span>🔴 Închise: {polls.filter(p => !p.is_active).length}</span>
                {user && (
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-4 h-4" />
                    Ale mele: {polls.filter(p => p.created_by === user.id).length}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {filters.status !== 'closed' && (
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`w-full p-4 rounded-lg border-2 border-dashed transition-colors ${
              showCreateForm 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {showCreateForm ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  <span className="font-medium">Ascunde formularul de creare</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Creează un sondaj nou</span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </div>
          </button>
        </div>
      )}
      {filters.status !== 'closed' && showCreateForm && (
        <form onSubmit={createPoll} className="mb-8 p-6 bg-white rounded-lg shadow-md border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-600" />
              Creează Sondaj Nou
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700"
              title="Închide formularul"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <input
            type="text"
            value={newPoll.title}
            onChange={(e) => setNewPoll({...newPoll, title: e.target.value})}
            placeholder="Titlu sondaj"
            required
            className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opțiuni de vot:
            </label>
            {newPoll.options.map((option, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...newPoll.options];
                    newOptions[index] = e.target.value;
                    setNewPoll({...newPoll, options: newOptions});
                  }}
                  placeholder={`Opțiunea ${index + 1}`}
                  required
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {newPoll.options.length > 2 && (
                  <button 
                    type="button"
                    onClick={() => {
                      const newOptions = newPoll.options.filter((_, i) => i !== index);
                      setNewPoll({...newPoll, options: newOptions});
                    }}
                    className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Șterge opțiunea"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              type="button"
              onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Adaugă Opțiune
            </button>
            
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Se creează...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Creează Sondaj
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setNewPoll({ title: '', options: ['', ''] });
                setShowCreateForm(false);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              Anulează
            </button>
          </div>
        </form>
      )}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {polls.length === 0 ? (
            <div>
              <Vote className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">Nu există sondaje încă</p>
              <p>Fii primul care creează un sondaj!</p>
            </div>
          ) : (
            <div>
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">Nu s-au găsit sondaje</p>
              <p>Încearcă să modifici filtrele de căutare</p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Resetează filtrele
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{poll.title}</h2>
                {poll.created_by === user?.id && (
                  <button
                    onClick={() => deletePoll(poll._id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Șterge
                  </button>
                )}
              </div>
              
              {poll.options.map((option, index) => renderPollOption(poll, option, index))}
              
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Vote className="w-3 h-3" />
                Total voturi: {poll.total_votes || poll.options.reduce((sum, opt) => sum + opt.votes, 0)}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  to={`/polls/${poll.id}`}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Vezi
                </Link>
                
                {(!poll.is_active || !hasUserVoted(poll)) && (
                  <Link 
                    to={`/polls/${poll.id}/statistics`}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm flex items-center gap-1"
                  >
                    <BarChart3 className="w-3 h-3" />
                    Statistici
                  </Link>
                )}
                
                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                  poll.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {poll.is_active ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Activ
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      Închis
                    </>
                  )}
                </span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <Link to={`/users/${poll.creator_username}`} className="flex items-center gap-1 hover:text-blue-600">
                    <User className="w-3 h-3" />
                    {poll.creator_username}
                  </Link>
                  <span className="flex items-center gap-1">
                    <Vote className="w-3 h-3" />
                    {poll.total_votes} voturi
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(poll.created_at).toLocaleDateString('ro-RO')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        {filters.status !== 'closed' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-500 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 transition-colors"
            title="Creează sondaj nou"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        
        <button
          onClick={() => setFilters(prev => ({ ...prev, createdBy: 'me', status: 'active' }))}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          title="Sondajele mele active"
        >
          <UserCheck className="w-5 h-5" />
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, sortBy: 'most_votes', status: 'all' }))}
          className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors"
          title="Cele mai populare"
        >
          <Trophy className="w-5 h-5" />
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, dateRange: 'today', status: 'active' }))}
          className="bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
          title="Sondaje de astăzi"
        >
          <Calendar className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Polls;