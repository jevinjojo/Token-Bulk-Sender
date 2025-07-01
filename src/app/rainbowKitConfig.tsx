"use client" 

import { getDefaultConfig } from "@rainbow-me/rainbowkit" 
import { anvil, zksync, mainnet,sepolia} from "wagmi/chains" 


export default getDefaultConfig({
    appName: "TSender", 
    projectId: "5550e43f9956f9eaba992ff1562cd62f",
    chains: [anvil, zksync, mainnet,sepolia], 
    ssr: false, 
})
