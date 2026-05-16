import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '../../components/DataTable'
import { FormInput } from '../../components/Fields'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

const emptyCategory = { name: '', slug: '', parentId: '', imageUrl: '', sortOrder: 0, isActive: true }

function buildTree(categories) {
  const map = new Map(categories.map((item) => [item.id, { ...item, children: [] }]))
  const roots = []
  map.forEach((item) => {
    if (item.parentId && map.has(item.parentId)) map.get(item.parentId).children.push(item)
    else roots.push(item)
  })
  const sort = (items) => items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((item) => ({ ...item, children: sort(item.children) }))
  return sort(roots)
}

export function CategoryTreePage() {
  const [form, setForm] = useState(emptyCategory)
  const [editingId, setEditingId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const query = useQuery({ queryKey: ['/categories'], queryFn: () => api.get('/categories').then((r) => pickRows(r.data)) })
  const categories = useMemo(() => query.data || [], [query.data])
  const tree = useMemo(() => buildTree(categories), [categories])

  function edit(category) {
    setEditingId(category.id)
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      parentId: category.parentId || '',
      imageUrl: category.imageUrl || '',
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive ?? true,
    })
  }

  async function save(event) {
    event.preventDefault()
    const payload = { ...form, parentId: form.parentId || null, sortOrder: Number(form.sortOrder), isActive: Boolean(form.isActive) }
    try {
      if (editingId) await api.put(`/categories/${editingId}`, payload)
      else await api.post('/categories', payload)
      toast.success(editingId ? 'Category updated' : 'Category created')
      setEditingId(null)
      setForm(emptyCategory)
      query.refetch()
    } catch {
      toast.error('Category save failed')
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Category deleted')
      query.refetch()
    } catch {
      toast.error('Category delete failed')
    }
  }

  function requestDelete(category) {
    setConfirmAction({
      title: `Delete ${category.name}?`,
      message: 'Products assigned to this category may need a new category before publishing.',
      confirmLabel: 'Delete',
      onConfirm: () => remove(category.id),
    })
  }

  return (
    <section>
      <PageTitle title="Categories" action={`${categories.length} categories`} />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel title="Category Tree">
          {query.isLoading ? <div className="h-40 animate-pulse rounded-md bg-slate-100 dark:bg-zinc-800" /> : tree.length === 0 ? <div className="py-10 text-center text-slate-500">No categories found</div> : <div className="space-y-2">{tree.map((category) => <CategoryNode key={category.id} category={category} onEdit={edit} onDelete={requestDelete} />)}</div>}
        </Panel>
        <Panel title={editingId ? 'Edit Category' : 'Create Category'}>
          <form onSubmit={save} className="grid gap-3">
            <FormInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <FormInput label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
            <label className="text-sm font-medium">
              <span>Parent</span>
              <select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
                <option value="">Root category</option>
                {categories.filter((category) => category.id !== editingId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <FormInput label="Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
            <FormInput label="Sort Order" type="number" value={form.sortOrder} onChange={(value) => setForm({ ...form, sortOrder: value })} />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              Active
            </label>
            <div className="flex gap-2">
              <button className="rounded-md bg-brand px-4 py-2 text-white">Save</button>
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyCategory) }} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Reset</button>
            </div>
          </form>
        </Panel>
      </div>
      <ConfirmDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
    </section>
  )
}

function CategoryNode({ category, onEdit, onDelete, depth = 0 }) {
  return (
    <div>
      <div className="flex items-center justify-between rounded-md border border-line bg-slate-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950" style={{ marginLeft: depth * 18 }}>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{category.name}</div>
          <div className="truncate text-xs text-slate-500">{category.slug} · order {category.sortOrder ?? 0} · {category.isActive ? 'Active' : 'Hidden'}</div>
        </div>
        <div className="flex shrink-0 gap-2 text-sm">
          <button onClick={() => onEdit(category)} className="text-brand">Edit</button>
          <button onClick={() => onDelete(category)} className="text-berry">Delete</button>
        </div>
      </div>
      {category.children.map((child) => <CategoryNode key={child.id} category={child} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />)}
    </div>
  )
}
