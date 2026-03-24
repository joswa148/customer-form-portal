import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Database, Filter, LayoutTemplate, CheckCircle2, PieChart, BarChart3, X, ChevronRight, MessageSquare, Flame, Zap, Snowflake, TrendingUp, Trophy, Calendar } from 'lucide-react';
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

  useEffect(() => {
    const init = async () => {
      try {
        const [resRes, formsRes] = await Promise.all([
          axios.get(`${API_URL}/responses${selectedForm ? `?formId=${selectedForm}` : ''}`),
          axios.get(`${API_URL}/forms`)
        ]);
        setResponses(resRes.data);
        setForms(formsRes.data);
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

      {/* Main Analysis Architecture */}
      <main className="flex-1 overflow-hidden p-6 grid grid-cols-12 gap-6">
        
        {/* Left Surface: Question Navigator & Distribution (40%) */}
        <section className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-6 overflow-hidden">
          
          {/* Question Navigator */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm flex flex-col h-[240px]">
             <div className="flex items-center justify-between mb-3 shrink-0">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-emerald-500" /> Question Navigator
                </h2>
                <span className="text-[9px] font-black text-slate-300 uppercase">{allFields.length} Steps</span>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                {allFields.map((f, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setActiveQuestionIndex(i);
                      setActiveOptionFilter(null);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${activeQuestionIndex === i ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-600/5' : 'bg-slate-50/50 border-slate-100 hover:border-slate-300 hover:bg-white'}`}
                  >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${activeQuestionIndex === i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <span className={`text-[11px] font-bold truncate ${activeQuestionIndex === i ? 'text-indigo-900' : 'text-slate-500'}`}>
                      {f.label}
                    </span>
                  </button>
                ))}
             </div>
          </div>

          {/* Distribution Insights Chart */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
             <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-500" /> Distribution Insight
                  </h2>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Click bars to filter leads</p>
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
             
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {distributionData.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-[11px] text-slate-400">No responses recorded for this step.</div>
                ) : (
                  distributionData.map((d, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveOptionFilter(d.label === activeOptionFilter ? null : d.label)}
                      className={`w-full group text-left p-1 rounded-xl transition-all ${activeOptionFilter === d.label ? 'bg-indigo-50/50 ring-1 ring-indigo-100' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-end mb-1 px-1">
                        <span className={`text-[11px] font-black uppercase tracking-tight truncate max-w-[80%] ${activeOptionFilter === d.label ? 'text-indigo-600' : 'text-slate-600'}`}>
                          {d.label}
                        </span>
                        <span className="text-[10px] font-black text-slate-300">{d.pct}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${activeOptionFilter === d.label ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]' : 'bg-indigo-300 group-hover:bg-indigo-400'}`}
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
        <section className="col-span-12 lg:col-span-7 xl:col-span-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
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
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black px-2 py-1 bg-white border border-slate-100 rounded-lg text-slate-500">
                    {filteredResponses.length} Matches
                 </span>
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  );
}
