---
applyTo: "frontend/**/*.{js,jsx,ts,tsx}"
---

# Frontend Conventions

## Component Reuse

- Inspect the existing component library before building UI.
- Reuse existing buttons, inputs, dialogs, tables, cards, badges, dropdowns, and layout components.
- Check shared components and UI primitives before creating new components.
- Use existing shadcn/ui components if the project already uses shadcn/ui.
- Never create duplicate components with the same purpose.
- Follow existing component props, variants, composition, and styling conventions.

## Data Fetching and API

- Inspect existing API clients, service modules, hooks, and query utilities.
- Use the established API client and authentication mechanism.
- Follow existing query keys, cache invalidation, loading states, and error handling.
- Reuse existing endpoint functions instead of writing raw fetch or axios calls when a shared client exists.
- Keep API calls out of UI components if the project follows a service or hook architecture.
- Do not hardcode API URLs when the project uses environment variables or centralized configuration.

## UI and UX

- Follow the existing design system, spacing, typography, colors, and responsive breakpoints.
- Reuse established form validation and error display patterns.
- Maintain consistent loading, empty, success, and error states.
- Preserve accessibility and responsive behavior.
- Avoid introducing new styling systems or dependencies.

## Before Finishing

- Check whether existing components can handle the required UI.
- Verify that API integration follows existing service conventions.
- Check types, lint errors, and affected components.
- Avoid unrelated UI changes.
