import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GMDH Analysis",
  description: "Group Method of Data Handling - Upload CSV and run polynomial modeling",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
