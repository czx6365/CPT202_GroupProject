import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const TOKEN_KEY = "heritagehub.token";
const USER_KEY = "heritagehub.user";

const AuthContext = createContext(null);

function readStoredValue(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function readStoredUser(storage) {
  const raw = readStoredValue(storage, USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readSession() {
  const localToken = readStoredValue(localStorage, TOKEN_KEY);
  if (localToken) {
    return {
      token: localToken,
      user: readStoredUser(localStorage),
      persistent: true,
    };
  }

  const sessionToken = readStoredValue(sessionStorage, TOKEN_KEY);
  if (sessionToken) {
    return {
      token: sessionToken,
      user: readStoredUser(sessionStorage),
      persistent: false,
    };
  }

  return {
    token: "",
    user: null,
    persistent: true,
  };
}

function clearSessionStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const { token, user, persistent } = session;
  const writeUserToStorage = useCallback((nextUser, nextPersistent) => {
    const targetStorage = nextPersistent ? localStorage : sessionStorage;
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    if (nextUser) {
      targetStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
  }, []);

  const login = useCallback((authPayload, options = {}) => {
    const nextToken = authPayload?.token || "";
    const nextUser = authPayload?.user || null;
    const nextPersistent = options.persistent ?? true;
    const targetStorage = nextPersistent ? localStorage : sessionStorage;

    clearSessionStorage();

    if (nextToken) {
      targetStorage.setItem(TOKEN_KEY, nextToken);
    }

    if (nextUser) {
      targetStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }

    setSession({
      token: nextToken,
      user: nextUser,
      persistent: nextPersistent,
    });
  }, []);

  const logout = useCallback(() => {
    clearSessionStorage();
    setSession({
      token: "",
      user: null,
      persistent: true,
    });
  }, []);

  const setUser = useCallback((nextUser) => {
    writeUserToStorage(nextUser, persistent);
    setSession((previous) => ({
      ...previous,
      user: nextUser,
    }));
  }, [persistent, writeUserToStorage]);

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || "viewer",
      isAuthenticated: Boolean(token),
      persistent,
      login,
      logout,
      setUser,
    }),
    [login, logout, persistent, setUser, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
