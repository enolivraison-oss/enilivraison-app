import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachMonthOfInterval, eachDayOfInterval, getMonth, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const StatisticsPage = () => {
  const { transactions, standardOrders, partnerDeliveryFees, stockMovements } = useData();
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

  const setDatePreset = (preset) => {
    const now = new Date();
    if (preset === 'today') setDateRange({ from: new Date(), to: new Date() });
    if (preset === 'this_week') setDateRange({ from: startOfWeek(now, { locale: fr }), to: endOfWeek(now, { locale: fr }) });
    if (preset === 'this_month') setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
  };

  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return { turnover: {}, expenses: {}, deliveries: {} };

    const from = dateRange.from;
    const to = dateRange.to;
    to.setHours(23, 59, 59, 999);

    const interval = eachDayOfInterval({ start: from, end: to });
    const labels = interval.map(day => format(day, 'dd/MM'));
    const turnoverData = new Array(labels.length).fill(0);
    const expensesData = new Array(labels.length).fill(0);
    const deliveriesData = new Array(labels.length).fill(0);

    [...standardOrders, ...partnerDeliveryFees].forEach(item => {
      const date = new Date(item.created_at);
      if (date >= from && date <= to) {
        const index = interval.findIndex(day => format(day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        if (index !== -1) {
          turnoverData[index] += item.delivery_amount || item.total_delivery_fee || 0;
        }
      }
    });

    transactions.filter(t => t.type === 'expense').forEach(item => {
      const date = new Date(item.created_at);
      if (date >= from && date <= to) {
        const index = interval.findIndex(day => format(day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        if (index !== -1) {
          expensesData[index] += item.amount || 0;
        }
      }
    });
    
    stockMovements.filter(m => m.type === 'out').forEach(item => {
      const date = new Date(item.created_at);
      if (date >= from && date <= to) {
        const index = interval.findIndex(day => format(day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        if (index !== -1) {
          deliveriesData[index] += 1;
        }
      }
    });

    return {
      turnover: {
        labels,
        datasets: [{ label: "Chiffre d'affaires (FCFA)", data: turnoverData, backgroundColor: 'rgba(34, 197, 94, 0.6)', borderColor: 'rgba(34, 197, 94, 1)', borderWidth: 1 }]
      },
      expenses: {
        labels,
        datasets: [{ label: 'Dépenses (FCFA)', data: expensesData, backgroundColor: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 1 }]
      },
      deliveries: {
        labels,
        datasets: [{ label: 'Nombre de livraisons', data: deliveriesData, fill: false, borderColor: 'rgb(75, 192, 192)', tension: 0.1 }]
      }
    };
  }, [dateRange, transactions, standardOrders, partnerDeliveryFees, stockMovements]);

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Statistiques</h1>
        <p className="text-gray-400">Visualisez les performances de votre agence.</p>
      </motion.div>

      <Card className="glass-effect p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal glass-effect text-white hover:bg-gray-700">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/yy", { locale: fr })} - ${format(dateRange.to, "dd/MM/yy", { locale: fr })}` : format(dateRange.from, "dd/MM/yy", { locale: fr })) : <span>Choisir une période</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass-effect" align="start">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={fr} />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDatePreset('today')} className="glass-effect text-white hover:bg-gray-700">Aujourd'hui</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('this_week')} className="glass-effect text-white hover:bg-gray-700">Cette semaine</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')} className="glass-effect text-white hover:bg-gray-700">Ce mois</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Card className="glass-effect"><CardHeader><CardTitle className="text-white">Chiffre d'Affaires</CardTitle></CardHeader><CardContent><Bar options={options} data={chartData.turnover} /></CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <Card className="glass-effect"><CardHeader><CardTitle className="text-white">Dépenses</CardTitle></CardHeader><CardContent><Bar options={options} data={chartData.expenses} /></CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="lg:col-span-2">
          <Card className="glass-effect"><CardHeader><CardTitle className="text-white">Évolution des Livraisons</CardTitle></CardHeader><CardContent><Line options={options} data={chartData.deliveries} /></CardContent></Card>
        </motion.div>
      </div>
    </div>
  );
};

export default StatisticsPage;