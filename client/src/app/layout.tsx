import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import AppProvider from "@/components/app-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import RouteLoader from "@/components/loaders/route-loader";
import { getDefaultOgImage, getSiteUrl } from "@/lib/seo";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "BiteHub Restaurant",
    template: "%s | BiteHub Restaurant",
  },
  description: "Fresh dishes, modern restaurant experience, and fast ordering.",
  alternates: {
    canonical: "/",
    languages: {
      vi: "/vi",
      en: "/en",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "BiteHub Restaurant",
    title: "BiteHub Restaurant",
    description: "Fresh dishes, modern restaurant experience, and fast ordering.",
    locale: "vi_VN",
    alternateLocale: ["en_US"],
    images: [
      {
        url: getDefaultOgImage(),
        width: 1200,
        height: 630,
        alt: "BiteHub Restaurant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BiteHub Restaurant",
    description: "Fresh dishes, modern restaurant experience, and fast ordering.",
    images: [getDefaultOgImage()],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppProvider>
              <RouteLoader />
              {children}
              <Toaster richColors closeButton position="top-right" />
            </AppProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
