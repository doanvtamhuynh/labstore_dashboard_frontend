import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'

export function Dashboard() {
  const [period, setPeriod] = useState('month')
  const summary = useQuery({ queryKey: ['summary'], queryFn: () => api.get('/dashboard/summary').then((r) => r.data.data) })
  const chart = useQuery({ queryKey: ['revenue-chart', period], queryFn: () => api.get(`/dashboard/revenue-chart?period=${period}`).then((r) => r.data.data) })
  const top = useQuery({ queryKey: ['top-products'], queryFn: () => api.get('/dashboard/top-products').then((r) => r.data.data) })
  const geo = useQuery({ queryKey: ['geo-orders'], queryFn: () => api.get('/dashboard/geo-orders').then((r) => r.data.data) })
  const kpi = useQuery({ queryKey: ['kpi'], queryFn: () => api.get('/dashboard/kpi').then((r) => r.data.data) })
  const stats = [
    ['Revenue', summary.data?.revenue ?? 0, 'bg-teal-50 text-brand'],
    ['Orders', summary.data?.orders ?? 0, 'bg-rose-50 text-berry'],
    ['New Customers', summary.data?.newCustomers ?? 0, 'bg-amber-50 text-amber'],
    ['Low Stock', summary.data?.lowStockProducts ?? 0, 'bg-slate-100 text-slate-700'],
    ['CVR', `${Number(kpi.data?.conversionRate ?? 0).toLocaleString()}%`, 'bg-sky-50 text-sky-700'],
    ['AOV', kpi.data?.averageOrderValue ?? 0, 'bg-violet-50 text-violet-700'],
  ]

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Dashboard" />
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border border-line bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          {['day', 'week', 'month', 'year'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{stats.map(([label, value, tone]) => <div key={label} className="rounded-md border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div className={`mb-3 inline-flex rounded-md px-2 py-1 text-xs ${tone}`}>{label}</div><div className="text-2xl font-semibold">{typeof value === 'number' ? Number(value).toLocaleString() : value}</div></div>)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Revenue"><ResponsiveContainer width="100%" height={300}><BarChart data={chart.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#0f766e" /></BarChart></ResponsiveContainer></Panel>
        <Panel title="Order Mix"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={[{ name: 'Paid', value: 62 }, { name: 'Pending', value: 24 }, { name: 'Refunded', value: 14 }]} dataKey="value">{['#0f766e', '#b45309', '#9f1239'].map((color) => <Cell key={color} fill={color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Panel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel title="Top Products"><DataTable rows={top.data || []} columns={['name', 'quantitySold', 'revenue']} loading={top.isLoading} /></Panel>
        <Panel title="Geo Orders">
          {(geo.data || []).length === 0 ? <div className="py-10 text-center text-slate-500">No geo data</div> : <div className="space-y-3">{(geo.data || []).slice(0, 8).map((item) => <div key={item.province || item.region} className="rounded-md border border-line p-3 dark:border-zinc-800"><div className="flex items-center justify-between text-sm"><span>{item.province || item.region || 'Unknown'}</span><strong>{item.orders || item.count || 0}</strong></div><div className="mt-2 h-2 rounded bg-slate-100 dark:bg-zinc-800"><div className="h-2 rounded bg-brand" style={{ width: `${Math.min(100, Number(item.orders || item.count || 0) * 10)}%` }} /></div></div>)}</div>}
        </Panel>
      </div>
    </section>
  )
}
