import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // ✅ Corectare path
import { 
  User, 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Vote, 
  Users, 
  Trophy, 
  Calendar, 
  Eye, 
  ArrowLeft,
  UserCircle,
  Target,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  Crown,
  Inbox,
  ExternalLink,
  Hash
} from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Se încarcă profilul...</span>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profil indisponibil</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            to="/polls" 
            className="inline-flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Înapoi la sondaje</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <UserCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>{userProfile?.username}</span>
                  {isOwnProfile && (
                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>Tu</span>
                    </span>
                  )}
                  {userProfile?.is_admin && (
                    <span className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                      <Crown className="w-3 h-3" />
                      <span>Admin</span>
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Membru din {new Date(userProfile?.created_at).toLocaleDateString('ro-RO')}</span>
                </p>
              </div>
            </div>
            <Link 
              to="/polls" 
              className="inline-flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Înapoi la sondaje</span>
            </Link>
          </div>
        </div>
      </div>



    {/* Navigation Tabs */}
    <div className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Prezentare generală', icon: BarChart3 },
            { id: 'polls', label: 'Sondaje create', icon: FileText },
            { id: 'activity', label: 'Activitate', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
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
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.polls_created || 0}</p>
                  <p className="text-gray-600">Sondaje create</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Vote className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.votes_cast || 0}</p>
                  <p className="text-gray-600">Voturi date</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats?.total_votes_received || 0}</p>
                  <p className="text-gray-600">Voturi primite</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Sondaje create de {userProfile?.username}</span>
            </h2>
            
            {userPolls.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Nu a creat încă niciun sondaj</p>
                <p className="text-sm text-gray-500 mt-2">Sondajele vor apărea aici când vor fi create</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPolls.map((poll) => (
                  <div key={poll.id} className="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                    {/* Header fix cu înălțime consistentă */}
                    <div className="p-6 pb-4 flex-shrink-0">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex-1 mr-3 line-clamp-2 min-h-[3.5rem] leading-7">
                          {poll.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 flex-shrink-0 ${
                          poll.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {poll.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Activ</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Închis</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Content cu înălțime flexibilă */}
                    <div className="px-6 flex-1 flex flex-col">
                      {/* Opțiuni cu înălțime fixă */}
                      <div className="space-y-2 mb-4 min-h-[4rem] max-h-[8rem] overflow-hidden">
                        {poll.options && poll.options.length > 0 ? (
                          <>
                            {poll.options.slice(0, 3).map((option, index) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                                <Target className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="truncate">
                                  {option.text || option} ({option.votes || 0} voturi)
                                </span>
                              </div>
                            ))}
                            {poll.options.length > 3 && (
                              <div className="text-sm text-gray-500 flex items-center space-x-2">
                                <Target className="w-3 h-3 flex-shrink-0" />
                                <span>... și încă {poll.options.length - 3} opțiuni</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <Target className="w-3 h-3 flex-shrink-0" />
                            <span>Nu există opțiuni disponibile</span>
                          </div>
                        )}
                        
                        {/* Spațiu pentru umplere dacă sunt puține opțiuni */}
                        {poll.options && poll.options.length < 3 && (
                          <div className="flex-1"></div>
                        )}
                      </div>

                      {/* Spacer pentru a împinge footer-ul jos */}
                      <div className="flex-1"></div>

                      {/* Footer fix la bottom */}
                      <div className="mt-auto space-y-4">
                        {/* Statistici */}
                        <div className="flex justify-between items-center text-sm text-gray-500 py-2 border-t border-gray-100">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(poll.created_at).toLocaleDateString('ro-RO')}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Vote className="w-3 h-3" />
                            <span>{poll.total_votes || 0} voturi</span>
                          </span>
                        </div>
                        
                        {/* Button */}
                        <div className="pb-6">
                          <Link
                            to={`/polls/${poll.id}`}
                            className="inline-flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg w-full font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Vezi sondajul</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Activity className="w-6 h-6 text-green-600" />
              <span>Activitatea lui {userProfile?.username}</span>
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top sondaje */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span>Cele mai populare sondaje</span>
                </h3>
                <div className="space-y-3">
                  {userPolls.length > 0 ? (
                    userPolls
                      .sort((a, b) => b.total_votes - a.total_votes)
                      .slice(0, 5)
                      .map((poll, index) => (
                        <div key={poll.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-orange-500 text-white' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              <Hash className="w-3 h-3" />
                              {index + 1}
                            </div>
                            <Link 
                              to={`/polls/${poll.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                            >
                              <span>{poll.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          <span className="text-sm text-gray-600 flex items-center space-x-1">
                            <Vote className="w-3 h-3" />
                            <span>{poll.total_votes}</span>
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>Nu există sondaje pentru a afișa statistici</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistici detaliate */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Statistici detaliate</span>
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Rata de participare</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {userStats?.polls_created > 0 ? 
                        `${Math.round(((userStats?.total_votes_received || 0) / (userStats?.polls_created * 10)) * 100)}%` 
                        : '0%'
                      }
                    </p>
                    <p className="text-sm text-blue-600">Mediu per sondaj</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-green-800">Sondaje active</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {userPolls.filter(p => p.is_active).length}
                    </p>
                    <p className="text-sm text-green-600">din {userPolls.length} totale</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <h4 className="font-medium text-purple-800">Ultimul sondaj</h4>
                    </div>
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