import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Plus, Link as LinkIcon, Trash2, ArrowLeft, BarChart2, LayoutTemplate, Settings2, FileText, Hash, CheckSquare, AlignLeft, ToggleLeft, ClipboardCheck, MessageCircle, Edit2, ChevronRight, ShieldCheck } from 'lucide-react';

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
      const { data } = await api.get('/forms');
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
        await api.put(`/forms/${editingId}`, { title, description, fields });
      } else {
        await api.post('/forms', { title, description, fields });
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
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappUrl = isMobile ? `whatsapp://send?text=${text}` : `https://web.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, '_blank');
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
      <div className="h-screen bg-white font-sans overflow-hidden flex flex-col pt-2 selection:bg-indigo-100 selection:text-indigo-900">
        
        {/* Builder Header: Synced with Admin Header */}
        <header className="bg-slate-900 px-6 py-4 flex items-center justify-between shadow-2xl z-20 shrink-0 mx-2 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/5">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                {editingId ? 'Edit Form' : 'Create New Form'}
              </h1>
              <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">Form Settings & Questions</p>
            </div>
          </div>

          <button onClick={() => setMode('list')} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3 group active:scale-95">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Discard & Exit
          </button>
        </header>

        {/* Builder Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
          <div className="max-w-4xl mx-auto p-8 space-y-10">
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

            <div className="pt-6">
              <button onClick={handleSaveForm} disabled={saving} className="w-full py-5 text-white bg-slate-900 hover:bg-black font-black text-lg uppercase tracking-[0.2em] rounded-2xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                {saving ? 'Saving...' : <>Save Form <ShieldCheck className="w-5 h-5"/></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST MODE ---
  if (loading) return <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-black text-indigo-300 text-xl tracking-widest uppercase animate-pulse"><LayoutTemplate className="w-12 h-12 mb-3 text-indigo-200"/> Loading Forms...</div>;

  return (
    <div className="h-screen bg-white font-sans overflow-hidden flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Premium Admin Header: Synced with Response Hub */}
      <header className="bg-slate-900 px-6 py-4 flex items-center justify-between shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <LayoutTemplate className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Manage Forms</h1>
            <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">Create and Manage Forms</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-sm rounded-2xl font-black transition-all flex items-center gap-3 group">
            <BarChart2 className="w-4 h-4 group-hover:-rotate-12 transition-transform" /> Overview Stats
          </Link>
          <button 
            onClick={() => { setEditingId(null); setTitle(''); setDescription(''); setFields([]); setMode('build'); }} 
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-2xl font-black shadow-[0_4px_15px_rgba(99,102,241,0.4)] transition-all flex items-center gap-3 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Create New Form
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          {forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-4 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm text-center">
              <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 mb-8 grow-0">
                <LayoutTemplate className="w-16 h-16 text-slate-200" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter uppercase">No Forms Yet</h2>
              <p className="text-slate-400 text-sm font-bold mb-10 max-w-sm mx-auto leading-relaxed">
                You haven't created any forms yet. Create a form to start collecting feedback.
              </p>
              <button 
                onClick={() => { setEditingId(null); setTitle(''); setDescription(''); setFields([]); setMode('build'); }} 
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition transform active:scale-95"
              >
                Create Form
              </button>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {forms.map(form => (
                <div key={form.id} className="bg-white p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] border-2 border-slate-50 flex flex-col justify-between transition-all duration-500 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 group-hover:bg-indigo-500 transition-colors"></div>
                  
                  <div className="flex flex-col mb-8">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">Form {form.id}</span>
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">UUID {form.uuid?.split('-')[0]}</span>
                    </div>

                    <h3 className="font-black text-xl text-slate-900 leading-tight tracking-tight mb-3 uppercase group-hover:text-indigo-600 transition-colors">{form.title}</h3>
                    <p className="text-slate-500 font-bold text-[11px] line-clamp-2 min-h-[2.5rem] leading-relaxed opacity-60">
                      {form.description || 'A form for collecting customer feedback.'}
                    </p>
                    
                    <div className="mt-8 flex items-center gap-2">
                      <div className="bg-slate-50 text-slate-900 border-2 border-slate-100 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 uppercase tracking-tight">
                         <BarChart2 className="w-3.5 h-3.5 text-indigo-500"/> {form.response_count || 0} <span className="text-slate-300">Responses</span>
                      </div>
                      <div className="bg-slate-50 text-slate-400 border-2 border-slate-100 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
                         {form.fields && (typeof form.fields === 'string' ? JSON.parse(form.fields).length : form.fields.length)} Fields
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-8 border-t-2 border-slate-50">
                    <Link to={`/dashboard?formId=${form.id}`} className="w-full flex justify-center items-center gap-3 bg-slate-950 hover:bg-black text-white font-black uppercase text-[10px] tracking-[0.3em] py-4 rounded-2xl transition shadow-xl active:scale-[0.98] group/btn">
                      View Responses <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"/>
                    </Link>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => shareWhatsApp(form.uuid, form.title)} title="Share via WhatsApp" className="flex justify-center items-center bg-white border-2 border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 p-3 rounded-2xl transition shadow-sm group/i">
                        <MessageCircle className="w-4 h-4 group-hover/i:scale-110 transition-transform" />
                      </button>
                      <button onClick={() => { copyLink(form.uuid); }} title="Copy Link" className="flex justify-center items-center bg-white border-2 border-slate-100 hover:border-indigo-500/30 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 p-3 rounded-2xl transition shadow-sm group/i">
                        <LinkIcon className="w-4 h-4 group-hover/i:scale-110 transition-transform" />
                      </button>
                      <button onClick={() => editForm(form)} title="Edit Form" className="flex justify-center items-center bg-white border-2 border-slate-100 hover:border-orange-500/30 hover:bg-orange-50 text-slate-400 hover:text-orange-600 p-3 rounded-2xl transition shadow-sm group/i">
                        <Edit2 className="w-4 h-4 group-hover/i:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DropdownIcon({ className }) {
  // Safe fallback if CheckSquare mapping was preferred previously
  return <CheckSquare className={className} />
}