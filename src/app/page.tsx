"use client"
import HomeContent from "./components/HomeComponent"

// import dynamic from "next/dynamic"

// const HomeContent = dynamic(() => import("./components/HomeComponent"), {
//     ssr: false,
// })

export default function Home() {
    return <HomeContent />
}
