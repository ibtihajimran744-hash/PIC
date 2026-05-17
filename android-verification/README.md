# Android Developer Verification

This folder contains the verification token and instructions for submitting your app to the Google Play Console for developer verification.

## Verification Token
**Token:** `CMXPKWSQOYQ5GAAAAAAAAAAAAA`

## How to use this for APK/AAB Signing

If you are building your APK/AAB natively and need to include this in the signing block (as per the Google Security Sample):

1. **Gradle Integration:**
   You can add this to your `build.gradle` (app level) if you are using a tool that supports custom signature blocks, or simply include the token as a string resource if requested by the Play Console UI.

2. **Strings Resource (Recommended for most cases):**
   Add the following to your `res/values/strings.xml`:
   ```xml
   <string name="android_developer_verification">CMXPKWSQOYQ5GAAAAAAAAAAAAA</string>
   ```

3. **Metadata (Alternative):**
   Add this to your `AndroidManifest.xml` inside the `<application>` tag:
   ```xml
   <meta-data android:name="com.android.vending.developer_verification" 
              android:value="CMXPKWSQOYQ5GAAAAAAAAAAAAA" />
   ```

## Reference
Example Repository: [android/security-samples](https://github.com/android/security-samples/tree/main/AndroidDeveloperVerificationAPKSigningExample)
