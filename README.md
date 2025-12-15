# MP3 Analyzer API

A RESTful API service built with Node.js, Express, and TypeScript that accepts MP3 files and analyzes them to extract metadata, including frame count and other audio information.

## Description

The MP3 Analyzer API provides endpoints for analyzing MP3 audio files. The API accepts MP3 file uploads and returns detailed information about the audio file, including the number of frames, which is essential for understanding the structure and duration of MP3 files.

## Current Status

✅ **Completed:**
- Project structure and architecture setup
- Express.js server with TypeScript
- Middleware configuration (CORS, JSON parsing, rate limiting, request timeout)
- Route structure and controllers
- Health check and API info endpoints
- MP3 file upload handling with file size and type validation
- MP3 frame counting implementation
- File parsing and analysis logic
- Docker configuration (production and development)
- Development hot-reloading support
- Unit and E2E test suites (including rate limiting and timeout tests)
- Code quality tools (ESLint, Prettier, TypeScript type checking)
- Postman collection and environment configuration
- Accept MP3 file uploads via HTTP POST requests
- Parse and analyze MP3 file structure
- Return accurate frame count for MPEG-1 Layer 3 files
- Handle MPEG-1 Layer 3 (MP3) files with various bitrates and sample rates
- Provide error handling for invalid or corrupted files
- Rate limiting for API protection
- Request timeout handling

## Architecture & File Structure

The project follows a clean, modular architecture with separation of concerns:

```
mp3-analyzer-api/
├── api/                          # API workspace
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   │   ├── api.controller.ts      # General API endpoints (health, info)
│   │   │   └── analyze.controller.ts  # MP3 analysis endpoint handler
│   │   ├── services/            # Business logic
│   │   │   └── analyze.service.ts      # MP3 analysis service
│   │   ├── routes/              # Route definitions
│   │   │   ├── index.ts               # Main router (mounts all routes)
│   │   │   └── analyze.ts              # Analyze route definitions
│   │   ├── middleware/         # Custom middleware
│   │   │   ├── rateLimit.ts           # Rate limiting middleware
│   │   │   ├── timeout.ts             # Request timeout middleware
│   │   │   └── upload.ts              # File upload middleware
│   │   ├── middleware.ts        # Express middleware configuration
│   │   ├── constants/           # Application constants
│   │   ├── models/              # TypeScript models and interfaces
│   │   ├── tests/               # Test suites
│   │   │   ├── unit/                 # Unit tests
│   │   │   └── e2e/                  # End-to-end tests
│   │   └── index.ts             # Application entry point
│   ├── postman/                 # Postman collection and environments
│   │   ├── MP3-Analyzer-API.postman_collection  # Postman collection
│   │   └── local.postman_environment.json       # Local environment variables
│   ├── .eslintrc.json           # ESLint configuration
│   ├── .prettierrc              # Prettier configuration
│   ├── package.json
│   └── tsconfig.json
├── shared/                       # Shared workspace (common models and constants)
│   ├── src/
│   │   ├── constants/           # Shared constants
│   │   └── models/              # Shared TypeScript models
│   └── package.json
├── assets/                       # Test assets
│   └── testFiles/               # Sample MP3 files for testing
├── Dockerfile                    # Production Docker image
├── Dockerfile.dev                # Development Docker image (hot-reload)
├── docker-compose.yml            # Production Docker Compose
├── docker-compose.dev.yml        # Development Docker Compose
├── package.json                  # Root workspace configuration
└── README.md

```

### Architecture Overview

- **Controllers**: Handle HTTP requests and responses, delegate business logic to services
- **Services**: Contain business logic and data processing
- **Routes**: Define API endpoints and map them to controllers
- **Middleware**: Configure Express middleware (CORS, body parsing, rate limiting, timeout, file upload)
- **Entry Point**: Initializes Express app, sets up middleware, mounts routes, starts server
- **Shared Workspace**: Common TypeScript models and constants shared between workspaces

## Running the API

### Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode (with hot-reloading):**
   ```bash
   npm run dev
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Run in production mode:**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the `api/` directory (you can copy from `api/.env.example`) to configure the following options:

- **PORT** (optional): Server port number. Default: `3000`
- **MAX_FILE_SIZE** (optional): Maximum file upload size in MB (megabytes). This value is converted to bytes internally. Default: `100` (100 MB)
- **REQUEST_TIMEOUT** (optional): Request timeout duration in seconds. Default: `60` (60 seconds)
- **RATE_LIMIT_ANALYZE** (optional): Rate limit for the analyze endpoint in requests per minute. Default: `100`
- **RATE_LIMIT_HEALTH** (optional): Rate limit for the health check endpoint in requests per minute. Default: `1000`
- **E2E_TEST_TIMEOUT** (optional): Timeout for E2E tests in seconds. This value is converted to milliseconds internally. Default: `30` (30 seconds)

Example `.env` file:
```env
PORT=3000
MAX_FILE_SIZE=100
REQUEST_TIMEOUT=60
RATE_LIMIT_ANALYZE=100
RATE_LIMIT_HEALTH=1000
E2E_TEST_TIMEOUT=30
```

### Docker Development (with Hot-Reloading)

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Run in detached mode:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

3. **View logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

4. **Stop the container:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Docker Production

1. **Build and run:**
   ```bash
   docker-compose up --build
   ```

2. **Run in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

## API Endpoints

All endpoints are prefixed with `/api`.

### Health Check

**GET** `/api/health`

Returns the health status of the API. This endpoint is rate-limited to 1000 requests per minute (configurable via `RATE_LIMIT_HEALTH` environment variable).

**Response:**
```json
{
  "status": "ok",
  "message": "MP3 Analyzer API is running"
}
```

**Rate Limiting:**
- Default: 1000 requests per minute
- Configurable via `RATE_LIMIT_HEALTH` environment variable
- Returns `429 Too Many Requests` when limit is exceeded

### API Information

**GET** `/api/`

Returns API information and available endpoints.

**Response:**
```json
{
  "message": "MP3 Analyzer API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "analyze": "/api/file-upload (POST)"
  }
}
```

### Analyze MP3 File

**POST** `/api/file-upload`

Analyzes an MP3 file and returns frame count. Only MPEG-1 Layer 3 (MP3) files are supported.

This endpoint includes:
- **Rate Limiting**: Default 100 requests per minute (configurable via `RATE_LIMIT_ANALYZE` environment variable)
- **Request Timeout**: Default 60 seconds (configurable via `REQUEST_TIMEOUT` environment variable)
- **File Validation**: Validates file type and size before processing

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with a `file` field containing the MP3 file

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/file-upload \
  -F "file=@path/to/your/file.mp3"
```

**Response (Success - 200):**
```json
{
  "frameCount": 6089
}
```

**Response (Error - 400):**
```json
{
  "status": "error",
  "error": "No file uploaded",
  "message": "Please upload an MP3 file using the \"file\" field in multipart/form-data"
}
```

```json
{
  "status": "error",
  "error": "INVALID_FILE_TYPE",
  "message": "Only MP3 files are allowed"
}
```

**Response (Error - 408):**
```json
{
  "status": "error",
  "error": "REQUEST_TIMEOUT",
  "message": "Request timeout"
}
```

**Response (Error - 429):**
```json
{
  "status": "error",
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests, please try again later"
}
```

**Response (Error - 500):**
```json
{
  "status": "error",
  "error": "ANALYSIS_ERROR",
  "message": "Error details"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (no file uploaded or invalid file type)
- `408` - Request Timeout (request exceeded timeout duration)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Testing

The project includes comprehensive test suites for both unit and end-to-end testing.

### Running Tests

All tests are run from the `api/` directory:

1. **Run all tests:**
   ```bash
   cd api
   npm test
   ```

2. **Run tests in watch mode:**
   ```bash
   cd api
   npm run test:watch
   ```

3. **Run tests with coverage report:**
   ```bash
   cd api
   npm run test:coverage
   ```

### Test Structure

- **Unit Tests**: Located in `api/src/tests/unit/`
  - Controller tests: `api/src/tests/unit/controllers/`
  - Service tests: `api/src/tests/unit/services/`

- **E2E Tests**: Located in `api/src/tests/e2e/`
  - Integration tests that test the full request/response cycle
  - Uses actual MP3 files from `assets/testFiles/`

### Sample Test Files

The project includes sample MP3 files for testing located in `assets/testFiles/`:

**Valid MP3 Files:**
- `valid_1.mp3` - Expected frame count: 6089
- `valid_2.mp3` - Expected frame count: 1610
- `valid_3.mp3` - Expected frame count: 2221
- `valid_4.mp3` - Expected frame count: 2065
- `valid_5.mp3` - Expected frame count: 5090

**Invalid Test File:**
- `invalid_1.mp4` - Used to test file type validation (should be rejected)

These files are used by the E2E test suite to verify the MP3 analysis functionality works correctly with various file sizes and configurations.

### Test Configuration

E2E tests can be configured via environment variables in the `.env` file:
- `E2E_TEST_TIMEOUT`: Timeout in seconds for E2E tests (default: 30). This value is converted to milliseconds internally.

## Testing with Postman

The project includes a Postman collection and environment file for easy API testing.

### Setup

1. **Import the Collection:**
   - Open Postman
   - Click "Import" button
   - Navigate to `api/postman/MP3-Analyzer-API.postman_collection`
   - Click "Import" to add the collection

2. **Import the Environment:**
   - In Postman, click "Import" again
   - Navigate to `api/postman/local.postman_environment.json`
   - Click "Import" to add the environment

3. **Select the Environment:**
   - In the top-right corner of Postman, select "local" from the environment dropdown
   - This will use the `baseUrl` variable set to `http://localhost:3000/api`

### Environment Variables

The `local` environment includes the following variables:

- **baseUrl**: `http://localhost:3000/api` - Base URL for all API requests

You can modify this variable or create additional environments (e.g., `production`, `staging`) with different base URLs.

### Available Requests

The collection includes the following requests:

- **Analyze MP3 [Valid File]** - POST request to `/file-upload` endpoint
  - Upload an MP3 file using the "file" field in the form-data body
  - Select a file from your local system or use the sample files from `assets/testFiles/` to test the upload functionality

### Using the Collection

1. Ensure the API is running (locally or in Docker)
2. Select the "local" environment in Postman
3. Open the "MP3 Analyzer API" collection
4. Navigate to "Analyze MP3s" folder
5. Select "Analyze MP3 [Valid File]" request
6. Click "Select Files" next to the "file" field in the Body tab
7. Choose an MP3 file from your system (or use `assets/testFiles/valid_1.mp3` for testing)
8. Click "Send" to test the endpoint

The collection uses the `{{baseUrl}}` variable, so all requests will automatically use the correct base URL based on your selected environment.

## Code Quality & Development Tools

The project includes several tools to ensure code quality and consistency:

### TypeScript Type Checking

Run TypeScript type checking without emitting files:

```bash
cd api
npm run type-check
```

### Linting (ESLint)

The project uses ESLint with TypeScript support for code quality and consistency.

1. **Run linter:**
   ```bash
   cd api
   npm run lint
   ```

2. **Fix linting issues automatically:**
   ```bash
   cd api
   npm run lint:fix
   ```

ESLint is configured with:
- TypeScript-specific rules
- Recommended ESLint rules
- Prettier integration (prevents conflicts between ESLint and Prettier)

### Code Formatting (Prettier)

The project uses Prettier for consistent code formatting.

1. **Format code:**
   ```bash
   cd api
   npm run format
   ```

2. **Check formatting (without modifying files):**
   ```bash
   cd api
   npm run format:check
   ```

Prettier configuration:
- Single quotes
- Semicolons enabled
- 100 character line width
- 2 space indentation
- LF line endings

### Pre-commit Recommendations

It's recommended to run these commands before committing:
```bash
cd api
npm run type-check
npm run lint
npm run format:check
npm test
```

## Future Scalability Considerations

### Worker Threads for Parallel Processing

For future scalability improvements, the next step would be to implement **worker threads** to allow for non-blocking parallel processing of MP3 files. This would enable the API to:

- Process multiple MP3 files concurrently without blocking the main event loop
- Better utilize multi-core systems for CPU-intensive MP3 parsing operations
- Improve overall throughput when handling multiple simultaneous file uploads
- Maintain responsiveness even under high load

However, for the deadline of this assessment, implementing worker threads ended up being out of scope. The current implementation provides a solid foundation that can be extended with worker threads in future iterations.

---

## License

MIT

## Author

Adam Phillips
