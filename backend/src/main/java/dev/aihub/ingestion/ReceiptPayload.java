package dev.aihub.ingestion;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * The {@code receipts} {@code project_type}'s payload shape (KAN-4's schema, restated here as a
 * Bean-Validated record rather than parsed dynamically from {@code project_types.schema} - v1
 * has exactly one project_type, so a hand-written record is simpler than a generic JSON-Schema
 * validator and is what {@link ReceiptExtractionService} binds the model's structured output
 * onto). Field names are {@code @JsonProperty}-pinned to the schema's own snake_case names
 * because this record's JSON form is {@code entries.payload} itself - the wire format the
 * mobile client and the eval fixtures already depend on, not an internal detail free to rename.
 *
 * <p>AC-2's validation-failure triggers map directly onto these constraints: {@code @NotNull}
 * catches a missing {@code total}/{@code currency}, the date type itself rejects an unparseable
 * {@code purchased_at} at deserialization (surfaced by {@link ReceiptExtractionService} as a
 * validation failure, not a crash), and {@code @DecimalMin} catches a negative amount.
 */
public record ReceiptPayload(
        // AC-5: null is a valid, honest answer when the merchant name isn't legible as text -
        // never required, and the prompt (v1.st) tells the model to prefer null over a guess.
        @JsonProperty("merchant") String merchant,
        @JsonProperty("purchased_at") @NotNull LocalDate purchasedAt,
        @JsonProperty("total") @NotNull @DecimalMin(value = "0.00") BigDecimal total,
        @JsonProperty("currency") @NotNull @Pattern(regexp = "^[A-Z]{3}$") String currency,
        @JsonProperty("tax_total") @DecimalMin(value = "0.00") BigDecimal taxTotal,
        @JsonProperty("payment_method") @Pattern(regexp = "^(card|cash|other)$") String paymentMethod,
        @JsonProperty("line_items") @Valid List<LineItem> lineItems) {

    public record LineItem(
            @JsonProperty("description") @NotBlank String description,
            @JsonProperty("quantity") BigDecimal quantity,
            @JsonProperty("amount") @DecimalMin(value = "0.00") BigDecimal amount) {
    }
}
