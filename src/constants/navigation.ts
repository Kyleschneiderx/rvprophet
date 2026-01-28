import {
  ChartBarIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import type { Role } from '../types';

export type NavItem = {
  name: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  roles: Role[];
};

export const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    to: '/',
    icon: Squares2X2Icon,
    roles: ['owner', 'manager', 'technician'],
  },
  {
    name: 'Customers',
    to: '/customers',
    icon: UsersIcon,
    roles: ['owner', 'manager', 'technician'],
  },
  {
    name: 'Parts',
    to: '/parts',
    icon: WrenchScrewdriverIcon,
    roles: ['owner', 'manager', 'technician'],
  },
  {
    name: 'Reports',
    to: '/reports',
    icon: ChartBarIcon,
    roles: ['owner', 'manager'],
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: Cog6ToothIcon,
    roles: ['owner'],
  },
];
