import { formatAmount } from "../src/utils/formatAmount";

describe("formatAmount", () => {
  it("formats a two-decimal total with its ISO currency code", () => {
    expect(formatAmount(30.75, "CAD")).toBe("CAD 30.75");
  });

  it("always shows two decimal places, even for a whole number", () => {
    expect(formatAmount(23, "CAD")).toBe("CAD 23.00");
  });
});
