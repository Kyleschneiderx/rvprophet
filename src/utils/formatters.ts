import type { WorkOrderStatus } from '../types';

export const formatCurrency = (value: number, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(value);
};

export const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const statusStyles: Record<
  WorkOrderStatus,
  { label: string; className: string }
> = {
  draft: { label: 'Draft', className: 'bg-neutral-200 text-neutral-700' },
  submitted: { label: 'Submitted', className: 'bg-warning-light text-warning' },
  approved: { label: 'Approved', className: 'bg-success-light text-success' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-600' },
  pending_customer_approval: { label: 'Awaiting Customer', className: 'bg-purple-100 text-purple-700' },
  customer_approved: { label: 'Customer Approved', className: 'bg-green-100 text-green-700' },
  customer_rejected: { label: 'Customer Rejected', className: 'bg-red-100 text-red-600' },
  completed: { label: 'Completed', className: 'bg-brand-accent/10 text-brand-accent' },
};

