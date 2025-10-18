import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Package, AlertTriangle, Search, Edit, Trash2, ArrowLeft } from 'lucide-react';
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

const PartnerStockDetail = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { products, partners, addProduct, updateProduct, deleteProduct } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const partner = useMemo(() => partners.find(p => p.id === partnerId), [partners, partnerId]);
  
  const initialProductForm = { name: '', partner_id: partnerId, stock: 0, alert_threshold: 0, price: 0 };
  const [productForm, setProductForm] = useState(initialProductForm);

  const partnerProducts = useMemo(() => {
    return products.filter(p => p.partner_id === partnerId);
  }, [products, partnerId]);

  const filteredProducts = useMemo(() => {
    return partnerProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [partnerProducts, searchTerm]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name) {
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

  const canManageStock = user?.user_metadata?.role === 'ceo' || user?.user_metadata?.role === 'accountant' || user?.user_metadata?.role === 'secretary';

  if (!partner) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="glass-effect text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Partenaire non trouvé</h3>
            <p className="text-gray-400 mb-4">Le partenaire que vous cherchez n'existe pas.</p>
            <Button onClick={() => navigate('/dashboard/partners')} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux partenaires
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 glass-effect hover:bg-gray-700" onClick={() => navigate('/dashboard/partners')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Stock de {partner.name}</h1>
            <p className="text-gray-400">Gérez les produits de ce partenaire.</p>
          </div>
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
          {canManageStock && (
            <Button onClick={openCreateDialog} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"><Plus className="w-4 h-4 mr-2" />Produit</Button>
          )}
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => {
          const isLowStock = product.stock <= product.alert_threshold && product.alert_threshold > 0;
          return (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
              <Card className={`glass-effect card-hover ${isLowStock ? 'border-yellow-500/50' : 'border-slate-800'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${isLowStock ? 'from-yellow-500 to-orange-500' : 'from-green-500 to-emerald-600'} rounded-lg flex items-center justify-center`}>
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{product.name}</CardTitle>
                        <CardDescription className="text-gray-400">{partner?.name}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {isLowStock && (<AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />)}
                      {canManageStock && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => openEditDialog(product)}><Edit className="w-4 h-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent className="glass-effect">
                              <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le produit sera définitivement supprimé.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="glass-effect hover:bg-gray-700">Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-gray-400 text-sm">Stock Actuel</p><p className={`text-2xl font-bold ${isLowStock ? 'text-yellow-500' : 'text-green-400'}`}>{product.stock}</p></div>
                    <div><p className="text-gray-400 text-sm">Seuil d'Alerte</p><p className="text-xl font-semibold text-gray-300">{product.alert_threshold}</p></div>
                  </div>
                  {product.price > 0 && (<div><p className="text-gray-400 text-sm">Prix Unitaire</p><p className="text-lg font-semibold text-white">{product.price.toLocaleString()} FCFA</p></div>)}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filteredProducts.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="col-span-full">
            <Card className="glass-effect text-center py-12">
              <CardContent>
                <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-400 mb-4">Ce partenaire n'a aucun produit en stock pour le moment.</p>
                {canManageStock && (<Button onClick={openCreateDialog} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"><Plus className="w-4 h-4 mr-2" />Ajouter un Produit</Button>)}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader><DialogTitle>{isEditing ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</DialogTitle></DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="productName">Nom du Produit *</Label><Input id="productName" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="glass-effect" required /></div>
            <div className="space-y-2"><Label>Partenaire</Label><Input value={partner.name} className="glass-effect" disabled /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="stock">Stock Initial</Label><Input id="stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="glass-effect" /></div>
              <div className="space-y-2"><Label htmlFor="alert_threshold">Seuil d'Alerte</Label><Input id="alert_threshold" type="number" value={productForm.alert_threshold} onChange={(e) => setProductForm({...productForm, alert_threshold: e.target.value})} className="glass-effect" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="price">Prix Unitaire (FCFA)</Label><Input id="price" type="number" step="1" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="glass-effect" /></div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)} className="glass-effect hover:bg-gray-700">Annuler</Button>
              <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">{isEditing ? 'Enregistrer' : 'Ajouter'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerStockDetail;