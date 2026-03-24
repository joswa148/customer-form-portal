import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Mail, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Info, ShieldCheck, Check, WifiOff, X } from 'lucide-react';
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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-indigo-400 text-xs tracking-[0.4em] uppercase animate-pulse">Initializing v2.0...</div>;
  if (error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500 p-8 text-center font-black tracking-tight text-xl"><AlertCircle className="w-6 h-6 mr-3"/>{error}</div>;

  const isIntro = currentIndex === -1;
  const isOutro = currentIndex === fields.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-center items-center p-4 md:p-12 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Accessibility: Screen Reader Announcements */}
      <div aria-live="polite" className="sr-only">{announcement}</div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-fade-in-up">
           <WifiOff className="w-3 h-3" /> System Offline — Saving Locally
        </div>
      )}

      {/* Progress Architecture: Anchored */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200/50 z-50">
         {!isIntro && !submitSuccess && (
           <div 
             className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]" 
             style={{ width: `${(Math.max(0, currentIndex + 1) / (fields.length + 1)) * 100}%` }}
           ></div>
         )}
      </div>

      <div className="w-full max-w-[640px] relative z-10">
        
        {!submitSuccess && !isIntro && (
          <div className="mb-4 flex justify-between items-end px-2">
            <button 
              onClick={handlePrev} 
              className="text-[11px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 transition-all active:scale-[0.98] outline-none focus:text-indigo-600"
            >
              <ChevronLeft className="w-3 h-3"/> Step Back
            </button>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
               <span className="opacity-60">Step {currentIndex + 1} of {fields.length}</span>
               <div className="h-1 w-8 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600" style={{ width: `${Math.round(((currentIndex + 1) / (fields.length + 1)) * 100)}%` }}></div>
               </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-200 shadow-2xl overflow-hidden relative transition-all duration-500 hover:border-slate-300">
          
          {submitSuccess ? (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-sm">
                 <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-black mb-4 tracking-tight uppercase">Success</h1>
              <p className="text-md text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">{submitSuccess}</p>
              <div className="mt-12 pt-8 border-t border-slate-50 italic text-slate-300 text-[10px] font-black uppercase tracking-widest">
                 Reference ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </div>
            </div>
          ) : isIntro ? (
            <div className="animate-fade-in-up">
               <header className="text-center mb-10">
                 <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Onboarding</p>
                 <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">{formConfig.title}</h1>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto opacity-80">{formConfig.description}</p>
               </header>
               
               <div className="space-y-4 mb-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Identity</label>
                     <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="e.g. Liam Anderson" className="w-full bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition text-sm active:scale-[0.99]" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Metric</label>
                     <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="name@domain.com" className="w-full bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-600/5 transition text-sm active:scale-[0.99]" />
                   </div>
                 </div>
                 
                 <div className="space-y-1.5 relative">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cellular Contact</label>
                   <div className="flex gap-0 bg-slate-50/50 border border-slate-100 rounded-xl overflow-visible focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/5 transition">
                     
                     {/* Industry-Level Country Picker */}
                     <div className="relative shrink-0 border-r border-slate-100/50">
                        <button 
                          type="button"
                          onClick={() => setIsPhonePickerOpen(!isPhonePickerOpen)}
                          className="h-full flex items-center gap-2 px-4 hover:bg-slate-100/50 transition outline-none"
                        >
                          <span className="text-xl">{activeCountry.flag}</span>
                          <span className="text-sm font-black text-slate-700">{activeCountry.code}</span>
                        </button>

                        {isPhonePickerOpen && (
                          <div className="absolute top-full left-0 mt-2 w-[280px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in-up">
                            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                               <input 
                                 type="text" 
                                 autoFocus
                                 placeholder="Search country..." 
                                 value={phoneSearch}
                                 onChange={e => setPhoneSearch(e.target.value)}
                                 className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
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
                                   className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 transition border-b border-slate-50 last:border-0"
                                 >
                                   <div className="flex items-center gap-3">
                                     <span className="text-lg">{c.flag}</span>
                                     <span className="text-[11px] font-bold text-slate-600">{c.name}</span>
                                   </div>
                                   <span className="text-[10px] font-black text-indigo-400">{c.code}</span>
                                 </button>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>

                      <input 
                        type="tel" 
                        value={userPhoneNumber} 
                        onChange={e => {
                           const val = e.target.value.replace(/[^\d\s-]/g, '');
                           setUserPhoneNumber(val);
                        }} 
                        placeholder="000 000 0000" 
                        className="flex-1 bg-transparent p-4 text-slate-900 font-bold outline-none text-sm active:scale-[0.98]" 
                      />
                    </div>
                    
                    {isPhonePickerOpen && <div className="fixed inset-0 z-40" onClick={() => setIsPhonePickerOpen(false)}></div>}

                    {/* Communication Consent */}
                    <div className="flex items-start gap-2.5 px-1 pt-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                       <input 
                         id="consent"
                         type="checkbox" 
                         checked={answers['consent'] !== false} // Default to true for better conversion, but trackable
                         onChange={e => setAnswers(prev => ({...prev, consent: e.target.checked}))}
                         className="mt-1 w-3.5 h-3.5 accent-indigo-600 cursor-pointer" 
                       />
                       <label htmlFor="consent" className="text-[10px] font-black text-slate-400 leading-tight uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition">
                          I consent to receive automated WhatsApp/Email updates regarding my consultation.
                       </label>
                    </div>
                  </div>
               </div>
               
               <button 
                 onClick={handleNext} 
                 className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition transform active:scale-[0.98] ring-offset-2 focus:ring-2 focus:ring-slate-900"
               >
                 Initialize Process <ChevronRight className="w-4 h-4"/>
               </button>
            </div>
          ) : isOutro ? (
            <div className="animate-fade-in-right text-center py-6">
               <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-100 shadow-sm">
                  <ShieldCheck className="w-10 h-10 text-indigo-600" strokeWidth={1.5} />
               </div>
               <h2 className="text-2xl font-black mb-3 tracking-tight">Final Synchronization</h2>
               <p className="text-slate-500 text-sm font-medium mb-12 leading-relaxed px-6 opacity-80">All data points have been collected. Please confirm to commit your submission to our secure storage.</p>
               
               {submitError && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 font-bold text-[11px] uppercase tracking-widest animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 opacity-70"/> {submitError}
                  </div>
               )}

               <button 
                 onClick={handleSubmit} 
                 disabled={submitLoading}
                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 focus:ring-4 focus:ring-indigo-600/20"
               >
                 {submitLoading ? 'Synchronizing...' : <>Commit & Submit <ShieldCheck className="w-5 h-5"/></>}
               </button>
            </div>
          ) : (
            <div className="animate-fade-in-right" key={currentIndex}>
              <fieldset className="border-none p-0 m-0">
                <legend className="sr-only">Question {currentIndex + 1}</legend>
                
                <h2 
                  ref={questionHeadingRef} 
                  tabIndex="-1" 
                  className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight leading-tight mb-10 outline-none focus:text-indigo-600 transition-colors"
                >
                   {fields[currentIndex]?.label} {fields[currentIndex]?.required && <span className="text-indigo-400 font-bold ml-1 opacity-50">*</span>}
                </h2>
                
                <div className="space-y-10">
                   {(() => {
                     const field = fields[currentIndex];
                     if (!field) return null;

                     if (field.type === 'text' || field.type === 'email' || field.type === 'number') {
                        return (
                          <input 
                            ref={inputRef}
                            type={field.type}
                            value={answers[field.id] || ''}
                            onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                            onKeyDown={handleKeyDown}
                            placeholder="Input your response..."
                            className="w-full bg-transparent border-b-2 border-slate-100 text-xl font-black text-indigo-600 py-4 outline-none focus:border-indigo-600 transition placeholder:text-slate-200 active:scale-[0.99] focus:placeholder:opacity-0"
                          />
                        );
                     }

                     if (field.type === 'textarea') {
                        return (
                          <textarea 
                            ref={inputRef}
                            value={answers[field.id] || ''}
                            onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                            placeholder="Provide detailed context..."
                            rows="4"
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-900 p-6 text-sm font-bold outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition shadow-sm resize-none overscroll-contain"
                          />
                        );
                     }

                     if (field.type === 'radio' || field.type === 'select' || field.type === 'checkbox' || field.type === 'dropdown-multi') {
                        const isMulti = field.type === 'checkbox' || field.type === 'dropdown-multi';
                        const options = field.options || [];
                        const isLongList = options.length > 6;

                        return (
                          <div 
                            className={`grid gap-2 pr-2 custom-scrollbar overscroll-contain ${isLongList ? 'max-h-[60vh] overflow-y-auto' : ''} ${!isLongList && options.length > 3 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}
                          >
                             {options.map((opt, i) => {
                               const currentArr = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                               const isSelected = isMulti ? currentArr.includes(opt) : answers[field.id] === opt;
                               
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
                                   className={`group w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-300 active:scale-[0.98] outline-none ${isSelected ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/10' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                                 >
                                    <span className={`font-black text-[11px] uppercase tracking-[0.1em] ${isSelected ? 'text-indigo-600' : 'text-slate-800'}`}>{opt}</span>
                                    {isSelected && <Check className="w-4 h-4 text-indigo-600 transition-all scale-110" strokeWidth={5} />}
                                    {!isSelected && isMulti && <div className="w-4 h-4 rounded border-2 border-slate-200 bg-white" />}
                                 </button>
                               )
                             })}
                          </div>
                        );
                     }
                     return null;
                   })()}

                   <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-slate-50 mt-10">
                     <button 
                       onClick={handleNext}
                       className={`w-full sm:w-auto px-12 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 ${currentIndex >= 0 && fields[currentIndex]?.type === 'checkbox' && (!answers[fields[currentIndex].id] || answers[fields[currentIndex].id].length === 0) ? 'animate-pulse' : ''}`}
                     >
                        Confirm <ChevronRight className="w-4 h-4"/>
                     </button>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden sm:inline-block">Synthesized Input Mode ↵</p>
                   </div>
                </div>
              </fieldset>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body { font-family: 'Inter', sans-serif; font-feature-settings: 'calt' 1, 'kern' 1; -webkit-font-smoothing: antialiased; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }

        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-right { animation: fadeInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; opacity: 0; transition: opacity 0.3s; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { opacity: 1; background: #cbd5e1; }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up, .animate-fade-in-right { animation: none !important; opacity: 1 !important; transform: none !important; }
          .transition-all { transition: none !important; }
        }
      `}} />
    </div>
  );
}
