import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Database, Filter, LayoutTemplate, CheckCircle2, PieChart, BarChart3, X, ChevronRight, MessageSquare, Flame, Zap, Snowflake, TrendingUp, Trophy, Calendar, Eye } from 'lucide-react';
import ResponsesTable from './ResponsesTable';

const API_URL = 'http://localhost:5002/api';

export default function Dashboard() {
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryParams = new URLSearchParams(window.location.search);
  const initialFormId = queryParams.get('formId') || '';
  const [selectedForm] = useState(initialFormId);
  const [dateFilter, setDateFilter] = useState('all'); 
  
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [activeOptionFilter, setActiveOptionFilter] = useState(null);
  const [qSearch, setQSearch] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [resRes, formsRes] = await Promise.all([
          axios.get(`${API_URL}/responses${selectedForm ? `?formId=${selectedForm}` : ''}`),
          axios.get(`${API_URL}/forms`)
        ]);
        setResponses(resRes.data);
        setForms(formsRes.data);
        setActiveQuestionIndex(0); // Reset on load
        setActiveOptionFilter(null);
      } catch { console.error('Failed to load portal data'); } 
      finally { setLoading(false); }
    };
    init();
  }, [selectedForm]);

  const filteredByDate = useMemo(() => {
    if (dateFilter === 'all') return responses;
    const now = new Date();
    const limit = new Date(now.setDate(now.getDate() - Number(dateFilter)));
    return responses.filter(r => new Date(r.created_at) >= limit);
  }, [responses, dateFilter]);

  const allFields = useMemo(() => {
    if (forms.length === 0) return [];
    const targetForm = selectedForm ? forms.find(f => f.id === Number(selectedForm)) : forms[0];
    if (!targetForm) return [];
    let schema = targetForm.fields;
    if (typeof schema === 'string') try { schema = JSON.parse(schema); } catch { return []; }
    return Array.isArray(schema) ? schema : [];
  }, [forms, selectedForm]);

  const activeQuestion = allFields[activeQuestionIndex];

  const distributionData = useMemo(() => {
    if (!activeQuestion) return [];
    const counts = {};
    filteredByDate.forEach(res => {
      let answers = res.answers;
      if (typeof answers === 'string') try { answers = JSON.parse(answers); } catch { return; }
      const val = answers[activeQuestion.id];
      if (!val) return;
      const selections = Array.isArray(val) ? val : [val];
      selections.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, pct: Math.round((count / filteredByDate.length) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [activeQuestion, filteredByDate]);

  const filteredResponses = useMemo(() => {
    if (!activeOptionFilter || !activeQuestion) return filteredByDate;
    return filteredByDate.filter(res => {
      let answers = res.answers;
      if (typeof answers === 'string') try { answers = JSON.parse(answers); } catch { return false; }
      const val = answers[activeQuestion.id];
      const selections = Array.isArray(val) ? val : [val];
      return selections.includes(activeOptionFilter);
    });
  }, [filteredByDate, activeOptionFilter, activeQuestion]);

  if (loading) return <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-black text-indigo-300 text-xl tracking-widest uppercase animate-pulse"><Database className="w-12 h-12 mb-3 text-indigo-200"/> Loading...</div>;

  return (
    <div className="h-screen bg-slate-50 font-sans overflow-hidden flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Question Insights</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dynamic Distribution & Filters</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Range</span>
          </div>
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
            {[['all', 'All'], ['30', '30d'], ['7', '7d']].map(([val, label]) => (
               <button 
                key={val}
                onClick={() => setDateFilter(val)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${dateFilter === val ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {label}
               </button>
            ))}
          </div>
          <Link to="/dashboard/forms" className="px-4 py-2 bg-slate-900 text-white text-sm rounded-xl hover:bg-black font-bold transition flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> Forms Hub
          </Link>
        </div>
      </header>

      {/* Horizontal Question Stepper Ribbon */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 shrink-0 flex items-center gap-6 overflow-hidden">
        <div className="shrink-0 flex items-center gap-3 pr-6 border-r border-slate-100">
           <div className="relative w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
              <input 
                type="text"
                value={qSearch}
                placeholder="Find question..."
                onChange={(e) => setQSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-500 focus:bg-white transition"
              />
           </div>
           {qSearch && (
              <button onClick={() => setQSearch('')} className="text-[9px] font-black text-indigo-500 uppercase">Reset</button>
           )}
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-2 pb-1 pr-4">
           {allFields
            .filter(f => !qSearch || (f.label && f.label.toLowerCase().includes(qSearch.toLowerCase())))
            .map((f, i) => {
              const originalIndex = allFields.findIndex(orig => orig.id === f.id);
              const isActive = activeQuestionIndex === originalIndex;
              return (
                <button 
                  key={f.id || i}
                  onClick={() => {
                    setActiveQuestionIndex(originalIndex);
                    setActiveOptionFilter(null);
                  }}
                  className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95 whitespace-nowrap ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-white'}`}
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
                    {originalIndex + 1}
                  </span>
                  <span className="text-[10px] font-bold max-w-[150px] truncate">
                    {f.label || 'Step'}
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
           })}
        </div>
      </div>

      <main className="flex-1 overflow-hidden p-6 grid grid-cols-12 gap-6">
        
        {/* Left Surface: Full-Height Distribution (40%) */}
        <section className="col-span-12 lg:col-span-12 xl:col-span-4 flex flex-col overflow-hidden">
          <div className="bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
             <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-500" /> Distribution Insight
                  </h2>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Click bars to filter lead matrix</p>
                </div>
                {activeOptionFilter && (
                   <button 
                     onClick={() => setActiveOptionFilter(null)}
                     className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-red-100 transition"
                   >
                     Clear Filter <X className="w-3 h-3"/>
                   </button>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {!activeQuestion ? (
                  <div className="h-full flex items-center justify-center opacity-30 italic text-[11px] text-slate-400">Loading form structure...</div>
                ) : distributionData.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-[11px] text-slate-400">No responses recorded for this step.</div>
                ) : (
                  distributionData.map((d, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveOptionFilter(d.label === activeOptionFilter ? null : d.label)}
                      className={`w-full group text-left p-1.5 rounded-xl transition-all ${activeOptionFilter === d.label ? 'bg-indigo-50 shadow-sm ring-1 ring-indigo-100' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-end mb-1 px-1">
                        <span 
                          className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[85%] ${activeOptionFilter === d.label ? 'text-indigo-600' : 'text-slate-600'}`}
                          title={d.label}
                        >
                          {d.label}
                        </span>
                        <span className="text-[9px] font-black text-slate-300">{d.pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${activeOptionFilter === d.label ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]' : 'bg-indigo-400 group-hover:bg-indigo-500'}`}
                          style={{ width: `${d.pct}%` }}
                        ></div>
                      </div>
                    </button>
                  ))
                )}
             </div>
          </div>
        </section>

        {/* Right Surface: Filtered Response Matrix (60%) */}
        <section className="col-span-12 lg:col-span-12 xl:col-span-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex flex-col">
                <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                  <Database className="w-4 h-4 text-slate-400" /> Response Matrix
                </h2>
                {activeOptionFilter && (
                   <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider ml-6">
                     Filtered by: <span className="bg-indigo-100 px-1.5 rounded">{activeOptionFilter}</span>
                   </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                 <div className="text-[10px] font-black px-2 py-1 bg-white border border-slate-100 rounded-lg text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {filteredResponses.length} Records
                 </div>
              </div>
           </div>
           
           <div className="flex-1 overflow-hidden relative">
              <ResponsesTable 
                responses={filteredResponses} 
                forms={forms} 
                allFields={allFields}
                activeQuestionIndex={activeQuestionIndex}
                onDelete={async (id) => {
                   if (!window.confirm("Purge this lead?")) return;
                   try {
                     await axios.delete(`${API_URL}/responses/${id}`);
                     setResponses(prev => prev.filter(r => r.id !== id));
                   } catch(e) { console.error(e); }
                }}
              />
           </div>
        </section>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  );
}
