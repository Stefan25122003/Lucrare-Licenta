import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userPolls, setUserPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log(`🔍 Fetching profile for: ${username}`);
      
      // Fetch user profile și statistici
      const [profileResponse, statsResponse, pollsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/users/${username}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          console.log('👤 Profile response:', res.data);
          return res;
        }),
        axios.get(`http://localhost:5000/users/${username}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          console.log('📊 Stats response:', res.data);
          return res;
        }),
        axios.get(`http://localhost:5000/users/${username}/polls`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          console.log('📋 Polls response:', res.data);
          return res;
        })
      ]);

      setUserProfile(profileResponse.data);
      setUserStats(statsResponse.data);
      setUserPolls(pollsResponse.data);
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      console.error('❌ Error details:', error.response?.data);
      setError('Utilizatorul nu a fost găsit sau nu aveți permisiunea să-l vizualizați');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă profilul...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profil indisponibil</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/polls" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            ← Înapoi la sondaje
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {userProfile?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userProfile?.username}
                  {isOwnProfile && <span className="text-sm text-blue-600 ml-2">(Tu)</span>}
                </h1>
                <p className="text-gray-600">
                  Membru din {new Date(userProfile?.created_at).toLocaleDateString('ro-RO')}
                </p>
              </div>
            </div>
            <Link 
              to="/polls" 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              ← Înapoi la sondaje
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '📊 Prezentare generală', icon: '📊' },
              { id: 'polls', label: '📋 Sondaje create', icon: '📋' },
              { id: 'activity', label: '📈 Activitate', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Statistici cards */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📋</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.polls_created || 0}</p>
                  <p className="text-gray-600">Sondaje create</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🗳️</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.votes_cast || 0}</p>
                  <p className="text-gray-600">Voturi date</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👥</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.total_votes_received || 0}</p>
                  <p className="text-gray-600">Voturi primite</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🏆</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {userStats?.polls_created > 0 ? 
                      Math.round((userStats?.total_votes_received || 0) / userStats?.polls_created) : 0
                    }
                  </p>
                  <p className="text-gray-600">Voturi/sondaj</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sondaje create de {userProfile?.username}
            </h2>
            
            {userPolls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg">Nu a creat încă niciun sondaj</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPolls.map((poll) => (
                  <div key={poll.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{poll.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        poll.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {poll.is_active ? '🟢 Activ' : '🔴 Închis'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {poll.options.slice(0, 3).map((option, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {option.text} ({option.votes} voturi)
                        </div>
                      ))}
                      {poll.options.length > 3 && (
                        <div className="text-sm text-gray-500">
                          ... și încă {poll.options.length - 3} opțiuni
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>📅 {new Date(poll.created_at).toLocaleDateString('ro-RO')}</span>
                      <span>🗳️ {poll.total_votes} voturi</span>
                    </div>
                    
                    <div className="mt-4">
                      <Link
                        to={`/polls/${poll.id}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        👁️ Vezi sondajul
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Activitatea lui {userProfile?.username}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Top sondaje */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Cele mai populare sondaje</h3>
                <div className="space-y-3">
                  {userPolls
                    .sort((a, b) => b.total_votes - a.total_votes)
                    .slice(0, 5)
                    .map((poll, index) => (
                      <div key={poll.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                          <Link 
                            to={`/polls/${poll.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {poll.title}
                          </Link>
                        </div>
                        <span className="text-sm text-gray-600">
                          {poll.total_votes} voturi
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Statistici detaliate */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Statistici detaliate</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">Rata de participare</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {userStats?.polls_created > 0 ? 
                        `${Math.round(((userStats?.total_votes_received || 0) / (userStats?.polls_created * 10)) * 100)}%` 
                        : '0%'
                      }
                    </p>
                    <p className="text-sm text-blue-600">Mediu per sondaj</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800">Sondaje active</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {userPolls.filter(p => p.is_active).length}
                    </p>
                    <p className="text-sm text-green-600">din {userPolls.length} totale</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800">Ultimul sondaj</h4>
                    <p className="text-sm font-medium text-purple-600">
                      {userPolls.length > 0 ? 
                        new Date(Math.max(...userPolls.map(p => new Date(p.created_at)))).toLocaleDateString('ro-RO')
                        : 'Nu a creat sondaje'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;