import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/Header";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NIH Grant Master - NIH SBIR/STTR Grant Authoring",
  description: "Compliance-first grant development tool for authoring NIH SBIR/STTR applications with validation and PDF export",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <AuthProvider>
            <ToastProvider>
              <ErrorBoundary>
                <UpgradePrompt />
                <Header />
                <main className="pt-0">
                  {children}
                </main>
              </ErrorBoundary>
            </ToastProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
