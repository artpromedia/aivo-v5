"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { SubscriptionProvider } from "./subscription/SubscriptionProvider";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </SessionProvider>
  );
}
