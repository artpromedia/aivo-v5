import "../styles/globals.css";
import { AdminSidebar } from "../components/AdminSidebar";

export const metadata = {
  title: "District Admin | AIVO",
  description: "AIVO District Administration Console"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
