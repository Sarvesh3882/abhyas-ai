'use client'
import { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'purple' | 'red' | 'green' | 'yellow' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

export default function PixelButton({ variant = 'purple', size = 'md', className, children, ...props }: Props) {
  const variantClass = {
    purple: 'pixel-btn',
    red:    'pixel-btn pixel-btn-red',
    green:  'pixel-btn pixel-btn-green',
    yellow: 'pixel-btn pixel-btn-yellow',
    dark:   'pixel-btn pixel-btn-dark',
  }[variant]

  const sizeStyle = { sm: 'text-[8px] py-2 px-3', md: '', lg: 'text-[12px] py-4 px-6' }[size]

  return (
    <button className={clsx(variantClass, sizeStyle, className)} {...props}>
      {children}
    </button>
  )
}
