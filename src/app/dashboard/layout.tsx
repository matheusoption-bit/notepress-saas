import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#09090b] text-slate-100 antialiased overflow-hidden aura-glow min-h-screen flex">
      <DashboardSidebar />

      <main className="flex-1 ml-20 h-screen overflow-y-auto dash-scroll relative transition-all duration-300">
        <DashboardHeader />
        {children}
      </main>
    </div>
  );
}
