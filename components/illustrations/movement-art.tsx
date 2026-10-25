import type { ExerciseId } from "@/lib/shared/types";
import { cn } from "@/lib/utils";

/** Original geometric character artwork; illustrative, never pose measurements. */
export function MovementArt({ exercise = "pushup", className, decorative = false }: { exercise?: ExerciseId; className?: string; decorative?: boolean }) {
  const push = exercise === "pushup";
  return <svg viewBox="0 0 240 200" className={cn("movement-art", className)} role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `${push ? "Push-up" : "Squat"} movement illustration`} shapeRendering="crispEdges">
    <ellipse cx="120" cy="177" rx="72" ry="7" fill="currentColor" opacity=".10" />
    <g stroke="var(--foreground)" strokeWidth="5" strokeLinejoin="miter">
      {push ? <>
        <path d="M72 106 178 133 201 162 181 165 164 146 91 128Z" fill="var(--primary)" />
        <path d="M89 128 80 157 107 157 107 171 65 171 65 152 74 122" fill="var(--art-skin)" />
        <path d="M177 132 206 155 213 171 188 171 173 147" fill="var(--art-pants)" />
        <path d="M57 87H87V119H57Z" fill="var(--art-skin)" />
        <path d="M52 84H89V98H66V107H52Z" fill="var(--foreground)" />
      </> : <>
        <path d="M107 72 133 82 115 124 94 121Z" fill="var(--primary)" />
        <path d="M98 115 151 124 160 141 126 148 95 134Z" fill="var(--art-pants)" />
        <path d="M143 131 160 164 182 164 182 177 143 177 125 143Z" fill="var(--art-pants)" />
        <path d="M119 82 166 96 185 96 185 109 161 109 111 98Z" fill="var(--art-skin)" />
        <path d="M110 39H142V73H110Z" fill="var(--art-skin)" />
        <path d="M105 35H146V49H122V58H105Z" fill="var(--foreground)" />
      </>}
    </g>
    <rect x={push ? 78 : 134} y={push ? 100 : 55} width="4" height="5" fill="var(--foreground)" />
    <path d="M29 151V161H19M205 47V57H215" fill="none" stroke="var(--foreground)" strokeWidth="4" opacity=".35" />
  </svg>;
}

export function PixelSpark({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}><path d="M10 0h4v7h3v3h7v4h-7v3h-3v7h-4v-7H7v-3H0v-4h7V7h3Z" /></svg>;
}
