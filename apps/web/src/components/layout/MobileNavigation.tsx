import { useTranslation } from "react-i18next";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, PlusCircle, User } from "lucide-react";

const links = [
  { to: "/app/memories", icon: LayoutGrid, label: "memories.myMemories" },
  { to: "/app/memories/new", icon: PlusCircle, label: "memories.createMemory" },
  { to: "/app/profile", icon: User, label: "auth.profile" },
];

export function MobileNavigation() {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (to: string) => location.pathname === to;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <div className="flex h-14 items-center justify-around">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
              isActive(to)
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{t(label)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}