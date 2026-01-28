import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockAnalyticsApi } from './mockAnalytics';

export interface RevenueMetric {
  date: string;
  totalRevenue: number;
  partsRevenue: number;
  laborRevenue: number;
  orderCount: number;
}

export interface TechnicianProductivity {
  technicianId: string;
  technicianName: string;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  avgCompletionTimeHours: number | null;
}

export interface WorkOrderFunnel {
  weekStart: string;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  completedCount: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
}

// Helper to get current user's dealership ID
const getDealershipId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');
  return profile.dealership_id;
};

const supabaseAnalyticsApi = {
  async getRevenueMetrics(startDate: string, endDate: string): Promise<RevenueMetric[]> {
    const dealershipId = await getDealershipId();

    // Query completed work orders within date range
    const { data: orders, error } = await supabase
      .from('work_orders')
      .select(`
        id,
        total_estimate,
        labor_hours,
        labor_rate,
        updated_at
      `)
      .eq('dealership_id', dealershipId)
      .eq('status', 'completed')
      .gte('updated_at', startDate)
      .lte('updated_at', endDate)
      .order('updated_at');

    if (error) throw new Error(error.message);
    if (!orders || orders.length === 0) return [];

    // Get parts totals for each order
    const orderIds = orders.map((o) => o.id);
    const { data: parts } = await supabase
      .from('work_order_parts')
      .select('work_order_id, unit_price, quantity')
      .in('work_order_id', orderIds);

    // Calculate parts totals per order
    const partsTotalByOrder = new Map<string, number>();
    (parts ?? []).forEach((p) => {
      const current = partsTotalByOrder.get(p.work_order_id) ?? 0;
      partsTotalByOrder.set(p.work_order_id, current + p.unit_price * p.quantity);
    });

    // Group by date
    const metricsByDate = new Map<string, RevenueMetric>();

    orders.forEach((order) => {
      const date = order.updated_at.split('T')[0];
      const laborRevenue = order.labor_hours * order.labor_rate;
      const partsRevenue = partsTotalByOrder.get(order.id) ?? 0;

      const existing = metricsByDate.get(date);
      if (existing) {
        existing.totalRevenue += order.total_estimate;
        existing.partsRevenue += partsRevenue;
        existing.laborRevenue += laborRevenue;
        existing.orderCount += 1;
      } else {
        metricsByDate.set(date, {
          date,
          totalRevenue: order.total_estimate,
          partsRevenue,
          laborRevenue,
          orderCount: 1,
        });
      }
    });

    return Array.from(metricsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  async getTechnicianProductivity(month?: string): Promise<TechnicianProductivity[]> {
    const dealershipId = await getDealershipId();

    // Get active technicians
    const { data: technicians, error: techError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('dealership_id', dealershipId)
      .eq('role', 'technician')
      .eq('status', 'active');

    if (techError) throw new Error(techError.message);
    if (!technicians || technicians.length === 0) return [];

    // Build date filter
    let startDate: string | undefined;
    let endDate: string | undefined;
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      endDate = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
    }

    // Get work orders for each technician
    const results = await Promise.all(
      technicians.map(async (tech) => {
        let query = supabase
          .from('work_orders')
          .select('id, status, total_estimate, created_at, updated_at')
          .eq('dealership_id', dealershipId)
          .eq('technician_id', tech.id);

        if (startDate && endDate) {
          query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        const { data: orders } = await query;

        const totalOrders = orders?.length ?? 0;
        const completedOrders = orders?.filter((o) => o.status === 'completed').length ?? 0;
        const totalRevenue = orders
          ?.filter((o) => o.status === 'completed')
          .reduce((sum, o) => sum + o.total_estimate, 0) ?? 0;

        // Calculate average completion time
        const completedWithTime = orders?.filter(
          (o) => o.status === 'completed' && o.created_at && o.updated_at
        );
        let avgCompletionTimeHours: number | null = null;
        if (completedWithTime && completedWithTime.length > 0) {
          const totalHours = completedWithTime.reduce((sum, o) => {
            const created = new Date(o.created_at).getTime();
            const updated = new Date(o.updated_at).getTime();
            return sum + (updated - created) / (1000 * 60 * 60);
          }, 0);
          avgCompletionTimeHours = totalHours / completedWithTime.length;
        }

        return {
          technicianId: tech.id,
          technicianName: tech.name,
          totalOrders,
          completedOrders,
          totalRevenue,
          avgCompletionTimeHours,
        };
      })
    );

    return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
  },

  async getWorkOrderFunnel(weeks: number = 12): Promise<WorkOrderFunnel[]> {
    const dealershipId = await getDealershipId();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data: orders, error } = await supabase
      .from('work_orders')
      .select('status, created_at')
      .eq('dealership_id', dealershipId)
      .gte('created_at', startDate.toISOString());

    if (error) throw new Error(error.message);
    if (!orders || orders.length === 0) return [];

    // Group by week
    const funnelByWeek = new Map<string, WorkOrderFunnel>();

    orders.forEach((order) => {
      const created = new Date(order.created_at);
      // Get Monday of the week
      const day = created.getDay();
      const diff = created.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(created.setDate(diff));
      const weekStart = monday.toISOString().split('T')[0];

      const existing = funnelByWeek.get(weekStart) ?? {
        weekStart,
        draftCount: 0,
        submittedCount: 0,
        approvedCount: 0,
        completedCount: 0,
      };

      switch (order.status) {
        case 'draft':
          existing.draftCount += 1;
          break;
        case 'submitted':
          existing.submittedCount += 1;
          break;
        case 'approved':
        case 'pending_customer_approval':
        case 'customer_approved':
          existing.approvedCount += 1;
          break;
        case 'completed':
          existing.completedCount += 1;
          break;
      }

      funnelByWeek.set(weekStart, existing);
    });

    return Array.from(funnelByWeek.values()).sort((a, b) =>
      a.weekStart.localeCompare(b.weekStart)
    );
  },

  async getTopCustomers(limit: number = 10): Promise<TopCustomer[]> {
    const dealershipId = await getDealershipId();

    // Get all completed orders
    const { data: orders, error } = await supabase
      .from('work_orders')
      .select('customer_id, total_estimate')
      .eq('dealership_id', dealershipId)
      .eq('status', 'completed');

    if (error) throw new Error(error.message);
    if (!orders || orders.length === 0) return [];

    // Aggregate by customer
    const customerStats = new Map<string, { totalOrders: number; totalSpent: number }>();
    orders.forEach((order) => {
      const existing = customerStats.get(order.customer_id) ?? { totalOrders: 0, totalSpent: 0 };
      existing.totalOrders += 1;
      existing.totalSpent += order.total_estimate;
      customerStats.set(order.customer_id, existing);
    });

    // Get customer names
    const customerIds = Array.from(customerStats.keys());
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name')
      .in('id', customerIds);

    const customerNames = new Map((customers ?? []).map((c) => [c.id, c.name]));

    // Build results
    const results: TopCustomer[] = Array.from(customerStats.entries()).map(([id, stats]) => ({
      customerId: id,
      customerName: customerNames.get(id) ?? 'Unknown',
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
    }));

    return results.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
  },

  // Summary stats for dashboard
  async getSummaryStats(): Promise<{
    totalRevenue: number;
    avgOrderValue: number;
    completionRate: number;
    openOrders: number;
    awaitingApproval: number;
    pendingCustomerApproval: number;
  }> {
    const dealershipId = await getDealershipId();

    const { data: orders, error } = await supabase
      .from('work_orders')
      .select('status, total_estimate')
      .eq('dealership_id', dealershipId);

    if (error) throw new Error(error.message);

    const allOrders = orders ?? [];
    const completed = allOrders.filter((o) => o.status === 'completed');
    const totalRevenue = completed.reduce((sum, o) => sum + o.total_estimate, 0);
    const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;

    const openStatuses = ['draft', 'submitted', 'approved', 'pending_customer_approval', 'customer_approved'];
    const openOrders = allOrders.filter((o) => openStatuses.includes(o.status)).length;
    const awaitingApproval = allOrders.filter((o) => o.status === 'submitted').length;
    const pendingCustomerApproval = allOrders.filter((o) => o.status === 'pending_customer_approval').length;

    // Completion rate = completed / (completed + rejected)
    const rejected = allOrders.filter((o) => o.status === 'rejected' || o.status === 'customer_rejected').length;
    const completionRate = completed.length + rejected > 0
      ? (completed.length / (completed.length + rejected)) * 100
      : 100;

    return {
      totalRevenue,
      avgOrderValue,
      completionRate,
      openOrders,
      awaitingApproval,
      pendingCustomerApproval,
    };
  },
};

// Use Supabase API if configured, otherwise fall back to mock API
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true' && isSupabaseConfigured;

export const analyticsApi = USE_SUPABASE ? supabaseAnalyticsApi : mockAnalyticsApi;
