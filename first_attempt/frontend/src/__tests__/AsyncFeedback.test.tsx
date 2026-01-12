import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ErrorNotice,
  LoadingPlaceholder,
} from "../components/AsyncFeedback";

describe("AsyncFeedback", () => {
  it("renders a loading placeholder with skeleton lines", () => {
    const { container } = render(
      <LoadingPlaceholder lines={3} label="Loading data" />
    );

    expect(screen.getByText("Loading data")).toBeInTheDocument();
    expect(container.querySelectorAll(".skeleton-line")).toHaveLength(3);
  });

  it("renders an error notice and triggers retry", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<ErrorNotice message="Something went wrong" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
