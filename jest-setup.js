// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// IntersectionObserver is not available in jsdom (used by @grafana/scenes LazyLoader)
global.IntersectionObserver = class IntersectionObserver {};

// Emotion + :has() can produce selectors nwsapi cannot parse; Floating UI's Modal focus trap
// calls getComputedStyle and throws. Fall back so tab order / visibility checks still run.
const origGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (element, pseudoElt) => {
  try {
    return origGetComputedStyle(element, pseudoElt);
  } catch {
    return {
      getPropertyValue: () => '',
      visibility: 'visible',
    };
  }
};
