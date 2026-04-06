import { ArrowRight } from 'lucide-react'
import { Link } from "@/utils/compat"
import React from 'react'

const Title = ({
    title,
    description,
    visibleButton = true,
    href = '/shop',
    actionLabel = 'Shop all products',
    rightSlot = null
}) => {

    return (
        <div className='flex items-start justify-between gap-6'>
            <div className='min-w-0'>
            <h2 className='text-2xl font-semibold text-slate-800'>{title}</h2>
                <p className='text-sm text-slate-600 mt-2'>{description}</p>
            </div>

            <div className='shrink-0 flex items-center gap-3 mt-1'>
                {visibleButton && href ? (
                    <Link
                        href={href}
                        className='text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1'
                    >
                        {actionLabel} <ArrowRight size={14} />
            </Link>
                ) : null}
                {rightSlot}
            </div>
        </div>
    )
}

export default Title