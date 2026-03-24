import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye, Trash2, MessageSquare, Clock } from 'lucide-react';
import ResponseDetailModal from './ResponseDetailModal';

export default function ResponsesTable({ responses, forms, onDelete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    email: true,
    phone: true,
    date: true
  });
  
  const ITEMS_PER_PAGE = 7;
  
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
      <div className="shrink-0 px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responses Table</span>
        <div className="flex gap-2">
            {['email', 'phone', 'date'].map(col => (
               <button 
                  key={col}
                  onClick={() => setVisibleColumns(prev => ({...prev, [col]: !prev[col]}))}
                  className={`text-[9px] px-2 py-0.5 rounded-full border transition-all font-black uppercase tracking-tighter ${visibleColumns[col] ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
               >
                 {col}
               </button>
            ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-100/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase w-[25%]">Name</th>
              {visibleColumns.email && <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase hidden md:table-cell w-[25%]">Email</th>}
              {visibleColumns.phone && <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase hidden lg:table-cell w-[15%]">Phone</th>}
              {visibleColumns.date && <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase w-[20%]">Date</th>}
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 tracking-widest uppercase text-center w-[15%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedResponses.map((res) => (
               <tr key={res.id} className="hover:bg-indigo-50/30 transition duration-150 group">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800 text-xs truncate" title={res.user_name}>
                      {res.user_name || 'Anonymous'}
                    </div>
                  </td>
                  {visibleColumns.email && (
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[11px] font-semibold text-slate-500 block truncate" title={res.user_email}>
                         {res.user_email || '—'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.phone && (
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-[11px] font-semibold text-slate-500 truncate block">
                         {res.user_phone || '—'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.date && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(res.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2 text-center">
                     <div className="flex items-center justify-center gap-1">
                       <button 
                         onClick={() => setSelectedResponse(res)}
                         title="View Response"
                         className="p-1 px-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 rounded-lg transition shadow-sm"
                       >
                         <Eye className="w-3.5 h-3.5"/>
                       </button>
                       <button 
                         onClick={() => onDelete && onDelete(res.id)}
                         title="Delete Response"
                         className="p-1 px-2 border border-red-100 hover:border-red-300 hover:bg-red-50 text-red-500 rounded-lg transition shadow-sm"
                       >
                         <Trash2 className="w-3.5 h-3.5"/>
                       </button>
                     </div>
                  </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer - Injected into bottom of column */}
      <div className="shrink-0 px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400">
            {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 px-2 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 px-2 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition"
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
