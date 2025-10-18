import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SupabaseAuthContext = createContext();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Initialisation de la session et écoute des changements
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔹 Connexion d’un utilisateur existant
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      alert('Connexion réussie ✅');
      return data;
    } catch (err) {
      console.error('Erreur lors de la connexion :', err.message);
      alert('Erreur : ' + err.message);
    }
  };

  // 🔹 Inscription d’un nouvel utilisateur (côté client)
  const signUp = async (email, password, role) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role }, // rôle stocké dans user_metadata
          emailRedirectTo: `${window.location.origin}/update-user`,
        },
      });

      if (error) throw error;

      alert('Inscription réussie ✅. Vérifiez votre email pour confirmer votre compte.');
      return data;
    } catch (err) {
      console.error('Erreur lors de la création de l’utilisateur :', err.message);
      alert('Erreur : ' + err.message);
    }
  };

  // 🔹 Déconnexion
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      alert('Déconnexion réussie ✅');
    } catch (err) {
      console.error('Erreur lors de la déconnexion :', err.message);
      alert('Erreur : ' + err.message);
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

// 🔹 Hook pour utiliser le contexte
export const useAuth = () => useContext(SupabaseAuthContext);
