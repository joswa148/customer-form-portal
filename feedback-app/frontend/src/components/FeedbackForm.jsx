import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:5002/api';

const STATEMENTS = [
  { id: 'satisfaction', label: 'I feel satisfied with this product or service.' },
  { id: 'quality', label: 'The quality of our product is excellent.' },
  { id: 'met_needs', label: 'The product met my needs perfectly.' },
  { id: 'ease_of_use', label: 'I find the product/service easy to use.' },
  { id: 'value_for_money', label: 'The product offers good value for money.' },
  { id: 'recommend', label: 'I would recommend this product/service to others.' },
  { id: 'valued_customer', label: 'I feel valued as a customer by this brand.' },
  { id: 'quality_expectations', label: 'Quality of our product met my expectations.' }
];

const RATINGS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' }
];

export default function FeedbackForm() {
  const { uuid } = useParams();
  
  const [formConfig, setFormConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');

  const [formData, setFormData] = useState({
    userEmail: '',
    age: '',
    gender: '',
    name: '',
    customer_service_comment: '',
    improvement_areas: ''
  });

  const [ratings, setRatings] = useState({
    satisfaction: null,
    quality: null,
    met_needs: null,
    ease_of_use: null,
    value_for_money: null,
    recommend: null,
    valued_customer: null,
    quality_expectations: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/forms/${uuid}`);
        setFormConfig(data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setConfigError('Form not found or link is invalid.');
        } else {
          setConfigError('Unable to load the form at this time.');
        }
      } finally {
        setConfigLoading(false);
      }
    };
    fetchFormConfig();
  }, [uuid]);

  const handleTextChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleRatingChange = (statementId, value) => setRatings({ ...ratings, [statementId]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.userEmail || !formData.userEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!formData.age || formData.age <= 0) {
      setError('Please provide a valid age.');
      return;
    }
    if (!formData.gender) {
      setError('Please select a gender.');
      return;
    }
    const missingRatings = Object.values(ratings).some(val => val === null);
    if (missingRatings) {
      setError('Please select a rating for all statements.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/responses`, {
        ...formData,
        formId: formConfig.id,
        age: parseInt(formData.age, 10),
        ...ratings
      });
      setSuccess('Thank you! Your feedback has been submitted successfully.');
      setFormData({ userEmail: '', age: '', gender: '', name: '', customer_service_comment: '', improvement_areas: '' });
      setRatings(Object.keys(ratings).reduce((acc, key) => ({ ...acc, [key]: null }), {}));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) return <div className="flex h-screen items-center justify-center font-bold text-gray-500">Loading form...</div>;
  if (configError) return <div className="flex bg-red-50 text-red-600 border border-red-200 p-8 rounded-xl justify-center font-bold m-10 max-w-2xl mx-auto">{configError}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 my-10 bg-white shadow-xl rounded-2xl border border-gray-100">
      <div className="text-center mb-8 border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">{formConfig.title}</h1>
        {formConfig.description && <h2 className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">{formConfig.description}</h2>}
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}
      {success && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 font-semibold">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Info */}
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Your Email Address <span className="text-red-500">*</span></label>
          <input 
            type="email" 
            name="userEmail" 
            value={formData.userEmail} 
            onChange={handleTextChange} 
            className="w-full md:w-1/2 p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            placeholder="We'll send a copy of your response here"
          />
        </div>

        {/* User Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Age <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              name="age" 
              value={formData.age} 
              onChange={handleTextChange} 
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 25"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleTextChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name (Optional)</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleTextChange} 
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>
        </div>

        {/* Likert Scale Section */}
        <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-100 divide-x divide-gray-200 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-700 w-1/3">Statement</th>
                {RATINGS.map(r => (
                  <th key={r.value} className="p-3 text-center text-xs font-semibold text-gray-600">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {STATEMENTS.map((stmt, idx) => (
                <tr key={stmt.id} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                  <td className="p-4 text-sm text-gray-800 font-medium">{stmt.label}</td>
                  {RATINGS.map(r => (
                    <td key={r.value} className="p-3 text-center border-l border-gray-100">
                      <input 
                        type="radio" 
                        name={stmt.id} 
                        value={r.value}
                        checked={ratings[stmt.id] === r.value}
                        onChange={() => handleRatingChange(stmt.id, r.value)}
                        className="w-5 h-5 text-blue-600 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Customer service to be helpful and responsive</label>
            <textarea 
              name="customer_service_comment"
              value={formData.customer_service_comment}
              onChange={handleTextChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Which areas do you believe require improvement?</label>
            <textarea 
              name="improvement_areas"
              value={formData.improvement_areas}
              onChange={handleTextChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            ></textarea>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}
