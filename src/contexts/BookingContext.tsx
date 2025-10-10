import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, ParkingSpace, ParkingSlot } from '@/types';
import { mockBookings, mockParkingSpaces } from '@/data/mockData';
import { toast } from 'sonner';

interface BookingContextType {
  bookings: Booking[];
  parkingSpaces: ParkingSpace[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<string>;
  cancelBooking: (id: string) => void;
  updateParkingSpace: (id: string, updates: Partial<ParkingSpace>) => void;
  addParkingSpace: (parking: Omit<ParkingSpace, 'id'>) => void;
  deleteParkingSpace: (id: string) => void;
  updateSlot: (parkingId: string, slotId: string, updates: Partial<ParkingSlot>) => void;
  getBookingsByUser: (userId: string) => Booking[];
  getParkingsByOwner: (ownerId: string) => ParkingSpace[];
  simulateBookingEnd: (bookingId: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>(mockParkingSpaces);

  useEffect(() => {
    const storedBookings = localStorage.getItem('parkingBookings');
    const storedParkings = localStorage.getItem('parkingSpaces');

    if (storedBookings) {
      setBookings(JSON.parse(storedBookings, (key, value) => {
        if (key === 'startTime' || key === 'endTime' || key === 'createdAt') {
          return new Date(value);
        }
        return value;
      }));
    }
    if (storedParkings) {
      setParkingSpaces(JSON.parse(storedParkings));
    }
  }, []);

  // Auto-release expired bookings
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const expiredBookings = bookings.filter(
        b => b.status === 'active' && b.endTime < now
      );

      if (expiredBookings.length > 0) {
        expiredBookings.forEach(booking => {
          simulateBookingEnd(booking.id);
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [bookings]);

  const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<string> => {
    const newBooking: Booking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
      createdAt: new Date(),
      status: 'upcoming',
    };

    // Update slot status
    const updatedParkings = parkingSpaces.map(parking => {
      if (parking.id === bookingData.parkingId) {
        return {
          ...parking,
          availableSlots: parking.availableSlots - 1,
          slots: parking.slots.map(slot =>
            slot.id === bookingData.slotId
              ? {
                  ...slot,
                  status: 'booked' as const,
                  currentBookingId: newBooking.id,
                  bookingEndTime: bookingData.endTime,
                }
              : slot
          ),
        };
      }
      return parking;
    });

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    setParkingSpaces(updatedParkings);
    
    localStorage.setItem('parkingBookings', JSON.stringify(updatedBookings));
    localStorage.setItem('parkingSpaces', JSON.stringify(updatedParkings));
    
    toast.success('Booking confirmed successfully!');
    return newBooking.id;
  };

  const cancelBooking = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    const updatedBookings = bookings.map(b =>
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    );

    // Release the slot
    const updatedParkings = parkingSpaces.map(parking => {
      if (parking.id === booking.parkingId) {
        return {
          ...parking,
          availableSlots: parking.availableSlots + 1,
          slots: parking.slots.map(slot =>
            slot.id === booking.slotId
              ? {
                  ...slot,
                  status: 'available' as const,
                  currentBookingId: undefined,
                  bookingEndTime: undefined,
                }
              : slot
          ),
        };
      }
      return parking;
    });

    setBookings(updatedBookings);
    setParkingSpaces(updatedParkings);
    
    localStorage.setItem('parkingBookings', JSON.stringify(updatedBookings));
    localStorage.setItem('parkingSpaces', JSON.stringify(updatedParkings));
    
    toast.success('Booking cancelled successfully');
  };

  const simulateBookingEnd = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const updatedBookings = bookings.map(b =>
      b.id === bookingId ? { ...b, status: 'completed' as const } : b
    );

    const updatedParkings = parkingSpaces.map(parking => {
      if (parking.id === booking.parkingId) {
        return {
          ...parking,
          availableSlots: parking.availableSlots + 1,
          slots: parking.slots.map(slot =>
            slot.id === booking.slotId
              ? {
                  ...slot,
                  status: 'available' as const,
                  currentBookingId: undefined,
                  bookingEndTime: undefined,
                }
              : slot
          ),
        };
      }
      return parking;
    });

    setBookings(updatedBookings);
    setParkingSpaces(updatedParkings);
    
    localStorage.setItem('parkingBookings', JSON.stringify(updatedBookings));
    localStorage.setItem('parkingSpaces', JSON.stringify(updatedParkings));
    
    toast.info('Booking time ended. Slot is now available.');
  };

  const updateParkingSpace = (id: string, updates: Partial<ParkingSpace>) => {
    const updatedParkings = parkingSpaces.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    setParkingSpaces(updatedParkings);
    localStorage.setItem('parkingSpaces', JSON.stringify(updatedParkings));
    toast.success('Parking space updated successfully');
  };

  const addParkingSpace = (parking: Omit<ParkingSpace, 'id'>) => {
    const newParking: ParkingSpace = {
      ...parking,
      id: `parking-${Date.now()}`,
    };
    const updatedParkings = [...parkingSpaces, newParking];
    setParkingSpaces(updatedParkings);
    localStorage.setItem('parkingSpaces', JSON.stringify(updatedParkings));
    toast.success('Parking space added successfully');
  };

  const deleteParkingSpace = (id: string) => {
    const updatedParkings = parkingSpaces.filter(p => p.id !== id);
    setParkingSpaces(updatedParkings);
    localStorage.setItem('parkingSpaces', JSON.stringify(updatedParkings));
    toast.success('Parking space deleted successfully');
  };

  const updateSlot = (parkingId: string, slotId: string, updates: Partial<ParkingSlot>) => {
    const updatedParkings = parkingSpaces.map(parking => {
      if (parking.id === parkingId) {
        return {
          ...parking,
          slots: parking.slots.map(slot =>
            slot.id === slotId ? { ...slot, ...updates } : slot
          ),
        };
      }
      return parking;
    });
    setParkingSpaces(updatedParkings);
    localStorage.setItem('parkingSpaces', JSON.stringify(updatedParkings));
  };

  const getBookingsByUser = (userId: string) => {
    return bookings.filter(b => b.userId === userId);
  };

  const getParkingsByOwner = (ownerId: string) => {
    return parkingSpaces.filter(p => p.ownerId === ownerId);
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        parkingSpaces,
        createBooking,
        cancelBooking,
        updateParkingSpace,
        addParkingSpace,
        deleteParkingSpace,
        updateSlot,
        getBookingsByUser,
        getParkingsByOwner,
        simulateBookingEnd,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};
