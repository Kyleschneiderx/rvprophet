import { NavLink } from 'react-router-dom';
import { navItems } from '../../constants/navigation';
import { useRole } from '../../context/AuthContext';
import clsx from 'clsx';

type SidebarProps = {
  onNavigate?: () => void;
  isMobile?: boolean;
};

export const Sidebar = ({ onNavigate, isMobile = false }: SidebarProps) => {
  const { role } = useRole();
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={clsx(
        'flex h-full flex-col bg-brand-dark text-white lg:w-56',
        isMobile ? 'p-6' : 'hidden pt-6 lg:flex lg:fixed lg:inset-y-0',
      )}
    >
      <div className="px-4">
        <div className="text-xs uppercase tracking-widest text-neutral-textTertiary">
          RV Prophet
        </div>
        <div className="mt-1 text-lg font-semibold">Service Upsell</div>
      </div>
      <nav className="mt-8 flex-1 space-y-1 px-2">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-darker text-white'
                  : 'text-neutral-300 hover:bg-white/10',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-4 pb-6 text-xs text-neutral-400">
        Designed for service bays. Mobile-first.
      </div>
    </aside>
  );
};

