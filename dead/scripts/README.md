# scripts

This folder contains shared build scripts and browser helper scripts used by the site and GitHub Actions.

## Subfolders

- `build/` - build and index-generation scripts used by GitHub Actions or manual repo maintenance.
- `chat/` - shared chat behavior scripts used by site/chat pages.
- `page-helpers/` - small browser helper scripts that pages can opt into.

## Files

- `build/build-feed-videos.py`
- `build/build-message-list.js`
- `build/build-repo-index.js`
- `chat/index-chat.js`
- `chat/main-chat-sandbox.js`
- `page-helpers/hide-overlay.js`
- `page-helpers/screenshot-shortcut.js`
- `page-helpers/time-easter-egg.js`

## Notes

Scripts in this folder are plain project utilities; check workflow references and HTML script tags before moving them again.
