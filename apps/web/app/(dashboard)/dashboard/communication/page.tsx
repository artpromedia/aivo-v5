import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MessageCenter } from "@/components/communication/MessageCenter";

export default async function CommunicationPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="rounded-2xl bg-slate-900 p-6 text-white">
        <p className="text-sm uppercase tracking-wide text-slate-300">Collaboration Hub</p>
        <h1 className="mt-2 text-3xl font-semibold">Family & Teacher Communication</h1>
        <p className="mt-2 text-sm text-slate-300">
          Secure messaging, AI insights, announcements, and compliance logging in one workspace.
        </p>
      </div>
      <MessageCenter />
    </main>
  );
}
