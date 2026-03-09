'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CLASS_CONFIG } from '@/lib/config'

const images = ['/images/class.jpg', '/images/class2.jpg']

export default function HeroSlideshow({ loggedIn }: { loggedIn: boolean }) {
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setImgIdx((i) => (i + 1) % images.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden shadow-lg">
      {images.map((src, i) => (
        <Image key={src} src={src} alt={`${CLASS_CONFIG.displayName} 사진`} fill
          className={`object-cover transition-opacity duration-1000 ${i === imgIdx ? 'opacity-100' : 'opacity-0'}`}
          priority={i === 0} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">{CLASS_CONFIG.displayName}</h1>
        <p className="mt-3 text-lg text-white/90 drop-shadow">우리만의 특별한 공간</p>
        {!loggedIn && (
          <Link href="/login" className="mt-6 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition-colors">
            로그인하기
          </Link>
        )}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={() => setImgIdx(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}
