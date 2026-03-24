import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

export default function FeedbackPage() {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('id');
  const name = searchParams.get('name') || 'valued client';
  
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setStatus('sending');
    try {
      const resp = await api.post('/feedback', { submissionId, rating, comment });
      
      if (resp.status >= 200 && resp.status < 300) setStatus('success');
      else setStatus('error');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center shadow-xl animate-scale-in">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Thank You, {name}!</h1>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            Your feedback has been recorded. We appreciate your partnership in helping us improve our services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 animate-fade-in-up">
        <div className="mb-10 text-center">
          <div className="inline-block bg-indigo-50 px-4 py-1.5 rounded-full mb-4">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Feedback Intelligence</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">Rate Your Experience</h1>
          <p className="text-sm font-bold text-slate-400">Hello {name}, how would you describe our service?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform active:scale-90"
              >
                <Star 
                  className={`w-10 h-10 transition-colors ${
                    (hover || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Comment Box */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Insights (Optional)</label>
            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us what we did well or how we can improve..."
              className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={rating === 0 || status === 'sending'}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition"
          >
            {status === 'sending' ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </button>
          
          {status === 'error' && (
             <p className="text-center text-xs font-bold text-red-500">Something went wrong. Please try again later.</p>
          )}
        </form>
      </div>
    </div>
  );
}
