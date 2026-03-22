# TopDelz Mobile App

React Native (Expo) mobile app for the TopDelz deals platform.

## Tech Stack

- React Native 0.81 + Expo 54
- Axios (API calls)
- React Native Maps
- Expo Google Fonts (Nunito)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) app on your device, or an iOS/Android emulator

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and update the API URL
cp .env.example .env
```

Edit `.env` and set `EXPO_PUBLIC_API_BASE_URL` to point to your backend:
- iOS Simulator: `http://127.0.0.1:8000/api`
- Android Emulator: `http://10.0.2.2:8000/api`
- Physical device: `http://<your-LAN-IP>:8000/api`

### Running

```bash
# Start Expo dev server
npm start

# iOS
npm run ios

# Android
npm run android
```

## Project Structure

```
offer/
├── screens/       # App screens (Home, Login, OTP, Interests, etc.)
├── services/      # API client (Axios)
├── data/          # Static/mock data
├── assets/        # Images, fonts, icons
└── App.js         # Navigation entry point
```

## Related Repositories

- [offer-backend](https://github.com/mcaharan/topdelz-laravel_api) — Laravel API
- [offer-admin](https://github.com/mcaharan/topdelz_admin_frontend) — Admin dashboard
