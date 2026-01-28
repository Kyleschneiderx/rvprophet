export type Role = 'owner' | 'manager' | 'technician';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface RV {
  id: string;
  customerId: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  nickname?: string;
  notes?: string;
}

export type WorkOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'pending_customer_approval'
  | 'customer_approved'
  | 'customer_rejected'
  | 'completed';

export interface WorkOrderPart {
  partId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface WorkOrder {
  id: string;
  rvId: string;
  customerId: string;
  issueDescription: string;
  photos: string[];
  parts: WorkOrderPart[];
  laborHours: number;
  laborRate: number;
  status: WorkOrderStatus;
  technicianNotes?: string;
  managerNotes?: string;
  technicianId?: string;
  createdAt: string;
  updatedAt: string;
  totalEstimate: number;
}

export interface Part {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  inStockQty: number;
}

export interface DealershipSettings {
  dealershipName: string;
  defaultLaborRate: number;
  currencySymbol: string;
  phone: string;
  email: string;
  defaultTerms: string;
  partsMarkupPercent: number;
  techniciansSeePricing: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: Role[] | 'all';
  createdAt: string;
  actionLabel?: string;
  actionLink?: string;
}

export type NotificationType =
  | 'work_order_submitted'
  | 'work_order_approved'
  | 'work_order_rejected'
  | 'customer_approved'
  | 'customer_rejected'
  | 'general';

export interface Notification {
  id: string;
  userId: string;
  dealershipId: string;
  title: string;
  message: string;
  type: NotificationType;
  workOrderId: string | null;
  read: boolean;
  createdAt: string;
}

