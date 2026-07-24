import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../stores/authStore";
import { useUiStore } from "../../../stores/uiStore";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/profile/edit")({
  component: ProfileEditPage,
});

function ProfileEditPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const addToast = useUiStore((s) => s.addToast);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [description, setDescription] = useState(user?.description ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({ name: name.trim(), description, avatarUrl });
      addToast({ title: t("profile.profileUpdated") });
      navigate({ to: "/app/profile" });
    } catch (err) {
      addToast({
        title: t("common.error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">{t("auth.editProfile")}</h1>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("profile.name")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("profile.description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary resize-y"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("profile.avatarUrl")}
        </label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("common.save")}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/app/profile" })}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}