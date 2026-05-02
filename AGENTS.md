# AGENTS.md

## Project identity

This is theinternetisdead.org, a static experimental art website built through iterative vibecoding.

The site intentionally uses HTML, CSS, JavaScript, iframes, overlays, weird UI experiments, and unconventional structure. Do not “clean up” the project into a conventional app unless explicitly asked.

Prioritize preserving the existing aesthetic, file structure, behavior, and user intent.

## Communication rules

Before editing, always state:

1. Which file(s) you plan to edit.
2. Which visible area/page/component the change affects.
3. Whether the change affects desktop, mobile, tablet, or all viewport sizes.
4. Which CSS selectors, IDs, classes, functions, or media queries you plan to touch.
5. What the user should test after the change.

Do not silently edit mobile-only CSS when the issue was reported on desktop.

Do not silently edit desktop/global CSS when the issue was reported on mobile.

If editing inside a media query, name the exact media query first.

Example:

`Editing mobile-only CSS: @media (max-width: 768px)`

## Responsive layout rules

For any layout, spacing, sizing, sidebar, nav, overlay, iframe, header, or menu issue:

1. First identify whether the visible bug is controlled by global CSS or by a media query.
2. Confirm whether the user’s screenshot or description appears to be desktop, mobile, or tablet.
3. Do not assume the breakpoint.
4. Report the breakpoint affected in the final summary.

Every CSS/layout summary must include:

- Changed files
- Breakpoints affected
- Selectors changed
- What to test
- What should not have changed

## File editing rules

Make the smallest safe change that fixes the requested issue.

Do not remove existing features, commands, comments, weird experiments, Easter eggs, iframe behavior, or old code unless explicitly asked.

Do not rename files or move folders unless explicitly asked.

When creating new files, place them in the exact path requested by the user.

When editing game or website code, preserve the current style and structure unless the user asks for a refactor.

## Testing rules

After making changes, explain what was tested or what could not be tested.

For static site changes, prefer simple checks like:

- Confirm the file path exists.
- Confirm the changed selector/function is present.
- Confirm no obvious syntax errors were introduced.
- Tell the user exactly what URL or local path to open.

For this project, common local test command:

`python -m http.server 8000`

Common local URL pattern:

`http://localhost:8000/`

## Git rules

Before committing, summarize the diff.

Use concise commit messages.

Do not push unless explicitly asked.

If push is rejected because remote has new commits, stop and explain that the user needs to pull/rebase before pushing.

## User preference rules

The user prefers:

- Plain-English explanations.
- Small scoped changes.
- Clear changed-file lists.
- Only updated files when packaging changes.
- No unnecessary rewrites.
- No “best practices” sermon unless something is actually risky.
- Preserve the cursed experimental iframe-shell vibe.
