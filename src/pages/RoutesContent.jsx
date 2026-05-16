import { Navigate, Route, Routes } from 'react-router-dom'
import { resourceMap } from '../config/navigation'
import { structuredResources } from '../config/structuredResources'
import { CategoryTreePage } from './catalog/CategoryTreePage'
import { ProductForm } from './catalog/ProductForm'
import { BlogPage } from './content/BlogPage'
import { SeoPage } from './content/SeoPage'
import { CustomerDetail } from './customers/CustomerDetail'
import { CustomersPage } from './customers/CustomersPage'
import { Dashboard } from './dashboard/Dashboard'
import { OrderDetail } from './orders/OrderDetail'
import { OrdersPage } from './orders/OrdersPage'
import { PaymentsPage } from './payments/PaymentsPage'
import { Reports } from './reports/Reports'
import { ReviewsPage } from './reviews/ReviewsPage'
import { ResourcePage } from './resources/ResourcePage'
import { StructuredResourcePage } from './resources/StructuredResourcePage'
import { SettingsPage } from './settings/SettingsPage'
import { LiveChat } from './support/LiveChat'

export function RoutesContent() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products/create" element={<ProductForm />} />
      <Route path="/products/:id/edit" element={<ProductForm />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/customers/:id" element={<CustomerDetail />} />
      <Route path="/categories" element={<CategoryTreePage />} />
      <Route path="/seo" element={<SeoPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/support/live-chat" element={<LiveChat />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<SettingsPage />} />
      {Object.keys(structuredResources).map((path) => <Route key={path} path={path} element={<StructuredResourcePage config={structuredResources[path]} />} />)}
      {Object.keys(resourceMap).filter((path) => !['/categories', '/seo', '/blog', '/payments', '/reviews', '/orders', '/customers', ...Object.keys(structuredResources)].includes(path)).map((path) => <Route key={path} path={path} element={<ResourcePage config={resourceMap[path]} />} />)}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
