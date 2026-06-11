const DataTable = ({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = 'Không có dữ liệu',
  rowKey = 'id',
  onRowClick,
  striped = true,
  hoverable = true,
  rowClassName,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-variant/30 border-b border-outline-variant font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="p-4">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="text-center py-8 font-body text-sm text-on-surface-variant">
                Đang tải dữ liệu...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-variant/30 border-b border-outline-variant font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="p-4">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="text-center py-8 font-body text-sm text-on-surface-variant">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-variant/30 border-b border-outline-variant font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="p-4" style={{ textAlign: col.align || 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant text-sm">
          {data.map((row, idx) => (
            <tr
              key={row[rowKey] || idx}
              className={`${striped && idx % 2 !== 0 ? 'bg-surface-low/30' : ''} ${hoverable ? 'hover:bg-surface-variant/20 transition-all group' : ''} ${typeof rowClassName === 'function' ? rowClassName(row, idx) : rowClassName || ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className="p-4"
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(row, idx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;