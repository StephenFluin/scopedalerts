# ScopedAlerts

A modern Angular application for managing and displaying product notifications with Firebase backend integration.

## Features

- 🔔 **Notification Management**: Create, edit, and view product notifications
- 📡 **RSS Feed**: Customizable RSS feeds for different product combinations
- 🎯 **Product Filtering**: Filter notifications by specific products

## Technology Stack

- **Frontend**: Angular 21+ with standalone components
- **Backend**: Express.js with Firebase Realtime Database
- **Authentication**: Firebase Auth with Google OAuth
- **Styling**: Angular Material + Custom SCSS
- **State Management**: Angular Signals
- **Server**: Node.js with Angular SSR

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Realtime Database and Authentication enabled
- Google OAuth credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/StephenFluin/scopedalerts.git
   cd scopedalerts
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**

   - Update `src/app/config/firebase.config.ts` with your Firebase configuration
   - Deploy the database rules from `database.rules.json` to your Firebase project
   - Enable Google authentication in Firebase Console

### Development

1. **Start the development server**

   ```bash
   npm start
   ```

2. **View the application**
   Open [http://localhost:4200](http://localhost:4200) in your browser

### Building for Production

1. **Build the application**

   ```bash
   npm run build
   ```

## API Endpoints

### RSS Feed

- **GET** `/rss` - Get RSS feed for all notifications
- **GET** `/rss?products=product1,product2` - Get filtered RSS feed

## Firebase Database Structure

```
{
  "products": {
    "product-id": {
      "name": "Product Name",
      "description": "Product description",
      "slug": "product-slug"
    }
  },
  "notices": {
    "notice-id": {
      "title": "Notification Title",
      "description": "Detailed description",
      "datetime": "2024-11-07T02:00:00.000Z",
      "slug": "notification-slug",
      "affectedProducts": ["product-id-1", "product-id-2"]
    }
  },
  "admins": {
    "user-uid": {
      "email": "admin@example.com",
      "displayName": "Admin Name"
    }
  }
}
```

## Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Realtime Database
3. Enable Authentication with Google provider
4. Update `src/app/config/firebase.config.ts` with your project credentials
5. Deploy the database rules from `database.rules.json`

### Environment Variables

- `PORT` - Server port (default: 4000)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Created by [Stephen Fluin](https://github.com/StephenFluin)

---

For more information about Angular development, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
