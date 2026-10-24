import { useId } from "react";
export function Slider({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  const id = useId();
  return <div className="slider"><label htmlFor={id}>{label}<output>{value}</output></label><input id={id} type="range" min={0} max={max} value={value} onChange={event => onChange(Number(event.target.value))} /></div>;
}
