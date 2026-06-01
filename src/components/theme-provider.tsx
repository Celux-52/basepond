"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes"; // next-themes/dist/types is deprecated or not working in some versions

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Geçici olarak next-themes'i devre dışı bırakıyoruz (React 19 script hydration hatasını çözmek için)
  return <>{children}</>;
}
