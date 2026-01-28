import clsx from 'clsx';
import { NavLink } from 'react-router-dom';
import { navItems } from '../../constants/navigation';
import { useRole } from '../../context/AuthContext';

export const MobileNav = () => {
  const { role } = useRole();
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-border bg-white px-2 py-2 shadow-card lg:hidden">
      <div className="flex items-stretch justify-around gap-1">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                'flex-1',
                isActive ? 'text-brand-accent' : 'text-neutral-textSecondary',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="mt-1">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

