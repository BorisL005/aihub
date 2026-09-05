import { fireEvent, render, screen } from "@testing-library/react-native";
import { PrimaryButton } from "../src/components/PrimaryButton";

describe("PrimaryButton", () => {
  it("calls onPress when enabled", async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Try again" onPress={onPress} />);

    await fireEvent.press(screen.getByText("Try again"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // A disabled primary CTA must not silently do nothing when tapped - it must actually be
  // disabled, not just styled to look that way.
  it("does not call onPress when disabled", async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Capture receipt" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByText("Capture receipt"));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
