import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { analyticsApi } from '../../api/analytics';
import { queryKeys } from '../../constants/queryKeys';
import { formatCurrency } from '../../utils/formatters';

type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'all';

const getDateRange = (range: DateRange): { startDate: string; endDate: string } => {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'ytd':
      startDate.setMonth(0, 1);
      break;
    case 'all':
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange]);

  // Fetch analytics data
  const { data: revenueMetrics, isLoading: revenueLoading } = useQuery({
    queryKey: queryKeys.revenueMetrics(startDate, endDate),
    queryFn: () => analyticsApi.getRevenueMetrics(startDate, endDate),
  });

  const { data: technicianProductivity, isLoading: techLoading } = useQuery({
    queryKey: queryKeys.technicianProductivity(),
    queryFn: () => analyticsApi.getTechnicianProductivity(),
  });

  const { data: workOrderFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: queryKeys.workOrderFunnel(),
    queryFn: () => analyticsApi.getWorkOrderFunnel(12),
  });

  const { data: summaryStats, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.summaryStats(),
    queryFn: () => analyticsApi.getSummaryStats(),
  });

  // Calculate totals from revenue metrics
  const totals = useMemo(() => {
    if (!revenueMetrics) return { revenue: 0, orders: 0, avgOrderValue: 0 };

    const revenue = revenueMetrics.reduce((sum, m) => sum + m.totalRevenue, 0);
    const orders = revenueMetrics.reduce((sum, m) => sum + m.orderCount, 0);

    return {
      revenue,
      orders,
      avgOrderValue: orders > 0 ? revenue / orders : 0,
    };
  }, [revenueMetrics]);

  // Export to CSV
  const exportToCSV = () => {
    if (!revenueMetrics) return;

    const headers = ['Date', 'Total Revenue', 'Parts Revenue', 'Labor Revenue', 'Order Count'];
    const rows = revenueMetrics.map((m) => [
      m.date,
      m.totalRevenue.toFixed(2),
      m.partsRevenue.toFixed(2),
      m.laborRevenue.toFixed(2),
      m.orderCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-report-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = revenueLoading || techLoading || funnelLoading || summaryLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track revenue, productivity, and work order metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
            <option value="all">All time</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            disabled={!revenueMetrics || revenueMetrics.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totals.revenue)}
          icon={CurrencyDollarIcon}
          loading={isLoading}
        />
        <StatCard
          title="Completed Orders"
          value={totals.orders.toString()}
          icon={ClipboardDocumentListIcon}
          loading={isLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(totals.avgOrderValue)}
          icon={ChartBarIcon}
          loading={isLoading}
        />
        <StatCard
          title="Completion Rate"
          value={`${(summaryStats?.completionRate ?? 0).toFixed(1)}%`}
          icon={ChartBarIcon}
          loading={isLoading}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h2>
        {revenueLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : revenueMetrics && revenueMetrics.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), '']}
                labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                name="Total"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="partsRevenue"
                name="Parts"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="laborRevenue"
                name="Labor"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No revenue data for this period
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Leaderboard */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Technician Productivity</h2>
          </div>
          {techLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : technicianProductivity && technicianProductivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Technician</th>
                    <th className="pb-3 text-right">Orders</th>
                    <th className="pb-3 text-right">Completed</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {technicianProductivity.map((tech, idx) => (
                    <tr key={tech.technicianId}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className={`
                            inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium
                            ${idx === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}
                          `}>
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-900">{tech.technicianName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-600">{tech.totalOrders}</td>
                      <td className="py-3 text-right text-gray-600">{tech.completedOrders}</td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatCurrency(tech.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No technician data available
            </div>
          )}
        </div>

        {/* Work Order Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Order Funnel</h2>
          {funnelLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : workOrderFunnel && workOrderFunnel.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workOrderFunnel.slice(-8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="weekStart"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  labelFormatter={(label) => `Week of ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                <Bar dataKey="draftCount" name="Draft" fill="#94a3b8" stackId="a" />
                <Bar dataKey="submittedCount" name="Submitted" fill="#3b82f6" stackId="a" />
                <Bar dataKey="approvedCount" name="Approved" fill="#10b981" stackId="a" />
                <Bar dataKey="completedCount" name="Completed" fill="#22c55e" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No funnel data available
            </div>
          )}
        </div>
      </div>

      {/* Current Pipeline Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Pipeline</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{summaryStats?.openOrders ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">Open Orders</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{summaryStats?.awaitingApproval ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">Awaiting Manager Approval</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{summaryStats?.pendingCustomerApproval ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">Pending Customer Approval</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, loading }: StatCardProps) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        {loading ? (
          <div className="h-8 w-24 mt-1 bg-gray-200 animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-full">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
    </div>
  </div>
);
