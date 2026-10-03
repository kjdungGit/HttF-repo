"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EVENT = "keenfinance:go-service";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function requestGoToService() {
  window.dispatchEvent(new Event(EVENT));
}

export function ServiceWipe({ show, leaving }: { show: boolean; leaving?: boolean }) {
  if (!show) return null;
  return (
    <div className={`keen-service-wipe${leaving ? " is-out" : ""}`} aria-hidden="true">
      <span className="keen-service-wipe__navy" />
      <span className="keen-service-wipe__blue" />
      <span className="keen-service-wipe__orange" />
      <p className="keen-service-wipe__mark">
        KEEN<span>Finance</span>
      </p>
    </div>
  );
}

export function ServiceTransitionHost() {
  const router = useRouter();
  const [phase, setPhase] = useState<"off" | "in" | "out">("off");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    function clearTimers() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    function onGo() {
      if (prefersReducedMotion()) {
        router.push("/file");
        return;
      }
      clearTimers();
      setPhase("in");
      timers.current = [
        window.setTimeout(() => router.push("/file"), 720),
        window.setTimeout(() => setPhase("out"), 920),
        window.setTimeout(() => setPhase("off"), 1380),
      ];
    }

    window.addEventListener(EVENT, onGo);
    return () => {
      window.removeEventListener(EVENT, onGo);
      clearTimers();
    };
  }, [router]);

  return <ServiceWipe show={phase !== "off"} leaving={phase === "out"} />;
}

export function GoToServiceLink() {
  return (
    <Link
      href="/file"
      onClick={(event) => {
        event.preventDefault();
        requestGoToService();
      }}
      className="text-sm font-extrabold tracking-tight text-navy underline-offset-4 hover:text-orange hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-uiuc"
    >
      Go to Service
    </Link>
  );
}
