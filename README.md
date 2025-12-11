# MP3 Analyzer API

A RESTful API service built with Node.js, Express, and TypeScript that accepts MP3 files and analyzes them to extract metadata, including frame count and other audio information.

## Description

The MP3 Analyzer API provides endpoints for analyzing MP3 audio files. The API accepts MP3 file uploads and returns detailed information about the audio file, including the number of frames, which is essential for understanding the structure and duration of MP3 files.

## Current Status

✅ **Completed:**
- Project structure and architecture setup
- Express.js server with TypeScript
- Middleware configuration (CORS, JSON parsing)
- Route structure and controllers
- Health check and API info endpoints
- Docker configuration (production and development)
- Development hot-reloading support

🚧 **In Progress:**
- MP3 file upload handling
- MP3 frame counting implementation
- File parsing and analysis logic

## End Goal

The goal is to create a fully functional MP3 analyzer API that can:
- Accept MP3 file uploads via HTTP POST requests
- Parse and analyze MP3 file structure
- Return accurate frame count and other metadata
- Handle various MP3 formats and bitrates
- Provide error handling for invalid or corrupted files
- Support batch processing capabilities

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
│   │   ├── middleware.ts        # Express middleware configuration
│   │   └── index.ts             # Application entry point
│   ├── package.json
│   └── tsconfig.json
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
- **Middleware**: Configure Express middleware (CORS, body parsing, etc.)
- **Entry Point**: Initializes Express app, sets up middleware, mounts routes, starts server

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

Returns the health status of the API.

**Response:**
```json
{
  "status": "ok",
  "message": "MP3 Analyzer API is running"
}
```

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
    "analyze": "/api/analyze (POST)"
  }
}
```

### Analyze MP3 File

**POST** `/api/analyze`

Analyzes an MP3 file and returns frame count and other metadata.

**Request:**
- Content-Type: `multipart/form-data` or `application/json`
- Body: MP3 file (implementation in progress)

**Response (Success):**
```json
{
  "message": "MP3 analysis completed",
  "frames": 1234
}
```

**Response (Error):**
```json
{
  "error": "Failed to analyze MP3 file",
  "message": "Error details"
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

## License

MIT

## Author

Adam Phillips
