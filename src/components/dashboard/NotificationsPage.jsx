import React from 'react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const NotificationsPage = () => {
  const { notifications, markAsRead } = useNotifications();
  const { refreshData, isRefreshing } = useData();

  const getIconForType = (type) => {
    switch (type) {
      case 'stock_alert':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-300">Centre de notifications et d'alertes</p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} variant="outline" className="glass-effect text-white hover:bg-gray-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </motion.div>

      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Toutes les notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  notif.read ? 'bg-white/5' : 'bg-indigo-500/20 border border-indigo-500/30'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getIconForType(notif.type)}
                  </div>
                  <div>
                    <p className={`font-medium ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notif.id)}
                    className="text-white hover:bg-white/20"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Marquer comme lu
                  </Button>
                )}
              </motion.div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Boîte de réception vide</h3>
                <p className="text-gray-300">Vous n'avez aucune nouvelle notification</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;