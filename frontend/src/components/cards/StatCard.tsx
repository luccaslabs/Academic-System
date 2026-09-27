import React from 'react'

export interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue'
  description?: string
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'indigo',
  description,
  onClick,
}) => {
  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
  }

  const selectedColor = colorStyles[color]

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-xs border border-slate-100 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200 active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selectedColor.bg} ${selectedColor.text} border ${selectedColor.border}`}
        >
          {icon}
        </div>
      </div>
      {description && (
        <p className="mt-3 text-xs font-medium text-slate-500 flex items-center gap-1">
          {description}
        </p>
      )}
    </div>
  )
}
