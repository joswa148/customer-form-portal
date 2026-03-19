import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5002/api';

const getRatingLabel = (val) => {
  const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
  return labels[val - 1] || 'N/A';
};

export default function Dashboard() {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch created forms for dropdown
  useEffect(() => {
    axios.get(`${API_URL}/forms`)
         .then(res => setForms(res.data))
         .catch(err => console.error(err));
  }, []);

  // Fetch responses when selected form changes
  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const url = selectedFormId ? `${API_URL}/responses?formId=${selectedFormId}` : `${API_URL}/responses`;
        const response = await axios.get(url);
        setFeedbacks(response.data);
      } catch (err) {
        setError('Failed to fetch feedback data.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [selectedFormId]);

  return (
    <div className="p-8 max-w-[95%] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Responses Dashboard</h1>
          <Link to="/dashboard/forms" className="text-sm font-semibold text-blue-600 hover:underline mt-1 block">
            ← Back to Forms Management
          </Link>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto">
          <label className="text-sm font-semibold text-gray-600 whitespace-nowrap px-2">Filter by Form:</label>
          <select 
            value={selectedFormId} 
            onChange={e => setSelectedFormId(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
          >
            <option value="">All Forms</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
          <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold shadow-sm whitespace-nowrap">
             {feedbacks.length} Submissions
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500 font-semibold">Loading responses...</div>
      ) : error ? (
        <div className="py-20 text-center text-red-500">{error}</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">ID / Date</th>
                  <th className="px-6 py-4">Respondent</th>
                  <th className="px-6 py-4 whitespace-nowrap">Satisfaction</th>
                  <th className="px-6 py-4 whitespace-nowrap">Recommend</th>
                  <th className="px-6 py-4">Comments Overview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedbacks.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 align-top w-40 border-r border-gray-100">
                      <div className="font-bold text-gray-900">#{item.id}</div>
                      <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</div>
                      {!selectedFormId && (
                        <div className="mt-2 text-[10px] uppercase font-bold text-blue-500 bg-blue-50 w-fit px-2 py-1 rounded">Form ID: {item.form_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top border-r border-gray-100">
                      <div className="font-bold text-gray-800">{item.name || 'Anonymous'}</div>
                      <div className="text-sm text-blue-600 font-medium mb-1">{item.user_email}</div>
                      <div className="text-xs text-gray-500">{item.age} years | {item.gender}</div>
                    </td>
                    <td className="px-6 py-4 align-top border-r border-gray-100">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        {item.satisfaction}/5 - {getRatingLabel(item.satisfaction)}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top border-r border-gray-100">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {item.recommend}/5 - {getRatingLabel(item.recommend)}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="text-gray-700">
                        <span className="font-bold text-[10px] uppercase text-gray-400 block mb-1">Service:</span>
                        <p className="line-clamp-2 text-sm">{item.customer_service_comment || <span className="text-gray-400 italic">None</span>}</p>
                      </div>
                      <div className="text-gray-700 mt-3 border-t border-gray-100 pt-2">
                        <span className="font-bold text-[10px] uppercase text-gray-400 block mb-1">Improvement:</span>
                        <p className="line-clamp-2 text-sm">{item.improvement_areas || <span className="text-gray-400 italic">None</span>}</p>
                      </div>
                    </td>
                  </tr>
                ))}
                {feedbacks.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-gray-500 font-semibold text-lg bg-gray-50/50">
                      No feedback submitted for this filter yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
