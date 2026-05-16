import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'
import { pickRows } from '../../utils/data'

export function CustomersPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [segment, setSegment] = useState('')
  const [search, setSearch] = useState('')
  const customers = useQuery({ queryKey: ['/customers'], queryFn: () => api.get('/customers').then((r) => pickRows(r.data)) })
  const rows = useMemo(() => (customers.data || []).filter((row) => (!status || row.status === status) && (!segment || row.segment === segment) && JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [customers.data, status, segment, search])
  const segments = useMemo(() => [...new Set((customers.data || []).map((row) => row.segment).filter(Boolean))], [customers.data])

  async function setCustomerStatus(row, nextStatus) {
    try {
      await api.patch(`/customers/${row.id}/status`, { status: nextStatus })
      toast.success('Customer status updated')
      customers.refetch()
    } catch {
      toast.error('Customer update failed')
    }
  }

  return (
    <section>
      <PageTitle title="Customers" action="CRM" />
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" className="min-w-72 rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">All statuses</option>{['Active', 'Locked'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={segment} onChange={(event) => setSegment(event.target.value)} className="rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">All segments</option>{segments.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <Panel title={`${rows.length} customers`}>
        <DataTable rows={rows} columns={['fullName', 'email', 'status', 'segment', 'loyaltyPoints']} loading={customers.isLoading} onView={(row) => navigate(`/customers/${row.id}`)} rowActions={[
          { label: 'Lock', action: 'lock', run: (row) => setCustomerStatus(row, 'Locked') },
          { label: 'Unlock', action: 'unlock', run: (row) => setCustomerStatus(row, 'Active') },
        ]} />
      </Panel>
    </section>
  )
}
