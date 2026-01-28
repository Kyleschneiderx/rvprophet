import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import { useRole } from '../../context/AuthContext';
import type { DealershipSettings, Role, User } from '../../types';

export const SettingsPage = () => {
  const { role } = useRole();
  const queryClient = useQueryClient();
  const [isAddingUser, setIsAddingUser] = useState(false);

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.getSettings(),
  });

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => api.getUsers(),
  });

  const { mutateAsync: updateSettings } = useMutation({
    mutationFn: (payload: Partial<DealershipSettings>) =>
      api.updateSettings(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
  });

  const { mutateAsync: updateUser } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      api.updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });

  const {
    mutateAsync: createUser,
    isPending: isCreatingUser,
  } = useMutation({
    mutationFn: (payload: Omit<User, 'id'> & { password: string }) => api.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setIsAddingUser(false);
    },
  });

  if (role !== 'owner') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
        Access denied. Only owners can adjust dealership settings.
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-border p-6 text-sm text-neutral-textSecondary">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-textSecondary">
          Owner settings
        </p>
        <h1 className="text-2xl font-semibold text-neutral-text">Control panel</h1>
        <p className="text-sm text-neutral-textSecondary">
          Manage dealership info, defaults, and team access.
        </p>
      </header>

      <SettingsCard title="Dealership">
        <DealershipForm settings={settings} onSave={updateSettings} />
      </SettingsCard>

      <SettingsCard title="Roles & users">
        <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-neutral-border bg-neutral-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-text">
              Control who can approve upsells
            </p>
            <p className="text-sm text-neutral-textSecondary">
              Tailor access for Owners, Managers, and Technicians.
            </p>
          </div>
          <button
            onClick={() => setIsAddingUser(true)}
            className="inline-flex items-center justify-center rounded-xl border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent"
          >
            Add user
          </button>
        </div>
        <div className="space-y-3">
          {users.map((user) => (
            <UserRow key={user.id} user={user} onUpdate={updateUser} />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Work order defaults">
        <WorkOrderSettings settings={settings} onSave={updateSettings} />
      </SettingsCard>

      {isAddingUser && (
        <AddUserModal
          onClose={() => setIsAddingUser(false)}
          onSubmit={async (payload) => {
            await createUser(payload);
          }}
          isSubmitting={isCreatingUser}
        />
      )}
    </div>
  );
};

const DealershipForm = ({
  settings,
  onSave,
}: {
  settings: DealershipSettings;
  onSave: (data: Partial<DealershipSettings>) => Promise<DealershipSettings>;
}) => {
  const [form, setForm] = useState({
    dealershipName: settings.dealershipName,
    defaultLaborRate: settings.defaultLaborRate,
    currencySymbol: settings.currencySymbol,
    phone: settings.phone,
    email: settings.email,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <Input
        label="Dealership name"
        value={form.dealershipName}
        onChange={(value) => setForm((prev) => ({ ...prev, dealershipName: value }))}
      />
      <Input
        label="Default labor rate"
        type="number"
        value={String(form.defaultLaborRate)}
        onChange={(value) =>
          setForm((prev) => ({ ...prev, defaultLaborRate: Number(value) }))
        }
      />
      <Input
        label="Currency code"
        value={form.currencySymbol}
        onChange={(value) => setForm((prev) => ({ ...prev, currencySymbol: value }))}
      />
      <Input
        label="Phone"
        value={form.phone}
        onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
      />
      <Input
        label="Service email"
        value={form.email}
        onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
      />
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="w-full rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card sm:w-auto"
        >
          Save
        </button>
      </div>
    </form>
  );
};

const UserRow = ({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (payload: { id: string; data: Partial<User> }) => Promise<User>;
}) => {
  const [roleValue, setRoleValue] = useState<Role>(user.role);
  const [active, setActive] = useState(user.status === 'active');

  const handleRoleChange = async (value: Role) => {
    setRoleValue(value);
    await onUpdate({ id: user.id, data: { role: value } });
  };

  const handleStatusChange = async (value: boolean) => {
    setActive(value);
    await onUpdate({ id: user.id, data: { status: value ? 'active' : 'inactive' } });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-semibold text-neutral-text">{user.name}</p>
        <p className="text-sm text-neutral-textSecondary">{user.email}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={roleValue}
          onChange={(event) => handleRoleChange(event.target.value as Role)}
          className="rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        >
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="technician">Technician</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-text">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => handleStatusChange(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-border text-brand-accent focus:ring-brand-accent"
          />
          Active
        </label>
      </div>
    </div>
  );
};

const WorkOrderSettings = ({
  settings,
  onSave,
}: {
  settings: DealershipSettings;
  onSave: (data: Partial<DealershipSettings>) => Promise<DealershipSettings>;
}) => {
  const [form, setForm] = useState({
    defaultTerms: settings.defaultTerms,
    partsMarkupPercent: settings.partsMarkupPercent,
    techniciansSeePricing: settings.techniciansSeePricing,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="text-sm font-medium text-neutral-text">
        Default terms
        <textarea
          rows={3}
          value={form.defaultTerms}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, defaultTerms: event.target.value }))
          }
          className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </label>
      <Input
        label="Parts markup (%)"
        type="number"
        value={String(form.partsMarkupPercent)}
        onChange={(value) =>
          setForm((prev) => ({ ...prev, partsMarkupPercent: Number(value) }))
        }
      />
      <label className="flex items-center gap-3 text-sm font-semibold text-neutral-text">
        <input
          type="checkbox"
          checked={form.techniciansSeePricing}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              techniciansSeePricing: event.target.checked,
            }))
          }
          className="h-4 w-4 rounded border-neutral-border text-brand-accent focus:ring-brand-accent"
        />
        Technicians see final pricing
      </label>
      <button
        type="submit"
        className="w-full rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-card sm:w-auto"
      >
        Save work order defaults
      </button>
    </form>
  );
};

const Input = ({
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
  <label className="text-sm font-medium text-neutral-text">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
    />
  </label>
);

const SettingsCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="rounded-2xl border border-neutral-border bg-white p-4 shadow-card">
    <h2 className="text-lg font-semibold text-neutral-text">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

const AddUserModal = ({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (data: Omit<User, 'id'> & { password: string }) => Promise<void>;
  isSubmitting: boolean;
}) => {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;
    const active = formData.get('active') === 'on';
    await onSubmit({
      name,
      email,
      password,
      role,
      status: active ? 'active' : 'inactive',
    });
    event.currentTarget.reset();
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
        <div className="mb-4 text-center">
          <h3 className="text-xl font-semibold text-neutral-text">Add user</h3>
          <p className="text-sm text-neutral-textSecondary">
            Invite another teammate to the upsell flow.
          </p>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-text">
            Name
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-neutral-text">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-neutral-text">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 focus:border-brand-accent focus:outline-none"
              placeholder="Min 6 characters"
            />
          </label>
          <label className="text-sm font-medium text-neutral-text">
            Role
            <select
              name="role"
              defaultValue="technician"
              className="mt-1 w-full rounded-xl border border-neutral-border px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            >
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-text">
            <input
              type="checkbox"
              name="active"
              defaultChecked
              className="h-4 w-4 rounded border-neutral-border text-brand-accent focus:ring-brand-accent"
            />
            Active
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
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-card disabled:opacity-50"
          >
            Add user
          </button>
        </div>
      </form>
    </div>
  );
};

