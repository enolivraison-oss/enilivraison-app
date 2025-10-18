import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Shield, Edit, Trash2, Key } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/customSupabaseClient';
import { Checkbox } from '@/components/ui/checkbox';
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

const availablePermissions = [
  { id: 'manage_partners', label: 'Gérer les partenaires' },
  { id: 'manage_stock', label: 'Gérer le stock' },
  { id: 'view_accounting', label: 'Voir la comptabilité' },
  { id: 'manage_accounting', label: 'Gérer la comptabilité' },
  { id: 'manage_salaries', label: 'Gérer les salaires' },
  { id: 'manage_users', label: 'Gérer les utilisateurs' },
  { id: 'export_reports', label: 'Exporter les rapports' },
];

const UserManagement = () => {
  const { user: currentUser, refreshUser, signUp } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'secretary',
  });

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*, user_permissions(permission)');
    if (error) {
      toast({ title: "❌ Erreur", description: "Impossible de charger les utilisateurs.", variant: "destructive" });
    } else {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.role) {
      toast({ title: "❌ Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }

    if (isEditing) {
      const { error } = await supabase.from('profiles').update({ full_name: formData.full_name, role: formData.role }).eq('id', selectedUser.id);
      if (error) {
        toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "✅ Utilisateur modifié", description: "Les informations ont été mises à jour." });
        fetchUsers();
        setIsDialogOpen(false);
      }
    } else {
      const { error: inviteError } = await signUp(formData.email, {
        data: {
          full_name: formData.full_name,
          role: formData.role,
        }
      });

      if (!inviteError) {
        toast({ title: "✅ Invitation envoyée", description: `Un e-mail d'invitation a été envoyé à ${formData.email}.` });
        fetchUsers();
        setIsDialogOpen(false);
      }
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({ full_name: user.full_name, email: 'non-modifiable', role: user.role });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setFormData({ full_name: '', email: '', role: 'secretary' });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const openPermissionsDialog = (user) => {
    setSelectedUser(user);
    setUserPermissions(user.user_permissions.map(p => p.permission));
    setIsPermissionsDialogOpen(true);
  };

  const handlePermissionsSave = async () => {
    if (!selectedUser) return;

    const { error: deleteError } = await supabase.from('user_permissions').delete().eq('user_id', selectedUser.id);
    if (deleteError) {
      toast({ title: "❌ Erreur", description: "Impossible de mettre à jour les permissions.", variant: "destructive" });
      return;
    }

    if (userPermissions.length > 0) {
      const permissionsToInsert = userPermissions.map(p => ({ user_id: selectedUser.id, permission: p }));
      const { error: insertError } = await supabase.from('user_permissions').insert(permissionsToInsert);
      if (insertError) {
        toast({ title: "❌ Erreur", description: "Impossible de sauvegarder les nouvelles permissions.", variant: "destructive" });
        return;
      }
    }

    toast({ title: "✅ Permissions mises à jour", description: `Les permissions pour ${selectedUser.full_name} ont été sauvegardées.` });
    setIsPermissionsDialogOpen(false);
    await fetchUsers();
    if (selectedUser.id === currentUser.id) {
      await refreshUser();
    }
  };

  const deleteUser = async (userId) => {
    const { error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });
    if (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🗑️ Utilisateur supprimé", description: "Le compte a été supprimé avec succès." });
      fetchUsers();
    }
  };

  const getRoleDisplayName = (role) => ({
    ceo: 'CEO',
    accountant: 'Comptable',
    secretary: 'Secrétaire',
    partner: 'Partenaire'
  }[role] || role);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Utilisateurs</h1>
          <p className="text-gray-400">Créez, gérez les comptes et les permissions.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-green-500 to-emerald-600"><Plus className="w-4 h-4 mr-2" />Nouvel Utilisateur</Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user, index) => (
          <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
            <Card className="glass-effect card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-green-500 text-white">{user.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-white">{user.full_name}</CardTitle>
                      <CardDescription className="text-gray-400">{getRoleDisplayName(user.role)}</CardDescription>
                    </div>
                  </div>
                  {currentUser.id !== user.id && user.role !== 'ceo' && (
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => openPermissionsDialog(user)}><Key className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => openEditDialog(user)}><Edit className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-effect">
                          <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. L'utilisateur sera définitivement supprimé.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="glass-effect hover:bg-gray-700">Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-gray-300"><Shield className="w-4 h-4 mr-2" />{user.role === 'partner' ? `Partenaire ID: ${user.partner_id}` : 'Employé'}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier l'utilisateur" : "Inviter un nouvel utilisateur"}</DialogTitle>
            <DialogDescription>{isEditing ? "Modifiez les informations de l'utilisateur." : "Entrez l'email pour envoyer une invitation."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="full_name">Nom complet *</Label><Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} className="glass-effect" required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="glass-effect" required disabled={isEditing} /></div>
            <div className="space-y-2"><Label htmlFor="role">Rôle *</Label><Select value={formData.role} onValueChange={handleRoleChange}><SelectTrigger className="glass-effect"><SelectValue /></SelectTrigger><SelectContent className="glass-effect"><SelectItem value="secretary">Secrétaire</SelectItem><SelectItem value="accountant">Comptable</SelectItem></SelectContent></Select></div>
            <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="glass-effect hover:bg-gray-700">Annuler</Button><Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600">{isEditing ? "Enregistrer" : "Envoyer l'invitation"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="glass-effect max-w-md">
          <DialogHeader>
            <DialogTitle>Gérer les permissions pour {selectedUser?.full_name}</DialogTitle>
            <DialogDescription>Attribuez ou retirez des fonctionnalités spécifiques.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {availablePermissions.map(permission => (
              <div key={permission.id} className="flex items-center space-x-2">
                <Checkbox
                  id={permission.id}
                  checked={userPermissions.includes(permission.id)}
                  onCheckedChange={(checked) => {
                    setUserPermissions(prev => checked ? [...prev, permission.id] : prev.filter(p => p !== permission.id));
                  }}
                />
                <Label htmlFor={permission.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {permission.label}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPermissionsDialogOpen(false)} className="glass-effect hover:bg-gray-700">Annuler</Button>
            <Button onClick={handlePermissionsSave} className="bg-gradient-to-r from-green-500 to-emerald-600">Sauvegarder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;