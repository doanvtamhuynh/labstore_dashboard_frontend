import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'

export function OrderDetail() {
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
