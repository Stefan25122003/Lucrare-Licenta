// SecurePolls.js - FIXED cu verificări admin corecte
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import realClientCryptoService from '../services/RealClientCryptoService';
import api from '../services/api';

const SecurePolls = () => {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ 
    title: '', 
    options: ['', ''], 
    end_date: '' 
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [localResults, setLocalResults] = useState(null);
  const [qrPollId, setQrPollId] = useState(null);
  const { user, logout, isAdmin } = useAuth(); // ✅ FIX: Importă isAdmin din context

  useEffect(() => {
    console.log('🚀 Component mounted, fetching polls...');
    console.log('👤 Current user:', user);
    console.log('🔑 Is admin (from context):', isAdmin);
    console.log('🔑 User.is_admin:', user?.is_admin);
    fetchSecurePolls();
  }, [user, isAdmin]);

  const fetchSecurePolls = async () => {
    try {
      setFetchLoading(true);
      console.log('📡 Making request to: http://localhost:5000/secure-polls/');
      
      const response = await axios.get('http://localhost:5000/secure-polls/');
      
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);
      
      if (Array.isArray(response.data)) {
        setPolls(response.data);
        console.log(`✅ Set ${response.data.length} polls in state`);
      } else {
        console.error('❌ Response data is not an array:', response.data);
        setMessage('❌ Format de date invalid de la server');
      }
      
    } catch (error) {
      console.error('❌ Error fetching secure polls:', error);
      setMessage('❌ Eroare la încărcarea sondajelor securizate');
    } finally {
      setFetchLoading(false);
    }
  };

  const createSecurePoll = async (e) => {
    e.preventDefault();
    
    // ✅ FIX: Verifică admin status corect
    const userIsAdmin = isAdmin || user?.is_admin || false;
    
    if (!user || !userIsAdmin) {
      setMessage('❌ Doar administratorii pot crea sondaje securizate');
      console.log('❌ Admin check failed:', { user: !!user, isAdmin, userIs_admin: user?.is_admin, userIsAdmin });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('❌ Nu ești autentificat. Te rog să te loghezi din nou.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (!newPoll.title.trim()) {
        setMessage('❌ Titlul este obligatoriu');
        return;
      }

      const validOptions = newPoll.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        setMessage('❌ Sunt necesare cel puțin 2 opțiuni');
        return;
      }

      if (!newPoll.end_date) {
        setMessage('❌ Data de încheiere este obligatorie');
        return;
      }

      const pollData = {
        title: newPoll.title.trim(),
        options: validOptions,
        end_date: new Date(newPoll.end_date).toISOString()
      };

      console.log('🔐 Creating secure poll:', pollData);

      const response = await axios.post('http://localhost:5000/secure-polls/', pollData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Secure poll created:', response.data);
      
      // Refresh polls
      await fetchSecurePolls();
      
      setNewPoll({ title: '', options: ['', ''], end_date: '' });
      setMessage('✅ Sondaj securizat creat cu succes!');
      
    } catch (error) {
      console.error('❌ Error creating secure poll:', error);
      
      if (error.response?.status === 401) {
        setMessage('❌ Token invalid sau expirat. Te rog să te loghezi din nou.');
        logout();
      } else if (error.response?.status === 403) {
        setMessage('❌ Nu ai permisiunea să creezi sondaje securizate');
      } else {
        setMessage(`❌ ${error.response?.data?.detail || 'Eroare la crearea sondajului'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const closeSecurePoll = async (pollId) => {
    if (!window.confirm('Sigur vrei să închizi și să calculezi rezultatele acestui sondaj?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('❌ Nu ești autentificat.');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/secure-polls/${pollId}/close`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Poll closed:', response.data);
      setMessage('✅ Sondaj închis și rezultate calculate cu succes!');
      
      await fetchSecurePolls();
      
    } catch (error) {
      console.error('❌ Error closing poll:', error);
      if (error.response?.status === 401) {
        logout();
      } else {
        setMessage(`❌ ${error.response?.data?.detail || 'Eroare la închiderea sondajului'}`);
      }
    }
  };

  const downloadCryptotexts = async (pollId, format) => {
    try {
      setMessage(`📁 Pregătire download cryptotexts (${format.toUpperCase()})...`);
      
      await realClientCryptoService.downloadCryptotexts(pollId, format);
      
      setMessage(`✅ Cryptotexts descărcate cu succes în format ${format.toUpperCase()}!`);
      
    } catch (error) {
      console.error('❌ Error downloading cryptotexts:', error);
      
      if (error.response?.status === 403) {
        setMessage('❌ Nu ai permisiunea să exporti cryptotextele');
      } else if (error.response?.status === 400) {
        setMessage('❌ Sondajul trebuie să fie închis pentru export');
      } else {
        setMessage('❌ Eroare la descărcarea cryptotextelor: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const analyzeCryptotexts = async (pollId) => {
    try {
      setMessage('🔬 Analizare cryptotexts în curs...');

      const analysis = await realClientCryptoService.analyzeCryptotexts(pollId);
      setAnalysisResults(analysis);
      
      setMessage('✅ Analiza cryptotextelor completă! Verifică rezultatele mai jos.');
      
    } catch (error) {
      console.error('❌ Error analyzing cryptotexts:', error);
      setMessage('❌ Eroare la analiza cryptotextelor: ' + (error.response?.data?.detail || error.message));
    }
  };

  // handleFile: parse export JSON and extract poll_id + cryptotexts
  const handleFile = async e => {
    const text = await e.target.files[0].text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return alert('Fișier JSON invalid!');
    }
    const pollId    = data.poll_info?.id;
    const cryptos   = Array.isArray(data.encrypted_votes)
                     ? data.encrypted_votes
                     : [];
    if (!pollId || cryptos.length === 0) {
      return alert('Format nerecunoscut: fișierul trebuie să conțină poll_info.id și encrypted_votes array!');
    }
    setFileData({ pollId, cryptotexts: cryptos });
  };

  // handleLocalTally: send only the encrypted_votes array to backend
  const handleLocalTally = async () => {
    if (!fileData?.pollId) {
      return alert('Încarcă mai întâi un fișier JSON valid!');
    }
    try {
      const resp = await api.post(
        `/secure-polls/${fileData.pollId}/local-tally`,
        // backend expects List[Dict], so pass array of vote objects
        fileData.cryptotexts
      );
      setLocalResults(resp.data);
    } catch (err) {
      console.error(err);
      alert('Eroare la calcul local: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Early return for auth check
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h1 className="text-2xl mb-4">Acces Restricționat</h1>
          <p className="text-gray-600">Trebuie să te autentifici pentru a vedea sondajele securizate.</p>
        </div>
      </div>
    );
  }

  // ✅ FIX: Calculează admin status corect
  const userIsAdmin = isAdmin || user?.is_admin || false;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🔐 Sondaje Securizate</h1>
        <button 
          onClick={fetchSecurePolls}
          disabled={fetchLoading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300"
        >
          {fetchLoading ? '🔄 Se încarcă...' : '🔄 Reîncarcă'}
        </button>
      </div>
      
      {/* Debug info - Enhanced */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
        <strong>🔍 Debug Info:</strong><br />
        • User: {user?.username} ({user?.email})<br />
        • Admin din context: {isAdmin ? '✅ Da' : '❌ Nu'}<br />
        • Admin din user: {user?.is_admin ? '✅ Da' : '❌ Nu'}<br />
        • Admin final: {userIsAdmin ? '✅ Da' : '❌ Nu'}<br />
        • Polls în state: {polls.length}<br />
        • Loading: {fetchLoading ? 'Da' : 'Nu'}
      </div>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('✅') || message.includes('succes') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* ✅ FIX: Admin form - folosește userIsAdmin */}
      {userIsAdmin && (
        <form onSubmit={createSecurePoll} className="mb-8 p-4 bg-white rounded shadow border-2 border-green-200">
          <h2 className="text-xl font-bold mb-4 text-green-700">
            🛡️ Creează Sondaj Securizat (Admin)
          </h2>
          <div className="bg-green-50 p-2 rounded mb-4 text-sm text-green-800">
            ✅ Acces admin confirmat pentru {user.username}
          </div>
          
          <input
            type="text"
            value={newPoll.title}
            onChange={(e) => setNewPoll({...newPoll, title: e.target.value})}
            placeholder="Titlu sondaj securizat"
            required
            className="w-full p-2 mb-4 border rounded"
          />

          <input
            type="datetime-local"
            value={newPoll.end_date}
            onChange={(e) => setNewPoll({...newPoll, end_date: e.target.value})}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          
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
                className="flex-1 p-2 border rounded"
              />
              {newPoll.options.length > 2 && (
                <button 
                  type="button"
                  onClick={() => {
                    const newOptions = newPoll.options.filter((_, i) => i !== index);
                    setNewPoll({...newPoll, options: newOptions});
                  }}
                  className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          
          <div className="flex gap-2 mt-4">
            <button 
              type="button"
              onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              disabled={loading}
            >
              + Adaugă Opțiune
            </button>
            
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? 'Se creează...' : 'Creează Sondaj Securizat'}
            </button>
          </div>
        </form>
      )}

      {/* Tally local din fișier JSON - noua secțiune */}
      {/* <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h2 className="text-lg font-semibold mb-2">Tally local din fișier JSON</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1">Încarcă cryptotexts:</label>
            <input
              type="file"
              accept="application/json"
              onChange={handleFile}
              className="block"
            />
          </div>
          <button
            onClick={handleLocalTally}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Calculează local
          </button>
        </div>

        {localResults && (
          <div className="mt-4 bg-white p-3 rounded border border-gray-200">
            <h3 className="font-semibold mb-2">Rezultate locale:</h3>
            {Object.entries(localResults).map(([opt, cnt]) => (
              <div key={opt} className="flex justify-between py-1">
                <span>Opțiunea {opt}</span>
                <span className="font-bold">{cnt} voturi</span>
              </div>
            ))}
          </div>
        )}
      </div> */}

      {/* ✅ FIX: Mesaj pentru non-admin */}
      {!userIsAdmin && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-xl font-bold mb-2 text-red-700">🔒 Acces Restricționat</h2>
          <p className="text-red-600">
            Doar administratorii pot crea sondaje securizate. 
            Utilizatorul curent ({user.username}) nu are privilegii de administrator.
          </p>
        </div>
      )}

      {/* Loading state */}
      {fetchLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă sondajele securizate...</p>
        </div>
      )}

      {/* Polls list */}
      {!fetchLoading && (
        polls.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-4">Nu există sondaje securizate disponibile.</p>
            {userIsAdmin && (
              <p className="text-sm">Creează primul sondaj securizat folosind formularul de mai sus.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="text-sm text-gray-600 mb-4">
              Afișez {polls.length} sondaje securizate:
            </div>
            {polls.map((poll, index) => {
              if (!poll._id) {
                return (
                  <div key={`error-${index}`} className="bg-red-50 p-4 rounded border border-red-200">
                    ❌ Sondaj cu date incomplete (lipsește ID)
                  </div>
                );
              }

              return (
                <div key={poll._id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold mb-2">{poll.title}</h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>📅 Creat: {new Date(poll.created_at).toLocaleDateString('ro-RO')}</span>
                        {poll.end_date && (
                          <span>⏰ Încheiere: {new Date(poll.end_date).toLocaleString('ro-RO')}</span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          poll.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {poll.is_active ? '🟢 Activ' : '🔴 Închis'}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          📊 {poll.total_votes || 0} voturi
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/secure-polls/${poll._id}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                      >
                        {poll.is_active ? '🗳️ Votează' : '📊 Vezi Rezultate'}
                      </Link>
                      
                      <button
                        onClick={() => setQrPollId(poll._id)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm"
                      >
                        📱 Vezi QR
                      </button>
                      
                      {poll.is_active && (userIsAdmin || poll.creator_id === user.id) && (
                        <button
                          onClick={() => closeSecurePoll(poll._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                        >
                          🔒 Închide Sondaj
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Options */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-700 mb-2">Opțiuni:</h3>
                    {poll.options && poll.options.map && poll.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{option.text}</span>
                        {poll.final_results && (
                          <span className="text-sm text-gray-600">
                            ({poll.final_results.find(r => r.option === option.text)?.votes || 0} voturi)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Final results */}
                  {poll.final_results && (
                    <div className="mt-4 p-4 bg-gray-100 rounded">
                      <h3 className="font-bold mb-2">Rezultate Finale:</h3>
                      {poll.final_results.map((result, resIndex) => (
                        <div key={resIndex} className="flex justify-between">
                          <span>{result.option}</span>
                          <span className="font-semibold">{result.votes} voturi</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Export Cryptotexts Section - doar pentru sondaje închise */}
                  {!poll.is_active && (userIsAdmin || poll.creator_id === user.id) && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-bold text-purple-800 mb-3">
                        Export Cryptotexts 
                      </h4>
                      <p className="text-sm text-purple-700 mb-3">
                        Exportă cryptotextele pentru analiză criptografică sau audit de securitate.
                        Toate datele rămân anonime și criptate.
                      </p>
                      
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => downloadCryptotexts(poll._id, 'json')}
                          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 text-sm"
                        >
                          📄 Download JSON
                        </button>
                        
                        {/* <button
                          onClick={() => downloadCryptotexts(poll._id, 'csv')}
                          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 text-sm"
                        >
                          📊 Download CSV
                        </button> */}
                        
                        {/* <button
                          onClick={() => analyzeCryptotexts(poll._id)}
                          className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 text-sm"
                        >
                          🔬 Analiză Crypto
                        </button> */}
                      </div>
                    </div>
                  )}
                  
                  {/* Debug info per poll */}
                  <div className="mt-4 text-xs text-gray-500 border-t pt-2">
                    🔐 Criptat cu Paillier | 🔒 Semnături oarbe RSA | 🕵️ Anonim complet
                    <br />
                    DEBUG: ID={poll._id} | Creator={poll.creator_username} | Active={poll.is_active}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Rezultate analiză cryptotexts */}
      {analysisResults && (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-xl font-bold mb-4">🔬 Rezultate Analiză Cryptotexts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-gray-800">🛡️ Scor Anonimitate</h4>
              <p className="text-2xl font-bold text-green-600">{analysisResults.security_metrics.anonymity_score}%</p>
              <p className="text-sm text-gray-600">Blind signatures garantează anonimitatea</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-gray-800">✅ Scor Integritate</h4>
              <p className="text-2xl font-bold text-blue-600">{analysisResults.security_metrics.integrity_score}%</p>
              <p className="text-sm text-gray-600">Voturi cu ZK proofs</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-gray-800">🔍 Scor Verificabilitate</h4>
              <p className="text-2xl font-bold text-purple-600">{analysisResults.security_metrics.verifiability_score}%</p>
              <p className="text-sm text-gray-600">Voturi cu semnături</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-800 mb-3">📊 Statistici Criptografice</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Total voturi criptate:</span>
                <p className="text-lg font-bold">{analysisResults.cryptographic_analysis.total_encrypted_votes}</p>
              </div>
              <div>
                <span className="font-medium">Coverage ZK Proofs:</span>
                <p className="text-lg font-bold">{analysisResults.cryptographic_analysis.zk_proof_coverage}%</p>
              </div>
              <div>
                <span className="font-medium">Coverage Semnături:</span>
                <p className="text-lg font-bold">{analysisResults.cryptographic_analysis.signature_coverage}%</p>
              </div>
              <div>
                <span className="font-medium">Metoda Crypto:</span>
                <p className="text-sm">Paillier + RSA + ZKP</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setAnalysisResults(null)}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Închide Analiza
          </button>
        </div>
      )}

      {/* Tally local din fișier JSON - secțiune mutată mai sus */}

      {/* QR modal */}
      {qrPollId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-full max-w-sm space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800">Scanează pentru a deschide sondajul</h3>
            <QRCode 
              value={`${window.location.origin}/secure-polls/${qrPollId}`} 
              size={220}
              className="mx-auto"
            />
            <button
              onClick={() => setQrPollId(null)}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Închide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurePolls;