
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ArrowUpDown, Eye, TrendingUp, TrendingDown, RefreshCw, Calendar as CalendarIcon, UserPlus, Package } from 'lucide-react';
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
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';

const PartnersManagement = () => {
  const { partners, deletePartner, addPartner, updatePartner, partnerDeliveryFees, refreshData, isRefreshing } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', email: '', phone: '', address: '', contact_person: '' });
  const [inviteForm, setInviteForm] = useState({ email: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

  const canManage = useMemo(() => user?.user_metadata?.role === 'ceo' || user?.user_metadata?.role === 'secretary' || user?.user_metadata?.role === 'accountant', [user]);
  const canInvite = useMemo(() => user?.user_metadata?.role === 'ceo', [user]);

  const filteredFees = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return partnerDeliveryFees;
    const from = startOfDay(dateRange.from);
    const to = endOfDay(dateRange.to);
    return partnerDeliveryFees.filter(fee => {
      const feeDate = parseISO(fee.operation_date);
      return feeDate >= from && feeDate <= to;
    });
  }, [partnerDeliveryFees, dateRange]);

  const summary = useMemo(() => {
    const totalTurnover = filteredFees.reduce((sum, fee) => sum + (fee.turnover || 0), 0);
    const totalDeliveryFees = filteredFees.reduce((sum, fee) => sum + (fee.total_delivery_fee || 0), 0);
    const totalPackages = filteredFees.reduce((sum, fee) => sum + (fee.total_packages_delivered || 0), 0);
    return { totalTurnover, totalDeliveryFees, totalPackages };
  }, [filteredFees]);

  const partnersWithStats = useMemo(() => {
    return partners.map(partner => {
      const partnerFees = filteredFees.filter(fee => fee.partner_id === partner.id);
      const turnover = partnerFees.reduce((sum, fee) => sum + (fee.turnover || 0), 0);
      const delivery_fees = partnerFees.reduce((sum, fee) => sum + (fee.total_delivery_fee || 0), 0);
      const packages_delivered = partnerFees.reduce((sum, fee) => sum + (fee.total_packages_delivered || 0), 0);
      return { ...partner, turnover, delivery_fees, packages_delivered };
    });
  }, [partners, filteredFees]);

  const sortedPartners = useMemo(() => {
    let sortableItems = [...partnersWithStats];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [partnersWithStats, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenDialog = (partner = null) => {
    setEditingPartner(partner);
    setPartnerForm(partner ? { ...partner } : { name: '', email: '', phone: '', address: '', contact_person: '' });
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPartner) {
        await updatePartner(editingPartner.id, partnerForm);
        toast({ title: '✅ Partenaire mis à jour', description: 'Les informations du partenaire ont été modifiées.' });
      } else {
        await addPartner(partnerForm);
        toast({ title: '✅ Partenaire ajouté', description: 'Le nouveau partenaire a été créé.' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const handlePartnerDelete = async (partnerId) => {
    try {
      await deletePartner(partnerId);
      toast({ title: '🗑️ Partenaire supprimé' });
    } catch (error) {
      toast({ title: '❌ Erreur de suppression', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.email || !editingPartner?.id) {
        toast({ title: "Email et partenaire requis", variant: "destructive" });
        return;
    }

    try {
        const { error } = await supabase.functions.invoke('invite-user', {
            body: { email: inviteForm.email, role: 'partner', partner_id: editingPartner.id, full_name: editingPartner.name }
        });

        if (error) throw error;
        toast({ title: '✅ Invitation envoyée', description: `Une invitation a été envoyée à ${inviteForm.email}.` });
        setIsInviteDialogOpen(false);
    } catch (error) {
        console.error(error);
        toast({ title: '❌ Erreur d\'invitation', description: error.message, variant: 'destructive' });
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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion des Partenaires</h1>
            <p className="text-gray-400">Vue d'ensemble et gestion de vos partenaires.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => refreshData(true)} disabled={isRefreshing} variant="outline" className="glass-effect text-white hover:bg-gray-700">
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
            {canManage && (
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"><Plus className="w-4 h-4 mr-2" />Nouveau Partenaire</Button>
            )}
          </div>
        </div>
      </motion.div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <Card className="glass-effect">
            <CardHeader>
                <CardTitle className="text-white">Aperçu Global des Partenaires</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal glass-effect text-white hover:bg-gray-700"><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from && dateRange?.to ? `${format(dateRange.from, "dd/MM/yy", {locale:fr})} - ${format(dateRange.to, "dd/MM/yy", {locale:fr})}` : <span>Choisissez une période</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0 glass-effect" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={fr} /></PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" onClick={() => setDatePreset('today')} className="glass-effect text-white hover:bg-gray-700">Aujourd'hui</Button>
                    <Button variant="outline" size="sm" onClick={() => setDatePreset('this_week')} className="glass-effect text-white hover:bg-gray-700">Cette semaine</Button>
                    <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')} className="glass-effect text-white hover:bg-gray-700">Ce mois-ci</Button>
                    <Button variant="outline" size="sm" onClick={() => setDatePreset('last_month')} className="glass-effect text-white hover:bg-gray-700">Mois dernier</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Chiffre d'Affaires Total" value={`${summary.totalTurnover.toLocaleString('fr-FR')} FCFA`} icon={<TrendingUp className="text-blue-400" />} />
                    <StatCard title="Frais de Livraison Totaux" value={`${summary.totalDeliveryFees.toLocaleString('fr-FR')} FCFA`} icon={<TrendingDown className="text-orange-400" />} />
                    <StatCard title="Total Colis Livrés" value={summary.totalPackages.toLocaleString('fr-FR')} icon={<Package className="text-purple-400" />} />
                </div>
            </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-white">Liste des Partenaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-slate-900/50">
                  <tr>
                    {['name', 'turnover', 'delivery_fees', 'packages_delivered'].map(key => (
                      <th key={key} scope="col" className="px-6 py-3">
                        <button onClick={() => requestSort(key)} className="flex items-center gap-1">
                          {key === 'name' ? 'Partenaire' : key === 'turnover' ? "Chiffre d'Affaires" : key === 'delivery_fees' ? 'Frais Livraison' : 'Colis Livrés'}
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                    ))}
                    {canManage && <th scope="col" className="px-6 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedPartners.map(partner => (
                    <tr key={partner.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-medium text-white">{partner.name} <span className="text-xs text-gray-400 block">{partner.partner_code}</span></td>
                      <td className="px-6 py-4">{partner.turnover.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-6 py-4">{partner.delivery_fees.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-6 py-4">{partner.packages_delivered.toLocaleString('fr-FR')}</td>
                      {canManage && (
                        <td className="px-6 py-4 flex items-center space-x-1">
                          <Link to={`/dashboard/partners/${partner.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300"><Eye className="w-4 h-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleOpenDialog(partner)}><Edit className="w-4 h-4" /></Button>
                          {canInvite && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300" onClick={() => { setEditingPartner(partner); setInviteForm({email: ''}); setIsInviteDialogOpen(true); }}><UserPlus className="w-4 h-4" /></Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent className="glass-effect border-slate-700 text-white">
                              <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible et supprimera le partenaire ainsi que toutes ses données associées (produits, stock...).</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handlePartnerDelete(partner.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
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
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-effect border-slate-700 text-white">
          <DialogHeader><DialogTitle>{editingPartner ? 'Modifier le Partenaire' : 'Ajouter un Partenaire'}</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {Object.keys(partnerForm).filter(k => !['id', 'created_at', 'partner_code', 'turnover', 'delivery_fees', 'packages_delivered'].includes(k)).map(key => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                <Input id={key} name={key} value={partnerForm[key] || ''} onChange={(e) => setPartnerForm({ ...partnerForm, [e.target.name]: e.target.value })} required={['name', 'email'].includes(key)} />
              </div>
            ))}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingPartner ? 'Enregistrer' : 'Ajouter'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="glass-effect border-slate-700 text-white">
            <DialogHeader><DialogTitle>Inviter un utilisateur pour {editingPartner?.name}</DialogTitle><DialogDescription>L'utilisateur recevra un e-mail pour créer son compte et sera lié à ce partenaire.</DialogDescription></DialogHeader>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="email">Email de l'utilisateur</Label><Input id="email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ email: e.target.value })} required /></div>
                <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Annuler</Button><Button type="submit">Envoyer l'invitation</Button></div>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
    <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-white">{value}</div>
        </CardContent>
    </Card>
);

export default PartnersManagement;