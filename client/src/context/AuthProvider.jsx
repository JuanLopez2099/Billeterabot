import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL;


function obtenerNombre(u) {
  if (!u) return '';
  return (
    u.user_metadata?.nombre ||
    u.user_metadata?.full_name ||
    u.user_metadata?.name ||
    u.email
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  async function asegurarUsuarioEnBackend(session) {
  try {
    const nombre = obtenerNombre(session.user);

    await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ nombre }),
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
          return; 
        }

        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          asegurarUsuarioEnBackend(session);
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

  const value = { user, loading, signOut, recoveryMode, salirDeRecoveryMode, nombre: obtenerNombre(user) };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}