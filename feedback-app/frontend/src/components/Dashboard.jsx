import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5002/api';

export default function Dashboard() {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/forms`).then(res => setForms(res.data));
  }, []);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const url = selectedFormId ? `${API_URL}/responses?formId=${selectedFormId}` : `${API_URL}/responses`;
        const response = await axios.get(url);
        
        const parsedData = response.data.map(item => {
          let parsedAnswers = item.answers;
          if (typeof parsedAnswers === 'string') {
            try { parsedAnswers = JSON.parse(parsedAnswers); } catch(e) {}
          }
          return { ...item, answers: parsedAnswers };
        });
        setFeedbacks(parsedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, [selectedFormId]);

  const getLabel = (formId, fieldKey) => {
    const form = forms.find(f => f.id === formId);
    if (!form || !form.fields) return fieldKey;
    let parsed = form.fields;
    if (typeof parsed === 'string') {
       try { parsed = JSON.parse(parsed); } catch(e) {}
    }
    if (Array.isArray(parsed)) {
       const field = parsed.find(f => f.id === fieldKey);
       return field && field.label ? field.label : (fieldKey === 'userEmail' ? 'Submitter Email' : fieldKey);
    }
    return fieldKey;
  };

  return (
    <div className="p-8 max-w-[95%] mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-950 tracking-tight">Dataset Analysis</h1>
          <Link to="/dashboard/forms" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition mt-2 inline-block pt-1 uppercase tracking-widest hover:-translate-x-1 transform inline-flex items-center">
            <span className="mr-2">←</span> Form Schema Builders
          </Link>
        </div>
        <div className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-gray-200 shadow-md w-full md:w-auto mt-6 md:mt-0">
          <label className="font-extrabold text-xs uppercase tracking-widest text-gray-500 whitespace-nowrap pl-2">Constrain Dataset:</label>
          <select 
            value={selectedFormId} 
            onChange={e => setSelectedFormId(e.target.value)} 
            className="p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 bg-gray-50 hover:bg-white transition min-w-[280px] font-medium text-gray-800"
          >
            <option value="">-- Complete Multi-Campaign Dump --</option>
            {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-32 text-center text-gray-400 font-extrabold text-xl uppercase tracking-widest">Aggregating Matrix Data...</div>
      ) : (
        <div className="space-y-6">
          {feedbacks.length === 0 && (
            <div className="text-center p-16 bg-white rounded-3xl shadow-sm text-gray-400 font-semibold border-2 border-dashed border-gray-200">
              No entries mapped to this constraint.
            </div>
          )}
          
          <div className="masonry-grid grid grid-cols-1 xl:grid-cols-2 gap-8">
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col transition hover:shadow-xl">
              <div className="bg-blue-50/50 p-5 border-b border-gray-100 flex justify-between items-center">
                 <div>
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest bg-blue-100 px-2 py-1 rounded-md">ID-{fb.id}</span>
                    <h3 className="text-base font-bold text-blue-900 mt-2 truncate">{fb.user_email}</h3>
                 </div>
                 <div className="text-right">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{new Date(fb.created_at).toLocaleDateString()}</div>
                    <div className="text-[11px] font-semibold text-gray-500 mt-1">{new Date(fb.created_at).toLocaleTimeString()}</div>
                 </div>
              </div>

              <div className="p-6">
                <h4 className="text-[10px] uppercase font-black text-gray-300 mb-4 tracking-widest flex items-center">
                  Extracted Evaluation Values
                  {!selectedFormId && <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">Schema Config ID: {fb.form_id}</span>}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fb.answers && Object.entries(fb.answers).map(([key, val]) => {
                    const label = getLabel(fb.form_id, key);
                    const isLongText = String(val).length > 60;
                    return (
                      <div key={key} className={`bg-gray-50/80 p-4 rounded-xl border border-gray-100/50 transition hover:bg-gray-50 ${isLongText ? 'col-span-1 md:col-span-2' : ''}`}>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5 leading-snug">{label}</span>
                         <span className={`text-sm font-semibold ${val ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                           {val ? String(val) : 'Omitted Check'}
                         </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
