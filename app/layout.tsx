import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "График командировок",
  description: "Интерактивный график командировок специалистов",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f0eeeb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* System fonts — НЕ блокируют рендеринг */}
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          code, pre {
            font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
          }
        `}</style>
      </head>
      <body className="antialiased" style={{ background: "#f0eeeb", color: "#1a1a2e" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
