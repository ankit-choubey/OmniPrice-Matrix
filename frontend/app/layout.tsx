import type { Metadata } from "next";
import "./globals.css"; // THIS IS THE CRITICAL LINE

export const metadata: Metadata = {
  title: "Buylo",
  description: "Advanced e-commerce price aggregation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}