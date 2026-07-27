import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — AI Video & Audio Editing Platform`, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: APP_NAME, description: APP_DESCRIPTION, siteName: APP_NAME, type: "website" },
  twitter: { card: "summary_large_image", title: APP_NAME, description: APP_DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ToolKit" />
        <script dangerouslySetInnerHTML={{
          __html: `if("serviceWorker"in navigator&&location.hostname!="localhost")window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})});`
        }} />
      </head>
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
