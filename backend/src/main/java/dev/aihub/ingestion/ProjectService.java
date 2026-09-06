package dev.aihub.ingestion;

import dev.aihub.security.AuthenticatedUser;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    /**
     * Auto-provisions the caller's receipts project (ARCHITECTURE.md decision 2) before listing,
     * so a brand-new user's first call already returns it (AC-10).
     */
    @Transactional
    public List<ProjectResponse> listProjects(AuthenticatedUser user) {
        projectRepository.ensureReceiptsProject(user.userId());
        return projectRepository.findAllByUserId(user.userId());
    }
}
