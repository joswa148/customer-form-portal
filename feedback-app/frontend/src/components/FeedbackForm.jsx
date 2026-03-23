import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Mail, CheckCircle2, ShieldCheck, AlertCircle, Info, Hash, List, MousePointerClick, MessageSquareText, CheckSquare } from 'lucide-react';

const API_URL = 'http://localhost:5002/api';

export default function FeedbackForm() {
  const { uuid } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [userEmail, setUserEmail] = useState('');
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
        answers
      });
      setSubmitSuccess('Success! Your response has been submitted.');
      setAnswers(fields.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {}));
      setUserEmail('');
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl shadow-blue-900/5 rounded-[2rem] border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
        
        <div className="p-8 md:p-12 mb-2 text-center border-b border-slate-100 bg-slate-50/30 relative">
          <div className="absolute top-10 left-10 pointer-events-none opacity-20"><Info className="w-24 h-24 text-blue-500"/></div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight relative z-10">{formConfig.title}</h1>
          {formConfig.description && <p className="text-slate-500 mt-5 text-lg font-medium max-w-2xl mx-auto relative z-10 leading-relaxed">{formConfig.description}</p>}
        </div>

        <div className="p-8 md:p-12">
          {submitError && (
            <div className="mb-10 p-5 bg-red-50 border border-red-200 text-red-700 font-bold shadow-sm rounded-2xl flex items-center gap-4 transform transition">
              <AlertCircle className="w-6 h-6 shrink-0"/> {submitError}
            </div>
          )}
          
          {submitSuccess && (
            <div className="mb-10 p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold shadow-sm rounded-2xl flex items-start gap-4 transform transition">
              <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-500"/> 
              <div>
                <span className="block text-lg mb-1">Success!</span>
                <span className="text-emerald-600 font-medium text-sm block">{submitSuccess}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Target Origin Identity */}
            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100/60 shadow-inner group">
              <label className="text-sm font-black text-blue-900 mb-3 tracking-widest uppercase flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" /> Email Address <span className="text-red-500 ml-1 text-lg leading-none">*</span>
              </label>
              <input 
                type="email" 
                value={userEmail} 
                onChange={e => setUserEmail(e.target.value)} 
                className="w-full md:w-3/4 p-4 text-lg border border-blue-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition shadow-sm placeholder:text-blue-200 font-semibold text-slate-800"
                placeholder="Enter your email address"
                required
              />
              <p className="text-xs font-bold text-blue-400 mt-3 flex items-center gap-1 uppercase tracking-widest"><ShieldCheck className="w-3 h-3"/> Secure Connection</p>
            </div>

            <div className="space-y-8 relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100 -z-10 hidden md:block"></div>
              
              {fields.map((field, idx) => (
                <div key={field.id} className="p-8 bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl hover:border-slate-300 transition duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-400 transition-colors"></div>
                  
                  <label className="text-lg font-black text-slate-800 mb-5 flex items-start gap-4">
                    <span className="bg-slate-100 text-slate-500 rounded-lg px-2.5 py-1 text-sm shrink-0 border border-slate-200 shadow-inner">0{idx + 1}</span>
                    <span className="mt-0.5">{field.label} {field.required && <span className="text-red-500 ml-1 font-bold text-xl leading-none" title="Required field">*</span>}</span>
                  </label>
                  
                  <div className="pl-0 md:pl-14">
                    {field.type === 'text' || field.type === 'email' ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MessageSquareText className="w-5 h-5 text-slate-300" />
                        </div>
                        <input 
                          type={field.type} 
                          value={answers[field.id] || ''}
                          onChange={e => handleChange(field.id, e.target.value)}
                          className="w-full p-4 pl-12 text-slate-700 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition font-medium"
                          required={field.required}
                          placeholder="Enter your answer..."
                        />
                      </div>
                    ) : field.type === 'number' ? (
                      <div className="relative w-full md:w-1/2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Hash className="w-5 h-5 text-slate-300" />
                        </div>
                        <input 
                          type="number" 
                          value={answers[field.id] || ''}
                          onChange={e => handleChange(field.id, e.target.value)}
                          className="w-full p-4 pl-12 text-slate-700 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition font-black"
                          required={field.required}
                          placeholder="Enter a number"
                        />
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea 
                        value={answers[field.id] || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        rows="4"
                        className="w-full p-5 text-slate-700 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white resize-y transition font-medium leading-relaxed"
                        required={field.required}
                        placeholder="Enter your details..."
                      />
                    ) : field.type === 'select' ? (
                      <div className="relative w-full md:w-2/3">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <List className="w-5 h-5 text-slate-400" />
                        </div>
                        <select 
                          value={answers[field.id] || ''}
                          onChange={e => handleChange(field.id, e.target.value)}
                          className="w-full p-4 pl-12 text-slate-700 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white cursor-pointer transition font-bold appearance-none"
                          required={field.required}
                        >
                          <option value="" disabled>-- Select an option --</option>
                          {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt} className="font-medium text-slate-800">{opt}</option>
                          ))}
                        </select>
                      </div>
                    ) : field.type === 'radio' ? (
                      <div className="flex flex-col sm:flex-row flex-wrap gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="w-full flex items-center gap-2 mb-1 text-slate-400 text-xs font-black uppercase tracking-widest"><MousePointerClick className="w-4 h-4"/> Select an option</div>
                        {(field.options || []).map((opt, i) => (
                          <label key={i} className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl transition border-2 ${answers[field.id] === opt ? 'bg-white border-blue-500 shadow-md' : 'bg-white border-transparent hover:border-slate-300 shadow-sm'}`}>
                            <input 
                              type="radio" 
                              name={field.id}
                              value={opt}
                              checked={answers[field.id] === opt}
                              onChange={() => handleChange(field.id, opt)}
                              className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600"
                              required={field.required}
                            />
                            <span className={`font-bold text-sm ${answers[field.id] === opt ? 'text-blue-900' : 'text-slate-600'}`}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <div className="flex flex-col sm:flex-row flex-wrap gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="w-full flex items-center gap-2 mb-1 text-slate-400 text-xs font-black uppercase tracking-widest"><CheckSquare className="w-4 h-4"/> Select all that apply</div>
                        {(field.options || []).map((opt, i) => {
                          const currentArr = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                          const isSelected = currentArr.includes(opt);
                          return (
                            <label key={i} className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl transition border-2 ${isSelected ? 'bg-white border-blue-500 shadow-md' : 'bg-white border-transparent hover:border-slate-300 shadow-sm'}`}>
                              <input 
                                type="checkbox" 
                                name={field.id}
                                value={opt}
                                checked={isSelected}
                                onChange={(e) => {
                                  const arr = Array.isArray(answers[field.id]) ? [...answers[field.id]] : [];
                                  const next = e.target.checked ? [...arr, opt] : arr.filter(o => o !== opt);
                                  handleChange(field.id, next);
                                }}
                                className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 accent-blue-600"
                              />
                              <span className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>{opt}</span>
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
              className="w-full py-6 mt-8 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-black text-xl tracking-widest uppercase rounded-2xl shadow-2xl shadow-slate-900/20 disabled:opacity-50 transition transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              {submitLoading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Form <ShieldCheck className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
