# Security

Do not put credentials, personal information, or player data in public issues. Report a suspected vulnerability through GitHub's private vulnerability reporting when available, or through an existing private contact channel.

This game stores progress only in the browser. It does not use remote services, server credentials, or environment files. Keep private files, browser profiles, database exports, and backup repositories out of Git.

Use a GitHub noreply address for commits. Run the publication check, offline check, tests, and Gitleaks before pushing. Secret scanning has no project-specific exceptions.

If a credential enters Git, revoke or rotate it first, then remove it from all affected refs and historical versions. Deleting the current file is insufficient; existing clones and cached objects can retain old content.
