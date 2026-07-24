import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { LogIn, Heart, Share2, Image } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const features = [
    {
      icon: Heart,
      title: "Guarda os teus recordos",
      description: "Crea e organiza os momentos que importan",
    },
    {
      icon: Share2,
      title: "Comparte cos teus",
      description: "Convida a familia e amigos aos teus recordos",
    },
    {
      icon: Image,
      title: "Engade fotos e vídeos",
      description: "Documenta cada recordo con arquivos multimedia",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <span className="font-semibold">{t("common.appName")}</span>
        {isAuthenticated ? (
          <Link
            to="/app/memories"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Ir aos recordos
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            <LogIn className="h-4 w-4" />
            {t("auth.login")}
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("common.appName")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            O lugar onde gardas e compartes os teus recordos máis queridos
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 max-w-3xl">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        {!isAuthenticated && (
          <div className="flex gap-4">
            <Link
              to="/login"
              className="rounded-md bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("auth.login")}
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        A Caixiña dos Recordos &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}