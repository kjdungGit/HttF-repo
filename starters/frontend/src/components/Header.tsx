import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import { GoToServiceLink } from "@/components/GoToService";

export default function Header({ kicker = "Champaign · 2025" }: { kicker?: string }) {
  return (
    <header className="border-b border-black/80 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex flex-col items-center gap-0.5 rounded-md px-1 py-0.5 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-uiuc">
            <img src="/favicon.ico" alt="" className="h-10 w-10" width={40} height={40} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink">HOME</span>
          </Link>
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-ink">
              KEEN<span className="text-orange">Finance</span>
            </span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-uiuc sm:inline">
              {kicker}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden text-sm text-black/70 md:block">Illinois taxes, explained plainly</p>
          <GoToServiceLink />
          <UserMenu />
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-black via-uiuc to-orange" />
    </header>
  );
}
