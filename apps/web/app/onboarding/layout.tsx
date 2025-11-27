import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to AIVO | Setup",
  description: "Complete your AIVO setup to get started with personalized learning.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {children}
    </div>
  );
}
