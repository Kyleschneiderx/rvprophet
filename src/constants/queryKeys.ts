export const queryKeys = {
  // Customers
  customers: (search?: string) => ['customers', search ?? 'all'],
  customer: (id: string) => ['customer', id],
  customerRVs: (customerId: string) => ['customerRVs', customerId],

  // RVs
  rv: (id: string) => ['rv', id],

  // Work Orders
  workOrdersForRV: (rvId: string) => ['workOrders', 'rv', rvId],
  workOrder: (id: string) => ['workOrder', id],
  workOrders: ['workOrders'] as const,

  // Parts
  parts: (search?: string) => ['parts', search ?? 'all'],

  // Settings & Users
  settings: ['settings'] as const,
  users: ['users'] as const,

  // Announcements
  announcements: ['announcements'] as const,

  // Notifications
  notifications: ['notifications'] as const,

  // Analytics
  revenueMetrics: (startDate: string, endDate: string) => ['analytics', 'revenue', startDate, endDate],
  technicianProductivity: (month?: string) => ['analytics', 'technician', month ?? 'all'],
  workOrderFunnel: (weeks?: number) => ['analytics', 'funnel', weeks ?? 12],
  topCustomers: (limit?: number) => ['analytics', 'topCustomers', limit ?? 10],
  summaryStats: () => ['analytics', 'summary'],
};
