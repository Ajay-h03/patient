export default function PaginationBar({ page, totalPages, total, limit, onPage }) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="pager">
      <span className="text-muted small">
        Showing {start}-{end} of {total}
      </span>
      <div className="btn-group">
        <button type="button" className="btn btn-outline-quiet" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button type="button" className="btn btn-outline-quiet" disabled>
          {page} / {totalPages}
        </button>
        <button
          type="button"
          className="btn btn-outline-quiet"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
