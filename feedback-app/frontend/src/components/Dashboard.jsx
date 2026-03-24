import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Database, Filter, LayoutTemplate, CheckCircle2, PieChart, BarChart3, X } from 'lucide-react';
import ResponsesTable from './ResponsesTable';

const API_URL = 'http://localhost:5002/api';

const SERVICE_OPTIONS = [
  'Corp Tax Registration / Amendments',
  'VAT Registration / Amendments',
  'CT Filing',
  'VAT Filing',
  'Book Keeping & Auditing',
  'POA',
  'Biz Set up / License Renewal',
  'Visa Services',
  'Business account opening',
  'Other'
];

export default function Dashboard() {
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryParams = new URLSearchParams(window.location.search);
  const initialFormId = queryParams.get('formId') || '';
  const [selectedForm] = useState(initialFormId);
  const [serviceFilter, setServiceFilter] = useState('');
  const [isChartCollapsed, setIsChartCollapsed] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [resRes, formsRes] = await Promise.all([
          axios.get(`${API_URL}/responses${selectedForm ? `?formId=${selectedForm}` : ''}`),
          axios.get(`${API_URL}/forms`)
        ]);
        setResponses(resRes.data);
        setForms(formsRes.data);
      } catch {
        console.error('Failed to load portal data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [selectedForm]);

  // Find Q1 field ID dynamically
  const q1FieldId = useMemo(() => {
    if (forms.length === 0) return null;
    const targetForm = selectedForm ? forms.find(f => f.id === Number(selectedForm)) : forms[0];
    if (!targetForm) return null;
    let schema = targetForm.fields;
    if (typeof schema === 'string') { try { schema = JSON.parse(schema); } catch { return null; } }
    if (!Array.isArray(schema)) return null;
    const q1 = schema.find(f => f.type === 'dropdown-multi' || f.type === 'checkbox');
    return q1 ? q1.id : null;
  }, [forms, selectedForm]);

  const serviceCounts = useMemo(() => {
    const counts = {};
    SERVICE_OPTIONS.forEach(opt => { counts[opt] = 0; });
    responses.forEach(res => {
      let answers = res.answers;
      if (typeof answers === 'string') { try { answers = JSON.parse(answers); } catch { return; } }
      if (!q1FieldId || !answers[q1FieldId]) return;
      const val = answers[q1FieldId];
      const selections = Array.isArray(val) ? val : [val];
      selections.forEach(s => { if (counts[s] !== undefined) counts[s]++; });
    });
    return counts;
  }, [responses, q1FieldId]);

  const maxCount = Math.max(1, ...Object.values(serviceCounts));

  const filteredResponses = useMemo(() => {
    if (!serviceFilter || !q1FieldId) return responses;
    return responses.filter(res => {
      let answers = res.answers;
      if (typeof answers === 'string') { try { answers = JSON.parse(answers); } catch { return false; } }
      const val = answers[q1FieldId];
      const selections = Array.isArray(val) ? val : [val];
      return selections.includes(serviceFilter);
    });
  }, [responses, serviceFilter, q1FieldId]);

  if (loading) return <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-black text-indigo-300 text-xl tracking-widest uppercase animate-pulse"><Database className="w-12 h-12 mb-3 text-indigo-200"/> Loading...</div>;

  return (
    <div className="h-screen bg-slate-50 font-sans overflow-hidden flex flex-col">
      {/* Top Header / Filter Bar - COMPACT */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <PieChart className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Dashboard</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responses Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
            <select 
              value={serviceFilter} 
              onChange={e => setServiceFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer appearance-none"
            >
              <option value="">All Services</option>
              {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <Link to="/dashboard/forms" className="px-4 py-2 bg-slate-900 text-white text-sm rounded-xl hover:bg-black font-bold transition flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> Forms
          </Link>
        </div>
      </header>

      {/* Main Content Area - Split Layout */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* Left Column: Analytics (30%) */}
        <section 
          className={`flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 overflow-hidden shrink-0 ${isChartCollapsed ? 'w-12' : 'w-[30%] lg:w-[300px] xl:w-[350px]'}`}
        >
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            {!isChartCollapsed && (
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" /> Analytics
              </h2>
            )}
            <button 
              onClick={() => setIsChartCollapsed(!isChartCollapsed)}
              className="p-1 hover:bg-white rounded-md transition text-slate-400 hover:text-indigo-600"
            >
              <X className={`w-4 h-4 transition-transform ${isChartCollapsed ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {!isChartCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              <div className="bg-indigo-50/50 p-2 rounded-lg mb-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Total Responses</p>
                <p className="text-xl font-black text-indigo-600">{responses.length}</p>
              </div>

              {SERVICE_OPTIONS.map((opt) => {
                const count = serviceCounts[opt];
                const pct = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
                const isActive = serviceFilter === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setServiceFilter(isActive ? '' : opt)}
                    className={`w-full group text-left p-2 rounded-xl border transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-bold truncate pr-2 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-indigo-600'}`}>
                        {opt}
                      </span>
                      <span className={`text-[10px] font-black ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isActive ? 'bg-white' : 'bg-indigo-500'}`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs font-black mt-1 ${isActive ? 'text-white' : 'text-slate-800'}`}>{count}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Table (70%) */}
        <section className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           {serviceFilter && (
             <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <Filter className="w-3 h-3"/> Filtering: {serviceFilter}
                </span>
                <button onClick={() => setServiceFilter('')} className="p-1 hover:bg-white rounded text-indigo-400 hover:text-red-500 transition">
                  <X className="w-3 h-3"/>
                </button>
             </div>
           )}
           <div className="flex-1 overflow-hidden flex flex-col">
              {filteredResponses.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <CheckCircle2 className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="font-bold text-slate-400">No matching responses found.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col relative">
                  <ResponsesTable 
                    responses={filteredResponses} 
                    forms={forms} 
                    onDelete={async (id) => {
                       if (!window.confirm("Delete this response?")) return;
                       try {
                         await axios.delete(`${API_URL}/responses/${id}`);
                         setResponses(prev => prev.filter(r => r.id !== id));
                       } catch(e) { console.error(e); }
                    }}
                  />
                </div>
              )}
           </div>
        </section>
      </main>

      {/* Global CSS for hidden scrollbars but keep functionality */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
}
