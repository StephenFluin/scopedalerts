# ScopedAlerts

A modern Angular application for managing product notifications with Firebase backend integration.

## Features

- � Angular 21 with Server-Side Rendering (SSR)
- � Angular Material Design with dark mode support
- 🔥 Firebase Realtime Database integration
- 🔐 Firebase Authentication with Google OAuth
- 📱 Responsive design for all devices
- 🔔 Product-specific notification filtering
- 📊 Admin panel for user and notification management
- 📡 RSS feed generation for external integration
- ⚡ Signals-based state management
- 🛡️ TypeScript with strict type checking

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (for backend functionality)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:4200`.

## Firebase Setup

The application is ready for Firebase integration. To complete the setup:

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable the following services:
   - **Realtime Database**
   - **Authentication** (with Google provider)

### 2. Configure Firebase

1. Get your Firebase configuration from Project Settings
2. Update `src/app/firebase.config.ts` with your actual config values
3. Uncomment Firebase providers in `src/app/app.config.ts`

### 3. Install Firebase Packages

The packages are already added to package.json. Run:

```bash
npm install
```

### 4. Database Rules

Set up these security rules in Firebase Realtime Database:

```json
{
  "rules": {
    "notices": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "products": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "admins": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

### 5. Enable Firebase Code

After completing steps 1-4, uncomment the Firebase-related code in:

- `src/app/app.config.ts` - Firebase providers
- `src/app/services/*.service.ts` - Firebase operations
- `src/server.ts` - Server-side Firebase integration

## Application Structure

### Services

- **UserService**: Authentication and user management
- **NotificationService**: CRUD operations for notices
- **ProductService**: Product management
- **AdminService**: Admin user management
- **ThemeService**: Dark/light mode with SSR support

### Components

- **Home**: Notification listing with filtering and infinite scroll
- **ViewNotification**: Detailed notification display
- **EditNotification**: Create/edit notifications (admin only)
- **Admin**: User and notification management panel
- **Navigation**: Header with theme toggle and user menu
- **Footer**: Application footer

### Models

- **Notice**: Notification data structure
- **Product**: Product information
- **User**: User profile data
- **Admin**: Admin user data

## API Endpoints

### RSS Feed

Access product-specific RSS feeds:

```
GET /rss?products=product1,product2
```

Example:

```
GET /rss?products=portal,eolds
```

## Development

### Build for Production

```bash
npm run build
```

### Serve SSR Build

```bash
npm run serve:ssr:scopedalerts
```

## Mock Data

The application includes comprehensive mock data for development:

- Sample notifications for different products
- Mock users and admin accounts
- Product catalog with realistic data

When Firebase is not configured, the app gracefully falls back to mock data.

## Architecture Highlights

- **Standalone Components**: No NgModules required
- **Signals**: Modern reactive state management
- **SSR-Safe**: Proper platform detection for server rendering
- **Type-Safe**: Comprehensive TypeScript interfaces
- **Responsive**: Mobile-first design with Angular Material
- **Accessible**: WCAG compliance with Material Design
- **Performance**: Lazy loading and OnPush change detection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
