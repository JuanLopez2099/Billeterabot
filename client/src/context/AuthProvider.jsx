import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  async function asegurarUsuarioEnBackend(sessionUser) {
    try {
      const nombre =
        sessionUser.user_metadata?.nombre ||
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        sessionUser.email;

      await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionUser.id,
          nombre,
          email: sessionUser.email,
        }),
      });
    } catch (err) {
      console.error('Error al sincronizar usuario con el backend:', err);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryMode(true);
          return; // No tratamos esto como una sesión normal todavía
        }

        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          asegurarUsuarioEnBackend(session.user);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  function salirDeRecoveryMode() {
    setRecoveryMode(false);
  }

  const value = { user, loading, signOut, recoveryMode, salirDeRecoveryMode };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}