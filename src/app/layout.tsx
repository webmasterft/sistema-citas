import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedApp - Gestión Médica Ecuador",
  description: "Sistema de gestión de citas médicas, pacientes y facturación SRI para Ecuador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.className} min-h-screen antialiased`}>
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
