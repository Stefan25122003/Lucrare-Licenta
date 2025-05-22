import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import cryptoService from '../services/cryptoService';
import { QRCodeSVG } from 'qrcode.react'; // Importăm pentru QR code
import QRInstructions from './QRInstructions'; // Importăm componenta cu instrucțiuni

const SecurePollDetail = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState('');
  const [showQR, setShowQR] = useState(false); // State pentru afișarea codului QR
  
  // Calculăm URL-ul complet pentru sondaj
  const baseUrl = window.location.origin;
  const pollUrl = `${baseUrl}/secure-polls/${pollId}`;

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        await cryptoService.initialize();
        const response = await axios.get(`http://localhost:5000/api/secure-polls/${pollId}`);
        setPoll(response.data);
      } catch (error) {
        console.error('Error fetching poll details:', error);
        setMessage('Error fetching poll details');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  const handleVote = async (optionIndex) => {
    setVoting(true);
    setMessage('Processing your anonymous vote...');
    
    try {
      // Get an anonymous voting token
      const votingToken = await cryptoService.getAnonymousVotingToken();
      
      // Cast vote anonymously
      await cryptoService.castVote(pollId, optionIndex, votingToken);
      
      setMessage('Vote cast successfully! Your vote was encrypted and anonymized.');
      // Refresh the poll data
      const response = await axios.get(`http://localhost:5000/api/secure-polls/${pollId}`);
      setPoll(response.data);
    } catch (error) {
      console.error('Error voting:', error);
      setMessage(error.response?.data?.message || 'Error casting your vote');
    } finally {
      setVoting(false);
    }
  };

  const closePoll = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/secure-polls/${pollId}/close`);
      setPoll(response.data);
      setMessage('Poll closed and results calculated');
    } catch (error) {
      console.error('Error closing poll:', error);
      setMessage('Failed to close poll');
    } finally {
      setLoading(false);
    }
  };

  // Toggle pentru afișarea/ascunderea codului QR
  const toggleQR = () => {
    setShowQR(!showQR);
  };

  if (loading) {
    return <div className="text-center py-10">Loading poll...</div>;
  }

  if (!poll) {
    return <div className="text-center py-10">Poll not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => navigate('/secure-polls')}
        className="mb-4 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
      >
        &larr; Back to All Polls
      </button>
      
      <div className="mb-6 p-4 bg-white rounded shadow">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold mb-2">{poll.title}</h1>
          
          {/* QR Code button */}
          <button 
            onClick={toggleQR}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            {showQR ? 'Ascunde QR' : 'Arată QR'}
          </button>
        </div>
        
        {/* QR Code display */}
        {showQR && (
          <div className="flex flex-col items-center my-4 p-4 bg-gray-50 rounded border">
            <div className="bg-white p-4 rounded shadow mb-2">
              <QRCodeSVG 
                value={pollUrl} 
                size={200}
                includeMargin={true}
              />
            </div>
            <p className="text-center text-sm mb-2">
              Scanează codul QR pentru a distribui acest sondaj
            </p>
            <p className="text-center text-xs text-gray-500 mb-2">
              URL: {pollUrl}
            </p>
            <QRInstructions />
          </div>
        )}
        
        <p className="mb-2 text-sm text-gray-500">
          Data închiderii: {new Date(poll.endDate).toLocaleString()}
        </p>
        
        {message && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
            {message}
          </div>
        )}
        
        {poll.isActive ? (
          <>
            <p className="mb-4 text-green-600 font-semibold">Votul este deschis</p>
            <div className="mb-4">
              {poll.options.map((option, index) => (
                <button
                  key={index}
                  className="block w-full text-left p-2 mb-2 bg-blue-50 hover:bg-blue-100 rounded"
                  onClick={() => handleVote(index)}
                  disabled={voting}
                >
                  {option.text}
                </button>
              ))}
            </div>
            
            <button
              onClick={closePoll}
              className="bg-red-500 text-white p-2 rounded"
              disabled={voting}
            >
              Închide Sondaj & Afișează Rezultate
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-red-600 font-semibold">Votul s-a închis</p>
            
            {/* Results section */}
            <div className="mt-4">
              <h3 className="font-bold mb-2">Rezultate:</h3>
              {poll.finalResults && poll.finalResults.map((result, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span>{result.text}</span>
                    <span>{result.votes} voturi</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2" 
                      style={{ 
                        width: `${(result.votes / poll.finalResults.reduce((sum, r) => sum + r.votes, 0) || 0) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SecurePollDetail;