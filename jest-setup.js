// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// IntersectionObserver is not available in jsdom (used by @grafana/scenes LazyLoader)
global.IntersectionObserver = class IntersectionObserver {};
