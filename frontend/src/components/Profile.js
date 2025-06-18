// Profile.js - FIXED cu URL-uri corecte
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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

  // ✅ FUNCȚII HELPER PENTRU A EVITA ERORILE DE toUpperCase
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
    
    return 'U'; // Fallback
  };

  const safeToUpperCase = (str) => {
    return str && typeof str === 'string' && str.length > 0 ? str[0].toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă profilul...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">👤 Profilul Meu</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 
          message.includes('ℹ️') ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informații personale */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold"> Informații Personale</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  ✏️ Editează
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
                  >
                    {saving ? 'Se salvează...' : '💾 Salvează'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    ❌ Anulează
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nume utilizator
                </label>
                <input
                  type="text"
                  value={profile.username || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                />
              </div>

              {/* Prenume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prenume
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="Introdu prenumele"
                  className={`w-full p-2 border border-gray-300 rounded ${
                    editing ? 'bg-white' : 'bg-gray-50'
                  }`}
                />
              </div>

              {/* Nume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nume
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="Introdu numele"
                  className={`w-full p-2 border border-gray-300 rounded ${
                    editing ? 'bg-white' : 'bg-gray-50'
                  }`}
                />
              </div>

              {/* Oraș */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oraș
                </label>
                <input
                  type="text"
                  name="city"
                  value={profile.city || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="Introdu orașul"
                  className={`w-full p-2 border border-gray-300 rounded ${
                    editing ? 'bg-white' : 'bg-gray-50'
                  }`}
                />
              </div>

              {/* Vârsta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vârsta
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
                  className={`w-full p-2 border border-gray-300 rounded ${
                    editing ? 'bg-white' : 'bg-gray-50'
                  }`}
                />
              </div>

              {/* Telefon */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="Introdu numărul de telefon"
                  className={`w-full p-2 border border-gray-300 rounded ${
                    editing ? 'bg-white' : 'bg-gray-50'
                  }`}
                />
              </div>

              {/* Biografie */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografie
                </label>
                <textarea
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="Scrie o scurtă descriere despre tine..."
                  rows="3"
                  maxLength="500"
                  className={`w-full p-2 border border-gray-300 rounded ${
                    editing ? 'bg-white' : 'bg-gray-50'
                  }`}
                />
                {editing && (
                  <p className="text-sm text-gray-500 mt-1">
                    {(profile.bio || '').length}/500 caractere
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Schimbare parolă */}
          <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Security</h2>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                {showPasswordForm ? 'Anulează' : 'Schimbă Parola'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parola curentă
                  </label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      current_password: e.target.value
                    }))}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parola nouă
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      new_password: e.target.value
                    }))}
                    required
                    minLength="6"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmă parola nouă
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirm_password: e.target.value
                    }))}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 disabled:bg-red-300"
                >
                  {saving ? 'Se schimbă...' : 'Schimbă Parola'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Statistici */}
        <div className="space-y-6">
          {/* Avatar */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {/* ✅ FOLOSIM FUNCȚIA SAFE getInitials() */}
              {getInitials()}
            </div>
            <h3 className="text-lg font-semibold">
              {/* ✅ FOLOSIM FUNCȚIA SAFE getDisplayName() */}
              {getDisplayName()}
            </h3>
            <p className="text-gray-600">@{profile.username || 'utilizator'}</p>
            {user?.isAdmin && (
              <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-2">
                👑 Administrator
              </span>
            )}
          </div>

          {/* Statistici */}
          {stats && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">📊 Statistici</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sondaje create:</span>
                  <span className="font-semibold">{stats.polls_created || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sondaje securizate:</span>
                  <span className="font-semibold">{stats.secure_polls_created || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total sondaje:</span>
                  <span className="font-semibold">{stats.total_polls_created || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membru din:</span>
                  <span className="font-semibold">
                    {stats.member_since ? new Date(stats.member_since).toLocaleDateString('ro-RO') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zile active:</span>
                  <span className="font-semibold">{stats.days_since_registration || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Informații despre cont */}
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Informații Cont</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Username-ul și email-ul nu pot fi modificate</li>
              <li>• Toate informațiile sunt opționale</li>
              <li>• Biografia poate avea maxim 500 caractere</li>
              <li>• Vârsta trebuie să fie între 13-120 ani</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;