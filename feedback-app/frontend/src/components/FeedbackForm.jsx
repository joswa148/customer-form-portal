import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Mail, CheckCircle2, ShieldCheck, AlertCircle, Info, Hash, List, MousePointerClick, MessageSquareText, CheckSquare } from 'lucide-react';
import { countryCodes } from '../utils/countries';

const API_URL = 'http://localhost:5002/api';

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

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/forms/${uuid}`);
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
    
    if (!userEmail || !userEmail.includes('@')) {
      setSubmitError('Please provide a valid metric verification email address.');
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
      await axios.post(`${API_URL}/responses`, {
        formId: formConfig.id,
        userEmail,
        userName,
        userPhone: `${userPhoneCode} ${userPhoneNumber.trim()}`,
        answers
      });
      setSubmitSuccess('Success! Your response has been submitted.');
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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-blue-300 text-xl tracking-widest uppercase animate-pulse"><ShieldCheck className="w-10 h-10 mr-3 text-indigo-300"/> Loading...</div>;
  
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
       <div className="flex flex-col items-center bg-white p-12 shadow-2xl rounded-3xl border border-red-100 max-w-lg">
          <AlertCircle className="w-20 h-20 text-red-500 mb-6 drop-shadow-md"/>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Connection Failed</h2>
          <p className="text-slate-500 font-medium text-center">{error}</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 font-sans flex flex-col items-center">
      {/* Container: Balanced max-width and spacing */}
      <div className="w-full max-w-3xl bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 w-full h-1 bg-indigo-600"></div>
        
        {/* Header: Professional and clean */}
        <header className="p-8 pb-4 border-b border-slate-100 bg-white relative">
          <div className="absolute top-8 right-8 pointer-events-none opacity-5"><ShieldCheck className="w-16 h-16 text-indigo-100"/></div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Customer Questionnaire</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">{formConfig.title}</h1>
          {formConfig.description && <p className="text-slate-500 text-sm font-semibold max-w-2xl leading-relaxed">{formConfig.description}</p>}
        </header>

        <div className="p-8">
          {submitError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-black shadow-inner rounded-xl flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0"/> {submitError}
            </div>
          )}
          
          {submitSuccess && (
            <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500"/> 
              <div>
                <span className="block text-sm font-black uppercase tracking-tight mb-1">Response Received</span>
                <span className="text-emerald-600 font-semibold text-xs block">{submitSuccess}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Identity Card: Compact and professional */}
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 relative overflow-hidden">
              <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] pointer-events-none hover:opacity-10 transition">
                <Info className="w-20 h-20 text-slate-900" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                 <div className="col-span-full">
                   <label className="text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase flex items-center gap-2">
                     Full Name <span className="text-indigo-400 leading-none">*</span>
                   </label>
                   <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white font-bold text-slate-800 placeholder:text-slate-300 transition" placeholder="Your name" required />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase flex items-center gap-2">
                     Email <span className="text-indigo-400 leading-none">*</span>
                   </label>
                   <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white font-bold text-slate-800 placeholder:text-slate-300 transition" placeholder="name@company.com" required />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase flex items-center gap-2">
                     Phone Number <span className="text-indigo-400 leading-none">*</span>
                   </label>
                   <div className="flex gap-2">
                     <select value={userPhoneCode} onChange={e => setUserPhoneCode(e.target.value)} className="w-[100px] px-3 py-3 text-sm border border-slate-200 rounded-xl outline-none bg-white font-bold text-slate-800 cursor-pointer appearance-none shrink-0">
                       {countryCodes.map((c, i) => <option key={i} value={c.code}>{c.name}</option>)}
                     </select>
                     <input type="tel" value={userPhoneNumber} onChange={e => setUserPhoneNumber(e.target.value)} className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white font-bold text-slate-800 placeholder:text-slate-300 transition" placeholder="Phone number" required />
                   </div>
                 </div>
              </div>
            </div>

            {/* Questions List: Distinct card design */}
            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors duration-200 relative group overflow-hidden">
                  <label className="block text-sm font-black text-slate-800 mb-4 flex items-start gap-3">
                    <span className="bg-slate-50 text-slate-400 rounded-md px-1.5 py-0.5 text-[9px] shrink-0 border border-slate-100 flex items-center justify-center font-black uppercase">Q{idx + 1}</span>
                    <span className="leading-tight">{field.label} {field.required && <span className="text-indigo-500 font-bold ml-0.5" title="Required">*</span>}</span>
                  </label>
                  
                  <div className="pl-0 md:pl-10">
                    {field.type === 'text' || field.type === 'email' ? (
                      <div className="relative">
                        <input 
                          type={field.type} 
                          value={answers[field.id] || ''}
                          onChange={e => handleChange(field.id, e.target.value)}
                          className="w-full px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 bg-slate-50/50 focus:bg-white transition text-xs font-bold text-slate-700"
                          required={field.required}
                          placeholder="Type your answer..."
                        />
                      </div>
                    ) : field.type === 'number' ? (
                      <input 
                        type="number" 
                        value={answers[field.id] || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        className="w-full md:w-1/2 px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 bg-slate-50/50 focus:bg-white transition text-xs font-black text-slate-700"
                        required={field.required}
                        placeholder="0"
                      />
                    ) : field.type === 'textarea' ? (
                      <textarea 
                        value={answers[field.id] || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 bg-slate-50/50 focus:bg-white transition text-xs font-bold text-slate-700 resize-none leading-relaxed"
                        required={field.required}
                        placeholder="Share your thoughts..."
                      />
                    ) : (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' || field.type === 'dropdown-multi') ? (
                      <div className="flex flex-col gap-2">
                        {(field.options || []).map((opt, i) => {
                          const isSelection = field.type === 'radio' || field.type === 'select';
                          const isSelected = isSelection ? answers[field.id] === opt : (Array.isArray(answers[field.id]) && answers[field.id].includes(opt));
                          
                          return (
                            <label key={i} className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50/50 border-slate-100 hover:border-slate-300 text-slate-600'}`}>
                              <input 
                                type={isSelection ? "radio" : "checkbox"}
                                name={field.id}
                                value={opt}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (isSelection) {
                                    handleChange(field.id, opt);
                                  } else {
                                    const arr = Array.isArray(answers[field.id]) ? [...answers[field.id]] : [];
                                    const next = e.target.checked ? [...arr, opt] : arr.filter(o => o !== opt);
                                    handleChange(field.id, next);
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-3 h-3 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-white border-white' : 'border-slate-300'}`}>
                                {isSelected && <div className="w-1 h-1 bg-indigo-600 rounded-full" />}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-tight break-all">{opt}</span>
                            </label>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={submitLoading}
              className="w-full py-4 bg-slate-900 border border-black hover:bg-black text-white font-black text-sm tracking-[0.2em] uppercase rounded-xl shadow-lg disabled:opacity-50 transition transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {submitLoading ? 'Processing...' : <>Submit Feedback <ShieldCheck className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
      
      <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Mail className="w-3 h-3"/> Secure Data Transmission Verified
      </p>
    </div>
  );
}
