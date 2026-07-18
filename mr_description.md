# Feature: Admin Concession Form UI Improvements

## Description
This MR contains UI/UX improvements for the admin concession module, focusing on the image upload experience and visual polish of form components.

## What's New
- **Image Upload UX**: Support drag & drop, paste from clipboard, and preview for concession images
- **Cloudinary Integration**: New `uploadImage` API endpoint to upload images via backend to Cloudinary
- **UI Polish**: Improve Input border visibility (opacity `0.08 → 0.15`) for better contrast
- **Chore**: Clean up `package-lock.json` (remove redundant peer fields)

## Commits
| # | Commit  | Type   | Description                                   |
|---|---------|--------|-----------------------------------------------|
| 1 | 424fd9d | chore  | Update package-lock.json                      |
| 2 | a10ca0c | style  | Improve Input border visibility               |
| 3 | 437e5c2 | feat   | Add uploadImage API for Cloudinary            |
| 4 | f4c1a6c | feat   | Redesign concession form UI                   |

## Files Changed
| File                                                     | Changes  |
|----------------------------------------------------------|----------|
| `package-lock.json`                                      | 19 +/-   |
| `src/components/common/Input.jsx`                        | 2 +/-    |
| `src/services/concessionService.js`                      | 12 ++    |
| `src/pages/admin/concessions/ConcessionFormPage.jsx`     | 716 +/-  |

**Total:** 4 files changed, 463 insertions(+), 286 deletions(-)

## Checklist
- [x] Code follows project conventions
- [x] No breaking changes
- [x] Manual testing completed
- [ ] Unit tests added (N/A for UI-only changes)
- [ ] Documentation updated

## Related
- Branch: `dev/Phat` → `main`
- Author: Tan Phat (@fsa_PhatNT_08)

## Screenshots
<!-- Add screenshots of the new form UI here -->