import { createRootRoute, Outlet } from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <I18nextProvider i18n={i18n}>
      <Outlet />
    </I18nextProvider>
  );
}