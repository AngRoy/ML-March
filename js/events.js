// Events Module - Handles event listeners and interactions

import { 
    handleGoogleSignIn, 
    handleSignOut, 
    handleProfileCompletion, 
    handleProfileUpdate, 
    uploadProfilePicture, 
    currentUser 
} from './auth.js';

import { 
    showToast, 
    showDashboard, 
    showWebsiteContent, 
    switchDashboardTab,
    loadScheduleSessions 
} from './ui.js';

// Initialize event listeners
function initEvents() {
    console.log("Initializing event listeners");
    
    // Setup modal interactions
    setupModals();
    
    // Setup navigation
    setupNavigation();
    
    // Setup authentication
    setupAuthEvents();
    
    // Setup profile
    setupProfileEvents();
    
    // Setup dashboard
    setupDashboardEvents();
    
    // Load sessions for schedule section
    loadScheduleSessions();
    
    // Setup theme toggle
    setupThemeToggle();
}

// Setup modal interactions
function setupModals() {
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Register buttons
    document.getElementById('register-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-modal').classList.add('active');
    });
    
    document.getElementById('cta-register-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-modal').classList.add('active');
    });
    
    // Login button
    document.getElementById('login-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-modal').classList.add('active');
    });
}

// Setup navigation
function setupNavigation() {
    // Mobile navigation toggle
    const burger = document.querySelector('.burger');
    const navLinks = document.querySelector('.nav-links');
    
    burger?.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');
        burger.classList.toggle('toggle');
    });
    
    // Nav links smooth scroll
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Close mobile nav if open
            if (navLinks.classList.contains('nav-active')) {
                navLinks.classList.remove('nav-active');
                burger.classList.remove('toggle');
            }
            
            // Get the target section
            const targetId = link.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 70, // Adjust for header height
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // User menu dropdown
    const userIcon = document.getElementById('user-icon');
    const userDropdown = document.getElementById('user-dropdown');
    
    userIcon?.addEventListener('click', () => {
        userDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking elsewhere
    window.addEventListener('click', (e) => {
        if (userDropdown && userDropdown.classList.contains('show') && 
            !e.target.matches('#user-icon') && 
            !e.target.closest('#user-icon')) {
            userDropdown.classList.remove('show');
        }
    });
    
    // Dashboard link
    document.getElementById('dashboard-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
    });
    
    // Profile link
    document.getElementById('profile-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
        switchDashboardTab('profile');
    });
    
    // Sessions link
    document.getElementById('sessions-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
        switchDashboardTab('sessions');
    });
}

// Setup authentication events
function setupAuthEvents() {
    // Google sign-in buttons
    document.getElementById('google-login-btn')?.addEventListener('click', async () => {
        try {
            await handleGoogleSignIn(true); // true = redirect to dashboard after login
        } catch (error) {
            console.error("Google login error handled in auth module");
        }
    });
    
    document.getElementById('google-register-btn')?.addEventListener('click', async () => {
        try {
            await handleGoogleSignIn(true);
        } catch (error) {
            console.error("Google registration error handled in auth module");
        }
    });
    
    // Logout buttons
    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await handleSignOut();
        } catch (error) {
            console.error("Logout error handled in auth module");
        }
    });
    
    document.getElementById('dashboard-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await handleSignOut();
        } catch (error) {
            console.error("Dashboard logout error handled in auth module");
        }
    });
}

// Setup profile events
function setupProfileEvents() {
    // Profile completion form
    document.getElementById('profile-completion-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phone = document.getElementById('profile-phone').value;
        const institution = document.getElementById('profile-institution').value;
        const education = document.getElementById('profile-education').value;
        const experience = document.getElementById('profile-experience').value;
        
        // Get selected interests
        const interestCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
        const interests = Array.from(interestCheckboxes).map(cb => cb.value).join(',');
        
        try {
            await handleProfileCompletion({
                phone,
                institution,
                educationLevel: education,
                mlExperience: experience,
                interests
            });
        } catch (error) {
            console.error("Profile completion error handled in auth module");
        }
    });
    
    // Profile update form
    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const phone = document.getElementById('phone').value;
        const institution = document.getElementById('institution').value;
        const bio = document.getElementById('bio').value;
        
        try {
            await handleProfileUpdate({
                firstName,
                lastName,
                phone,
                institution,
                bio
            });
        } catch (error) {
            console.error("Profile update error handled in auth module");
        }
    });
    
    // Profile picture upload
    const avatarUpload = document.getElementById('avatar-upload');
    
    avatarUpload?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Invalid File', 'Please upload an image file.');
            return;
        }
        
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('error', 'File Too Large', 'Please upload an image smaller than 2MB.');
            return;
        }
        
        try {
            if (!currentUser) {
                throw new Error('No user logged in');
            }
            
            // Show loading state
            const avatarPreview = document.getElementById('avatar-preview');
            avatarPreview.innerHTML = '<div class="spinner"></div>';
            
            // Upload profile picture
            const downloadURL = await uploadProfilePicture(currentUser.uid, file);
            
            if (downloadURL) {
                // Update avatar preview
                avatarPreview.innerHTML = `<img src="${downloadURL}" alt="Profile">`;
                
                // Also update user icon in navbar
                const userIcon = document.getElementById('user-icon');
                if (userIcon) {
                    userIcon.innerHTML = `<img src="${downloadURL}" alt="Profile">`;
                }
                
                // Update sidebar profile image
                const sidebarProfileImage = document.getElementById('sidebar-profile-image');
                if (sidebarProfileImage) {
                    sidebarProfileImage.innerHTML = `<img src="${downloadURL}" alt="Profile">`;
                }
                
                showToast('success', 'Success', 'Profile picture updated successfully!');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showToast('error', 'Upload Failed', error.message || 'Failed to upload profile picture.');
            
            // Reset avatar preview
            const avatarPreview = document.getElementById('avatar-preview');
            const avatarInitials = document.getElementById('avatar-initials');
            if (avatarPreview && avatarInitials) {
                avatarPreview.innerHTML = '';
                avatarPreview.appendChild(avatarInitials);
            }
        }
    });
}

// Setup dashboard events
function setupDashboardEvents() {
    // Dashboard tabs
    document.querySelectorAll('.dashboard-nav a, .sidebar-nav a').forEach(tabLink => {
        if (tabLink.getAttribute('data-tab')) {
            tabLink.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tabLink.getAttribute('data-tab');
                switchDashboardTab(tabId);
            });
        }
    });
    
    // Back to website buttons
    document.getElementById('back-to-home')?.addEventListener('click', (e) => {
        e.preventDefault();
        showWebsiteContent();
    });
    
    document.getElementById('back-to-home-sidebar')?.addEventListener('click', (e) => {
        e.preventDefault();
        showWebsiteContent();
    });
}

// Setup theme toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-icon');
    
    themeToggle?.addEventListener('click', () => {
        const html = document.documentElement;
        
        if (html.getAttribute('data-theme') === 'dark') {
            html.setAttribute('data-theme', 'light');
            themeToggle.classList.remove('fa-sun');
            themeToggle.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            themeToggle.classList.remove('fa-moon');
            themeToggle.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    });
    
    // Initialize theme based on local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle?.classList.remove('fa-moon');
        themeToggle?.classList.add('fa-sun');
    }
}

// Event delegation for gallery/slider buttons
document.addEventListener('click', (e) => {
    // Prev button click
    if (e.target.matches('.prev-btn') || e.target.closest('.prev-btn')) {
        const slider = document.querySelector('.slider');
        if (slider) {
            slider.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        }
    }
    
    // Next button click
    if (e.target.matches('.next-btn') || e.target.closest('.next-btn')) {
        const slider = document.querySelector('.slider');
        if (slider) {
            slider.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        }
    }
});

// Export the init function
export { initEvents };