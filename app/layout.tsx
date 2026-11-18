import type { Metadata } from "next";
import { Bai_Jamjuree, IBM_Plex_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
// Mantine CSS per component, not the whole styles.css: the base layers, then only what the page uses
// (Select = Input + Combobox, which sits on Popover and ScrollArea; Slider; SegmentedControl; Collapse has no CSS).
// globals.css last, so it wins.
import "@mantine/core/styles/baseline.css";
import "@mantine/core/styles/default-css-variables.css";
import "@mantine/core/styles/global.css";
import "@mantine/core/styles/Input.css";
import "@mantine/core/styles/Combobox.css";
import "@mantine/core/styles/Popover.css";
import "@mantine/core/styles/ScrollArea.css";
import "@mantine/core/styles/Slider.css";
import "@mantine/core/styles/SegmentedControl.css";
import "./globals.css";

// The reference page's three fonts, downloaded at build and served by the app (no Google call at run time).
// globals.css reads them through these variables (--display, --body, --mono).
const display = Bai_Jamjuree({
  weight: ["500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-bai-jamjuree",
});
const body = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-plex-thai",
});
const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Harness Lab",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" {...mantineHtmlProps} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">{children}</MantineProvider>
      </body>
    </html>
  );
}
