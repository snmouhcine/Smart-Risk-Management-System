# Project Structure

## Root Directory
```
money-management/
├── src/                    # Source code
├── public/                 # Static assets
├── api/                    # API related files
├── .serena/               # Serena configuration
├── package.json           # NPM dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS config
├── eslint.config.js       # ESLint configuration
├── postcss.config.js      # PostCSS configuration
├── .env.example           # Environment variables template
└── README.md              # Project documentation
```

## Source Structure
```
src/
├── components/            # React components
│   ├── MethodeAlpha.jsx  # Main application component
│   ├── auth/             # Authentication components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── AuthGuard.jsx
│   └── modules/          # Feature modules
│       ├── Dashboard.jsx # Main dashboard
│       ├── Calculator.jsx # Position calculator
│       ├── Journal.jsx   # Trading journal
│       ├── DirecteurIA.jsx # AI director
│       └── Settings.jsx  # Settings panel
├── contexts/             # React contexts
│   └── AuthContext.jsx   # Authentication context
├── hooks/                # Custom React hooks
│   ├── useLocalStorage.js
│   └── useSupabaseData.js
├── services/             # External services
│   └── dataService.js    # Data management service
├── utils/                # Utility functions
│   ├── formatters.js     # Data formatting utilities
│   ├── dataManager.js    # Data management utilities
│   └── aiProviders.js    # AI provider integrations
├── lib/                  # External library configs
│   └── supabase.js       # Supabase client
├── constants/            # Application constants
│   └── contracts.js      # Trading contracts config
├── App.jsx              # Root application component
├── main.jsx             # Application entry point
└── index.css            # Global styles
```

## Key Entry Points
- **main.jsx**: Application entry point that renders App component
- **App.jsx**: Root component with AuthProvider wrapper
- **MethodeAlpha.jsx**: Main application UI and logic