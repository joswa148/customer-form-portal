import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye, Trash2, Snowflake, Flame, Zap } from 'lucide-react';
import ResponseDetailModal from './ResponseDetailModal';

export default function ResponsesTable({ responses, forms, onDelete, allFields, activeQuestionIndex }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  const ITEMS_PER_PAGE = 8;
  
  const sortedResponses = useMemo(() => {
    return [...responses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [responses]);

  const totalPages = Math.ceil(sortedResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = sortedResponses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const getAnswerForActive = (res) => {
    let answers = res.answers;
    if (typeof answers === 'string') try { answers = JSON.parse(answers); } catch { answers = {}; }
    const field = allFields[activeQuestionIndex];
    if (!field) return 'N/A';
    const val = answers[field.id];
    if (val === undefined || val === null) return '-';
    return Array.isArray(val) ? val.join(', ') : val;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="shrink-0 px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <Eye className="w-3 h-3"/> Granular Response Stream
        </span>
        <span className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
          {responses.length} Matches
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50/90 backdrop-blur-md border-b border-slate-200">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase w-[35%]">Identity / Metric</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase w-[40%]">Question Insight</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase w-[12%] text-right font-serif">Date</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase text-center w-[13%]">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedResponses.map((res) => {
               const answer = getAnswerForActive(res);
               return (
                 <tr key={res.id} className="hover:bg-indigo-50/20 transition duration-150 group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-black text-slate-900 text-[12px] truncate uppercase tracking-tight" title={res.user_name}>
                          {res.user_name || 'Anonymous'}
                        </div>
                        {res.ref_id && (
                          <span className="text-[8px] font-black px-1.5 bg-indigo-600 text-white rounded uppercase pt-0.5">{res.ref_id}</span>
                        )}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 truncate mt-0.5">{res.user_email}</div>
                    </td>
                    <td className="px-4 py-4">
                       <div className="text-[11px] font-black text-indigo-600 bg-indigo-50/30 border border-indigo-100/50 px-3 py-1.5 rounded-xl truncate hover:overflow-visible hover:whitespace-normal transition-all" title={answer}>
                          {answer}
                       </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-[11px] font-black text-slate-400 tabular-nums">
                        {new Date(res.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                       <div className="flex items-center justify-center gap-1 transition">
                         <button 
                           onClick={() => setSelectedResponse(res)}
                           className="p-1 px-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 rounded-lg transition shadow-sm"
                         >
                           <Eye className="w-3.5 h-3.5"/>
                         </button>
                         <button 
                           onClick={() => onDelete && onDelete(res.id)}
                           className="p-1 px-2 border border-slate-100 hover:border-red-300 hover:bg-red-50 text-red-400 rounded-lg transition"
                         >
                           <Trash2 className="w-3.5 h-3.5"/>
                         </button>
                       </div>
                    </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
             Entries { (currentPage - 1) * ITEMS_PER_PAGE + 1 } - { Math.min(currentPage * ITEMS_PER_PAGE, responses.length) } <span className="opacity-30 mx-2">of</span> {responses.length}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition shadow-sm"
            >
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition shadow-sm"
            >
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
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
