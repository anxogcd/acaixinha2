import { Outlet } from "@tanstack/react-router";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";

export function AppLayout() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}