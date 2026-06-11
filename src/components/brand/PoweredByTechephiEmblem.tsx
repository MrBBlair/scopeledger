type Props = {
  compact?: boolean
  className?: string
}

/** MailXTract canonical emblem — techephi-footer-kit */
export function PoweredByTechephiEmblem({ compact = false, className = '' }: Props) {
  const imageClass = compact ? 'h-[4.4rem] sm:h-[5.5rem]' : 'h-[7.26rem]'

  return (
    <a
      href="https://techephi.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`shrink-0 opacity-90 hover:opacity-100 transition-opacity emblem-glisten inline-block ${className}`.trim()}
      aria-label="Powered by Techephi"
    >
      <img
        src={`${import.meta.env.BASE_URL}powered-by-techephi.png`}
        alt="Powered by Techephi"
        className={`block w-auto object-contain ${imageClass}`}
      />
    </a>
  )
}
