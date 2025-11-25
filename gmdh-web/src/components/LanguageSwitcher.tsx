"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing, type Locale } from "~/i18n/routing";

const localeNames: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  uk: "UA",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex gap-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          className={`px-2 py-1 text-sm rounded transition-colors ${
            locale === loc
              ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
