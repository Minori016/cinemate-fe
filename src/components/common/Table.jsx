export default function Table({ columns, data, actions }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-surface-2)]">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-[var(--color-text-muted)] font-semibold uppercase text-xs tracking-wider">{col.label}</th>
            ))}
            {actions && <th className="px-4 py-3 text-right text-[var(--color-text-muted)] font-semibold uppercase text-xs tracking-wider">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-[var(--color-surface-2)] transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-[var(--color-text)]">{col.render ? col.render(row) : row[col.key]}</td>
              ))}
              {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
