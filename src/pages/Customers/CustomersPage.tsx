import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import type { Customer } from '../../types';

export const CustomersPage = () => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: queryKeys.customers(search),
    queryFn: () => api.getCustomers(search),
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-text">Customers</h1>
          <p className="text-sm text-neutral-textSecondary">
            Search and manage RV owners on the go.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center justify-center rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-500"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Add customer
        </button>
      </header>

      <div className="rounded-2xl border border-neutral-border bg-white p-3 shadow-card">
        <input
          type="search"
          value={search}
          placeholder="Search by name, email, or phone"
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="rounded-2xl border border-dashed border-neutral-border p-6 text-center text-sm text-neutral-textSecondary">
            Loading customers…
          </div>
        )}
        {!isLoading && customers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-border p-6 text-center text-sm text-neutral-textSecondary">
            No customers yet. Add your first one to get started.
          </div>
        )}
        <div className="space-y-3">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      </div>

      {isAdding && <AddCustomerSheet onClose={() => setIsAdding(false)} />}
    </div>
  );
};

const CustomerCard = ({ customer }: { customer: Customer }) => (
  <article className="rounded-2xl border border-neutral-border bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-lg font-semibold text-neutral-text">{customer.name}</p>
        <div className="text-sm text-neutral-textSecondary">
          <p>{customer.email}</p>
          <p>{customer.phone}</p>
        </div>
      </div>
      <Link
        to={`/customers/${customer.id}`}
        className="inline-flex items-center justify-center rounded-full border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text transition hover:border-brand-accent hover:text-brand-accent"
      >
        View
      </Link>
    </div>
  </article>
);

const AddCustomerSheet = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: Omit<Customer, 'id'>) => api.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await mutateAsync({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 px-4 py-6 sm:flex sm:items-end sm:justify-center"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-card transition"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold text-neutral-text">
            Add customer
          </h2>
          <p className="text-sm text-neutral-textSecondary">
            Quick capture for technicians on the floor.
          </p>
        </div>
        <div className="space-y-3">
          <label className="flex flex-col text-sm font-medium text-neutral-text">
            Full name
            <input
              name="name"
              required
              className="mt-1 rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-neutral-text">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-neutral-text">
            Phone
            <input
              name="phone"
              required
              className="mt-1 rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
            />
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
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-accent/90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

