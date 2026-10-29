# Fuel Tracker

My little Expo app to keep track of my car's fuel and maintenance.

- **Fuel log** – odometer km, liters, total price (TL) and date for every fill-up. From the second
  entry on it shows how far I drove, L/100 km and cost per km since the previous fill-up.
- **Statistics** – average km per month, fuel and spend per month, average cost per km and L/100 km,
  plus a month-by-month breakdown.
- **Maintenance** – log oil and coolant changes/checks. Intervals are editable (defaults: oil every
  10,000 km or 12 months, coolant every 10,000 km or 6 months) and a local notification reminds me
  when one is due.

Everything is stored on the phone (AsyncStorage), nothing leaves the device.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Checks

```bash
npx expo lint
npx tsc --noEmit
```
