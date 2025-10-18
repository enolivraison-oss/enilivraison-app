import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Lock, Key } from 'lucide-react';

const UpdateUserPage = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (session && user?.user_metadata?.password_set) {
      navigate('/dashboard');
    }
  }, [session, user, navigate]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Mot de passe trop court",
        description: "Votre mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
      data: { password_set: true }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur lors de la mise à jour",
        description: error.message,
      });
    } else {
      toast({
        title: "Mot de passe défini avec succès !",
        description: "Vous allez être redirigé vers votre tableau de bord.",
      });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Définir votre mot de passe - Eno Livraison</title>
        <meta name="description" content="Finalisez la création de votre compte en définissant votre mot de passe." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="glass-effect border-green-500/20">
            <CardHeader className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto"
              >
                <Key className="w-16 h-16 text-green-400" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl font-bold gradient-text">Bienvenue !</CardTitle>
                <CardDescription className="text-gray-300">
                  Définissez votre mot de passe pour accéder à votre espace.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Enregistrement...</span>
                    </div>
                  ) : (
                    'Définir le mot de passe et continuer'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default UpdateUserPage;