import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5002/api/forms';

export default function DashboardForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState({ type: '', text: '' });

  const fetchForms = async () => {
    try {
      const { data } = await axios.get(API_URL);
      setForms(data);
    } catch (err) {
      setError('Failed to fetch forms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateMsg({ type: 'error', text: 'Title is required' });
      return;
    }
    setCreating(true);
    try {
      await axios.post(API_URL, { title: newTitle, description: newDesc });
      setCreateMsg({ type: 'success', text: 'Form created successfully!' });
      setNewTitle('');
      setNewDesc('');
      fetchForms();
    } catch (err) {
      setCreateMsg({ type: 'error', text: 'Failed to create form' });
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (uuid) => {
    navigator.clipboard.writeText(`http://localhost:3000/f/${uuid}`);
    const originalText = createMsg.text;
    setCreateMsg({ type: 'success', text: 'Link copied to clipboard!' });
    setTimeout(() => setCreateMsg({ type: createMsg.type, text: originalText }), 3000);
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-semibold text-gray-500">Loading forms...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8 flex-col md:flex-row">
      {/* Create New Form Section */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-fit">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Create New Form</h2>
        {createMsg.text && (
          <div className={`p-3 mb-4 rounded-lg text-sm transition-all ${createMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {createMsg.text}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Form Title *</label>
            <input 
              type="text" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="e.g. Q3 Customer Satisfaction"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)} 
              rows="3"
              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
              placeholder="e.g. Please let us know how we did!"
            />
          </div>
          <button 
            type="submit" 
            disabled={creating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow disabled:opacity-50 transition"
          >
            {creating ? 'Creating...' : 'Create Form'}
          </button>
        </form>
      </div>

      {/* List Existing Forms Section */}
      <div className="w-full md:w-2/3 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Forms Campaigns</h2>
          <Link to="/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">View Consolidated Reponses →</Link>
        </div>
        {error ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-100">{error}</div>
        ) : forms.length === 0 ? (
          <div className="text-gray-500 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            No forms created yet. Use the panel on the left to start your first campaign!
          </div>
        ) : (
          <div className="space-y-4">
            {forms.map(form => (
              <div key={form.id} className="p-5 border border-gray-200 rounded-xl hover:shadow-lg transition bg-gray-50 shadow-sm flex flex-col md:flex-row justify-between md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-extrabold text-lg text-gray-900">{form.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{form.description || 'No description provided.'}</p>
                  <div className="text-xs text-gray-400 mt-3 font-medium tracking-wide uppercase">
                    Created: {new Date(form.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                    {form.response_count} Responses
                  </span>
                  <button 
                    onClick={() => copyLink(form.uuid)}
                    className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1.5 px-4 rounded-lg transition"
                  >
                    Copy Form Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
