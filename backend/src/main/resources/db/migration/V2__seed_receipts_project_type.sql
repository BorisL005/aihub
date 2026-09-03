insert into project_types (name, schema, extraction_prompt, extraction_model, answer_model)
values (
    'receipts',
    '{
        "type": "object",
        "required": ["merchant", "purchased_at", "total", "currency"],
        "properties": {
            "merchant": {
                "type": "string",
                "description": "Store name as printed, trimmed, no legal-form normalisation."
            },
            "purchased_at": {
                "type": "string",
                "format": "date",
                "description": "Calendar date of purchase, YYYY-MM-DD."
            },
            "total": {
                "type": "number",
                "minimum": 0,
                "multipleOf": 0.01,
                "description": "Grand total actually paid."
            },
            "currency": {
                "type": "string",
                "pattern": "^[A-Z]{3}$",
                "description": "ISO-4217 three-letter uppercase code."
            },
            "tax_total": {
                "type": "number",
                "minimum": 0,
                "multipleOf": 0.01
            },
            "payment_method": {
                "type": "string",
                "enum": ["card", "cash", "other"]
            },
            "line_items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["description"],
                    "properties": {
                        "description": {"type": "string"},
                        "quantity": {"type": "number"},
                        "amount": {"type": "number", "minimum": 0, "multipleOf": 0.01}
                    }
                }
            }
        }
    }'::jsonb,
    '',
    'vision-cheap',
    'text-cheap'
);
