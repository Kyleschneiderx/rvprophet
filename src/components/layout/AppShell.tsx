import { useQuery } from '@tanstack/react-query';
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { api } from '../../api';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { RoleSwitcher } from '../common/RoleSwitcher';
import { NotificationBell } from '../notifications/NotificationBell';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';

export const AppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.getSettings(),
  });

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-neutral-background text-neutral-text">
      <div className="lg:flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col lg:pl-56">
          <header className="sticky top-0 z-30 border-b border-neutral-border bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-4">
              <button
                className="rounded-lg border border-neutral-border p-2 lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-neutral-textSecondary">
                  {settings?.dealershipName || 'Dealership'}
                </span>
                <span className="text-lg font-semibold text-neutral-text">
                  Service Command Center
                </span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                {/* Notifications */}
                {isSupabaseConfigured && <NotificationBell />}

                {/* User info & role switcher */}
                {isSupabaseConfigured && profile ? (
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                      title="Sign out"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="hidden text-sm text-neutral-textSecondary sm:block">
                      Role-specific experience
                    </div>
                    <RoleSwitcher />
                  </>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 pb-24 lg:pb-8">
            <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <MobileNav />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-72 bg-brand-dark shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 text-white">
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-textTertiary">
                  RV Prophet
                </div>
                <div className="text-lg font-semibold">Navigation</div>
              </div>
              <button
                className="rounded-full border border-white/20 p-1 text-white"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <Sidebar isMobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
