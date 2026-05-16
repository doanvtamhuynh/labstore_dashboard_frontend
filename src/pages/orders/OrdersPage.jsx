import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

export function OrdersPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const orders = useQuery({ queryKey: ['/orders'], queryFn: () => api.get('/orders').then((r) => pickRows(r.data)) })
  const rows = useMemo(() => (orders.data || []).filter((row) => (!status || row.status === status) && JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [orders.data, status, search])

  async function updateStatus(row, nextStatus) {
    try {
      await api.patch(`/orders/${row.id}/status`, { status: nextStatus, note: 'Updated from dashboard list' })
      toast.success('Order status updated')
      orders.refetch()
    } catch {
      toast.error('Order update failed')
    }
  }

  async function exportCsv() {
    const response = await api.get('/orders/export', { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'orders.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <PageTitle title="Orders" action="Operations" />
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders" className="min-w-72 rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">All statuses</option>{['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map((item) => <option key={item}>{item}</option>)}</select>
        <button onClick={exportCsv} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Export CSV</button>
      </div>
      <Panel title={`${rows.length} orders`}>
        <DataTable rows={rows} columns={['code', 'customerName', 'status', 'paymentStatus', 'totalAmount']} loading={orders.isLoading} onView={(row) => navigate(`/orders/${row.id}`)} rowActions={[
          { label: 'Processing', action: 'processing', run: (row) => updateStatus(row, 'Processing') },
          { label: 'Shipped', action: 'shipped', run: (row) => updateStatus(row, 'Shipped') },
          { label: 'Delivered', action: 'delivered', run: (row) => updateStatus(row, 'Delivered') },
        ]} />
      </Panel>
    </section>
  )
}
