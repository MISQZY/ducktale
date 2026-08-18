// Fade applied directly to the texture/glow layers themselves (not just an
// opaque div painted on top of them) so nothing — grid lines, glow blur,
// anything — can leave a hard edge where this section meets the next one.
const FADE_MASK =
  "linear-gradient(to bottom, black calc(100% - 16rem), transparent 100%)";

export function PageBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        maskImage: FADE_MASK,
        WebkitMaskImage: FADE_MASK,
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 stonework-bg opacity-100" />

      <div className="absolute inset-0 map-grid" />
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="rounded-full blur-[50px] bg-primary/8 hero-pulse will-change-[opacity]"
            style={{ width: 1100, height: 850 }}
          />
        </div>

        <div className="absolute top-[45%] left-[48%] -translate-x-1/2 -translate-y-1/2">
          <div
            className="rounded-full blur-[35px] bg-foreground/6 hero-pulse-2 will-change-[opacity]"
            style={{ width: 620, height: 620 }}
          />
        </div>

        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/3 blur-2xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/3 blur-2xl rounded-full translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  );
}
