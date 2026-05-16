import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import * as signalR from '@microsoft/signalr'
import {
  Bell, Boxes, ChartNoAxesCombined, ChevronLeft, ClipboardList, CreditCard, FileText,
  LayoutDashboard, LogOut, Megaphone, Menu, Moon, Package, Search, Settings, ShieldCheck,
  Star, Sun, Tags, Truck, Users, MessageSquare, Globe2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, login, tokenStore } from './services/api'

const queryClient = new QueryClient()
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')

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
  '/settings/admins': { title: 'Admins', endpoint: '/settings/admins', columns: ['email', 'fullName', 'role', 'isTwoFactorEnabled'], sample: { email: 'staff@labstore.local', fullName: 'Staff Admin', password: 'Admin@123456', role: 'Staff', isActive: true } },
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
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [liveNotifications, setLiveNotifications] = useState([])
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const navigate = useNavigate()
  const user = tokenStore.getUser()
  const notifications = useQuery({ queryKey: ['header-notifications'], queryFn: () => api.get('/notifications').then((r) => pickRows(r.data)), refetchInterval: 60000 })
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder().withUrl(`${API_ORIGIN}/hubs/notifications`).withAutomaticReconnect().build()
    connection.on('notificationReceived', (message) => {
      setLiveNotifications((items) => [message, ...items].slice(0, 5))
      toast.info(message.title)
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['/notifications'] })
    })
    connection.start().then(() => connection.invoke('JoinAdminChannel')).catch(() => {})
    return () => { connection.stop() }
  }, [])
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }, [collapsed])
  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  const unread = [...liveNotifications, ...(notifications.data || [])].filter((item) => !item.isRead).length
  const filteredNav = nav.filter(([label]) => user?.role === 'SuperAdmin' || !['Admins', 'Audit Log'].includes(label))
  const sidebarLinks = (
    <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-3">
      {filteredNav.map(([label, to, Icon]) => (
        <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-teal-50 text-brand dark:bg-teal-950' : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>
          <Icon size={18} /> {!collapsed && label}
        </NavLink>
      ))}
    </nav>
  )
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex min-h-screen bg-slate-100 text-ink dark:bg-zinc-950 dark:text-zinc-100">
        <aside className={`${collapsed ? 'w-20' : 'w-72'} hidden border-r border-line bg-white transition-all dark:border-zinc-800 dark:bg-zinc-900 lg:block`}>
          <div className="flex h-16 items-center justify-between border-b border-line px-4 dark:border-zinc-800">
            <div className="flex items-center gap-3 font-semibold"><Boxes className="text-brand" /> {!collapsed && 'Labstore'}</div>
            <button onClick={() => setCollapsed(!collapsed)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-zinc-800"><ChevronLeft className={collapsed ? 'rotate-180' : ''} size={18} /></button>
          </div>
          {sidebarLinks}
        </aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <button aria-label="Close navigation" className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-80 max-w-[86vw] border-r border-line bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-16 items-center justify-between border-b border-line px-4 dark:border-zinc-800">
                <div className="flex items-center gap-3 font-semibold"><Boxes className="text-brand" /> Labstore</div>
                <button onClick={() => setMobileOpen(false)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-zinc-800"><ChevronLeft size={18} /></button>
              </div>
              {sidebarLinks}
            </aside>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 lg:hidden"><Menu size={18} /></button><Search size={18} /><span className="text-sm text-slate-500">Search operations</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDark(!dark)} className="rounded-md border border-line p-2 dark:border-zinc-700">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
              <div className="relative">
                <button onClick={() => setNotifyOpen(!notifyOpen)} className="relative rounded-md border border-line p-2 dark:border-zinc-700">
                  <Bell size={18} />
                  {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-[10px] text-white">{unread}</span>}
                </button>
                {notifyOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-md border border-line bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-2 text-sm font-semibold">Notifications</div>
                    {[...liveNotifications, ...(notifications.data || [])].slice(0, 6).map((item, index) => (
                      <div key={item.id || index} className="border-t border-line py-2 text-sm first:border-t-0 dark:border-zinc-800">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-slate-500">{item.message}</div>
                      </div>
                    ))}
                    <NavLink to="/notifications" onClick={() => setNotifyOpen(false)} className="mt-2 block rounded-md bg-slate-100 px-3 py-2 text-center text-sm dark:bg-zinc-800">View all</NavLink>
                  </div>
                )}
              </div>
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
  async function runRowAction(row, action) {
    try {
      if (action === 'refund') {
        const amount = Number(window.prompt('Refund amount', row.amount - (row.refundedAmount || 0)))
        if (!amount) return
        await api.post(`/payments/${row.id}/refund`, { amount, reason: 'Dashboard refund' })
      }
      if (action === 'approve-review') await api.patch(`/reviews/${row.id}/status`, { status: 'Approved' })
      if (action === 'hide-review') await api.patch(`/reviews/${row.id}/status`, { status: 'Hidden' })
      if (action === 'reply-review') {
        const reply = window.prompt('Reply')
        if (!reply) return
        await api.post(`/reviews/${row.id}/reply`, { reply })
      }
      if (action === 'read-notification') await api.patch(`/notifications/${row.id}/read`)
      toast.success('Action completed')
      query.refetch()
    } catch {
      toast.error('Action failed')
    }
  }
  const rowActions = {
    '/payments': [{ label: 'Refund', action: 'refund' }],
    '/reviews': [{ label: 'Approve', action: 'approve-review' }, { label: 'Hide', action: 'hide-review' }, { label: 'Reply', action: 'reply-review' }],
    '/notifications': [{ label: 'Read', action: 'read-notification' }],
  }[config.endpoint] || []
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
          <DataTable rows={visibleRows} columns={config.columns} loading={query.isLoading} selectedIds={selectedIds} onToggleRow={canDelete ? toggleRow : null} onToggleAll={canDelete ? toggleVisibleRows : null} rowActions={rowActions.map((item) => ({ ...item, run: runRowAction }))} onView={config.endpoint === '/orders' || config.endpoint === '/customers' ? (row) => navigate(`${config.endpoint}/${row.id}`) : null} onEdit={canProductManage ? (row) => navigate(`/products/${row.id}/edit`) : canMutate ? (row) => { setSelected(row); setEditor(JSON.stringify(row, null, 2)) } : null} onDelete={canDelete ? (row) => requestDelete([row.id]) : null} />
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

function DataTable({ rows, columns, loading, selectedIds = [], onToggleRow, onToggleAll, rowActions = [], onView, onEdit, onDelete }) {
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

function ConfirmDialog({ action, onClose }) {
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

function LiveChat() {
  const [ticketId, setTicketId] = useState('')
  const [sender, setSender] = useState(tokenStore.getUser()?.email || 'admin')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [connection, setConnection] = useState(null)
  useEffect(() => {
    const next = new signalR.HubConnectionBuilder().withUrl(`${API_ORIGIN}/hubs/chat`).withAutomaticReconnect().build()
    next.on('ticketMessageReceived', (payload) => setMessages((items) => [payload, ...items].slice(0, 30)))
    next.start().then(() => setConnection(next)).catch(() => {})
    return () => { next.stop() }
  }, [])
  async function join() {
    if (!ticketId || !connection) return
    await connection.invoke('JoinTicket', ticketId)
    toast.success('Joined ticket chat')
  }
  async function send() {
    if (!ticketId || !message || !connection) return
    await connection.invoke('SendTicketMessage', ticketId, sender, message)
    setMessage('')
  }
  return (
    <section>
      <PageTitle title="Live Chat" action={connection ? 'Connected' : 'Connecting'} />
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Panel title="Ticket Channel">
          <FormInput label="Ticket ID" value={ticketId} onChange={setTicketId} />
          <FormInput label="Sender" value={sender} onChange={setSender} />
          <button onClick={join} className="mt-3 w-full rounded-md bg-brand px-4 py-2 text-white">Join Ticket</button>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" className="mt-3 h-28 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
          <button onClick={send} className="mt-3 w-full rounded-md border border-line px-4 py-2 dark:border-zinc-700">Send</button>
        </Panel>
        <Panel title="Messages">
          {messages.length === 0 ? <div className="py-10 text-center text-slate-500">No live messages yet</div> : messages.map((item, index) => (
            <div key={index} className="border-b border-line py-3 last:border-0 dark:border-zinc-800">
              <div className="text-sm font-medium">{item.sender}</div>
              <div className="text-sm text-slate-600 dark:text-zinc-300">{item.message}</div>
            </div>
          ))}
        </Panel>
      </div>
    </section>
  )
}

function Reports() {
  const revenue = useQuery({ queryKey: ['reports-revenue'], queryFn: () => api.get('/reports/revenue').then((r) => r.data.data) })
  const products = useQuery({ queryKey: ['reports-products'], queryFn: () => api.get('/reports/products').then((r) => r.data.data) })
  const inventory = useQuery({ queryKey: ['reports-inventory'], queryFn: () => api.get('/reports/inventory').then((r) => r.data.data) })
  const customers = useQuery({ queryKey: ['reports-customers'], queryFn: () => api.get('/reports/customers').then((r) => r.data.data) })
  const affiliate = useQuery({ queryKey: ['reports-affiliate'], queryFn: () => api.get('/reports/affiliate').then((r) => r.data.data) })
  return (
    <section>
      <PageTitle title="Reports" action="Export CSV" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Revenue"><DataTable rows={[revenue.data || {}]} columns={['revenue', 'orders', 'fromDate', 'toDate']} loading={revenue.isLoading} /></Panel>
        <Panel title="Inventory"><DataTable rows={[inventory.data || {}]} columns={['lowStock', 'outOfStock']} loading={inventory.isLoading} /></Panel>
        <Panel title="Customers"><DataTable rows={[customers.data || {}]} columns={['customers', 'orders', 'averageOrdersPerCustomer']} loading={customers.isLoading} /></Panel>
        <Panel title="Affiliate"><DataTable rows={[affiliate.data || {}]} columns={['partners', 'estimatedCommission']} loading={affiliate.isLoading} /></Panel>
      </div>
      <Panel title="Best Sellers" className="mt-4"><DataTable rows={products.data || []} columns={['name', 'quantitySold', 'revenue']} loading={products.isLoading} /></Panel>
    </section>
  )
}

function SettingsPage() {
  const store = useQuery({ queryKey: ['settings-store'], queryFn: () => api.get('/settings/store').then((r) => r.data.data) })
  const general = useQuery({ queryKey: ['settings-general'], queryFn: () => api.get('/settings/general').then((r) => r.data.data) })
  const [storeForm, setStoreForm] = useState({ storeName: '', logoUrl: '', address: '', timeZone: 'Asia/Saigon' })
  const [generalForm, setGeneralForm] = useState({ taxRate: 0, currency: 'VND', language: 'vi' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [twoFa, setTwoFa] = useState(null)
  const activeStore = store.data || storeForm
  const activeGeneral = general.data || generalForm
  async function saveStore() {
    try {
      await api.put('/settings/store', { ...activeStore, ...storeForm })
      toast.success('Store settings saved')
      store.refetch()
    } catch {
      toast.error('Store settings failed')
    }
  }
  async function saveGeneral() {
    try {
      await api.put('/settings/general', { ...activeGeneral, ...generalForm, taxRate: Number(generalForm.taxRate || activeGeneral.taxRate || 0) })
      toast.success('General settings saved')
      general.refetch()
    } catch {
      toast.error('General settings failed')
    }
  }
  async function backup() {
    try {
      await api.post('/settings/backup')
      toast.success('Backup queued')
    } catch {
      toast.error('Backup failed')
    }
  }
  async function changePassword() {
    try {
      await api.post('/auth/change-password', passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '' })
      toast.success('Password changed')
    } catch {
      toast.error('Password change failed')
    }
  }
  async function enable2fa() {
    try {
      const response = await api.post('/auth/enable-2fa')
      setTwoFa(response.data.data)
      toast.success('2FA enabled')
    } catch {
      toast.error('2FA enable failed')
    }
  }
  return (
    <section>
      <PageTitle title="Settings" action="System" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Store">
          <FormInput label="Store Name" value={storeForm.storeName || activeStore.storeName} onChange={(value) => setStoreForm({ ...storeForm, storeName: value })} />
          <FormInput label="Logo URL" value={storeForm.logoUrl || activeStore.logoUrl || ''} onChange={(value) => setStoreForm({ ...storeForm, logoUrl: value })} />
          <FormInput label="Address" value={storeForm.address || activeStore.address} onChange={(value) => setStoreForm({ ...storeForm, address: value })} />
          <FormInput label="Time Zone" value={storeForm.timeZone || activeStore.timeZone} onChange={(value) => setStoreForm({ ...storeForm, timeZone: value })} />
          <button onClick={saveStore} className="mt-4 rounded-md bg-brand px-4 py-2 text-white">Save Store</button>
        </Panel>
        <Panel title="General">
          <FormInput label="Tax Rate" type="number" value={generalForm.taxRate || activeGeneral.taxRate} onChange={(value) => setGeneralForm({ ...generalForm, taxRate: value })} />
          <FormInput label="Currency" value={generalForm.currency || activeGeneral.currency} onChange={(value) => setGeneralForm({ ...generalForm, currency: value })} />
          <FormInput label="Language" value={generalForm.language || activeGeneral.language} onChange={(value) => setGeneralForm({ ...generalForm, language: value })} />
          <div className="mt-4 flex gap-2">
            <button onClick={saveGeneral} className="rounded-md bg-brand px-4 py-2 text-white">Save General</button>
            <button onClick={backup} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Backup</button>
          </div>
        </Panel>
        <Panel title="Security">
          <FormInput label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })} />
          <FormInput label="New Password" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })} />
          <div className="mt-4 flex gap-2">
            <button onClick={changePassword} className="rounded-md bg-brand px-4 py-2 text-white">Change Password</button>
            <button onClick={enable2fa} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Enable 2FA</button>
          </div>
          {twoFa && <div className="mt-3 rounded-md bg-slate-100 p-3 font-mono text-xs dark:bg-zinc-800">{twoFa.manualEntryKey}</div>}
        </Panel>
      </div>
    </section>
  )
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
