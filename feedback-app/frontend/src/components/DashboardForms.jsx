import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Link as LinkIcon, Trash2, ArrowLeft, BarChart2, LayoutTemplate, Settings2, FileText, Hash, CheckSquare, AlignLeft, ToggleLeft, ClipboardCheck, MessageCircle, Edit2, ChevronRight, ShieldCheck } from 'lucide-react';

const API_URL = 'http://localhost:5002/api/forms';

export default function DashboardForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mode, setMode] = useState('list'); // 'list' or 'build'
  
  // Builder State
  const [editingId, setEditingId] = useState(null);
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
      console.error('Failed to fetch forms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const addField = (type) => {
    const defaultOptions = [
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

    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: (type === 'checkbox' || type === 'dropdown-multi') && fields.length === 0 ? 'Which services are you interested in?' : `New ${type} question`,
      required: false,
      options: type === 'radio' || type === 'select' || type === 'checkbox' || type === 'dropdown-multi' ? defaultOptions : undefined
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
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { title, description, fields });
      } else {
        await axios.post(API_URL, { title, description, fields });
      }
      setMode('list');
      setEditingId(null);
      fetchForms();
    } catch (err) {
      console.error(err);
      alert('Failed to save form.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (uuid) => {
    const trackingRef = window.prompt("Enter Recipient Name/ID for tracking (Optional):", "");
    const trackingParam = trackingRef ? `?ref=${encodeURIComponent(trackingRef.trim())}` : '';
    
    let origin = window.location.origin;
    navigator.clipboard.writeText(`${origin}/interactive/${uuid}${trackingParam}`);
    alert('Tracked link copied to clipboard!');
  };

  const shareWhatsApp = (uuid, formTitle) => {
    const trackingRef = window.prompt("Enter Recipient Name/ID for tracking (Optional):", "");
    const trackingParam = trackingRef ? `?ref=${encodeURIComponent(trackingRef.trim())}` : '';
    
    let origin = window.location.origin;
    const rawUrl = `${origin}/interactive/${uuid}${trackingParam}`;
    const text = encodeURIComponent(`Please take a moment to quickly share your feedback on "${formTitle}":\n\n${rawUrl}`);
    
    // Use the official api.whatsapp.com endpoint which reliably supports WhatsApp Web, Desktop, and Mobile bridging
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const editForm = (form) => {
    setEditingId(form.id);
    setTitle(form.title);
    setDescription(form.description || '');
    let schema = form.fields;
    if (typeof schema === 'string') {
      try { schema = JSON.parse(schema); } catch { schema = []; }
    }
    setFields(Array.isArray(schema) ? schema : []);
    setMode('build');
  };

  if (mode === 'build') {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-6 font-sans">
        <div className="max-w-4xl mx-auto bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 w-full h-1 bg-indigo-600"></div>
          
          {/* Builder Header */}
          <header className="p-8 pb-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Form Architect</p>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {editingId ? 'Edit Questionnaire' : 'Create New Form'}
               </h1>
            </div>
            <button onClick={() => setMode('list')} className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 rounded-xl hover:bg-slate-50 transition active:scale-95 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Exit Builder
            </button>
          </header>

          <div className="p-8 space-y-10">
             {/* Base Info: Clean and balanced */}
            <section className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Form Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Service Satisfaction Survey" 
                  className="w-full text-2xl font-black text-slate-900 border border-slate-100 bg-slate-50/30 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition placeholder:text-slate-200" 
                />
              </div>
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Context / Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="What is this form for?" 
                  className="w-full text-slate-600 border border-slate-100 bg-slate-50/30 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition resize-none font-semibold text-sm h-24" 
                />
              </div>
            </section>

            {/* Questions Mapping: Inherit card style from FeedbackForm */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-indigo-500" /> Structure & Questions
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{fields.length} Questions Total</span>
              </div>
              
              {fields.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center">
                   <ClipboardCheck className="w-10 h-10 mb-3 text-slate-200"/>
                   <p className="font-black text-slate-400 text-sm uppercase tracking-widest">Workspace Empty</p>
                   <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">Use the tools below to start adding questions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-6 bg-white border border-slate-200 rounded-2xl relative shadow-sm hover:border-indigo-400 transition-colors duration-200 group">
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter border border-slate-100 rounded-md px-1.5 py-0.5">Q{idx+1}</span>
                         <button onClick={() => removeField(field.id)} className="text-slate-300 hover:text-red-500 transition p-1" title="Remove Question">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                      
                      <div className="flex flex-col gap-5 pr-12">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-indigo-600 uppercase tracking-wider mb-1 block">Question Label</label>
                          <input 
                            type="text" 
                            value={field.label} 
                            onChange={e => updateField(field.id, 'label', e.target.value)}
                            className="w-full font-black text-slate-800 text-sm p-4 border border-slate-50 bg-slate-50/50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm">
                            {field.type} Mode
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer text-[9px] font-black uppercase bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 transition shadow-sm select-none tracking-widest">
                            <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer" />
                            Required
                          </label>
                        </div>
                        
                        {(field.type === 'radio' || field.type === 'select' || field.type === 'checkbox' || field.type === 'dropdown-multi') && (
                          <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">Choice Config <span className="text-slate-300 normal-case font-medium">(comma separated)</span></p>
                            <input 
                              type="text" 
                              value={field.options?.join(', ')} 
                              onChange={e => updateField(field.id, 'options', e.target.value.split(',').map(s=>s.trim()))}
                              className="w-full p-3 border border-slate-200 rounded-lg text-[11px] bg-white focus:bg-indigo-50 transition outline-none font-bold text-slate-700 shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Toolbox: Minimalist grid of tools */}
            <section className="bg-slate-900 p-8 rounded-3xl border border-black shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent pointer-events-none"></div>
              <h3 className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 relative z-10"><Plus className="w-4 h-4 text-indigo-400"/> Interactive Field Toolbox</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
                {[
                  { id: 'text', icon: AlignLeft, label: 'Short Text' },
                  { id: 'textarea', icon: AlignLeft, label: 'Long Text' },
                  { id: 'radio', icon: ToggleLeft, label: 'Single Choice' },
                  { id: 'checkbox', icon: CheckSquare, label: 'Multi Choice' },
                  { id: 'select', icon: AlignLeft, label: 'Dropdown' },
                  { id: 'dropdown-multi', icon: CheckSquare, label: 'Multi Select' },
                  { id: 'number', icon: Hash, label: 'Number' },
                ].map(tool => (
                  <button 
                    key={tool.id}
                    onClick={() => addField(tool.id)} 
                    className="px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition font-black text-slate-200 text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg active:scale-95 whitespace-nowrap"
                  >
                    <tool.icon className="w-4 h-4 text-indigo-400"/> {tool.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Save Action */}
            <div className="pt-6">
              <button onClick={handleSaveForm} disabled={saving} className="w-full py-5 text-white bg-slate-900 hover:bg-black font-black text-lg uppercase tracking-[0.2em] rounded-2xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                {saving ? 'Synchronizing...' : <>Commit Save <ShieldCheck className="w-5 h-5"/></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST MODE ---
  if (loading) return <div className="min-h-screen bg-slate-50 flex flex-col gap-4 items-center justify-center font-black text-indigo-300 text-sm tracking-[0.2em] uppercase animate-pulse"><LayoutTemplate className="w-10 h-10 mb-2 opacity-30"/><span>Loading Forms...</span></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header: Minimalist & Balanced */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-slate-200 gap-4">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Form Administration</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutTemplate className="w-6 h-6 text-slate-400" />
              Manage Feedback Forms
            </h1>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link to="/dashboard" className="flex-1 md:flex-none px-5 py-2.5 text-[11px] bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-black uppercase tracking-widest shadow-sm transition flex justify-center items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-400" /> Responses
            </Link>
            <button onClick={() => {
              setEditingId(null); setTitle(''); setDescription(''); setFields([]); setMode('build');
            }} className="flex-1 md:flex-none px-5 py-2.5 text-[11px] bg-slate-900 text-white rounded-xl hover:bg-black font-black uppercase tracking-widest shadow-lg transition flex justify-center items-center gap-2 transform active:scale-95">
              <Plus className="w-4 h-4" /> Create Form
            </button>
          </div>
        </header>

        {forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="bg-slate-50 p-6 rounded-full border border-slate-100 mb-6"><LayoutTemplate className="w-12 h-12 text-slate-300" /></div>
            <h2 className="text-xl font-black text-slate-900 mb-2">No active forms</h2>
            <p className="text-slate-400 text-sm font-medium mb-8 max-w-sm">Every great relationship starts with feedback. Build your first questionnaire to start gathering insights.</p>
            <button onClick={() => { setEditingId(null); setTitle(''); setDescription(''); setFields([]); setMode('build'); }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-indigo-700 transition">
              Launch Builder
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {forms.map(form => (
              <div key={form.id} className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md border border-slate-200 flex flex-col justify-between transition-all duration-300 relative group">
                <div className="absolute top-4 right-4 text-[9px] font-black text-slate-300 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">ID {form.id}</div>
                
                <div className="flex flex-col mb-6">
                  <h3 className="font-black text-lg text-slate-900 leading-tight tracking-tight mb-2 group-hover:text-indigo-600 transition-colors uppercase">{form.title}</h3>
                  <p className="text-slate-500 font-medium text-[11px] line-clamp-3 min-h-[3rem] leading-relaxed">
                    {form.description || <span className="text-slate-300 italic">No description provided</span>}
                  </p>
                  
                  <div className="mt-6 flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase">
                       <BarChart2 className="w-3 h-3"/> {form.response_count || 0}
                    </span>
                    <span className="bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                       {form.fields && (typeof form.fields === 'string' ? JSON.parse(form.fields).length : form.fields.length)} Fields
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <Link to={`/dashboard?formId=${form.id}`} className="w-full flex justify-center items-center gap-2 bg-slate-900 border border-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition shadow-sm active:scale-[0.98]">
                    View Data <ChevronRight className="w-3 h-3"/>
                  </Link>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => shareWhatsApp(form.uuid, form.title)} title="Share via WhatsApp" className="flex justify-center items-center bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 p-2.5 rounded-xl transition shadow-sm">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => { copyLink(form.uuid); }} title="Copy Link" className="flex justify-center items-center bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 p-2.5 rounded-xl transition shadow-sm">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => editForm(form)} title="Edit Form" className="flex justify-center items-center bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-600 hover:text-orange-700 p-2.5 rounded-xl transition shadow-sm">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DropdownIcon({ className }) {
  // Safe fallback if CheckSquare mapping was preferred previously
  return <CheckSquare className={className} />
}