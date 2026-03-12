import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINDISSIMA Beauty App",
  description:
    "Belleza, tecnología y cuidado profesional en un solo lugar. Reservá tus tratamientos estéticos en LINDISSIMA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#111111] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
