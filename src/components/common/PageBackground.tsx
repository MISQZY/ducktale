export function PageBackground() {
  return (
    <>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="rounded-full blur-3xl bg-amber-600/5 hero-pulse"
            style={{ width: 800, height: 800 }}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="rounded-full blur-3xl bg-amber-600/5"
            style={{ width: 600, height: 600 }}
          />
        </div>
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
    </>
  );
}
