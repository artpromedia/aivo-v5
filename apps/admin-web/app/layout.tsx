import "../styles/globals.css";

export const metadata = {
  title: 'AIVO Admin Dashboard',
  description: 'Manage your AIVO platform with care',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-lavender-50 min-h-screen">{children}</body>
    </html>
  )
}
