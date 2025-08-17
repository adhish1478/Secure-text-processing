document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on login or register page
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        setupLoginForm();
    }
    
    if (registerForm) {
        setupRegisterForm();
    }
});

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    const errorElement = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Show loading state
        loginText.textContent = 'Logging in...';
        loginSpinner.classList.remove('hidden');
        loginButton.disabled = true;
        
        try {
            // Replace with your actual API endpoint
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store access token and full name in localStorage
                localStorage.setItem('accessToken', data.access);
                localStorage.setItem('fullName', data.name);

                await fetchUserInfo();
                
                // Redirect to dashboard
                window.location.href = '/';
            } else {
                // Show error message
                errorElement.textContent = data.detail || 'Invalid credentials';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorElement.textContent = 'An error occurred. Please try again.';
        } finally {
            // Reset button state
            loginText.textContent = 'Login';
            loginSpinner.classList.add('hidden');
            loginButton.disabled = false;
        }
    });
}

async function fetchUserInfo() {
    try {
        const response = await fetch('/api/auth/me/', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('fullName', data.name);
        } else {
            console.error('Failed to fetch user info:', response.status);
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    const registerButton = document.getElementById('registerButton');
    const registerText = document.getElementById('registerText');
    const registerSpinner = document.getElementById('registerSpinner');
    const errorElement = document.getElementById('registerError');
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const dob = document.getElementById('dob').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Basic client-side validation
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            return;
        }
        
        // Validate date format (YYYY-MM-DD)
        const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dobRegex.test(dob)) {
            errorElement.textContent = 'Please enter date in YYYY-MM-DD format';
            return;
        }
        
        // Show loading state
        registerText.textContent = 'Registering...';
        registerSpinner.classList.remove('hidden');
        registerButton.disabled = true;
        
        try {
            // Replace with your actual API endpoint
            const response = await fetch('/api/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: fullName,
                    email: email,
                    password: password,
                    date_of_birth: dob
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Redirect to login page after successful registration
                window.location.href = '/login';
            } else {
                // Show error message
                if (data.errors) {
                    // Handle Django error format
                    errorElement.textContent = Object.values(data.errors).flat().join(' ');
                } else {
                    errorElement.textContent = data.detail || 'Registration failed';
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorElement.textContent = 'An error occurred. Please try again.';
        } finally {
            // Reset button state
            registerText.textContent = 'Register';
            registerSpinner.classList.add('hidden');
            registerButton.disabled = false;
        }
    });
}