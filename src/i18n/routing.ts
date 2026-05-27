import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const locales = ['en', 'tr', 'es', 'pt', 'de', 'fr', 'it', 'ru', 'ar', 'hi', 'zh', 'ja', 'ko', 'id', 'vi', 'nl', 'pl', 'uk'] as const;

export const routing = defineRouting({
  locales: locales,
  defaultLocale: 'en'
});

export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);
