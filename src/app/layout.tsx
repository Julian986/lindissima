import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

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
      <body
        className={`${montserrat.variable} ${playfair.variable} min-h-screen bg-[#111111] text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
