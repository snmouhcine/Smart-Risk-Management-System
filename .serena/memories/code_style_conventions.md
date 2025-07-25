# Code Style and Conventions

## JavaScript/React Conventions
- **ES Modules**: Using modern ES6+ syntax with imports/exports
- **React Functional Components**: All components use functional syntax with hooks
- **File Extensions**: `.jsx` for React components, `.js` for utilities
- **Component Structure**: 
  - Named exports for utility functions
  - Default exports for React components
  - Components in PascalCase (e.g., `MethodeAlpha`, `Dashboard`)
  - Utilities and hooks in camelCase (e.g., `useLocalStorage`, `formatters`)

## Code Organization
- **No TypeScript**: Pure JavaScript without type annotations
- **No JSDoc comments**: Clean code without documentation comments
- **Hooks Pattern**: Custom hooks in `src/hooks/` directory
- **Context Pattern**: Auth context for state management
- **Modular Architecture**: Separate modules for each feature (Dashboard, Calculator, Journal, etc.)

## Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Inline Classes**: Tailwind classes directly in JSX
- **No CSS-in-JS**: No styled-components or emotion

## Naming Conventions
- **Variables**: camelCase (e.g., `currentBalance`, `stopLossTicks`)
- **Constants**: UPPER_SNAKE_CASE or camelCase for config objects
- **Functions**: camelCase with descriptive names (e.g., `calculateCurrentBalanceFromJournal`)
- **Event Handlers**: `handle` prefix (e.g., `handleDayClick`, `handleQuickAction`)

## ESLint Rules
- Recommended JS rules
- React Hooks rules enforced
- React Refresh rules for Vite
- Unused vars allowed if they start with uppercase or underscore