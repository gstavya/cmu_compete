# Firebase Storage CORS Fix - Step by Step

## The Problem

You're getting CORS errors when trying to access Firebase Storage, even though authentication is working perfectly. This is a Firebase Storage configuration issue.

## Solution Steps

### Step 1: Update Firebase Storage Rules

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `cmu-compete`
3. **Navigate to Storage** in the left sidebar
4. **Click on the "Rules" tab**
5. **Replace ALL existing rules** with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

6. **Click "Publish"** to save the changes

### Step 2: Check Storage Bucket Configuration

1. **In Firebase Console**, go to **Storage** > **Files**
2. **Check if the bucket exists** and is accessible
3. **If you see any errors**, the bucket might not be properly initialized

### Step 3: Initialize Storage Bucket (if needed)

If the storage bucket doesn't exist or has issues:

1. **In Firebase Console**, go to **Storage**
2. **Click "Get started"** if you see a setup screen
3. **Choose "Start in test mode"** (this will allow all reads/writes)
4. **Select a location** (choose one close to you, like `us-central1`)
5. **Click "Done"**

### Step 4: Verify Storage Bucket URL

Make sure your Firebase configuration matches your actual storage bucket:

1. **In Firebase Console**, go to **Project Settings** (gear icon)
2. **Scroll down to "Your apps"**
3. **Click on your web app**
4. **Check the `storageBucket` value** in the config
5. **It should match**: `cmu-compete.firebasestorage.app`

### Step 5: Test the Fix

1. **Refresh your app**
2. **Click the "Test Storage" button**
3. **Check the browser console** for success/error messages
4. **Try uploading a video**

## Alternative: Temporary Development Fix

If the above doesn't work, you can temporarily use a more permissive configuration:

### Option A: Use Firebase Emulator (Recommended for Development)

1. **Install Firebase CLI**: `npm install -g firebase-tools`
2. **Login**: `firebase login`
3. **Initialize emulator**: `firebase init emulators`
4. **Start emulators**: `firebase emulators:start`

### Option B: Use a Different Storage Service

Temporarily use a different storage service like:

- Cloudinary
- AWS S3
- Google Cloud Storage

## Debugging Steps

### Check Browser Network Tab

1. **Open DevTools** > **Network tab**
2. **Try the "Test Storage" button**
3. **Look for failed requests** to `firebasestorage.googleapis.com`
4. **Check the response headers** for CORS-related headers

### Check Firebase Console Logs

1. **Go to Firebase Console** > **Functions** > **Logs**
2. **Look for any error messages** related to storage

### Verify Project Permissions

1. **Make sure you're the owner** of the Firebase project
2. **Check that Storage is enabled** in your Firebase project
3. **Verify billing is set up** (Storage requires a billing account)

## Common Issues and Solutions

### Issue: "Storage bucket not found"

**Solution**: Initialize the storage bucket in Firebase Console

### Issue: "Permission denied"

**Solution**: Update the storage rules to be more permissive

### Issue: "CORS policy error"

**Solution**: This usually means the storage rules are too restrictive

### Issue: "Project not found"

**Solution**: Check that you're using the correct project ID in your Firebase config

## Final Verification

After following these steps, you should see:

- ✅ "Firebase Storage connection successful" in console
- ✅ No CORS errors in browser
- ✅ Video uploads working
- ✅ Videos appearing in the feed

## If Still Not Working

1. **Double-check the storage rules** are exactly as shown above
2. **Verify the project ID** matches in both console and code
3. **Try creating a new Firebase project** and updating the config
4. **Contact Firebase support** if the issue persists

The key is that the storage rules must allow read/write access for the CORS preflight requests to succeed.
