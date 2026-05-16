import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DataTable } from '../../components/DataTable'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'

export function Reports() {
  const revenue = useQuery({ queryKey: ['reports-revenue'], queryFn: () => api.get('/reports/revenue').then((r) => r.data.data) })
  const products = useQuery({ queryKey: ['reports-products'], queryFn: () => api.get('/reports/products').then((r) => r.data.data) })
  const inventory = useQuery({ queryKey: ['reports-inventory'], queryFn: () => api.get('/reports/inventory').then((r) => r.data.data) })
  const customers = useQuery({ queryKey: ['reports-customers'], queryFn: () => api.get('/reports/customers').then((r) => r.data.data) })
  const affiliate = useQuery({ queryKey: ['reports-affiliate'], queryFn: () => api.get('/reports/affiliate').then((r) => r.data.data) })

  async function download(reportName, format) {
    try {
      const response = await api.get(`/reports/${reportName}/export?format=${format}`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${reportName}-report.${format === 'pdf' ? 'pdf' : 'csv'}`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <section>
      <PageTitle title="Reports" action="Exports" />
      <div className="grid gap-4 xl:grid-cols-2">
        <ReportPanel title="Revenue" reportName="revenue" onDownload={download}><DataTable rows={[revenue.data || {}]} columns={['revenue', 'orders', 'fromDate', 'toDate']} loading={revenue.isLoading} /></ReportPanel>
        <ReportPanel title="Inventory" reportName="inventory" onDownload={download}><DataTable rows={[inventory.data || {}]} columns={['lowStock', 'outOfStock']} loading={inventory.isLoading} /></ReportPanel>
        <ReportPanel title="Customers" reportName="customers" onDownload={download}><DataTable rows={[customers.data || {}]} columns={['customers', 'orders', 'averageOrdersPerCustomer']} loading={customers.isLoading} /></ReportPanel>
        <ReportPanel title="Affiliate" reportName="affiliate" onDownload={download}><DataTable rows={[affiliate.data || {}]} columns={['partners', 'estimatedCommission']} loading={affiliate.isLoading} /></ReportPanel>
      </div>
      <ReportPanel title="Best Sellers" reportName="products" onDownload={download} className="mt-4"><DataTable rows={products.data || []} columns={['name', 'quantitySold', 'revenue']} loading={products.isLoading} /></ReportPanel>
    </section>
  )
}

function ReportPanel({ title, reportName, onDownload, children, className = '' }) {
  return (
    <Panel title={title} className={className}>
      <div className="mb-3 flex gap-2">
        <button onClick={() => onDownload(reportName, 'csv')} className="rounded-md border border-line px-3 py-1.5 text-sm dark:border-zinc-700">CSV</button>
        <button onClick={() => onDownload(reportName, 'pdf')} className="rounded-md border border-line px-3 py-1.5 text-sm dark:border-zinc-700">PDF</button>
      </div>
      {children}
    </Panel>
  )
}
