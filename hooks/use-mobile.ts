import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

// Tell React how to "listen to" the browser's media query...
function subscribe(onChange: () => void) {
  const mediaQuery = globalThis.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
}

// ...and how to read its current value. (React calls these instead of us using an effect + setState.)
function getSnapshot() {
  return globalThis.matchMedia(MOBILE_QUERY).matches;
}

// On the server there is no window, so we assume desktop. React then corrects it on hydration.
function getServerSnapshot() {
  return false;
}

/** true on phone-sized screens (< 768px). The sidebar uses it to switch to the overlay. */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
