/** Símbolo oficial da Propello: quadrado carvão, "p" creme, pé laranja. */
export function PropelloSymbol({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Propello"
      className={className}
    >
      <rect width="200" height="200" rx="44" fill="#17181A" />
      <g transform="translate(60 31) scale(0.8)">
        <polygon points="0,0 26,0 26,100 0,100" fill="#F6EFE6" />
        <path d="M 13 13 H 50 A 37 37 0 0 1 50 87 H 13" fill="none" stroke="#F6EFE6" strokeWidth="26" />
        <polygon points="0,118 26,108.5 26,165 0,174.5" fill="#FF5B1F" />
      </g>
    </svg>
  )
}

/** Logotipo oficial "propello". `dark` = versão para fundo escuro. */
export function PropelloLogo({ width = 96, dark = false }: { width?: number; dark?: boolean }) {
  const ink = dark ? "#F6EFE6" : "#17181A"
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-6 -76 726 256"
      width={width}
      height={(width * 256) / 726}
      role="img"
      aria-label="Propello"
    >
      <polygon points="0,0 26,0 26,100 0,100" fill={ink} />
      <path d="M 13 13 H 50 A 37 37 0 0 1 50 87 H 13" fill="none" stroke={ink} strokeWidth="26" />
      <polygon points="0,118 26,108.5 26,165 0,174.5" fill="#FF5B1F" />
      <path d="M 127 100 V 50 A 37 37 0 0 1 164 13 H 178" fill="none" stroke={ink} strokeWidth="26" />
      <circle cx="242" cy="50" r="37" fill="none" stroke={ink} strokeWidth="26" />
      <polygon points="306,0 332,0 332,100 306,100" fill={ink} />
      <path d="M 319 13 H 356 A 37 37 0 0 1 356 87 H 319" fill="none" stroke={ink} strokeWidth="26" />
      <polygon points="306,118 332,108.5 332,165 306,174.5" fill={ink} />
      <path d="M 433 50 H 507 A 37 37 0 1 0 496.16 76.16" fill="none" stroke={ink} strokeWidth="26" />
      <polygon points="534,-60.5 560,-70 560,100 534,100" fill={ink} />
      <polygon points="574,-60.5 600,-70 600,100 574,100" fill={ink} />
      <circle cx="664" cy="50" r="37" fill="none" stroke={ink} strokeWidth="26" />
    </svg>
  )
}
