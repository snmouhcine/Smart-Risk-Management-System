# Suggested Commands for Development

## Development Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## Git Commands (Darwin/macOS)
- `git status` - Check current changes
- `git diff` - View unstaged changes
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git push` - Push to remote repository
- `git pull` - Pull latest changes

## File System Commands (Darwin/macOS)
- `ls -la` - List all files with details
- `find . -name "*.jsx"` - Find all JSX files
- `grep -r "pattern" src/` - Search for pattern in source files
- `open .` - Open current directory in Finder
- `code .` - Open in VS Code (if installed)

## NPM Commands
- `npm install` - Install dependencies
- `npm install <package>` - Add new dependency
- `npm install -D <package>` - Add dev dependency
- `npm outdated` - Check for outdated packages
- `npm update` - Update packages

## Project-Specific Notes
- No test runner configured (no test files found)
- No formatter configured (only ESLint for linting)
- Vite proxy configured for AI API calls (Anthropic, OpenAI, Google)
- Supabase configuration required in `.env.local`