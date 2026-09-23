import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/lib/auth";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nepal Hemophilia Digital Management System",
  description: "Super Admin panel for Nepal Hemophilia Society",
  icons: {
    icon: "/nhs-logo.png",
    apple: "/nhs-logo.png",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem('nhs-theme');var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} h-full overflow-hidden bg-page text-ink`} suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>{children}</AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
