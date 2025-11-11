# RhinoFit - Native Mobile App Setup Guide

## 🎉 Your app is now configured for native mobile development with Capacitor!

## Quick Preview

To see how your app looks on mobile/tablet devices right now in Lovable:
- Click the **phone/tablet/desktop icon** above the preview window
- This lets you preview different device sizes instantly

## Next Steps to Run on Real Devices

### Prerequisites
- **For iOS**: Mac computer with Xcode installed
- **For Android**: Android Studio installed
- Node.js and npm installed on your computer

### Step-by-Step Setup

#### 1. Export to GitHub
1. Click the **"Export to GitHub"** button in Lovable (top right)
2. Clone your repository to your local machine:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>
   ```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Add Mobile Platforms

For iOS (Mac only):
```bash
npx cap add ios
npx cap update ios
```

For Android:
```bash
npx cap add android
npx cap update android
```

#### 4. Build Your Project
```bash
npm run build
```

#### 5. Sync Changes
After building, sync the web assets to native platforms:
```bash
npx cap sync
```

**Important**: Run `npx cap sync` every time you pull new changes from GitHub!

#### 6. Run on Device/Emulator

For iOS:
```bash
npx cap run ios
```
This will open Xcode. You can then:
- Select a simulator or connected device
- Click the Play button to run

For Android:
```bash
npx cap run android
```
This will open Android Studio. You can then:
- Select an emulator or connected device
- Click Run

## 🔄 Development Workflow

While developing, your app connects to the live preview URL, so you can:
1. Make changes in Lovable
2. See updates immediately on your mobile device/emulator
3. No need to rebuild constantly!

## 📱 Current Configuration

- **App Name**: RhinoFit
- **App ID**: app.lovable.b08e9e463b7043d5abd6467959332f8b
- **Live Preview URL**: Connected to Lovable sandbox for hot-reload

## 🎨 Features Already Optimized for Mobile

✅ Responsive authentication pages
✅ Touch-friendly buttons and inputs
✅ Mobile-optimized viewport settings
✅ Safe area support for notched devices
✅ Proper keyboard handling

## 📚 Learn More

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Setup Guide](https://capacitorjs.com/docs/ios)
- [Android Setup Guide](https://capacitorjs.com/docs/android)

## 🆘 Need Help?

If you encounter issues:
1. Make sure all prerequisites are installed
2. Check that you ran `npm install` and `npm run build`
3. Try running `npx cap sync` again
4. For iOS: Ensure Xcode Command Line Tools are installed
5. For Android: Ensure Android SDK is properly configured

Happy building! 🚀
