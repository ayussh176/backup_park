import React, { createContext, useContext, useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system';
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt)
      })));
    } else {
      // Add some mock notifications
      setNotifications([
        {
          id: '1',
          title: 'Welcome!',
          message: 'Welcome to the parking management system',
          type: 'system',
          read: false,
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'New Booking',
          message: 'You have a new parking booking',
          type: 'booking',
          read: false,
          createdAt: new Date(Date.now() - 3600000),
        }
      ]);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
