import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Calendar, MapPin, DollarSign } from 'lucide-react';

const DeliveryManagement = () => {
  const { deliveries, partners } = useData();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Gestion des Livraisons</h1>
        <p className="text-gray-300">Historique des livraisons simples</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deliveries.map((delivery, index) => {
          const partner = partners.find(p => p.id === delivery.partnerId);
          return (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="glass-effect border-white/20 card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">Livraison #{delivery.id.slice(-5)}</CardTitle>
                        <CardDescription className="text-gray-300">{partner?.name}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-2 text-gray-300">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>De:</strong> {delivery.pickupAddress}
                    </span>
                  </div>
                  <div className="flex items-start space-x-2 text-gray-300">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>À:</strong> {delivery.deliveryAddress}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-semibold text-blue-400">{delivery.fee}€</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 pt-2 border-t border-white/10">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">
                      Effectuée le {new Date(delivery.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        
        {deliveries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="col-span-full"
          >
            <Card className="glass-effect border-white/20 text-center py-12">
              <CardContent>
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Aucune livraison</h3>
                <p className="text-gray-300">Les livraisons simples ajoutées apparaîtront ici</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DeliveryManagement;