import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileData, setProfileData] = useState({
    username: user ? user.username : '',
    email: user ? user.email : '',
    fullName: '',
    bio: '',
    location: '',
    phoneNumber: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      // Încarcă datele complete ale profilului
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:5000/api/users/profile`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          setProfileData({
            username: user.username,
            email: user.email,
            fullName: response.data.fullName || '',
            bio: response.data.bio || '',
            location: response.data.location || '',
            phoneNumber: response.data.phoneNumber || '',
          });

          if (response.data.profileImage) {
            setPreviewImage(`http://localhost:5000/${response.data.profileImage}`);
          }
          
        } catch (error) {
          console.error('Error fetching profile:', error);
          setMessage('Nu am putut încărca datele profilului');
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Creează URL pentru previzualizare
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Creează un FormData object pentru a trimite și fișierul
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
      });
      
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await axios.put(`http://localhost:5000/api/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Actualizează datele utilizatorului în context
      if (updateUserData && typeof updateUserData === 'function') {
        updateUserData(response.data);
      }

      setMessage('Profilul a fost actualizat cu succes!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(error.response?.data?.message || 'Eroare la actualizarea profilului');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (!user) {
    return <div className="text-center py-10">Trebuie să fii autentificat pentru a vedea această pagină</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Profilul meu</h1>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('succes') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
        {/* Secțiunea pentru imagine de profil */}
        <div className="mb-6 flex flex-col items-center">
          <div 
            className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-2 cursor-pointer"
            onClick={triggerFileInput}
          >
            {previewImage ? (
              <img 
                src={previewImage} 
                alt="Imagine profil" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
          <button 
            type="button"
            onClick={triggerFileInput}
            className="text-blue-500 hover:text-blue-700"
          >
            Schimbă poza de profil
          </button>
        </div>

        {/* Detalii profil */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Nume utilizator</label>
            <input
              type="text"
              name="username"
              value={profileData.username}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">Numele de utilizator nu poate fi modificat</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">Emailul nu poate fi modificat</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Nume complet</label>
            <input
              type="text"
              name="fullName"
              value={profileData.fullName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Locație</label>
            <input
              type="text"
              name="location"
              value={profileData.location}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Număr de telefon</label>
            <input
              type="text"
              name="phoneNumber"
              value={profileData.phoneNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Biografie</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              rows="4"
              className="w-full p-2 border rounded"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`mt-6 w-full py-2 px-4 rounded ${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          {loading ? 'Se actualizează...' : 'Salvează modificările'}
        </button>
      </form>
    </div>
  );
};

export default Profile;