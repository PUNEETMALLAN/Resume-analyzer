const API = 'http://localhost:5000/api';

async function doAuth() {
    hideAuthMessages();

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value.trim();

    if (!email || !password) {
        return showAuthErr('Email and password are required.');
    }

    if (currentTab === 'register' && !name) {
        return showAuthErr('Name is required.');
    }

    const btn = document.getElementById('authBtn');
    btn.disabled = true;
    btn.textContent = 'Please wait...';

    try {
        // REGISTER
        if (currentTab === 'register') {

            const res = await fetch(API + '/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await res.json();

            if (!res.ok) {
                return showAuthErr(data.error || 'Registration failed');
            }

            // SAVE EMAIL FOR OTP VERIFY
            localStorage.setItem("verify_email", email);

            showAuthSuccess("OTP sent to your email.");

            // ASK OTP
            const otp = prompt("Enter OTP sent to your email");

            if (!otp) {
                return showAuthErr("OTP is required");
            }

            // VERIFY OTP
            const verifyRes = await fetch(API + '/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    otp
                })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
                return showAuthErr(verifyData.error || 'OTP verification failed');
            }

            saveAuth(verifyData.token, verifyData.user);

            setNavUser(verifyData.user);

            showPage('analyzer');

            loadHistory();

            return;
        }

        // LOGIN
        const res = await fetch(API + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await res.json();

        if (!res.ok) {
            return showAuthErr(data.error || 'Login failed');
        }

        saveAuth(data.token, data.user);

        setNavUser(data.user);

        showPage('analyzer');

        loadHistory();

    } catch (err) {
        console.log(err);
        showAuthErr('Cannot connect to server.');
    } finally {
        btn.disabled = false;
        btn.textContent =
            currentTab === 'login'
            ? 'Sign in'
            : 'Create account';
    }
}