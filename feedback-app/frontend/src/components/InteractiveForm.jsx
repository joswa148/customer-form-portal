import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Mail, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Info, ShieldCheck, CheckSquare, Check } from 'lucide-react';
import { countryCodes } from '../utils/countries';

const API_URL = 'http://localhost:5002/api';

export default function InteractiveForm() {
  const { uuid } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const searchParams = new URLSearchParams(window.location.search);
  const trackingRef = searchParams.get('ref');

  const [currentIndex, setCurrentIndex] = useState(-1); // -1 is intro, N is length (email step)
  const [answers, setAnswers] = useState({});
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhoneCode, setUserPhoneCode] = useState('+971');
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  
  const inputRef = useRef(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(`form_progress_${uuid}`);
    if (saved) {
      try {
        const { answers: savedAnswers, currentIndex: savedIndex, userEmail: savedEmail, userName: savedName, userPhoneCode: savedCode, userPhoneNumber: savedNumber } = JSON.parse(saved);
        if (savedAnswers) setAnswers(savedAnswers);
        if (savedIndex !== undefined) setCurrentIndex(savedIndex);
        if (savedEmail) setUserEmail(savedEmail);
        if (savedName) setUserName(savedName);
        if (savedCode) setUserPhoneCode(savedCode);
        if (savedNumber) setUserPhoneNumber(savedNumber);
      } catch (e) { console.error('Failed to parse saved progress', e); }
    }
  }, [uuid]);

  // Save to LocalStorage
  useEffect(() => {
    if (!loading && !submitSuccess) {
      localStorage.setItem(`form_progress_${uuid}`, JSON.stringify({ answers, currentIndex, userEmail, userName, userPhoneCode, userPhoneNumber }));
    }
  }, [answers, currentIndex, userEmail, userName, userPhoneCode, userPhoneNumber, loading, submitSuccess, uuid]);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/forms/${uuid}`);
        setFormConfig({ id: data.id, title: data.title, description: data.description });
        if (trackingRef) {
           axios.post(`${API_URL}/track-open`, { formId: data.id, ref: trackingRef }).catch(() => {});
        }
        
        let parsedFields = data.fields;
        if (typeof parsedFields === 'string') {
           try { parsedFields = JSON.parse(parsedFields); } catch(e) { console.error('Failed to parse fields schema', e); }
        }
        setFields(Array.isArray(parsedFields) ? parsedFields : []);
      } catch (err) {
        console.error('Failed to fetch form', err);
        setError('Form not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [uuid, trackingRef]);

  // Auto-focus logic
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex === -1) {
      if (!userName.trim() || !userEmail.includes('@') || !userPhoneNumber.trim()) {
        alert('Please provide your name, valid email, and phone number to start.');
        return;
      }
    }
    if (currentIndex >= 0 && currentIndex < fields.length) {
      const field = fields[currentIndex];
      const val = answersRef.current[field.id];
      const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      if (field.required && isEmpty) {
        alert('Please fill out this field before continuing.');
        return;
      }
    }
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, -1));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSubmit = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      setSubmitError('Please provide a valid email address so we can contact you.');
      return;
    }
    
    setSubmitError('');
    setSubmitLoading(true);
    
    try {
      const res = await axios.post(`${API_URL}/responses`, {
        formId: formConfig.id,
        userEmail,
        userName,
        userPhone: `${userPhoneCode} ${userPhoneNumber.trim()}`,
        answers,
        ref: trackingRef
      });
      // Handle 201 or 202 Accepted
      setSubmitSuccess(res.data.message || 'Success! Your response has been submitted.');
      localStorage.removeItem(`form_progress_${uuid}`);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'An error occurred during submission.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-indigo-300 text-sm tracking-[0.2em] uppercase animate-pulse">Initializing Experience...</div>;
  if (error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500 p-6 text-center font-black tracking-tight text-2xl"><AlertCircle className="w-8 h-8 mr-3"/>{error}</div>;

  const isIntro = currentIndex === -1;
  const isOutro = currentIndex === fields.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Visual Accent */}
      <div className="absolute top-0 w-full h-1.5 bg-indigo-600"></div>
      
      {/* Progress Architecture */}
      {!isIntro && !submitSuccess && (
        <div className="absolute top-8 w-full max-w-2xl px-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <button onClick={handlePrev} className="hover:text-indigo-600 transition flex items-center gap-1.5 active:scale-95"><ChevronLeft className="w-3.5 h-3.5"/> Step Back</button>
            <span>Progress {Math.min(currentIndex + 1, fields.length)} / {fields.length}</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden shadow-inner">
            <div className="bg-indigo-600 h-full transition-all duration-700 ease-out" style={{ width: `${(Math.min(currentIndex + 1, fields.length) / fields.length) * 100}%` }}></div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl relative z-10">
        
        {submitSuccess ? (
          <div className="text-center py-16 px-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl animate-fade-in-up">
            <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-sm">
               <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tight">Mission Accomplished</h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">{submitSuccess}</p>
            <div className="mt-12 pt-12 border-t border-slate-100 italic text-slate-300 text-xs font-bold uppercase tracking-widest">
               Submission Securely Processed
            </div>
          </div>
        ) : isIntro ? (
          <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-fade-in-up">
             <div className="text-center mb-10">
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Welcome</p>
               <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">{formConfig.title}</h1>
               <div className="h-1 w-12 bg-indigo-600 mx-auto rounded-full opacity-20 mb-4"></div>
               <p className="text-slate-500 font-medium leading-relaxed">{formConfig.description}</p>
             </div>
             
             <div className="space-y-6 mb-10">
               {/* Identity Section: Same as FeedbackForm */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name <span className="text-red-400">*</span></label>
                   <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-slate-900 font-semibold outline-none focus:border-indigo-600 focus:bg-white transition" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email <span className="text-red-400">*</span></label>
                   <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="name@domain.com" className="w-full bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-slate-900 font-semibold outline-none focus:border-indigo-600 focus:bg-white transition" />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cellular Contact <span className="text-red-400">*</span></label>
                 <div className="flex gap-2">
                   <select value={userPhoneCode} onChange={e => setUserPhoneCode(e.target.value)} className="w-1/3 bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white transition appearance-none">
                     {countryCodes.map((c, i) => <option key={i} value={c.code}>{c.name} ({c.code})</option>)}
                   </select>
                   <input type="tel" value={userPhoneNumber} onChange={e => setUserPhoneNumber(e.target.value)} placeholder="000 000 0000" className="w-2/3 bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white transition" />
                 </div>
               </div>
             </div>
             
             <button 
               onClick={handleNext} 
               className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl transition transform active:scale-[0.98]"
             >
               Initialize Questionnaire <ChevronRight className="w-5 h-5"/>
             </button>
          </div>
        ) : isOutro ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-fade-in-right text-center">
             <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-100">
                <Info className="w-10 h-10 text-indigo-600" />
             </div>
             <h2 className="text-3xl font-black mb-3 tracking-tight">One Last Step</h2>
             <p className="text-slate-500 font-medium mb-10 leading-relaxed">Please review your entries. Once ready, click the button below to synchronize your data securely with our systems.</p>
             
             {submitError && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 font-bold text-xs uppercase tracking-tight">
                  <AlertCircle className="w-5 h-5 shrink-0 opacity-70"/> {submitError}
                </div>
             )}

             <button 
               onClick={handleSubmit} 
               disabled={submitLoading}
               className="w-full bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl text-xl font-black uppercase tracking-[0.2em] shadow-2xl transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4"
             >
               {submitLoading ? 'Synchronizing...' : <>Commit & Submit <ShieldCheck className="w-6 h-6"/></>}
             </button>
          </div>
        ) : (
          <div className="animate-fade-in-right">
            {/* Field Rendering */}
            {(() => {
              const field = fields[currentIndex];
              return (
                <div className="w-full max-w-xl mx-auto space-y-1">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] ml-1 mb-2">Question {currentIndex + 1}</p>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                     {field.label} {field.required && <span className="text-indigo-400">*</span>}
                  </h2>
                  
                  <div className="space-y-6">
                    {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                       <input 
                         ref={inputRef}
                         type={field.type}
                         value={answers[field.id] || ''}
                         onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                         onKeyDown={handleKeyDown}
                         placeholder="Synthesize your response..."
                         className="w-full bg-transparent border-b-2 border-slate-200 text-2xl md:text-3xl font-black text-indigo-600 py-3 outline-none focus:border-indigo-600 transition placeholder:text-slate-200"
                       />
                    ) : field.type === 'textarea' ? (
                       <textarea 
                         ref={inputRef}
                         value={answers[field.id] || ''}
                         onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                         placeholder="Provide detailed feedback..."
                         rows="5"
                         className="w-full bg-white border border-slate-200 rounded-2xl text-slate-900 p-5 text-lg font-semibold outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition shadow-sm"
                       />
                    ) : (field.type === 'radio' || field.type === 'select' || field.type === 'checkbox' || field.type === 'dropdown-multi') ? (
                       <div className="flex flex-col gap-3">
                         {(field.options || []).map((opt, i) => {
                           const isMulti = field.type === 'checkbox' || field.type === 'dropdown-multi';
                           const currentArr = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                           const isSelected = isMulti ? currentArr.includes(opt) : answers[field.id] === opt;
                           
                           return (
                             <button 
                               key={i}
                               onClick={() => {
                                 if (isMulti) {
                                   setAnswers(prev => {
                                     const arr = Array.isArray(prev[field.id]) ? [...prev[field.id]] : [];
                                     const next = isSelected ? arr.filter(o => o !== opt) : [...arr, opt];
                                     return { ...prev, [field.id]: next };
                                   });
                                 } else {
                                   setAnswers(prev => ({...prev, [field.id]: opt}));
                                   setTimeout(handleNext, 400);
                                 }
                               }}
                               className={`group w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.99] ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 shadow-sm'}`}
                             >
                                <span className={`font-black text-sm uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'}`}>{opt}</span>
                                {isMulti ? (
                                   <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                                   </div>
                                ) : (
                                   <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                   </div>
                                )}
                             </button>
                           )
                         })}
                       </div>
                    ) : null}

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-10">
                      <button 
                        onClick={handleNext}
                        className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        Continue <ChevronRight className="w-5 h-5"/>
                      </button>
                      <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest hidden sm:inline-block opacity-40">Press Enter ↵</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-right { animation: fadeInRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}
