import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

export function ReviewsPage() {
  const [status, setStatus] = useState('')
  const [rating, setRating] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const reviews = useQuery({ queryKey: ['/reviews'], queryFn: () => api.get('/reviews').then((r) => pickRows(r.data)) })
  const flagged = useQuery({ queryKey: ['/reviews/flagged'], queryFn: () => api.get('/reviews/flagged').then((r) => pickRows(r.data)) })
  const rows = useMemo(() => (reviews.data || []).filter((row) => (!status || row.status === status) && (!rating || Number(row.rating) === Number(rating))), [reviews.data, status, rating])

  async function setReviewStatus(row, nextStatus) {
    try {
      await api.patch(`/reviews/${row.id}/status`, { status: nextStatus })
      toast.success('Review updated')
      reviews.refetch()
      flagged.refetch()
    } catch {
      toast.error('Review update failed')
    }
  }

  async function submitReply(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await api.post(`/reviews/${replyTo.id}/reply`, { reply: form.get('reply') })
      toast.success('Reply sent')
      setReplyTo(null)
      reviews.refetch()
    } catch {
      toast.error('Reply failed')
    }
  }

  return (
    <section>
      <PageTitle title="Reviews" action={`${flagged.data?.length || 0} flagged`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">All statuses</option>{['Pending', 'Approved', 'Hidden', 'Deleted'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">All ratings</option>{[1, 2, 3, 4, 5].map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <Panel title="Review Moderation">
        <DataTable rows={rows} columns={['productId', 'customerName', 'rating', 'status', 'isFlagged']} loading={reviews.isLoading} rowActions={[{ label: 'Approve', action: 'approve', run: (row) => setReviewStatus(row, 'Approved') }, { label: 'Hide', action: 'hide', run: (row) => setReviewStatus(row, 'Hidden') }, { label: 'Reply', action: 'reply', run: (row) => setReplyTo(row) }]} />
      </Panel>
      {replyTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={submitReply} className="w-full max-w-md rounded-md border border-line bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Reply to {replyTo.customerName}</h2>
            <textarea name="reply" className="mt-4 h-32 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setReplyTo(null)} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Cancel</button><button className="rounded-md bg-brand px-4 py-2 text-white">Send</button></div>
          </form>
        </div>
      )}
    </section>
  )
}
