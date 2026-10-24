# Asset and component provenance

- Pixel movement characters, movement stage, spark mark and application icon:
  original SVG artwork created for Move Along; no third-party character assets.
- 8bitcn/ui Button, Card, Badge, Progress and retro CSS: installed using
  `npx shadcn@latest add @8bitcn/button @8bitcn/card @8bitcn/badge @8bitcn/progress`.
  Source: https://github.com/TheOrcDev/8bitcn-ui. MIT notice: licenses/8bitcn-MIT.md.
- Local modifications: self-hosted pixel font, component import correction to the
  configured utils alias, card props removed before DOM spread, touch target sizes.
- shadcn/ui primitives: installed through its CLI, https://ui.shadcn.com, MIT.
- Geist and Press Start 2P: next/font, self-hosted at build. Google Fonts families
  are distributed under SIL Open Font License; upstream notices are bundled here.
- lucide-react: ISC licensed icons supplied through the requested component stack.
- No music, camera frames, generated body images or parent-project media copied.

The app has no runtime dependency on the 8bitcn documentation website.
