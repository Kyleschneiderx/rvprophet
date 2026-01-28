import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import { useRole } from '../../context/AuthContext';
import { formatCurrency, formatDate, statusStyles } from '../../utils/formatters';

export const RvDetailPage = () => {
  const { rvId } = useParams();
  const { role } = useRole();

  const { data: rv, isLoading } = useQuery({
    queryKey: queryKeys.rv(rvId!),
    queryFn: () => api.getRVById(rvId!),
    enabled: Boolean(rvId),
  });

  const { data: customer } = useQuery({
    queryKey: rv ? queryKeys.customer(rv.customerId) : ['customer'],
    queryFn: () => api.getCustomerById(rv!.customerId),
    enabled: Boolean(rv),
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: queryKeys.workOrdersForRV(rvId!),
    queryFn: () => api.getWorkOrdersForRV(rvId!),
    enabled: Boolean(rvId),
  });

  if (isLoading || !rv) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-border p-6 text-sm text-neutral-textSecondary">
        Loading RV details…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-textSecondary">
            RV Detail
          </p>
          <h1 className="text-2xl font-semibold text-neutral-text">
            {rv.year} {rv.make} {rv.model}
          </h1>
          {rv.nickname && (
            <p className="text-sm text-neutral-textSecondary">“{rv.nickname}”</p>
          )}
          {customer && (
            <Link
              to={`/customers/${customer.id}`}
              className="mt-2 inline-flex text-sm font-semibold text-brand-accent"
            >
              {customer.name}
            </Link>
          )}
        </div>
        {(role === 'technician' || role === 'manager' || role === 'owner') && (
          <Link
            to={`/rvs/${rv.id}/work-orders/new`}
            className="inline-flex items-center justify-center rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-500"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            New work order
          </Link>
        )}
      </header>

      <section className="rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold text-neutral-text">Vehicle Info</h2>
        <dl className="mt-4 grid gap-4 text-sm text-neutral-textSecondary sm:grid-cols-2">
          <Detail label="Year" value={rv.year} />
          <Detail label="Make" value={rv.make} />
          <Detail label="Model" value={rv.model} />
          <Detail label="VIN" value={rv.vin} />
          {rv.nickname && <Detail label="Nickname" value={rv.nickname} />}
          {rv.notes && <Detail label="Notes" value={rv.notes} />}
        </dl>
      </section>

      <section className="space-y-4 rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-text">Work orders</h2>
            <p className="text-sm text-neutral-textSecondary">
              Track upsell opportunities for this RV.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {workOrders.map((order) => (
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
                    Estimate: {formatCurrency(order.totalEstimate)}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status].className}`}
                  >
                    {statusStyles[order.status].label}
                  </span>
                  <Link
                    to={`/work-orders/${order.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text transition hover:border-brand-accent hover:text-brand-accent"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </article>
          ))}
          {workOrders.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-border p-6 text-center text-sm text-neutral-textSecondary">
              No work orders yet. Tap “New work order” to capture opportunities.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-neutral-textSecondary">
      {label}
    </dt>
    <dd className="text-base font-semibold text-neutral-text">{value}</dd>
  </div>
);

