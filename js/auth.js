// Authentication Module
import { 
    auth, 
    db, 
    storage, 
    googleProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from './firebase-config.js';

import { showToast, updateAuthUI } from './ui.js';

// Current user storage
let currentUser = null;

// Handle auth state change
async function handleAuthStateChange(user) {
    try {
        if (user) {
            // User is signed in
            currentUser = user;
            console.log("Auth state changed: User is signed in:", user);
            
            // Get user data from Firestore with timeout protection
            const userData = await Promise.race([
                checkUserProfile(user.uid),
                new Promise((resolve) => setTimeout(() => resolve(null), 5000))
            ]);
            
            // Update UI
            updateAuthUI(user, userData);
        } else {
            // User is signed out
            currentUser = null;
            console.log("Auth state changed: User is signed out");
            updateAuthUI(null, null);
        }
    } catch (error) {
        console.error("Error handling auth state change:", error);
        // Fallback to basic UI update
        updateAuthUI(user, null);
    }
}

// Sign in with Google - optimized with shorter timeout
async function handleGoogleSignIn(redirectToDashboard = true) {
    console.log("Starting Google sign-in process");
    
    // Show loading indicator
    const loginLoadingIndicator = document.getElementById('login-loading');
    const registerLoadingIndicator = document.getElementById('register-loading');
    if (loginLoadingIndicator) loginLoadingIndicator.style.display = 'block';
    if (registerLoadingIndicator) registerLoadingIndicator.style.display = 'block';
    
    // Set redirect flag if needed
    if (redirectToDashboard) {
        sessionStorage.setItem('loginRedirect', 'dashboard');
    }
    
    try {
        console.log("Attempting Google sign-in");
        
        // Use the signInWithPopup directly with a 15-second timeout
        const authResult = await Promise.race([
            signInWithPopup(auth, googleProvider),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Authentication timed out. Please try again.')), 15000)
            )
        ]);
        
        const user = authResult.user;
        console.log("Google sign-in successful:", user);
        
        // Check if user exists in Firestore
        let userData = await checkUserProfile(user.uid);
        
        if (!userData) {
            // Create new user profile
            console.log("Creating new user profile");
            const nameParts = user.displayName ? user.displayName.split(' ') : ['User', ''];
            const firstName = nameParts[0] || 'User';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            userData = {
                uid: user.uid,
                email: user.email,
                firstName: firstName,
                lastName: lastName,
                photoURL: user.photoURL,
                isProfileComplete: false
            };
            
            await createUserProfile(user.uid, userData);
        }
        
        // Close modals
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('register-modal').classList.remove('active');
        
        showToast('success', 'Success', 'You have successfully signed in with Google!');
        
        // Hide loading indicators
        if (loginLoadingIndicator) loginLoadingIndicator.style.display = 'none';
        if (registerLoadingIndicator) registerLoadingIndicator.style.display = 'none';
        
        return userData;
    } catch (error) {
        console.error('Google sign-in failed:', error);
        
        // Hide loading indicators
        if (loginLoadingIndicator) loginLoadingIndicator.style.display = 'none';
        if (registerLoadingIndicator) registerLoadingIndicator.style.display = 'none';
        
        let errorMessage = 'Failed to sign in with Google.';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Pop-up was blocked by the browser. Please enable pop-ups for this site.';
        } else if (error.message && error.message.includes('timeout')) {
            errorMessage = 'Authentication timed out. Please check your internet connection and try again.';
        } else if (error.code) {
            errorMessage = `Authentication error (${error.code}). Please try again.`;
        }
        
        showToast('error', 'Sign-in Failed', errorMessage);
        throw error;
    }
}

// Sign out
async function handleSignOut() {
    try {
        console.log("Signing out user");
        await signOut(auth);
        console.log("Sign out successful");
        showToast('success', 'Success', 'You have been signed out.');
        
        // Ensure we're showing the website content rather than dashboard
        showWebsiteContent();
        
        return true;
    } catch (error) {
        console.error('Error signing out:', error);
        showToast('error', 'Error', error.message || 'An error occurred while signing out.');
        throw error;
    }
}

// Check if user profile exists
async function checkUserProfile(uid) {
    try {
        console.log("Checking user profile for UID:", uid);
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            console.log("User profile found:", userDoc.data());
            return userDoc.data();
        } else {
            console.log("No user profile found");
            return null;
        }
    } catch (error) {
        console.error('Error checking user profile:', error);
        return null;
    }
}

// Create user profile
async function createUserProfile(uid, userData) {
    try {
        console.log("Creating user profile for UID:", uid, "with data:", userData);
        await setDoc(doc(db, 'users', uid), {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log("User profile created successfully");
        return true;
    } catch (error) {
        console.error('Error creating user profile:', error);
        return false;
    }
}

// Update user profile
async function updateUserProfile(uid, userData) {
    try {
        console.log("Updating user profile for UID:", uid, "with data:", userData);
        await updateDoc(doc(db, 'users', uid), {
            ...userData,
            updatedAt: serverTimestamp()
        });
        console.log("User profile updated successfully");
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return false;
    }
}

// Upload profile picture
async function uploadProfilePicture(uid, file) {
    try {
        console.log("Uploading profile picture for UID:", uid);
        // Create storage reference
        const storageRef = ref(storage, `profile-pictures/${uid}`);
        
        // Upload file
        await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Profile picture uploaded, URL:", downloadURL);
        
        // Update user profile with photo URL
        await updateDoc(doc(db, 'users', uid), {
            photoURL: downloadURL,
            updatedAt: serverTimestamp()
        });
        
        return downloadURL;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        return null;
    }
}

// Complete user profile
async function handleProfileCompletion(formData) {
    try {
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        // Get existing user data
        const userData = await checkUserProfile(currentUser.uid);
        
        // Update user profile
        const updatedUserData = {
            ...userData,
            ...formData,
            isProfileComplete: true
        };
        
        await updateUserProfile(currentUser.uid, updatedUserData);
        
        // Close profile completion modal
        document.getElementById('profile-completion-modal').classList.remove('active');
        
        showToast('success', 'Success', 'Profile completed successfully!');
        
        // Redirect to dashboard
        showDashboard();
        
        return updatedUserData;
    } catch (error) {
        console.error('Error completing profile:', error);
        showToast('error', 'Error', error.message);
        throw error;
    }
}

// Handle profile update
async function handleProfileUpdate(formData) {
    try {
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        // Update user profile
        await updateUserProfile(currentUser.uid, formData);
        
        showToast('success', 'Success', 'Profile updated successfully!');
        
        return formData;
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('error', 'Error', error.message);
        throw error;
    }
}

// Initialize authentication listeners
function initAuth() {
    // Set up auth state observer
    onAuthStateChanged(auth, handleAuthStateChange);
    
    // Return the current user for other modules to use
    return { currentUser };
}

// Export authentication functions
export { 
    initAuth,
    handleGoogleSignIn,
    handleSignOut,
    handleProfileCompletion,
    handleProfileUpdate,
    uploadProfilePicture,
    checkUserProfile,
    currentUser
};