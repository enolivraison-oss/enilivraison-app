import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const useCreateCeo = () => {
  const { toast } = useToast();
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === true || process.env.NODE_ENV !== 'development') {
      return;
    }

    const createCeoAccount = async () => {
      const email = 'eunockelegbede8@gmail.com';
      const password = 'Boladji2004@';
      const fullName = 'Eunock Elegbede';

      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'ceo')
        .limit(1);

      if (profileError) {
        console.error("Erreur lors de la vérification du profil CEO:", profileError.message);
        return;
      }

      if (existingProfile && existingProfile.length > 0) {
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'ceo',
          },
          email_confirm: false,
        },
      });

      if (error) {
        if (error.message.includes("User already registered") || error.message.includes("duplicate key value")) {
          // Silencieux
        } else if (error.code !== '429') { // Ne pas afficher le toast pour le rate limit
          toast({
            title: "Erreur lors de la création du compte CEO",
            description: error.message,
            variant: "destructive",
          });
        }
      } else if (data.user) {
        toast({
          title: "Compte CEO créé",
          description: "Le compte administrateur a été initialisé avec succès.",
        });
      }
    };

    createCeoAccount();

    return () => {
      effectRan.current = true;
    };
  }, [toast]);
};

export default useCreateCeo;