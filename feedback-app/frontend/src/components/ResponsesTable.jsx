import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye, Trash2, MessageSquare, Clock } from 'lucide-react';
import ResponseDetailModal from './ResponseDetailModal';

export default function ResponsesTable({ responses, forms, onDelete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  const ITEMS_PER_PAGE = 10;
  
  // Sorting: strictly latest first (descending) explicitly defined by user instructions
  const sortedResponses = useMemo(() => {
    return [...responses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [responses]);

  const totalPages = Math.ceil(sortedResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = sortedResponses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="w-full relative shadow-xl shadow-slate-200/40 rounded-3xl bg-white border border-slate-200 top-0 overflow-hidden">
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-5 text-xs font-black text-slate-500 tracking-widest uppercase">Name</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 tracking-widest uppercase hidden md:table-cell">Email</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 tracking-widest uppercase hidden lg:table-cell">Phone</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 tracking-widest uppercase">Submitted At</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 tracking-widest uppercase text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedResponses.map((res) => (
               <tr key={res.id} className="hover:bg-indigo-50/50 transition duration-150 group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-800 text-sm md:text-base">
                      {res.user_name || 'Anonymous'}
                    </div>
                    {/* Fallback for mobile views dropping columns */}
                    <div className="text-xs text-slate-500 mt-1 md:hidden font-medium">
                      {res.user_email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className="text-sm font-semibold text-slate-600 block max-w-[200px] truncate" title={res.user_email}>
                       {res.user_email || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell">
                    <span className="text-sm font-semibold text-slate-600">
                       {res.user_phone || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(res.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                     <div className="flex items-center justify-center gap-2 mx-auto">
                       <button 
                         onClick={() => setSelectedResponse(res)}
                         aria-label="View Response Details"
                         className="p-2 md:px-4 md:py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 rounded-xl transition shadow-sm font-bold text-sm flex items-center justify-center gap-1.5 focus:ring-4 focus:ring-indigo-500/20"
                       >
                         <Eye className="w-4 h-4"/> <span className="hidden md:inline">View</span>
                       </button>
                       <button 
                         onClick={() => onDelete && onDelete(res.id)}
                         aria-label="Delete Response"
                         className="p-2 md:px-4 md:py-2 bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 rounded-xl transition shadow-sm font-bold text-sm flex items-center justify-center gap-1.5 focus:ring-4 focus:ring-red-500/20"
                       >
                         <Trash2 className="w-4 h-4"/> <span className="hidden md:inline">Delete</span>
                       </button>
                     </div>
                  </td>
               </tr>
            ))}
            
            {paginatedResponses.length === 0 && (
               <tr>
                 <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                       <MessageSquare className="w-12 h-12 mb-3 text-slate-200" />
                       <span className="text-lg font-bold">No responses found for this filter.</span>
                    </div>
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
          <span className="text-sm font-bold text-slate-500">
            Showing <span className="text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, sortedResponses.length)}</span> of <span className="text-slate-800">{sortedResponses.length}</span> entries
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold"
            >
              <ChevronLeft className="w-5 h-5"/>
            </button>
            <div className="hidden sm:flex items-center gap-1">
               {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                 <button
                   key={page}
                   onClick={() => setCurrentPage(page)}
                   className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition ${currentPage === page ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
                 >
                   {page}
                 </button>
               ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold"
            >
              <ChevronRight className="w-5 h-5"/>
            </button>
          </div>
         </div>
      )}

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
