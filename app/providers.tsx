"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";
import { setCredentials, clearCredentials, setLoading } from "@/lib/redux/authSlice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const fetchMe = async () => {
      store.dispatch(setLoading(true));
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          store.dispatch(setCredentials({ user: data.user, token: data.token }));
        } else {
          store.dispatch(clearCredentials());
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        store.dispatch(clearCredentials());
      } finally {
        store.dispatch(setLoading(false));
      }
    };
    fetchMe();
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
