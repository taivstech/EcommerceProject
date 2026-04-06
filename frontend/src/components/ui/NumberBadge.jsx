/**
 * NumberBadge - Component để hiển thị số đẹp và nhất quán
 * @param {number} value - Giá trị số cần hiển thị
 * @param {string} variant - 'badge' | 'text' | 'inline'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} color - Màu sắc (optional)
 * @param {number} max - Giá trị tối đa, nếu vượt quá sẽ hiển thị "max+"
 */
const NumberBadge = ({ 
  value, 
  variant = 'badge', 
  size = 'md',
  color = 'default',
  max = 99,
  className = ''
}) => {
  if (value === null || value === undefined || value === 0) {
    return null
  }

  const displayValue = value > max ? `${max}+` : value

  // Color classes
  const colorClasses = {
    default: 'bg-slate-600 text-white',
    red: 'bg-red-500 text-white',
    green: 'bg-green-600 text-white',
    orange: 'bg-orange-500 text-white',
    blue: 'bg-blue-500 text-white',
    slate: 'bg-slate-100 text-slate-700'
  }

  // Variant styles
  if (variant === 'badge') {
    const heightClass = size === 'sm' ? 'h-4' : size === 'md' ? 'h-5' : 'h-6'
    const minWidthClass = size === 'sm' ? 'min-w-[1rem]' : size === 'md' ? 'min-w-[1.25rem]' : 'min-w-[1.5rem]'
    const paddingClass = size === 'sm' ? 'px-1' : size === 'md' ? 'px-1.5' : 'px-2'
    
    return (
      <span 
        className={`
          t-text-17 
          t-font-medium 
          t-truncate
          ${colorClasses[color] || colorClasses.default}
          ${minWidthClass}
          ${heightClass}
          ${paddingClass}
          rounded-full 
          flex 
          items-center 
          justify-center
          ${className}
        `}
        title={value}
      >
        {displayValue}
      </span>
    )
  }

  if (variant === 'text') {
    return (
      <span 
        className={`
          t-text-17 
          t-font-medium 
          t-truncate
          ${className}
        `}
        title={value}
      >
        {displayValue}
      </span>
    )
  }

  // inline variant
  return (
    <span 
      className={`
        t-text-17 
        t-font-medium 
        t-truncate
        ${className}
      `}
      title={value}
    >
      {displayValue}
    </span>
  )
}

export default NumberBadge
