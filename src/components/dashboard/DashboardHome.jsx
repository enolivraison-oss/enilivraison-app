import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Package, 
  Truck, 
  AlertTriangle,
  UserPlus,
  PackagePlus,
  RefreshCw
} from 'lucide-react';

const DashboardHome = () => {
  const { user } = useAuth();
  const { partners, products, deliveries, standardOrders, partnerDeliveryFees, loading, refreshData, isRefreshing } = useData();
  const navigate = useNavigate();

  const userRole = user?.user_metadata?.role;

  const stats = useMemo(() => {
    const activeProducts = products.length;
    const activePartners = partners.length;
    const lowStockProducts = products.filter(p => p.stock <= p.alert_threshold && p.alert_threshold > 0).length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;
    
    const totalPartnerPackages = partnerDeliveryFees.reduce((sum, fee) => sum + (fee.total_packages_delivered || 0), 0);
    const totalStandardDeliveries = standardOrders.length;
    const totalDeliveries = totalPartnerPackages + totalStandardDeliveries;

    return {
      activeProducts,
      activePartners,
      lowStockProducts,
      pendingDeliveries,
      totalDeliveries
    };
  }, [products, partners, deliveries, standardOrders, partnerDeliveryFees]);

  const recentPartners = useMemo(() => {
    return [...partners]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [partners]);

  const QuickActions = () => {
    if (userRole === 'secretary') {
      return (
        <Button onClick={() => navigate('/dashboard/partners')} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
          <UserPlus className="w-4 h-4 mr-2" /> Ajouter un partenaire
        </Button>
      );
    }
    if (userRole === 'accountant') {
      return (
        <Button onClick={() => navigate('/dashboard/stock')} className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
          <PackagePlus className="w-4 h-4 mr-2" /> Ajouter un produit
        </Button>
      );
    }
    return null;
  };

  if (loading && !isRefreshing) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenue, {user?.user_metadata?.full_name}! 👋</h1>
          <p className="text-gray-400">Voici un aperçu global de votre activité.</p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} variant="outline" className="glass-effect text-white hover:bg-gray-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <Card className="glass-effect border-slate-800 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Produits Actifs</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center"><Package className="w-4 h-4 text-white" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeProducts}</div>
              <p className="text-xs text-gray-500 mt-1">Total des produits en catalogue</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Card className="glass-effect border-slate-800 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Partenaires Actifs</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activePartners}</div>
              <p className="text-xs text-gray-500 mt-1">Total des partenaires enregistrés</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <Card className="glass-effect border-slate-800 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Livraisons</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center"><Truck className="w-4 h-4 text-white" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalDeliveries}</div>
              <p className="text-xs text-gray-500 mt-1">Partenaires + Commandes standards</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="lg:col-span-2">
          <Card className="glass-effect border-slate-800 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2"><AlertTriangle className="w-5 h-5 text-yellow-400" /><span>Alertes & Recommandations</span></CardTitle>
              <CardDescription className="text-gray-400">Points d'attention nécessitant une action.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.lowStockProducts > 0 ? (
                  <Link to="/dashboard/stock" className="block p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-colors">
                    <p className="text-yellow-400 font-medium">{stats.lowStockProducts} produit(s) en stock faible.</p>
                    <p className="text-gray-400 text-sm">Pensez à réapprovisionner ou à contacter les partenaires concernés.</p>
                  </Link>
                ) : (
                  <div className="p-3 text-center text-gray-500">Aucune alerte de stock faible.</div>
                )}
                {stats.pendingDeliveries > 0 ? (
                  <Link to="/dashboard/deliveries" className="block p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <p className="text-blue-400 font-medium">{stats.pendingDeliveries} livraison(s) en attente.</p>
                    <p className="text-gray-400 text-sm">Vérifiez le statut et assurez le suivi des livraisons.</p>
                  </Link>
                ) : (
                  <div className="p-3 text-center text-gray-500">Aucune livraison en attente.</div>
                )}
                {(stats.lowStockProducts === 0 && stats.pendingDeliveries === 0) && (
                  <p className="text-gray-500 text-center py-4">Tout est en ordre !</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <Card className="glass-effect border-slate-800 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2"><Users className="w-5 h-5" /><span>Partenaires Récents</span></CardTitle>
              <CardDescription className="text-gray-400">Derniers partenaires ajoutés.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPartners.map(partner => (
                  <div key={partner.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{partner.name}</p>
                      <p className="text-gray-500 text-xs">{partner.email}</p>
                    </div>
                    <Link to="/dashboard/partners">
                      <Button variant="ghost" size="sm">Voir</Button>
                    </Link>
                  </div>
                ))}
                {recentPartners.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Aucun partenaire récent.</p>
                )}
              </div>
              {userRole === 'secretary' || userRole === 'accountant' ? (
                <div className="mt-4">
                  <QuickActions />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardHome;