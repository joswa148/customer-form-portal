import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Link as LinkIcon, Trash2, ArrowLeft, BarChart2, LayoutTemplate, Settings2, FileText, Hash, CheckSquare, AlignLeft, ToggleLeft, ClipboardCheck } from 'lucide-react';

const API_URL = 'http://localhost:5002/api/forms';

export default function DashboardForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mode, setMode] = useState('list'); // 'list' or 'build'
  
  // Builder State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_URL);
      setForms(data);
    } catch (err) {
      console.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} question`,
      required: false,
      options: type === 'radio' || type === 'select' ? ['Option 1', 'Option 2'] : undefined
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSaveForm = async () => {
    if (!title) return alert('Title is required');
    if (fields.length === 0) return alert('Add at least one field');
    
    setSaving(true);
    try {
      await axios.post(API_URL, { title, description, fields });
      setMode('list');
      fetchForms();
    } catch (err) {
      alert('Failed to save form.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (uuid) => {
    navigator.clipboard.writeText(`http://localhost:3000/f/${uuid}`);
  };

  if (mode === 'build') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-700 p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 mix-blend-overlay"></div>
            <div className="z-10">
              <h1 className="text-3xl font-black flex items-center gap-3 drop-shadow-md">
                <LayoutTemplate className="w-8 h-8 opacity-90" /> 
                Dynamic Configuration Matrix
              </h1>
              <p className="text-blue-100 mt-2 font-medium tracking-wide">Orchestrating bespoke data collection endpoints.</p>
            </div>
            <button onClick={() => setMode('list')} className="w-max z-10 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4" /> Withdraw
            </button>
          </div>

          <div className="p-8 md:p-12 space-y-12">
             {/* Base Info */}
            <div className="space-y-6 bg-blue-50/30 p-8 rounded-3xl border border-blue-100/50 shadow-inner">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                  <FileText className="text-blue-400 w-6 h-6" />
                </div>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Endpoint Campaign Title (e.g. Service Review)" className="w-full text-3xl font-black text-slate-800 border-b-2 border-slate-200 focus:border-blue-600 outline-none pb-3 pl-10 transition bg-transparent placeholder:text-slate-300" />
              </div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide context regarding the metrics captured here..." className="w-full text-slate-600 border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 bg-white transition resize-y font-medium shadow-sm" rows="3" />
            </div>

            {/* Field Map */}
            <div className="space-y-6">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
                <Settings2 className="w-5 h-5 text-indigo-400" /> Field Configuration Payload
              </h2>
              {fields.length === 0 && (
                <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-slate-400 flex flex-col items-center">
                   <ClipboardCheck className="w-12 h-12 mb-4 text-slate-300"/>
                   <span className="font-bold text-lg">No schema fields assigned.</span>
                   <span className="text-sm font-medium mt-1">Utilize the component injection ribbon below to begin.</span>
                </div>
              )}
              {fields.map((field, idx) => (
                <div key={field.id} className="p-7 bg-white border border-slate-200 rounded-3xl relative shadow-sm hover:shadow-xl hover:border-slate-300 transition duration-300 group">
                  <div className="absolute top-0 right-0 bg-gradient-to-b from-slate-100 to-white text-slate-400 font-black px-4 py-1.5 rounded-bl-2xl rounded-tr-3xl text-xs shadow-sm border-b border-l border-slate-100">#{idx+1}</div>
                  
                  <button onClick={() => removeField(field.id)} className="absolute top-8 right-8 text-slate-300 hover:text-white hover:bg-red-500 p-2 rounded-xl transition bg-slate-50 border border-slate-200 group-hover:border-red-100 group-hover:text-red-500 shadow-sm" title="Remove Field">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="flex flex-col gap-6 pr-20 w-full">
                    <div>
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-2 block">Question Prompt Identifier</label>
                      <input 
                        type="text" 
                        value={field.label} 
                        onChange={e => updateField(field.id, 'label', e.target.value)}
                        className="font-extrabold text-slate-800 text-lg w-full md:w-4/5 p-4 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition shadow-inner"
                        placeholder="e.g. Rate your service experience"
                      />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-max shadow-sm">
                      <span className="bg-white border border-indigo-100 px-4 py-2 rounded-xl text-indigo-700 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-sm">
                        {field.type === 'text' && <AlignLeft className="w-4 h-4"/>}
                        {field.type === 'number' && <Hash className="w-4 h-4"/>}
                        {field.type === 'select' && <DropdownIcon className="w-4 h-4"/>}
                        {field.type === 'radio' && <ToggleLeft className="w-4 h-4"/>}
                        {field.type === 'textarea' && <AlignLeft className="w-4 h-4"/>}
                        {field.type} Render
                      </span>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <label className="flex items-center gap-3 cursor-pointer font-bold text-slate-700 bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-400 transition shadow-sm select-none">
                        <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer" />
                        Enforce Constraint
                      </label>
                    </div>
                    
                    {(field.type === 'radio' || field.type === 'select') && (
                      <div className="mt-2 bg-gradient-to-b from-slate-50 to-white p-6 border border-slate-200 rounded-2xl shadow-inner">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-slate-400"/> Permitted Selection Values</p>
                        <input 
                          type="text" 
                          value={field.options?.join(', ')} 
                          onChange={e => updateField(field.id, 'options', e.target.value.split(',').map(s=>s.trim()))}
                          className="w-full p-4 border border-slate-300 rounded-xl text-sm bg-white focus:bg-blue-50 transition outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 font-bold text-slate-700 shadow-sm"
                          placeholder="e.g. Yes, No, Undecided (Comma separated)"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Toolset */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-700 flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 relative z-10"><Plus className="w-4 h-4 text-blue-400"/> Schema Component Injection Ribbon</span>
              <div className="flex flex-wrap gap-4 relative z-10">
                <button onClick={() => addField('text')} className="px-5 py-3 bg-slate-800 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition font-bold text-slate-200 flex items-center gap-2 shadow-lg hover:-translate-y-0.5"><AlignLeft className="w-5 h-5 text-blue-400"/> Text Line</button>
                <button onClick={() => addField('textarea')} className="px-5 py-3 bg-slate-800 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition font-bold text-slate-200 flex items-center gap-2 shadow-lg hover:-translate-y-0.5"><AlignLeft className="w-5 h-5 text-emerald-400"/> Paragraph Box</button>
                <button onClick={() => addField('radio')} className="px-5 py-3 bg-slate-800 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition font-bold text-slate-200 flex items-center gap-2 shadow-lg hover:-translate-y-0.5"><ToggleLeft className="w-5 h-5 text-purple-400"/> Radio Toggles</button>
                <button onClick={() => addField('select')} className="px-5 py-3 bg-slate-800 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition font-bold text-slate-200 flex items-center gap-2 shadow-lg hover:-translate-y-0.5"><CheckSquare className="w-5 h-5 text-amber-400"/> Dropdown Selector</button>
                <button onClick={() => addField('number')} className="px-5 py-3 bg-slate-800 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition font-bold text-slate-200 flex items-center gap-2 shadow-lg hover:-translate-y-0.5"><Hash className="w-5 h-5 text-pink-400"/> Numerical Input</button>
              </div>
            </div>

            {/* Submission */}
            <div className="pt-6 border-t border-slate-100">
              <button onClick={handleSaveForm} disabled={saving} className="w-full py-6 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-black text-xl uppercase tracking-widest rounded-2xl shadow-2xl shadow-blue-600/30 transition transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50">
                {saving ? 'Validating Registry...' : 'Initialize Secure Schema Endpoint'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST MODE ---
  if (loading) return <div className="min-h-screen bg-slate-50 flex flex-col gap-4 items-center justify-center font-black text-blue-300 text-xl tracking-widest uppercase animate-pulse"><LayoutTemplate className="w-12 h-12 mb-2 text-indigo-200"/><span>Scanning Registry...</span></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-10 border-b border-slate-200 mb-12 bg-white rounded-3xl shadow-xl shadow-slate-200/50 px-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 to-transparent pointer-events-none"></div>
          <div className="relative z-10 w-full md:w-auto">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight drop-shadow-sm flex items-center gap-4">
              <LayoutTemplate className="w-12 h-12 text-blue-600" />
              Campaign Schemas
            </h1>
            <p className="text-slate-500 mt-3 font-semibold text-lg ml-1">Manage and orchestrate dynamic application endpoints</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 mt-8 md:mt-0 relative z-10">
            <Link to="/dashboard" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-black shadow-sm transition flex justify-center items-center gap-2 hover:border-slate-400 hover:text-slate-900">
              <BarChart2 className="w-5 h-5 text-indigo-500" /> Examine Submissions
            </Link>
            <button onClick={() => {
              setTitle(''); setDescription(''); setFields([]); setMode('build');
            }} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 font-black shadow-xl shadow-blue-500/40 transition flex justify-center items-center gap-2 transform hover:-translate-y-1">
              <Plus className="w-6 h-6" /> Construct New Payload
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {forms.length === 0 && <div className="col-span-full flex flex-col items-center justify-center py-40 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-300"><LayoutTemplate className="w-20 h-20 text-slate-200 mb-6" /><p className="text-slate-500 font-bold text-2xl tracking-wide">No active circuits available. Build one!</p></div>}
          
          {forms.map(form => (
            <div key={form.id} className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition transform hover:-translate-y-2 duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition duration-300"></div>
              <div>
                <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm mb-5 inline-block">Endpoint Cluster #{form.id}</span>
                <h3 className="font-black text-2xl text-slate-800 break-words leading-tight">{form.title}</h3>
                <p className="text-slate-500 mt-4 font-medium text-sm line-clamp-3 leading-relaxed">{form.description || <span className="italic opacity-50">No runtime description bound</span>}</p>
              </div>
              <div className="mt-10 border-t border-slate-100 pt-6 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-700 font-black bg-indigo-50/50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm" title="Total Valid Validations">
                  <BarChart2 className="w-4 h-4"/> {form.response_count} HITS
                </div>
                <button onClick={() => { copyLink(form.uuid); alert('Secure route copied!'); }} className="text-blue-600 hover:text-white text-xs font-black bg-white hover:bg-blue-600 px-5 py-2.5 rounded-xl border border-blue-200 hover:border-blue-600 transition shadow-sm flex items-center gap-2 uppercase tracking-wide">
                  <LinkIcon className="w-4 h-4" /> Copy Trajectory
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DropdownIcon({ className }) {
  // Safe fallback if CheckSquare mapping was preferred previously
  return <CheckSquare className={className} />
}
