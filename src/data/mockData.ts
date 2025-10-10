import { User, ParkingSpace, Booking, Vehicle, ParkingSlot, VehicleType } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@parkeasy.com',
    phone: '+1234567888',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    address: 'ParkEasy HQ, New York, NY',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'customer-1',
    email: 'customer@test.com',
    phone: '+1234567890',
    password: 'password123',
    role: 'customer',
    name: 'John Doe',
    address: '123 Main St, New York, NY',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'owner-1',
    email: 'owner@test.com',
    phone: '+1234567891',
    password: 'password123',
    role: 'owner',
    name: 'Jane Smith',
    businessName: 'Premium Parking Solutions',
    address: '456 Business Ave, New York, NY',
    gst: 'GST123456789',
    bankDetails: 'Bank: Chase, Account: ****1234',
    subscriptionPlan: 'pro',
    createdAt: new Date('2024-01-10'),
  },
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    userId: 'customer-1',
    type: 'car',
    number: 'NY-1234',
    model: 'Honda Civic',
  },
  {
    id: 'vehicle-2',
    userId: 'customer-1',
    type: 'bike',
    number: 'NY-5678',
    model: 'Yamaha R15',
  },
];

// Helper to create slots
const createSlots = (
  parkingId: string,
  carSlots: number,
  bikeSlots: number,
  carPrice: number,
  bikePrice: number
): ParkingSlot[] => {
  const slots: ParkingSlot[] = [];
  let slotNumber = 1;

  // Car slots
  for (let i = 0; i < carSlots; i++) {
    slots.push({
      id: `${parkingId}-slot-${slotNumber}`,
      parkingId,
      slotNumber,
      vehicleType: 'car',
      status: 'available',
      pricePerHour: carPrice,
    });
    slotNumber++;
  }

  // Bike slots
  for (let i = 0; i < bikeSlots; i++) {
    slots.push({
      id: `${parkingId}-slot-${slotNumber}`,
      parkingId,
      slotNumber,
      vehicleType: 'bike',
      status: 'available',
      pricePerHour: bikePrice,
    });
    slotNumber++;
  }

  return slots;
};

// Mock Parking Spaces (New York coordinates)
export const mockParkingSpaces: ParkingSpace[] = [
  {
    id: 'parking-1',
    ownerId: 'owner-1',
    name: 'Times Square Parking',
    address: '1560 Broadway, New York, NY 10036',
    coordinates: [40.758, -73.9855],
    polygonCoordinates: [
      [-73.9860, 40.7575],
      [-73.9850, 40.7575],
      [-73.9850, 40.7585],
      [-73.9860, 40.7585],
    ],
    type: 'underground',
    category: 'commercial',
    vehicleTypes: ['car', 'bike'],
    totalSlots: 50,
    availableSlots: 45,
    pricePerHour: 12,
    rating: 4.5,
    distance: 0.5,
    images: ['/placeholder.svg'],
    isOpen: true,
    slots: createSlots('parking-1', 40, 10, 12, 5),
    description: 'Secure underground parking in the heart of Times Square',
  },
  {
    id: 'parking-2',
    ownerId: 'owner-1',
    name: 'Central Park South Parking',
    address: '160 Central Park South, New York, NY 10019',
    coordinates: [40.7662, -73.9794],
    polygonCoordinates: [
      [-73.9800, 40.7657],
      [-73.9788, 40.7657],
      [-73.9788, 40.7667],
      [-73.9800, 40.7667],
    ],
    type: 'covered',
    category: 'commercial',
    vehicleTypes: ['car', 'bike'],
    totalSlots: 30,
    availableSlots: 0, // Full - will show red
    pricePerHour: 15,
    rating: 4.7,
    distance: 1.2,
    images: ['/placeholder.svg'],
    isOpen: true,
    slots: createSlots('parking-2', 25, 5, 15, 6),
    description: 'Premium covered parking near Central Park',
  },
  {
    id: 'parking-3',
    ownerId: 'owner-1',
    name: 'Bryant Park Garage',
    address: '1065 6th Ave, New York, NY 10018',
    coordinates: [40.7544, -73.9835],
    type: 'underground',
    category: 'commercial',
    vehicleTypes: ['car', 'bike'],
    totalSlots: 40,
    availableSlots: 32,
    pricePerHour: 10,
    rating: 4.3,
    distance: 0.8,
    images: ['/placeholder.svg'],
    isOpen: true,
    slots: createSlots('parking-3', 35, 5, 10, 4),
    description: 'Convenient parking near Bryant Park',
  },
  {
    id: 'parking-4',
    ownerId: 'owner-1',
    name: 'Madison Square Garden Parking',
    address: '4 Pennsylvania Plaza, New York, NY 10001',
    coordinates: [40.7505, -73.9934],
    type: 'open',
    category: 'commercial',
    vehicleTypes: ['car', 'bike'],
    totalSlots: 60,
    availableSlots: 48,
    pricePerHour: 14,
    rating: 4.6,
    distance: 1.5,
    images: ['/placeholder.svg'],
    isOpen: true,
    slots: createSlots('parking-4', 50, 10, 14, 5),
    description: 'Large parking facility near MSG',
  },
  {
    id: 'parking-5',
    ownerId: 'owner-1',
    name: 'Battery Park Lot',
    address: 'Battery Pl, New York, NY 10004',
    coordinates: [40.7033, -74.0170],
    type: 'open',
    category: 'free',
    vehicleTypes: ['car', 'bike'],
    totalSlots: 20,
    availableSlots: 18,
    pricePerHour: 0,
    rating: 4.0,
    distance: 3.2,
    images: ['/placeholder.svg'],
    isOpen: true,
    slots: createSlots('parking-5', 15, 5, 0, 0),
    description: 'Free parking near Battery Park',
  },
  {
    id: 'parking-6',
    ownerId: 'owner-1',
    name: 'Bike Only Parking - Brooklyn Bridge',
    address: 'Brooklyn Bridge Park, Brooklyn, NY 11201',
    coordinates: [40.7061, -73.9969],
    type: 'open',
    category: 'free',
    vehicleTypes: ['bike'],
    totalSlots: 15,
    availableSlots: 15,
    pricePerHour: 0,
    rating: 4.2,
    distance: 2.8,
    images: ['/placeholder.svg'],
    isOpen: true,
    slots: createSlots('parking-6', 0, 15, 0, 0),
    description: 'Dedicated bike parking near Brooklyn Bridge',
  },
];

// Mock Bookings
export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    userId: 'customer-1',
    parkingId: 'parking-1',
    slotId: 'parking-1-slot-1',
    vehicleId: 'vehicle-1',
    vehicleNumber: 'NY-1234',
    vehicleType: 'car',
    startTime: new Date('2025-10-15T10:00:00'),
    endTime: new Date('2025-10-15T14:00:00'),
    duration: 4,
    totalPrice: 48,
    paymentMethod: 'upi',
    status: 'completed',
    createdAt: new Date('2025-10-14'),
  },
];

// Analytics data generator
export const generateMockAnalytics = (ownerId: string) => {
  const ownerParkings = mockParkingSpaces.filter(p => p.ownerId === ownerId);
  const totalSlots = ownerParkings.reduce((sum, p) => sum + p.totalSlots, 0);
  
  return {
    totalBookings: 245,
    totalRevenue: 12850,
    averageOccupancy: 72,
    topPerformingSlots: [
      { slotId: 'parking-1-slot-1', bookings: 45 },
      { slotId: 'parking-1-slot-2', bookings: 42 },
      { slotId: 'parking-2-slot-1', bookings: 38 },
    ],
    bookingsByVehicleType: [
      { type: 'car' as VehicleType, count: 180 },
      { type: 'bike' as VehicleType, count: 65 },
    ],
    dailyData: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
      bookings: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 1000) + 500,
    })).reverse(),
    weeklyData: Array.from({ length: 4 }, (_, i) => ({
      week: `Week ${i + 1}`,
      bookings: Math.floor(Math.random() * 200) + 100,
      revenue: Math.floor(Math.random() * 5000) + 2000,
    })),
    monthlyData: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      bookings: Math.floor(Math.random() * 500) + 200,
      revenue: Math.floor(Math.random() * 10000) + 5000,
    })),
  };
};
