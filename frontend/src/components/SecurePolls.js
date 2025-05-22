import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  // Calculăm URL-ul de bază al aplicației
  const baseUrl = window.location.origin;

  useEffect(() => {
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
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <h2 className="text-xl font-bold mb-2">
                  <Link to={`/secure-polls/${poll._id}`} className="text-blue-600 hover:underline">
                    {poll.title}
                  </Link>
                </h2>
                
                <p className="mb-2 text-sm text-gray-500">
                  Data închiderii: {new Date(poll.endDate).toLocaleString()}
                </p>
                
                <p className={`mb-4 font-semibold ${poll.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {poll.isActive ? 'Votul este deschis' : 'Votul s-a închis'}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <Link 
                to={`/secure-polls/${poll._id}`}
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Deschide Sondaj
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SecurePolls;