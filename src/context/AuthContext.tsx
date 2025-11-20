import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Ο client που έφτιαξες
import type { Session } from '@supabase/supabase-js';

// Ορίζουμε τον τύπο (type) για το context
interface AuthContextType {
  session: Session | null;
  loading: boolean;
}

// Δημιουργούμε το Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Δημιουργούμε τον Provider (το "περιτύλιγμα")
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Προσπάθησε να πάρεις το session αμέσως
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Άκου για μελλοντικές αλλαγές (Login, Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Αν η αλλαγή δεν είναι το αρχικό loading, δεν χρειάζεται να αλλάξουμε το loading
        if (_event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // Καθαρισμός του listener όταν το component φεύγει
    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    loading,
  };

  // Μην δείξεις την εφαρμογή μέχρι να ξέρουμε αν ο χρήστης είναι μέσα
  // Επιστρέφουμε το Context Provider ΜΟΝΟ αν δεν κάνει loading
  // (Αν και μπορούμε να το επιστρέψουμε και με loading και να το χειριστεί το route)
  return (
    <AuthContext.Provider value={value}>
      {/* {!loading && children} // Μπορείς να το κάνεις κι έτσι */}
      {children}
    </AuthContext.Provider>
  );
};

// Ένα custom hook για να παίρνουμε εύκολα το context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};