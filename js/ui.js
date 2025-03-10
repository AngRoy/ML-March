// UI Module - Handles UI updates and visual elements
import { getUserSessions, registerForSession, unregisterFromSession, currentUser } from './auth.js';
import { sessionAPI } from './api-service.js';

// Show toast notification
function showToast(type, title, message) {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon i');
    const toastTitle = toast.querySelector('.toast-title');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set toast content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Set toast type
    toast.className = 'toast';
    toast.classList.add(type);
    
    // Set icon
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle';
    } else if (type === 'info') {
        toastIcon.className = 'fas fa-info-circle';
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Show dashboard
function showDashboard() {
    console.log("Showing dashboard");
    document.getElementById('website-content').style.display = 'none';
    document.getElementById('dashboard-page').classList.add('active');
    window.scrollTo(0, 0);
    
    // Update URL hash
    window.history.replaceState(null, null, '#dashboard');
    
    // Load user sessions when dashboard is shown
    loadUserSessionsTab();
}

// Show website content
function showWebsiteContent() {
    console.log("Showing website content");
    document.getElementById('website-content').style.display = 'block';
    document.getElementById('dashboard-page').classList.remove('active');
    
    // Update URL hash
    window.history.replaceState(null, null, '#');
}

// Switch between dashboard tabs
function switchDashboardTab(tabId) {
    // Get all tab content elements
    const tabContents = document.querySelectorAll('.tab-content');
    const tabLinks = document.querySelectorAll('.dashboard-nav a, .sidebar-nav a');
    
    // Hide all tab contents
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the selected tab content
    const selectedTabContent = document.getElementById(`${tabId}-content`);
    if (selectedTabContent) {
        selectedTabContent.classList.add('active');
    }
    
    // Update tab navigation links
    tabLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        }
    });
    
    // Load data specific to the selected tab
    if (tabId === 'sessions') {
        loadUserSessionsTab();
    }
}

// Update UI based on auth state
function updateAuthUI(user, userData) {
    const loggedInElements = document.querySelectorAll('.logged-in');
    const loggedOutElements = document.querySelectorAll('.logged-out');
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const profileInitials = document.getElementById('profile-initials');
    const sidebarProfileImage = document.getElementById('sidebar-profile-image');
    const avatarInitials = document.getElementById('avatar-initials');
    
    if (user) {
        // User is signed in
        console.log("Updating UI for signed-in user");
        loggedInElements.forEach(el => el.style.display = 'block');
        loggedOutElements.forEach(el => el.style.display = 'none');
        
        // Basic user info from auth
        const displayName = user.displayName || (userData ? `${userData.firstName} ${userData.lastName}` : 'User');
        const email = user.email;
        
        console.log("User display name:", displayName);
        console.log("User email:", email);
        
        // Update user info in UI
        if (userNameElement) userNameElement.textContent = displayName;
        if (userEmailElement) userEmailElement.textContent = email;
        
        // Update profile images
        let initials = 'U';
        if (userData && userData.firstName && userData.lastName) {
            initials = userData.firstName.charAt(0) + userData.lastName.charAt(0);
        } else if (displayName && displayName.includes(' ')) {
            const nameParts = displayName.split(' ');
            initials = nameParts[0].charAt(0) + nameParts[1].charAt(0);
        } else if (displayName) {
            initials = displayName.charAt(0);
        }
        
        console.log("Setting profile initials:", initials);
        
        // Set initials
        if (profileInitials) profileInitials.textContent = initials.toUpperCase();
        if (avatarInitials) avatarInitials.textContent = initials.toUpperCase();
        
        // Check for profile picture
        const photoURL = user.photoURL || (userData ? userData.photoURL : null);
        if (photoURL) {
            console.log("User has profile picture:", photoURL);
            // Update profile picture in UI
            if (sidebarProfileImage) {
                sidebarProfileImage.innerHTML = `<img src="${photoURL}" alt="Profile">`;
            }
            if (document.getElementById('avatar-preview')) {
                document.getElementById('avatar-preview').innerHTML = `<img src="${photoURL}" alt="Profile">`;
            }
            if (document.getElementById('user-icon')) {
                document.getElementById('user-icon').innerHTML = `<img src="${photoURL}" alt="Profile">`;
            }
        }
        
        // Update profile form if exists
        if (userData) {
            const firstNameInput = document.getElementById('first-name');
            const lastNameInput = document.getElementById('last-name');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone');
            const institutionInput = document.getElementById('institution');
            const bioInput = document.getElementById('bio');
            
            if (firstNameInput) firstNameInput.value = userData.firstName || '';
            if (lastNameInput) lastNameInput.value = userData.lastName || '';
            if (emailInput) emailInput.value = email || '';
            if (phoneInput && userData.phone) phoneInput.value = userData.phone;
            if (institutionInput && userData.institution) institutionInput.value = userData.institution;
            if (bioInput && userData.bio) bioInput.value = userData.bio;
        }
        
        // Check if profile is complete
        const isProfileComplete = userData && userData.isProfileComplete;
        console.log("Profile complete:", isProfileComplete);
        
        if (!isProfileComplete) {
            // Show profile completion modal
            document.getElementById('profile-completion-modal').classList.add('active');
        } else {
            // Auto-redirect to dashboard if login button was clicked
            if (sessionStorage.getItem('loginRedirect') === 'dashboard') {
                sessionStorage.removeItem('loginRedirect');
                console.log("Redirecting to dashboard based on login redirect flag");
                showDashboard();
            }
        }
    } else {
        // User is signed out
        console.log("Updating UI for signed-out user");
        loggedInElements.forEach(el => el.style.display = 'none');
        loggedOutElements.forEach(el => el.style.display = 'block');
        
        // Reset UI
        if (userNameElement) userNameElement.textContent = 'User Name';
        if (userEmailElement) userEmailElement.textContent = 'user@example.com';
        if (profileInitials) profileInitials.textContent = 'U';
        if (avatarInitials) avatarInitials.textContent = 'U';
        
        // Ensure we're on the main website
        showWebsiteContent();
    }
    
    // Hide loading indicators
    const loginLoadingIndicator = document.getElementById('login-loading');
    const registerLoadingIndicator = document.getElementById('register-loading');
    if (loginLoadingIndicator) loginLoadingIndicator.style.display = 'none';
    if (registerLoadingIndicator) registerLoadingIndicator.style.display = 'none';
}

// Setup toast notification
function setupToastNotification() {
    const toast = document.getElementById('toast');
    const toastClose = document.getElementById('toast-close');
    
    // Close toast
    if (toastClose) {
        toastClose.addEventListener('click', () => {
            toast.classList.remove('show');
        });
    }
}

// Load user's sessions tab
async function loadUserSessionsTab() {
    if (!currentUser) {
        console.log("No user logged in, can't load sessions tab");
        return;
    }
    
    try {
        console.log("Loading user sessions tab");
        
        // Get sessions container
        const sessionsContainer = document.getElementById('sessions-content');
        if (!sessionsContainer) {
            console.log("Sessions container not found");
            return;
        }
        
        // Get user sessions
        const sessions = await getUserSessions();
        console.log("User sessions:", sessions);
        
        // Clear existing content except the heading and subheading
        const heading = sessionsContainer.querySelector('h3');
        const subheading = sessionsContainer.querySelector('p');
        
        if (heading && subheading) {
            sessionsContainer.innerHTML = '';
            sessionsContainer.appendChild(heading);
            sessionsContainer.appendChild(subheading);
        }
        
        if (!sessions || sessions.length === 0) {
            // No sessions
            const noSessionsMessage = document.createElement('div');
            noSessionsMessage.className = 'session-card';
            noSessionsMessage.innerHTML = `
                <h3>No Registered Sessions</h3>
                <p>You haven't registered for any sessions yet. Check out the schedule to find sessions to attend.</p>
                <div class="session-actions">
                    <a href="#schedule" class="btn btn-sm" id="view-schedule-btn">View Schedule</a>
                </div>
            `;
            sessionsContainer.appendChild(noSessionsMessage);
            
            // Add event listener to view schedule button
            document.getElementById('view-schedule-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                showWebsiteContent();
                document.querySelector('a[href="#schedule"]').click();
            });
            
            return;
        }
        
        // Display sessions
        sessions.forEach(session => {
            const sessionCard = document.createElement('div');
            sessionCard.className = 'session-card';
            
            // Determine status class
            let statusClass = 'status-upcoming';
            let statusText = session.status || 'Upcoming';
            
            if (session.attended) {
                statusClass = 'status-completed';
                statusText = 'Attended';
            }
            
            sessionCard.innerHTML = `
                <h3>${session.title}</h3>
                <p>${session.description || ''}</p>
                <div class="session-details">
                    <span><i class="fas fa-calendar-alt"></i> ${session.date}</span>
                    <span><i class="fas fa-clock"></i> ${session.time}</span>
                    <span class="session-status ${statusClass}">${statusText}</span>
                </div>
                <div class="session-actions">
                    <button class="btn btn-sm btn-outline unregister-btn" data-session-id="${session.id}">
                        <i class="fas fa-times"></i> Unregister
                    </button>
                </div>
            `;
            
            sessionsContainer.appendChild(sessionCard);
        });
        
        // Add event listeners to unregister buttons
        document.querySelectorAll('.unregister-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const sessionId = e.currentTarget.getAttribute('data-session-id');
                try {
                    await unregisterFromSession(sessionId);
                    // Reload sessions after unregistering
                    loadUserSessionsTab();
                } catch (error) {
                    console.error("Error unregistering from session:", error);
                }
            });
    } catch (error) {
        console.error("Error loading user sessions:", error);
        showToast('error', 'Error', 'Failed to load your registered sessions.');
    }
}

// Load all available sessions for schedule section
async function loadScheduleSessions() {
    try {
        console.log("Loading all sessions for schedule");
        
        // Get all sessions from API
        const sessions = await sessionAPI.getAllSessions();
        
        // Get timeline container
        const timeline = document.querySelector('.timeline');
        if (!timeline) {
            console.log("Timeline container not found");
            return;
        }
        
        // Clear existing content
        timeline.innerHTML = '';
        
        // Sort sessions by date
        sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Display sessions in timeline
        sessions.forEach(session => {
            const sessionItem = document.createElement('div');
            sessionItem.className = 'timeline-item';
            
            // Create session content
            const sessionContent = document.createElement('div');
            sessionContent.className = 'timeline-content';
            
            sessionContent.innerHTML = `
                <div class="date">${session.date}</div>
                <h3>${session.title}</h3>
                <p>${session.description || ''}</p>
                <div class="session-materials">
                    <a href="#" title="Available after session"><i class="fas fa-file-powerpoint"></i> Presentation Slides</a>
                    <a href="#" title="Available after session"><i class="fas fa-file-code"></i> Code Examples</a>
                </div>
            `;
            
            // Create register button
            const registerButton = document.createElement('button');
            registerButton.className = 'btn btn-sm register-session-btn';
            registerButton.setAttribute('data-session-id', session.id);
            registerButton.textContent = 'Register';
            
            // Add button to session content
            sessionContent.appendChild(registerButton);
            
            // Add content to session item
            sessionItem.appendChild(sessionContent);
            
            // Add session item to timeline
            timeline.appendChild(sessionItem);
        });
        
        // Add event listeners for register buttons
        addSessionRegistrationListeners();
        
    } catch (error) {
        console.error("Error loading sessions:", error);
        showToast('error', 'Error', 'Failed to load session schedule.');
    }
}

// Add click listeners to session registration buttons
function addSessionRegistrationListeners() {
    const registerButtons = document.querySelectorAll('.register-session-btn');
    
    registerButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!currentUser) {
                // Not logged in, show login modal
                document.getElementById('login-modal').classList.add('active');
                return;
            }
            
            const sessionId = e.currentTarget.getAttribute('data-session-id');
            try {
                await registerForSession(sessionId);
                
                // Update button state
                e.currentTarget.textContent = 'Registered';
                e.currentTarget.disabled = true;
                e.currentTarget.classList.add('registered');
            } catch (error) {
                // Error is already handled in registerForSession function
                console.error("Error in registration listener:", error);
            }
        });
    });
}

// Initialize UI based on window location hash
function initUIBasedOnHash() {
    if (window.location.hash === '#dashboard') {
        showDashboard();
    }
}

// Initialize the UI module
function initUI() {
    // Set up toast notifications
    setupToastNotification();
    
    // Initialize UI based on hash
    initUIBasedOnHash();
    
    // Make UI functions globally available
    window.showDashboard = showDashboard;
    window.showWebsiteContent = showWebsiteContent;
}

// Export UI functions
export { 
    initUI, 
    showToast, 
    showDashboard, 
    showWebsiteContent, 
    updateAuthUI,
    switchDashboardTab,
    loadScheduleSessions,
    loadUserSessionsTab
};