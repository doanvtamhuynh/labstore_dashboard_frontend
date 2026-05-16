import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog, DataTable } from '../../components/DataTable'
import { FormInput } from '../../components/Fields'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

const emptyPost = { title: '', slug: '', content: '', status: 'Draft' }

export function BlogPage() {
  const [form, setForm] = useState(emptyPost)
  const [editingId, setEditingId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const query = useQuery({ queryKey: ['/blog/posts'], queryFn: () => api.get('/blog/posts').then((r) => pickRows(r.data)) })
  const rows = query.data || []

  function edit(row) {
    setEditingId(row.id)
    setForm({ title: row.title || '', slug: row.slug || '', content: row.content || '', status: row.status || 'Draft' })
  }

  async function save(event) {
    event.preventDefault()
    try {
      if (editingId) await api.put(`/blog/posts/${editingId}`, form)
      else await api.post('/blog/posts', form)
      toast.success(editingId ? 'Post updated' : 'Post created')
      setEditingId(null)
      setForm(emptyPost)
      query.refetch()
    } catch {
      toast.error('Post save failed')
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/blog/posts/${id}`)
      toast.success('Post deleted')
      query.refetch()
    } catch {
      toast.error('Post delete failed')
    }
  }

  return (
    <section>
      <PageTitle title="Blog" action={`${rows.length} posts`} />
      <div className="grid gap-4 xl:grid-cols-[1fr_460px]">
        <Panel title="Posts">
          <DataTable rows={rows} columns={['title', 'slug', 'status']} loading={query.isLoading} onEdit={edit} onDelete={(row) => setConfirmAction({ title: `Delete ${row.title}?`, message: 'This blog post will be removed.', confirmLabel: 'Delete', onConfirm: () => remove(row.id) })} />
        </Panel>
        <div className="space-y-4">
          <Panel title={editingId ? 'Edit Post' : 'Create Post'}>
            <form onSubmit={save} className="grid gap-3">
              <FormInput label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
              <FormInput label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
              <label className="text-sm font-medium">
                <span>Status</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
                  {['Draft', 'Published', 'Archived'].map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">
                <span>Content</span>
                <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="mt-1 h-60 w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950" />
              </label>
              <div className="flex gap-2">
                <button className="rounded-md bg-brand px-4 py-2 text-white">Save</button>
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyPost) }} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Reset</button>
              </div>
            </form>
          </Panel>
          <Panel title="Preview">
            <article className="rounded-md border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">{form.status}</div>
              <h2 className="text-xl font-semibold">{form.title || 'Post title preview'}</h2>
              <div className="mt-1 text-sm text-slate-500">/{form.slug || 'post-slug'}</div>
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700 dark:text-zinc-300">{form.content || 'Write post content to preview it here.'}</p>
            </article>
          </Panel>
        </div>
      </div>
      <ConfirmDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
    </section>
  )
}
