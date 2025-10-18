import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ArrowUpDown, RefreshCw, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const AccountingManagement = () => {
  const {
    partners,
    standardOrders, addStandardOrder, updateStandardOrder, deleteStandardOrder,
    partnerDeliveryFees, addPartnerDeliveryFee, updatePartnerDeliveryFee, deletePartnerDeliveryFee,
    transactions, addTransaction, updateTransaction, deleteTransaction,
    salaries,
    refreshData, isRefreshing
  } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [dateRange, setDateRange] = useState({ from: startOfDay(new Date()), to: endOfDay(new Date()) });

  const canManage = useMemo(() => user?.user_metadata?.role === 'ceo' || user?.user_metadata?.role === 'accountant', [user]);

  console.log("📅 Valeur actuelle de dateRange :", dateRange);
  const filteredData = useMemo(() => {
  if (!dateRange?.from) {
    // Si aucune date n’est sélectionnée, on renvoie tout
    return {
      fees: partnerDeliveryFees,
      orders: standardOrders,
      trans: transactions,
      sals: salaries,
    };
  }

  const from = startOfDay(dateRange.from);
  const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from); // ✅ si "to" est vide, on prend la même journée

  const filterByDate = (item) => {
    const date = new Date(item.operation_date || item.payment_date);
    return date >= from && date <= to;
  };

  return {
    fees: partnerDeliveryFees.filter(filterByDate),
    orders: standardOrders.filter(filterByDate),
    trans: transactions.filter(filterByDate),
    sals: salaries.filter(filterByDate),
  };
}, [partnerDeliveryFees, standardOrders, transactions, salaries, dateRange]);


  const openDialog = (type, item = null) => {
    setDialogType(type);
    setEditingItem(item);
    if (item) {
      if (type === 'partnerFee') {
        setFormData({
          ...item,
          operation_date: format(new Date(item.operation_date), 'yyyy-MM-dd')
        });
      } else {
         setFormData({
          ...item,
          operation_date: item.operation_date ? format(new Date(item.operation_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          payment_date: item.payment_date ? format(new Date(item.payment_date), 'yyyy-MM-dd') : undefined,
        });
      }
    } else {
      const defaultDate = format(new Date(), 'yyyy-MM-dd');
      let initialData = { operation_date: defaultDate };
      if (type === 'partnerFee') {
        initialData = { ...initialData, partner_id: '', total_delivery_fee: '', total_packages_delivered: '', turnover: '' };
      } else if (type === 'standardOrder') {
        initialData = { ...initialData, pickup_location: '', delivery_location: '', delivery_amount: '' };
      } else if (type === 'transaction') {
        initialData = { ...initialData, type: 'income', amount: '', description: '', category: '' };
      }
      setFormData(initialData);
    }
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType('');
    setEditingItem(null);
    setFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: format(date, 'yyyy-MM-dd') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogType === 'partnerFee') {
        const payload = {
          ...formData,
          total_delivery_fee: parseFloat(formData.total_delivery_fee),
          total_packages_delivered: parseInt(formData.total_packages_delivered, 10),
          turnover: parseFloat(formData.turnover),
        };
        if (editingItem) {
          await updatePartnerDeliveryFee(editingItem.id, payload);
          toast({ title: "✅ Frais partenaire mis à jour", description: "Les frais ont été modifiés avec succès." });
        } else {
          await addPartnerDeliveryFee(payload);
          toast({ title: "✅ Frais partenaire ajoutés", description: "Les nouveaux frais ont été enregistrés." });
        }
      } else if (dialogType === 'standardOrder') {
        const payload = { ...formData, delivery_amount: parseFloat(formData.delivery_amount) };
        if (editingItem) {
          await updateStandardOrder(editingItem.id, payload);
          toast({ title: "✅ Commande standard mise à jour" });
        } else {
          await addStandardOrder(payload);
          toast({ title: "✅ Commande standard ajoutée" });
        }
      } else if (dialogType === 'transaction') {
         const payload = { ...formData, amount: parseFloat(formData.amount) };
        if (editingItem) {
          await updateTransaction(editingItem.id, payload);
          toast({ title: "✅ Transaction mise à jour" });
        } else {
          await addTransaction(payload);
          toast({ title: "✅ Transaction ajoutée" });
        }
      }
      handleDialogClose();
    } catch (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'partnerFee') {
        await deletePartnerDeliveryFee(id);
        toast({ title: '🗑️ Frais partenaire supprimés' });
      } else if (type === 'standardOrder') {
        await deleteStandardOrder(id);
        toast({ title: '🗑️ Commande standard supprimée' });
      } else if (type === 'transaction') {
        await deleteTransaction(id);
        toast({ title: '🗑️ Transaction supprimée' });
      }
    } catch (error) {
      toast({ title: "❌ Erreur de suppression", description: error.message, variant: "destructive" });
    }
  };

  const setDatePreset = (preset) => {
    const now = new Date();
    if (preset === 'today') setDateRange({ from: startOfDay(now), to: endOfDay(now) });
    if (preset === 'this_week') setDateRange({ from: startOfWeek(now, { locale: fr }), to: endOfWeek(now, { locale: fr }) });
    if (preset === 'this_month') setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
    if (preset === 'last_month') {
      const lastMonth = subMonths(now, 1);
      setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    }
  };

  const renderDialogContent = () => {
    switch (dialogType) {
      case 'partnerFee':
        return (
          <>
            <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} Frais Partenaire</DialogTitle>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partner_id">Partenaire</Label>
                <Select name="partner_id" value={formData.partner_id || ''} onValueChange={(value) => handleSelectChange('partner_id', value)}>
                  <SelectTrigger id="partner_id"><SelectValue placeholder="Sélectionnez un partenaire" /></SelectTrigger>
                  <SelectContent>
                    {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="turnover">Chiffre d'Affaires (CA) du partenaire</Label><Input id="turnover" name="turnover" type="number" value={formData.turnover || ''} onChange={handleFormChange} placeholder="Ex: 50000" /></div>
              <div className="space-y-2"><Label htmlFor="total_delivery_fee">Frais de livraison totaux</Label><Input id="total_delivery_fee" name="total_delivery_fee" type="number" value={formData.total_delivery_fee || ''} onChange={handleFormChange} placeholder="Ex: 15000" /></div>
              <div className="space-y-2"><Label htmlFor="total_packages_delivered">Colis livrés</Label><Input id="total_packages_delivered" name="total_packages_delivered" type="number" value={formData.total_packages_delivered || ''} onChange={handleFormChange} placeholder="Ex: 30" /></div>
              <div className="space-y-2"><Label htmlFor="operation_date">Date d'opération</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{formData.operation_date ? format(parseISO(formData.operation_date), 'PPP', { locale: fr }) : <span>Choisissez une date</span>}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.operation_date ? parseISO(formData.operation_date) : null} onSelect={(date) => handleDateChange('operation_date', date)} initialFocus /></PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        );
      case 'standardOrder':
        return (
           <>
            <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} Commande Standard</DialogTitle>
            <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="pickup_location">Lieu de récupération</Label><Input id="pickup_location" name="pickup_location" value={formData.pickup_location || ''} onChange={handleFormChange} /></div>
              <div className="space-y-2"><Label htmlFor="delivery_location">Lieu de livraison</Label><Input id="delivery_location" name="delivery_location" value={formData.delivery_location || ''} onChange={handleFormChange} /></div>
              <div className="space-y-2"><Label htmlFor="delivery_amount">Montant</Label><Input id="delivery_amount" name="delivery_amount" type="number" value={formData.delivery_amount || ''} onChange={handleFormChange} /></div>
               <div className="space-y-2"><Label htmlFor="operation_date">Date d'opération</Label>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{formData.operation_date ? format(parseISO(formData.operation_date), 'PPP', { locale: fr }) : <span>Choisissez une date</span>}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.operation_date ? parseISO(formData.operation_date) : null} onSelect={(date) => handleDateChange('operation_date', date)} initialFocus /></PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        );
      case 'transaction':
         return (
           <>
            <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} une Transaction</DialogTitle>
            <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="type">Type</Label><Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}><SelectTrigger id="type"><SelectValue placeholder="Type de transaction" /></SelectTrigger><SelectContent><SelectItem value="income">Revenu</SelectItem><SelectItem value="expense">Dépense</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="amount">Montant</Label><Input id="amount" name="amount" type="number" value={formData.amount || ''} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" name="description" value={formData.description || ''} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label htmlFor="category">Catégorie</Label><Input id="category" name="category" value={formData.category || ''} onChange={handleFormChange} /></div>
                <div className="space-y-2"><Label htmlFor="operation_date">Date d'opération</Label>
                <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{formData.operation_date ? format(parseISO(formData.operation_date), 'PPP', { locale: fr }) : <span>Choisissez une date</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.operation_date ? parseISO(formData.operation_date) : null} onSelect={(date) => handleDateChange('operation_date', date)} initialFocus /></PopoverContent>
                </Popover>
                </div>
            </div>
          </>
        );
      default: return null;
    }
  };

  const financialSummary = useMemo(() => {
    const totalPartnerFees = filteredData.fees.reduce((sum, f) => sum + f.total_delivery_fee, 0);
    const totalStandardOrders = filteredData.orders.reduce((sum, o) => sum + o.delivery_amount, 0);
    const otherIncomes = filteredData.trans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalTurnover = totalPartnerFees + totalStandardOrders + otherIncomes;

    const totalExpenses = filteredData.trans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalSalaries = filteredData.sals.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    const totalDeductions = totalExpenses + totalSalaries;

    const netProfit = totalTurnover - totalDeductions;
    return { totalTurnover, totalDeductions: totalExpenses, netProfit, totalSalaries };
  }, [filteredData]);


  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion Comptable</h1>
            <p className="text-gray-400">Suivi des revenus, dépenses et bilan financier.</p>
          </div>
          <Button onClick={() => refreshData(true)} disabled={isRefreshing} variant="outline" className="glass-effect text-white hover:bg-gray-700">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
            <Popover>
            <PopoverTrigger asChild>
  <Button
    variant="outline"
    className="w-full sm:w-[280px] justify-start text-left font-normal glass-effect text-white hover:bg-gray-700"
  >
    <CalendarIcon className="mr-2 h-4 w-4" />
    {dateRange?.from ? (
      dateRange.to ? (
        `${format(dateRange.from, "dd/MM/yy", { locale: fr })} - ${format(dateRange.to, "dd/MM/yy", { locale: fr })}`
      ) : (
        `${format(dateRange.from, "dd/MM/yy", { locale: fr })}`
      )
    ) : (
      <span>Choisissez une période</span>
    )}
  </Button>
</PopoverTrigger>

                <PopoverContent className="w-auto p-0 glass-effect" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={fr} /></PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('today')} className="glass-effect text-white hover:bg-gray-700">Aujourd'hui</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('this_week')} className="glass-effect text-white hover:bg-gray-700">Cette semaine</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')} className="glass-effect text-white hover:bg-gray-700">Ce mois-ci</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('last_month')} className="glass-effect text-white hover:bg-gray-700">Mois dernier</Button>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Chiffre d'Affaires Total" value={`${financialSummary.totalTurnover.toLocaleString('fr-FR')} FCFA`} />
        <StatCard title="Total Dépenses" value={`${financialSummary.totalDeductions.toLocaleString('fr-FR')} FCFA`} />
        <StatCard title="Bénéfice (avant salaires)" value={`${(financialSummary.totalTurnover - financialSummary.totalDeductions).toLocaleString('fr-FR')} FCFA`} color={(financialSummary.totalTurnover - financialSummary.totalDeductions) >= 0 ? 'text-green-400' : 'text-red-400'} />
      </div>

      <div className="space-y-6">
        <AccountingSection 
          title="Frais de Livraison Partenaires" 
          data={filteredData.fees}
          columns={[
            { header: 'Partenaire', accessor: (item) => partners.find(p => p.id === item.partner_id)?.name || 'N/A' },
            { header: 'CA Partenaire', accessor: (item) => `${item.turnover?.toLocaleString('fr-FR') || 0} FCFA` },
            { header: 'Frais Livraison', accessor: (item) => `${item.total_delivery_fee.toLocaleString('fr-FR')} FCFA` },
            { header: 'Colis', accessor: 'total_packages_delivered' },
            { header: "Date", accessor: (item) => format(new Date(item.operation_date), 'dd/MM/yyyy') }
          ]}
          onAdd={() => openDialog('partnerFee')}
          onEdit={(item) => openDialog('partnerFee', item)}
          onDelete={(id) => handleDelete('partnerFee', id)}
          canManage={canManage}
        />
        <AccountingSection 
          title="Commandes de Livraison Standards" 
          data={filteredData.orders}
          columns={[
            { header: 'Récupération', accessor: 'pickup_location' },
            { header: 'Livraison', accessor: 'delivery_location' },
            { header: 'Montant', accessor: (item) => `${item.delivery_amount.toLocaleString('fr-FR')} FCFA` },
            { header: "Date", accessor: (item) => format(new Date(item.operation_date), 'dd/MM/yyyy') }
          ]}
          onAdd={() => openDialog('standardOrder')}
          onEdit={(item) => openDialog('standardOrder', item)}
          onDelete={(id) => handleDelete('standardOrder', id)}
          canManage={canManage}
        />
        <AccountingSection 
          title="Autres Transactions (Revenus & Dépenses)" 
          data={filteredData.trans}
          columns={[
            { header: 'Type', accessor: 'type' },
            { header: 'Description', accessor: 'description' },
            { header: 'Catégorie', accessor: 'category' },
            { header: 'Montant', accessor: (item) => `${item.amount.toLocaleString('fr-FR')} FCFA` },
            { header: "Date", accessor: (item) => format(new Date(item.operation_date), 'dd/MM/yyyy') }
          ]}
          onAdd={() => openDialog('transaction')}
          onEdit={(item) => openDialog('transaction', item)}
          onDelete={(id) => handleDelete('transaction', id)}
          canManage={canManage}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="glass-effect border-slate-700 text-white">
          <DialogHeader>{renderDialogContent()}</DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleDialogClose}>Annuler</Button>
              <Button type="submit">{editingItem ? 'Enregistrer' : 'Ajouter'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ title, value, color = 'text-white' }) => (
  <Card className="glass-effect card-hover">
    <CardHeader>
      <CardTitle className="text-gray-400 text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </CardContent>
  </Card>
);

const AccountingSection = ({ title, data, columns, onAdd, onEdit, onDelete, canManage }) => {
  const [sortConfig, setSortConfig] = useState({ key: columns[columns.length - 1].accessor, direction: 'descending' });

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = typeof sortConfig.key === 'function' ? sortConfig.key(a) : a[sortConfig.key];
        const bValue = typeof sortConfig.key === 'function' ? sortConfig.key(b) : b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  return (
    <Card className="glass-effect">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-white">{title}</CardTitle>
        {canManage && <Button onClick={onAdd}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>}
      </CardHeader>
      <CardContent>
        {sortedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-slate-900/50">
                <tr>
                  {columns.map(col => (
                    <th key={col.header} scope="col" className="px-6 py-3">
                      <button onClick={() => requestSort(col.accessor)} className="flex items-center gap-1">
                        {col.header}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                  {canManage && <th scope="col" className="px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedData.map(item => (
                  <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    {columns.map(col => (
                      <td key={`${item.id}-${col.header}`} className="px-6 py-4">
                        {typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]}
                      </td>
                    ))}
                    {canManage && (
                      <td className="px-6 py-4 flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => onEdit(item)}><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-effect border-slate-700 text-white">
                            <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-500" />
            <p className="mt-4">Aucune donnée disponible pour la période sélectionnée.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountingManagement;