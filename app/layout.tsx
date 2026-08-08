import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Công việc Bác sĩ Trang | PKC Pet Center",
  description: "Quản lý công việc hằng ngày của Bác sĩ – Leader Trang tại PKC Pet Center.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className={geist.variable}>{children}</body></html>;
}
