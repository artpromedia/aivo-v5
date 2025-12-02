import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AivoLogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 40, text: 'text-xl' },
  lg: { icon: 48, text: 'text-2xl' },
}

export function AivoLogo({ 
  className, 
  showText = true, 
  size = 'md',
  href = '/' 
}: AivoLogoProps) {
  const { icon, text } = sizes[size]
  
  const LogoContent = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-shrink-0">
        <Image
          src="/aivo-logo.svg"
          alt="AIVO"
          width={icon}
          height={icon}
          className="rounded-xl"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold text-gray-900 leading-tight', text)}>
            AIVO
          </span>
          <span className="text-xs font-medium text-gray-500 -mt-0.5">
            Learning
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="group">
        {LogoContent}
      </Link>
    )
  }

  return LogoContent
}

// Animated logo with gradient background
export function AivoLogoAnimated({ 
  className,
  size = 'md' 
}: { 
  className?: string
  size?: 'sm' | 'md' | 'lg' 
}) {
  const { icon, text } = sizes[size]
  
  return (
    <Link href="/" className={cn('flex items-center gap-3 group', className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
        <div className="relative overflow-hidden rounded-xl transform group-hover:scale-105 transition-transform">
          <Image
            src="/aivo-logo.svg"
            alt="AIVO"
            width={icon}
            height={icon}
            className="rounded-xl"
            priority
          />
        </div>
      </div>
      <div className="flex flex-col">
        <span className={cn('font-bold text-gray-900 leading-tight', text)}>
          AIVO
        </span>
        <span className="text-xs font-medium text-gray-600 -mt-0.5">
          Learning
        </span>
      </div>
    </Link>
  )
}
