import React, { useEffect } from 'react';
import { X, Clock, Mail, Phone, CheckCircle2 } from 'lucide-react';

export default function ResponseDetailModal({ response, forms, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  if (!response) return null;

  let parsedAnswers = response.answers || {};
  if (typeof parsedAnswers === 'string') {
    try { parsedAnswers = JSON.parse(parsedAnswers); } catch(e) { console.error('Failed to parse answers', e); }
  }

  const formDoc = forms.find(f => f.id === response.form_id);

  const getLabel = (fieldId) => {
    if (!formDoc) return fieldId;
    let schema = formDoc.fields;
    if (typeof schema === 'string') {
      try { schema = JSON.parse(schema); } catch(e) { console.error('Failed to parse schema', e); return fieldId; }
    }
    if (!Array.isArray(schema)) return fieldId;
    const field = schema.find(f => f.id === fieldId);
    return field ? field.label : fieldId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
         onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative"
           onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50 relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 rounded-tl-[2rem]"></div>
          <div>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm inline-block mb-3">
              Response Overview
            </span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {response.user_name || 'Anonymous Respondent'}
            </h2>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600 font-medium">
               <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400"/> {response.user_email || 'No email'}</span>
               {response.user_phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400"/> {response.user_phone}</span>}
               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> {new Date(response.created_at).toLocaleString()}</span>
            </div>
            {response.ref_id && (
               <span className="mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 tracking-widest uppercase">
                 Tracking Ref: {response.ref_id}
               </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200/50 hover:bg-slate-200 text-slate-500 rounded-full transition-colors flex-shrink-0">
            <X className="w-6 h-6"/>
          </button>
        </div>

        {/* Scrollable Answers */}
        <div className="p-6 md:p-8 overflow-y-auto bg-white flex-1 relative">
           <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
             <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Questionnaire Answers
           </h3>
           <div className="space-y-6">
             {Object.entries(parsedAnswers).length === 0 ? (
                <p className="text-slate-400 italic">No answers provided</p>
             ) : (
                Object.entries(parsedAnswers).map(([k, v]) => (
                  <div key={k} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition">
                    <p className="text-sm font-bold text-slate-500 mb-2 leading-relaxed">{getLabel(k)}</p>
                    <p className="text-lg font-black text-slate-800 break-words">{v === null || v === '' ? <span className="text-slate-300 italic font-medium">Empty</span> : String(v)}</p>
                  </div>
                ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
