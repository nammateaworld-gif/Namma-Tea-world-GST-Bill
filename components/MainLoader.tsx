import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import imageTea from '../public/teaworld.jpeg'

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

const MainLoader: React.FC = () => {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground fixed inset-0 z-50 flex items-center justify-center`}>
      <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <img
            src={imageTea.src}
            alt="Namma Tea World Loader"
            className="w-full h-full object-cover rounded-lg animate-zoom-in-out"
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes zoomInOut {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.5);
            opacity: 0;
          }
        }
        .animate-zoom-in-out {
          animation: zoomInOut 1s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}

export default MainLoader