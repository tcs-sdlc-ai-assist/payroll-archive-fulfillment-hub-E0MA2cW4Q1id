import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Sorts an array of data objects by a given key and direction.
 * @param {Object[]} data - The data array to sort
 * @param {string} sortKey - The object key to sort by
 * @param {'asc'|'desc'} sortDirection - The sort direction
 * @returns {Object[]} A new sorted array
 */
function sortData(data, sortKey, sortDirection) {
  if (!sortKey) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
    if (bVal == null) return sortDirection === 'asc' ? 1 : -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Reusable data table component with sortable columns, pagination,
 * and optional row selection via checkboxes.
 *
 * @param {Object} props
 * @param {Object[]} props.columns - Column configuration array
 * @param {string} props.columns[].key - The data key for this column
 * @param {string} props.columns[].label - The display label for the column header
 * @param {boolean} [props.columns[].sortable] - Whether this column is sortable (defaults to true)
 * @param {Function} [props.columns[].render] - Optional custom render function (value, row) => ReactNode
 * @param {string} [props.columns[].className] - Optional additional CSS classes for the column cells
 * @param {Object[]} props.data - The data array to display
 * @param {Function} [props.onRowClick] - Callback when a row is clicked, receives the row data
 * @param {boolean} [props.selectable] - Whether to show row selection checkboxes
 * @param {Object[]} [props.selectedRows] - Array of currently selected row objects
 * @param {Function} [props.onSelectionChange] - Callback when selection changes, receives array of selected rows
 * @param {string} [props.rowKey] - The data key to use as a unique row identifier (defaults to 'id')
 * @param {number} [props.pageSize] - Number of rows per page (defaults to 10)
 * @param {string} [props.emptyMessage] - Message to display when there is no data
 * @param {string} [props.className] - Optional additional CSS classes for the table container
 */
export function DataTable({
  columns,
  data,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey = 'id',
  pageSize = 10,
  emptyMessage = 'No data available.',
  className,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Handles clicking a sortable column header.
   * Toggles direction if the same column is clicked again.
   * @param {string} key - The column key to sort by
   */
  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
      setCurrentPage(1);
    },
    [sortKey]
  );

  /**
   * The sorted data array.
   * @type {Object[]}
   */
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }
    if (!sortKey) {
      return data;
    }
    return sortData(data, sortKey, sortDirection);
  }, [data, sortKey, sortDirection]);

  /**
   * Total number of pages.
   * @type {number}
   */
  const totalPages = useMemo(() => {
    if (sortedData.length === 0) {
      return 1;
    }
    return Math.ceil(sortedData.length / pageSize);
  }, [sortedData.length, pageSize]);

  /**
   * The data slice for the current page.
   * @type {Object[]}
   */
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  /**
   * Gets the unique key value for a row.
   * @param {Object} row - The row data object
   * @returns {string} The unique key value
   */
  const getRowKey = useCallback(
    (row) => {
      if (row && row[rowKey] != null) {
        return String(row[rowKey]);
      }
      return String(Math.random());
    },
    [rowKey]
  );

  /**
   * Checks if a row is currently selected.
   * @param {Object} row - The row data object
   * @returns {boolean} True if the row is selected
   */
  const isRowSelected = useCallback(
    (row) => {
      if (!selectable || !Array.isArray(selectedRows)) {
        return false;
      }
      const key = getRowKey(row);
      return selectedRows.some((r) => getRowKey(r) === key);
    },
    [selectable, selectedRows, getRowKey]
  );

  /**
   * Handles toggling selection for a single row.
   * @param {Object} row - The row data object
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
   */
  const handleRowSelect = useCallback(
    (row, e) => {
      e.stopPropagation();
      if (!onSelectionChange) {
        return;
      }

      const key = getRowKey(row);
      const isSelected = selectedRows.some((r) => getRowKey(r) === key);

      if (isSelected) {
        onSelectionChange(selectedRows.filter((r) => getRowKey(r) !== key));
      } else {
        onSelectionChange([...selectedRows, row]);
      }
    },
    [selectedRows, onSelectionChange, getRowKey]
  );

  /**
   * Handles toggling select-all for the current page.
   */
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) {
      return;
    }

    const allPageSelected = paginatedData.every((row) => isRowSelected(row));

    if (allPageSelected) {
      const pageKeys = new Set(paginatedData.map((row) => getRowKey(row)));
      onSelectionChange(selectedRows.filter((r) => !pageKeys.has(getRowKey(r))));
    } else {
      const currentKeys = new Set(selectedRows.map((r) => getRowKey(r)));
      const newSelections = paginatedData.filter((row) => !currentKeys.has(getRowKey(row)));
      onSelectionChange([...selectedRows, ...newSelections]);
    }
  }, [paginatedData, selectedRows, onSelectionChange, isRowSelected, getRowKey]);

  /**
   * Whether all rows on the current page are selected.
   * @type {boolean}
   */
  const allPageSelected = useMemo(() => {
    if (paginatedData.length === 0) {
      return false;
    }
    return paginatedData.every((row) => isRowSelected(row));
  }, [paginatedData, isRowSelected]);

  /**
   * Whether some (but not all) rows on the current page are selected.
   * @type {boolean}
   */
  const somePageSelected = useMemo(() => {
    if (paginatedData.length === 0) {
      return false;
    }
    const selectedCount = paginatedData.filter((row) => isRowSelected(row)).length;
    return selectedCount > 0 && selectedCount < paginatedData.length;
  }, [paginatedData, isRowSelected]);

  /**
   * Handles clicking a row.
   * @param {Object} row - The row data object
   */
  const handleRowClick = useCallback(
    (row) => {
      if (onRowClick) {
        onRowClick(row);
      }
    },
    [onRowClick]
  );

  /**
   * Navigates to the previous page.
   */
  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  /**
   * Navigates to the next page.
   */
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  /**
   * Navigates to a specific page.
   * @param {number} page - The page number to navigate to
   */
  const goToPage = useCallback(
    (page) => {
      const target = Math.max(1, Math.min(totalPages, page));
      setCurrentPage(target);
    },
    [totalPages]
  );

  /**
   * Generates an array of page numbers to display in the pagination controls.
   * @returns {(number|string)[]} Array of page numbers and ellipsis markers
   */
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [totalPages, currentPage]);

  const validColumns = Array.isArray(columns) ? columns : [];
  const validData = Array.isArray(data) ? data : [];

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedData.length);

  return (
    <div className={`w-full ${className || ''}`}>
      {/* Table */}
      <div className="overflow-x-auto border border-kelly-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-kelly-gray-200">
          <thead className="bg-kelly-gray-50">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = somePageSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-kelly-gray-300 text-kelly-green focus:ring-kelly-green cursor-pointer"
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {validColumns.map((col) => {
                const isSortable = col.sortable !== false;
                const isSorted = sortKey === col.key;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-kelly-gray-600 ${
                      isSortable ? 'cursor-pointer select-none hover:text-kelly-gray-900' : ''
                    } ${col.className || ''}`}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                    aria-sort={
                      isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center space-x-1">
                      <span>{col.label}</span>
                      {isSortable && (
                        <span className="inline-flex flex-col ml-1">
                          <svg
                            className={`w-3 h-3 ${
                              isSorted && sortDirection === 'asc'
                                ? 'text-kelly-green'
                                : 'text-kelly-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 6l-5 5h10l-5-5z" />
                          </svg>
                          <svg
                            className={`w-3 h-3 -mt-1 ${
                              isSorted && sortDirection === 'desc'
                                ? 'text-kelly-green'
                                : 'text-kelly-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 14l5-5H5l5 5z" />
                          </svg>
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-kelly-gray-100">
            {paginatedData.length === 0 && (
              <tr>
                <td
                  colSpan={validColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-kelly-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {paginatedData.map((row, rowIndex) => {
              const key = getRowKey(row);
              const selected = isRowSelected(row);

              return (
                <tr
                  key={key}
                  onClick={() => handleRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    selected
                      ? 'bg-kelly-green/5'
                      : rowIndex % 2 === 0
                      ? 'bg-white'
                      : 'bg-kelly-gray-50/50'
                  } hover:bg-kelly-gray-100`}
                >
                  {selectable && (
                    <td className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => handleRowSelect(row, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-kelly-gray-300 text-kelly-green focus:ring-kelly-green cursor-pointer"
                        aria-label={`Select row ${key}`}
                      />
                    </td>
                  )}
                  {validColumns.map((col) => {
                    const value = row[col.key];
                    const rendered = col.render ? col.render(value, row) : value;

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm text-kelly-gray-700 whitespace-nowrap ${col.className || ''}`}
                      >
                        {rendered != null ? rendered : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {validData.length > 0 && (
        <div className="flex items-center justify-between px-2 py-3 mt-2">
          <div className="text-sm text-kelly-gray-500">
            Showing <span className="font-medium text-kelly-gray-700">{startIndex}</span> to{' '}
            <span className="font-medium text-kelly-gray-700">{endIndex}</span> of{' '}
            <span className="font-medium text-kelly-gray-700">{sortedData.length}</span> result(s)
            {selectable && selectedRows.length > 0 && (
              <span className="ml-2 text-kelly-green font-medium">
                ({selectedRows.length} selected)
              </span>
            )}
          </div>
          <nav className="inline-flex items-center space-x-1" aria-label="Pagination">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium text-kelly-gray-600 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="inline-flex items-center justify-center w-8 h-8 text-sm text-kelly-gray-400"
                  >
                    …
                  </span>
                );
              }

              const isActive = page === currentPage;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green ${
                    isActive
                      ? 'bg-kelly-green text-white border border-kelly-green'
                      : 'text-kelly-gray-600 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50'
                  }`}
                  aria-label={`Page ${page}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium text-kelly-gray-600 bg-white border border-kelly-gray-300 hover:bg-kelly-gray-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kelly-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      render: PropTypes.func,
      className: PropTypes.string,
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  onRowClick: PropTypes.func,
  selectable: PropTypes.bool,
  selectedRows: PropTypes.arrayOf(PropTypes.object),
  onSelectionChange: PropTypes.func,
  rowKey: PropTypes.string,
  pageSize: PropTypes.number,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
};

DataTable.defaultProps = {
  onRowClick: undefined,
  selectable: false,
  selectedRows: [],
  onSelectionChange: undefined,
  rowKey: 'id',
  pageSize: 10,
  emptyMessage: 'No data available.',
  className: undefined,
};

export default DataTable;