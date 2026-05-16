import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import {
  Bell, Boxes, ChartNoAxesCombined, ChevronLeft, ClipboardList, CreditCard, FileText,
  LayoutDashboard, LogOut, Megaphone, Menu, Moon, Package, Search, Settings, ShieldCheck,
  Star, Sun, Tags, Truck, Users, MessageSquare, Globe2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, login, tokenStore } from './services/api'

const queryClient = new QueryClient()

const nav = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Products', '/products', Package],
  ['Categories', '/categories', Tags],
  ['Orders', '/orders', ClipboardList],
  ['Customers', '/customers', Users],
  ['Coupons', '/promotions/coupons', Megaphone],
  ['Flash Sales', '/promotions/flash-sales', Megaphone],
  ['Banners', '/promotions/banners', Megaphone],
  ['Affiliate', '/promotions/affiliate', Megaphone],
  ['Payments', '/payments', CreditCard],
  ['Shipping', '/shipping', Truck],
  ['Returns', '/shipping/returns', Truck],
  ['Reviews', '/reviews', Star],
  ['Tickets', '/support/tickets', MessageSquare],
  ['Live Chat', '/support/live-chat', MessageSquare],
  ['FAQ', '/support/faq', MessageSquare],
  ['Notifications', '/notifications', Bell],
  ['Reports', '/reports', ChartNoAxesCombined],
  ['SEO', '/seo', Globe2],
  ['Blog', '/blog', FileText],
  ['Settings', '/settings', Settings],
  ['Admins', '/settings/admins', ShieldCheck],
  ['Audit Log', '/settings/audit-log', ShieldCheck],
]

const resourceMap = {
  '/products': { title: 'Products', endpoint: '/products', create: '/products/create', columns: ['name', 'sku', 'price', 'stock', 'status'] },
  '/categories': { title: 'Categories', endpoint: '/categories', columns: ['name', 'slug', 'isActive', 'sortOrder'], sample: { name: 'New category', slug: 'new-category', parentId: null, imageUrl: '', sortOrder: 0, isActive: true } },
  '/orders': { title: 'Orders', endpoint: '/orders', columns: ['code', 'customerName', 'status', 'paymentStatus', 'totalAmount'] },
  '/customers': { title: 'Customers', endpoint: '/customers', columns: ['fullName', 'email', 'status', 'segment', 'loyaltyPoints'] },
  '/promotions/coupons': { title: 'Coupons', endpoint: '/promotions/coupons', columns: ['code', 'discountType', 'discountValue', 'usageLimit', 'status'], sample: { code: 'SALE10', discountType: 'Percentage', discountValue: 10, usageLimit: 100, status: 'Active', startsAtUtc: null, endsAtUtc: null } },
  '/promotions/flash-sales': { title: 'Flash Sales', endpoint: '/promotions/flash-sales', columns: ['name', 'categoryId', 'discountPercent', 'status'], sample: { name: 'Weekend sale', categoryId: null, discountPercent: 15, status: 'Draft', startsAtUtc: new Date().toISOString(), endsAtUtc: new Date(Date.now() + 86400000).toISOString() } },
  '/promotions/banners': { title: 'Banners', endpoint: '/promotions/banners', columns: ['title', 'position', 'status'], sample: { title: 'Homepage banner', imageUrl: 'https://example.com/banner.jpg', linkUrl: '/', position: 'homepage', status: 'Draft', startsAtUtc: null, endsAtUtc: null } },
  '/promotions/affiliate': { title: 'Affiliate', endpoint: '/promotions/affiliate', columns: ['partnerName', 'trackingCode', 'commissionPercent', 'status'], sample: { partnerName: 'Partner', trackingCode: 'PARTNER01', commissionPercent: 5, status: 'Active' } },
  '/payments': { title: 'Payments', endpoint: '/payments', columns: ['transactionCode', 'method', 'status', 'amount', 'refundedAmount'] },
  '/shipping': { title: 'Shipping Configs', endpoint: '/shipping/configs', columns: ['region', 'minWeightKg', 'maxWeightKg', 'fee', 'isActive'], sample: { region: 'Ho Chi Minh', minWeightKg: 0, maxWeightKg: 5, fee: 30000, isActive: true } },
  '/shipping/returns': { title: 'Returns', endpoint: '/shipping/returns', columns: ['orderId', 'customerId', 'reason', 'status'], sample: { orderId: '', customerId: '', reason: 'Customer request', status: 'Requested', resolutionNote: '' } },
  '/reviews': { title: 'Reviews', endpoint: '/reviews', columns: ['productId', 'customerName', 'rating', 'status', 'isFlagged'] },
  '/support/tickets': { title: 'Tickets', endpoint: '/support/tickets', columns: ['subject', 'customerEmail', 'status', 'priority', 'assignedTo'], sample: { subject: 'Need help', customerId: '', customerEmail: 'customer@example.com', priority: 'Medium', message: 'Describe the issue' } },
  '/support/faq': { title: 'FAQ', endpoint: '/support/faq', columns: ['question', 'category', 'isPublished', 'sortOrder'], sample: { question: 'Question', answer: 'Answer', category: 'General', isPublished: true, sortOrder: 0 } },
  '/notifications': { title: 'Notifications', endpoint: '/notifications', columns: ['title', 'audience', 'recipientId', 'isRead'], createEndpoint: '/notifications/push', sample: { title: 'Notice', message: 'Message', audience: 'Admin', recipientId: null } },
  '/seo': { title: 'SEO Meta', endpoint: '/seo/meta', columns: ['entityType', 'entityId', 'metaTitle', 'slug'], sample: { entityType: 'page', entityId: 'home', metaTitle: 'Home', metaDescription: 'Homepage', slug: 'home' } },
  '/blog': { title: 'Blog Posts', endpoint: '/blog/posts', columns: ['title', 'slug', 'status'], sample: { title: 'New post', slug: 'new-post', content: '<p>Content</p>', status: 'Draft' } },
  '/settings/admins': { title: 'Admins', endpoint: '/settings/admins', columns: ['email', 'fullName', 'role', 'isTwoFactorEnabled'] },
  '/settings/audit-log': { title: 'Audit Log', endpoint: '/settings/audit-log', columns: ['adminUserId', 'action', 'ipAddress', 'createdAtUtc'] },
}

function pickRows(payload) {
  const data = payload?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}

function RequireAuth({ children }) {
  const location = useLocation()
  if (!tokenStore.accessToken) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@labstore.local', password: 'Admin@123456', twoFactorCode: '' })
  const [loading, setLoading] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      await login({ ...form, twoFactorCode: form.twoFactorCode || null })
      toast.success('Login successful')
      navigate('/dashboard')
    } catch {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="min-h-screen bg-slate-100 text-ink dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.1fr_.9fr]">
        <section className="flex flex-col justify-center px-8 py-12">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-md bg-brand text-white"><Boxes /></div>
          <h1 className="text-4xl font-semibold">Labstore Dashboard</h1>
          <p className="mt-3 max-w-xl text-slate-600 dark:text-zinc-400">Admin operations for catalog, orders, customers, marketing, support, reports, and settings.</p>
        </section>
        <section className="flex items-center px-8 py-12">
          <form onSubmit={submit} className="w-full rounded-md border border-line bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Sign in</h2>
            <Field label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
            <Field label="2FA Code" value={form.twoFactorCode} onChange={(twoFactorCode) => setForm({ ...form, twoFactorCode })} />
            <button disabled={loading} className="mt-5 w-full rounded-md bg-brand px-4 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60">{loading ? 'Signing in...' : 'Login'}</button>
          </form>
        </section>
      </div>
    </main>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="mt-4 block text-sm font-medium">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-950" />
    </label>
  )
}

function Shell() {
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const navigate = useNavigate()
  const user = tokenStore.getUser()
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex min-h-screen bg-slate-100 text-ink dark:bg-zinc-950 dark:text-zinc-100">
        <aside className={`${collapsed ? 'w-20' : 'w-72'} hidden border-r border-line bg-white transition-all dark:border-zinc-800 dark:bg-zinc-900 lg:block`}>
          <div className="flex h-16 items-center justify-between border-b border-line px-4 dark:border-zinc-800">
            <div className="flex items-center gap-3 font-semibold"><Boxes className="text-brand" /> {!collapsed && 'Labstore'}</div>
            <button onClick={() => setCollapsed(!collapsed)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-zinc-800"><ChevronLeft className={collapsed ? 'rotate-180' : ''} size={18} /></button>
          </div>
          <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-3">
            {nav.map(([label, to, Icon]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-teal-50 text-brand dark:bg-teal-950' : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>
                <Icon size={18} /> {!collapsed && label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3"><Menu className="lg:hidden" /><Search size={18} /><span className="text-sm text-slate-500">Search operations</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDark(!dark)} className="rounded-md border border-line p-2 dark:border-zinc-700">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
              <span className="hidden text-sm sm:inline">{user?.fullName || user?.email}</span>
              <button onClick={() => { tokenStore.clear(); navigate('/login') }} className="rounded-md border border-line p-2 text-berry dark:border-zinc-700"><LogOut size={18} /></button>
            </div>
          </header>
          <main className="p-4 lg:p-6"><RoutesContent /></main>
        </div>
      </div>
    </div>
  )
}

function RoutesContent() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products/create" element={<ProductForm />} />
      <Route path="/products/:id/edit" element={<ProductForm />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/customers/:id" element={<CustomerDetail />} />
      <Route path="/support/live-chat" element={<LiveChat />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<SettingsPage />} />
      {Object.keys(resourceMap).map((path) => <Route key={path} path={path} element={<ResourcePage config={resourceMap[path]} />} />)}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function Dashboard() {
  const summary = useQuery({ queryKey: ['summary'], queryFn: () => api.get('/dashboard/summary').then((r) => r.data.data) })
  const chart = useQuery({ queryKey: ['revenue-chart'], queryFn: () => api.get('/dashboard/revenue-chart?period=month').then((r) => r.data.data) })
  const top = useQuery({ queryKey: ['top-products'], queryFn: () => api.get('/dashboard/top-products').then((r) => r.data.data) })
  const stats = [
    ['Revenue', summary.data?.revenue ?? 0, 'bg-teal-50 text-brand'],
    ['Orders', summary.data?.orders ?? 0, 'bg-rose-50 text-berry'],
    ['New Customers', summary.data?.newCustomers ?? 0, 'bg-amber-50 text-amber'],
    ['Low Stock', summary.data?.lowStockProducts ?? 0, 'bg-slate-100 text-slate-700'],
  ]
  return (
    <section>
      <PageTitle title="Dashboard" action="Today" />
      <div className="grid gap-4 md:grid-cols-4">{stats.map(([label, value, tone]) => <div key={label} className="rounded-md border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div className={`mb-3 inline-flex rounded-md px-2 py-1 text-xs ${tone}`}>{label}</div><div className="text-2xl font-semibold">{Number(value).toLocaleString()}</div></div>)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Revenue"><ResponsiveContainer width="100%" height={300}><BarChart data={chart.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#0f766e" /></BarChart></ResponsiveContainer></Panel>
        <Panel title="Order Mix"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={[{ name: 'Paid', value: 62 }, { name: 'Pending', value: 24 }, { name: 'Refunded', value: 14 }]} dataKey="value">{['#0f766e', '#b45309', '#9f1239'].map((color) => <Cell key={color} fill={color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Panel>
      </div>
      <Panel title="Top Products" className="mt-4"><DataTable rows={top.data || []} columns={['name', 'quantitySold', 'revenue']} /></Panel>
    </section>
  )
}

function ResourcePage({ config }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState(() => JSON.stringify(config.sample || {}, null, 2))
  const [selected, setSelected] = useState(null)
  const query = useQuery({ queryKey: [config.endpoint], queryFn: () => api.get(config.endpoint).then((r) => pickRows(r.data)) })
  const rows = useMemo(() => (query.data || []).filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [query.data, search])
  const canMutate = Boolean(config.sample)
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
  async function remove(row) {
    if (!row?.id) return
    try {
      await api.delete(`${config.endpoint}/${row.id}`)
      toast.success('Deleted')
      query.refetch()
    } catch {
      toast.error('Delete failed')
    }
  }
  return (
    <section>
      <PageTitle title={config.title} action="Export" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="min-w-72 rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
        {config.create && <NavLink to={config.create} className="rounded-md bg-brand px-4 py-2 text-white">Create</NavLink>}
        {canMutate && <button onClick={() => { setSelected(null); setEditor(JSON.stringify(config.sample, null, 2)) }} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">New JSON</button>}
      </div>
      <div className={canMutate ? 'grid gap-4 xl:grid-cols-[1fr_420px]' : ''}>
        <Panel title={`${rows.length} records`}><DataTable rows={rows} columns={config.columns} loading={query.isLoading} onView={config.endpoint === '/orders' || config.endpoint === '/customers' ? (row) => navigate(`${config.endpoint}/${row.id}`) : null} onEdit={canMutate ? (row) => { setSelected(row); setEditor(JSON.stringify(row, null, 2)) } : null} onDelete={canMutate ? remove : null} /></Panel>
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
    </section>
  )
}

function DataTable({ rows, columns, loading, onView, onEdit, onDelete }) {
  if (loading) return <div className="h-32 animate-pulse rounded-md bg-slate-100 dark:bg-zinc-800" />
  if (!rows.length) return <div className="py-10 text-center text-slate-500">No records found</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-line dark:border-zinc-800">{columns.map((col) => <th key={col} className="px-3 py-2 font-medium text-slate-500">{col}</th>)}{(onView || onEdit || onDelete) && <th className="px-3 py-2" />}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.id || index} className="border-b border-line last:border-0 dark:border-zinc-800">{columns.map((col) => <td key={col} className="px-3 py-3">{format(row[col])}</td>)}{(onView || onEdit || onDelete) && <td className="whitespace-nowrap px-3 py-3 text-right">{onView && <button onClick={() => onView(row)} className="mr-2 text-slate-600 dark:text-zinc-300">View</button>}{onEdit && <button onClick={() => onEdit(row)} className="mr-2 text-brand">Edit</button>}{onDelete && <button onClick={() => onDelete(row)} className="text-berry">Delete</button>}</td>}</tr>)}</tbody>
      </table>
    </div>
  )
}

function format(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

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

function ProductForm() {
  const { id } = useParams()
  const product = useQuery({ queryKey: ['product', id], enabled: Boolean(id), queryFn: () => api.get(`/products/${id}`).then((r) => r.data.data) })
  if (id && product.isLoading) return <Panel title="Product Form"><div className="h-40 animate-pulse rounded-md bg-slate-100 dark:bg-zinc-800" /></Panel>
  return <ProductFormEditor id={id} initialForm={toProductForm(product.data)} />
}

function ProductFormEditor({ id, initialForm }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
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
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 h-32 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
          </label>
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

function FormInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-sm font-medium">
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
    </label>
  )
}

function OrderDetail() {
  const { id } = useParams()
  const order = useQuery({ queryKey: ['order', id], queryFn: () => api.get(`/orders/${id}`).then((r) => r.data.data) })
  const [status, setStatus] = useState('Processing')
  async function updateStatus() {
    try {
      await api.patch(`/orders/${id}/status`, { status, note: 'Updated from dashboard' })
      toast.success('Order status updated')
      order.refetch()
    } catch {
      toast.error('Status update failed')
    }
  }
  return (
    <section>
      <PageTitle title="Order Detail" action={order.data?.code || id} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel title="Items"><DataTable rows={order.data?.items || []} columns={['productName', 'sku', 'quantity', 'price', 'lineTotal']} loading={order.isLoading} /></Panel>
        <Panel title="Status">
          <div className="text-sm text-slate-500">Current: {order.data?.status || '-'}</div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-3 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">{['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map((item) => <option key={item}>{item}</option>)}</select>
          <button onClick={updateStatus} className="mt-3 w-full rounded-md bg-brand px-4 py-2 text-white">Update Status</button>
          <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/orders/${id}/invoice`} className="mt-2 block rounded-md border border-line px-4 py-2 text-center dark:border-zinc-700">Invoice PDF</a>
        </Panel>
      </div>
      <Panel title="History" className="mt-4"><DataTable rows={order.data?.history || []} columns={['fromStatus', 'toStatus', 'note', 'changedBy', 'changedAtUtc']} /></Panel>
    </section>
  )
}

function CustomerDetail() {
  const { id } = useParams()
  const detail = useQuery({ queryKey: ['customer', id], queryFn: () => api.get(`/customers/${id}`).then((r) => r.data.data) })
  const [segment, setSegment] = useState('VIP')
  const [points, setPoints] = useState(0)
  const [note, setNote] = useState('')
  async function action(kind) {
    try {
      if (kind === 'segment') await api.put(`/customers/${id}/segment`, { segment })
      if (kind === 'loyalty') await api.put(`/customers/${id}/loyalty`, { points: Number(points) })
      if (kind === 'note') await api.post(`/customers/${id}/notes`, { content: note })
      toast.success('Customer updated')
      detail.refetch()
    } catch {
      toast.error('Customer update failed')
    }
  }
  return (
    <section>
      <PageTitle title={detail.data?.customer?.fullName || 'Customer Detail'} action={detail.data?.customer?.email || id} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel title="Purchase History"><DataTable rows={detail.data?.orders || []} columns={['code', 'status', 'paymentStatus', 'totalAmount', 'createdAtUtc']} loading={detail.isLoading} /></Panel>
        <Panel title="CRM">
          <FormInput label="Segment" value={segment} onChange={setSegment} />
          <button onClick={() => action('segment')} className="mt-2 w-full rounded-md bg-brand px-4 py-2 text-white">Set Segment</button>
          <FormInput label="Loyalty Points" type="number" value={points} onChange={setPoints} />
          <button onClick={() => action('loyalty')} className="mt-2 w-full rounded-md bg-brand px-4 py-2 text-white">Set Loyalty</button>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="CRM note" className="mt-3 h-24 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
          <button onClick={() => action('note')} className="mt-2 w-full rounded-md border border-line px-4 py-2 dark:border-zinc-700">Add Note</button>
        </Panel>
      </div>
      <Panel title="Notes" className="mt-4"><DataTable rows={detail.data?.customer?.notes || []} columns={['content', 'createdBy', 'createdAtUtc']} /></Panel>
    </section>
  )
}

function Detail({ title, description = 'Operational detail view connected to the protected dashboard shell.' }) {
  return <Panel title={title}><p className="text-slate-600 dark:text-zinc-400">{description}</p></Panel>
}

function LiveChat() {
  return <Detail title="Live Chat" description="Realtime ticket chat connects to SignalR hub /hubs/chat." />
}

function Reports() {
  const report = useQuery({ queryKey: ['reports-revenue'], queryFn: () => api.get('/reports/revenue').then((r) => r.data.data) })
  return <Panel title="Reports"><DataTable rows={[report.data || {}]} columns={['revenue', 'orders', 'fromDate', 'toDate']} loading={report.isLoading} /></Panel>
}

function SettingsPage() {
  const store = useQuery({ queryKey: ['settings-store'], queryFn: () => api.get('/settings/store').then((r) => r.data.data) })
  return <Panel title="Store Settings"><DataTable rows={[store.data || {}]} columns={['storeName', 'address', 'timeZone']} loading={store.isLoading} /></Panel>
}

function Panel({ title, children, className = '' }) {
  return <section className={`rounded-md border border-line bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}><h2 className="mb-3 text-base font-semibold">{title}</h2>{children}</section>
}

function PageTitle({ title, action }) {
  return <div className="mb-4 flex items-center justify-between"><div><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-slate-500">Labstore admin operations</p></div><button className="rounded-md border border-line px-3 py-2 text-sm dark:border-zinc-700">{action}</button></div>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
      </Routes>
    </QueryClientProvider>
  )
}

export default App
