import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FormInput } from '../../components/Fields'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { API_ORIGIN } from '../../utils/data'

const emptyProductForm = {
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  sku: '',
  price: 0,
  salePrice: null,
  stock: 0,
  status: 'Visible',
  variants: [],
  images: [],
  seo: { title: '', description: '', slug: '' },
}

function toProductForm(product) {
  if (!product) return emptyProductForm
  return {
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    categoryId: product.categoryId || '',
    sku: product.sku || '',
    price: product.price || 0,
    salePrice: product.salePrice,
    stock: product.stock || 0,
    status: product.status || 'Visible',
    variants: product.variants || [],
    images: product.images?.map((image) => ({ url: image.url, alt: image.alt, sortOrder: image.sortOrder })) || [],
    seo: product.seo || { title: '', description: '', slug: '' },
  }
}

export function ProductForm() {
  const { id } = useParams()
  const product = useQuery({ queryKey: ['product', id], enabled: Boolean(id), queryFn: () => api.get(`/products/${id}`).then((r) => r.data.data) })
  if (id && product.isLoading) return <Panel title="Product Form"><div className="h-40 animate-pulse rounded-md bg-slate-100 dark:bg-zinc-800" /></Panel>
  return <ProductFormEditor id={id} initialForm={toProductForm(product.data)} />
}

function ProductFormEditor({ id, initialForm }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const productRefresh = useQuery({ queryKey: ['product-refresh', id], enabled: false, queryFn: () => api.get(`/products/${id}`).then((r) => r.data.data) })

  async function submit(event) {
    event.preventDefault()
    const payload = { ...form, categoryId: form.categoryId || null, salePrice: form.salePrice === '' ? null : form.salePrice }
    try {
      if (id) await api.put(`/products/${id}`, payload)
      else await api.post('/products', payload)
      toast.success(id ? 'Product updated' : 'Product created')
      navigate('/products')
    } catch {
      toast.error('Product save failed')
    }
  }

  return (
    <section>
      <PageTitle title={id ? 'Edit Product' : 'Create Product'} action="Products" />
      <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel title="Product Information">
          <div className="grid gap-3 md:grid-cols-2">
            <FormInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <FormInput label="SKU" value={form.sku} onChange={(value) => setForm({ ...form, sku: value })} />
            <FormInput label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
            <FormInput label="Category ID" value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })} />
            <FormInput label="Price" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: Number(value) })} />
            <FormInput label="Stock" type="number" value={form.stock} onChange={(value) => setForm({ ...form, stock: Number(value) })} />
            <label className="text-sm font-medium">
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
                {['Visible', 'Hidden', 'OutOfStock'].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm font-medium">
            <span>Description</span>
            <RichTextBox value={form.description} onChange={(description) => setForm({ ...form, description })} />
          </label>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ProductVariants variants={form.variants} onChange={(variants) => setForm({ ...form, variants })} />
            <ProductImages productId={id} images={form.images} onChange={(images) => setForm({ ...form, images })} onUploaded={async () => {
              const refreshed = await productRefresh.refetch()
              if (refreshed.data) setForm(toProductForm(refreshed.data))
            }} />
          </div>
        </Panel>
        <Panel title="SEO">
          <FormInput label="SEO Title" value={form.seo.title || ''} onChange={(value) => setForm({ ...form, seo: { ...form.seo, title: value } })} />
          <FormInput label="SEO Slug" value={form.seo.slug || ''} onChange={(value) => setForm({ ...form, seo: { ...form.seo, slug: value } })} />
          <label className="mt-3 block text-sm font-medium">
            <span>SEO Description</span>
            <textarea value={form.seo.description || ''} onChange={(event) => setForm({ ...form, seo: { ...form.seo, description: event.target.value } })} className="mt-1 h-24 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
          </label>
          <button className="mt-4 w-full rounded-md bg-brand px-4 py-2 font-medium text-white">Save Product</button>
        </Panel>
      </form>
    </section>
  )
}

function RichTextBox({ value, onChange }) {
  function insert(tag) {
    onChange(`${value || ''}<${tag}></${tag}>`)
  }

  return (
    <div className="mt-1 rounded-md border border-line bg-white dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex flex-wrap gap-1 border-b border-line p-2 dark:border-zinc-800">
        {['p', 'h2', 'strong', 'em', 'ul'].map((tag) => <button key={tag} type="button" onClick={() => insert(tag)} className="rounded border border-line px-2 py-1 text-xs dark:border-zinc-700">{tag}</button>)}
      </div>
      <textarea value={value || ''} onChange={(event) => onChange(event.target.value)} className="h-32 w-full bg-transparent px-3 py-2 outline-none" />
      <div className="border-t border-line p-3 text-sm text-slate-600 dark:border-zinc-800 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: value || '<p>Preview</p>' }} />
    </div>
  )
}

function ProductVariants({ variants, onChange }) {
  function update(index, key, value) {
    onChange(variants.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === 'price' || key === 'stock' ? Number(value) : value } : item))
  }

  return (
    <div className="rounded-md border border-line p-3 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Variants</h3>
        <button type="button" onClick={() => onChange([...variants, { name: '', sku: '', price: 0, stock: 0, attributes: {} }])} className="text-sm text-brand">Add</button>
      </div>
      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div key={variant.id || index} className="grid gap-2 rounded-md bg-slate-50 p-3 dark:bg-zinc-950">
            <input value={variant.name || ''} onChange={(event) => update(index, 'name', event.target.value)} placeholder="Variant name" className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <input value={variant.sku || ''} onChange={(event) => update(index, 'sku', event.target.value)} placeholder="Variant SKU" className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={variant.price || 0} onChange={(event) => update(index, 'price', event.target.value)} placeholder="Price" className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
              <input type="number" value={variant.stock || 0} onChange={(event) => update(index, 'stock', event.target.value)} placeholder="Stock" className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            </div>
            <button type="button" onClick={() => onChange(variants.filter((_, itemIndex) => itemIndex !== index))} className="text-left text-sm text-berry">Remove</button>
          </div>
        ))}
        {variants.length === 0 && <div className="text-sm text-slate-500">No variants</div>}
      </div>
    </div>
  )
}

function ProductImages({ productId, images, onChange, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  function update(index, key, value) {
    onChange(images.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === 'sortOrder' ? Number(value) : value } : item))
  }
  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file || !productId) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('alt', file.name)
    formData.append('sortOrder', String(images.length))
    setUploading(true)
    try {
      await api.post(`/products/${productId}/images`, formData)
      toast.success('Image uploaded')
      await onUploaded?.()
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="rounded-md border border-line p-3 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Images</h3>
        <div className="flex gap-2">
          {productId && <label className="cursor-pointer text-sm text-brand">{uploading ? 'Uploading...' : 'Upload'}<input type="file" accept="image/*" onChange={upload} className="hidden" /></label>}
          <button type="button" onClick={() => onChange([...images, { url: '', alt: '', sortOrder: images.length }])} className="text-sm text-brand">Add URL</button>
        </div>
      </div>
      {productId && <label className="mb-3 flex min-h-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-line bg-slate-50 p-3 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-950">Choose an image file<input type="file" accept="image/*" onChange={upload} className="hidden" /></label>}
      <div className="space-y-3">
        {images.map((image, index) => (
          <div key={index} className="grid gap-2 rounded-md bg-slate-50 p-3 dark:bg-zinc-950">
            {image.url && <img src={image.url.startsWith('/uploads') ? `${API_ORIGIN}${image.url}` : image.url} alt={image.alt || ''} className="h-28 w-full rounded-md object-cover" />}
            <input value={image.url || ''} onChange={(event) => update(index, 'url', event.target.value)} placeholder="Image URL" className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <input value={image.alt || ''} onChange={(event) => update(index, 'alt', event.target.value)} placeholder="Alt text" className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <button type="button" onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))} className="text-left text-sm text-berry">Remove</button>
          </div>
        ))}
        {images.length === 0 && <div className="text-sm text-slate-500">No images</div>}
      </div>
    </div>
  )
}
