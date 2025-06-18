import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PollDetail = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/polls/${pollId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPoll(response.data);
      
      // ✅ FIXED: Verifică dacă utilizatorul a votat folosind informațiile de la backend
      const userHasVoted = checkIfUserVoted(response.data);
      setHasVoted(userHasVoted);
      
    } catch (error) {
      console.error('Error fetching poll:', error);
      setMessage('❌ Eroare la încărcarea sondajului');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Funcție pentru a verifica dacă utilizatorul a votat (similar cu Polls.js)
  const checkIfUserVoted = (pollData) => {
    if (!user || !user.id) return false;
    
    // Verifică în mai multe moduri posibile cum backend-ul trimite informațiile:
    // 1. Dacă poll are proprietatea user_has_voted
    if (pollData.user_has_voted === true) return true;
    
    // 2. Dacă poll are array de voters cu ID-ul userului
    if (pollData.voters && pollData.voters.includes(user.id)) return true;
    
    // 3. Dacă poll are proprietatea voted_users cu ID-ul userului
    if (pollData.voted_users && pollData.voted_users.includes(user.id)) return true;
    
    // 4. Dacă poll are proprietatea votes care conține informații despre user
    if (pollData.votes && pollData.votes.some(vote => vote.user_id === user.id)) return true;
    
    return false;
  };

  const handleVote = async (optionIndex) => {
    if (hasVoted) {
      setMessage('❌ Ai votat deja în acest sondaj');
      return;
    }

    try {
      setVoting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `http://localhost:5000/polls/${pollId}/vote`,
        { option_index: optionIndex },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setMessage('✅ ' + response.data.message);
      setHasVoted(true);
      
      // ✅ REMOVED: Nu mai folosim localStorage pentru a stoca voturile
      // localStorage-ul nu este sincronizat cu backend-ul
      
      // Reîncarcă sondajul pentru a vedea rezultatele actualizate
      setTimeout(() => {
        fetchPoll();
        // ✅ FIXED: Curăță mesajul după un timp
        setTimeout(() => setMessage(''), 3000);
      }, 1000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Eroare la votare';
      setMessage('❌ ' + errorMessage);
      
      // Dacă eroarea spune că utilizatorul a votat deja, marchează ca și votat
      if (errorMessage.includes('already voted') || errorMessage.includes('votat deja')) {
        setHasVoted(true);
      }
    } finally {
      setVoting(false);
    }
  };

  const handleClosePoll = async () => {
    if (!window.confirm('Ești sigur că vrei să închizi acest sondaj?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/polls/${pollId}/close`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage('✅ Sondajul a fost închis');
      fetchPoll();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.detail || 'Eroare la închiderea sondajului'));
    }
  };

  const handleDeletePoll = async () => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest sondaj? Această acțiune nu poate fi anulată!')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/polls/${pollId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage('✅ Sondajul a fost șters');
      setTimeout(() => navigate('/polls'), 2000);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.detail || 'Eroare la ștergerea sondajului'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă sondajul...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Sondajul nu a fost găsit</h2>
          <Link to="/polls" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Înapoi la Sondaje
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{poll.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>👤 Creat de: <strong>{poll.creator_username}</strong></span>
            <span>📅 {new Date(poll.created_at).toLocaleDateString('ro-RO')}</span>
            <span>🗳️ {poll.total_votes} voturi</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              poll.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {poll.is_active ? '🟢 Activ' : '🔴 Închis'}
            </span>
          </div>
        </div>

        {/* ✅ FIXED: Status votare - afișează doar când utilizatorul a votat */}
        {hasVoted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <span className="text-lg mr-2">✅</span>
              <span className="font-medium">Ai votat deja la acest sondaj</span>
            </div>
          </div>
        )}

        {/* Message - doar pentru acțiuni specifice */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
          }`}>
            {message}
          </div>
        )}

        {/* Opțiuni */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Opțiuni:</h2>
          <div className="space-y-3">
            {poll.options.map((option, index) => {
              const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
              
              return (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{option.text}</span>
                    <span className="text-sm text-gray-600">
                      {option.votes} voturi ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        hasVoted ? 'bg-gray-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  {/* ✅ FIXED: Buton de votare mic - afișează doar dacă sondajul este activ și utilizatorul nu a votat */}
                  {poll.is_active && !hasVoted && (
                    <button
                      onClick={() => handleVote(index)}
                      disabled={voting}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                    >
                      {voting ? '⏳ Votez...' : '🗳️ Votează'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Butoane de acțiune */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          {/* Buton pentru statistici - pentru toată lumea */}
          <Link 
            to={`/polls/${poll.id}/statistics`}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors inline-flex items-center gap-2"
          >
            📊 <span>Vezi Statistici</span>
          </Link>
          
          {/* Buton pentru închidere sondaj - doar pentru creator sau admin */}
          {(poll.creator_id === user?._id || user?.is_admin) && poll.is_active && (
            <button
              onClick={handleClosePoll}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center gap-2"
            >
              🔒 <span>Închide Sondaj</span>
            </button>
          )}
          
          {/* Buton pentru ștergere - doar pentru creator sau admin */}
          {(poll.creator_id === user?._id || user?.is_admin) && (
            <button
              onClick={handleDeletePoll}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2"
            >
              🗑️ <span>Șterge Sondaj</span>
            </button>
          )}
          
          {/* Buton înapoi */}
          <Link 
            to="/polls"
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
          >
            ⬅️ <span>Înapoi</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PollDetail;