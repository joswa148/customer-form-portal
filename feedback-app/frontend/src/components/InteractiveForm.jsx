import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { 
  Mail, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, 
  Info, ShieldCheck, Check, WifiOff, X, User, Phone, Zap, MousePointer2
} from 'lucide-react';
import { countryCodes } from '../utils/countries';
import analytics from '../utils/analytics';

const API_URL = 'http://localhost:5002/api';

export default function InteractiveForm() {
  const { uuid } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const searchParams = new URLSearchParams(window.location.search);
  const trackingRef = searchParams.get('ref');

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhoneCode, setUserPhoneCode] = useState('+971');
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  
  const inputRef = useRef(null);
  const questionHeadingRef = useRef(null);
  const autoAdvanceTimer = useRef(null);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Online Monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(`form_progress_v2_${uuid}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.answers) setAnswers(data.answers);
        if (data.currentIndex !== undefined) setCurrentIndex(data.currentIndex);
        if (data.userEmail) setUserEmail(data.userEmail);
        if (data.userName) setUserName(data.userName);
        if (data.userPhoneCode) setUserPhoneCode(data.userPhoneCode);
        if (data.userPhoneNumber) setUserPhoneNumber(data.userPhoneNumber);
      } catch (e) { console.error('Failed to restore v2 progress', e); }
    }
  }, [uuid]);

  // Debounced Save to LocalStorage
  useEffect(() => {
    if (loading || submitSuccess) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`form_progress_v2_${uuid}`, JSON.stringify({ 
        answers, currentIndex, userEmail, userName, userPhoneCode, userPhoneNumber 
      }));
    }, 300);
    return () => clearTimeout(timer);
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
           try { parsedFields = JSON.parse(parsedFields); } catch(e) { console.error('Failed to parse fields', e); }
        }
        setFields(Array.isArray(parsedFields) ? parsedFields : []);
      } catch (err) {
        console.error('Failed to fetch form', err);
        setError('Endpoint offline or restricted.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [uuid, trackingRef]);

  // Analytics: Form Start
  useEffect(() => {
    if (formConfig) {
      analytics.trackFormStarted(formConfig.title, trackingRef);
    }
  }, [formConfig, trackingRef]);

  // Analytics: Drop-off Detection (Abandonment)
  useEffect(() => {
    const handleUnload = () => {
       if (!submitSuccess) {
         analytics.trackAbandonment(currentIndexRef.current);
       }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [submitSuccess]);

  // Accessibility Announcement, Focus & Analytics View
  useEffect(() => {
    let msg = '';
    let questionText = fields[currentIndex]?.label || '';

    if (currentIndex === -1) {
      msg = "Welcome. Please provide your contact details to start.";
      questionText = "Intro / Contact Details";
    } else if (currentIndex === fields.length) {
      msg = "Final Step. Please review your entries.";
      questionText = "Review / Submit";
    } else {
      msg = `Step ${currentIndex + 1} of ${fields.length}. ${fields[currentIndex]?.label}`;
    }

    setAnnouncement(msg);
    analytics.trackStepView(currentIndex, questionText);

    if (inputRef.current) {
      inputRef.current.focus();
    } else if (questionHeadingRef.current) {
      questionHeadingRef.current.focus();
    }
  }, [currentIndex, fields]);

  const handleNext = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    // Track step completion before moving
    analytics.trackNavigation('next', currentIndex);
    if (currentIndex >= 0 && currentIndex < fields.length) {
      const field = fields[currentIndex];
      analytics.trackAnswerSelection(currentIndex, field.id, answersRef.current[field.id]);
    }

    if (currentIndex === -1) {
      if (!userName.trim() || !userEmail.includes('@') || !userPhoneNumber.trim()) {
        alert('Required: Name, Email, and Phone.');
        return;
      }
    }
    if (currentIndex >= 0 && currentIndex < fields.length) {
      const field = fields[currentIndex];
      const val = answersRef.current[field.id];
      const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      if (field.required && isEmpty) {
        alert('Required field missing.');
        return;
      }
    }
    setCurrentIndex(prev => Math.min(prev + 1, fields.length));
  }, [currentIndex, fields, userName, userEmail, userPhoneNumber]);

  const handlePrev = useCallback(() => {
    analytics.trackNavigation('back', currentIndex);
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setCurrentIndex(prev => Math.max(prev - 1, -1));
  }, [currentIndex]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
    if (e.key === 'Escape') {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
        setAnnouncement("Auto-advance cancelled.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!isOnline) {
      alert("System offline. Please reconnect to submit.");
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
      const msg = res.data.message || 'Transmission Successful';
      setSubmitSuccess(msg);
      analytics.trackCompletion(formConfig.title, msg);
      localStorage.removeItem(`form_progress_v2_${uuid}`);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Sync Failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const [isPhonePickerOpen, setIsPhonePickerOpen] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  
  const filteredCountries = countryCodes.filter(c => 
    (c.name || '').toLowerCase().includes(phoneSearch.toLowerCase()) || 
    (c.code || '').includes(phoneSearch)
  );

  const activeCountry = countryCodes.find(c => c.code === userPhoneCode) || countryCodes[0];

  if (loading) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-black text-indigo-400 text-xs tracking-[0.4em] uppercase animate-pulse"><Zap className="w-12 h-12 mb-4 text-indigo-500"/> Initializing Secure Portal...</div>;
  if (error) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500 p-8 text-center font-black tracking-tight text-xl"><AlertCircle className="w-6 h-6 mr-3"/>{error}</div>;

  const isIntro = currentIndex === -1;
  const isOutro = currentIndex === fields.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-center items-center p-2 md:p-6 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      {/* Accessibility: Screen Reader Announcements */}
      <div aria-live="polite" className="sr-only">{announcement}</div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-fade-in-up">
           <WifiOff className="w-3 h-3" /> Connection Interrupted — Syncing to Vault
        </div>
      )}

      {/* Progress Architecture: Premium Gradient Glow Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-white/5 z-50 shadow-inner">
         {!isIntro && !submitSuccess && (
           <div 
             className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_25px_rgba(99,102,241,0.8)] relative" 
             style={{ width: `${(Math.max(0, currentIndex + 1) / (fields.length + 1)) * 100}%` }}
           >
              <div className="absolute top-0 right-0 w-4 h-full bg-white blur-sm"></div>
           </div>
         )}
      </div>

      <div className="w-full max-w-[540px] relative z-10 animate-fade-in-up">
        
        {!submitSuccess && !isIntro && (
          <div className="mb-4 flex justify-between items-end px-3">
            <button 
              onClick={handlePrev} 
              className="text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2 transition-all active:scale-[0.95] outline-none group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Step Back
            </button>
            <div className="flex flex-col items-end gap-1">
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Checkpoint {currentIndex + 1} <span className="text-slate-600">/</span> {fields.length}</span>
               <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden flex">
                  <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${Math.round(((currentIndex + 1) / (fields.length + 1)) * 100)}%` }}></div>
               </div>
            </div>
          </div>
        )}

        {/* Form Container: Glass-Matrix Aesthetic */}
        <div className="bg-white/95 backdrop-blur-xl p-4 md:p-8 rounded-[1.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.4)] overflow-hidden relative transition-all duration-500 border border-white/20 group/card">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
          
          {submitSuccess ? (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="bg-emerald-500 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border-4 border-emerald-100 shadow-[0_20px_40px_rgba(16,185,129,0.3)] rotate-3">
                 <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Data Transmitted</h1>
              <p className="text-md text-slate-500 font-bold leading-relaxed max-w-sm mx-auto">{submitSuccess}</p>
              <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center gap-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature Hash</span>
                 <code className="bg-slate-100 px-4 py-2 rounded-xl text-slate-600 text-[11px] font-black tracking-tighter">
                    {Math.random().toString(36).substr(2, 12).toUpperCase()}
                 </code>
              </div>
            </div>
          ) : isIntro ? (
            <div className="animate-fade-in-up">
               <header className="text-center mb-6">
                 <div className="w-10 h-1 bg-indigo-600 mx-auto mb-4 rounded-full"></div>
                 <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-2">Secure Intake Session</p>
                 <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight mb-3 uppercase">{formConfig.title}</h1>
                 <p className="text-slate-500 text-[12px] font-bold leading-relaxed max-w-xs mx-auto opacity-70">{formConfig.description}</p>
               </header>
               
               <div className="space-y-4 mb-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                       <User className="w-3 h-3 text-indigo-400"/> Full Identity
                     </label>
                     <input 
                       type="text" 
                       value={userName} 
                       onChange={e => setUserName(e.target.value)} 
                       placeholder="e.g. Liam Anderson" 
                       className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-slate-900 font-black outline-none focus:border-indigo-600 focus:bg-white focus:ring-[12px] focus:ring-indigo-600/5 transition text-sm active:scale-[0.99] placeholder:text-slate-300" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                       <Mail className="w-3 h-3 text-indigo-400"/> Email Matrix
                     </label>
                     <input 
                       type="email" 
                       value={userEmail} 
                       onChange={e => setUserEmail(e.target.value)} 
                       placeholder="name@domain.com" 
                       className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-slate-900 font-black outline-none focus:border-indigo-600 focus:bg-white focus:ring-[12px] focus:ring-indigo-600/5 transition text-sm active:scale-[0.99] placeholder:text-slate-300" 
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                       <Phone className="w-3 h-3 text-indigo-400"/> Mobile Gateway
                    </label>
                    <div className="flex gap-0 bg-slate-50 border-2 border-slate-100 rounded-2xl overflow-visible focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-[12px] focus-within:ring-indigo-600/5 transition">
                      <div className="relative shrink-0 border-r-2 border-slate-100">
                         <button 
                           type="button"
                           onClick={() => setIsPhonePickerOpen(!isPhonePickerOpen)}
                           className="h-full flex items-center gap-2 px-5 hover:bg-slate-100 transition outline-none"
                         >
                           <span className="text-xl">{activeCountry.flag}</span>
                           <span className="text-sm font-black text-slate-900">{activeCountry.code}</span>
                         </button>

                         {isPhonePickerOpen && (
                           <div className="absolute top-full left-0 mt-3 w-[280px] bg-white border-2 border-slate-100 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] z-[100] overflow-hidden animate-fade-in-up">
                             <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <input 
                                  type="text" 
                                  autoFocus
                                  placeholder="Secure Country Search..." 
                                  value={phoneSearch}
                                  onChange={e => setPhoneSearch(e.target.value)}
                                  className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-black outline-none focus:border-indigo-500"
                                />
                             </div>
                             <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                                {filteredCountries.map((c, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      setUserPhoneCode(c.code);
                                      setIsPhonePickerOpen(false);
                                      setPhoneSearch('');
                                    }}
                                    className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 transition border-b border-slate-50 last:border-0"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">{c.flag}</span>
                                      <span className="text-[11px] font-black text-slate-600">{c.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-500">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                           </div>
                         )}
                      </div>

                      <input 
                        type="tel" 
                        value={userPhoneNumber} 
                        onChange={e => setUserPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ''))} 
                        placeholder="000 000 0000" 
                        className="flex-1 bg-transparent p-4 text-slate-900 font-black outline-none text-sm active:scale-[0.98] placeholder:text-slate-300" 
                      />
                    </div>
                    {isPhonePickerOpen && <div className="fixed inset-0 z-40" onClick={() => setIsPhonePickerOpen(false)}></div>}
                 </div>
               </div>
               
               <button 
                 onClick={handleNext} 
                 className="w-full group/btn flex items-center justify-center gap-3 bg-slate-950 hover:bg-black text-white px-6 py-5 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-all transform active:scale-[0.97]"
               >
                 Start Entry <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"/>
               </button>

               <div className="mt-6 flex items-center gap-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                  <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0"/>
                  <p className="text-[9px] font-black text-indigo-700/60 leading-tight uppercase tracking-widest">
                     Secure 256-bit encryption active.
                  </p>
               </div>
            </div>
          ) : isOutro ? (
            <div className="animate-fade-in-right text-center py-6">
               <div className="bg-indigo-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_40px_rgba(79,70,229,0.3)] rotate-3">
                  <ShieldCheck className="w-12 h-12 text-white" strokeWidth={2} />
               </div>
               <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Final Committal</h2>
               <p className="text-slate-500 text-sm font-bold mb-12 leading-relaxed px-8 opacity-70">Review complete. Please execute the committal command to synchronize your responses to our secure analytics matrix.</p>
               
               {submitError && (
                  <div className="mb-8 p-5 bg-red-50 border-2 border-red-100 text-red-600 rounded-2xl flex items-center gap-4 font-black text-[11px] uppercase tracking-[0.1em] animate-shake">
                    <AlertCircle className="w-5 h-5 shrink-0"/> {submitError}
                  </div>
               )}

               <button 
                 onClick={handleSubmit} 
                 disabled={submitLoading}
                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all transform active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-4"
               >
                 {submitLoading ? 'Synchronizing...' : <>Commit Submission <Zap className="w-5 h-5 fill-current"/></>}
               </button>
            </div>
          ) : (
            <div className="animate-fade-in-right" key={currentIndex}>
              <fieldset className="border-none p-0 m-0">
                <legend className="sr-only">Step {currentIndex + 1}</legend>
                
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-4">Question Matrix {currentIndex + 1}</p>
                <h2 
                  ref={questionHeadingRef} 
                  tabIndex="-1" 
                  className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight mb-6 outline-none focus:text-indigo-600 transition-colors uppercase"
                >
                   {fields[currentIndex]?.label} {fields[currentIndex]?.required && <span className="text-indigo-400 font-black ml-1">*</span>}
                </h2>
                
                <div className="space-y-6">
                   {(() => {
                     const field = fields[currentIndex];
                     if (!field) return null;

                     if (field.type === 'text' || field.type === 'email' || field.type === 'number') {
                        return (
                          <div className="relative group">
                            <input 
                              ref={inputRef}
                              type={field.type}
                              value={answers[field.id] || ''}
                              onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                              onKeyDown={handleKeyDown}
                              placeholder="Type response..."
                              className="w-full bg-transparent border-b-2 border-slate-100 text-xl md:text-2xl font-black text-indigo-600 py-4 outline-none focus:border-indigo-600 transition-all placeholder:text-slate-100 active:scale-[0.99] focus:placeholder:opacity-0"
                            />
                            <div className="absolute right-0 bottom-4 text-[9px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">Press Enter ↵</div>
                          </div>
                        );
                     }

                     if (field.type === 'textarea') {
                        return (
                          <textarea 
                            ref={inputRef}
                            value={answers[field.id] || ''}
                            onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                            placeholder="Provide context..."
                            rows="3"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 p-4 text-sm font-black outline-none focus:border-indigo-600 focus:bg-white transition shadow-sm resize-none placeholder:text-slate-300"
                          />
                        );
                     }

                     if (field.type === 'radio' || field.type === 'select' || field.type === 'checkbox' || field.type === 'dropdown-multi') {
                        const isMulti = field.type === 'checkbox' || field.type === 'dropdown-multi';
                        const options = field.options || [];
                        const isLongList = options.length > 6;

                        return (
                          <div 
                            className={`grid gap-3 pr-2 custom-scrollbar overscroll-contain ${isLongList ? 'max-h-[50vh] overflow-y-auto' : ''} ${!isLongList && options.length > 3 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}
                          >
                             {options.map((opt, i) => {
                               const currentArr = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                               const isSelected = isMulti ? currentArr.includes(opt) : answers[field.id] === opt;
                               const label = typeof opt === 'string' ? opt : opt.label;
                               
                               return (
                                 <button 
                                   key={i}
                                   type="button"
                                   onClick={() => {
                                      if (isMulti) {
                                        const currentArr = Array.isArray(answers[field.id]) ? [...answers[field.id]] : [];
                                        const next = isSelected ? currentArr.filter(o => o !== opt) : [...currentArr, opt];
                                        setAnswers(prev => ({ ...prev, [field.id]: next }));
                                        analytics.trackAnswerSelection(currentIndex, field.id, next);
                                      } else {
                                        setAnswers(prev => ({...prev, [field.id]: opt}));
                                        analytics.trackAnswerSelection(currentIndex, field.id, opt);
                                        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
                                        autoAdvanceTimer.current = setTimeout(handleNext, 400);
                                     }
                                   }}
                                   className={`group w-full p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition-all duration-300 active:scale-[0.97] outline-none ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                                 >
                                    <span className={`font-black text-[9px] uppercase tracking-[0.1em] ${isSelected ? 'text-white' : 'text-slate-800'}`}>{label}</span>
                                    {isSelected ? (
                                       <CheckCircle2 className="w-4 h-4 text-white animate-fade-in-up" strokeWidth={3} />
                                    ) : (
                                       <div className={`w-4 h-4 rounded-md border-2 border-slate-200 transition-colors ${isMulti ? 'rounded-sm' : 'rounded-full'}`} />
                                    )}
                                  </button>
                               )
                             })}
                          </div>
                        );
                     }
                     return null;
                   })()}

                   <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100 mt-6">
                     <button 
                       onClick={handleNext}
                       className="w-full sm:w-auto px-8 py-4 bg-slate-950 hover:bg-black text-white rounded-lg font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-md active:scale-[0.97] flex items-center justify-center gap-3"
                     >
                        Confirm Entry <ArrowRight className="w-4 h-4"/>
                     </button>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden lg:flex items-center gap-3">
                        <MousePointer2 className="w-4 h-4 text-indigo-400"/> Interactive Input Protocol
                     </p>
                   </div>
                </div>
              </fieldset>
            </div>
          )}
        </div>
        
        {/* Footer Meta */}
        <div className="mt-8 flex justify-between items-center px-4">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Secure session</span>
           </div>
           <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest opacity-30">Antigravity Engine v2.4</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        body { font-family: 'Outfit', sans-serif; font-feature-settings: 'calt' 1, 'kern' 1; -webkit-font-smoothing: antialiased; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }

        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-right { animation: fadeInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up, .animate-fade-in-right { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}} />
    </div>
  );
}
function ArrowRight({ className }) { 
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>; 
}
