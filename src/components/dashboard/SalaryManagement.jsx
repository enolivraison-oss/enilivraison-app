import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Wallet, DollarSign, Calendar as CalendarIcon, Edit, Trash2, Users, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';

const SalaryManagement = () => {
  const { salaries, addSalary, updateSalary, deleteSalary, transactions, standardOrders, partnerDeliveryFees, refreshData, isRefreshing } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

  const initialFormState = { user_id: null, beneficiary_name: '', amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), notes: '' };
  const [formState, setFormState] = useState(initialFormState);

  const userRole = user?.user_metadata?.role;

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, role').or('role.eq.secretary,role.eq.accountant,role.eq.ceo');
      if (error) {
        toast({ title: "Erreur de chargement des employés", description: error.message, variant: "destructive" });
      } else {
        setAllUsers(data || []);
      }
    };
    fetchUsers();
  }, [toast]);

  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return { salaries: [], transactions: [], standardOrders: [], partnerDeliveryFees: [] };
    }
    
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);

    const filterByDate = (item, dateField) => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= from && itemDate <= to;
    };

    return {
      salaries: salaries.filter(s => filterByDate(s, 'payment_date')),
      transactions: transactions.filter(t => filterByDate(t, 'operation_date')),
      standardOrders: standardOrders.filter(o => filterByDate(o, 'operation_date')),
      partnerDeliveryFees: partnerDeliveryFees.filter(f => filterByDate(f, 'operation_date')),
    };
  }, [salaries, transactions, standardOrders, partnerDeliveryFees, dateRange]);

  const totalPartnerFees = filteredData.partnerDeliveryFees.reduce((sum, fee) => sum + fee.total_delivery_fee, 0);
  const totalStandardOrders = filteredData.standardOrders.reduce((sum, order) => sum + order.delivery_amount, 0);
  const totalOtherIncomes = filteredData.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredData.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalSalaries = filteredData.salaries.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  
  const turnover = totalPartnerFees + totalStandardOrders + totalOtherIncomes;
  const netProfit = turnover - totalExpenses - totalSalaries;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if ((!formState.user_id && !formState.beneficiary_name) || !formState.amount || !formState.payment_date) {
      toast({ title: "❌ Erreur", description: "Veuillez sélectionner un employé ou saisir un nom, et remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    try {
      const payload = { ...formState, amount: parseFloat(formState.amount), user_id: formState.user_id || null };
      if (isEditing) {
        await updateSalary(selectedSalary.id, payload);
        toast({ title: "✅ Salaire modifié", description: "Le paiement du salaire a été mis à jour." });
      } else {
        await addSalary(payload);
        toast({ title: "✅ Salaire ajouté", description: "Le paiement du salaire a été enregistré." });
      }
      setFormState(initialFormState);
      setIsDialogOpen(false);
      setIsEditing(false);
      setSelectedSalary(null);
    } catch (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (salary) => {
    setIsEditing(true);
    setSelectedSalary(salary);
    setFormState({ ...salary, payment_date: format(new Date(salary.payment_date), 'yyyy-MM-dd') });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setSelectedSalary(null);
    setFormState(initialFormState);
    setIsDialogOpen(true);
  };

  const handleDelete = async (salaryId) => {
    try {
      await deleteSalary(salaryId);
      toast({ title: "🗑️ Salaire supprimé", description: "Le paiement du salaire a été supprimé." });
    } catch (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    }
  };

  const setDatePreset = (preset) => {
    const now = new Date();
    if (preset === 'this_week') setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
    if (preset === 'this_month') setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
    if (preset === 'last_month') {
      const lastMonth = subMonths(now, 1);
      setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Salaires</h1>
          <p className="text-gray-400">Suivi des paiements et impact sur la trésorerie.</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal glass-effect text-white hover:bg-gray-700">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : format(dateRange.from, "dd/MM/yy")) : <span>Choisir une période</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass-effect" align="end">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={fr} />
            </PopoverContent>
          </Popover>
          <Button onClick={refreshData} disabled={isRefreshing} variant="outline" size="icon" className="glass-effect text-white hover:bg-gray-700">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreateDialog} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"><Plus className="w-4 h-4 mr-2" />Paiement</Button>
        </div>
      </motion.div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setDatePreset('this_week')} className="glass-effect text-white hover:bg-gray-700">Cette semaine</Button>
        <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')} className="glass-effect text-white hover:bg-gray-700">Ce mois</Button>
        <Button variant="outline" size="sm" onClick={() => setDatePreset('last_month')} className="glass-effect text-white hover:bg-gray-700">Mois dernier</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-400">Chiffre d'Affaires</CardTitle><TrendingUp className="w-4 h-4 text-green-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-400">{turnover.toLocaleString()} FCFA</div></CardContent></Card>
        <Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-400">Dépenses Opérationnelles</CardTitle><TrendingDown className="w-4 h-4 text-orange-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-400">{totalExpenses.toLocaleString()} FCFA</div></CardContent></Card>
        <Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-400">Salaires Payés</CardTitle><Users className="w-4 h-4 text-red-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-400">{totalSalaries.toLocaleString()} FCFA</div></CardContent></Card>
        {(userRole === 'ceo' || userRole === 'accountant') && (
          <Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-400">Bénéfice Net Final</CardTitle><Wallet className="w-4 h-4 text-blue-400" /></CardHeader><CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{netProfit.toLocaleString()} FCFA</div></CardContent></Card>
        )}
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-white">Historique des Paiements de Salaires</CardTitle>
          <CardDescription className="text-gray-400">Liste des salaires payés pour la période sélectionnée.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredData.salaries.map((salary) => {
              const user = allUsers.find(u => u.id === salary.user_id);
              const beneficiary = user ? user.full_name : salary.beneficiary_name;
              return (
                <div key={salary.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{beneficiary || 'Bénéficiaire non spécifié'}</p>
                    <p className="text-gray-400 text-sm">{format(new Date(salary.payment_date), 'dd MMMM yyyy', { locale: fr })} - {salary.notes}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-red-400">-{parseFloat(salary.amount).toLocaleString()} FCFA</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => openEditDialog(salary)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500" onClick={() => handleDelete(salary.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              );
            })}
            {filteredData.salaries.length === 0 && (<p className="text-gray-400 text-center py-4">Aucun salaire payé pour cette période.</p>)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifier le Paiement' : 'Ajouter un Paiement de Salaire'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">Employé (si applicable)</Label>
              <Select value={formState.user_id || ''} onValueChange={(value) => setFormState({...formState, user_id: value, beneficiary_name: ''})}>
                <SelectTrigger className="glass-effect"><SelectValue placeholder="Sélectionner un employé" /></SelectTrigger>
                <SelectContent className="glass-effect">
                  {allUsers.map(user => (<SelectItem key={user.id} value={user.id}>{user.full_name} ({user.role})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiary_name">Ou nom du bénéficiaire externe</Label>
              <Input id="beneficiary_name" value={formState.beneficiary_name} onChange={(e) => setFormState({...formState, beneficiary_name: e.target.value, user_id: null})} className="glass-effect" placeholder="Ex: Consultant externe" disabled={!!formState.user_id} />
            </div>
            <div className="space-y-2"><Label htmlFor="amount">Montant (FCFA) *</Label><Input id="amount" type="number" step="1" value={formState.amount} onChange={(e) => setFormState({...formState, amount: e.target.value})} className="glass-effect" required /></div>
            <div className="space-y-2"><Label htmlFor="payment_date">Date de paiement *</Label><Input id="payment_date" type="date" value={formState.payment_date} onChange={(e) => setFormState({...formState, payment_date: e.target.value})} className="glass-effect" required /></div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Input id="notes" value={formState.notes} onChange={(e) => setFormState({...formState, notes: e.target.value})} className="glass-effect" placeholder="Ex: Salaire de Janvier, Prestation X" /></div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="glass-effect hover:bg-gray-700">Annuler</Button>
              <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">{isEditing ? 'Enregistrer' : 'Ajouter'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryManagement;