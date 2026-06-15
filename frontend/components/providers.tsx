"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";

axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type User = {
  id?: string;
  full_name?: string;
  email?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AED" | "SGD";

export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  INR: 83.0,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SGD: 1.35,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SGD: "S$",
};

type CurrencyContextType = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  rates: Record<CurrencyCode, number>;
  symbols: Record<CurrencyCode, string>;
  formatVal: (usdValue: number | string | undefined | null, decimals?: number) => string;
  convertVal: (usdValue: number | string | undefined | null) => number;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  rates: CURRENCY_RATES,
  symbols: CURRENCY_SYMBOLS,
  formatVal: (val) => String(val || ""),
  convertVal: (val) => Number(val || 0),
});

export const useAuth = () => useContext(AuthContext);
export const useTheme = () => useContext(ThemeContext);
export const useCurrency = () => useContext(CurrencyContext);

function applyTheme(nextTheme: Theme) {
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  document.documentElement.style.colorScheme = nextTheme;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>("light");
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const savedTheme = localStorage.getItem("startupforge-theme") as Theme | null;
    const resolvedTheme = savedTheme || "light";
    setTheme(resolvedTheme);
    applyTheme(resolvedTheme);
  }, []);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("startupforge-currency") as CurrencyCode | null;
    if (savedCurrency && CURRENCY_RATES[savedCurrency]) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);
    axios.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
    axios.get("/api/v1/auth/me")
      .then((res) => {
        setUser(res.data);
        if (res.data.currency && CURRENCY_RATES[res.data.currency as CurrencyCode]) {
          setCurrencyState(res.data.currency as CurrencyCode);
          localStorage.setItem("startupforge-currency", res.data.currency);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common.Authorization;
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const nextTheme = current === "light" ? "dark" : "light";
      localStorage.setItem("startupforge-theme", nextTheme);
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("startupforge-currency", newCurrency);
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      axios.put("/api/v1/auth/me/currency", { currency: newCurrency })
        .catch((err) => console.error("Could not sync currency with profile:", err));
    }
  }, []);

  const login = useCallback(async (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    const res = await axios.get("/api/v1/auth/me");
    setUser(res.data);
    if (res.data.currency && CURRENCY_RATES[res.data.currency as CurrencyCode]) {
      setCurrencyState(res.data.currency as CurrencyCode);
      localStorage.setItem("startupforge-currency", res.data.currency);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common.Authorization;
    window.location.href = "/login";
  }, []);

  const convertVal = useCallback((val: number | string | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === "number") {
      return val * CURRENCY_RATES[currency];
    }
    const cleanStr = val.toString().replace(/[$,₹€£A\s]/g, "").replace("د.إ", "").replace("AED", "").trim();
    let numeric = parseFloat(cleanStr.replace(/,/g, ""));
    if (isNaN(numeric)) return 0;
    
    const upperStr = val.toString().toUpperCase();
    let multiplier = 1;
    if (upperStr.includes("B")) {
      multiplier = 1000000000;
    } else if (upperStr.includes("M")) {
      multiplier = 1000000;
    } else if (upperStr.includes("K")) {
      multiplier = 1000;
    }
    
    return numeric * multiplier * CURRENCY_RATES[currency];
  }, [currency]);

  const formatVal = useCallback((val: number | string | undefined | null, decimals = 0): string => {
    if (val === undefined || val === null) return "";
    
    const strVal = val.toString().trim();
    const upperStr = strVal.toUpperCase();
    const hasSuffix = upperStr.endsWith("B") || upperStr.endsWith("M") || upperStr.endsWith("K");
    
    const symbol = CURRENCY_SYMBOLS[currency];
    const rate = CURRENCY_RATES[currency];
    
    if (hasSuffix) {
      const suffix = upperStr.slice(-1);
      const numericStr = strVal.replace(/[$,₹€£A\s]/gi, "").slice(0, -1).trim();
      const numeric = parseFloat(numericStr);
      if (isNaN(numeric)) return strVal;
      
      const converted = numeric * rate;
      return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${suffix}`;
    }
    
    const cleanStr = strVal.replace(/[$,₹€£A\s]/g, "").replace("د.إ", "").replace("AED", "").trim();
    const numeric = parseFloat(cleanStr.replace(/,/g, ""));
    if (isNaN(numeric)) return strVal;
    
    const converted = numeric * rate;
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals })}`;
  }, [currency]);

  const authValue = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading, login, logout]);
  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  const currencyValue = useMemo(() => ({
    currency,
    setCurrency,
    rates: CURRENCY_RATES,
    symbols: CURRENCY_SYMBOLS,
    formatVal,
    convertVal
  }), [currency, setCurrency, formatVal, convertVal]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <CurrencyContext.Provider value={currencyValue}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={authValue}>
            {children}
          </AuthContext.Provider>
        </QueryClientProvider>
      </CurrencyContext.Provider>
    </ThemeContext.Provider>
  );
}
