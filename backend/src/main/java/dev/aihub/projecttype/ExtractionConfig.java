package dev.aihub.projecttype;

/**
 * The columns {@link ProjectTypeRepository} reads to run extraction for one project: the prompt
 * identifier ({@link dev.aihub.llm.PromptLoader} resolves it to a resource) and the logical model
 * name ({@link dev.aihub.llm.ModelRegistry} resolves it to a concrete call).
 */
public record ExtractionConfig(String extractionPrompt, String extractionModel) {
}
