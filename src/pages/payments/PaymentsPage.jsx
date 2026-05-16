import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

export function PaymentsPage() {
  const [refund, setRefund] = useState(null)
  const payments = useQuery({ queryKey: ['/payments'], queryFn: () => api.get('/payments').then((r) => pickRows(r.data)) })
  const reconciliation = useQuery({ queryKey: ['/payments/reconciliation'], queryFn: () => api.get('/payments/reconciliation').then((r) => r.data.data) })

  async function submitRefund(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await api.post(`/payments/${refund.id}/refund`, { amount: Number(form.get('amount')), reason: form.get('reason') })
      toast.success('Refund completed')
      setRefund(null)
      payments.refetch()
      reconciliation.refetch()
    } catch {
      toast.error('Refund failed')
    }
  }

  return (
    <section>
      <PageTitle title="Payments" action="Reconciliation" />
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        {['grossRevenue', 'refundedAmount', 'netRevenue', 'transactionCount'].map((key) => <div key={key} className="rounded-md border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div className="text-xs uppercase text-slate-500">{key}</div><div className="mt-2 text-xl font-semibold">{Number(reconciliation.data?.[key] || 0).toLocaleString()}</div></div>)}
      </div>
      <Panel title="Transactions">
        <DataTable rows={payments.data || []} columns={['transactionCode', 'method', 'status', 'amount', 'refundedAmount']} loading={payments.isLoading} rowActions={[{ label: 'Refund', action: 'refund', run: (row) => setRefund(row) }]} />
      </Panel>
      {refund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={submitRefund} className="w-full max-w-md rounded-md border border-line bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Refund {refund.transactionCode}</h2>
            <label className="mt-4 block text-sm font-medium"><span>Amount</span><input name="amount" type="number" defaultValue={(refund.amount || 0) - (refund.refundedAmount || 0)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" /></label>
            <label className="mt-3 block text-sm font-medium"><span>Reason</span><textarea name="reason" defaultValue="Dashboard refund" className="mt-1 h-24 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" /></label>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setRefund(null)} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Cancel</button><button className="rounded-md bg-berry px-4 py-2 text-white">Refund</button></div>
          </form>
        </div>
      )}
    </section>
  )
}
