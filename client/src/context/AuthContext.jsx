/**
 * AuthContext
 * ------------------------------------------------------------------
 * Tracks the signed-in Firebase user and their role. The role is
 * read from the ID token's custom claims (set by the server when an
 * admin creates the account), so no extra request is needed.
 * ------------------------------------------------------------------
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { can as canRole } from "../lib/permissions.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, role: null, loading: true });

  useEffect(() => {
    // Fires on sign-in, sign-out and every token refresh.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ user: null, role: null, loading: false });
        return;
      }
      try {
        const token = await firebaseUser.getIdTokenResult();
        setState({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
          },
          role: token.claims.role || null,
          loading: false,
        });
      } catch {
        setState({ user: null, role: null, loading: false });
      }
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
      logout: () => signOut(auth),
      can: (action) => canRole(state.role, action),
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
