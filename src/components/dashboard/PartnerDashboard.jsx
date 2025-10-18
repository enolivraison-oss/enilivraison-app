
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, AlertTriangle, History, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const PartnerDashboard = () => {
  const { user } = useAuth();
  const { products, stockMovements, partnerDeliveryFees, loading } = useData();
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

  const partnerId = user.user_metadata?.partner_id;

  const filteredData = useMemo(() => {
    if (!partnerId) {
        return { fees: [], products: [], movements: [] };
    }
      
    const from = dateRange.from ? startOfDay(dateRange.from) : null;
    const to = dateRange.to ? endOfDay(dateRange.to) : null;
    
    const filterByDate = (itemDateStr) => {
        if (!from || !to) return true;
        const itemDate = parseISO(itemDateStr);
        return itemDate >= from && itemDate <= to;
    };
    
    const fees = partnerDeliveryFees.filter(f => f.partner_id === partnerId && filterByDate(f.operation_date));
    const partnerProds = products.filter(p => p.partner_id === partnerId);
    const partnerProdsIds = partnerProds.map(p => p.id);
    const movements = stockMovements.filter(m => {
      if (!from || !to) return partnerProdsIds.includes(m.product_id);
      const movementDate = new Date(m.created_at);
      return partnerProdsIds.includes(m.product_id) && movementDate >= from && movementDate <= to;
    });
    
    return { fees, products: partnerProds, movements };
  }, [partnerDeliveryFees, products, stockMovements, partnerId, dateRange]);

  const financialSummary = useMemo(() => {
    const totalTurnover = filteredData.fees.reduce((sum, f) => sum + (f.turnover || 0), 0);
    const totalFees = filteredData.fees.reduce((sum, f) => sum + f.total_delivery_fee, 0);
    const balance = totalTurnover - totalFees;
    return { totalTurnover, totalFees, balance };
  }, [filteredData.fees]);
  
  const productStats = useMemo(() => {
    const lowStock = filteredData.products.filter(p => p.stock <= p.alert_threshold && p.alert_threshold > 0).length;
    const totalStock = filteredData.products.reduce((sum, p) => sum + p.stock, 0);
    return { lowStock, totalStock, productCount: filteredData.products.length };
  }, [filteredData.products]);

  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return { labels: [], datasets: [] };

    const interval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const labels = interval.map(day => format(day, 'dd/MM'));
    
    const turnoverData = new Array(labels.length).fill(0);
    const feesData = new Array(labels.length).fill(0);

    filteredData.fees.forEach(item => {
      const date = parseISO(item.operation_date);
      const index = interval.findIndex(day => format(day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      if (index !== -1) {
        turnoverData[index] += item.turnover || 0;
        feesData[index] += item.total_delivery_fee || 0;
      }
    });

    return {
      labels,
      datasets: [
        { label: "Chiffre d'Affaires", data: turnoverData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3 },
        { label: 'Frais de Livraison', data: feesData, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.2)', fill: true, tension: 0.3 }
      ]
    };
  }, [dateRange, filteredData.fees]);

  const setDatePreset = (preset) => {
    const now = new Date();
    if (preset === 'this_week') setDateRange({ from: startOfWeek(now, { locale: fr }), to: endOfWeek(now, { locale: fr }) });
    if (preset === 'this_month') setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
    if (preset === 'last_month') {
      const lastMonth = subMonths(now, 1);
      setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    }
  };
  
  const chartOptions = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#cbd5e1' } } },
    scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } } }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Mon Espace Partenaire</h1>
        <p className="text-gray-400">Bienvenue, {user?.user_metadata?.full_name}</p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-4">
        <Popover>
            <PopoverTrigger asChild><Button variant="outline" className="w-[240px] justify-start text-left font-normal glass-effect text-white hover:bg-gray-700"><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from && dateRange?.to ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : <span>Période</span>}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass-effect" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={fr} /></PopoverContent>
        </Popover>
        <Button variant="outline" size="sm" onClick={() => setDatePreset('this_week')} className="glass-effect text-white hover:bg-gray-700">7j</Button>
        <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')} className="glass-effect text-white hover:bg-gray-700">30j</Button>
        <Button variant="outline" size="sm" onClick={() => setDatePreset('last_month')} className="glass-effect text-white hover:bg-gray-700">M-1</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Chiffre d'Affaires" value={`${financialSummary.totalTurnover.toLocaleString('fr-FR')} FCFA`} icon={<TrendingUp className="text-blue-400" />} />
        <StatCard title="Frais de Livraison" value={`${financialSummary.totalFees.toLocaleString('fr-FR')} FCFA`} icon={<TrendingDown className="text-orange-400" />} />
        <StatCard title="Solde (Bénéfice)" value={`${financialSummary.balance.toLocaleString('fr-FR')} FCFA`} icon={<DollarSign className={financialSummary.balance >= 0 ? "text-green-400" : "text-red-400"} />} color={financialSummary.balance >= 0 ? 'text-green-400' : 'text-red-400'}/>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800/50 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 text-white">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-slate-700 text-white">Mes Produits</TabsTrigger>
          <TabsTrigger value="movements" className="data-[state=active]:bg-slate-700 text-white">Historique Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-3">
                    <Card className="glass-effect"><CardHeader><CardTitle className="text-white">Évolution CA vs Frais</CardTitle></CardHeader><CardContent className="h-72"><Line options={chartOptions} data={chartData} /></CardContent></Card>
                 </div>
                 <StatCard title="Types de produits" value={productStats.productCount} icon={<Package className="text-purple-400" />} />
                 <StatCard title="Stock Total" value={productStats.totalStock} icon={<Package className="text-indigo-400" />} />
                 <StatCard title="Alertes Stock" value={productStats.lowStock} icon={<AlertTriangle className="text-yellow-400" />} color={productStats.lowStock > 0 ? "text-yellow-400" : "text-white"}/>
            </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.products.map((product, index) => {
              const isLowStock = product.stock <= product.alert_threshold && product.alert_threshold > 0;
              return (<motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}><Card className={`glass-effect border-slate-800 card-hover ${isLowStock ? 'border-yellow-500/50' : ''}`}><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-white text-lg">{product.name}</CardTitle>{isLowStock && <AlertTriangle className="w-5 h-5 text-yellow-500" />}</div></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-4"><div><p className="text-gray-400 text-sm">Stock Actuel</p><p className={`text-2xl font-bold ${isLowStock ? 'text-yellow-400' : 'text-green-400'}`}>{product.stock}</p></div><div><p className="text-gray-400 text-sm">Seuil d'Alerte</p><p className="text-xl font-semibold text-gray-300">{product.alert_threshold}</p></div></div></CardContent></Card></motion.div>);
            })}
            {filteredData.products.length === 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="col-span-full"><Card className="glass-effect border-slate-800 text-center py-12"><CardContent><Package className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">Aucun produit</h3><p className="text-gray-400">Vos produits apparaîtront ici une fois ajoutés</p></CardContent></Card></motion.div>)}
          </div>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="glass-effect border-slate-800">
            <CardHeader><CardTitle className="text-white">Historique des Mouvements</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {filteredData.movements.map((movement) => {
                  const product = filteredData.products.find(p => p.id === movement.product_id);
                  return (<div key={movement.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"><div className="flex items-center space-x-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${movement.type === 'in' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>{movement.type === 'in' ? (<TrendingUp className="w-4 h-4 text-green-500" />) : (<TrendingDown className="w-4 h-4 text-red-500" />)}</div><div><p className="text-white font-medium">{product?.name}</p><p className="text-gray-400 text-sm">{movement.reason || 'Mouvement'}</p></div></div><div className="text-right"><p className={`font-semibold ${movement.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{movement.type === 'in' ? '+' : '-'}{movement.quantity}</p><p className="text-gray-500 text-sm">{format(new Date(movement.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}</p></div></div>);
                })}
                {filteredData.movements.length === 0 && (<p className="text-gray-400 text-center py-4">Aucun mouvement de stock pour la période sélectionnée.</p>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = 'text-white' }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="glass-effect card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
        </Card>
    </motion.div>
);

export default PartnerDashboard;
