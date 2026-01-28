import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { supabaseApi } from '../../api/supabaseApi';
import { queryKeys } from '../../constants/queryKeys';
import { useRole } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Customer, WorkOrderStatus } from '../../types';
import { formatCurrency, formatDate, statusStyles } from '../../utils/formatters';

export const WorkOrderDetailPage = () => {
  const { workOrderId } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const queryClient = useQueryClient();
  const [showSendModal, setShowSendModal] = useState(false);

  const { data: workOrder, isLoading, isError } = useQuery({
    queryKey: queryKeys.workOrder(workOrderId!),
    queryFn: () => api.getWorkOrderById(workOrderId!),
    enabled: Boolean(workOrderId),
  });

  const { data: rv } = useQuery({
    queryKey: workOrder ? queryKeys.rv(workOrder.rvId) : ['rv'],
    queryFn: () => api.getRVById(workOrder!.rvId),
    enabled: Boolean(workOrder),
  });

  const { data: customer } = useQuery({
    queryKey: workOrder ? queryKeys.customer(workOrder.customerId) : ['customer'],
    queryFn: () => api.getCustomerById(workOrder!.customerId),
    enabled: Boolean(workOrder),
  });

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.getSettings(),
  });

  const [technicianNotesOverride, setTechnicianNotesOverride] = useState<string | null>(null);
  const [managerNotesOverride, setManagerNotesOverride] = useState<string | null>(null);

  const technicianNotes = technicianNotesOverride ?? workOrder?.technicianNotes ?? '';
  const managerNotes = managerNotesOverride ?? workOrder?.managerNotes ?? '';
  const setTechnicianNotes = (value: string) => setTechnicianNotesOverride(value);
  const setManagerNotes = (value: string) => setManagerNotesOverride(value);

  useEffect(() => {
    if (isError) {
      navigate('/rvs');
    }
  }, [isError, navigate]);

  const isDraft = workOrder?.status === 'draft';
  const canEditDraft = isDraft && Boolean(workOrder);
  const canManage =
    (role === 'manager' || role === 'owner') && Boolean(workOrder);
  const canSendToCustomer =
    canManage &&
    workOrder?.status === 'approved' &&
    isSupabaseConfigured;

  const queryInvalidations = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workOrder(workOrderId!) });
    if (workOrder) {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrdersForRV(workOrder.rvId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders });
    }
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: Parameters<typeof api.updateWorkOrder>[1]) =>
      api.updateWorkOrder(workOrderId!, payload),
    onSuccess: () => queryInvalidations(),
  });

  const handleStatusChange = async (status: WorkOrderStatus) => {
    await mutateAsync({ status });
  };

  const handleSaveTechNotes = async () => {
    await mutateAsync({ technicianNotes });
  };

  const handleSaveManagerNotes = async () => {
    await mutateAsync({ managerNotes });
  };

  let approvalActions: ReactNode = null;
  if (workOrder && canManage) {
    if (workOrder.status === 'submitted') {
      approvalActions = (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-card"
            onClick={() => handleStatusChange('approved')}
            disabled={isPending}
          >
            Approve
          </button>
          <button
            type="button"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
            onClick={() => handleStatusChange('rejected')}
            disabled={isPending}
          >
            Reject
          </button>
        </div>
      );
    } else if (workOrder.status === 'approved') {
      approvalActions = (
        <div className="flex flex-col gap-3 sm:flex-row">
          {canSendToCustomer && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-card"
              onClick={() => setShowSendModal(true)}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Send to Customer
            </button>
          )}
          <button
            type="button"
            className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card"
            onClick={() => handleStatusChange('completed')}
            disabled={isPending}
          >
            Mark completed
          </button>
        </div>
      );
    } else if (workOrder.status === 'customer_approved') {
      approvalActions = (
        <button
          type="button"
          className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card"
          onClick={() => handleStatusChange('completed')}
          disabled={isPending}
        >
          Mark completed
        </button>
      );
    }
  }

  if (isLoading || !workOrder) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-border p-6 text-sm text-neutral-textSecondary">
        Loading work order…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-textSecondary">
            Work order detail
          </p>
          <h1 className="text-2xl font-semibold text-neutral-text">
            {workOrder.issueDescription}
          </h1>
          <p className="text-sm text-neutral-textSecondary">
            {rv ? `${rv.year} ${rv.make} ${rv.model}` : 'Loading RV...'}
          </p>
          {customer && (
            <Link
              to={`/customers/${customer.id}`}
              className="text-sm font-semibold text-brand-accent"
            >
              {customer.name}
            </Link>
          )}
        </div>
        <Link
          to={`/rvs/${workOrder.rvId}`}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to RV
        </Link>
      </header>

      <section className="grid gap-4 rounded-2xl border border-neutral-border bg-white p-4 shadow-card lg:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-textSecondary">
            Status
          </p>
          <span
            className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[workOrder.status].className}`}
          >
            {statusStyles[workOrder.status].label}
            {(workOrder.status === 'approved' || workOrder.status === 'customer_approved') && (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            {(workOrder.status === 'rejected' || workOrder.status === 'customer_rejected') && (
              <XMarkIcon className="h-4 w-4" />
            )}
          </span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-textSecondary">
            Created
          </p>
          <p className="text-lg font-semibold text-neutral-text">
            {formatDate(workOrder.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-textSecondary">
            Estimate
          </p>
          <p className="text-2xl font-bold text-neutral-text">
            {formatCurrency(workOrder.totalEstimate)}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Issue details">
          <p className="text-sm text-neutral-textSecondary">
            {workOrder.issueDescription}
          </p>
        </Card>

        <Card title="Photos">
          <div className="flex flex-wrap gap-3">
            {workOrder.photos.map((photo) => (
              <img
                key={photo}
                src={photo}
                alt="Work order"
                className="h-24 w-24 rounded-xl object-cover"
              />
            ))}
            {workOrder.photos.length === 0 && (
              <p className="text-sm text-neutral-textSecondary">
                No photos attached.
              </p>
            )}
          </div>
        </Card>

        <Card title="Parts">
          <div className="space-y-2">
            {workOrder.parts.map((part) => (
              <div
                key={part.partId}
                className="flex items-center justify-between rounded-xl border border-neutral-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-text">
                    {part.name}
                  </p>
                  <p className="text-xs text-neutral-textSecondary">
                    {part.quantity} × {formatCurrency(part.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-neutral-text">
                  {formatCurrency(part.unitPrice * part.quantity)}
                </p>
              </div>
            ))}
            {workOrder.parts.length === 0 && (
              <p className="text-sm text-neutral-textSecondary">
                No parts suggested.
              </p>
            )}
          </div>
        </Card>

        <Card title="Labor summary">
          <p className="text-sm text-neutral-textSecondary">
            {workOrder.laborHours} hours @ {formatCurrency(workOrder.laborRate)} /hr
          </p>
          <p className="text-lg font-semibold text-neutral-text">
            {formatCurrency(workOrder.laborHours * workOrder.laborRate)}
          </p>
        </Card>
      </div>

      {canEditDraft && (
        <Card title="Draft Actions">
          <p className="text-sm text-neutral-textSecondary mb-4">
            This work order is saved as a draft. You can edit it or submit it for manager approval.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-text">Technician Notes</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-2xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                value={technicianNotes}
                onChange={(event) => setTechnicianNotes(event.target.value)}
                placeholder="Add notes for the manager..."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                to={`/rvs/${workOrder.rvId}/work-orders/${workOrderId}/edit`}
                className="rounded-xl border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text text-center hover:bg-gray-50"
              >
                Edit Details
              </Link>
              <button
                type="button"
                onClick={handleSaveTechNotes}
                disabled={isPending}
                className="rounded-xl border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Notes'}
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('submitted')}
                disabled={isPending}
                className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card disabled:opacity-50"
              >
                {isPending ? 'Submitting...' : 'Submit to Manager'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {canManage && (
        <Card title="Manager notes">
          <textarea
            rows={4}
            className="w-full rounded-2xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            value={managerNotes}
            onChange={(event) => setManagerNotes(event.target.value)}
            placeholder="Document conversations or approval details"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveManagerNotes}
              disabled={isPending}
              className="rounded-xl border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text disabled:opacity-50"
            >
              Save note
            </button>
            {approvalActions}
          </div>
        </Card>
      )}

      {settings && (
        <Card title="Terms">
          <p className="text-sm text-neutral-textSecondary">
            {settings.defaultTerms}
          </p>
        </Card>
      )}

      {showSendModal && customer && (
        <SendToCustomerModal
          workOrderId={workOrderId!}
          customer={customer}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false);
            queryInvalidations();
          }}
        />
      )}
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
    <h2 className="text-lg font-semibold text-neutral-text">{title}</h2>
    <div className="mt-2">{children}</div>
  </section>
);

interface SendToCustomerModalProps {
  workOrderId: string;
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

const SendToCustomerModal = ({
  workOrderId,
  customer,
  onClose,
  onSuccess,
}: SendToCustomerModalProps) => {
  const [deliveryMethod, setDeliveryMethod] = useState<'sms' | 'email'>('sms');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setIsSending(true);
    setError(null);

    try {
      const result = await supabaseApi.sendToCustomer(workOrderId, deliveryMethod);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to send. Please try again.');
      }
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 px-4 py-6 sm:flex sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-neutral-text">
          Send to Customer for Approval
        </h2>
        <p className="mt-2 text-sm text-neutral-textSecondary">
          The customer will receive a link to review and approve this estimate.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-neutral-text">
            How would you like to send it?
          </p>

          <label className="flex items-center gap-3 rounded-xl border border-neutral-border p-4 cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="deliveryMethod"
              value="sms"
              checked={deliveryMethod === 'sms'}
              onChange={() => setDeliveryMethod('sms')}
              className="h-4 w-4 text-brand-accent"
            />
            <DevicePhoneMobileIcon className="h-5 w-5 text-neutral-textSecondary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-text">SMS</p>
              <p className="text-xs text-neutral-textSecondary">{customer.phone}</p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-neutral-border p-4 cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="deliveryMethod"
              value="email"
              checked={deliveryMethod === 'email'}
              onChange={() => setDeliveryMethod('email')}
              className="h-4 w-4 text-brand-accent"
            />
            <EnvelopeIcon className="h-5 w-5 text-neutral-textSecondary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-text">Email</p>
              <p className="text-xs text-neutral-textSecondary">{customer.email}</p>
            </div>
          </label>
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
            onClick={handleSend}
            disabled={isSending}
            className="flex-1 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-card disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
