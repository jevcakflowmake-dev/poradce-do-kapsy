/** Obrys obsahu sekce – navigace vlevo zůstává, mění se jen obsah. */
export default function SekceLoading() {
  return (
    <div aria-busy aria-label="Načítám">
      <div className="h-10 w-48 rounded-input bg-line/70 animate-pulse" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-72 rounded-card bg-line/50 animate-pulse" />
        <div className="h-72 rounded-card bg-line/50 animate-pulse" />
      </div>
    </div>
  )
}
