Place the new app icon files provided by the designer into the `offer/assets/` folder using the exact filenames below.

Required files and recommended sizes (replace these with your designer-exported images):

- `topdelz-icon.png` — base app icon (1024×1024 recommended for iOS)
- `topdelz-foreground.png` — Android adaptive icon foreground (foreground layer, transparent background, 432×432 or SVG)
- `topdelz-background.png` — Android adaptive icon background (1080×1080 or solid color PNG)
- `topdelz-monochrome.png` — Android monochrome icon (optional)
- `topdelz-favicon.png` — web favicon (192×192 or 32×32)

Steps to replace the icon locally:

1. Save your provided image(s) into `offer/assets/` with the filenames above.
2. If you only have a single image (the one you uploaded), copy it to `topdelz-icon.png` and also create scaled/trimmed versions for the Android adaptive foreground/background as needed.
3. Confirm `offer/app.json` references the correct filenames (already updated).
4. For iOS/Android builds with Expo/EAS, run:

   npm install
   npx expo prebuild   # if you're using the prebuild/native workflow
   eas build --platform ios
   eas build --platform android

   Or for local dev with Expo Go:

   npx expo start

Notes:
- Android adaptive icons require a separate foreground image with transparency and a background image (color or image).
- For App Store, use a 1024×1024 PNG.
- If you want, I can generate suggested overlay text for screenshot images or provide a short promo image layout.
