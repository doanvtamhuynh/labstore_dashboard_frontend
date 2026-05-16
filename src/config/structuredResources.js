import { api } from '../services/api'

export const structuredResources = {
  '/promotions/coupons': {
    title: 'Coupons', singular: 'Coupon', endpoint: '/promotions/coupons',
    columns: ['code', 'discountType', 'discountValue', 'usageLimit', 'usedCount', 'status'],
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'discountType', label: 'Discount Type', type: 'select', options: ['Percentage', 'FixedAmount'], defaultValue: 'Percentage' },
      { name: 'discountValue', label: 'Discount Value', type: 'number', required: true },
      { name: 'usageLimit', label: 'Usage Limit', type: 'number', defaultValue: 100 },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Paused', 'Expired'], defaultValue: 'Active' },
      { name: 'startsAtUtc', label: 'Starts At', type: 'datetime-local', nullable: true },
      { name: 'endsAtUtc', label: 'Ends At', type: 'datetime-local', nullable: true },
    ],
  },
  '/promotions/flash-sales': {
    title: 'Flash Sales', singular: 'Flash Sale', endpoint: '/promotions/flash-sales',
    columns: ['name', 'categoryId', 'discountPercent', 'status'],
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'categoryId', label: 'Category ID', nullable: true },
      { name: 'discountPercent', label: 'Discount Percent', type: 'number', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Paused', 'Expired'], defaultValue: 'Draft' },
      { name: 'startsAtUtc', label: 'Starts At', type: 'datetime-local', defaultValue: new Date().toISOString().slice(0, 16) },
      { name: 'endsAtUtc', label: 'Ends At', type: 'datetime-local', defaultValue: new Date(Date.now() + 86400000).toISOString().slice(0, 16) },
    ],
  },
  '/promotions/banners': {
    title: 'Banners', singular: 'Banner', endpoint: '/promotions/banners',
    columns: ['title', 'position', 'status', 'imageUrl'],
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'imageUrl', label: 'Image URL', required: true },
      { name: 'linkUrl', label: 'Link URL', nullable: true },
      { name: 'position', label: 'Position', defaultValue: 'homepage' },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Paused', 'Expired'], defaultValue: 'Draft' },
      { name: 'startsAtUtc', label: 'Starts At', type: 'datetime-local', nullable: true },
      { name: 'endsAtUtc', label: 'Ends At', type: 'datetime-local', nullable: true },
    ],
  },
  '/promotions/affiliate': {
    title: 'Affiliate', singular: 'Affiliate Program', endpoint: '/promotions/affiliate',
    columns: ['partnerName', 'trackingCode', 'commissionPercent', 'status'],
    fields: [
      { name: 'partnerName', label: 'Partner Name', required: true },
      { name: 'trackingCode', label: 'Tracking Code', required: true },
      { name: 'commissionPercent', label: 'Commission Percent', type: 'number', defaultValue: 5 },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Paused', 'Expired'], defaultValue: 'Active' },
    ],
  },
  '/shipping': {
    title: 'Shipping Configs', singular: 'Shipping Config', endpoint: '/shipping/configs',
    columns: ['region', 'minWeightKg', 'maxWeightKg', 'fee', 'isActive'],
    fields: [
      { name: 'region', label: 'Region', required: true },
      { name: 'minWeightKg', label: 'Min Weight Kg', type: 'number', defaultValue: 0 },
      { name: 'maxWeightKg', label: 'Max Weight Kg', type: 'number', defaultValue: 5 },
      { name: 'fee', label: 'Fee', type: 'number', defaultValue: 30000 },
      { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
  },
  '/shipping/returns': {
    title: 'Returns', singular: 'Return', endpoint: '/shipping/returns',
    columns: ['orderId', 'customerId', 'reason', 'status'],
    fields: [
      { name: 'orderId', label: 'Order ID', required: true },
      { name: 'customerId', label: 'Customer ID', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Requested', 'Approved', 'Rejected', 'Received', 'Refunded'], defaultValue: 'Requested' },
      { name: 'resolutionNote', label: 'Resolution Note', type: 'textarea', nullable: true },
    ],
  },
  '/support/tickets': {
    title: 'Tickets', singular: 'Ticket', endpoint: '/support/tickets',
    columns: ['subject', 'customerEmail', 'status', 'priority', 'assignedTo'],
    fields: [
      { name: 'subject', label: 'Subject', required: true },
      { name: 'customerId', label: 'Customer ID', required: true },
      { name: 'customerEmail', label: 'Customer Email', type: 'email', required: true },
      { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'], defaultValue: 'Medium' },
      { name: 'message', label: 'Initial Message', type: 'textarea', required: true },
    ],
    actions: [
      { label: 'Assign', action: 'assign', run: async (row, refetch) => { await api.patch(`/support/tickets/${row.id}/assign`, { assignedTo: row.assignedTo || 'support@labstore.local' }); refetch() } },
      { label: 'Close', action: 'close', run: async (row, refetch) => { await api.patch(`/support/tickets/${row.id}/status`, { status: 'Closed' }); refetch() } },
    ],
  },
  '/support/faq': {
    title: 'FAQ', singular: 'FAQ', endpoint: '/support/faq',
    columns: ['question', 'category', 'isPublished', 'sortOrder'],
    fields: [
      { name: 'question', label: 'Question', required: true },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      { name: 'category', label: 'Category', defaultValue: 'General' },
      { name: 'isPublished', label: 'Published', type: 'checkbox', defaultValue: true },
      { name: 'sortOrder', label: 'Sort Order', type: 'number', defaultValue: 0 },
    ],
  },
  '/notifications': {
    title: 'Notifications', singular: 'Notification', endpoint: '/notifications', createEndpoint: '/notifications/push',
    columns: ['title', 'audience', 'recipientId', 'isRead'],
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'audience', label: 'Audience', type: 'select', options: ['Admin', 'Customer'], defaultValue: 'Admin' },
      { name: 'recipientId', label: 'Recipient ID', nullable: true },
    ],
    actions: [
      { label: 'Read', action: 'read', run: async (row, refetch) => { await api.patch(`/notifications/${row.id}/read`); refetch() } },
    ],
  },
  '/settings/admins': {
    title: 'Admins', singular: 'Admin', endpoint: '/settings/admins',
    columns: ['email', 'fullName', 'role'],
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'fullName', label: 'Full Name', required: true },
      { name: 'password', label: 'Initial Password', type: 'password', defaultValue: 'Admin@123456' },
      { name: 'role', label: 'Role', type: 'select', options: ['SuperAdmin', 'Manager', 'Staff', 'Accountant'], defaultValue: 'Staff' },
      { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
  },
}
