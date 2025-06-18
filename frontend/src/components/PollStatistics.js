import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PollStatistics = () => {
  const { pollId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, [pollId]);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/polls/${pollId}/statistics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      setError('Eroare la încărcarea statisticilor');
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center">Se încarcă statisticile...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!analytics) return <div className="text-center">Nu sunt disponibile statistici</div>;

  // Configurare grafice
  const voteDistributionData = {
    labels: analytics.statistics.vote_distribution.map(v => v.option_text),
    datasets: [{
      label: 'Voturi',
      data: analytics.statistics.vote_distribution.map(v => v.votes),
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 205, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1
    }]
  };

  const ageDistributionData = {
    labels: Object.keys(analytics.statistics.age_distribution),
    datasets: [{
      label: 'Votanți pe grupe de vârstă',
      data: Object.values(analytics.statistics.age_distribution),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const cityDistributionData = {
    labels: Object.keys(analytics.statistics.city_distribution).slice(0, 10), // Top 10 orașe
    datasets: [{
      data: Object.values(analytics.statistics.city_distribution).slice(0, 10),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ]
    }]
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">📊 Statistici Sondaj</h1>
      
      {/* Header cu informații generale */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold mb-2">{analytics.poll_info.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analytics.statistics.total_votes}</div>
            <div className="text-gray-600">Total Voturi</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {analytics.statistics.demographic_stats.average_age.toFixed(1)}
            </div>
            <div className="text-gray-600">Vârsta Medie</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {analytics.statistics.demographic_stats.unique_cities}
            </div>
            <div className="text-gray-600">Orașe Unice</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">100%</div>
            <div className="text-gray-600">Rata de Completare</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-3">💡 Insights</h3>
        <ul className="space-y-2">
          {analytics.insights.map((insight, index) => (
            <li key={index} className="text-blue-800">{insight}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuția voturilor */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Distribuția Voturilor</h3>
          <Bar data={voteDistributionData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Voturi pe Opțiuni' }
            }
          }} />
        </div>

        {/* Distribuția pe vârste */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Distribuția pe Vârste</h3>
          <Bar data={ageDistributionData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Votanți pe Grupe de Vârstă' }
            }
          }} />
        </div>

        {/* Top orașe */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Top Orașe</h3>
          <Doughnut data={cityDistributionData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'right' },
              title: { display: true, text: 'Distribuția pe Orașe' }
            }
          }} />
        </div>

        {/* Breakdown demografic pe opțiuni */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Breakdown Demografic</h3>
          <div className="space-y-4">
            {analytics.demographic_breakdown.map((breakdown, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-bold">{breakdown.option_text}</h4>
                <p className="text-sm text-gray-600">
                  {breakdown.votes} voturi ({breakdown.percentage.toFixed(1)}%)
                </p>
                <div className="mt-2 text-xs">
                  <span className="mr-4">🏙️ Top oraș: {
                    Object.keys(breakdown.cities)[0] || 'N/A'
                  }</span>
                  <span>👥 Grup dominant: {
                    Object.keys(breakdown.age_groups)[0] || 'N/A'
                  }</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista votanților (opțional, pentru admini) */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-xl font-bold mb-4">👥 Detalii Votanți</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Utilizator</th>
                <th className="px-4 py-2 text-left">Oraș</th>
                <th className="px-4 py-2 text-left">Vârstă</th>
                <th className="px-4 py-2 text-left">Opțiune Votată</th>
              </tr>
            </thead>
            <tbody>
              {analytics.user_votes.map((vote, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">
                    {vote.first_name && vote.last_name 
                      ? `${vote.first_name} ${vote.last_name}` 
                      : vote.username
                    }
                  </td>
                  <td className="px-4 py-2">{vote.city || 'N/A'}</td>
                  <td className="px-4 py-2">{vote.age || 'N/A'}</td>
                  <td className="px-4 py-2">{vote.vote_option_text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PollStatistics;