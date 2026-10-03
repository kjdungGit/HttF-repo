import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function Header({ kicker = "Champaign · 2025" }: { kicker?: string }) {
  return (
    <header className="border-b border-black/80 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-ink">
            KEEN<span className="text-orange">Finance</span>
          </span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-uiuc sm:inline">
            {kicker}
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <p className="hidden text-sm text-black/70 md:block">Illinois taxes, explained plainly</p>
          <UserMenu />
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-black via-uiuc to-orange" />
    </header>
  );
}
