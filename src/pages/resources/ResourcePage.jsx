import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog, DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

export function ResourcePage({ config }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState(() => JSON.stringify(config.sample || {}, null, 2))
  const [selected, setSelected] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmAction, setConfirmAction] = useState(null)
  const query = useQuery({ queryKey: [config.endpoint], queryFn: () => api.get(config.endpoint).then((r) => pickRows(r.data)) })
  const rows = useMemo(() => (query.data || [])
    .filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()))
    .filter((row) => !statusFilter || row.status === statusFilter || row.paymentStatus === statusFilter), [query.data, search, statusFilter])
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const statusOptions = useMemo(() => [...new Set((query.data || []).flatMap((row) => [row.status, row.paymentStatus]).filter(Boolean))], [query.data])
  const canMutate = Boolean(config.sample)
  const canProductManage = config.endpoint === '/products'
  const canDelete = canProductManage || canMutate

  async function exportCsv() {
    const exportEndpoints = {
      '/products': '/products/export',
      '/orders': '/orders/export',
      '/reports': '/reports/revenue/export',
    }
    const endpoint = exportEndpoints[config.endpoint]
    if (!endpoint) {
      toast.info('Export is not available for this page yet')
      return
    }
    const response = await api.get(endpoint, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${config.title.toLowerCase().replaceAll(' ', '-')}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importProducts(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/products/import', formData)
      toast.success('Products imported')
      query.refetch()
    } catch {
      toast.error('Import failed')
    } finally {
      event.target.value = ''
    }
  }

  async function save() {
    try {
      const payload = JSON.parse(editor)
      if (selected?.id) {
        await api.put(`${config.endpoint}/${selected.id}`, payload)
        toast.success('Updated')
      } else {
        await api.post(config.createEndpoint || config.endpoint, payload)
        toast.success('Created')
      }
      setSelected(null)
      setEditor(JSON.stringify(config.sample || {}, null, 2))
      query.refetch()
    } catch {
      toast.error('Invalid JSON or request failed')
    }
  }

  async function deleteRows(ids) {
    if (!ids.length) return
    try {
      await Promise.all(ids.map((id) => api.delete(`${config.endpoint}/${id}`)))
      toast.success(ids.length > 1 ? 'Records deleted' : 'Deleted')
      setSelectedIds([])
      query.refetch()
    } catch {
      toast.error('Delete failed')
    }
  }

  function requestDelete(ids) {
    setConfirmAction({
      title: ids.length > 1 ? 'Delete selected records?' : 'Delete this record?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteRows(ids),
    })
  }

  function toggleRow(id) {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])
  }

  function toggleVisibleRows() {
    const visibleIds = visibleRows.map((row) => row.id).filter(Boolean)
    const allSelected = visibleIds.every((id) => selectedIds.includes(id))
    setSelectedIds((ids) => allSelected ? ids.filter((id) => !visibleIds.includes(id)) : [...new Set([...ids, ...visibleIds])])
  }

  const rowActions = []

  return (
    <section>
      <PageTitle title={config.title} action="Export" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="min-w-72 rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
        {statusOptions.length > 0 && <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }} className="rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">All statuses</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select>}
        <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} className="rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value={10}>10 rows</option><option value={20}>20 rows</option><option value={50}>50 rows</option></select>
        {config.create && <NavLink to={config.create} className="rounded-md bg-brand px-4 py-2 text-white">Create</NavLink>}
        {(config.endpoint === '/products' || config.endpoint === '/orders') && <button onClick={exportCsv} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Export CSV</button>}
        {config.endpoint === '/products' && <label className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Import CSV<input type="file" accept=".csv" onChange={importProducts} className="hidden" /></label>}
        {canMutate && <button onClick={() => { setSelected(null); setEditor(JSON.stringify(config.sample, null, 2)) }} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">New JSON</button>}
        {canDelete && selectedIds.length > 0 && <button onClick={() => requestDelete(selectedIds)} className="rounded-md bg-berry px-4 py-2 text-white">Delete selected ({selectedIds.length})</button>}
      </div>
      <div className={canMutate ? 'grid gap-4 xl:grid-cols-[1fr_420px]' : ''}>
        <Panel title={`${rows.length} records`}>
          <DataTable rows={visibleRows} columns={config.columns} loading={query.isLoading} selectedIds={selectedIds} onToggleRow={canDelete ? toggleRow : null} onToggleAll={canDelete ? toggleVisibleRows : null} rowActions={rowActions} onEdit={canProductManage ? (row) => navigate(`/products/${row.id}/edit`) : canMutate ? (row) => { setSelected(row); setEditor(JSON.stringify(row, null, 2)) } : null} onDelete={canDelete ? (row) => requestDelete([row.id]) : null} />
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm dark:border-zinc-800">
            <span className="text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-line px-3 py-1 disabled:opacity-50 dark:border-zinc-700">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-md border border-line px-3 py-1 disabled:opacity-50 dark:border-zinc-700">Next</button>
            </div>
          </div>
        </Panel>
        {canMutate && (
          <Panel title={selected ? `Edit ${selected.id}` : 'Create JSON'}>
            <textarea value={editor} onChange={(event) => setEditor(event.target.value)} className="h-80 w-full rounded-md border border-line bg-slate-50 p-3 font-mono text-xs outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-950" />
            <div className="mt-3 flex gap-2">
              <button onClick={save} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white">Save</button>
              <button onClick={() => { setSelected(null); setEditor(JSON.stringify(config.sample, null, 2)) }} className="rounded-md border border-line px-4 py-2 text-sm dark:border-zinc-700">Reset</button>
            </div>
          </Panel>
        )}
      </div>
      <ConfirmDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
    </section>
  )
}
