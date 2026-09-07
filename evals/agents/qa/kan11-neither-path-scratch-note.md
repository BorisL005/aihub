# QA scratch note (KAN-11)

Throwaway file used by QA to produce a diff that touches neither `backend/**`
nor `mobile/**` (and not `.github/workflows/build-and-test.yml`), to observe
whether `.github/workflows/build-and-test.yml`'s two path-scoped jobs both
report `skipped` (rather than the workflow hanging, or a required check
never reporting) when no changed path matches either `dorny/paths-filter`
filter. See PR #9 / KAN-11 AC-3 through AC-5 edge-case hunt.

Not meant to remain in the repo - delete once the CI run has been observed.
