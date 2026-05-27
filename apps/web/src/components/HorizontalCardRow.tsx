import type { ReactNode } from "react";

/**
 * Horizontally-scrollable card row on phone + tablet, grid on desktop —
 * mirrors the mobile app's "Recommended for you" lane on the home
 * screen.
 *
 * Mobile (<md): cards line up horizontally inside an overflow-x-auto
 * container that bleeds to the viewport edges so cards can swipe past
 * page padding for a native feel. scroll-snap-x mandatory + snap-start
 * on each child so cards snap into place when you stop swiping.
 * Scrollbar is hidden.
 *
 * Desktop (md+): collapses to a 2-/3-column grid.
 *
 * Wrap each child in <CarouselCard> so it gets a fixed width on mobile
 * (w-72 ~= 288px) and auto-width inside the grid on desktop.
 */
export function HorizontalCardRow({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 -mx-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 md:mx-0 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
      <div className="flex snap-x snap-mandatory gap-4 px-4 sm:px-6 md:grid md:snap-none md:grid-cols-2 md:px-0 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

export function CarouselCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-72 flex-none snap-start md:w-auto md:flex-initial">
      {children}
    </div>
  );
}
