import express, { Express } from 'express';
import cors from 'cors';

export function setupMiddleware(app: Express): void {
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}
