# Dee's Joy Retail Management System (DJRMS)

[![Latest Release](https://img.shields.io/github/v/release/Mayami65/FasTo-RMS?label=release)](https://github.com/Mayami65/FasTo-RMS/releases/tag/v1.0.1)

An offline-first desktop application for managing retail operations, built with Electron, React, and SQLite.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run in Development Mode**
   ```bash
   npm start
   ```
   This will launch the Electron window with Vite hot-reloading.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Electron (Main Process)
- **Database**: SQLite (better-sqlite3)
- **State Management**: React Query + Context

## Project Structure

- `electron/` - Main Process & Preload scripts
- `src/` - React Renderer code
- `dist/` - Production build output

## Database
The database (`app.db` or `dev.db`) is managed by `better-sqlite3` in the Main process.
