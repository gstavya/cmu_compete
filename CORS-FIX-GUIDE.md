# Fixing CORS Issues with Firebase Storage

## The Problem

You're encountering CORS (Cross-Origin Resource Sharing) errors when uploading videos to Firebase Storage. This happens because:

1. Firebase Storage security rules may be too restrictive
2. The upload method might not be handling CORS properly
3. File names with special characters can cause issues

## Solutions Applied

### 1. Updated Upload Method

- Changed from `uploadBytes` to `uploadBytesResumable` for better CORS handling
- Added real progress tracking instead of simulated progress
- Added filename sanitization to remove special characters
- Improved error handling with specific error messages

### 2. Firebase Storage Rules Configuration

You need to update your Firebase Storage rules in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `cmu-compete`
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the **DEVELOPMENT RULES** from `firebase-storage-rules.txt`

**IMPORTANT**: Use the development rules (the first set) which are more permissive and will fix the "Missing or insufficient permissions" error.

### 3. Steps to Fix CORS Issue

#### Step 1: Update Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload videos
    match /videos/{allPaths=**} {
      allow read, write: if request.auth != null;
    }

    // Allow public read access to videos (for the feed)
    match /videos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

#### Step 2: For Development (Temporary)

If you're still having issues during development, you can use more permissive rules temporarily:

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

**⚠️ WARNING: Never use the permissive rules in production!**

#### Step 3: Verify Authentication

Make sure your users are properly authenticated before uploading. The app should show the login screen if not authenticated.

## Fixing "Missing or insufficient permissions" Error

This error occurs when Firebase Storage rules are too restrictive. Here's how to fix it:

### Quick Fix (Development):

1. Go to Firebase Console > Storage > Rules
2. Replace all existing rules with:

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

3. Click "Publish"
4. Try uploading again

### Why This Happens:

- Your current rules require authentication (`request.auth != null`)
- The authentication might not be properly set up or working
- The rules might be checking for specific user permissions

## Additional Troubleshooting

### If CORS issues persist:

1. **Check Firebase Project Settings**:

   - Ensure your domain is added to authorized domains
   - Go to Authentication > Settings > Authorized domains
   - Add `localhost:3000` for development

2. **Clear Browser Cache**:

   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache and cookies

3. **Check Network Tab**:

   - Open browser DevTools > Network tab
   - Look for failed requests and check their status codes
   - Verify the request headers include proper authentication

4. **File Size Limits**:
   - Firebase Storage has file size limits
   - Consider compressing videos before upload
   - Add file size validation in the upload component

## Testing the Fix

1. Update the Firebase Storage rules
2. Restart your development server
3. Try uploading a small video file first
4. Check the browser console for any remaining errors
5. Verify the video appears in the feed after successful upload

## Production Considerations

- Use proper security rules that require authentication
- Implement file size limits
- Add video format validation
- Consider using Firebase Functions for additional security
- Implement proper error handling and user feedback
