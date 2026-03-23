import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Mail, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Info, ShieldCheck, CheckSquare, Check } from 'lucide-react';

const API_URL = 'http://localhost:5002/api';

export default function InteractiveForm() {
  const { uuid } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(-1); // -1 is intro, N is length (email step)
  const [answers, setAnswers] = useState({});
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const [userEmail, setUserEmail] = useState('');
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  
  const inputRef = useRef(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(`form_progress_${uuid}`);
    if (saved) {
      try {
        const { answers: savedAnswers, currentIndex: savedIndex, userEmail: savedEmail } = JSON.parse(saved);
        if (savedAnswers) setAnswers(savedAnswers);
        if (savedIndex !== undefined) setCurrentIndex(savedIndex);
        if (savedEmail) setUserEmail(savedEmail);
      } catch (e) { console.error('Failed to parse saved progress', e); }
    }
  }, [uuid]);

  // Save to LocalStorage
  useEffect(() => {
    if (!loading && !submitSuccess) {
      localStorage.setItem(`form_progress_${uuid}`, JSON.stringify({ answers, currentIndex, userEmail }));
    }
  }, [answers, currentIndex, userEmail, loading, submitSuccess, uuid]);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/forms/${uuid}`);
        setFormConfig({ id: data.id, title: data.title, description: data.description });
        
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
  }, [uuid]);

  // Auto-focus logic
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  const handleNext = () => {
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
        answers
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

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center font-bold text-white text-xl animate-pulse">Loading...</div>;
  if (error) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400 p-6 text-center text-xl">{error}</div>;

  const isIntro = currentIndex === -1;
  const isOutro = currentIndex === fields.length;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
      
      {/* Progress Bar */}
      {!isIntro && !submitSuccess && (
        <div className="absolute top-6 w-full max-w-3xl px-6 flex flex-col gap-3">
          <div className="flex justify-between items-center text-slate-400 text-sm font-bold tracking-widest uppercase">
            <button onClick={handlePrev} className="hover:text-white transition flex items-center gap-1"><ChevronLeft className="w-4 h-4"/> Back</button>
            <span>Question {Math.min(currentIndex + 1, fields.length)} of {fields.length}</span>
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 ease-out" style={{ width: `${(Math.min(currentIndex + 1, fields.length) / fields.length) * 100}%` }}></div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl relative z-10 transition-all duration-500 ease-in-out">
        
        {submitSuccess ? (
          <div className="text-center transform transition opacity-100 scale-100 animate-fade-in-up">
            <CheckCircle2 className="w-24 h-24 text-emerald-400 mx-auto mb-8 drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl font-black mb-4">All Set!</h1>
            <p className="text-xl text-slate-300 font-medium">{submitSuccess}</p>
            <p className="mt-8 text-slate-500">You can safely close this window.</p>
          </div>
        ) : isIntro ? (
          <div className="text-center transform transition opacity-100 scale-100 animate-fade-in-up px-4">
             <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{formConfig.title}</h1>
             <p className="text-lg md:text-xl text-slate-300 mb-8 font-medium leading-relaxed max-w-2xl mx-auto">{formConfig.description}</p>
             <button 
               onClick={handleNext} 
               className="bg-white text-slate-900 px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-1 transition transform flex items-center justify-center gap-3 w-full md:w-auto md:mx-auto"
             >
               Start Questionnaire <ChevronRight className="w-5 h-5"/>
             </button>
             <p className="mt-6 text-slate-500 text-sm flex items-center justify-center gap-2"><Info className="w-4 h-4"/> Takes about 2 minutes</p>
          </div>
        ) : isOutro ? (
          <div className="transform transition opacity-100 scale-100 animate-fade-in-right px-4">
             <h2 className="text-2xl md:text-3xl font-black mb-3">You're almost done.</h2>
             <p className="text-base md:text-lg text-slate-400 mb-8">Please provide your email address so we know who this feedback is from.</p>
             
             {submitError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 font-medium text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0"/> {submitError}
                </div>
             )}

             <div className="relative mb-6 group">
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition" />
               <input 
                 ref={inputRef}
                 type="email" 
                 value={userEmail}
                 onChange={e => setUserEmail(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                 placeholder="name@company.com"
                 className="w-full bg-slate-800/50 border border-slate-700/50 text-white p-4 pl-12 rounded-xl text-lg outline-none focus:border-blue-500 focus:bg-slate-800 transition"
               />
             </div>
             
             <button 
               onClick={handleSubmit} 
               disabled={submitLoading}
               className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition transform flex items-center justify-center gap-2 disabled:opacity-50"
             >
               {submitLoading ? 'Submitting...' : <>Submit Feedback <ShieldCheck className="w-5 h-5"/></>}
             </button>
             <p className="mt-6 text-slate-500 text-sm">Press <strong>Enter ↵</strong> to submit</p>
          </div>
        ) : (
          <div className="transform transition opacity-100 scale-100 animate-fade-in-right px-4">
            {/* Field Rendering */}
            {(() => {
              const field = fields[currentIndex];
              return (
                <div className="w-full max-w-[720px] mx-auto">
                  <h2 className="text-[1.125rem] md:text-[1.25rem] font-normal mb-4 leading-snug flex items-start gap-3">
                     <span className="text-blue-500 font-bold">{currentIndex + 1}.</span> {field.label}
                     {field.required && <span className="text-red-500">*</span>}
                  </h2>
                  
                  {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                     <div className="mb-6">
                       <input 
                         ref={inputRef}
                         type={field.type}
                         value={answers[field.id] || ''}
                         onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                         onKeyDown={handleKeyDown}
                         placeholder="Type your answer here..."
                         className="w-full bg-slate-800/50 border-b border-slate-600 text-white px-0 py-3 text-lg md:text-xl outline-none focus:border-blue-500 transition placeholder:text-slate-600/80"
                       />
                     </div>
                  ) : field.type === 'textarea' ? (
                     <div className="mb-6">
                       <textarea 
                         ref={inputRef}
                         value={answers[field.id] || ''}
                         onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                         placeholder="Type your detailed feedback here..."
                         rows="4"
                         className="w-full bg-slate-800/50 border border-slate-700 rounded-xl text-white p-4 text-base md:text-lg outline-none focus:border-blue-500 transition placeholder:text-slate-600/80 resize-y"
                       />
                     </div>
                  ) : field.type === 'radio' || field.type === 'select' ? (
                     <fieldset className="flex flex-col gap-3 mb-8 w-full">
                       <legend className="sr-only">{field.label}</legend>
                       {(field.options || []).map((opt, i) => {
                         const isSelected = answers[field.id] === opt;
                         return (
                           <label 
                             key={i}
                             className={`text-left w-full py-3 px-4 border rounded-xl text-[0.9rem] md:text-[1rem] font-medium transition flex items-center justify-between cursor-pointer group hover:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/50 ${isSelected ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-500'}`}
                           >
                             <input 
                               type="radio" 
                               name={field.id}
                               value={opt}
                               className="sr-only"
                               autoFocus={i === 0 && !answers[field.id]}
                               checked={isSelected}
                               onChange={() => {
                                 setAnswers(prev => ({...prev, [field.id]: opt}));
                                 setTimeout(handleNext, 300);
                               }}
                             />
                             <span className="flex items-center gap-3 leading-snug break-words">
                               {opt}
                             </span>
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-500 group-hover:border-slate-400'}`}>
                               {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                             </div>
                           </label>
                         )
                       })}
                     </fieldset>
                  ) : field.type === 'checkbox' ? (
                     <fieldset className="flex flex-col gap-3 mb-8 w-full">
                       <legend className="sr-only">{field.label}</legend>
                       {(field.options || []).map((opt, i) => {
                         const currentArr = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                         const isSelected = currentArr.includes(opt);
                         return (
                           <label 
                             key={i}
                             className={`text-left w-full py-3 px-4 border rounded-xl text-[0.9rem] md:text-[1rem] font-medium transition flex items-center justify-between cursor-pointer group hover:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/50 ${isSelected ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-500'}`}
                           >
                             <input 
                               type="checkbox" 
                               name={field.id}
                               value={opt}
                               className="sr-only"
                               autoFocus={i === 0 && (!answers[field.id] || answers[field.id].length === 0)}
                               checked={isSelected}
                               onChange={(e) => {
                                 setAnswers(prev => {
                                    const arr = Array.isArray(prev[field.id]) ? [...prev[field.id]] : [];
                                    const next = e.target.checked ? [...arr, opt] : arr.filter(o => o !== opt);
                                    return { ...prev, [field.id]: next };
                                 });
                                 // No auto-advance for checkbox lists
                               }}
                             />
                             <span className="flex items-center gap-3 leading-snug break-words">
                               {opt}
                             </span>
                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-500 group-hover:border-slate-400 bg-slate-800/50'}`}>
                               {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                             </div>
                           </label>
                         )
                       })}
                     </fieldset>
                  ) : null}

                  <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full">
                    <button 
                      onClick={handleNext}
                      className="bg-blue-600 w-full sm:w-auto text-white px-10 py-5 rounded-xl text-xl font-black hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95"
                    >
                      Continue <ChevronRight className="w-6 h-6"/>
                    </button>
                    <span className="text-slate-500 text-sm hidden sm:inline-block">Press <strong>Enter ↵</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-fade-in-right { animation: fadeInRight 0.5s ease-out forwards; }
      `}} />
    </div>
  );
}
