import type { ReactNode } from "react";
import { SideNavBar } from "./SideNavBar";
import { TopNavBar } from "./TopNavBar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">
      <SideNavBar />
      <div className="layout-main-shell pl-64">
        <TopNavBar />
        <main className="min-h-screen px-8 pb-12 pt-24">{children}</main>
      </div>
    </div>
  );
}
