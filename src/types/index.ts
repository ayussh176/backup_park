export type UserRole = 'customer' | 'owner' | 'admin';

export type VehicleType = 'car' | 'bike';

export type ParkingType = 'free' | 'paid' | 'open' | 'underground' | 'covered';

export type ParkingCategory = 'commercial' | 'free' | 'private';

export type PaymentMethod = 'upi' | 'qr' | 'netbanking' | 'cash' | 'card';

export type SubscriptionPlan = 'basic' | 'lite' | 'pro';

export interface User {
  id: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  name: string;
  address?: string;
  businessName?: string;
  gst?: string;
  bankDetails?: string;
  subscriptionPlan?: SubscriptionPlan;
  createdAt: Date;
}

export interface Vehicle {
  id: string;
  userId: string;
  type: VehicleType;
  number: string;
  model?: string;
}

export interface ParkingSlot {
  id: string;
  parkingId: string;
  slotNumber: number;
  vehicleType: VehicleType;
  status: 'available' | 'booked' | 'closed';
  pricePerHour: number;
  currentBookingId?: string;
  bookingEndTime?: Date;
}

export interface ParkingSpace {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lat, lng]
  polygonCoordinates?: [number, number][]; // Array of [lng, lat] for polygon boundary
  type: ParkingType;
  category: ParkingCategory;
  parkingLayout?: 'grid' | 'parallel' | 'scattered';
  vehicleTypes: VehicleType[];
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  rating: number;
  distance?: number;
  images: string[];
  isOpen: boolean;
  slots: ParkingSlot[];
  description?: string;
}

export interface Booking {
  id: string;
  userId: string;
  parkingId: string;
  slotId: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

export interface Wallet {
  userId: string;
  balance: number;
  transactions: PaymentTransaction[];
}

export interface ManagerAccess {
  id: string;
  ownerId: string;
  managerId: string;
  parkingId: string;
  permissions: string[];
}

export interface Analytics {
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
  topPerformingSlots: { slotId: string; bookings: number }[];
  bookingsByVehicleType: { type: VehicleType; count: number }[];
  dailyData: { date: string; bookings: number; revenue: number }[];
  weeklyData: { week: string; bookings: number; revenue: number }[];
  monthlyData: { month: string; bookings: number; revenue: number }[];
}
