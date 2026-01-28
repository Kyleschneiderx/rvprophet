import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MegaphoneIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import type { Announcement, Role, WorkOrder } from '../../types';
import { formatCurrency, formatDate, statusStyles } from '../../utils/formatters';

export const DashboardPage = () => {
  const { role, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

  const { data: allWorkOrders = [], isLoading: workOrdersLoading } = useQuery({
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

  const canManageAnnouncements = role === 'owner' || role === 'manager';

  const invalidateAnnouncements = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
  };

  // Filter work orders based on role
  // Technicians only see their own work orders
  // Managers/Owners see all work orders
  const workOrders: WorkOrder[] = useMemo(() => {
    if (role === 'technician' && profile?.id) {
      return allWorkOrders.filter((wo) => wo.technicianId === profile.id);
    }
    return allWorkOrders;
  }, [allWorkOrders, role, profile?.id]);

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
            canManage={canManageAnnouncements}
            onCreateClick={() => setShowCreateAnnouncement(true)}
            onDelete={invalidateAnnouncements}
          />
        </div>

        {showCreateAnnouncement && (
          <CreateAnnouncementModal
            onClose={() => setShowCreateAnnouncement(false)}
            onSuccess={() => {
              setShowCreateAnnouncement(false);
              invalidateAnnouncements();
            }}
          />
        )}
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
            <Link
              key={order.id}
              to={`/work-orders/${order.id}`}
              className="block rounded-2xl border border-neutral-border p-4 transition hover:shadow-cardHover hover:border-brand-accent/30"
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
            </Link>
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
  canManage: boolean;
  onCreateClick: () => void;
  onDelete: () => void;
};

const AnnouncementsPanel = ({
  announcements,
  loading,
  canManage,
  onCreateClick,
  onDelete,
}: AnnouncementsPanelProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteAnnouncement(id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
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
        {canManage && (
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-3 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-accent/90"
          >
            <PlusIcon className="h-4 w-4" />
            New Announcement
          </button>
        )}
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
                <div className="flex gap-3">
                  <div className="flex-1">
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
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(announcement.id)}
                      disabled={deletingId === announcement.id}
                      className="self-start p-1 text-neutral-textSecondary hover:text-red-500 disabled:opacity-50"
                      title="Delete announcement"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
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
};

type CreateAnnouncementModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

const CreateAnnouncementModal = ({
  onClose,
  onSuccess,
}: CreateAnnouncementModalProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | Role[]>('all');
  const [actionLabel, setActionLabel] = useState('');
  const [actionLink, setActionLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudienceChange = (role: Role, checked: boolean) => {
    if (audience === 'all') {
      // Switching from 'all' to specific roles
      setAudience(checked ? [role] : []);
    } else {
      if (checked) {
        setAudience([...audience, role]);
      } else {
        const newAudience = audience.filter((r) => r !== role);
        setAudience(newAudience.length === 0 ? 'all' : newAudience);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        audience,
        actionLabel: actionLabel.trim() || undefined,
        actionLink: actionLink.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-text">
            New Announcement
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-textSecondary hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-text">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
              placeholder="What's the headline?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-text">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
              placeholder="Give the details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-text mb-2">
              Who should see this?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={audience === 'all'}
                  onChange={(e) => setAudience(e.target.checked ? 'all' : [])}
                  className="h-4 w-4 rounded border-neutral-border text-brand-accent"
                />
                <span className="text-sm text-neutral-text">Everyone</span>
              </label>
              {audience !== 'all' && (
                <div className="ml-6 space-y-2">
                  {(['owner', 'manager', 'technician'] as Role[]).map((role) => (
                    <label key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Array.isArray(audience) && audience.includes(role)}
                        onChange={(e) => handleAudienceChange(role, e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-border text-brand-accent"
                      />
                      <span className="text-sm text-neutral-text capitalize">{role}s</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-text">
                Action Label <span className="text-neutral-textSecondary">(optional)</span>
              </label>
              <input
                type="text"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                placeholder="e.g., Learn more"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text">
                Action Link <span className="text-neutral-textSecondary">(optional)</span>
              </label>
              <input
                type="text"
                value={actionLink}
                onChange={(e) => setActionLink(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !message.trim()}
            className="flex-1 rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
};

