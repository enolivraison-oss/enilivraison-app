import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const SettingsPage = () => {
  const { toast } = useToast();
  const { resetAccounting, refreshData } = useData();
  const [reassignLoading, setReassignLoading] = useState(false);

  const handleResetAccounting = async () => {
    try {
      await resetAccounting();
      toast({
        title: "✅ Réinitialisation réussie",
        description: "Toutes les données comptables ont été effacées.",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur de réinitialisation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReassignPartnerCodes = async () => {
    setReassignLoading(true);
    try {
      const { data, error } = await supabase.rpc('reassign_partner_codes');
      if (error) throw error;
      
      await refreshData(); // Refresh data context to get new codes
      
      toast({
        title: "✅ Réassignation réussie",
        description: `${data.length} code(s) partenaire ont été mis à jour.`,
      });
    } catch (error) {
      toast({
        title: "❌ Erreur de réassignation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setReassignLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-gray-400">Gérez les paramètres avancés de l'application.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <Card className="glass-effect border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle />
              Zone de Danger
            </CardTitle>
            <CardDescription className="text-gray-400">
              Les actions dans cette section sont irréversibles. Procédez avec une extrême prudence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-red-500/20 rounded-lg">
              <div>
                <h3 className="font-semibold text-white">Réinitialiser les données comptables</h3>
                <p className="text-sm text-gray-400">Supprime toutes les transactions, livraisons, et dépôts. Utile pour un nouveau départ en début d'exercice fiscal.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-2 sm:mt-0 shrink-0">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-effect">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes les données comptables (transactions, livraisons, dépôts, etc.) seront définitivement supprimées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="glass-effect hover:bg-gray-700">Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAccounting} className="bg-red-600 hover:bg-red-700">
                      Oui, tout supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-red-500/20 rounded-lg">
              <div>
                <h3 className="font-semibold text-white">Réassigner les codes partenaires</h3>
                <p className="text-sm text-gray-400">Recalcule et réassigne tous les codes partenaires (PAT###) en se basant sur leur date de création. Utile pour corriger des incohérences.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-2 sm:mt-0 shrink-0" disabled={reassignLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${reassignLoading ? 'animate-spin' : ''}`} />
                    {reassignLoading ? 'En cours...' : 'Réassigner les codes'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-effect">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la réassignation ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action va réinitialiser et réassigner tous les codes partenaires. Les anciens codes seront perdus. Êtes-vous sûr de vouloir continuer ?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="glass-effect hover:bg-gray-700">Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReassignPartnerCodes} className="bg-red-600 hover:bg-red-700">
                      Oui, réassigner
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SettingsPage;