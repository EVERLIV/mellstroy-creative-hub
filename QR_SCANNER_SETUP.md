# QR Code Scanner Setup for Mobile

The QR code scanner feature has been added to allow trainers to verify student attendance by scanning QR codes using the device camera.

## Features Added

1. **Automatic QR Code Scanning** - Trainers can now scan student QR codes with the camera
2. **Manual Code Entry** - Fallback option to enter the 6-digit code manually
3. **Real-time Verification** - Instant verification when QR code is scanned

## For Web/Desktop Testing

The QR scanner will not work in the web browser preview. You'll see camera permission errors, which is expected. The manual code entry will still work for testing in the browser.

## For Mobile App Testing (iOS & Android)

To test the QR scanner on actual mobile devices, you need to sync the Capacitor native projects:

### Step 1: Export to GitHub
1. Click "Export to GitHub" button in Lovable
2. Git pull the project to your local machine

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Add Camera Permissions

#### For Android (android/app/src/main/AndroidManifest.xml):
Add these permissions inside the `<manifest>` tag:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus" />
```

#### For iOS (ios/App/App/Info.plist):
Add this key-value pair inside the `<dict>` tag:
```xml
<key>NSCameraUsageDescription</key>
<string>RhinoFit needs camera access to scan student verification QR codes for attendance tracking.</string>
```

### Step 4: Sync Capacitor
```bash
npx cap sync
```

### Step 5: Build and Run
```bash
# Build the web app first
npm run build

# For Android
npx cap run android

# For iOS (requires Mac with Xcode)
npx cap run ios
```

## How It Works

### For Students:
1. Book a class
2. Receive a unique 6-digit verification code and QR code
3. Show QR code or tell code to trainer at class time

### For Trainers:
1. Go to "My Schedule" (Bookings page)
2. Click "Verify" button on an upcoming booking
3. Choose:
   - **Scan QR Code** - Opens camera to scan student's QR code
   - **Manual Entry** - Enter the 6-digit code manually
4. Attendance is automatically marked as verified

## Troubleshooting

**Camera Not Working?**
- Make sure you've added the camera permissions to AndroidManifest.xml (Android) or Info.plist (iOS)
- Run `npx cap sync` after adding permissions
- Rebuild and reinstall the app

**Permission Denied?**
- Check if camera permissions are granted in phone settings
- Go to Settings → Apps → RhinoFit → Permissions → Enable Camera

**QR Code Not Scanning?**
- Ensure good lighting
- Hold the phone steady
- QR code should be clearly visible and in focus
- Use manual entry as backup

## Testing Without Mobile Device

For development testing in the browser, use the manual code entry method:
1. Create a booking (generates a verification code)
2. Copy the 6-digit code from the booking confirmation
3. As a trainer, click "Verify" and enter the code manually

## Additional Resources

- [Capacitor Barcode Scanner Plugin Documentation](https://github.com/capacitor-community/barcode-scanner)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [RhinoFit Mobile Setup Guide](./MOBILE_SETUP.md)
