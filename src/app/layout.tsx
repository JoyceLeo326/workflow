import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "创剧AI - 小说改剧工作流";
const description =
  "用确定性本地规则整理剧本、角色、场景、分镜和成片预演；无需 API Key，演示结果不是 AI 生成。";

export const metadata: Metadata = {
  applicationName: "创剧AI",
  title,
  description,
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "创剧AI",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
