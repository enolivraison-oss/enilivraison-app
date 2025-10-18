import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/customSupabaseClient';

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      });
    }
  }, [user]);

  const handleInfoChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setLoadingInfo(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: formData.full_name, avatar_url: formData.avatar_url }
    });
    if (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Succès", description: "Votre profil a été mis à jour." });
    }
    setLoadingInfo(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "❌ Erreur", description: "Les nouveaux mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
    if (error) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Succès", description: "Votre mot de passe a été modifié." });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    }
    setLoadingPassword(false);
  };

  return (
    <>
      <Helmet>
        <title>Mon Profil - Eno Livraison</title>
        <meta name="description" content="Gérez les informations de votre profil." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold text-white">Mon Profil</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="glass-effect border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Informations Personnelles</CardTitle>
                <CardDescription className="text-gray-400">Mettez à jour vos informations.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formData.avatar_url} alt={formData.full_name} />
                      <AvatarFallback className="bg-green-500 text-white text-3xl">
                        {formData.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Input
                      name="avatar_url"
                      placeholder="URL de l'image de profil"
                      value={formData.avatar_url}
                      onChange={handleInfoChange}
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom et Prénom</Label>
                    <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInfoChange} className="bg-slate-800/50 border-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse Email</Label>
                    <Input id="email" name="email" type="email" value={user?.email} className="bg-slate-800/50 border-slate-700" disabled />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600" disabled={loadingInfo}>
                    {loadingInfo ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="glass-effect border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Changer le mot de passe</CardTitle>
                <CardDescription className="text-gray-400">Mettez à jour votre mot de passe.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input id="newPassword" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} className="bg-slate-800/50 border-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="bg-slate-800/50 border-slate-700" />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-600" disabled={loadingPassword}>
                    {loadingPassword ? 'Modification...' : 'Changer le mot de passe'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ProfilePage;