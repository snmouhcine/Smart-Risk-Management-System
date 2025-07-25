# Task Completion Checklist

When completing a coding task in this project, always ensure:

## 1. Code Quality
- [ ] Run `npm run lint` to check for ESLint errors
- [ ] Fix any linting errors before considering task complete
- [ ] Ensure code follows existing patterns and conventions

## 2. Functionality
- [ ] Test the feature manually in the browser (`npm run dev`)
- [ ] Verify all UI interactions work as expected
- [ ] Check browser console for any errors

## 3. Code Style
- [ ] Use functional React components with hooks
- [ ] Follow camelCase naming for variables and functions
- [ ] Use Tailwind CSS classes for styling
- [ ] Keep components modular and focused

## 4. Integration
- [ ] Ensure proper imports/exports
- [ ] Verify Supabase integration if touching auth/data
- [ ] Check AI provider integration if modifying AI features

## 5. Performance
- [ ] Avoid unnecessary re-renders
- [ ] Use React hooks appropriately (useMemo, useCallback when needed)
- [ ] Keep bundle size reasonable

## Important Notes
- No automated tests to run (project has no test suite)
- No code formatter configured (maintain consistency manually)
- Always test in development server before marking complete
- If modifying AI features, ensure API keys are properly configured