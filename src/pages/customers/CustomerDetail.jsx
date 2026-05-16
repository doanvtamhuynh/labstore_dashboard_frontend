import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '../../components/DataTable'
import { FormInput } from '../../components/Fields'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'

export function CustomerDetail() {
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
