import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

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
           try { parsedFields = JSON.parse(parsedFields); } catch(e) {}
        }
        setFields(Array.isArray(parsedFields) ? parsedFields : []);
        
        const initialAnswers = {};
        if (Array.isArray(parsedFields)) {
          parsedFields.forEach(f => initialAnswers[f.id] = '');
        }
        setAnswers(initialAnswers);
      } catch (err) {
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
      if (f.required && !answers[f.id]) {
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
      setSubmitSuccess('Payload successful! Check your inbox for response metrics.');
      setAnswers(fields.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {}));
      setUserEmail('');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Rejected by constraints API.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="text-center p-20 font-bold text-gray-500 text-xl tracking-widest uppercase">Fetching Router...</div>;
  if (error) return <div className="text-center p-20 font-bold text-red-500 bg-red-50 mx-10 rounded-2xl">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 my-12 bg-white shadow-2xl rounded-3xl border border-gray-100">
      <div className="mb-10 text-center border-b border-gray-100 pb-8">
        <h1 className="text-4xl font-black text-blue-950 tracking-tight">{formConfig.title}</h1>
        {formConfig.description && <p className="text-gray-500 mt-4 text-lg font-medium">{formConfig.description}</p>}
      </div>

      {submitError && <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-semibold shadow-sm">{submitError}</div>}
      {submitSuccess && <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 font-bold shadow-sm">{submitSuccess}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
          <label className="block text-sm font-extrabold text-blue-900 mb-2 tracking-wide uppercase">Recipient Address <span className="text-red-500">*</span></label>
          <input 
            type="email" 
            value={userEmail} 
            onChange={e => setUserEmail(e.target.value)} 
            className="w-full md:w-2/3 p-3.5 border border-blue-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition shadow-sm"
            placeholder="For duplicate metrics dispatch"
            required
          />
        </div>

        <div className="space-y-6">
          {fields.map((field, idx) => (
            <div key={field.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm custom-field-hover transition">
              <label className="block text-base font-bold text-gray-800 mb-3">
                {idx + 1}. {field.label} {field.required && <span className="text-red-500 ml-1" title="Required">*</span>}
              </label>
              
              {field.type === 'text' || field.type === 'email' ? (
                <input 
                  type={field.type} 
                  value={answers[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
                  required={field.required}
                  placeholder="Evaluate here..."
                />
              ) : field.type === 'number' ? (
                <input 
                  type="number" 
                  value={answers[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  className="w-full md:w-1/3 p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
                  required={field.required}
                />
              ) : field.type === 'textarea' ? (
                <textarea 
                  value={answers[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y transition"
                  required={field.required}
                  placeholder="Expand your thoughts..."
                />
              ) : field.type === 'select' ? (
                <select 
                  value={answers[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  className="w-full md:w-1/2 p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer transition"
                  required={field.required}
                >
                  <option value="" disabled>-- Make a selection --</option>
                  {(field.options || []).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'radio' ? (
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-3 bg-white p-4 rounded-xl border border-gray-200">
                  {(field.options || []).map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition">
                      <input 
                        type="radio" 
                        name={field.id}
                        value={opt}
                        checked={answers[field.id] === opt}
                        onChange={() => handleChange(field.id, opt)}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        required={field.required}
                      />
                      <span className="text-gray-700 font-medium text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <button 
          type="submit" 
          disabled={submitLoading}
          className="w-full py-5 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg tracking-wide uppercase rounded-2xl shadow-xl shadow-blue-200 disabled:opacity-50 transition transform hover:-translate-y-1 active:translate-y-0"
        >
          {submitLoading ? 'Transmitting Data...' : 'Dispatch Responses'}
        </button>
      </form>
    </div>
  );
}
