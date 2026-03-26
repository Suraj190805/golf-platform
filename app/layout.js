import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "GolfCharity — Play Golf. Win Prizes. Make a Difference.",
  description:
    "A subscription-based platform combining golf performance tracking, monthly prize draws, and charitable giving. Subscribe, enter your scores, and support the causes you believe in.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} antialiased`}>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, paddingTop: "72px" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
