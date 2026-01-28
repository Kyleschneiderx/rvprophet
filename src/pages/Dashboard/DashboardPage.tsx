import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import { useRole } from '../../context/AuthContext';
import type { Announcement } from '../../types';
import { formatCurrency, formatDate, statusStyles } from '../../utils/formatters';

export const DashboardPage = () => {
  const { role } = useRole();
  const { data: workOrders = [], isLoading: workOrdersLoading } = useQuery({
    queryKey: queryKeys.workOrders,
    queryFn: () => api.getWorkOrders(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: queryKeys.customers(),
    queryFn: () => api.getCustomers(),
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: [...queryKeys.announcements, role],
    queryFn: () => api.getAnnouncements(role),
  });

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((customer) => map.set(customer.id, customer.name));
    return map;
  }, [customers]);

  const openStatuses = new Set(['draft', 'submitted', 'approved']);
  const openCount = workOrders.filter((wo) => openStatuses.has(wo.status)).length;
  const submittedCount = workOrders.filter((wo) => wo.status === 'submitted').length;
  const awaitingCompletion = workOrders.filter(
    (wo) => wo.status === 'approved',
  ).length;

  const recent = [...workOrders]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-10">
        <div className="flex flex-col gap-4 xl:col-span-3">
          <DashboardStat
            label={
              role === 'technician' ? 'My open work orders' : 'Open work orders'
            }
            value={openCount}
            helper="Draft · Submitted · Approved"
            loading={workOrdersLoading}
          />
          <DashboardStat
            label="Waiting for manager"
            value={submittedCount}
            helper="Submitted by techs"
            highlight
            loading={workOrdersLoading}
          />
          <DashboardStat
            label="Approved, not completed"
            value={awaitingCompletion}
            helper="Ready to schedule"
            loading={workOrdersLoading}
          />
        </div>

        <div className="xl:col-span-7 h-full">
          <AnnouncementsPanel
            announcements={announcements}
            loading={announcementsLoading}
          />
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-text">
              Recent work orders
            </h2>
            <p className="text-sm text-neutral-textSecondary">
              Quick snapshot of the latest upsell opportunities.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {recent.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-neutral-border p-4 transition hover:shadow-cardHover"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-neutral-textSecondary">
                    {formatDate(order.createdAt)}
                  </p>
                  <h3 className="text-lg font-semibold text-neutral-text">
                    {order.issueDescription}
                  </h3>
                  <p className="text-sm text-neutral-textSecondary">
                    {customerMap.get(order.customerId)}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status].className}`}
                  >
                    {statusStyles[order.status].label}
                  </span>
                  <p className="text-lg font-bold text-neutral-text">
                    {formatCurrency(order.totalEstimate)}
                  </p>
                </div>
              </div>
            </article>
          ))}
          {recent.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-border p-6 text-center text-sm text-neutral-textSecondary">
              No work orders yet. Create the first from any RV.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

type StatProps = {
  label: string;
  value: number;
  helper: string;
  highlight?: boolean;
  loading?: boolean;
};

const DashboardStat = ({
  label,
  value,
  helper,
  highlight = false,
  loading = false,
}: StatProps) => (
  <div
    className={`rounded-2xl border border-neutral-border bg-white p-4 shadow-card ${
      highlight ? 'border-success/30' : ''
    }`}
  >
    <p className="text-sm font-medium text-neutral-textSecondary">{label}</p>
    <p className="mt-2 text-3xl font-bold text-neutral-text">
      {loading ? '—' : value}
    </p>
    <p className="text-sm text-neutral-textSecondary">{helper}</p>
  </div>
);

type AnnouncementsPanelProps = {
  announcements: Announcement[];
  loading: boolean;
};

const AnnouncementsPanel = ({
  announcements,
  loading,
}: AnnouncementsPanelProps) => (
  <section className="flex h-full flex-col rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-brand-accent/10 p-2 text-brand-accent">
          <MegaphoneIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-neutral-text">
            Bay announcements
          </h2>
          <p className="text-sm text-neutral-textSecondary">
            Stay aligned without leaving the service floor.
          </p>
        </div>
      </div>
    </div>
    <div className="mt-4 flex-1 overflow-y-auto pr-1">
      <div className="space-y-3">
        {loading && (
          <div className="rounded-xl border border-dashed border-neutral-border p-4 text-sm text-neutral-textSecondary">
            Checking for updates…
          </div>
        )}
        {!loading &&
          announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-2xl border border-neutral-border p-4"
            >
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-textSecondary">
                  {formatDate(announcement.createdAt)}
                </p>
                <h3 className="text-lg font-semibold text-neutral-text">
                  {announcement.title}
                </h3>
                <p className="text-sm text-neutral-textSecondary">
                  {announcement.message}
                </p>
                {announcement.actionLabel && announcement.actionLink && (
                  <a
                    href={announcement.actionLink}
                    className="mt-2 inline-flex text-sm font-semibold text-brand-accent"
                  >
                    {announcement.actionLabel}
                  </a>
                )}
              </div>
            </article>
          ))}
        {!loading && announcements.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-border p-4 text-sm text-neutral-textSecondary">
            No announcements right now. Enjoy the calm!
          </div>
        )}
      </div>
    </div>
  </section>
);

