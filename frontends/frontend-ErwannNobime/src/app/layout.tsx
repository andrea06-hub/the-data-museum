import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Footer } from "@/components/footer";
import { TopBar } from "@/components/top-bar";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Erwann Nobime — Data Console",
  description:
    "Étudiant ingénieur ESIGELEC, alternant Data Analyst chez Covéa. Portfolio polyglotte MongoDB + Neo4j : projets, compétences et parcours explorables.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable} ${space.variable}`}
    >
      <body className="min-h-screen bg-bg text-fg antialiased">
        <Providers>
          <div className="grain" aria-hidden />
          <div className="relative z-[1]">
            <TopBar />
            <main>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
