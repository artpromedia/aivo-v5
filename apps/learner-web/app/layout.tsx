import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AIVO Learner",
  description: "Neurodiverse-friendly personalized AI tutor"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
