import type { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — AI Video & Audio Editing Platform`, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  openGraph: { title: APP_NAME, description: APP_DESCRIPTION, siteName: APP_NAME, type: "website" },
  twitter: { card: "summary_large_image", title: APP_NAME, description: APP_DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
