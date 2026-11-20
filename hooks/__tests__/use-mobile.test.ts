import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { useIsMobile } from "../use-mobile";

function MobileLabel() {
  return createElement("span", null, useIsMobile() ? "mobile" : "desktop");
}

type ChangeListener = () => void;

/** jsdom has no matchMedia, so we build a tiny fake we can control. */
function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<ChangeListener>();

  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_event: string, listener: ChangeListener) => listeners.add(listener),
    removeEventListener: (_event: string, listener: ChangeListener) => listeners.delete(listener),
  }));

  return {
    listenerCount: () => listeners.size,
    changeTo(next: boolean) {
      matches = next;
      listeners.forEach((listener) => listener());
    },
  };
}

describe("useIsMobile", () => {
  it("is true on a phone-sized screen", () => {
    mockMatchMedia(true);

    expect(renderHook(() => useIsMobile()).result.current).toBe(true);
  });

  it("is false on a desktop-sized screen", () => {
    mockMatchMedia(false);

    expect(renderHook(() => useIsMobile()).result.current).toBe(false);
  });

  it("asks for a max-width of 767px (below 768px counts as mobile)", () => {
    mockMatchMedia(false);

    renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("updates when the screen size changes", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      media.changeTo(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      media.changeTo(false);
    });
    expect(result.current).toBe(false);
  });

  it("assumes desktop when rendered on the server (there is no window to measure)", () => {
    // Even if the "browser" would say mobile, the server render must not depend on it.
    mockMatchMedia(true);

    expect(renderToString(createElement(MobileLabel))).toContain("desktop");
  });

  it("stops listening after unmount", () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());

    expect(media.listenerCount()).toBe(1);

    unmount();

    expect(media.listenerCount()).toBe(0);
  });
});
