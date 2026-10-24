/** Original placement illustration, independent of the live pose overlay. */
export function FramingGuide({ floor = false }: { floor?: boolean }) {
  return <svg viewBox="0 0 200 250" className="framing-guide" aria-hidden="true" fill="none">
    <path d="M30 40V20H50M150 20H170V40M170 210V230H150M50 230H30V210" stroke="currentColor" strokeWidth="3" />
    {floor ? <g stroke="currentColor" strokeWidth="9" strokeLinecap="square"><path d="M55 141 138 160 161 192M69 150 63 186H88M140 161 160 188" /><circle cx="49" cy="129" r="12" /></g> : <g stroke="currentColor" strokeWidth="8" strokeLinecap="square"><circle cx="100" cy="58" r="16" /><path d="M100 81V143M80 91H120M80 91 66 129M120 91 134 129M100 143 82 199M100 143 118 199M72 203H88M112 203H128" /></g>}
  </svg>;
}
