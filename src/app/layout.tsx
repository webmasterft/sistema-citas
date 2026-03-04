import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Citas | Gemini + Supabase",
  description: "Plataforma de gestión de citas optimizada con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased min-h-screen grid grid-rows-[auto_1fr_auto]`}>
        <header className="bg-slate-900 text-white p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Sistema Citas</h1>
            <nav aria-label="Navegación principal">
              <ul className="flex gap-4">
                <li><a href="/" className="hover:underline">Inicio</a></li>
              </ul>
            </nav>
          </div>
        </header>

        <main id="main-content" className="max-w-7xl mx-auto w-full p-6">
          {children}
        </main>

        <footer className="bg-slate-100 p-8 text-center text-sm text-slate-600">
          <p>© {new Date().getFullYear()} - Oshyn Standards Compliant</p>
        </footer>
      </body>
    </html>
  );
}
