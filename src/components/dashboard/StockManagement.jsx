import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, AlertTriangle, TrendingUp, TrendingDown, History, Search, Edit, Trash2, ChevronsUpDown, Check, RefreshCw } from 'lucide-react';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const StockManagement = () => {
  const { products, partners, addProduct, updateProduct, deleteProduct, addStockMovement, stockMovements, refreshData, isRefreshing } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [movementComboboxOpen, setMovementComboboxOpen] = useState(false);
  
  const userRole = user?.user_metadata?.role;
  const userPartnerId = user?.user_metadata?.partner_id;

  const visibleProducts = useMemo(() => {
    if (userRole === 'partner') {
      return products.filter(p => p.partner_id === userPartnerId);
    }
    return products;
  }, [products, userRole, userPartnerId]);

  const initialProductForm = { name: '', partner_id: userRole === 'partner' ? userPartnerId : '', stock: 0, alert_threshold: 0, price: 0 };
  const [productForm, setProductForm] = useState(initialProductForm);
  
  const [movementForm, setMovementForm] = useState({
    product_id: '',
    type: 'in',
    quantity: 0,
    reason: ''
  });

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.partner_id) {
      toast({ title: "❌ Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        ...productForm,
        stock: parseInt(productForm.stock) || 0,
        alert_threshold: parseInt(productForm.alert_threshold) || 0,
        price: parseFloat(productForm.price) || 0
      };

      if (isEditing) {
        await updateProduct(selectedProduct.id, payload);
        toast({ title: "✅ Produit modifié", description: `${productForm.name} a été mis à jour.` });
      } else {
        await addProduct(payload);
        toast({ title: "✅ Produit ajouté", description: `${productForm.name} a été ajouté au stock` });
      }
      
      setProductForm(initialProductForm);
      setIsProductDialogOpen(false);
      setIsEditing(false);
      setSelectedProduct(null);
    } catch (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    setProductForm(product);
    setIsProductDialogOpen(true);
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setProductForm(initialProductForm);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      toast({ title: "🗑️ Produit supprimé", description: "Le produit a été supprimé avec succès." });
    } catch (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    if (!movementForm.product_id || !movementForm.quantity) {
      toast({ title: "❌ Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    try {
      const product = products.find(p => p.id === movementForm.product_id);
      const quantity = parseInt(movementForm.quantity);
      const newStock = movementForm.type === 'in' ? product.stock + quantity : product.stock - quantity;

      if (newStock < 0) {
        toast({ title: "❌ Erreur", description: "Stock insuffisant pour cette sortie", variant: "destructive" });
        return;
      }

      await updateProduct(movementForm.product_id, { stock: newStock });
      await addStockMovement({
        ...movementForm,
        quantity: quantity,
        previous_stock: product.stock,
        new_stock: newStock
      });
      toast({ title: "✅ Mouvement enregistré", description: `Stock mis à jour pour ${product.name}` });
      setMovementForm({ product_id: '', type: 'in', quantity: 0, reason: '' });
      setIsMovementDialogOpen(false);
    } catch (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    }
  };

  const filteredProducts = useMemo(() => {
    return visibleProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visibleProducts, searchTerm]);

  const visibleStockMovements = useMemo(() => {
    if (userRole === 'partner') {
        const partnerProductIds = visibleProducts.map(p => p.id);
        return stockMovements.filter(sm => partnerProductIds.includes(sm.product_id));
    }
    return stockMovements;
  }, [stockMovements, visibleProducts, userRole]);

  const lowStockProducts = filteredProducts.filter(p => p.stock <= p.alert_threshold && p.alert_threshold > 0);
  const canManageStock = userRole === 'ceo' || userRole === 'accountant' || userRole === 'secretary' || userRole === 'partner';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion du Stock</h1>
          <p className="text-gray-400">Gérez vos produits et mouvements de stock</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-effect pl-10"
            />
          </div>
          <Button onClick={refreshData} disabled={isRefreshing} variant="outline" size="icon" className="glass-effect text-white hover:bg-gray-700">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {canManageStock && (
            <div className="flex space-x-2">
              <Button onClick={openCreateDialog} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"><Plus className="w-4 h-4 mr-2" />Produit</Button>
              <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
                <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"><TrendingUp className="w-4 h-4 mr-2" />Mouvement</Button></DialogTrigger>
                <DialogContent className="glass-effect">
                  <DialogHeader><DialogTitle>Enregistrer un Mouvement de Stock</DialogTitle></DialogHeader>
                  <form onSubmit={handleMovementSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="productSelect">Produit *</Label>
                      <Popover open={movementComboboxOpen} onOpenChange={setMovementComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={movementComboboxOpen} className="w-full justify-between glass-effect">
                            {movementForm.product_id ? visibleProducts.find((p) => p.id === movementForm.product_id)?.name : "Sélectionner un produit..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass-effect">
                          <Command>
                            <CommandInput placeholder="Rechercher un produit..." />
                            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {visibleProducts.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.name}
                                    onSelect={() => {
                                      setMovementForm({ ...movementForm, product_id: product.id });
                                      setMovementComboboxOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", movementForm.product_id === product.id ? "opacity-100" : "opacity-0")} />
                                    {product.name} {userRole !== 'partner' && `(${partners.find(p => p.id === product.partner_id)?.name})`}
                                  </CommandItem>
                                ))}
                              </CommandList>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="movementType">Type</Label><Select value={movementForm.type} onValueChange={(value) => setMovementForm({...movementForm, type: value})}><SelectTrigger className="glass-effect"><SelectValue /></SelectTrigger><SelectContent className="glass-effect"><SelectItem value="in">Entrée (+)</SelectItem><SelectItem value="out">Sortie (-)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="quantity">Quantité *</Label><Input id="quantity" type="number" value={movementForm.quantity} onChange={(e) => setMovementForm({...movementForm, quantity: e.target.value})} className="glass-effect" required /></div></div>
                    <div className="space-y-2"><Label htmlFor="reason">Motif</Label><Input id="reason" value={movementForm.reason} onChange={(e) => setMovementForm({...movementForm, reason: e.target.value})} className="glass-effect" /></div>
                    <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)} className="glass-effect hover:bg-gray-700">Annuler</Button><Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">Enregistrer</Button></div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </motion.div>
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="bg-gray-800/80"><TabsTrigger value="products" className="data-[state=active]:bg-gray-900/80 text-white">Produits ({filteredProducts.length})</TabsTrigger><TabsTrigger value="alerts" className="data-[state=active]:bg-gray-900/80 text-white">Alertes ({lowStockProducts.length})</TabsTrigger><TabsTrigger value="movements" className="data-[state=active]:bg-gray-900/80 text-white">Historique</TabsTrigger></TabsList>
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => {
              const partner = partners.find(p => p.id === product.partner_id);
              const isLowStock = product.stock <= product.alert_threshold && product.alert_threshold > 0;
              return (<motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}><Card className={`glass-effect card-hover ${isLowStock ? 'border-yellow-500/50' : 'border-slate-800'}`}><CardHeader><div className="flex items-start justify-between"><div className="flex items-center space-x-3"><div className={`w-12 h-12 bg-gradient-to-br ${isLowStock ? 'from-yellow-500 to-orange-500' : 'from-green-500 to-emerald-600'} rounded-lg flex items-center justify-center`}><Package className="w-6 h-6 text-white" /></div><div><CardTitle className="text-white text-lg">{product.name}</CardTitle>{userRole !== 'partner' && <CardDescription className="text-gray-400">{partner?.name} ({partner?.partner_code})</CardDescription>}</div></div><div className="flex items-center">{isLowStock && (<AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />)}{canManageStock && (<><Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => openEditDialog(product)}><Edit className="w-4 h-4" /></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent className="glass-effect"><AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le produit sera définitivement supprimé.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="glass-effect hover:bg-gray-700">Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>)}</div></div></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-4"><div><p className="text-gray-400 text-sm">Stock Actuel</p><p className={`text-2xl font-bold ${isLowStock ? 'text-yellow-500' : 'text-green-400'}`}>{product.stock}</p></div><div><p className="text-gray-400 text-sm">Seuil d'Alerte</p><p className="text-xl font-semibold text-gray-300">{product.alert_threshold}</p></div></div>{product.price > 0 && (<div><p className="text-gray-400 text-sm">Prix Unitaire</p><p className="text-lg font-semibold text-white">{product.price.toLocaleString()} FCFA</p></div>)}</CardContent></Card></motion.div>);
            })}
            {filteredProducts.length === 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="col-span-full"><Card className="glass-effect text-center py-12"><CardContent><Package className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">Aucun produit trouvé</h3><p className="text-gray-400 mb-4">Essayez un autre terme de recherche ou ajoutez un nouveau produit.</p>{canManageStock && (<Button onClick={openCreateDialog} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"><Plus className="w-4 h-4 mr-2" />Ajouter un Produit</Button>)}</CardContent></Card></motion.div>)}
          </div>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStockProducts.map((product, index) => {
              const partner = partners.find(p => p.id === product.partner_id);
              return (<motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}><Card className="glass-effect card-hover border-yellow-500/50"><CardHeader><div className="flex items-start justify-between"><div className="flex items-center space-x-3"><div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-white" /></div><div><CardTitle className="text-white text-lg">{product.name}</CardTitle>{userRole !== 'partner' && <CardDescription className="text-gray-400">{partner?.name}</CardDescription>}</div></div></div></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-4"><div><p className="text-gray-400 text-sm">Stock Actuel</p><p className="text-2xl font-bold text-yellow-500">{product.stock}</p></div><div><p className="text-gray-400 text-sm">Seuil d'Alerte</p><p className="text-xl font-semibold text-gray-300">{product.alert_threshold}</p></div></div></CardContent></Card></motion.div>);
            })}
            {lowStockProducts.length === 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="col-span-full"><Card className="glass-effect text-center py-12"><CardContent><AlertTriangle className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">Aucune alerte de stock</h3><p className="text-gray-400">Tous les produits sont au-dessus de leur seuil d'alerte.</p></CardContent></Card></motion.div>)}
          </div>
        </TabsContent>
        <TabsContent value="movements" className="space-y-6">
          <Card className="glass-effect"><CardHeader><CardTitle className="text-white flex items-center space-x-2"><History className="w-5 h-5" /><span>Historique des Mouvements</span></CardTitle></CardHeader><CardContent><div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">{visibleStockMovements.slice(0, 50).map((movement) => { const product = products.find(p => p.id === movement.product_id); const partner = partners.find(p => p.id === product?.partner_id); return (<div key={movement.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"><div className="flex items-center space-x-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${movement.type === 'in' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>{movement.type === 'in' ? (<TrendingUp className="w-4 h-4 text-green-500" />) : (<TrendingDown className="w-4 h-4 text-red-500" />)}</div><div><p className="text-white font-medium">{product?.name}</p>{userRole !== 'partner' && <p className="text-gray-500 text-sm">{partner?.name} • {movement.reason || 'Aucun motif'}</p>}</div></div><div className="text-right"><p className={`font-semibold ${movement.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>{movement.type === 'in' ? '+' : '-'}{movement.quantity}</p><p className="text-gray-500 text-sm">{format(new Date(movement.created_at), 'dd MMM, HH:mm', { locale: fr })}</p></div></div>);})}{visibleStockMovements.length === 0 && (<div className="text-center py-8"><History className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-semibold text-white mb-2">Aucun mouvement</h3><p className="text-gray-400">L'historique des mouvements apparaîtra ici</p></div>)}</div></CardContent></Card>
        </TabsContent>
      </Tabs>
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader><DialogTitle>{isEditing ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</DialogTitle></DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Nom du Produit *</Label>
              <Input
                id="productName"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="glass-effect"
                placeholder="Entrez le nom du produit"
                required
              />
            </div>
            {userRole !== 'partner' && <div className="space-y-2"><Label htmlFor="partner_id">Partenaire *</Label><Select value={productForm.partner_id} onValueChange={(value) => setProductForm({...productForm, partner_id: value})}><SelectTrigger className="glass-effect"><SelectValue placeholder="Sélectionner un partenaire" /></SelectTrigger><SelectContent className="glass-effect">{partners.map(partner => (<SelectItem key={partner.id} value={partner.id}>{partner.name} ({partner.partner_code})</SelectItem>))}</SelectContent></Select></div>}
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="stock">Stock Initial</Label><Input id="stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="glass-effect" /></div><div className="space-y-2"><Label htmlFor="alert_threshold">Seuil d'Alerte</Label><Input id="alert_threshold" type="number" value={productForm.alert_threshold} onChange={(e) => setProductForm({...productForm, alert_threshold: e.target.value})} className="glass-effect" /></div></div>
            <div className="space-y-2"><Label htmlFor="price">Prix Unitaire (FCFA)</Label><Input id="price" type="number" step="1" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="glass-effect" /></div>
            <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)} className="glass-effect hover:bg-gray-700">Annuler</Button><Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">{isEditing ? 'Enregistrer' : 'Ajouter'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockManagement;