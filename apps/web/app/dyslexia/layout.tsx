import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dyslexia Intervention | AIVO",
  description: "Structured literacy intervention based on Orton-Gillingham principles",
};

export default function DyslexiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
