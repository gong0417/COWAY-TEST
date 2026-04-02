import { FuseSearchBar } from "@/components/FuseSearchBar";
import { AccountMenu } from "@/components/layout/AccountMenu";

export function TopNavBar() {
  return (
    <header
      data-print-hide
      className="fixed left-64 right-0 top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md"
    >
      <div className="flex min-w-0 flex-1 items-center pr-4">
        <FuseSearchBar />
      </div>
      <AccountMenu />
    </header>
  );
}
