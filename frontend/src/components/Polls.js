import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ title: '', options: ['', ''] });
  const { user } = useAuth();

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/polls');
        setPolls(response.data);
      } catch (error) {
        console.error('Eroare la preluarea sondajelor', error);
      }
    };
    fetchPolls();
  }, []);

  const handleVote = async (pollId, optionIndex) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/polls/${pollId}/vote`, {
        optionIndex,
        userId: user.id
      });
      
      setPolls(polls.map(poll => 
        poll._id === pollId ? response.data : poll
      ));
    } catch (error) {
      alert(error.response?.data?.message || 'Votare eșuată');
    }
  };

  const createPoll = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/polls', {
        ...newPoll,
        userId: user.id
      });
      setPolls([...polls, response.data]);
      setNewPoll({ title: '', options: ['', ''] });
    } catch (error) {
      alert('Creare sondaj eșuată');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl mb-6">Sondaje Active</h1>
      
      {/* Formular creare sondaj */}
      <form onSubmit={createPoll} className="mb-8 p-4 bg-white rounded shadow">
        <input
          type="text"
          value={newPoll.title}
          onChange={(e) => setNewPoll({...newPoll, title: e.target.value})}
          placeholder="Titlu sondaj"
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
          className="bg-blue-200 p-2 rounded mr-2 mb-2"
        >
          Adaugă opțiune
        </button>
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded"
        >
          Creează sondaj
        </button>
      </form>

      {/* Lista sondaje */}
      {polls.map(poll => (
        <div key={poll._id} className="mb-6 p-4 bg-white rounded shadow">
          <h2 className="text-xl font-bold mb-4">{poll.title}</h2>
          {poll.options.map((option, index) => (
            <div 
              key={index} 
              className="flex items-center mb-2 cursor-pointer"
              onClick={() => handleVote(poll._id, index)}
            >
              <div 
                className="bg-blue-200 h-6 mr-2"
                style={{ 
                  width: `${(option.votes / poll.options.reduce((sum, opt) => sum + opt.votes, 0) || 1) * 100}%` 
                }}
              />
              <span>{option.text} - {option.votes} voturi</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Polls;