# Infave (Click Tracker)

## Overview

A Progressive Web Application (PWA) for tracking and managing labeled clicks across groups and cards. Users can create groups, add cards, and track click counts or entries (in "Database" mode).

## Tech Stack

- **Frontend:** Vanilla HTML5/CSS3/JavaScript (ES Modules, no build step)
- **Backend/BaaS:** Firebase (Authentication via Google Sign-In, Firestore for data)
- **Icons:** Font Awesome (CDN)
- **PWA:** Service Worker + Web App Manifest

## Project Structure

```
.
├── index.html          # Main entry point (Dashboard/Groups view)
├── group.html          # Group detail view
├── app.js              # Main logic for index.html
├── group.js            # Logic for group.html
├── styles.css          # Global stylesheet
├── firebase-config.js  # Firebase credentials
├── manifest.json       # PWA manifest
├── service-worker.js   # PWA service worker
├── firebase.json       # Firebase Hosting config
└── netlify.toml        # Netlify deployment config
```

## Running the App

The app is served as static files using `serve`:

```
npx serve . -p 5000 -s
```

This is configured as a workflow on port 5000.

## Deployment

Configured as a static site (no build step needed). The public directory is the project root (`.`).

## Firebase Configuration

Firebase credentials are in `firebase-config.js`. The app uses:
- Google Authentication
- Firestore for data persistence

## Notes

- No build step required — pure static files served directly
- All Firebase SDK loaded via CDN in JS modules
- SPA-style routing: all routes redirect to `index.html`
