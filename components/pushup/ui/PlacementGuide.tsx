export function PlacementGuide() {
  return <svg className="placement-guide" viewBox="0 0 400 170" role="img" aria-label="Phone upright on the floor, one to one and a half meters in front of a person in push-up position">
    <path d="M22 127h356" stroke="currentColor" opacity=".2" />
    <rect x="30" y="63" width="30" height="62" rx="7" fill="none" stroke="var(--color-accent)" strokeWidth="3" />
    <circle cx="45" cy="73" r="2" fill="var(--color-accent)" />
    <path d="m64 94 94-40v71Z" fill="var(--color-accent)" opacity=".07" />
    <circle cx="178" cy="57" r="12" fill="none" stroke="var(--color-up)" strokeWidth="5" />
    <path d="m197 69 75 25 73 28M203 73l-6 49h-16" fill="none" stroke="var(--color-up)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M67 146h106m-101-4-5 4 5 4m96-8 5 4-5 4" stroke="currentColor" opacity=".5" />
    <text x="120" y="166" textAnchor="middle" fill="currentColor" fontSize="12">1–1.5 m</text>
  </svg>;
}
