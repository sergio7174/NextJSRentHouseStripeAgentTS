import MainPage from '../components/layouts/mainpage/MainPage';
import SEO from '@/components/common/SEO';
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <>
      <SEO 
        title="Gestión Inmobiliaria de Próxima Generación"
        description="Optimice sus activos, automatice arrendamientos y controle sus finanzas con RentControl."
        canonical="https://www.rentcontrol.com"
      />
      <MainPage />;
    </>
  );
}
