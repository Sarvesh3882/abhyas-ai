import clsx from 'clsx'

interface Props {
  children: React.ReactNode
  variant?: 'purple' | 'red' | 'green' | 'yellow' | 'cyan'
  className?: string
  style?: React.CSSProperties
}

export default function PixelCard({ children, variant = 'purple', className, style }: Props) {
  const cls = {
    purple: 'pixel-box',
    red:    'pixel-box-red',
    green:  'pixel-box-green',
    yellow: 'pixel-box-yellow',
    cyan:   'pixel-box-cyan',
  }[variant]

  return (
    <div className={clsx(cls, 'bg-[var(--bg-card)] p-4', className)} style={style}>
      {children}
    </div>
  )
}
