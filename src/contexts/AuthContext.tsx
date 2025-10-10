import React, { createContext, useContext, useState } from 'react';
import { User, Vehicle } from '@/types';
import { mockUsers, mockVehicles } from '@/data/mockData';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'owner' | 'customer' | null;
  vehicles: Vehicle[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'userId'>) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface SignupData {
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'owner';
  name: string;
  address?: string;
  businessName?: string;
  gst?: string;
  bankDetails?: string;
  governmentId?: string;
  vehicles?: Array<{ type: 'car' | 'bike'; number: string; model?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage helpers
const getStoredUser = (): User | null => {
  const stored = localStorage.getItem('parkeasy_user');
  return stored ? JSON.parse(stored) : null;
};

const setStoredUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('parkeasy_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('parkeasy_user');
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [role, setRole] = useState<'admin' | 'owner' | 'customer' | null>(
    getStoredUser()?.role || null
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const stored = getStoredUser();
    return stored ? mockVehicles.filter(v => v.userId === stored.id) : [];
  });
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    const foundUser = mockUsers.find(
      u => u.email === email && u.password === password
    );

    if (foundUser) {
      setUser(foundUser);
      setRole(foundUser.role);
      setStoredUser(foundUser);
      
      const userVehicles = mockVehicles.filter(v => v.userId === foundUser.id);
      setVehicles(userVehicles);
      
      toast.success(`Welcome back, ${foundUser.name}!`);
      setLoading(false);
      
      // Redirect based on role
      setTimeout(() => {
        if (foundUser.role === 'admin') {
          window.location.href = '/admin-dashboard';
        } else if (foundUser.role === 'owner') {
          window.location.href = '/owner-dashboard';
        } else {
          window.location.href = '/customer-dashboard';
        }
      }, 100);
      
      return true;
    }

    setLoading(false);
    toast.error('Invalid email or password');
    return false;
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    setLoading(true);
    
    // Check if user already exists
    if (mockUsers.some(u => u.email === data.email)) {
      toast.error('Email already registered');
      setLoading(false);
      return false;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
      name: data.name,
      address: data.address,
      businessName: data.businessName,
      gst: data.gst,
      bankDetails: data.bankDetails,
      createdAt: new Date(),
    };

    // Add vehicles if customer
    if (data.role === 'customer' && data.vehicles) {
      data.vehicles.forEach(v => {
        mockVehicles.push({
          id: `vehicle-${Date.now()}-${Math.random()}`,
          userId: newUser.id,
          type: v.type,
          number: v.number,
          model: v.model || (v.type === 'car' ? 'Car' : 'Bike'),
        });
      });
    }

    mockUsers.push(newUser);
    setUser(newUser);
    setRole(newUser.role);
    setStoredUser(newUser);
    
    const userVehicles = mockVehicles.filter(v => v.userId === newUser.id);
    setVehicles(userVehicles);

    toast.success('Account created successfully!');
    setLoading(false);

    // Redirect based on role
    setTimeout(() => {
      if (data.role === 'owner') {
        window.location.href = '/owner-dashboard';
      } else {
        window.location.href = '/customer-dashboard';
      }
    }, 100);

    return true;
  };

  const logout = () => {
    const wasAdmin = role === 'admin';
    setUser(null);
    setRole(null);
    setVehicles([]);
    setStoredUser(null);
    toast.success('Logged out successfully');
    
    // Redirect admin to home page
    if (wasAdmin) {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    
    // Check if user exists
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser) {
      toast.success('Password reset link sent to your email');
      setLoading(false);
      return true;
    }
    
    toast.error('Email not found');
    setLoading(false);
    return false;
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    setStoredUser(updatedUser);
    
    const userIndex = mockUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = updatedUser;
    }
    
    toast.success('Profile updated successfully');
  };

  const addVehicle = (vehicle: Omit<Vehicle, 'id' | 'userId'>) => {
    if (!user) return;

    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      userId: user.id,
      ...vehicle,
    };

    mockVehicles.push(newVehicle);
    setVehicles(prev => [...prev, newVehicle]);
    toast.success('Vehicle added successfully');
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    const index = mockVehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      mockVehicles[index] = { ...mockVehicles[index], ...updates };
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
      toast.success('Vehicle updated successfully');
    }
  };

  const deleteVehicle = (id: string) => {
    const index = mockVehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      mockVehicles.splice(index, 1);
      setVehicles(prev => prev.filter(v => v.id !== id));
      toast.success('Vehicle removed successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        vehicles,
        login,
        signup,
        logout,
        resetPassword,
        updateProfile,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
