import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/authStore";
import { useUiStore } from "../../stores/uiStore";
import { Menu, LogOut, User } from "lucide-react";

export function Header() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 hover:bg-accent md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/app/memories" className="font-semibold">
          {t("common.appName")}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setLanguage(language === "es" ? "gl" : "es")}
          className="rounded-md px-2 py-1 text-sm font-medium hover:bg-accent"
        >
          {language === "es" ? "GL" : "ES"}
        </button>

        <Link
          to="/app/profile"
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{user?.name}</span>
        </Link>

        <button
          onClick={logout}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={t("auth.logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}