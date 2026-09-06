package dev.aihub.ingestion;

import dev.aihub.security.AuthenticatedUser;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Deliberately no class-level {@code @Validated}: since Spring Framework 6.1, constrained
 * {@code @RequestParam}s on a plain controller are validated automatically and a violation raises
 * {@link org.springframework.web.method.annotation.HandlerMethodValidationException}, which
 * {@code spring.mvc.problemdetails.enabled} (application.yml) turns into a 400. Adding
 * {@code @Validated} switches this to the older AOP-based path instead, which raises
 * {@code ConstraintViolationException} - unhandled here, so it would surface as a 500.
 */
@RestController
@RequestMapping("/projects")
public class ProjectsController {

    private final ProjectService projectService;
    private final EntryService entryService;

    public ProjectsController(ProjectService projectService, EntryService entryService) {
        this.projectService = projectService;
        this.entryService = entryService;
    }

    @GetMapping
    public List<ProjectResponse> listProjects(@AuthenticationPrincipal Jwt jwt) {
        return projectService.listProjects(AuthenticatedUser.from(jwt));
    }

    @GetMapping("/{projectId}/entries")
    public EntryPageResponse listEntries(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            @RequestParam(required = false) String cursor) {
        return entryService.listEntries(AuthenticatedUser.from(jwt), projectId, limit, cursor);
    }
}
