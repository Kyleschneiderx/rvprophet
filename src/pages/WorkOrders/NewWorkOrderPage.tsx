import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import type { WorkOrderPart, WorkOrderStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const NewWorkOrderPage = () => {
  const { rvId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: rv } = useQuery({
    queryKey: queryKeys.rv(rvId!),
    queryFn: () => api.getRVById(rvId!),
    enabled: Boolean(rvId),
  });

  const { data: customer } = useQuery({
    queryKey: rv ? queryKeys.customer(rv.customerId) : ['customer'],
    queryFn: () => api.getCustomerById(rv!.customerId),
    enabled: Boolean(rv),
  });

  const { data: partsData = [] } = useQuery({
    queryKey: queryKeys.parts(),
    queryFn: () => api.getParts(),
  });

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.getSettings(),
  });

  const [issueDescription, setIssueDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [parts, setParts] = useState<WorkOrderPart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [laborHours, setLaborHours] = useState(1.5);
  const [laborRateOverride, setLaborRateOverride] = useState<number | null>(null);
  const [technicianNotes, setTechnicianNotes] = useState('');

  const laborRate = laborRateOverride ?? settings?.defaultLaborRate ?? 140;
  const setLaborRate = (value: number) => setLaborRateOverride(value);

  const markupMultiplier = useMemo(() => {
    if (!settings) return 1;
    return 1 + settings.partsMarkupPercent / 100;
  }, [settings]);

  const partsSubtotal = parts.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const laborSubtotal = laborHours * laborRate;
  const totalEstimate = partsSubtotal + laborSubtotal;

  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: {
      status: WorkOrderStatus;
    }) =>
      api.createWorkOrder(rvId!, {
        customerId: rv!.customerId,
        issueDescription,
        photos,
        parts,
        laborHours,
        laborRate,
        status: payload.status,
        technicianNotes,
        managerNotes: '',
        technicianId: profile?.id,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrdersForRV(rvId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders });
      const message = variables.status === 'draft'
        ? 'Work order saved as draft'
        : 'Work order submitted to manager';
      setSubmitMessage({ type: 'success', text: message });
      setTimeout(() => navigate(`/rvs/${rvId}`), 1500);
    },
    onError: (error) => {
      setSubmitMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save work order' });
    },
  });

  const handleAddPart = () => {
    const part = partsData.find((p) => p.id === selectedPartId);
    if (!part) return;
    const priceWithMarkup = part.price * markupMultiplier;
    setParts((prev) => [
      ...prev,
      {
        partId: part.id,
        name: part.name,
        unitPrice: Number(priceWithMarkup.toFixed(2)),
        quantity: 1,
      },
    ]);
    setSelectedPartId('');
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const readers: Promise<string>[] = [];
    Array.from(files).forEach((file) => {
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }),
      );
    });
    const images = await Promise.all(readers);
    setPhotos((prev) => [...prev, ...images].slice(0, 3));
  };

  const handleSubmit = async (status: WorkOrderStatus) => {
    if (!rv) return;
    await mutateAsync({ status });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-textSecondary">
            Work order
          </p>
          <h1 className="text-2xl font-semibold text-neutral-text">
            {rv ? `${rv.year} ${rv.make} ${rv.model}` : 'Loading RV…'}
          </h1>
          {customer && (
            <Link to={`/customers/${customer.id}`} className="text-sm text-brand-accent">
              {customer.name}
            </Link>
          )}
        </div>
        <Link
          to={`/rvs/${rvId}`}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to RV
        </Link>
      </header>

      <section className="space-y-4">
        <Card>
          <SectionTitle title="Issue" description="Describe what you found." />
          <textarea
            className="mt-3 w-full rounded-2xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            rows={4}
            value={issueDescription}
            onChange={(event) => setIssueDescription(event.target.value)}
            placeholder="Example: Noticed hairline crack in skylight while resealing roof. Recommend replacement before leak worsens."
          />
        </Card>

        <Card>
          <SectionTitle
            title="Photos"
            description="Add up to three quick reference photos."
          />
          <div className="mt-3 flex flex-wrap gap-3">
            {photos.map((photo, index) => (
              <div key={photo} className="relative h-28 w-28 overflow-hidden rounded-xl border border-neutral-border">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                  onClick={() =>
                    setPhotos((prev) => prev.filter((p) => p !== photo))
                  }
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-border text-center text-xs text-neutral-textSecondary">
                <PhotoIcon className="mb-1 h-6 w-6" />
                Add photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Parts"
            description="Pull straight from inventory with markup applied."
          />
          <div className="mt-3 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedPartId}
                onChange={(event) => setSelectedPartId(event.target.value)}
                className="flex-1 rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
              >
                <option value="">Select a part</option>
                {partsData.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.name} · {formatCurrency(part.price * markupMultiplier)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddPart}
                disabled={!selectedPartId}
                className="rounded-xl bg-neutral-text text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {parts.map((part, index) => (
                <div
                  key={`${part.partId}-${index}`}
                  className="flex flex-col gap-2 rounded-2xl border border-neutral-border p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-text">
                      {part.name}
                    </p>
                    <p className="text-xs text-neutral-textSecondary">
                      {formatCurrency(part.unitPrice)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-neutral-textSecondary">
                      Qty
                      <input
                        type="number"
                        min={1}
                        value={part.quantity}
                        onChange={(event) => {
                          const qty = Number(event.target.value);
                          setParts((prev) =>
                            prev.map((item, idx) =>
                              idx === index ? { ...item, quantity: qty } : item,
                            ),
                          );
                        }}
                        className="ml-2 w-16 rounded-lg border border-neutral-border px-2 py-1 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setParts((prev) =>
                          prev.filter((_, idx) => idx !== index),
                        )
                      }
                      className="text-xs font-semibold text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {parts.length === 0 && (
                <div className="rounded-xl border border-dashed border-neutral-border p-4 text-sm text-neutral-textSecondary">
                  No parts added yet.
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Labor"
            description="Quick math for technician time."
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-neutral-text">
              Hours
              <input
                type="number"
                min={0}
                step={0.25}
                value={laborHours}
                onChange={(event) => setLaborHours(Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-neutral-text">
              Rate
              <input
                type="number"
                min={0}
                value={laborRate}
                onChange={(event) => setLaborRate(Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
              />
            </label>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Notes"
            description="Context for the manager or customer."
          />
          <textarea
            rows={3}
            value={technicianNotes}
            onChange={(event) => setTechnicianNotes(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            placeholder="Add technician notes"
          />
        </Card>

        <Card>
          <SectionTitle title="Summary" description="What the customer will see." />
          <dl className="mt-3 space-y-2 text-sm text-neutral-textSecondary">
            <div className="flex items-center justify-between">
              <dt>Parts</dt>
              <dd>{formatCurrency(partsSubtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Labor</dt>
              <dd>{formatCurrency(laborSubtotal)}</dd>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-neutral-text">
              <dt>Total</dt>
              <dd>{formatCurrency(totalEstimate)}</dd>
            </div>
          </dl>
          {submitMessage && (
            <div
              className={`mt-4 rounded-xl p-3 text-sm font-medium ${
                submitMessage.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {submitMessage.text}
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={isPending || !issueDescription || !rv}
              onClick={() => handleSubmit('draft')}
              className="rounded-xl border border-neutral-border px-4 py-3 text-sm font-semibold text-neutral-text disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save draft'}
            </button>
            <button
              type="button"
              disabled={isPending || !issueDescription || !rv}
              onClick={() => handleSubmit('submitted')}
              className="rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-accent/90 disabled:opacity-50"
            >
              {isPending ? 'Submitting...' : 'Submit to manager'}
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
};

const Card = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
    {children}
  </div>
);

const SectionTitle = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div>
    <h2 className="text-lg font-semibold text-neutral-text">{title}</h2>
    <p className="text-sm text-neutral-textSecondary">{description}</p>
  </div>
);

