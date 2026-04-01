import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useParams } from 'react-router-dom';
import { 
  Mail, CheckCircle2, ShieldCheck, AlertCircle, MessageSquareText, CheckSquare,
  User, Zap, Star
} from 'lucide-react';
import { countryCodes } from '../utils/countries';

export default function FeedbackForm() {
  const { uuid } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhoneCode, setUserPhoneCode] = useState('+971');
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  const activeCountry = countryCodes.find(c => c.code === userPhoneCode) || countryCodes[0];

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data } = await api.get(`/forms/${uuid}`);
        setFormConfig(data);
        
        let parsedFields = data.fields;
        if (typeof parsedFields === 'string') {
           try { parsedFields = JSON.parse(parsedFields); } catch(e) { console.error('Failed to parse fields schema', e); }
        }
        setFields(Array.isArray(parsedFields) ? parsedFields : []);
        
        const initialAnswers = {};
        if (Array.isArray(parsedFields)) {
          parsedFields.forEach(f => initialAnswers[f.id] = '');
        }
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Failed to fetch form configuration', err);
        setError('Endpoint restricted or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [uuid]);

  const handleChange = (id, val) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    
    if (!userPhoneCode || !userPhoneNumber.trim()) {
      setSubmitError('Please provide a valid mobile number for verification.');
      return;
    }

    for (const f of fields) {
      const val = answers[f.id];
      const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      if (f.required && isEmpty) {
        setSubmitError(`A required entry is missing: ${f.label}`);
        return;
      }
    }

    setSubmitLoading(true);
    try {
      await api.post(`/responses`, {
        formId: formConfig.id,
        userEmail,
        userName,
        userPhone: `${userPhoneCode} ${userPhoneNumber.trim()}`,
        answers
      });
      setSubmitSuccess('Your response has been submitted successfully.');
      setAnswers(fields.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {}));
      setUserEmail('');
      setUserName('');
      setUserPhoneCode('+971');
      setUserPhoneNumber('');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'An error occurred during submission.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-black text-indigo-400 text-xs tracking-[0.4em] uppercase animate-pulse"><Zap className="w-12 h-12 mb-4 text-indigo-500"/> Synchronizing Form Node...</div>;
  
  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
       <div className="flex flex-col items-center bg-white p-12 shadow-2xl rounded-[2.5rem] border border-red-100 max-w-lg">
          <AlertCircle className="w-20 h-20 text-red-500 mb-6 drop-shadow-md"/>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Access Denied</h2>
          <p className="text-slate-500 font-bold text-center">{error}</p>
       </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 text-slate-100 py-4 px-4 font-sans flex flex-col items-center relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>
      
      <div className="w-full max-w-2xl relative z-10 animate-fade-in-up flex flex-col h-full max-h-[calc(100vh-2rem)]">
        <header className="text-center mb-4 shrink-0">
           <div className="w-8 h-1 bg-indigo-500 mx-auto mb-2 rounded-full"></div>
           <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">Feedback Node</p>
           <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-tight mb-1 uppercase">{formConfig.title}</h1>
           {formConfig.description && <p className="text-slate-400 text-[10px] font-bold max-w-lg mx-auto leading-relaxed hidden md:block">{formConfig.description}</p>}
        </header>

        <div className="bg-white/95 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.4)] border border-white/20 rounded-[1.5rem] relative group flex flex-col min-h-0 flex-1">
          <div className="absolute top-0 w-full h-1.5 bg-indigo-600 rounded-t-[1.5rem] z-10"></div>
          
          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 relative z-0">
            {submitError && (
              <div className="mb-8 p-5 bg-red-50 border-2 border-red-100 text-red-600 font-black text-[11px] uppercase tracking-wider rounded-2xl flex items-center gap-4 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0"/> {submitError}
              </div>
            )}
            
            {submitSuccess && (
              <div className="mb-12 text-center p-10 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] animate-fade-in-up">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                   <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={3}/> 
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Committed</h2>
                <p className="text-slate-500 font-bold text-sm leading-relaxed">{submitSuccess}</p>
              </div>
            )}

            {!submitSuccess && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ID Card */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <User className="w-3 h-3 text-indigo-400"/> Authentication
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 mb-1.5 tracking-widest uppercase block ml-1">Mobile Access</label>
                      <div className="flex gap-2">
                        <div className="relative w-[110px] shrink-0 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-100 transition overflow-hidden">
                          <select value={userPhoneCode} onChange={e => setUserPhoneCode(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-black appearance-none" title="Select Country">
                            {countryCodes.map((c, i) => <option key={i} value={c.code} className="text-black bg-white font-semibold">{c.name} ({c.code})</option>)}
                          </select>
                          <div className="flex items-center gap-1.5 pointer-events-none px-2">
                            <span className="text-[14px] text-slate-800 font-black">{activeCountry.flag}</span>
                            <span className="text-[10px] font-black text-slate-700">{activeCountry.code}</span>
                          </div>
                        </div>
                        <input type="tel" value={userPhoneNumber} onChange={e => setUserPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ''))} className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-slate-900 font-black outline-none focus:border-indigo-600 focus:bg-white focus:ring-[8px] focus:ring-indigo-600/5 transition text-[13px] placeholder:text-slate-400" placeholder="000 000 0000" required />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questionnaire */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <MessageSquareText className="w-3 h-3 text-indigo-400"/> Data Accumulation
                  </h3>
                  <div className="grid gap-6">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="relative group/field">
                        <label className="block text-[13px] font-black text-slate-800 mb-3 leading-tight flex items-start gap-3 uppercase tracking-tighter">
                          <span className="bg-indigo-600 text-white rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-widest shadow-md shadow-indigo-100">Q{idx + 1}</span>
                          {field.label} {field.required && <span className="text-indigo-500 font-black ml-1">*</span>}
                        </label>
                        
                        <div className="pl-0 md:pl-10">
                          {field.type === 'text' || field.type === 'email' ? (
                            <input 
                              type={field.type} 
                              value={answers[field.id] || ''}
                              onChange={e => handleChange(field.id, e.target.value)}
                              className="w-full bg-transparent border-b-2 border-slate-100 py-2 text-lg font-black text-indigo-600 outline-none focus:border-indigo-600 transition placeholder:text-slate-400"
                              required={field.required}
                              placeholder="Synchronize response..."
                            />
                          ) : field.type === 'number' ? (
                            <input 
                              type="number" 
                              value={answers[field.id] || ''}
                              onChange={e => handleChange(field.id, e.target.value)}
                              className="w-full md:w-32 bg-slate-50 border-2 border-slate-100 p-2 rounded-xl text-lg font-black text-indigo-600 outline-none focus:border-indigo-600 transition"
                              required={field.required}
                              placeholder="0"
                            />
                          ) : field.type === 'textarea' ? (
                            <textarea 
                              value={answers[field.id] || ''}
                              onChange={e => handleChange(field.id, e.target.value)}
                              rows="3"
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[13px] font-black text-slate-700 outline-none focus:border-indigo-600 focus:bg-white focus:ring-[8px] focus:ring-indigo-600/5 transition resize-none placeholder:text-slate-400"
                              required={field.required}
                              placeholder="Provide more info..."
                            />
                          ) : (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' || field.type === 'dropdown-multi') ? (
                            <div className="grid sm:grid-cols-2 gap-3">
                              {(field.options || []).map((opt, i) => {
                                const isSelection = field.type === 'radio' || field.type === 'select';
                                const isSelected = isSelection ? answers[field.id] === opt : (Array.isArray(answers[field.id]) && answers[field.id].includes(opt));
                                const label = typeof opt === 'string' ? opt : opt.label;
                                
                                return (
                                  <label key={i} className={`flex items-center justify-between gap-2 cursor-pointer p-3 rounded-xl border-2 transition-all active:scale-[0.97] ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'}`}>
                                    <input 
                                      type={isSelection ? "radio" : "checkbox"}
                                      name={field.id}
                                      value={label}
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (isSelection) {
                                          handleChange(field.id, label);
                                        } else {
                                          const arr = Array.isArray(answers[field.id]) ? [...answers[field.id]] : [];
                                          const next = e.target.checked ? [...arr, label] : arr.filter(o => o !== label);
                                          handleChange(field.id, next);
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
                                    {isSelected ? <CheckSquare className="w-4 h-4 text-white"/> : <div className="w-4 h-4 rounded-md border-2 border-slate-200" />}
                                  </label>
                                )
                              })}
                            </div>
                          ) : field.type === 'rating' ? (
                            <div className="flex gap-4 items-center py-4">
                               {[1,2,3,4,5].map(star => (
                                 <button
                                   key={star}
                                   type="button"
                                   onClick={() => handleChange(field.id, star)}
                                   className={`p-1 transition-all ${answers[field.id] >= star ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
                                 >
                                   <Star className={`w-8 h-8 ${answers[field.id] >= star ? 'fill-current' : ''}`} />
                                 </button>
                               ))}
                               <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{answers[field.id] ? `${answers[field.id]} / 5 Score` : 'Select Magnitude'}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 flex flex-col items-center gap-4">
                   <button 
                     type="submit" 
                     disabled={submitLoading}
                     className="w-full bg-slate-950 hover:bg-black text-white px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(0,0,0,0.3)] bg-gradient-to-r from-slate-900 to-black transition transform active:scale-[0.97] group flex items-center justify-center gap-4"
                   >
                     {submitLoading ? 'Synchronizing...' : <>Commit <Zap className="w-5 h-5 fill-current"/></>}
                   </button>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck className="w-3.5 h-3.5 text-indigo-400"/> Cryptographic verification enabled
                   </p>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <footer className="mt-16 text-center">
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] opacity-30">Antigravity Design Protocol </span>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        body { font-family: 'Outfit', sans-serif; -webkit-font-smoothing: antialiased; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }

        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}} />
    </div>
  );
}
