"use client"

import { type ReactNode } from "react";
import config from "./rainbowKitConfig" 
import { ConnectButton, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

export function Providers(props: {children: ReactNode}){
  const queryClient = new QueryClient();
  return (
    <WagmiProvider   config={config}>
      <QueryClientProvider client={queryClient}> 
    <RainbowKitProvider> 
      {props.children} 
      </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}