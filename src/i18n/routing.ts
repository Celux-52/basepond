import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const locales = ['tr'] as const;

export const routing = defineRouting({
  locales: locales,
  defaultLocale: 'tr',
  localePrefix: 'as-needed'
});

export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);
