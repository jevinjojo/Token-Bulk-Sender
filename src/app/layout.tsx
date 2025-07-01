import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import Header from "./components/header";


export const metadata: Metadata = {
  title: "TSender",
  description: "Hyper gas-optimized bulk ERC20 token transfer",

};

export default function RootLayout(props: { children: ReactNode }) {
  return (
      <html lang="en">
          <head>
              <link rel="icon" href="/T-Sender.svg" sizes="any" />
          </head>
          <body className="bg-zinc-50">
              <Providers>
                  <Header />
                  {props.children}
              </Providers>
          </body>
      </html>
  )
}
