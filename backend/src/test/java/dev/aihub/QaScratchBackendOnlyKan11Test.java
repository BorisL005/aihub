package dev.aihub;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Scratch test for QA verification of KAN-11 AC-3/AC-4 path-scoping (dorny/paths-filter
 * {@code changes} job in .github/workflows/build-and-test.yml). This file touches only
 * backend/** so that the CI run it triggers proves: build-and-test (backend) runs, and
 * mobile-build-and-test is skipped. Plain unit test - no Spring context, no Testcontainers,
 * no network - so it doesn't add meaningful runtime to the backend job. Delete once the
 * AC-3/AC-4 verification run has been observed - not meant to remain in the suite long-term.
 */
class QaScratchBackendOnlyKan11Test {

    @Test
    void isANoOpAssertionPresentOnlyToProduceABackendOnlyDiff() {
        assertThat(true).isTrue();
    }
}
