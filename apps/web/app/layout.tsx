import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
