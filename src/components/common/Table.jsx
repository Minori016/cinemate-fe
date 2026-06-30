export default function Table({ columns, data, actions, emptyMessage = 'Không có dữ liệu' }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b border-white/[0.06]"
              style={{
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '0.08em',
                  }}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-5 py-12 text-center"
                >
                  <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                    {emptyMessage}
                  </p>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="group transition-colors duration-150 hover:bg-white/[0.03]"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-5 py-3.5"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-3.5 text-right">{actions(row)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
