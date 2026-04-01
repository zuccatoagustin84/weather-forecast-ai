import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clima — Pérez & Rosario",
  description: "Pronóstico del clima para Pérez (Santa Fe) y Rosario, Argentina",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
