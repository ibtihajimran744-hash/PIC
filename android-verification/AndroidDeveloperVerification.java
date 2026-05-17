/*
 * Copyright 2024 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.example.android.security.verification;

/**
 * Android Developer Verification Token
 *
 * Documentation: https://developer.android.com/google/play/integrity/developer-verification
 * Snippet provided: CMXPKWSQOYQ5GAAAAAAAAAAAAA
 */
public class AndroidDeveloperVerification {
    /**
     * The verification token provided by the Google Play Console.
     * This token should be included in your app's signature block or as a resource
     * depending on the specific verification method requested.
     */
    public static final String VERIFICATION_TOKEN = "CMXPKWSQOYQ5GAAAAAAAAAAAAA";
    
    /**
     * For APK Signature Scheme v2/v3 signing block verification:
     * Some tools require this to be injected into the signing process.
     * If you are using a custom build tool, ensure this value is associated 
     * with the ID 0x72657664 (which spells 'devr' in little-endian).
     */
    public static final int SIGNING_BLOCK_ID = 0x72657664;
}
