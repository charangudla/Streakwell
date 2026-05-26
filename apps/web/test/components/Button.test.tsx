import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonLink } from "@/components/Button";

describe("ButtonLink", () => {
  it("renders as an anchor with the given href and label", () => {
    render(<ButtonLink href="/download">Get the app</ButtonLink>);
    const link = screen.getByRole("link", { name: "Get the app" });
    expect(link).toHaveAttribute("href", "/download");
  });

  it("applies the primary variant by default", () => {
    render(<ButtonLink href="/x">Default</ButtonLink>);
    expect(screen.getByRole("link")).toHaveClass("bg-brand-500");
  });

  it("applies the secondary variant when requested", () => {
    render(
      <ButtonLink href="/x" variant="secondary">
        Secondary
      </ButtonLink>,
    );
    expect(screen.getByRole("link")).toHaveClass("ring-slate-200");
  });

  it("applies the lg size when requested", () => {
    render(
      <ButtonLink href="/x" size="lg">
        Large
      </ButtonLink>,
    );
    expect(screen.getByRole("link")).toHaveClass("h-12");
  });
});
