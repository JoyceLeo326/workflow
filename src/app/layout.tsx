import type { Metadata } from "next";
import "./globals.css";

const title = "创剧AI - 小说改剧工作流";
const description =
  "面向小说改编与短剧前期制片的创作工作台，整理剧情结构、人物、场景、镜头与时序交付。";

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
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
