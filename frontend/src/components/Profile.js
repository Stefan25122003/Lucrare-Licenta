// Profile.js - UPDATED cu Lucide React icons
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit3, 
  Save, 
  X,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  Clock,
  Award,
  UserCircle,
  Cog,
  ShieldCheck,
  Phone,
  MapPin,
  FileText,
  Crown,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
  Info
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    city: '',
    age: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/auth/profile', {
        headers: getAuthHeaders()
      });
      
      const profileData = {
        ...response.data,
        age: response.data.age || '',
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        city: response.data.city || '',
        phone: response.data.phone || '',
        bio: response.data.bio || '',
        avatar_url: response.data.avatar_url || ''
      };
      
      setProfile(profileData);
      setOriginalProfile(profileData);
      
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      if (error.response?.status === 401) {
        logout();
      } else {
        setMessage('❌ Eroare la încărcarea profilului');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/auth/stats', {
        headers: getAuthHeaders()
      });
      setStats(response.data);
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Validări
      if (profile.age && (profile.age < 13 || profile.age > 120)) {
        setMessage('❌ Vârsta trebuie să fie între 13 și 120 de ani');
        return;
      }

      if (profile.bio && profile.bio.length > 500) {
        setMessage('❌ Biografia nu poate depăși 500 de caractere');
        return;
      }

      // Creează obiectul cu doar câmpurile modificate
      const updateData = {};
      Object.keys(profile).forEach(key => {
        if (key !== 'username' && key !== 'email' && profile[key] !== originalProfile[key]) {
          updateData[key] = profile[key] === '' ? null : profile[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        setMessage('ℹ️ Nu au fost detectate modificări');
        setEditing(false);
        return;
      }

      await axios.put('http://localhost:5000/auth/profile', updateData, {
        headers: getAuthHeaders()
      });

      setOriginalProfile(profile);
      setEditing(false);
      setMessage('✅ Profil actualizat cu succes!');
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      
      if (error.response?.status === 401) {
        logout();
      } else {
        setMessage(`❌ ${error.response?.data?.detail || 'Eroare la actualizarea profilului'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfile(originalProfile);
    setEditing(false);
    setMessage('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage('❌ Parolele noi nu se potrivesc');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setMessage('❌ Parola nouă trebuie să aibă cel puțin 6 caractere');
      return;
    }

    try {
      setSaving(true);
      
      await axios.post('http://localhost:5000/auth/change-password', passwordData, {
        headers: getAuthHeaders()
      });

      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
      setMessage('✅ Parolă schimbată cu succes!');
      
    } catch (error) {
      console.error('❌ Error changing password:', error);
      
      if (error.response?.status === 401) {
        logout();
      } else {
        setMessage(`❌ ${error.response?.data?.detail || 'Eroare la schimbarea parolei'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getDisplayName = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.username || 'Utilizator';
  };

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      const firstName = profile.first_name.trim();
      const lastName = profile.last_name.trim();
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
      }
    }
    
    if (profile.username && profile.username.length > 0) {
      return profile.username[0].toUpperCase();
    }
    
    return 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Se încarcă profilul...</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <UserCircle className="w-14 h-14 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <span>{getDisplayName()}</span>
                {user?.isAdmin && (
                  <span className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    <Crown className="w-4 h-4" />
                    <span>Administrator</span>
                  </span>
                )}
              </h1>
              <p className="text-gray-600 flex items-center space-x-2 mt-2">
                <Mail className="w-4 h-4" />
                <span>{profile.email}</span>
              </p>
              <p className="text-gray-500 flex items-center space-x-2 text-sm mt-1">
                <CalendarIcon className="w-4 h-4" />
                <span>Membru din {stats?.member_since ? new Date(stats.member_since).toLocaleDateString('ro-RO') : 'N/A'}</span>
              </p>
            </div>
            <div className="flex space-x-3">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editează Profil</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 disabled:opacity-50 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Se salvează...' : 'Salvează'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-md"
                  >
                    <X className="w-4 h-4" />
                    <span>Anulează</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 
            message.includes('ℹ️') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.includes('✅') ? (
              <CheckCircle className="w-5 h-5" />
            ) : message.includes('ℹ️') ? (
              <Info className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                <User className="w-6 h-6 text-blue-500" />
                <span>Informații Personale</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Nume utilizator</span>
                  </label>
                  <input
                    type="text"
                    value={profile.username || ''}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Prenume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Prenume</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profile.first_name || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Introdu prenumele"
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      editing ? 'bg-white hover:border-blue-400' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Nume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Nume</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profile.last_name || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Introdu numele"
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      editing ? 'bg-white hover:border-blue-400' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Oraș */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Oraș</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Introdu orașul"
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      editing ? 'bg-white hover:border-blue-400' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Vârsta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Vârsta</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={profile.age || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Introdu vârsta"
                    min="13"
                    max="120"
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      editing ? 'bg-white hover:border-blue-400' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Telefon */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Telefon</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Introdu numărul de telefon"
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      editing ? 'bg-white hover:border-blue-400' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Biografie */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Biografie</span>
                  </label>
                  <textarea
                    name="bio"
                    value={profile.bio || ''}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Scrie o scurtă descriere despre tine..."
                    rows="4"
                    maxLength="500"
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 ${
                      editing ? 'bg-white hover:border-blue-400' : 'bg-gray-50'
                    }`}
                  />
                  {editing && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>{(profile.bio || '').length}/500 caractere</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-green-500" />
                  <span>Securitate</span>
                </h2>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-md ${
                    showPasswordForm 
                      ? 'bg-gray-500 text-white hover:bg-gray-600' 
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>{showPasswordForm ? 'Anulează' : 'Schimbă Parola'}</span>
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Parola curentă</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData(prev => ({
                          ...prev,
                          current_password: e.target.value
                        }))}
                        required
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                      <Key className="w-4 h-4" />
                      <span>Parola nouă</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({
                          ...prev,
                          new_password: e.target.value
                        }))}
                        required
                        minLength="6"
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirmă parola nouă</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData(prev => ({
                          ...prev,
                          confirm_password: e.target.value
                        }))}
                        required
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 shadow-md"
                  >
                    <Key className="w-4 h-4" />
                    <span>{saving ? 'Se schimbă...' : 'Schimbă Parola'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">
                {getInitials()}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {getDisplayName()}
              </h3>
              <p className="text-gray-600 flex items-center justify-center space-x-2">
                <User className="w-4 h-4" />
                <span>@{profile.username || 'utilizator'}</span>
              </p>
              {user?.isAdmin && (
                <span className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full mt-3">
                  <Crown className="w-4 h-4" />
                  <span>Administrator</span>
                </span>
              )}
            </div>

            {/* Statistics */}
            {stats && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span>Statistici</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="flex items-center space-x-2 text-blue-700">
                      <TrendingUp className="w-4 h-4" />
                      <span>Sondaje create</span>
                    </span>
                    <span className="font-bold text-blue-900">{stats.polls_created || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="flex items-center space-x-2 text-green-700">
                      <Shield className="w-4 h-4" />
                      <span>Sondaje securizate</span>
                    </span>
                    <span className="font-bold text-green-900">{stats.secure_polls_created || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="flex items-center space-x-2 text-purple-700">
                      <Users className="w-4 h-4" />
                      <span>Total sondaje</span>
                    </span>
                    <span className="font-bold text-purple-900">{stats.total_polls_created || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center space-x-2 text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span>Zile active</span>
                    </span>
                    <span className="font-bold text-gray-900">{stats.days_since_registration || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Informații Cont</span>
              </h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>Username-ul și email-ul nu pot fi modificate</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>Toate informațiile sunt opționale</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>Biografia poate avea maxim 500 caractere</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>Vârsta trebuie să fie între 13-120 ani</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;