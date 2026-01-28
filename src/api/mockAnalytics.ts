import type {
  RevenueMetric,
  TechnicianProductivity,
  WorkOrderFunnel,
  TopCustomer,
} from './analytics';

// Generate mock revenue data for the past N days
const generateRevenueMetrics = (startDate: string, endDate: string): RevenueMetric[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const metrics: RevenueMetric[] = [];

  const current = new Date(start);
  while (current <= end) {
    const baseRevenue = 800 + Math.random() * 1200;
    const partsRevenue = baseRevenue * (0.3 + Math.random() * 0.2);
    const laborRevenue = baseRevenue - partsRevenue;
    const orderCount = Math.floor(1 + Math.random() * 4);

    metrics.push({
      date: current.toISOString().split('T')[0],
      totalRevenue: Math.round(baseRevenue * 100) / 100,
      partsRevenue: Math.round(partsRevenue * 100) / 100,
      laborRevenue: Math.round(laborRevenue * 100) / 100,
      orderCount,
    });

    current.setDate(current.getDate() + 1);
  }

  return metrics;
};

// Mock technician productivity data
const mockTechnicianProductivity: TechnicianProductivity[] = [
  {
    technicianId: 'tech-1',
    technicianName: 'Whitney Banks',
    totalOrders: 24,
    completedOrders: 18,
    totalRevenue: 12450.0,
    avgCompletionTimeHours: 4.2,
  },
  {
    technicianId: 'tech-2',
    technicianName: 'Trevor Shaw',
    totalOrders: 19,
    completedOrders: 14,
    totalRevenue: 9800.0,
    avgCompletionTimeHours: 5.1,
  },
];

// Generate mock funnel data for the past N weeks
const generateWorkOrderFunnel = (weeks: number): WorkOrderFunnel[] => {
  const funnel: WorkOrderFunnel[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    // Get Monday of that week
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    funnel.push({
      weekStart: weekStart.toISOString().split('T')[0],
      draftCount: Math.floor(2 + Math.random() * 5),
      submittedCount: Math.floor(3 + Math.random() * 6),
      approvedCount: Math.floor(2 + Math.random() * 4),
      completedCount: Math.floor(1 + Math.random() * 5),
    });
  }

  return funnel;
};

// Mock top customers
const mockTopCustomers: TopCustomer[] = [
  {
    customerId: 'cust-ava',
    customerName: 'Ava Mitchell',
    totalOrders: 8,
    totalSpent: 6240.0,
  },
  {
    customerId: 'cust-lucas',
    customerName: 'Lucas Reed',
    totalOrders: 5,
    totalSpent: 4150.0,
  },
  {
    customerId: 'cust-nia',
    customerName: 'Nia Patel',
    totalOrders: 4,
    totalSpent: 3420.0,
  },
];

const randomDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 400));

export const mockAnalyticsApi = {
  async getRevenueMetrics(startDate: string, endDate: string): Promise<RevenueMetric[]> {
    await randomDelay();
    return generateRevenueMetrics(startDate, endDate);
  },

  async getTechnicianProductivity(): Promise<TechnicianProductivity[]> {
    await randomDelay();
    return [...mockTechnicianProductivity];
  },

  async getWorkOrderFunnel(weeks: number = 12): Promise<WorkOrderFunnel[]> {
    await randomDelay();
    return generateWorkOrderFunnel(weeks);
  },

  async getTopCustomers(limit: number = 10): Promise<TopCustomer[]> {
    await randomDelay();
    return mockTopCustomers.slice(0, limit);
  },

  async getSummaryStats(): Promise<{
    totalRevenue: number;
    avgOrderValue: number;
    completionRate: number;
    openOrders: number;
    awaitingApproval: number;
    pendingCustomerApproval: number;
  }> {
    await randomDelay();
    return {
      totalRevenue: 22250.0,
      avgOrderValue: 695.31,
      completionRate: 78.5,
      openOrders: 3,
      awaitingApproval: 1,
      pendingCustomerApproval: 0,
    };
  },
};
