// Fade applied directly to the texture/glow layers themselves (not just an
// opaque div painted on top of them) so nothing — grid lines, glow blur,
// anything — can leave a hard edge where this section meets the next one.
const FADE_MASK =
  "linear-gradient(to bottom, black calc(100% - 16rem), transparent 100%)";

export function PageBackground({ showGlows = true }: { showGlows?: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        maskImage: FADE_MASK,
        WebkitMaskImage: FADE_MASK,
      }}
      aria-hidden="true"
    >
      {/* 1. Base Texture */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: 'url("/sprites/bg-bricks.png")',
          backgroundRepeat: 'repeat'
        }}
      />

      {/* 2. Vignette (fades the texture into the page background at the edges) */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, var(--color-bg-page) 100%)'
        }}
      />

      {/* 3. Illumination Glows (acts as flickering light on the stone) */}
      {showGlows && (
        <div className="absolute inset-0 mix-blend-overlay hero-glows">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="rounded-full blur-[100px] bg-primary/80 hero-pulse"
              style={{ width: 1000, height: 750 }}
            />
          </div>

          <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="rounded-full blur-[70px] bg-primary/50 hero-pulse-2"
              style={{ width: 600, height: 600 }}
            />
          </div>

          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 blur-2xl rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 blur-2xl rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
      )}
    </div>
  );
}
