import { useRole } from '../../context/AuthContext';
import type { Role } from '../../types';

const options: { label: string; value: Role }[] = [
  { label: 'Owner', value: 'owner' },
  { label: 'Manager', value: 'manager' },
  { label: 'Technician', value: 'technician' },
];

export const RoleSwitcher = () => {
  const { role, setRole } = useRole();

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-textSecondary sm:text-sm">
      <span className="text-neutral-textSecondary">Current role</span>
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
        className="rounded-lg border border-neutral-border bg-white px-3 py-2 text-sm font-semibold text-neutral-text focus:border-brand-accent focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

