
import React from 'react'
import {
  useNavigate,
  useParams as useRRParams,
  useSearchParams as useRRSearchParams,
  useLocation,
  Link as RRLink,
} from 'react-router-dom'
import type { LinkProps as RRLinkProps } from 'react-router-dom'

export function useRouter() {
  const navigate = useNavigate()
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: (_path: string) => { /* no-op in CRA/Vite */ },
  }
}

export function usePathname(): string {
  return useLocation().pathname
}

export const useParams = useRRParams

export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRRSearchParams()
  return searchParams
}

type NextLinkProps = Omit<RRLinkProps, 'to'> & {
  href: string
  children?: React.ReactNode
}

export function Link({ href, children, ...rest }: NextLinkProps) {
  return (
    <RRLink to={href} {...rest}>
      {children}
    </RRLink>
  )
}

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  fill?: boolean
  priority?: boolean
  quality?: number
  sizes?: string
  unoptimized?: boolean
  loader?: any
  placeholder?: string
  blurDataURL?: string
  onLoadingComplete?: any
}

export function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority: _priority,
  quality: _quality,
  unoptimized: _unoptimized,
  loader: _loader,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  onLoadingComplete: _onLoadingComplete,
  sizes: _sizes,
  style,
  ...rest
}: ImageProps) {
  const imgStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : { ...style }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      style={imgStyle}
      {...rest}
    />
  )
}

export default Image
