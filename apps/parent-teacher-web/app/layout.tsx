import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { GradeThemeInitScript } from "@aivo/ui";
import { ToastProvider } from "../components/providers";
import "../styles/globals.css";

export const metadata = {
  title: "AIVO Parent & Teacher Dashboard",
  description: "Monitor your learner's progress and support their journey",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GradeThemeInitScript defaultGradeBand="k_5" />
      </head>
      <body className="antialiased bg-lavender-50 min-h-screen">
        <AuthProvider>
          {children}
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
