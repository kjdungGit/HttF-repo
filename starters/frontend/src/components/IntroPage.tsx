"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PreparationControls } from "./guide/PreparationControls";
import { restoreBackup } from "@/utils/preparation/model.mjs";
export default function IntroPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-ink">
      <PreparationControls
        id="welcome"
        text={`${t("overhaul.title")} ${t("overhaul.introRead")}`}
      />
      <p className="font-semibold text-orange">{t("overhaul.brand")}</p>
      <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
        {t("overhaul.title")}
      </h1>
      <p className="mt-6 text-lg">{t("overhaul.lead")}</p>
      <Link
        href="/file"
        className="mt-8 inline-block rounded-xl bg-uiuc px-6 py-4 font-semibold text-white"
      >
        {t("overhaul.start")} →
      </Link>
      <div className="my-10 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="rounded-xl border p-5">
            <span className="text-2xl font-bold text-orange">0{n}</span>
            <p className="mt-3">{t(`overhaul.outcome${n}`)}</p>
          </div>
        ))}
      </div>
      <p>{t("overhaul.introRead")}</p>
      <p className="mt-4 text-sm">{t("overhaul.boundary")}</p>
      <div className="mt-8 flex flex-wrap gap-6">
        <Link href="/file/advanced" className="underline">
          {t("overhaul.advanced")}
        </Link>
        <label className="cursor-pointer underline">
          {t("overhaul.restore")}
          <input
            type="file"
            accept="application/json,.json"
            className="mt-2 block text-sm"
            onChange={async (e) => {
              try {
                const file = e.target.files?.[0];
                if (!file || file.size > 32768) throw Error();
                const state = restoreBackup(JSON.parse(await file.text()));
                sessionStorage.setItem(
                  "keenfinance:restore",
                  JSON.stringify(state),
                );
                router.push("/file");
              } catch {
                setError(t("overhaul.restoreError"));
              } finally {
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-4">
          {error}
        </p>
      )}
      <p className="mt-4 text-sm text-black/70">
        {t("overhaul.privateBackup")}
      </p>
    </main>
  );
}
