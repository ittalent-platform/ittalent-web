import "@testing-library/jest-dom/vitest";
import "@/i18n";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

afterEach(() => {
  cleanup();
});
