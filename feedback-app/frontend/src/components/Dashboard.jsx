import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { 
  Database, Filter, LayoutTemplate, CheckCircle2, PieChart, 
  BarChart3, X, ChevronRight, MessageSquare, TrendingUp, 
  Calendar, Eye, ChevronDown, Search, ArrowRight, MousePointer2, Settings2, Activity
} from 'lucide-react';
import ResponsesTable from './ResponsesTable';
import LinkTrackingTable from './LinkTrackingTable';

export default function Dashboard() {
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryParams = new URLSearchParams(window.location.search);
  const selectedForm = queryParams.get('formId') || '';

  // CORE STATE: Global Filters
  const [dateFilter, setDateFilter] = useState('all'); 
  const [filters, setFilters] = useState({}); // { field_id: [selected_values] }
  const [qSearch, setQSearch] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState({}); // { index: bool }
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Tab State: Responses vs Tracking
  const [activeTab, setActiveTab] = useState('responses');

  useEffect(() => {
    const init = async () => {
      try {
        const [resRes, formsRes] = await Promise.all([
          api.get(`/responses${selectedForm ? `?formId=${selectedForm}` : ''}`),
          api.get(`/forms`)
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

  // ANALYTICS: Distribution logic re-added
  const distributionData = useMemo(() => {
    const activeQuestion = allFields[activeQuestionIndex];
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
      .map(([label, count]) => ({ label, count, pct: Math.round((count / (filteredByDate.length || 1)) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [activeQuestionIndex, allFields, filteredByDate]);

  // DERIVED: Master Filter Logic (Intersection)
  const filteredResponses = useMemo(() => {
    return filteredByDate.filter(res => {
      let answers = res.answers;
      if (typeof answers === 'string') try { answers = JSON.parse(answers); } catch { return false; }
      
      for (const [qId, activeVals] of Object.entries(filters)) {
        if (!activeVals || activeVals.length === 0) continue;
        const val = answers[qId];
        if (val === undefined || val === null) return false;
        const selections = Array.isArray(val) ? val : [val];
        if (!selections.some(s => activeVals.includes(s))) return false;
      }
      return true;
    });
  }, [filteredByDate, filters]);

  // HELPER: Toggle Filter
  const toggleFilter = (qId, idx, value) => {
    setActiveQuestionIndex(idx); // Update chart focus when interacting with filters
    setFilters(prev => {
      const current = prev[qId] || [];
      const updated = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
      const newFilters = { ...prev, [qId]: updated };
      if (updated.length === 0) delete newFilters[qId];
      return newFilters;
    });
  };

  const clearFilters = () => setFilters({});

  if (loading) return <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-black text-indigo-300 text-xl tracking-widest uppercase animate-pulse"><Database className="w-12 h-12 mb-3 text-indigo-200"/> Loading...</div>;

  return (
    <div className="h-screen bg-white font-sans overflow-hidden flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Global Header */}
      <header className="bg-slate-900 px-6 py-4 flex items-center justify-between shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-violet-600 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">All Responses</h1>
            <p className="text-[10px] font-bold text-violet-300/60 uppercase tracking-widest">Analytics & Data</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <div className="bg-white/10 p-1 rounded-xl flex border border-white/5">
              {[['all', 'ALL'], ['30', '30D'], ['7', '7D']].map(([val, label]) => (
                <button 
                  key={val}
                  onClick={() => setDateFilter(val)}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${dateFilter === val ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Link to="/dashboard/forms" className="px-5 py-2.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/30 text-sm rounded-2xl font-black transition-all flex items-center gap-3 group">
            <LayoutTemplate className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Forms
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        
        {/* Left Sidebar: Filter Accordion */}
        <aside className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 z-10 shadow-sm">
          <div className="p-5 border-b border-slate-100 shrink-0">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text"
                value={qSearch}
                placeholder="Search filters..."
                onChange={(e) => setQSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            <div className="px-3 py-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Question Explorer</h3>
              
              <div className="space-y-3">
                {allFields
                  .filter(f => !qSearch || f.label?.toLowerCase().includes(qSearch.toLowerCase()))
                  .map((field) => {
                    const originalIndex = allFields.findIndex(orig => orig.id === field.id);
                    const isExpanded = expandedQuestions[originalIndex];
                    const activeCount = filters[field.id]?.length || 0;
                    
                    return (
                      <div key={field.id} className={`rounded-2xl transition-all duration-300 ${isExpanded ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'bg-transparent'}`}>
                        <button 
                          onClick={() => {
                            setExpandedQuestions(prev => ({ ...prev, [originalIndex]: !prev[originalIndex] }));
                            setActiveQuestionIndex(originalIndex);
                          }}
                          className="w-full text-left p-3 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors ${activeCount > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}>
                              {originalIndex + 1}
                            </div>
                            <span className="text-[11px] font-black text-slate-700 leading-tight pr-4">
                              {field.label ? field.label.replace(/^\d+\.\s*/, '') : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeCount > 0 && <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">{activeCount}</span>}
                            {field.options && field.options.length > 0 && (
                              <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </button>
                        
                        {isExpanded && field.options && (
                          <div className="px-3 pb-4 pt-1 space-y-1 border-t border-slate-50 mx-2">
                              {field.options.map(opt => {
                                const label = typeof opt === 'string' ? opt : opt.label;
                                const isChecked = filters[field.id]?.includes(label);
                                return (
                                  <button 
                                    key={label}
                                    onClick={() => toggleFilter(field.id, originalIndex, label)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold flex items-center justify-between transition-all ${isChecked ? 'bg-indigo-50 text-indigo-700 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}
                                  >
                                    <span>{label}</span>
                                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Area: Analytics & Matrix */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          
          {/* Top Bar: Tabs & Active Filters */}
          <div className="px-8 py-3 border-b border-slate-100 flex items-center gap-8 shrink-0 bg-slate-50/20">
            {/* View Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button 
                 onClick={() => setActiveTab('responses')}
                 className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'responses' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Responses
               </button>
               <button 
                 onClick={() => setActiveTab('tracking')}
                 className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tracking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Link Tracking
               </button>
            </div>
            {/* End View Tabs */}

            {activeTab === 'responses' && (
               <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                     <Filter className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Active Filters</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {Object.entries(filters).map(([qId, values]) => 
                      values.map(val => (
                        <button 
                          key={`${qId}-${val}`}
                          onClick={() => {
                             const idx = allFields.findIndex(f => f.id === qId);
                             toggleFilter(qId, idx, val);
                          }}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black hover:bg-red-500 transition-all group shadow-md shadow-indigo-100"
                        >
                          {val}
                          <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        </button>
                      ))
                    )}
                    {Object.keys(filters).length === 0 && (
                      <span className="text-[10px] font-bold text-slate-300 italic">Exploring All Responses</span>
                    )}
                    {Object.keys(filters).length > 0 && (
                      <button onClick={clearFilters} className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase ml-4">Clear Filters</button>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-1.5 rounded-2xl text-[11px] font-black flex items-center gap-2 whitespace-nowrap">
                       <CheckCircle2 className="w-4 h-4" /> {filteredResponses.length} Responses
                    </div>
                  </div>
               </div>
            )}
          </div>

          {activeTab === 'responses' ? (
             <>
               {/* New Distribution Summary Panel */}
          {allFields[activeQuestionIndex] && distributionData.length > 0 && (
            <div className="px-8 py-4 bg-white border-b border-slate-100 shrink-0 animate-in fade-in slide-in-from-top-2 duration-500">
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" /> 
                    Analytical Summary: <span className="text-slate-900">{allFields[activeQuestionIndex]?.label}</span>
                  </h3>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {distributionData.slice(0, 6).map((d, i) => (
                    <div key={i} className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-2xl flex flex-col gap-1 hover:bg-white transition-colors group">
                       <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight text-slate-500 mb-1">
                          <span className="truncate max-w-[70%]">{d.label}</span>
                          <span className="text-indigo-600">{d.pct}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 transition-all duration-1000 group-hover:bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)]" style={{ width: `${d.pct}%` }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Table Container */}
          <div className="flex-1 overflow-hidden relative">
            <ResponsesTable 
              responses={filteredResponses} 
              forms={forms} 
              allFields={allFields}
              onDelete={async (id) => {
                 if (!window.confirm("Delete this response?")) return;
                 try {
                   await api.delete(`/responses/${id}`);
                   setResponses(prev => prev.filter(r => r.id !== id));
                 } catch(e) { console.error(e); }
              }}
            />
          </div>
             </>
          ) : (
             <div className="flex-1 overflow-hidden relative">
                <LinkTrackingTable formId={selectedForm} forms={forms} responses={responses} />
             </div>
          )}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}
