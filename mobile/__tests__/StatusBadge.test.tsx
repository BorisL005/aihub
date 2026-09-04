import { render, screen } from "@testing-library/react-native";
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
});
