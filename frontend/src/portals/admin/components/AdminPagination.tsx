import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-bg-card border-t border-bg-border text-xs">
      {/* Items count & Per Page Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-content-muted font-mono">
          Showing <span className="font-bold text-content-primary">{startItem}</span> to{' '}
          <span className="font-bold text-content-primary">{endItem}</span> of{' '}
          <span className="font-bold text-content-primary">{totalItems}</span> entries
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center space-x-2 border-l border-bg-border pl-4">
            <span className="text-content-muted text-[11px]">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 rounded-lg bg-bg-surface border border-bg-border text-content-primary font-mono text-xs outline-none focus:border-primary-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1">
          {/* First Page */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1 px-1">
            {getPageNumbers().map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-content-muted font-mono">
                    ...
                  </span>
                );
              }
              const isCurrent = page === currentPage;
              return (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => onPageChange(Number(page))}
                  className={`min-w-[32px] h-8 px-2 rounded-lg font-mono font-bold text-xs transition-all ${
                    isCurrent
                      ? 'bg-primary-500 text-white shadow-glow'
                      : 'bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
