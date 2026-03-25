import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Search, MessageCircle, AlertCircle, CheckCircle2, Activity, Eye } from 'lucide-react';
import ResponseDetailModal from './ResponseDetailModal';

export default function LinkTrackingTable({ formId, forms, responses = [] }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedResponse, setSelectedResponse] = useState(null);

  const activeForm = formId ? forms.find(f => f.id === Number(formId)) : forms[0];

  useEffect(() => {
    if (!activeForm?.id) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/forms/${activeForm.id}/tracking-stats`);
        setStats(data || []);
      } catch (err) {
        console.error('Failed to fetch tracking stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [activeForm?.id]);

  const filteredStats = stats.filter(s => s.ref_id.toLowerCase().includes(search.toLowerCase()));

  const sendReminder = (refId) => {
    if (!activeForm) return;
    let origin = window.location.origin;
    const feedbackLink = `${origin}/interactive/${activeForm.uuid}?ref=${encodeURIComponent(refId)}`;
    const text = encodeURIComponent(`Hi ${refId},\n\nWe noticed you started providing your feedback on "${activeForm.title}" but didn't complete the submission. Here is your secure link to finalize it:\n\n${feedbackLink}`);
    
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/30">
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl">
               <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
               <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Link Tracking Matrix</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Track Open & Submission Rates</p>
            </div>
         </div>
         <div className="relative group w-64">
           <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
           <input 
             type="text"
             value={search}
             placeholder="Search Reference IDs..."
             onChange={(e) => setSearch(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
           />
         </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-8">
        {loading ? (
            <div className="flex justify-center items-center py-20 animate-pulse text-indigo-300 font-black text-xs uppercase tracking-widest">
                Fetching Telemetry...
            </div>
        ) : filteredStats.length === 0 ? (
            <div className="text-center py-20 bg-white border-2 border-slate-100 rounded-3xl shadow-sm">
                <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">No Tracked Links Yet</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 max-w-sm mx-auto">Generate a tracked link via the Admin Dashboard and share it with clients to begin accumulating tracking analytics.</p>
            </div>
        ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mix-blend-multiply">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <th className="p-4 pl-6">Tracking ID</th>
                        <th className="p-4">Current Status</th>
                        <th className="p-4">First Opened At</th>
                        <th className="p-4">Submission Time</th>
                        <th className="p-4 text-right pr-6">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                     {filteredStats.map((stat, i) => {
                         const isSubmitted = stat.status === 'submitted';
                         return (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="p-4 pl-6 font-black text-slate-800">{stat.ref_id}</td>
                               <td className="p-4">
                                  {isSubmitted ? (
                                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                                     </span>
                                  ) : (
                                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                                        <AlertCircle className="w-3.5 h-3.5" /> Opened / Abandoned
                                     </span>
                                  )}
                               </td>
                               <td className="p-4 text-[11px] font-bold text-slate-500">
                                  {new Date(stat.openedAt).toLocaleString()}
                               </td>
                               <td className="p-4 text-[11px] font-bold text-slate-500">
                                  {stat.submittedAt ? new Date(stat.submittedAt).toLocaleString() : '-'}
                               </td>
                               <td className="p-4 pr-6 text-right">
                                  {isSubmitted ? (
                                     <button 
                                        onClick={() => {
                                           const matched = responses.find(r => r.ref_id === stat.ref_id && String(r.form_id) === String(activeForm.id));
                                           if (matched) setSelectedResponse(matched);
                                        }}
                                        className="p-2 inline-flex border border-slate-200 hover:bg-violet-50 hover:border-violet-300 text-violet-600 rounded-xl transition-all shadow-sm active:scale-95"
                                        title="View Submission Details"
                                     >
                                        <Eye className="w-4 h-4" />
                                     </button>
                                  ) : (
                                     <button 
                                        onClick={() => sendReminder(stat.ref_id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                                     >
                                        <MessageCircle className="w-3.5 h-3.5" /> Send Reminder
                                     </button>
                                  )}
                               </td>
                            </tr>
                         );
                     })}
                  </tbody>
               </table>
            </div>
        )}
      </div>

      {selectedResponse && (
        <ResponseDetailModal 
          response={selectedResponse} 
          forms={forms} 
          onClose={() => setSelectedResponse(null)} 
        />
      )}
    </div>
  );
}
