import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../stores/authStore";
import { User, Pencil } from "lucide-react";

export const Route = createFileRoute("/app/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <Link
          to="/app/profile/edit"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          <Pencil className="h-4 w-4" />
          {t("auth.editProfile")}
        </Link>
      </div>

      {user.description ? (
        <p className="text-muted-foreground">{user.description}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {t("profile.noDescription")}
        </p>
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          {t("profile.memoriesCount")}: --
        </p>
      </div>
    </div>
  );
}