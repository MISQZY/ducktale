// Fade applied directly to the texture/glow layers themselves (not just an
// opaque div painted on top of them) so nothing — grid lines, glow blur,
// anything — can leave a hard edge where this section meets the next one.
// Used a radial gradient to give the fade an organic, curved (dome-like) shape
// instead of a harsh flat horizontal line.
const FADE_MASK = "radial-gradient(ellipse 150% 100% at 50% 0%, black 75%, transparent 100%)";

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

      {/* 3. Illumination Glows / Fog */}
      {showGlows && (
        <div className="absolute inset-0 hero-glows">
          
          {/* Dark Theme: Gold Flickering Glows */}
          <div className="hidden dark:block absolute inset-0 mix-blend-overlay">
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

          {/* Light Theme: Dissipating Fog */}
          <div className="block dark:hidden absolute inset-0 mix-blend-normal pointer-events-none overflow-hidden">
            {/* Weak overall fog */}
            <div className="absolute inset-0 bg-white/40" />

            {/* Drifting fog clouds (ovals) */}
            <div
              className="fog-cloud"
              style={{ top: "10%", width: "900px", height: "300px", animationDuration: "35s", animationDelay: "-10s", opacity: 0.6 }}
            />
            <div
              className="fog-cloud"
              style={{ top: "40%", width: "1200px", height: "400px", animationDuration: "45s", animationDelay: "-25s", opacity: 0.7 }}
            />
            <div
              className="fog-cloud"
              style={{ top: "70%", width: "1000px", height: "350px", animationDuration: "30s", animationDelay: "-5s", opacity: 0.5 }}
            />
            <div
              className="fog-cloud"
              style={{ top: "30%", width: "800px", height: "250px", animationDuration: "40s", animationDelay: "-20s", opacity: 0.8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}