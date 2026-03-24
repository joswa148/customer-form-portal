import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye, Trash2, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import ResponseDetailModal from './ResponseDetailModal';

export default function ResponsesTable({ responses, forms, onDelete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  const ITEMS_PER_PAGE = 10;
  
  const sortedResponses = useMemo(() => {
    return [...responses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [responses]);

  const totalPages = Math.ceil(sortedResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = sortedResponses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="shrink-0 px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <Eye className="w-3 h-3"/> Standardized Lead Stream
        </span>
        <span className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
          {responses.length} Matches Found
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50/90 backdrop-blur-md border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-widest uppercase w-[40%]">Lead Identity</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-widest uppercase w-[25%] text-center">Tracking ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-widest uppercase w-[20%] text-right font-serif">Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-widest uppercase text-center w-[15%]">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedResponses.map((res) => {
               return (
                 <tr key={res.id} className="hover:bg-indigo-50/10 transition duration-150 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-black uppercase">
                          {res.user_name ? res.user_name[0] : 'A'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="font-black text-slate-900 text-[12px] truncate uppercase tracking-tight" title={res.user_name}>
                              {res.user_name || 'Anonymous'}
                            </div>
                            
                            {/* WhatsApp Delivery Status Indicator */}
                            {res.whatsapp_status && (
                              <div className="group/status relative cursor-help">
                                {res.whatsapp_status === 'sent' && <Clock className="w-3 h-3 text-slate-300" />}
                                {(res.whatsapp_status === 'delivered') && <CheckCheck className="w-3 h-3 text-slate-300" />}
                                {res.whatsapp_status === 'read' && <CheckCheck className="w-3 h-3 text-indigo-500" />}
                                {(res.whatsapp_status === 'failed' || res.whatsapp_status === 'undelivered') && <AlertCircle className="w-3 h-3 text-red-400" />}
                                
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover/status:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-xl">
                                  WhatsApp: {res.whatsapp_status} {res.whatsapp_error ? `(${res.whatsapp_error})` : ''}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 truncate">{res.user_email || 'No email provided'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       {res.ref_id ? (
                         <span className="text-[9px] font-black px-2 py-1 bg-indigo-600 text-white rounded-lg uppercase tracking-tighter">
                           {res.ref_id}
                         </span>
                       ) : (
                         <span className="text-[9px] font-bold text-slate-300 uppercase italic">Direct</span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="text-[11px] font-black text-slate-400 tabular-nums uppercase">
                        {new Date(res.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex items-center justify-center gap-2">
                         <button 
                           onClick={() => setSelectedResponse(res)}
                           className="p-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 rounded-xl transition shadow-sm group-hover:shadow-md active:scale-95"
                           title="Quick View"
                         >
                           <Eye className="w-4 h-4"/>
                         </button>
                         <button 
                           onClick={() => onDelete && onDelete(res.id)}
                           className="p-2 bg-white border border-slate-100 hover:border-red-300 hover:bg-red-50 text-red-400 rounded-xl transition active:scale-95"
                           title="Delete Lead"
                         >
                           <Trash2 className="w-4 h-4"/>
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
              className="p-2 px-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition shadow-sm font-black text-[10px]"
            >
              PREV
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 px-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition shadow-sm font-black text-[10px]"
            >
              NEXT
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
