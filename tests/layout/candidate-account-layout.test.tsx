import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { CandidateAccountLayout } from "@/components/layout/candidate-account-layout";

describe("CandidateAccountLayout", () => {
  it("spaces a page made of sibling blocks like the marketplace main column", () => {
    // Pages such as My applications return a fragment (header, toolbar, table); without a gap they touch.
    render(
      <MemoryRouter initialEntries={["/page"]}>
        <Routes>
          <Route element={<CandidateAccountLayout />}>
            <Route
              element={
                <>
                  <header data-testid="header" />
                  <div data-testid="toolbar" />
                  <div data-testid="table" />
                </>
              }
              path="/page"
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const column = screen.getByTestId("header").parentElement!;
    expect(column).toBe(screen.getByTestId("toolbar").parentElement);
    expect(column).toBe(screen.getByTestId("table").parentElement);
    expect(column.className).toContain("flex-col");
    expect(column.className).toContain("gap-5");
  });
});
