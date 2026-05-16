import { format } from '../utils/data'

export function DataTable({ rows, columns, loading, selectedIds = [], onToggleRow, onToggleAll, rowActions = [], onView, onEdit, onDelete }) {
  if (loading) return <div className="h-32 animate-pulse rounded-md bg-slate-100 dark:bg-zinc-800" />
  if (!rows.length) return <div className="py-10 text-center text-slate-500">No records found</div>
  const selectableRows = rows.filter((row) => row.id)
  const allVisibleSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.includes(row.id))
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-line dark:border-zinc-800">{onToggleRow && <th className="w-10 px-3 py-2"><input type="checkbox" checked={allVisibleSelected} onChange={onToggleAll} /></th>}{columns.map((col) => <th key={col} className="px-3 py-2 font-medium text-slate-500">{col}</th>)}{(rowActions.length > 0 || onView || onEdit || onDelete) && <th className="px-3 py-2" />}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.id || index} className="border-b border-line last:border-0 dark:border-zinc-800">{onToggleRow && <td className="px-3 py-3">{row.id && <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => onToggleRow(row.id)} />}</td>}{columns.map((col) => <td key={col} className="px-3 py-3">{format(row[col])}</td>)}{(rowActions.length > 0 || onView || onEdit || onDelete) && <td className="whitespace-nowrap px-3 py-3 text-right">{onView && <button onClick={() => onView(row)} className="mr-2 text-slate-600 dark:text-zinc-300">View</button>}{rowActions.map((item) => <button key={item.action} onClick={() => item.run(row, item.action)} className="mr-2 text-brand">{item.label}</button>)}{onEdit && <button onClick={() => onEdit(row)} className="mr-2 text-brand">Edit</button>}{onDelete && <button onClick={() => onDelete(row)} className="text-berry">Delete</button>}</td>}</tr>)}</tbody>
      </table>
    </div>
  )
}

export function ConfirmDialog({ action, onClose }) {
  if (!action) return null
  async function confirm() {
    await action.onConfirm()
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-md border border-line bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">{action.title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{action.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Cancel</button>
          <button onClick={confirm} className="rounded-md bg-berry px-4 py-2 text-white">{action.confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
