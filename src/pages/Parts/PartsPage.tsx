import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import { useRole } from '../../context/AuthContext';
import type { Part } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const PartsPage = () => {
  const { role } = useRole();
  const [search, setSearch] = useState('');
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const canEdit = role === 'owner' || role === 'manager';

  const { data: parts = [], isLoading } = useQuery({
    queryKey: queryKeys.parts(search),
    queryFn: () => api.getParts(search),
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-text">Parts</h1>
          <p className="text-sm text-neutral-textSecondary">
            Pull inventory directly into work orders.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center justify-center rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-card"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add part
          </button>
        )}
      </header>

      <div className="rounded-2xl border border-neutral-border bg-white p-3 shadow-card">
        <input
          type="search"
          value={search}
          placeholder="Search by name or SKU"
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </div>

      <section className="space-y-3">
        {isLoading && (
          <div className="rounded-2xl border border-dashed border-neutral-border p-6 text-center text-sm text-neutral-textSecondary">
            Loading parts…
          </div>
        )}
        {parts.map((part) => (
          <article
            key={part.id}
            className="rounded-2xl border border-neutral-border bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-neutral-text">
                  {part.name}
                </p>
                <p className="text-sm text-neutral-textSecondary">
                  SKU: {part.sku || '—'}
                </p>
                <p className="text-sm text-neutral-textSecondary">{part.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-neutral-background px-3 py-1 font-semibold text-neutral-text">
                    {formatCurrency(part.price)}
                  </span>
                  <span className="rounded-full bg-warning-light/50 px-3 py-1 font-medium text-neutral-textSecondary">
                    In stock: {part.inStockQty}
                  </span>
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() => setEditingPart(part)}
                  className="self-start rounded-full border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text"
                >
                  Edit
                </button>
              )}
            </div>
          </article>
        ))}
        {!isLoading && parts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-border p-6 text-center text-sm text-neutral-textSecondary">
            No parts match that search.
          </div>
        )}
      </section>

      {isAdding && (
        <PartModal
          title="Add part"
          onClose={() => setIsAdding(false)}
          onSubmit={api.createPart}
        />
      )}
      {editingPart && (
        <PartModal
          title="Edit part"
          part={editingPart}
          onClose={() => setEditingPart(null)}
          onSubmit={(data) => api.updatePart(editingPart.id, data)}
        />
      )}
    </div>
  );
};

type PartModalProps = {
  title: string;
  part?: Part;
  onClose: () => void;
  onSubmit: (data: Omit<Part, 'id'>) => Promise<Part>;
};

const PartModal = ({ title, part, onClose, onSubmit }: PartModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: Omit<Part, 'id'>) => onSubmit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      onClose();
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await mutateAsync({
      name: formData.get('name') as string,
      sku: (formData.get('sku') as string) || undefined,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      inStockQty: Number(formData.get('inStockQty')),
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 px-4 py-6 sm:flex sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-neutral-text">{title}</h2>
        <div className="mt-4 space-y-3">
          <Input name="name" label="Part name" defaultValue={part?.name} required />
          <Input name="sku" label="SKU" defaultValue={part?.sku} />
          <Input
            name="description"
            label="Description"
            defaultValue={part?.description}
            required
          />
          <Input
            name="price"
            label="Price"
            type="number"
            step="0.01"
            defaultValue={part?.price}
            required
          />
          <Input
            name="inStockQty"
            label="In stock quantity"
            type="number"
            defaultValue={part?.inStockQty}
            required
          />
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
            className="flex-1 rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

const Input = ({
  label,
  name,
  type = 'text',
  defaultValue,
  required = false,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  step?: string;
}) => (
  <label className="text-sm font-medium text-neutral-text">
    {label}
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      required={required}
      step={step}
      className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
    />
  </label>
);

