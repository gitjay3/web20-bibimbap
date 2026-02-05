import ChevronIcon from '@/assets/icons/chevron-down.svg?react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i += 1) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const buttonBase =
    'flex h-8 w-8 items-center justify-center rounded-md text-14 transition-colors';
  const pageButton = (isActive: boolean) =>
    isActive
      ? `${buttonBase} bg-brand-surface-default text-white`
      : `${buttonBase} text-neutral-text-secondary hover:bg-neutral-surface-default`;

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${buttonBase} text-neutral-text-tertiary disabled:opacity-30`}
        aria-label="이전 페이지"
      >
        <ChevronIcon className="h-4 w-4 rotate-90" />
      </button>

      {getPageNumbers().map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-8 w-8 items-center justify-center text-neutral-text-tertiary"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={pageButton(page === currentPage)}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${buttonBase} text-neutral-text-tertiary disabled:opacity-30`}
        aria-label="다음 페이지"
      >
        <ChevronIcon className="h-4 w-4 -rotate-90" />
      </button>
    </div>
  );
}

export default Pagination;
