import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog, DataTable } from '../../components/DataTable'
import { FormInput } from '../../components/Fields'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

const emptySeo = { entityType: 'page', entityId: '', metaTitle: '', metaDescription: '', slug: '' }

export function SeoPage() {
  const [form, setForm] = useState(emptySeo)
  const [editingId, setEditingId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const query = useQuery({ queryKey: ['/seo/meta'], queryFn: () => api.get('/seo/meta').then((r) => pickRows(r.data)) })
  const rows = query.data || []

  function edit(row) {
    setEditingId(row.id)
    setForm({
      entityType: row.entityType || 'page',
      entityId: row.entityId || '',
      metaTitle: row.metaTitle || '',
      metaDescription: row.metaDescription || '',
      slug: row.slug || '',
    })
  }

  async function save(event) {
    event.preventDefault()
    try {
      if (editingId) await api.put(`/seo/meta/${editingId}`, form)
      else await api.post('/seo/meta', form)
      toast.success(editingId ? 'SEO meta updated' : 'SEO meta created')
      setEditingId(null)
      setForm(emptySeo)
      query.refetch()
    } catch {
      toast.error('SEO save failed')
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/seo/meta/${id}`)
      toast.success('SEO meta deleted')
      query.refetch()
    } catch {
      toast.error('SEO delete failed')
    }
  }

  return (
    <section>
      <PageTitle title="SEO" action={`${rows.length} records`} />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel title="Meta Records">
          <DataTable rows={rows} columns={['entityType', 'entityId', 'metaTitle', 'slug']} loading={query.isLoading} onEdit={edit} onDelete={(row) => setConfirmAction({ title: `Delete ${row.metaTitle || row.slug}?`, message: 'This SEO record will be removed.', confirmLabel: 'Delete', onConfirm: () => remove(row.id) })} />
        </Panel>
        <div className="space-y-4">
          <Panel title={editingId ? 'Edit Meta' : 'Create Meta'}>
            <form onSubmit={save} className="grid gap-3">
              <label className="text-sm font-medium">
                <span>Entity Type</span>
                <select value={form.entityType} onChange={(event) => setForm({ ...form, entityType: event.target.value })} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
                  {['page', 'product', 'category', 'blog'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <FormInput label="Entity ID" value={form.entityId} onChange={(value) => setForm({ ...form, entityId: value })} />
              <FormInput label="Meta Title" value={form.metaTitle} onChange={(value) => setForm({ ...form, metaTitle: value })} />
              <FormInput label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
              <label className="text-sm font-medium">
                <span>Meta Description</span>
                <textarea value={form.metaDescription} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} className="mt-1 h-24 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
              </label>
              <div className="flex gap-2">
                <button className="rounded-md bg-brand px-4 py-2 text-white">Save</button>
                <button type="button" onClick={() => { setEditingId(null); setForm(emptySeo) }} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Reset</button>
              </div>
            </form>
          </Panel>
          <Panel title="Search Preview">
            <div className="rounded-md border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="truncate text-sm text-emerald-700 dark:text-emerald-400">labstore.local/{form.slug || form.entityId || 'page'}</div>
              <div className="mt-1 line-clamp-1 text-lg text-blue-700 dark:text-blue-400">{form.metaTitle || 'Meta title preview'}</div>
              <p className="mt-1 line-clamp-3 text-sm text-slate-600 dark:text-zinc-400">{form.metaDescription || 'Meta description preview for search result snippets.'}</p>
            </div>
          </Panel>
        </div>
      </div>
      <ConfirmDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
    </section>
  )
}
