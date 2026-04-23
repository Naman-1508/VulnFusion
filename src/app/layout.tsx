import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "VulnFusion Pro | Distributed Security Intelligence",
  description: "Next-generation vulnerability orchestration platform powered by GitHub Cloud Nodes and Supabase Realtime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-[#020617] text-slate-100`}>
        <div className="relative min-h-screen">
          {/* CUSTOM SCROLLBAR STYLES */}
          <style dangerouslySetInnerHTML={{ __html: `
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #020617;
            }
            ::-webkit-scrollbar-thumb {
              background: #1e293b;
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #22d3ee;
            }
          `}} />
          {children}
        </div>
      </body>
    </html>
  );
}
