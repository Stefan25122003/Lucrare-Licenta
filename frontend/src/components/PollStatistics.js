import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import {
  BarChart3,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  PieChart,
  Target,
  UserCheck,
  Building2,
  ArrowLeft,
  Lightbulb,
  CheckCircle,
  Activity,
  Hash
} from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <Activity className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Se încarcă statisticile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg inline-block">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Nu sunt disponibile statistici</p>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 transition-colors duration-300">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <span>Statistici Sondaj</span>
          </h1>
          <Link 
            to="/polls" 
            className="inline-flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Înapoi la sondaje</span>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 transition-colors duration-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{analytics.poll_info.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-blue-600 mr-2" />
                <div className="text-3xl font-bold text-blue-600">{analytics.statistics.total_votes}</div>
              </div>
              <div className="text-gray-600 dark:text-gray-300">Total Voturi</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-green-600 mr-2" />
                <div className="text-3xl font-bold text-green-600">
                  {analytics.statistics.demographic_stats.average_age.toFixed(1)}
                </div>
              </div>
              <div className="text-gray-600 dark:text-gray-300">Vârsta Medie</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="w-6 h-6 text-purple-600 mr-2" />
                <div className="text-3xl font-bold text-purple-600">
                  {analytics.statistics.demographic_stats.unique_cities}
                </div>
              </div>
              <div className="text-gray-600 dark:text-gray-300">Orașe Unice</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-orange-600 mr-2" />
                <div className="text-3xl font-bold text-orange-600">100%</div>
              </div>
              <div className="text-gray-600 dark:text-gray-300">Rata de Completare</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border-l-4 border-blue-500 transition-colors duration-300">
          <h3 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-100 flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>Insights</span>
          </h3>
          <ul className="space-y-2">
            {analytics.insights.map((insight, index) => (
              <li key={index} className="text-blue-800 dark:text-blue-200 flex items-start space-x-2">
                <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Distribuția Voturilor</span>
            </h3>
            <Bar data={voteDistributionData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Voturi pe Opțiuni' }
              }
            }} />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Distribuția pe Vârste</span>
            </h3>
            <Bar data={ageDistributionData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Votanți pe Grupe de Vârstă' }
              }
            }} />
          </div>


          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span>Top Orașe</span>
            </h3>
            <Doughnut data={cityDistributionData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'right' },
                title: { display: true, text: 'Distribuția pe Orașe' }
              }
            }} />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-orange-600" />
              <span>Breakdown Demografic</span>
            </h3>
            <div className="space-y-4">
              {analytics.demographic_breakdown.map((breakdown, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-r-lg">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>{breakdown.option_text}</span>
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {breakdown.votes} voturi ({breakdown.percentage.toFixed(1)}%)
                  </p>
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Building2 className="w-3 h-3" />
                      <span>Top oraș: {Object.keys(breakdown.cities)[0] || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>Grup dominant: {Object.keys(breakdown.age_groups)[0] || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

/}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6 transition-colors duration-300">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span>Detalii Votanți</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-3 text-left text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4" />
                      <span>Utilizator</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Oraș</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Vârstă</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Opțiune Votată</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.user_votes.map((vote, index) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {vote.first_name && vote.last_name 
                        ? `${vote.first_name} ${vote.last_name}` 
                        : vote.username
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {vote.city || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {vote.age || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {vote.vote_option_text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollStatistics;