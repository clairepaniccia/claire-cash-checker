document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('emailInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultDiv = document.getElementById('result');

    searchBtn.addEventListener('click', checkBalance);
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkBalance();
        }
    });

    async function checkBalance() {
        const email = emailInput.value.trim();
        
        if (!email) {
            showResult('Please enter an email address', 'error');
            return;
        }

        // Simple email validation
        if (!isValidEmail(email)) {
            showResult('Please enter a valid email address', 'error');
            return;
        }

        // Disable button and show loading
        searchBtn.disabled = true;
        searchBtn.textContent = 'Checking...';
        resultDiv.textContent = '';
        resultDiv.className = 'result';

        try {
            const response = await fetch('/api/check-balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (response.ok) {
                showResult(data.message, data.hasCash ? 'success' : 'error', data.isHtml);
            } else {
                showResult(data.error || 'An error occurred', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showResult('Failed to check balance. Please try again.', 'error');
        } finally {
            // Re-enable button
            searchBtn.disabled = false;
            searchBtn.textContent = 'Check Balance';
        }
    }

    function showResult(message, type, isHtml = false) {
        if (isHtml) {
            resultDiv.innerHTML = message;
        } else {
            resultDiv.textContent = message;
        }
        resultDiv.className = `result ${type}`;
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});
