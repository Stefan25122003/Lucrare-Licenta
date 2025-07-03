// RealSecurePollDetail.js - Component cu REAL client-side encryption
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import RealCryptoService from '../services/RealClientCryptoService';
import { CheckCircle, XCircle, Loader, ArrowLeft, ShieldCheck, Lock, Key } from 'lucide-react'; // Import icons

const RealSecurePollDetail = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cryptoStatus, setCryptoStatus] = useState(null);
  const [votingToken, setVotingToken] = useState(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [clientCryptoTest, setClientCryptoTest] = useState(null);
  const [tokenProgress, setTokenProgress] = useState(0);
  const [hasVoted, setHasVoted] = useState(false); // Adaugă state pentru verificarea votului
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(false); // State pentru loading verificare

  console.log('🚀 REAL Client-Side Crypto Poll Detail - pollId:', pollId);

  useEffect(() => {
    if (!pollId || pollId === 'undefined') {
      console.error('❌ Invalid pollId:', pollId);
      setError('ID-ul sondajului este invalid');
      setLoading(false);
      return;
    }

    fetchPoll();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      console.log('📡 Fetching poll with REAL client-side crypto:', pollId);
      
      const response = await axios.get(`http://localhost:5000/secure-polls/${pollId}`);
      
      console.log('✅ Poll fetched:', response.data);
      setPoll(response.data);
      
      // Initialize REAL client-side crypto
      try {
        await RealCryptoService.initializeForPoll(pollId);
        setCryptoStatus(RealCryptoService.getSystemInfo());
        console.log('🔐 REAL client-side crypto initialized');
        
        setMessage('✅ Sistemul criptografic client-side a fost inițializat cu succes! ' +
                   'Toate voturile vor fi criptate în browser-ul tău, serverul nu va vedea niciodată plaintext-ul.');
      } catch (cryptoError) {
        console.error('❌ Client-side crypto initialization failed:', cryptoError);
        setMessage('⚠️ Inițializarea sistemului criptografic client-side a eșuat. Votarea poate fi limitată.');
      }

      // Verifică dacă utilizatorul a votat deja
      if (user) {
        await checkIfUserHasVoted();
      }
      
    } catch (error) {
      console.error('❌ Error fetching poll:', error);
      
      if (error.response?.status === 404) {
        setError('Sondajul nu a fost găsit');
      } else {
        setError('Eroare la încărcarea sondajului');
      }
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru verificarea dacă utilizatorul a votat
  const checkIfUserHasVoted = async () => {
    if (!user || !pollId) return;

    setCheckingVoteStatus(true);
    try {
      console.log('🔍 Checking if user has voted on poll:', pollId);
      
      const response = await axios.get(
        `http://localhost:5000/secure-polls/${pollId}/vote-status`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('✅ Vote status response:', response.data);
      setHasVoted(response.data.has_voted);
      
      if (response.data.has_voted) {
        setMessage('✅ Ai votat deja la acest sondaj securizat!');
      }
      
    } catch (error) {
      console.error('❌ Error checking vote status:', error);
      
      if (error.response?.status === 401) {
        console.log('🔄 User not authenticated, vote status unknown');
        setHasVoted(false);
      } else if (error.response?.status === 404) {
        console.log('📭 No vote record found for this user');
        setHasVoted(false);
      } else {
        console.log('⚠️ Could not determine vote status, allowing voting');
        setHasVoted(false);
      }
    } finally {
      setCheckingVoteStatus(false);
    }
  };

  const generateClientSideVotingToken = async () => {
    if (!user) {
      setMessage('❌ Trebuie să fii autentificat pentru a obține un token de vot');
      return;
    }

    if (!pollId) {
      setMessage('❌ ID-ul sondajului este invalid');
      return;
    }

    if (votingToken) {
      setMessage('✅ Ai deja un token de vot valid generat pe client');
      return;
    }

    setGeneratingToken(true);
    setTokenProgress(0);
    setMessage('🔐 Se generează token-ul de vot anonim cu REAL client-side blind signatures...');

    try {
      console.log('🎫 Generating REAL client-side anonymous voting token...');
      const token = await RealCryptoService.getAnonymousVotingToken(pollId, user.token); // Pass user token for authentication
      setVotingToken(token);
      setMessage('✅ Token de vot anonim generat cu succes!');
    } catch (error) {
      console.error('❌ Error generating client-side voting token:', error);
      setMessage(error.response?.data?.detail || 'Eroare la generarea token-ului de vot pe client');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleClientSideVote = async (optionIndex) => {
    if (!user) {
      setMessage('❌ Trebuie să fii autentificat pentru a vota');
      return;
    }

    if (!poll.is_active) {
      setMessage('❌ Acest sondaj nu mai este activ');
      return;
    }

    if (hasVoted) {
      setMessage('❌ Ai votat deja la acest sondaj securizat');
      return;
    }

    if (!votingToken) {
      setMessage('❌ Trebuie să generezi mai întâi un token de vot anonim pe client');
      return;
    }

    setVoting(true);
    setMessage('🔐 Se procesează votul cu REAL client-side encryption și ZK proofs...');

    try {
      console.log('🗳️ Casting REAL client-side encrypted vote...');
      
      // REAL client-side vote processing
      const result = await RealCryptoService.castAnonymousVote(
        pollId, 
        optionIndex, 
        votingToken
      );

      console.log('✅ REAL client-side encrypted vote cast successfully:', result);
      
      setMessage(
        `✅ Votul tău a fost înregistrat cu succes folosind REAL client-side cryptography!\n\n` +
        `🔐 Criptare: ${result.client_side_processing.encryption}\n` +
        `🔒 Anonimitate: ${result.client_side_processing.anonymity}\n` +
        `🕵️ Dovezi: ${result.client_side_processing.proofs}\n` +
        `🛡️ Securitate: ${result.client_side_processing.security_level}\n\n` +
        `🚫 Serverul nu a văzut niciodată plaintext-ul votului tău!\n` +
        `🔒 Identitatea ta rămâne complet anonimă!\n` +
        `🔐 Votul a fost criptat în browser-ul tău cu Paillier!\n` +
        `🕵️ Zero-Knowledge Proofs au validat corectitudinea votului!`
      );
      
      // Clear token after use și marchează că utilizatorul a votat
      setVotingToken(null);
      setHasVoted(true);
      
      // Refresh poll data
      setTimeout(fetchPoll, 2000);
      
    } catch (error) {
      console.error('❌ Error casting REAL client-side vote:', error);
      
      if (error.response?.status === 400) {
        const detail = error.response.data.detail;
        if (detail && detail.includes('already voted')) {
          setMessage('❌ Ai votat deja la acest sondaj');
          setHasVoted(true);
          setVotingToken(null);
        } else if (detail && detail.includes('already used')) {
          setMessage('❌ Token-ul de vot a fost deja folosit');
          setVotingToken(null);
        } else if (detail && detail.includes('Invalid')) {
          setMessage('❌ Validarea criptografică pe client a eșuat');
          setVotingToken(null);
        } else {
          setMessage(`❌ ${detail || 'Eroare la votare'}`);
        }
      } else if (error.response?.status === 401) {
        setMessage('❌ Token invalid sau expirat. Te rog să te loghezi din nou.');
        logout();
      } else {
        setMessage('❌ Eroare la înregistrarea votului criptat pe client');
      }
    } finally {
      setVoting(false);
    }
  };

  const testClientSideCrypto = async () => {
    try {
      setMessage('🧪 Testez funcționalitatea REAL client-side crypto...');
      
      const testResults = await RealCryptoService.testClientSideCrypto(pollId);
      setClientCryptoTest(testResults);
      
      if (testResults.success) {
        setMessage(
          `✅ Toate testele REAL client-side crypto au trecut cu succes!\n\n` +
          `🔐 Teste trecute: ${testResults.tests_passed}\n` +
          `🛡️ Securitate client-side: ${testResults.client_side_security}\n\n` +
          `Sistemul criptografic este complet funcțional în browser!`
        );
      } else {
        setMessage(`⚠️ Unele teste client-side au eșuat: ${testResults.error}`);
      }
      
    } catch (error) {
      console.error('❌ Error testing client-side crypto:', error);
      setMessage('❌ Eroare la testarea funcționalității client-side crypto');
    }
  };

  const validateClientSideSignature = () => {
    if (!votingToken) {
      setMessage('❌ Nu există token pentru validare pe client');
      return;
    }
    
    try {
      // Use the client-side signature verification
      const isValid = RealCryptoService.blindSignatures.verifySignature(
        votingToken.signature, 
        votingToken.message
      );
      
      setMessage(
        isValid ? 
        '✅ Semnătura RSA este validă criptografic pe CLIENT-SIDE!\n🔐 Verificare matematică completă în browser!' : 
        '❌ Semnătura RSA nu este validă la verificarea pe client'
      );
    } catch (error) {
      setMessage('❌ Eroare la validarea semnăturii pe client');
    }
  };

  if (loading || checkingVoteStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-12 w-12 text-blue-500" />
        <p className="text-gray-600 mt-4">
          {loading ? 'Se încarcă sondajul...' : 'Se verifică statusul votului...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <XCircle className="h-6 w-6 mr-2" />
          {error}
        </div>
        <button onClick={() => navigate('/secure-polls')} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Înapoi la Sondaje Securizate
        </button>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Sondajul nu a fost găsit</p>
          <button onClick={() => navigate('/secure-polls')} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Înapoi la Sondaje Securizate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <button onClick={() => navigate('/secure-polls')} className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Înapoi la Sondaje Securizate
      </button>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <ShieldCheck className="h-6 w-6 mr-2 text-purple-500" />
          {poll.title}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <span>
            <Lock className="h-4 w-4 mr-1 inline text-gray-500" />
            Creat: {new Date(poll.created_at).toLocaleDateString('ro-RO')}
          </span>
          {poll.end_date && (
            <span>
              <Key className="h-4 w-4 mr-1 inline text-gray-500" />
              Încheiere: {new Date(poll.end_date).toLocaleString('ro-RO')}
            </span>
          )}
          <span className={`px-2 py-1 rounded text-xs ${poll.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {poll.is_active ? '🟢 Activ' : '🔴 Închis'}
          </span>
        </div>
        
        <div className="mb-6">

          {/* Client crypto test results */}
          {clientCryptoTest && (
            <div className="bg-gray-50 p-4 rounded-lg border mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">🧪 Rezultate Test Client-Side Crypto:</h3>
              <div className={`p-3 rounded ${clientCryptoTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="font-semibold">
                  {clientCryptoTest.success ? '✅ Toate testele au trecut' : '❌ Unele teste au eșuat'}
                </p>
                {clientCryptoTest.tests_passed && (
                  <p className="text-sm">Teste trecute: {clientCryptoTest.tests_passed}</p>
                )}
                {clientCryptoTest.client_side_security && (
                  <p className="text-sm">Securitate: {clientCryptoTest.client_side_security}</p>
                )}
                {clientCryptoTest.error && (
                  <p className="text-sm text-red-600">Eroare: {clientCryptoTest.error}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded whitespace-pre-line ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 
            message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
            message.includes('🧪') ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* REAL client-side voting workflow */}
        {poll.is_active ? (
          <div className="space-y-6">
            {/* Afișează mesaj dacă utilizatorul a votat deja */}
            {hasVoted ? (
              <div className="bg-green-50 p-6 rounded-lg border-4 border-green-500">
                <h2 className="text-xl font-semibold mb-4 text-green-800">
                  ✅ Ai votat deja la acest sondaj
                </h2>
                <div className="text-green-700 space-y-2">
                  <p>🔐 <strong>Votul tău securizat a fost înregistrat cu succes!</strong></p>
                  <p>🛡️ Identitatea ta rămâne complet anonimă datorită criptografiei client-side</p>
                  <p>📊 Rezultatele vor fi disponibile când sondajul se încheie</p>
                  <p>🚫 Nu poți vota din nou pentru a preveni dublarea voturilor</p>
                </div>
                
                <div className="mt-4 p-3 bg-green-100 rounded text-sm">
                  <strong>🔒 Garanții de privacy:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Votul tău a fost criptat în browser cu Paillier</li>
                    <li>• Serverul nu a văzut niciodată plaintext-ul votului</li>
                    <li>• Semnătura oarbă RSA garantează anonimitatea</li>
                    <li>• Zero-Knowledge Proofs au validat corectitudinea</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: Generate client-side token */}
                {!votingToken ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                      Primul pas: Obține o semnătură care îți validează votul
                    </h2>
                    <p className="text-gray-700 mb-4">
                      Pentru a vota anonim, trebuie mai intai sa faci rost de un buletin de vot semnat de autoritatea centrala.
                    </p>
                    <button
                      onClick={generateClientSideVotingToken}
                      disabled={generatingToken}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {generatingToken ? (
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-3"></div>
                            <span>Se generează token-ul CLIENT-SIDE...</span>
                          </div>
                          <div className="w-full bg-blue-300 rounded-full h-2">
                            <div 
                              className="bg-white rounded-full h-2 transition-all duration-300 ease-out"
                              style={{ width: `${tokenProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs opacity-75">
                            {tokenProgress < 30 && "🔐 Generare chei RSA..."}
                            {tokenProgress >= 30 && tokenProgress < 60 && "🔒 Blinding mesaj..."}
                            {tokenProgress >= 60 && tokenProgress < 90 && "📡 Cerere semnătură..."}
                            {tokenProgress >= 90 && "✅ Unblinding & verificare..."}
                          </span>
                        </div>
                      ) : (
                        'Cere un buletin de vot'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2 text-green-800">
                      ✅ Token de Vot Anonim Obținut pe CLIENT-SIDE
                    </h2>
                    <p className="text-green-700 text-sm mb-4">
                      Token-ul tău a fost generat prin procesul de <strong>REAL RSA blind signatures în browser</strong>.
                      <br />
                      <strong>Mesaj:</strong> {votingToken.message?.substring(0, 30)}...
                      <br />
                      <strong>Semnătură:</strong> {votingToken.signature?.substring(0, 30)}...
                      <br />
                      <strong>Verificat pe client:</strong> {votingToken.client_verified ? '✅ Da' : '❌ Nu'}
                    </p>
                    <button
                      onClick={validateClientSideSignature}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 mr-2"
                    >
                      🔍 Validează Semnătura pe Client
                    </button>
                  </div>
                )}

                {/* Step 2: Client-side voting */}
                {votingToken && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      🗳️ Pasul 2: Alege Opțiunea de Vot (cu Client-Side Encryption)
                    </h2>
                    <div className="bg-purple-50 p-3 rounded mb-4 text-sm text-purple-800">
                      <strong>🔐 Client-Side Processing:</strong>
                      <br />• Votul va fi criptat în browser-ul tău cu Paillier
                      <br />• Zero-Knowledge Proofs generate pe client pentru validare
                      <br />• Serverul nu va vedea niciodată plaintext-ul votului
                      <br />• Anonimitate completă garantată criptografic
                    </div>
                    <div className="space-y-3">
                      {poll.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleClientSideVote(index)}
                          disabled={voting}
                          className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{option.text}</span>
                            {voting && (
                              <span className="text-sm text-gray-500">
                                🔐 Se criptează pe CLIENT-SIDE cu Paillier...
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Final results with client-side privacy preservation
          <div>
            <h2 className="text-xl font-semibold mb-4">📊 Rezultate Finale (Homomorphic Tallying):</h2>
            {poll.final_results ? (
              <div className="space-y-3">
                {poll.final_results.map((result, index) => {
                  const totalVotes = poll.final_results.reduce((sum, r) => sum + r.votes, 0);
                  const percentage = totalVotes > 0 ? (result.votes / totalVotes * 100) : 0;
                  
                  return (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{result.option}</span>
                        <span className="text-sm font-semibold">
                          {result.votes} voturi ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-3 rounded">
                        <div 
                          className="bg-blue-500 h-3 rounded transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                <div className="text-center text-sm text-gray-600 mt-4">
                  <strong>Total voturi (calculat cu homomorphic tallying):</strong> {poll.final_results.reduce((sum, r) => sum + r.votes, 0)}
                </div>
                
                {/* Client-side privacy preservation info */}
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h3 className="font-semibold text-purple-800 mb-2">🔐 Protecția Privacy-ului Client-Side:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
                    <div>
                      <p><strong>🔒 Criptare:</strong> Client-Side Paillier în browser</p>
                      <p><strong>🕵️ Anonimitate:</strong> RSA Blind Signatures pe client</p>
                    </div>
                    <div>
                      <p><strong>🛡️ Privacy:</strong> Server nu a văzut plaintext-ul</p>
                      <p><strong>🔐 Tallying:</strong> Homomorphic aggregation</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-purple-600">
                    <strong>Rezultatele sunt corecte dar privacy-ul individual este păstrat pentru totdeauna!</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Rezultatele nu sunt încă disponibile.</p>
            )}
          </div>
        )}

        
      </div>
    </div>
  );
};

export default RealSecurePollDetail;