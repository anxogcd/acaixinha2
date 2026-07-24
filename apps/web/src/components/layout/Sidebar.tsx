import { useTranslation } from "react-i18next";
import { Link, useLocation } from "@tanstack/react-router";
import { useUiStore } from "../../stores/uiStore";
import { LayoutGrid, PlusCircle, User, X } from "lucide-react";

const links = [
  { to: "/app/memories", icon: LayoutGrid, label: "memories.myMemories" },
  { to: "/app/memories/new", icon: PlusCircle, label: "memories.createMemory" },
  { to: "/app/profile", icon: User, label: "auth.profile" },
];

export function Sidebar() {
  const { t } = useTranslation();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const location = useLocation();

  const isActive = (to: string) => location.pathname === to;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r bg-background transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <span className="font-semibold">{t("common.appName")}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(to)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(label)}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}