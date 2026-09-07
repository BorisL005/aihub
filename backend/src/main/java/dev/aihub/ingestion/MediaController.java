package dev.aihub.ingestion;

import dev.aihub.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping("/upload-url")
    public MediaUploadUrlResponse createUploadUrl(@AuthenticationPrincipal Jwt jwt) {
        return mediaService.createUploadUrl(AuthenticatedUser.from(jwt));
    }
}
