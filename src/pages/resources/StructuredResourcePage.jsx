import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog, DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

export function StructuredResourcePage({ config }) {
  const initialForm = useMemo(() => createInitialForm(config.fields), [config.fields])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState(null)
  const query = useQuery({ queryKey: [config.endpoint], queryFn: () => api.get(config.endpoint).then((r) => pickRows(r.data)) })
  const rows = useMemo(() => (query.data || []).filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [query.data, search])
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize)

  function reset() {
    setEditingId(null)
    setForm(initialForm)
  }

  function edit(row) {
    setEditingId(row.id)
    setForm(config.fields.reduce((next, field) => ({ ...next, [field.name]: normalizeValue(row[field.name], field) }), {}))
  }

  async function save(event) {
    event.preventDefault()
    const missing = config.fields.find((field) => field.required && !String(form[field.name] ?? '').trim())
    if (missing) {
      toast.error(`${missing.label} is required`)
      return
    }
    const payload = toPayload(form, config.fields)
    try {
      if (editingId) await api.put(`${config.endpoint}/${editingId}`, payload)
      else await api.post(config.createEndpoint || config.endpoint, payload)
      toast.success(editingId ? `${config.singular} updated` : `${config.singular} created`)
      reset()
      query.refetch()
    } catch {
      toast.error(`${config.singular} save failed`)
    }
  }

  async function remove(id) {
    try {
      await api.delete(`${config.endpoint}/${id}`)
      toast.success(`${config.singular} deleted`)
      query.refetch()
    } catch {
      toast.error(`${config.singular} delete failed`)
    }
  }

  async function runAction(row, action) {
    try {
      await action.run(row, query.refetch)
      toast.success(action.success || 'Action completed')
    } catch {
      toast.error(action.error || 'Action failed')
    }
  }

  return (
    <section>
      <PageTitle title={config.title} action={`${rows.length} records`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search" className="min-w-72 rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
        <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} className="rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value={10}>10 rows</option><option value={20}>20 rows</option><option value={50}>50 rows</option></select>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel title={`${config.title} List`}>
          <DataTable rows={visibleRows} columns={config.columns} loading={query.isLoading} onEdit={edit} onDelete={(row) => setConfirmAction({ title: `Delete ${displayName(row)}?`, message: 'This action cannot be undone.', confirmLabel: 'Delete', onConfirm: () => remove(row.id) })} rowActions={(config.actions || []).map((action) => ({ ...action, run: (row) => runAction(row, action) }))} />
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm dark:border-zinc-800">
            <span className="text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-line px-3 py-1 disabled:opacity-50 dark:border-zinc-700">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-md border border-line px-3 py-1 disabled:opacity-50 dark:border-zinc-700">Next</button>
            </div>
          </div>
        </Panel>
        <Panel title={editingId ? `Edit ${config.singular}` : `Create ${config.singular}`}>
          <form onSubmit={save} className="grid gap-3">
            {config.fields.map((field) => <StructuredField key={field.name} field={field} value={form[field.name]} onChange={(value) => setForm({ ...form, [field.name]: value })} />)}
            <div className="flex gap-2">
              <button className="rounded-md bg-brand px-4 py-2 text-white">Save</button>
              <button type="button" onClick={reset} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Reset</button>
            </div>
          </form>
        </Panel>
      </div>
      <ConfirmDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
    </section>
  )
}

function StructuredField({ field, value, onChange }) {
  if (field.type === 'select') {
    return <label className="text-sm font-medium"><span>{field.label}</span><select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
  }
  if (field.type === 'checkbox') {
    return <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />{field.label}</label>
  }
  if (field.type === 'textarea') {
    return <label className="text-sm font-medium"><span>{field.label}</span><textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 h-28 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" /></label>
  }
  return <label className="text-sm font-medium"><span>{field.label}</span><input type={field.type || 'text'} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" /></label>
}

function createInitialForm(fields) {
  return fields.reduce((form, field) => ({ ...form, [field.name]: field.defaultValue ?? (field.type === 'checkbox' ? false : '') }), {})
}

function normalizeValue(value, field) {
  if (field.type === 'datetime-local' && value) return String(value).slice(0, 16)
  if (field.type === 'checkbox') return Boolean(value)
  return value ?? field.defaultValue ?? ''
}

function toPayload(form, fields) {
  return fields.reduce((payload, field) => {
    const value = form[field.name]
    if (field.type === 'number') payload[field.name] = Number(value || 0)
    else if (field.type === 'datetime-local') payload[field.name] = value ? new Date(value).toISOString() : null
    else if (field.nullable && value === '') payload[field.name] = null
    else payload[field.name] = value
    return payload
  }, {})
}

function displayName(row) {
  return row.name || row.title || row.code || row.email || row.subject || row.id
}
