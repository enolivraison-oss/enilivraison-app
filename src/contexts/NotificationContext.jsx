import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { products } = useData();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    // This is a placeholder. In a real app, you'd fetch notifications from a DB table.
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user || !products.length) return;

    const userRole = user.user_metadata.role;
    const userPartnerId = user.user_metadata.partner_id;

    // CEO should not get toast notifications for low stock
    if (userRole === 'ceo') return;

    products.forEach(p => {
      const isLowStock = p.stock <= p.alert_threshold && p.alert_threshold > 0;
      if (!isLowStock) return;

      const shouldNotify = 
        (userRole === 'accountant' || userRole === 'secretary') || 
        (userRole === 'partner' && p.partner_id === userPartnerId);

      if (shouldNotify) {
        const notificationId = `low-stock-${p.id}`;
        if (!document.querySelector(`[data-toast-id="${notificationId}"]`)) {
          toast({
            'data-toast-id': notificationId,
            title: "⚠️ Alerte de stock faible",
            description: `Le stock pour "${p.name}" est bas (${p.stock} restants).`,
            variant: "destructive",
          });
        }
      }
    });

  }, [products, user, toast]);


  const getUnreadCount = () => {
    return unreadCount;
  };

  const markAsRead = (id) => {
    // Logic to mark a notification as read
  };

  const value = {
    notifications,
    getUnreadCount,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};