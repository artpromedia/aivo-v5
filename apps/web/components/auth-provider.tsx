"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { SubscriptionProvider } from "./subscription/SubscriptionProvider";
import { ThemeWrapper } from "./ThemeWrapper";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeWrapper>
        <SubscriptionProvider>{children}</SubscriptionProvider>
      </ThemeWrapper>
    </SessionProvider>
  );
}
