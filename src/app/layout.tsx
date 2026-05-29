import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/shared/query-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const TITULO = "Recepción IA — Tu consultorio, siempre disponible";
const DESCRIPCION =
  "Recepcionista virtual con IA para consultorios médicos. Atiende WhatsApp 24/7, deriva al especialista correcto y agenda turnos automáticamente.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: TITULO, template: "%s · Recepción IA" },
  description: DESCRIPCION,
  applicationName: "Recepción IA",
  keywords: [
    "recepcionista virtual",
    "agente IA WhatsApp",
    "turnos médicos",
    "agenda consultorio",
    "chatbot clínica",
    "secretaria virtual médica",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: APP_URL,
    siteName: "Recepción IA",
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="es" className={`${jakarta.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col font-sans bg-white text-slate-900">
          <QueryProvider>{children}</QueryProvider>
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
