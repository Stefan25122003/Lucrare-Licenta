import React, { useState, useEffect } from 'react';
import axios from 'axios';
import cryptoService from '../services/cryptoService';

const SecurePolls = () => {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ 
    title: '', 
    options: ['', ''],
    endDate: '' 
  });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Initialize the crypto service and fetch polls
    const init = async () => {
      try {
        await cryptoService.initialize();
        fetchPolls();
      } catch (error) {
        console.error('Failed to initialize:', error);
        setMessage('Failed to initialize secure voting system');
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/secure-polls');
      setPolls(response.data);
    } catch (error) {
      console.error('Error fetching secure polls:', error);
      setMessage('Error fetching secure polls');
    }
  };

  const createPoll = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/secure-polls', {
        ...newPoll
      });
      setPolls([...polls, response.data]);
      setNewPoll({ title: '', options: ['', ''], endDate: '' });
      setMessage('Poll created successfully');
    } catch (error) {
      console.error('Error creating secure poll:', error);
      setMessage('Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionIndex, totalOptions) => {
    setVoting(true);
    setMessage('Processing your anonymous vote...');
    
    try {
      // Get an anonymous voting token
      const votingToken = await cryptoService.getAnonymousVotingToken();
      
      // Cast vote anonymously
      await cryptoService.castVote(pollId, optionIndex, votingToken);
      
      setMessage('Vote cast successfully! Your vote was encrypted and anonymized.');
      fetchPolls(); // Refresh the polls
    } catch (error) {
      console.error('Error voting:', error);
      setMessage(error.response?.data?.message || 'Error casting your vote');
    } finally {
      setVoting(false);
    }
  };

  const closePoll = async (pollId) => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/secure-polls/${pollId}/close`);
      setPolls(polls.map(poll => poll._id === pollId ? response.data : poll));
      setMessage('Poll closed and results calculated');
    } catch (error) {
      console.error('Error closing poll:', error);
      setMessage('Failed to close poll');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading secure polls...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl mb-6">Sondaje Anonime Securizate</h1>
      
      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
          {message}
        </div>
      )}
      
      {/* Poll creation form */}
      <form onSubmit={createPoll} className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Creează Sondaj Nou Securizat</h2>
        <input
          type="text"
          value={newPoll.title}
          onChange={(e) => setNewPoll({...newPoll, title: e.target.value})}
          placeholder="Titlu sondaj"
          required
          className="w-full p-2 mb-4 border rounded"
        />
        
        <label className="block mb-2">Data închiderii</label>
        <input
          type="datetime-local"
          value={newPoll.endDate}
          onChange={(e) => setNewPoll({...newPoll, endDate: e.target.value})}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        
        {newPoll.options.map((option, index) => (
          <input
            key={index}
            type="text"
            value={option}
            onChange={(e) => {
              const newOptions = [...newPoll.options];
              newOptions[index] = e.target.value;
              setNewPoll({...newPoll, options: newOptions});
            }}
            placeholder={`Opțiunea ${index + 1}`}
            required
            className="w-full p-2 mb-2 border rounded"
          />
        ))}
        
        <button 
          type="button"
          onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})}
          className="bg-gray-200 p-2 rounded mr-2 mb-2"
        >
          Adaugă Opțiune
        </button>
        
        <button 
          type="submit" 
          className="bg-green-500 text-white p-2 rounded"
          disabled={voting}
        >
          Creează Sondaj Securizat
        </button>
      </form>

      {/* Poll list */}
      {polls.length === 0 ? (
        <p>Nu există sondaje securizate disponibile.</p>
      ) : (
        polls.map(poll => (
          <div key={poll._id} className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-2">{poll.title}</h2>
            
            <p className="mb-2 text-sm text-gray-500">
              Data închiderii: {new Date(poll.endDate).toLocaleString()}
            </p>
            
            {poll.isActive ? (
              <>
                <p className="mb-4 text-green-600 font-semibold">Votul este deschis</p>
                <div className="mb-4">
                  {poll.options.map((option, index) => (
                    <button
                      key={index}
                      className="block w-full text-left p-2 mb-2 bg-blue-50 hover:bg-blue-100 rounded"
                      onClick={() => handleVote(poll._id, index, poll.options.length)}
                      disabled={voting}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => closePoll(poll._id)}
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
        ))
      )}
    </div>
  );
};

export default SecurePolls;