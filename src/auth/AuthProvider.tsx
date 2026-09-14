import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "app_session";
const ONBOARDING_KEY = "onboarding_seen";

type AuthContextType = {
  isLoading: boolean;
  isLoggedIn: boolean;
  hasSeenOnboarding: boolean;

  login: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  async function loadStoredAuth() {
    try {
      const session = await SecureStore.getItemAsync(SESSION_KEY);

      const onboarding = await SecureStore.getItemAsync(ONBOARDING_KEY);

      setIsLoggedIn(session !== null);

      setHasSeenOnboarding(onboarding === "true");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function login() {
    await SecureStore.setItemAsync(SESSION_KEY, "local-session");

    setIsLoggedIn(true);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(SESSION_KEY);

    setIsLoggedIn(false);
  }

  async function completeOnboarding() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");

    setHasSeenOnboarding(true);
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn,
        hasSeenOnboarding,

        login,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
