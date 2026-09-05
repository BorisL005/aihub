import { render, screen } from "@testing-library/react-native";
import type { ValidationStatus } from "../src/api/types";
import { StatusBadge } from "../src/components/StatusBadge";

// AC-8: status badges use fixed user-facing wording and never show the internal status name.
describe("StatusBadge", () => {
  it("labels pending as 'Not read yet'", async () => {
    await render(<StatusBadge status="pending" />);
    expect(screen.getByText("Not read yet")).toBeTruthy();
    expect(screen.queryByText("pending")).toBeNull();
  });

  it("labels needs_review as 'Needs a check'", async () => {
    await render(<StatusBadge status="needs_review" />);
    expect(screen.getByText("Needs a check")).toBeTruthy();
    expect(screen.queryByText("needs_review")).toBeNull();
  });

  it("labels extracted as 'Read'", async () => {
    await render(<StatusBadge status="extracted" />);
    expect(screen.getByText("Read")).toBeTruthy();
    expect(screen.queryByText("extracted")).toBeNull();
  });

  // `validation_status` has no DB-level CHECK constraint (follow-up ticket), so a value outside
  // the closed union is reachable at runtime - must render a fallback, not crash the row.
  it("falls back instead of throwing for an unrecognised status", async () => {
    await render(<StatusBadge status={"archived" as ValidationStatus} />);
    expect(screen.getByText("Unknown status")).toBeTruthy();
  });
});
