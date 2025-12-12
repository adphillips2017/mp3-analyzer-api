# Shared Package

This package contains shared types, interfaces, and models that are used by both the frontend and backend applications to ensure type safety across the codebase.

## Structure

```
shared/
├── src/
│   ├── models/          # Data models and interfaces
│   └── index.ts         # Main export file
├── package.json
└── tsconfig.json
```

## Usage

### In Backend (API)

```typescript
import { AnalyzeResponse } from '@mp3-analyzer/shared';

// Use the shared type
const response: AnalyzeResponse = {
  status: 'received',
  fileName: 'example.mp3'
};
```

### In Frontend

After installing the shared package:
```typescript
import { AnalyzeResponse } from '@mp3-analyzer/shared';

// Use the shared type
const handleResponse = (data: AnalyzeResponse) => {
  // Type-safe handling
};
```

## Building

Build the shared package to generate TypeScript declarations:
```bash
npm run build
```

The built files will be in the `dist/` directory.
