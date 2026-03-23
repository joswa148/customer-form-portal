import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Mail, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Info, ShieldCheck } from 'lucide-react';

const API_URL = 'http://localhost:5002/api';

export default function InteractiveForm() {
  const { uuid } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(-1); // -1 is intro, N is length (email step)
  const [answers, setAnswers] = useState({});
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
      } catch(e) {}
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
           try { parsedFields = JSON.parse(parsedFields); } catch(e) {}
        }
        setFields(Array.isArray(parsedFields) ? parsedFields : []);
      } catch (err) {
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
      if (field.required && !answers[field.id]) {
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
        <div className="absolute top-6 w-full max-w-3xl px-6 flex justify-between items-center text-slate-400 text-sm font-bold tracking-widest uppercase">
          <button onClick={handlePrev} className="hover:text-white transition flex items-center gap-1"><ChevronLeft className="w-4 h-4"/> Back</button>
          <span>{Math.min(currentIndex + 1, fields.length)} / {fields.length}</span>
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
          <div className="text-center transform transition opacity-100 scale-100 animate-fade-in-up">
             <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">{formConfig.title}</h1>
             <p className="text-xl md:text-2xl text-slate-300 mb-12 font-medium leading-relaxed max-w-2xl mx-auto">{formConfig.description}</p>
             <button 
               onClick={handleNext} 
               className="bg-white text-slate-900 px-10 py-5 rounded-2xl text-xl font-bold shadow-xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-1 transition transform flex items-center gap-3 mx-auto"
             >
               Start Questionnaire <ChevronRight className="w-6 h-6"/>
             </button>
             <p className="mt-6 text-slate-500 text-sm flex items-center justify-center gap-2"><Info className="w-4 h-4"/> Takes about 2 minutes</p>
          </div>
        ) : isOutro ? (
          <div className="transform transition opacity-100 scale-100 animate-fade-in-right">
             <h2 className="text-3xl md:text-4xl font-black mb-4">You're almost done.</h2>
             <p className="text-xl text-slate-400 mb-10">Please provide your email address so we know who this feedback is from.</p>
             
             {submitError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0"/> {submitError}
                </div>
             )}

             <div className="relative mb-8 group">
               <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-400 transition" />
               <input 
                 ref={inputRef}
                 type="email" 
                 value={userEmail}
                 onChange={e => setUserEmail(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                 placeholder="name@company.com"
                 className="w-full bg-slate-800/50 border-2 border-slate-700/50 text-white px-6 py-6 pl-16 rounded-2xl text-2xl outline-none focus:border-blue-500 focus:bg-slate-800 transition"
               />
             </div>
             
             <button 
               onClick={handleSubmit} 
               disabled={submitLoading}
               className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition transform flex items-center gap-3 disabled:opacity-50"
             >
               {submitLoading ? 'Submitting...' : <>Submit Feedback <ShieldCheck className="w-6 h-6"/></>}
             </button>
             <p className="mt-6 text-slate-500 text-sm">Press <strong>Enter ↵</strong> to submit</p>
          </div>
        ) : (
          <div className="transform transition opacity-100 scale-100 animate-fade-in-right">
            {/* Field Rendering */}
            {(() => {
              const field = fields[currentIndex];
              return (
                <div>
                  <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight flex flex-col md:flex-row md:items-start gap-4">
                     <span className="text-blue-500 text-2xl md:text-3xl">{currentIndex + 1}</span> {field.label}
                     {field.required && <span className="text-red-500 text-3xl">*</span>}
                  </h2>
                  
                  {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                     <div className="mb-8">
                       <input 
                         ref={inputRef}
                         type={field.type}
                         value={answers[field.id] || ''}
                         onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                         onKeyDown={handleKeyDown}
                         placeholder="Type your answer here..."
                         className="w-full bg-slate-800/50 border-b-2 border-slate-600 text-white px-2 py-4 text-3xl outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                       />
                     </div>
                  ) : field.type === 'textarea' ? (
                     <div className="mb-8">
                       <textarea 
                         ref={inputRef}
                         value={answers[field.id] || ''}
                         onChange={e => setAnswers(prev => ({...prev, [field.id]: e.target.value}))}
                         placeholder="Type your detailed feedback here..."
                         rows="4"
                         className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl text-white p-6 text-2xl outline-none focus:border-blue-500 transition placeholder:text-slate-600 resize-y"
                       />
                     </div>
                  ) : field.type === 'radio' || field.type === 'select' ? (
                     <div className="flex flex-col gap-4 mb-8">
                       {(field.options || []).map((opt, i) => {
                         const isSelected = answers[field.id] === opt;
                         return (
                           <button 
                             key={i}
                             autoFocus={i === 0 && !answers[field.id]}
                             onClick={() => {
                               setAnswers(prev => ({...prev, [field.id]: opt}));
                               setTimeout(handleNext, 300); // auto-advance on radio selection
                             }}
                             className={`text-left w-full p-6 border-2 rounded-2xl text-xl font-bold transition flex items-center justify-between group ${isSelected ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800'}`}
                           >
                             <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded border-2 flex items-center justify-center font-black text-sm transition ${isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-600 text-slate-500 group-hover:border-slate-400'}`}>
                                  {String.fromCharCode(65 + i)}
                               </div>
                               {opt}
                             </div>
                             {isSelected && <CheckCircle2 className="w-6 h-6 text-blue-400"/>}
                           </button>
                         )
                       })}
                     </div>
                  ) : null}

                  <div className="flex items-center gap-4 mt-10">
                    <button 
                      onClick={handleNext}
                      className="bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                      OK <CheckCircle2 className="w-5 h-5"/>
                    </button>
                    <span className="text-slate-500 text-sm">Press <strong>Enter ↵</strong></span>
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
