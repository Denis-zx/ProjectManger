import { cn, generateAvatarColor, getInitials } from '../../utils/helpers'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium flex-shrink-0',
        generateAvatarColor(name),
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
