import express, { Express } from 'express';
import cors from 'cors';

export function setupMiddleware(app: Express): void {
  // CORS middleware - allow all origins for development and API clients
  app.use(
    cors({
      origin: true, // Allow all origins
      credentials: true, // Allow credentials
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}
