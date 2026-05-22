export default function HeroBackground() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500/5 rounded-full blur-3xl"
          style={{ width: 800, height: 800 }}
        />
        <div
          className="absolute top-1/3 left-1/3 bg-amber-600/3 rounded-full blur-2xl"
          style={{ width: 400, height: 400 }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
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
