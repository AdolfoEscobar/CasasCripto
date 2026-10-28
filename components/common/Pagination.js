"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function Pagination({ paginationData, setPage }) {
  const { page, totalPages } = paginationData;

  // If there's only one page, don't show pagination
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 7) {
      // If there are 7 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (page <= 4) {
        // If we're in the first 4 pages
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (page >= totalPages - 3) {
        // If we're in the last 4 pages
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // If we're in the middle
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = page - 1; i <= page + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div className="mt-4 w-full border-t border-base-content/10 px-4 py-3 sm:px-6">
      {/* Mobile version */}
      <div className="flex w-full justify-between sm:hidden">
        <button
          className="btn btn-sm btn-outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <button
          className="btn btn-sm btn-outline"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>

      {/* Desktop version */}
      <div className="hidden sm:flex sm:flex-col sm:items-center sm:justify-center">
        <p className="text-sm text-base-content/60">
          Página <span className="font-medium">{page}</span> de{" "}
          <span className="font-medium">{totalPages}</span>
        </p>
        <div className="join mt-2" aria-label="Paginación">
          <button
            className="join-item btn btn-sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <span className="sr-only">Anterior</span>
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {renderPageNumbers().map((pageNumber, index) =>
            typeof pageNumber === "number" ? (
              <button
                key={index}
                className={`join-item btn btn-sm ${
                  page === pageNumber ? "btn-primary" : ""
                }`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ) : (
              <span key={index} className="join-item btn btn-sm btn-disabled">
                …
              </span>
            )
          )}

          <button
            className="join-item btn btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            <span className="sr-only">Siguiente</span>
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
