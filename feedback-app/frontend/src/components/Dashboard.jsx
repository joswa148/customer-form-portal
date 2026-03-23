import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Database, Filter, LayoutTemplate, Clock, Mail, CheckCircle2, ChevronRight, PieChart } from 'lucide-react';

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

  const getLabel = (formId, fieldId) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return fieldId;
    let schema = form.fields;
    if (typeof schema === 'string') {
      try { schema = JSON.parse(schema); } catch(e) { console.error('Failed to parse schema', e); return fieldId; }
    }
    if (!Array.isArray(schema)) return fieldId;
    
    const field = schema.find(f => f.id === fieldId);
    return field ? field.label : fieldId;
  };

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
          <div className="columns-1 md:columns-2 xl:columns-3 gap-8 space-y-8">
            {responses.map(fb => {
              let parsedAnswers = fb.answers || {};
              if (typeof parsedAnswers === 'string') {
                 try { parsedAnswers = JSON.parse(parsedAnswers); } catch(e) { console.error('Failed to parse answers', e); }
              }
              const formDoc = forms.find(x => x.id === fb.form_id);

              return (
                <div key={fb.id} className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col break-inside-avoid relative group hover:-translate-y-1 hover:shadow-xl transition duration-300">
                  <div className="absolute top-0 right-8 w-12 h-1.5 bg-indigo-500 rounded-b-md"></div>
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm inline-block mb-3">Form ID #{fb.form_id}</span>
                        <h3 className="font-extrabold text-lg text-slate-800 leading-tight">
                          {formDoc ? formDoc.title : 'Untitled Form'}
                        </h3>
                     </div>
                  </div>
                  
                  {/* Origin */}
                  <div className="mb-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-inner shrink-0">
                       <Mail className="w-5 h-5"/>
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Respondent Email</p>
                       <p className="font-bold text-slate-700 truncate" title={fb.user_email}>{fb.user_email || 'Anonymous'}</p>
                    </div>
                  </div>

                  {/* Answers Map */}
                  <div className="space-y-4">
                    {Object.entries(parsedAnswers).map(([k, v]) => (
                      <div key={k} className="border-l-4 border-slate-200 pl-4 py-1 hover:border-indigo-400 transition">
                        <span className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1.5">
                           <ChevronRight className="w-3 h-3 text-indigo-300"/>
                           {getLabel(fb.form_id, k)}
                        </span>
                        <span className="block font-bold text-slate-800 text-[15px] leading-snug break-words">
                           {v === null || v === '' ? <span className="text-slate-300 italic">Empty</span> : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-5 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock className="w-4 h-4"/> 
                    {new Date(fb.created_at).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', 
                      hour: '2-digit', minute:'2-digit'
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
