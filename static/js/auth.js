document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.form');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding form
            forms.forEach(form => form.classList.remove('active'));
            document.getElementById(`${tab}Form`).classList.add('active');
        });
    });
    
    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            const input = document.getElementById(target);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.textContent = 'Hide';
            } else {
                input.type = 'password';
                this.textContent = 'Show';
            }
        });
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Simple validation
        let valid = true;
        
        if (username.length < 3) {
            document.getElementById('loginUsernameError').style.display = 'block';
            valid = false;
        } else {
            document.getElementById('loginUsernameError').style.display = 'none';
        }
        
        if (password.length === 0) {
            document.getElementById('loginPasswordError').style.display = 'block';
            valid = false;
        } else {
            document.getElementById('loginPasswordError').style.display = 'none';
        }
        
        if (valid) {
            // Send login request
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('loginSuccess').style.display = 'block';
                    document.getElementById('loginError').style.display = 'none';
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    document.getElementById('loginError').style.display = 'block';
                    document.getElementById('loginSuccess').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('loginError').style.display = 'block';
            });
        }
    });
    
    // Signup form
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        let valid = true;
        
        if (username.length < 3) {
            document.getElementById('signupUsernameError').style.display = 'block';
            valid = false;
        } else {
            document.getElementById('signupUsernameError').style.display = 'none';
        }
        
        if (password.length < 6) {
            document.getElementById('signupPasswordError').style.display = 'block';
            valid = false;
        } else {
            document.getElementById('signupPasswordError').style.display = 'none';
        }
        
        if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').style.display = 'block';
            valid = false;
        } else {
            document.getElementById('confirmPasswordError').style.display = 'none';
        }
        
        if (valid) {
            // Send signup request
            fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('signupSuccess').style.display = 'block';
                    document.getElementById('signupError').style.display = 'none';
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    document.getElementById('signupError').textContent = data.error;
                    document.getElementById('signupError').style.display = 'block';
                    document.getElementById('signupSuccess').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('signupError').style.display = 'block';
            });
        }
    });
});