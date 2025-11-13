/**
 * =================================================================
 *                          ASSET CONFIGURATION
 * =================================================================
 *
 * This file centralizes URLs for images and other assets used in the app,
 * making them easy to update from Firebase Storage.
 *
 * HOW TO UPDATE:
 * 1. Go to your Firebase Console -> Storage.
 * 2. Upload your background image and logo file.
 * 3. Click on the uploaded file to view its details.
 * 4. Copy the "Download URL" from the file details pane.
 *    (It should start with https://firebasestorage.googleapis.com/...)
 * 5. Paste the URL here, replacing the placeholder value for the
 *    corresponding asset.
 */

// URL for the background image on the authentication screen.
// A correct URL looks like this:
// https://firebasestorage.googleapis.com/v0/b/your-project-id.appspot.com/o/BG_MAIN.png?alt=media&token=some-long-string
export const AUTH_BACKGROUND_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0442590863.firebasestorage.app/o/BG_MAIN.png?alt=media&token=f41567dd-511e-49a1-81a8-17a991de7beb';


// URL for the logo on the authentication screen. (Should be an SVG or PNG)
//
// =======================================================================
//   IMPORTANT: The `gs://` URL you provided is not a web-accessible URL.
//   To display your logo, you MUST provide the full "Download URL"
//   from Firebase Storage.
// =======================================================================
export const AUTH_LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0442590863.firebasestorage.app/o/logo_main.PNG?alt=media&token=1437edeb-e745-4f0a-afc0-6411304d302b'; // <-- PASTE YOUR REAL FIREBASE DOWNLOAD URL HERE
