import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-500">
      {/* Left side - GitHub + Title */}
      <div className="flex items-center space-x-4">
        <a 
          href="https://github.com/jevinjojo" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FaGithub className="text-2xl text-gray-700" size={24}/>
        </a>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
          <h1 className="text-2xl font-bold text-gray-800">tsender</h1>
        </div>
      </div>
      
      {/* Right side - ConnectButton */}
      <div>
        <ConnectButton />
      </div>
    </header>
  );
}
