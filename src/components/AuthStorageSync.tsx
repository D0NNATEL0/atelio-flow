"use client";

import { ReactNode, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearCurrentUserScope, saveCurrentUserScope } from "@/lib/user-scope";

export function AuthStorageSync({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function syncCurrentUser() {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;

      if (error) {
        setIsReady(true);
        return;
      }

      if (!data.user) {
        clearCurrentUserScope();
        setIsReady(true);
        return;
      }

      saveCurrentUserScope({
        id: data.user.id,
        email: data.user.email ?? "",
        fullName: (data.user.user_metadata?.full_name as string | undefined) ?? ""
      });
      setIsReady(true);
    }

    void syncCurrentUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        clearCurrentUserScope();
        return;
      }

      saveCurrentUserScope({
        id: session.user.id,
        email: session.user.email ?? "",
        fullName: (session.user.user_metadata?.full_name as string | undefined) ?? ""
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
