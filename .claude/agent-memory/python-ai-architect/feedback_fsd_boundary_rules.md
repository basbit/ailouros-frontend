---
name: fsd-boundary-rules
description: ESLint boundaries/dependencies rules enforced in this frontend — shared cannot import entities, features cannot import features
metadata:
  type: feedback
---

The `boundaries/dependencies` ESLint rule is strictly enforced with `default: disallow`.

Allowed import directions:
- `app/pages/widgets` → features, entities, shared
- `features` → entities, shared (NOT other features)
- `entities` → entities, shared (NOT features)
- `shared` → shared ONLY (NOT entities, NOT features)

**Why:** FSD architecture enforced via eslint-plugin-boundaries in eslint.config.js.

**How to apply:**
- Domain types used by `shared/api/endpoints` MUST live in `shared/model/` (not entities) because shared cannot import entities.
- Entity `model/types.ts` files should re-export from `@/shared/model/<concept>-types` (entities CAN import shared).
- Components used by multiple features go to `shared/components/` or `entities/<concept>/ui/` (NOT a feature directory).
- A component that fits in the role domain → `entities/role/ui/RolePickerPopover.vue` (features and widgets can import entities).
- Never create feature-to-feature import paths even for "shared" domain components.
