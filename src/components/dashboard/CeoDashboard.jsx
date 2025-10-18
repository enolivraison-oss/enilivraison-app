
    import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Package, 
  Users, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Calendar as CalendarIcon,
  BookOpen,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const RecentActivity = () => {
  const [logs, setLogs] = useState([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(7);
      if (error) {
        toast({ title: "Erreur de chargement du journal", description: error.message, variant: "destructive" });
      } else {
        setLogs(data);
      }
    };
    fetchLogs();

    const channel = supabase
      .channel('public:activity_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
        setLogs((prev) => [payload.new, ...prev.slice(0, 6)]);
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);

  return (
    <Card className="glass-effect h-full">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2"><BookOpen /> Activités Récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white">
                  <span className="font-bold">{log.user_full_name || 'Système'}</span> a effectué : <span className="font-semibold text-green-400">{log.action}</span>
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(log.created_at), 'dd MMM, HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="text-gray-400 text-center py-4">Aucune activité récente.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const CeoDashboard = () => {
  const { 
    products, 
    partners, 
    transactions, 
    standardOrders, 
    partnerDeliveryFees, 
    salaries,
    loading 
  } = useData();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

  const globalStats = useMemo(() => {
    const totalProductTypes = products.length;
    const totalPartners = partners.length;
    
    const totalPartnerPackages = partnerDeliveryFees.reduce((sum, fee) => sum + (fee.total_packages_delivered || 0), 0);
    const totalStandardDeliveries = standardOrders.length;
    const totalDeliveries = totalPartnerPackages + totalStandardDeliveries;
    
    const totalStandardOrdersRevenue = standardOrders.reduce((sum, o) => sum + o.delivery_amount, 0);
    const totalPartnerFeesRevenue = partnerDeliveryFees.reduce((sum, f) => sum + f.total_delivery_fee, 0);
    const totalOtherIncomes = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalTurnover = totalStandardOrdersRevenue + totalPartnerFeesRevenue + totalOtherIncomes;
    
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalSalaries = salaries.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    
    const totalNetProfit = totalTurnover - totalExpenses - totalSalaries;
    
    const lowStockProducts = products.filter(p => p.stock <= p.alert_threshold && p.alert_threshold > 0).length;

    return { 
      totalProductTypes, 
      totalPartners, 
      totalDeliveries, 
      totalTurnover, 
      totalNetProfit, 
      lowStockProducts 
    };
  }, [products, partners, transactions, standardOrders, partnerDeliveryFees, salaries]);

  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) {
      return {
        turnover: { labels: [], datasets: [] },
        partnerFees: { labels: [], datasets: [] },
        expenses: { labels: [], datasets: [] }
      };
    }
    const from = dateRange.from;
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);

    const interval = eachDayOfInterval({ start: from, end: to });
    const labels = interval.map(day => format(day, 'dd/MM'));
    
    const turnoverData = new Array(labels.length).fill(0);
    [...standardOrders, ...partnerDeliveryFees, ...transactions.filter(t => t.type === 'income')].forEach(item => {
      const date = new Date(item.operation_date);
      if (date >= from && date <= to) {
        const index = interval.findIndex(day => format(day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        if (index !== -1) turnoverData[index] += item.delivery_amount || item.total_delivery_fee || item.amount || 0;
      }
    });

    const partnerFees = partnerDeliveryFees
      .filter(f => new Date(f.operation_date) >= from && new Date(f.operation_date) <= to)
      .reduce((acc, fee) => {
        const partnerName = partners.find(p => p.id === fee.partner_id)?.name || 'Inconnu';
        acc[partnerName] = (acc[partnerName] || 0) + fee.total_delivery_fee;
        return acc;
      }, {});

    const expensesByCategory = transactions
      .filter(t => t.type === 'expense' && new Date(t.operation_date) >= from && new Date(t.operation_date) <= to)
      .reduce((acc, t) => {
        const category = t.category || 'Non Catégorisé';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {});

    return {
      turnover: { labels, datasets: [{ label: "Chiffre d'affaires", data: turnoverData, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.2)', fill: true, tension: 0.3 }] },
      partnerFees: { labels: Object.keys(partnerFees), datasets: [{ label: 'Frais par partenaire', data: Object.values(partnerFees), backgroundColor: '#3b82f6' }] },
      expenses: { labels: Object.keys(expensesByCategory), datasets: [{ data: Object.values(expensesByCategory), backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#14b8a6'] }] }
    };
  }, [dateRange, partners, transactions, standardOrders, partnerDeliveryFees]);

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
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#cbd5e1' } } },
    scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } } }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Tableau de Bord CEO</h1>
        <p className="text-gray-400">Vue d'ensemble de l'activité de l'agence.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard icon={<Package />} title="Types de Produits" value={globalStats.totalProductTypes.toLocaleString()} />
        <StatCard icon={<Users />} title="Partenaires Actifs" value={globalStats.totalPartners.toLocaleString()} />
        <StatCard icon={<Truck />} title="Total Livraisons" value={globalStats.totalDeliveries.toLocaleString()} />
        <StatCard icon={<TrendingUp />} title="C.A. Total" value={`${globalStats.totalTurnover.toLocaleString()} FCFA`} />
        <StatCard icon={<DollarSign />} title="Bénéfice Net Total" value={`${globalStats.totalNetProfit.toLocaleString()} FCFA`} color={globalStats.totalNetProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
        <StatCard icon={<AlertTriangle />} title="Alertes Stock" value={globalStats.lowStockProducts.toLocaleString()} color={globalStats.lowStockProducts > 0 ? 'text-yellow-400' : 'text-gray-400'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <div className="flex flex-wrap justify-between items-center gap-4">
                <CardTitle className="text-white">Performances Financières</CardTitle>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] justify-start text-left font-normal glass-effect text-white hover:bg-gray-700">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : <span>Période</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-effect" align="end">
                      <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={fr} />
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="sm" onClick={() => setDatePreset('this_week')} className="glass-effect text-white hover:bg-gray-700">7j</Button>
                  <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')} className="glass-effect text-white hover:bg-gray-700">30j</Button>
                  <Button variant="outline" size="sm" onClick={() => setDatePreset('last_month')} className="glass-effect text-white hover:bg-gray-700">M-1</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-72"><Line options={chartOptions} data={chartData.turnover} /></CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-effect"><CardHeader><CardTitle className="text-white">Frais par Partenaire</CardTitle></CardHeader><CardContent className="h-72"><Bar options={chartOptions} data={chartData.partnerFees} /></CardContent></Card>
            <Card className="glass-effect"><CardHeader><CardTitle className="text-white">Répartition des Dépenses</CardTitle></CardHeader><CardContent className="h-72"><Pie options={{ ...chartOptions, plugins: { legend: { position: 'right', labels: { color: '#cbd5e1' } } } }} data={chartData.expenses} /></CardContent></Card>
          </div>
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color = 'text-white' }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <Card className="glass-effect card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <div className="text-gray-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  </motion.div>
);

export default CeoDashboard;
  