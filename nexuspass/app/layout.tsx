import type { Metadata } from "next";
import "./globals.css";
import FloatingChatbot from "./components/FloatingChatbot";

export const metadata: Metadata = {
  title: "NEXUSPASS",
  description: "Digital ID Card System",
  manifest: "/manifest.json", // IMPORTANTE ITO!
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {/* ✅ FLOATING CHATBOT SA LAHAT NG PAGES */}
        <FloatingChatbot />
      </body>
    </html>
  );
}