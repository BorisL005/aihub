package dev.aihub.ingestion;

import dev.aihub.security.AuthenticatedUser;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/projects")
@Validated
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
