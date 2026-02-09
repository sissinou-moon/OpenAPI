import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "OpenAPI Viewer",
  description: "Beautiful OpenAPI visualizer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${outfit.variable} font-sans antialiased bg-neutral-950 text-white h-full overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
