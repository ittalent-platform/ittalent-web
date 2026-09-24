import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "@/features/public-site/landing-page";

describe("LandingPage", () => {
  it("renders hero section and call-to-action buttons", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /reliable software outsourcing/i })).toBeInTheDocument();
    expect(screen.getByText(/Enterprise Engineering Partner/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /start a project/i }).length).toBeGreaterThanOrEqual(1);
  });
});
