import { nanoid } from 'nanoid';
import type {
  Announcement,
  Customer,
  DealershipSettings,
  Part,
  RV,
  Role,
  User,
  WorkOrder,
} from '../types';

const randomDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 400));

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
};

const SETTINGS_KEY = 'rvprophet_settings';
const USERS_KEY = 'rvprophet_users';

const defaultSettings: DealershipSettings = {
  dealershipName: 'NorthStar RV Service Center',
  defaultLaborRate: 145,
  currencySymbol: 'USD',
  phone: '(480) 555-0199',
  email: 'service@northstar-rv.com',
  defaultTerms:
    'Customer authorizes this work and agrees to pay the total amount upon completion.',
  partsMarkupPercent: 12,
  techniciansSeePricing: true,
};

const seededUsers: User[] = [
  {
    id: nanoid(),
    name: 'Maya Torres',
    email: 'maya@northstar-rv.com',
    role: 'owner',
    status: 'active',
  },
  {
    id: nanoid(),
    name: 'Devin Holt',
    email: 'devin@northstar-rv.com',
    role: 'manager',
    status: 'active',
  },
  {
    id: nanoid(),
    name: 'Whitney Banks',
    email: 'whitney@northstar-rv.com',
    role: 'technician',
    status: 'active',
  },
  {
    id: nanoid(),
    name: 'Trevor Shaw',
    email: 'trevor@northstar-rv.com',
    role: 'technician',
    status: 'inactive',
  },
];

const storage = getStorage();

let settings: DealershipSettings =
  (storage && JSON.parse(storage.getItem(SETTINGS_KEY) || 'null')) ||
  defaultSettings;

let users: User[] =
  (storage && JSON.parse(storage.getItem(USERS_KEY) || 'null')) || seededUsers;

const persistSettings = () => {
  if (!storage) return;
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const persistUsers = () => {
  if (!storage) return;
  storage.setItem(USERS_KEY, JSON.stringify(users));
};

const ANNOUNCEMENTS_KEY = 'rvprophet_announcements';

const seededAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Service bay iPad rollout',
    message:
      'Pick up the new iPad mounts from the parts counter before your next shift.',
    audience: 'all',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
    actionLabel: 'View checklist',
    actionLink: '#',
  },
  {
    id: 'ann-2',
    title: 'Saturday overtime slots',
    message:
      'We opened six overtime spots for this Saturday. Ping Devin if you want in.',
    audience: ['technician'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'ann-3',
    title: 'Finance wants parts photos',
    message:
      'Attach at least one before/after photo for paint or body work upsells so finance can include them in approvals.',
    audience: ['technician', 'manager'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

let announcements: Announcement[] =
  (storage && JSON.parse(storage.getItem(ANNOUNCEMENTS_KEY) || 'null')) || seededAnnouncements;

const persistAnnouncements = () => {
  if (!storage) return;
  storage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
};

let customers: Customer[] = [
  {
    id: 'cust-ava',
    name: 'Ava Mitchell',
    email: 'ava.mitchell@example.com',
    phone: '(307) 227-8829',
  },
  {
    id: 'cust-lucas',
    name: 'Lucas Reed',
    email: 'lucas.reed@example.com',
    phone: '(312) 790-4488',
  },
  {
    id: 'cust-nia',
    name: 'Nia Patel',
    email: 'nia.patel@example.com',
    phone: '(415) 221-9940',
  },
];

let rvs: RV[] = [
  {
    id: 'rv-ace23',
    customerId: 'cust-ava',
    year: 2020,
    make: 'Airstream',
    model: 'Classic 30RBQ',
    vin: '1SMG4DL23LL900415',
    nickname: 'Silver Finch',
  },
  {
    id: 'rv-gl5',
    customerId: 'cust-ava',
    year: 2018,
    make: 'Winnebago',
    model: 'View 24J',
    vin: '1FDDS3FS8JDC73196',
  },
  {
    id: 'rv-lynx',
    customerId: 'cust-lucas',
    year: 2022,
    make: 'Grand Design',
    model: 'Imagine 2970RL',
    vin: '573TE3428N9921405',
    nickname: 'Weekend Warrior',
  },
  {
    id: 'rv-cascade',
    customerId: 'cust-nia',
    year: 2019,
    make: 'Tiffin',
    model: 'Allegro Red 37 PA',
    vin: '4UZAB2DT5KCKR2081',
  },
];

let parts: Part[] = [
  {
    id: 'part-1',
    name: 'Roof Vent Fan Kit',
    sku: 'RV-VENT-01',
    description: '12V variable speed roof vent with rain sensor',
    price: 329,
    inStockQty: 8,
  },
  {
    id: 'part-2',
    name: 'LED Light Strip Kit',
    sku: 'RV-LIGHT-42',
    description: 'Waterproof ambient lighting kit for awnings',
    price: 189,
    inStockQty: 15,
  },
  {
    id: 'part-3',
    name: 'Sealant Reseal Pack',
    sku: 'RV-SEAL-07',
    description: 'Full kit for roof seam reseal',
    price: 245,
    inStockQty: 5,
  },
  {
    id: 'part-4',
    name: 'Tankless Water Heater Upgrade',
    sku: 'RV-H2O-55',
    description: 'On-demand water heater conversion kit',
    price: 1249,
    inStockQty: 2,
  },
  {
    id: 'part-5',
    name: 'Smart Thermostat Bundle',
    sku: 'RV-CLIM-23',
    description: 'Dual-zone thermostat with mobile app controls',
    price: 499,
    inStockQty: 6,
  },
  {
    id: 'part-6',
    name: 'Skylight Lens Kit',
    sku: 'RV-SKY-18',
    description: 'Replacement skylight lens with UV coating',
    price: 189,
    inStockQty: 9,
  },
];

const computePartsSubtotal = (items: WorkOrder['parts']) =>
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

const buildWorkOrder = (
  options: Partial<WorkOrder> & { id: string; rvId: string; customerId: string },
): WorkOrder => {
  const base: WorkOrder = {
    id: options.id,
    rvId: options.rvId,
    customerId: options.customerId,
    issueDescription: options.issueDescription ?? '',
    photos: options.photos ?? [],
    parts: options.parts ?? [],
    laborHours: options.laborHours ?? 0,
    laborRate: options.laborRate ?? settings.defaultLaborRate,
    status: options.status ?? 'draft',
    technicianNotes: options.technicianNotes ?? '',
    managerNotes: options.managerNotes ?? '',
    technicianId: options.technicianId ?? 'tech-default',
    createdAt: options.createdAt ?? new Date().toISOString(),
    updatedAt: options.updatedAt ?? new Date().toISOString(),
    totalEstimate: 0,
  };
  const partsTotal = computePartsSubtotal(base.parts);
  const laborTotal = base.laborHours * base.laborRate;
  return { ...base, totalEstimate: partsTotal + laborTotal };
};

let workOrders: WorkOrder[] = [
  buildWorkOrder({
    id: 'wo-101',
    rvId: 'rv-ace23',
    customerId: 'cust-ava',
    issueDescription: 'Found oxidation on roof seams; recommend reseal.',
    parts: [
      {
        partId: 'part-3',
        name: 'Sealant Reseal Pack',
        unitPrice: 245,
        quantity: 1,
      },
    ],
    laborHours: 2.5,
    laborRate: 145,
    status: 'submitted',
    technicianNotes: 'Surface cleaned, ready for sealant after approval.',
  }),
  buildWorkOrder({
    id: 'wo-102',
    rvId: 'rv-lynx',
    customerId: 'cust-lucas',
    issueDescription:
      'Uneven cooling zones detected. Suggest smart thermostat upgrade.',
    parts: [
      {
        partId: 'part-5',
        name: 'Smart Thermostat Bundle',
        unitPrice: 499,
        quantity: 1,
      },
    ],
    laborHours: 1.5,
    laborRate: 145,
    status: 'approved',
    technicianNotes: 'Owner requested call once approved.',
    managerNotes: 'Approved 2 days ago.',
  }),
  buildWorkOrder({
    id: 'wo-103',
    rvId: 'rv-cascade',
    customerId: 'cust-nia',
    issueDescription: 'Discovered cracked skylight lens over shower.',
    parts: [
      {
        partId: 'part-6',
        name: 'Skylight Lens Kit',
        unitPrice: 189,
        quantity: 1,
      },
    ],
    laborHours: 1.75,
    laborRate: 145,
    status: 'draft',
    technicianNotes: 'Need confirmation on preferred tint.',
  }),
];

const findCustomer = (id: string) => customers.find((c) => c.id === id);
const findRV = (id: string) => rvs.find((rv) => rv.id === id);
const findWorkOrder = (id: string) => workOrders.find((wo) => wo.id === id);
const findPart = (id: string) => parts.find((part) => part.id === id);

const applyMarkup = (price: number) =>
  price + price * (settings.partsMarkupPercent / 100);

export const mockApi = {
  async getCustomers(search?: string) {
    await randomDelay();
    if (!search) return clone(customers);
    const term = search.toLowerCase();
    return clone(
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(term) ||
          customer.email.toLowerCase().includes(term) ||
          customer.phone.toLowerCase().includes(term),
      ),
    );
  },

  async createCustomer(data: Omit<Customer, 'id'>) {
    await randomDelay();
    const newCustomer = { ...data, id: nanoid() };
    customers = [newCustomer, ...customers];
    return clone(newCustomer);
  },

  async getCustomerById(id: string) {
    await randomDelay();
    const customer = findCustomer(id);
    if (!customer) throw new Error('Customer not found');
    return clone(customer);
  },

  async updateCustomer(id: string, data: Partial<Customer>) {
    await randomDelay();
    customers = customers.map((customer) =>
      customer.id === id ? { ...customer, ...data } : customer,
    );
    return clone(findCustomer(id)!);
  },

  async getCustomerRVs(customerId: string) {
    await randomDelay();
    return clone(rvs.filter((rv) => rv.customerId === customerId));
  },

  async createRV(customerId: string, data: Omit<RV, 'id' | 'customerId'>) {
    await randomDelay();
    const newRV: RV = { ...data, customerId, id: nanoid() };
    rvs = [newRV, ...rvs];
    return clone(newRV);
  },

  async getRVById(rvId: string) {
    await randomDelay();
    const rv = findRV(rvId);
    if (!rv) throw new Error('RV not found');
    return clone(rv);
  },

  async getWorkOrdersForRV(rvId: string) {
    await randomDelay();
    return clone(workOrders.filter((wo) => wo.rvId === rvId));
  },

  async getWorkOrders() {
    await randomDelay();
    return clone(workOrders);
  },

  async getWorkOrderById(id: string) {
    await randomDelay();
    const workOrder = findWorkOrder(id);
    if (!workOrder) throw new Error('Work order not found');
    return clone(workOrder);
  },

  async createWorkOrder(
    rvId: string,
    data: Omit<
      WorkOrder,
      'id' | 'rvId' | 'customerId' | 'createdAt' | 'updatedAt' | 'totalEstimate'
    > & { customerId: string },
  ) {
    await randomDelay();
    const partsWithMarkup = data.parts.map((part) => {
      const partRef = findPart(part.partId);
      const price = partRef ? applyMarkup(partRef.price) : part.unitPrice;
      return {
        ...part,
        name: partRef?.name || part.name,
        unitPrice: price,
      };
    });

    const newOrder = buildWorkOrder({
      ...data,
      id: nanoid(),
      rvId,
      customerId: data.customerId,
      parts: partsWithMarkup,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    workOrders = [newOrder, ...workOrders];
    return clone(newOrder);
  },

  async updateWorkOrder(
    id: string,
    data: Partial<
      Omit<WorkOrder, 'id' | 'rvId' | 'customerId' | 'totalEstimate'>
    >,
  ) {
    await randomDelay();
    workOrders = workOrders.map((wo) => {
      if (wo.id !== id) return wo;
      const updatedParts = data.parts ?? wo.parts;
      const partsTotal = computePartsSubtotal(updatedParts);
      const laborHours = data.laborHours ?? wo.laborHours;
      const laborRate = data.laborRate ?? wo.laborRate;
      return {
        ...wo,
        ...data,
        parts: updatedParts,
        laborHours,
        laborRate,
        totalEstimate: partsTotal + laborHours * laborRate,
        updatedAt: new Date().toISOString(),
      };
    });
    const current = findWorkOrder(id);
    if (!current) {
      throw new Error('Work order not found');
    }
    return clone(current);
  },

  async getParts(search?: string) {
    await randomDelay();
    if (!search) return clone(parts);
    const term = search.toLowerCase();
    return clone(
      parts.filter(
        (part) =>
          part.name.toLowerCase().includes(term) ||
          (part.sku && part.sku.toLowerCase().includes(term)),
      ),
    );
  },

  async createPart(data: Omit<Part, 'id'>) {
    await randomDelay();
    const newPart: Part = { ...data, id: nanoid() };
    parts = [newPart, ...parts];
    return clone(newPart);
  },

  async updatePart(id: string, data: Partial<Part>) {
    await randomDelay();
    parts = parts.map((part) =>
      part.id === id ? { ...part, ...data } : part,
    );
    const current = findPart(id);
    if (!current) throw new Error('Part not found');
    return clone(current);
  },

  async getSettings() {
    await randomDelay();
    return clone(settings);
  },

  async updateSettings(partial: Partial<DealershipSettings>) {
    await randomDelay();
    settings = { ...settings, ...partial };
    persistSettings();
    return clone(settings);
  },

  async getUsers() {
    await randomDelay();
    return clone(users);
  },

  async getAnnouncements(currentRole?: Role) {
    await randomDelay();
    if (!currentRole) return clone(announcements);
    return clone(
      announcements.filter(
        (item) => item.audience === 'all' || (Array.isArray(item.audience) && item.audience.includes(currentRole)),
      ),
    );
  },

  async createAnnouncement(data: {
    title: string;
    message: string;
    audience: Role[] | 'all';
    actionLabel?: string;
    actionLink?: string;
  }) {
    await randomDelay();
    const newAnnouncement: Announcement = {
      id: nanoid(),
      title: data.title,
      message: data.message,
      audience: data.audience,
      createdAt: new Date().toISOString(),
      actionLabel: data.actionLabel,
      actionLink: data.actionLink,
    };
    announcements = [newAnnouncement, ...announcements];
    persistAnnouncements();
    return clone(newAnnouncement);
  },

  async deleteAnnouncement(id: string) {
    await randomDelay();
    announcements = announcements.filter((a) => a.id !== id);
    persistAnnouncements();
  },

  async createUser(data: Omit<User, 'id'>) {
    await randomDelay();
    const newUser: User = { ...data, id: nanoid() };
    users = [newUser, ...users];
    persistUsers();
    return clone(newUser);
  },

  async updateUser(id: string, data: Partial<Omit<User, 'id'>>) {
    await randomDelay();
    users = users.map((user) =>
      user.id === id ? { ...user, ...data } : user,
    );
    persistUsers();
    const current = users.find((user) => user.id === id);
    if (!current) throw new Error('User not found');
    return clone(current);
  },
};

