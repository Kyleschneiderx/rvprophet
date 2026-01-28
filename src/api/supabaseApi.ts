import { supabase } from '../lib/supabase';
import type {
  Announcement,
  Customer,
  DealershipSettings,
  Part,
  RV,
  Role,
  User,
  WorkOrder,
  WorkOrderPart,
} from '../types';

// Helper to get current user's dealership ID
const getDealershipId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');
  return profile.dealership_id;
};

// Transform database row to app types
const transformCustomer = (row: {
  id: string;
  name: string;
  email: string;
  phone: string;
}): Customer => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
});

const transformRV = (row: {
  id: string;
  customer_id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  nickname: string | null;
  notes: string | null;
}): RV => ({
  id: row.id,
  customerId: row.customer_id,
  year: row.year,
  make: row.make,
  model: row.model,
  vin: row.vin,
  nickname: row.nickname ?? undefined,
  notes: row.notes ?? undefined,
});

const transformPart = (row: {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  in_stock_qty: number;
}): Part => ({
  id: row.id,
  name: row.name,
  sku: row.sku ?? undefined,
  description: row.description ?? undefined,
  price: row.price,
  inStockQty: row.in_stock_qty,
});

const transformWorkOrderPart = (row: {
  part_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}): WorkOrderPart => ({
  partId: row.part_id,
  name: row.name,
  unitPrice: row.unit_price,
  quantity: row.quantity,
});

const transformWorkOrder = (
  row: {
    id: string;
    rv_id: string;
    customer_id: string;
    issue_description: string;
    labor_hours: number;
    labor_rate: number;
    status: string;
    technician_notes: string | null;
    manager_notes: string | null;
    technician_id: string | null;
    total_estimate: number;
    created_at: string;
    updated_at: string;
    approval_token?: string | null;
    approval_token_expires_at?: string | null;
    customer_notes?: string | null;
  },
  parts: WorkOrderPart[],
  photos: string[]
): WorkOrder => ({
  id: row.id,
  rvId: row.rv_id,
  customerId: row.customer_id,
  issueDescription: row.issue_description,
  photos,
  parts,
  laborHours: row.labor_hours,
  laborRate: row.labor_rate,
  status: row.status as WorkOrder['status'],
  technicianNotes: row.technician_notes ?? undefined,
  managerNotes: row.manager_notes ?? undefined,
  technicianId: row.technician_id ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  totalEstimate: row.total_estimate,
});

const transformUser = (row: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role as Role,
  status: row.status as 'active' | 'inactive',
});

const transformAnnouncement = (row: {
  id: string;
  title: string;
  message: string;
  audience: string[];
  action_label: string | null;
  action_link: string | null;
  created_at: string;
}): Announcement => ({
  id: row.id,
  title: row.title,
  message: row.message,
  audience: row.audience.includes('all') ? 'all' : (row.audience as Role[]),
  createdAt: row.created_at,
  actionLabel: row.action_label ?? undefined,
  actionLink: row.action_link ?? undefined,
});

const transformSettings = (row: {
  name: string;
  phone: string | null;
  email: string | null;
  default_labor_rate: number;
  currency_symbol: string;
  default_terms: string | null;
  parts_markup_percent: number;
  technicians_see_pricing: boolean;
}): DealershipSettings => ({
  dealershipName: row.name,
  phone: row.phone ?? '',
  email: row.email ?? '',
  defaultLaborRate: row.default_labor_rate,
  currencySymbol: row.currency_symbol,
  defaultTerms: row.default_terms ?? '',
  partsMarkupPercent: row.parts_markup_percent,
  techniciansSeePricing: row.technicians_see_pricing,
});

export const supabaseApi = {
  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    const dealershipId = await getDealershipId();

    let query = supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(transformCustomer);
  },

  async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    const dealershipId = await getDealershipId();

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        dealership_id: dealershipId,
        name: data.name,
        email: data.email,
        phone: data.phone,
      })
      .select('id, name, email, phone')
      .single();

    if (error) throw new Error(error.message);
    return transformCustomer(customer);
  },

  async getCustomerById(id: string): Promise<Customer> {
    const dealershipId = await getDealershipId();

    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('id', id)
      .eq('dealership_id', dealershipId)
      .single();

    if (error) throw new Error('Customer not found');
    return transformCustomer(data);
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const dealershipId = await getDealershipId();

    const { data: customer, error } = await supabase
      .from('customers')
      .update({
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
      })
      .eq('id', id)
      .eq('dealership_id', dealershipId)
      .select('id, name, email, phone')
      .single();

    if (error) throw new Error(error.message);
    return transformCustomer(customer);
  },

  async getCustomerRVs(customerId: string): Promise<RV[]> {
    const { data, error } = await supabase
      .from('rvs')
      .select('id, customer_id, year, make, model, vin, nickname, notes')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(transformRV);
  },

  // RVs
  async createRV(customerId: string, data: Omit<RV, 'id' | 'customerId'>): Promise<RV> {
    const dealershipId = await getDealershipId();

    const { data: rv, error } = await supabase
      .from('rvs')
      .insert({
        dealership_id: dealershipId,
        customer_id: customerId,
        year: data.year,
        make: data.make,
        model: data.model,
        vin: data.vin,
        nickname: data.nickname ?? null,
        notes: data.notes ?? null,
      })
      .select('id, customer_id, year, make, model, vin, nickname, notes')
      .single();

    if (error) throw new Error(error.message);
    return transformRV(rv);
  },

  async getRVById(rvId: string): Promise<RV> {
    const dealershipId = await getDealershipId();

    const { data, error } = await supabase
      .from('rvs')
      .select('id, customer_id, year, make, model, vin, nickname, notes')
      .eq('id', rvId)
      .eq('dealership_id', dealershipId)
      .single();

    if (error) throw new Error('RV not found');
    return transformRV(data);
  },

  // Work Orders
  async getWorkOrdersForRV(rvId: string): Promise<WorkOrder[]> {
    const { data: orders, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('rv_id', rvId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!orders) return [];

    // Fetch parts and photos for each work order
    const workOrders = await Promise.all(
      orders.map(async (order) => {
        const [partsResult, photosResult] = await Promise.all([
          supabase
            .from('work_order_parts')
            .select('part_id, name, unit_price, quantity')
            .eq('work_order_id', order.id),
          supabase
            .from('work_order_photos')
            .select('storage_path')
            .eq('work_order_id', order.id),
        ]);

        const parts = (partsResult.data ?? []).map(transformWorkOrderPart);
        const photos = (photosResult.data ?? []).map((p) => p.storage_path);

        return transformWorkOrder(order, parts, photos);
      })
    );

    return workOrders;
  },

  async getWorkOrders(): Promise<WorkOrder[]> {
    const dealershipId = await getDealershipId();

    const { data: orders, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!orders) return [];

    // Fetch parts and photos for each work order
    const workOrders = await Promise.all(
      orders.map(async (order) => {
        const [partsResult, photosResult] = await Promise.all([
          supabase
            .from('work_order_parts')
            .select('part_id, name, unit_price, quantity')
            .eq('work_order_id', order.id),
          supabase
            .from('work_order_photos')
            .select('storage_path')
            .eq('work_order_id', order.id),
        ]);

        const parts = (partsResult.data ?? []).map(transformWorkOrderPart);
        const photos = (photosResult.data ?? []).map((p) => p.storage_path);

        return transformWorkOrder(order, parts, photos);
      })
    );

    return workOrders;
  },

  async getWorkOrderById(id: string): Promise<WorkOrder> {
    const dealershipId = await getDealershipId();

    const { data: order, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .eq('dealership_id', dealershipId)
      .single();

    if (error) throw new Error('Work order not found');

    const [partsResult, photosResult] = await Promise.all([
      supabase
        .from('work_order_parts')
        .select('part_id, name, unit_price, quantity')
        .eq('work_order_id', id),
      supabase
        .from('work_order_photos')
        .select('storage_path')
        .eq('work_order_id', id),
    ]);

    const parts = (partsResult.data ?? []).map(transformWorkOrderPart);
    const photos = (photosResult.data ?? []).map((p) => p.storage_path);

    return transformWorkOrder(order, parts, photos);
  },

  async createWorkOrder(
    rvId: string,
    data: Omit<WorkOrder, 'id' | 'rvId' | 'customerId' | 'createdAt' | 'updatedAt' | 'totalEstimate'> & {
      customerId: string;
    }
  ): Promise<WorkOrder> {
    const dealershipId = await getDealershipId();

    // Get settings for markup
    const { data: settings } = await supabase
      .from('dealerships')
      .select('parts_markup_percent, default_labor_rate')
      .eq('id', dealershipId)
      .single();

    const markupPercent = settings?.parts_markup_percent ?? 0;

    // Apply markup to parts
    const partsWithMarkup = await Promise.all(
      data.parts.map(async (part) => {
        const { data: partData } = await supabase
          .from('parts')
          .select('price, name')
          .eq('id', part.partId)
          .single();

        const basePrice = partData?.price ?? part.unitPrice;
        const markedUpPrice = basePrice + basePrice * (markupPercent / 100);

        return {
          ...part,
          name: partData?.name ?? part.name,
          unitPrice: markedUpPrice,
        };
      })
    );

    // Calculate total
    const partsTotal = partsWithMarkup.reduce(
      (sum, part) => sum + part.unitPrice * part.quantity,
      0
    );
    const laborTotal = data.laborHours * data.laborRate;
    const totalEstimate = partsTotal + laborTotal;

    // Create work order
    const { data: order, error } = await supabase
      .from('work_orders')
      .insert({
        dealership_id: dealershipId,
        rv_id: rvId,
        customer_id: data.customerId,
        issue_description: data.issueDescription,
        labor_hours: data.laborHours,
        labor_rate: data.laborRate,
        status: data.status,
        technician_notes: data.technicianNotes ?? null,
        manager_notes: data.managerNotes ?? null,
        technician_id: data.technicianId ?? null,
        total_estimate: totalEstimate,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Insert parts
    if (partsWithMarkup.length > 0) {
      const { error: partsError } = await supabase.from('work_order_parts').insert(
        partsWithMarkup.map((part) => ({
          work_order_id: order.id,
          part_id: part.partId,
          name: part.name,
          unit_price: part.unitPrice,
          quantity: part.quantity,
        }))
      );
      if (partsError) throw new Error(partsError.message);
    }

    // Insert photo references (photos should already be uploaded to storage)
    if (data.photos.length > 0) {
      const { error: photosError } = await supabase.from('work_order_photos').insert(
        data.photos.map((path) => ({
          work_order_id: order.id,
          storage_path: path,
          filename: path.split('/').pop() ?? 'photo',
        }))
      );
      if (photosError) throw new Error(photosError.message);
    }

    return transformWorkOrder(order, partsWithMarkup, data.photos);
  },

  async updateWorkOrder(
    id: string,
    data: Partial<Omit<WorkOrder, 'id' | 'rvId' | 'customerId' | 'totalEstimate'>>
  ): Promise<WorkOrder> {
    const dealershipId = await getDealershipId();

    // Get current work order for calculations
    const current = await this.getWorkOrderById(id);

    // Calculate new total if parts or labor changed
    const parts = data.parts ?? current.parts;
    const laborHours = data.laborHours ?? current.laborHours;
    const laborRate = data.laborRate ?? current.laborRate;

    const partsTotal = parts.reduce(
      (sum, part) => sum + part.unitPrice * part.quantity,
      0
    );
    const totalEstimate = partsTotal + laborHours * laborRate;

    // Update work order
    const { data: order, error } = await supabase
      .from('work_orders')
      .update({
        ...(data.issueDescription !== undefined && { issue_description: data.issueDescription }),
        ...(data.laborHours !== undefined && { labor_hours: data.laborHours }),
        ...(data.laborRate !== undefined && { labor_rate: data.laborRate }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.technicianNotes !== undefined && { technician_notes: data.technicianNotes }),
        ...(data.managerNotes !== undefined && { manager_notes: data.managerNotes }),
        ...(data.technicianId !== undefined && { technician_id: data.technicianId }),
        total_estimate: totalEstimate,
      })
      .eq('id', id)
      .eq('dealership_id', dealershipId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Update parts if provided
    if (data.parts) {
      // Delete existing parts
      await supabase.from('work_order_parts').delete().eq('work_order_id', id);

      // Insert new parts
      if (data.parts.length > 0) {
        await supabase.from('work_order_parts').insert(
          data.parts.map((part) => ({
            work_order_id: id,
            part_id: part.partId,
            name: part.name,
            unit_price: part.unitPrice,
            quantity: part.quantity,
          }))
        );
      }
    }

    // Update photos if provided
    if (data.photos) {
      // Delete existing photo references
      await supabase.from('work_order_photos').delete().eq('work_order_id', id);

      // Insert new photo references
      if (data.photos.length > 0) {
        await supabase.from('work_order_photos').insert(
          data.photos.map((path) => ({
            work_order_id: id,
            storage_path: path,
            filename: path.split('/').pop() ?? 'photo',
          }))
        );
      }
    }

    return transformWorkOrder(order, parts, data.photos ?? current.photos);
  },

  // Parts
  async getParts(search?: string): Promise<Part[]> {
    const dealershipId = await getDealershipId();

    let query = supabase
      .from('parts')
      .select('id, name, sku, description, price, in_stock_qty')
      .eq('dealership_id', dealershipId)
      .order('name');

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(transformPart);
  },

  async createPart(data: Omit<Part, 'id'>): Promise<Part> {
    const dealershipId = await getDealershipId();

    const { data: part, error } = await supabase
      .from('parts')
      .insert({
        dealership_id: dealershipId,
        name: data.name,
        sku: data.sku ?? null,
        description: data.description ?? null,
        price: data.price,
        in_stock_qty: data.inStockQty,
      })
      .select('id, name, sku, description, price, in_stock_qty')
      .single();

    if (error) throw new Error(error.message);
    return transformPart(part);
  },

  async updatePart(id: string, data: Partial<Part>): Promise<Part> {
    const dealershipId = await getDealershipId();

    const { data: part, error } = await supabase
      .from('parts')
      .update({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.inStockQty !== undefined && { in_stock_qty: data.inStockQty }),
      })
      .eq('id', id)
      .eq('dealership_id', dealershipId)
      .select('id, name, sku, description, price, in_stock_qty')
      .single();

    if (error) throw new Error(error.message);
    return transformPart(part);
  },

  // Settings
  async getSettings(): Promise<DealershipSettings> {
    const dealershipId = await getDealershipId();

    const { data, error } = await supabase
      .from('dealerships')
      .select('name, phone, email, default_labor_rate, currency_symbol, default_terms, parts_markup_percent, technicians_see_pricing')
      .eq('id', dealershipId)
      .single();

    if (error) throw new Error(error.message);
    return transformSettings(data);
  },

  async updateSettings(partial: Partial<DealershipSettings>): Promise<DealershipSettings> {
    const dealershipId = await getDealershipId();

    const { data, error } = await supabase
      .from('dealerships')
      .update({
        ...(partial.dealershipName !== undefined && { name: partial.dealershipName }),
        ...(partial.phone !== undefined && { phone: partial.phone }),
        ...(partial.email !== undefined && { email: partial.email }),
        ...(partial.defaultLaborRate !== undefined && { default_labor_rate: partial.defaultLaborRate }),
        ...(partial.currencySymbol !== undefined && { currency_symbol: partial.currencySymbol }),
        ...(partial.defaultTerms !== undefined && { default_terms: partial.defaultTerms }),
        ...(partial.partsMarkupPercent !== undefined && { parts_markup_percent: partial.partsMarkupPercent }),
        ...(partial.techniciansSeePricing !== undefined && { technicians_see_pricing: partial.techniciansSeePricing }),
      })
      .eq('id', dealershipId)
      .select('name, phone, email, default_labor_rate, currency_symbol, default_terms, parts_markup_percent, technicians_see_pricing')
      .single();

    if (error) throw new Error(error.message);
    return transformSettings(data);
  },

  // Users
  async getUsers(): Promise<User[]> {
    const dealershipId = await getDealershipId();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, status')
      .eq('dealership_id', dealershipId)
      .order('name');

    if (error) throw new Error(error.message);
    return (data ?? []).map(transformUser);
  },

  async createUser(data: Omit<User, 'id'> & { password: string }): Promise<User> {
    const dealershipId = await getDealershipId();

    // Get current session for auth header
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Call the create-user Edge Function with explicit auth header
    const { data: result, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        dealershipId,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create user');
    }

    if (!result?.success || !result?.user) {
      throw new Error(result?.error || 'Failed to create user');
    }

    return transformUser(result.user);
  },

  async updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    const dealershipId = await getDealershipId();

    const { data: user, error } = await supabase
      .from('profiles')
      .update({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
      })
      .eq('id', id)
      .eq('dealership_id', dealershipId)
      .select('id, name, email, role, status')
      .single();

    if (error) throw new Error(error.message);
    return transformUser(user);
  },

  // Announcements
  async getAnnouncements(currentRole?: Role): Promise<Announcement[]> {
    const dealershipId = await getDealershipId();

    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, message, audience, action_label, action_link, created_at')
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    let announcements = (data ?? []).map(transformAnnouncement);

    // Filter by role if provided
    if (currentRole) {
      announcements = announcements.filter(
        (a) => a.audience === 'all' || (Array.isArray(a.audience) && a.audience.includes(currentRole))
      );
    }

    return announcements;
  },

  async createAnnouncement(data: {
    title: string;
    message: string;
    audience: Role[] | 'all';
    actionLabel?: string;
    actionLink?: string;
  }): Promise<Announcement> {
    const dealershipId = await getDealershipId();

    const audienceArray = data.audience === 'all' ? ['all'] : data.audience;

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        dealership_id: dealershipId,
        title: data.title,
        message: data.message,
        audience: audienceArray,
        action_label: data.actionLabel ?? null,
        action_link: data.actionLink ?? null,
      })
      .select('id, title, message, audience, action_label, action_link, created_at')
      .single();

    if (error) throw new Error(error.message);
    return transformAnnouncement(announcement);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const dealershipId = await getDealershipId();

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
      .eq('dealership_id', dealershipId);

    if (error) throw new Error(error.message);
  },

  // Customer Approval - get work order by approval token (public)
  async getWorkOrderByApprovalToken(token: string): Promise<{
    workOrder: WorkOrder;
    dealership: DealershipSettings;
    rv: RV;
    customer: Customer;
  } | null> {
    const { data: order, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('approval_token', token)
      .gt('approval_token_expires_at', new Date().toISOString())
      .single();

    if (error || !order) return null;

    // Fetch related data
    const [partsResult, photosResult, rvResult, customerResult, dealershipResult] = await Promise.all([
      supabase
        .from('work_order_parts')
        .select('part_id, name, unit_price, quantity')
        .eq('work_order_id', order.id),
      supabase
        .from('work_order_photos')
        .select('storage_path')
        .eq('work_order_id', order.id),
      supabase
        .from('rvs')
        .select('id, customer_id, year, make, model, vin, nickname, notes')
        .eq('id', order.rv_id)
        .single(),
      supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('id', order.customer_id)
        .single(),
      supabase
        .from('dealerships')
        .select('name, phone, email, default_labor_rate, currency_symbol, default_terms, parts_markup_percent, technicians_see_pricing')
        .eq('id', order.dealership_id)
        .single(),
    ]);

    if (!rvResult.data || !customerResult.data || !dealershipResult.data) {
      return null;
    }

    const parts = (partsResult.data ?? []).map(transformWorkOrderPart);
    const photos = (photosResult.data ?? []).map((p) => p.storage_path);

    return {
      workOrder: transformWorkOrder(order, parts, photos),
      dealership: transformSettings(dealershipResult.data),
      rv: transformRV(rvResult.data),
      customer: transformCustomer(customerResult.data),
    };
  },

  // Send work order to customer for approval
  async sendToCustomer(
    workOrderId: string,
    deliveryMethod: 'sms' | 'email'
  ): Promise<{ success: boolean; error?: string }> {
    // This calls the Edge Function
    const { error } = await supabase.functions.invoke('generate-work-order', {
      body: { workOrderId, deliveryMethod },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  // Process customer approval/rejection (called from public approval page)
  async processApproval(
    token: string,
    action: 'approve' | 'reject',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.functions.invoke('process-approval', {
      body: { token, action, notes },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
