import { useQuery } from '@tanstack/react-query'
import { DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'

export function Reports() {
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
