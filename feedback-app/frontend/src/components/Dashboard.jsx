import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Database, Filter, LayoutTemplate, CheckCircle2, PieChart } from 'lucide-react';
import ResponsesTable from './ResponsesTable';

const API_URL = 'http://localhost:5002/api';

export default function Dashboard() {
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryParams = new URLSearchParams(window.location.search);
  const initialFormId = queryParams.get('formId') || '';
  const [selectedForm, setSelectedForm] = useState(initialFormId);

  useEffect(() => {
    const init = async () => {
      try {
        const [resRes, formsRes] = await Promise.all([
          axios.get(`${API_URL}/responses${selectedForm ? `?formId=${selectedForm}` : ''}`),
          axios.get(`${API_URL}/forms`)
        ]);
        setResponses(resRes.data);
        setForms(formsRes.data);
      } catch (err) {
        console.error('Failed to load portal data', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [selectedForm]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-black text-indigo-300 text-xl tracking-widest uppercase animate-pulse"><Database className="w-12 h-12 mb-3 text-indigo-200"/> Loading Responses...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Region */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center py-6 border-b border-slate-200 mb-8 bg-white rounded-3xl shadow-md shadow-slate-200/40 px-6 md:px-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none"></div>
           
           <div className="relative z-10">
             <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <PieChart className="w-12 h-12 text-indigo-600" />
               Responses Dashboard
             </h1>
             <p className="text-slate-500 mt-3 font-semibold text-lg ml-1">View your form responses.</p>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-5 mt-8 xl:mt-0 relative z-10 w-full xl:w-auto items-center">
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Filter className="w-5 h-5 text-indigo-400" />
                </div>
                <select 
                  value={selectedForm} 
                  onChange={e => setSelectedForm(e.target.value)}
                  className="w-full sm:w-64 p-4 pl-12 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 font-bold transition shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">All Forms</option>
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>
              
              <Link to="/dashboard/forms" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl hover:from-slate-900 hover:to-black font-black shadow-lg shadow-slate-900/30 transition flex justify-center items-center gap-2 transform hover:-translate-y-1">
                <LayoutTemplate className="w-5 h-5" /> Manage Forms
              </Link>
           </div>
        </div>

        {/* Analytics Grid */}
        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm text-center">
            <CheckCircle2 className="w-16 h-16 text-slate-200 mb-4" />
            <h2 className="text-xl font-bold text-slate-400">No Responses Yet</h2>
            <p className="text-slate-400 font-medium mt-1">Adjust filters or share your form to get responses.</p>
          </div>
        ) : (
          <ResponsesTable 
            responses={responses} 
            forms={forms} 
            onDelete={async (id) => {
               if (!window.confirm("Are you sure you want to permanently delete this response?")) return;
               try {
                 await axios.delete(`${API_URL}/responses/${id}`);
                 setResponses(prev => prev.filter(r => r.id !== id));
               } catch(e) {
                 console.error('Delete failed:', e);
                 alert('Failed to delete response.');
               }
            }}
          />
        )}
      </div>
    </div>
  );
}
