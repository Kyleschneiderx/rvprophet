import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import type { Customer, RV } from '../../types';

export const CustomerDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: queryKeys.customer(customerId!),
    queryFn: () => api.getCustomerById(customerId!),
    enabled: Boolean(customerId),
  });

  const { data: rvList = [] } = useQuery({
    queryKey: queryKeys.customerRVs(customerId!),
    queryFn: () => api.getCustomerRVs(customerId!),
    enabled: Boolean(customerId),
  });

  useEffect(() => {
    if (isError) {
      navigate('/customers');
    }
  }, [isError, navigate]);

  if (isLoading || !customer) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-border p-6 text-sm text-neutral-textSecondary">
        Loading customer…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-textSecondary">
          Customer
        </p>
        <h1 className="text-2xl font-semibold text-neutral-text">{customer.name}</h1>
      </header>

      <CustomerForm customer={customer} />

      <section className="space-y-4 rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-text">RVs</h2>
            <p className="text-sm text-neutral-textSecondary">
              Quick glance at every rig tied to this customer.
            </p>
          </div>
        </div>
        <AddRVForm customerId={customer.id} />
        <div className="space-y-3">
          {rvList.map((rv) => (
            <RVCard key={rv.id} rv={rv} customerName={customer.name} />
          ))}
          {rvList.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-border p-6 text-center text-sm text-neutral-textSecondary">
              No RVs on file. Add one to begin tracking work orders.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const CustomerForm = ({ customer }: { customer: Customer }) => {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState(customer);

  useEffect(() => {
    setFormValues(customer);
  }, [customer]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: Partial<Customer>) =>
      api.updateCustomer(customer.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customer(customer.id),
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await mutateAsync(formValues);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-neutral-border bg-white p-4 shadow-card sm:grid-cols-2"
    >
      <InputField
        label="Full name"
        value={formValues.name}
        onChange={(value) => setFormValues((prev) => ({ ...prev, name: value }))}
      />
      <InputField
        label="Email"
        type="email"
        value={formValues.email}
        onChange={(value) => setFormValues((prev) => ({ ...prev, email: value }))}
      />
      <InputField
        label="Phone"
        value={formValues.phone}
        onChange={(value) => setFormValues((prev) => ({ ...prev, phone: value }))}
      />
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-accent/90 disabled:opacity-50 sm:w-auto"
        >
          Save changes
        </button>
      </div>
    </form>
  );
};

const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <label className="flex flex-col text-sm font-medium text-neutral-text">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
    />
  </label>
);

const AddRVForm = ({ customerId }: { customerId: string }) => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: Omit<RV, 'id' | 'customerId'>) =>
      api.createRV(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customerRVs(customerId) });
      setExpanded(false);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await mutateAsync({
      year: Number(formData.get('year')),
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      vin: formData.get('vin') as string,
      nickname: (formData.get('nickname') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    });
    event.currentTarget.reset();
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text"
      >
        <PlusIcon className="h-5 w-5" />
        Add RV
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-2xl border border-neutral-border bg-neutral-background/60 p-4 sm:grid-cols-2"
    >
      <Input label="Year" name="year" type="number" required />
      <Input label="Make" name="make" required />
      <Input label="Model" name="model" required />
      <Input label="VIN" name="vin" required />
      <Input label="Nickname (optional)" name="nickname" />
      <label className="sm:col-span-2 text-sm font-medium text-neutral-text">
        Notes
        <textarea
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
        />
      </label>
      <div className="sm:col-span-2 flex gap-3">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex-1 rounded-xl border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-500 disabled:opacity-50"
        >
          Save RV
        </button>
      </div>
    </form>
  );
};

const Input = ({
  label,
  name,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) => (
  <label className="text-sm font-medium text-neutral-text">
    {label}
    <input
      name={name}
      type={type}
      required={required}
      className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
    />
  </label>
);

const RVCard = ({ rv, customerName }: { rv: RV; customerName: string }) => (
  <article className="rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-neutral-textSecondary">
          {customerName}
        </p>
        <h3 className="text-lg font-semibold text-neutral-text">
          {rv.year} {rv.make} {rv.model}
        </h3>
        <p className="text-sm text-neutral-textSecondary">VIN: {rv.vin}</p>
        {rv.nickname && (
          <p className="text-sm text-neutral-textSecondary">
            Nickname: {rv.nickname}
          </p>
        )}
      </div>
      <Link
        to={`/rvs/${rv.id}`}
        className="inline-flex items-center justify-center rounded-full border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text transition hover:border-brand-accent hover:text-brand-accent"
      >
        View RV
      </Link>
    </div>
  </article>
);

