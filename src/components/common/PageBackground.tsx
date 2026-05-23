export function PageBackground() {
  return (
    <>
      <div className="absolute inset-0 stonework-bg pointer-events-none opacity-100" aria-hidden="true" />

      <div className="absolute inset-0 map-grid pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="rounded-full blur-[120px] bg-gold-600/8 hero-pulse"
            style={{ width: 900, height: 700 }}
          />
        </div>

        <div className="absolute top-[45%] left-[48%] -translate-x-1/2 -translate-y-1/2">
          <div
            className="rounded-full blur-[80px] bg-amber-800/6 hero-pulse-2"
            style={{ width: 500, height: 500 }}
          />
        </div>

        <div className="absolute top-0 left-0 w-64 h-64 bg-gold-700/3 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold-700/3 blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #0f0e0c)" }}
      />
    </>
  );
}
