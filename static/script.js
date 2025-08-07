let currentSSID = '';

function showNotification(message, type = 'success') {

    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);


    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
// function login(){
// const user=document.getElementById('email').value.trim();
// const pass=document.getElementById('password').value.trim();
// if(user=='admin@example.com' && pass=='admin@123'){
// document.getElementById("loginpage").style.display='none';
// document.getElementById("Wifi Page").style.display='block';
// }
// else{
// alert("Invalid Credentials");
// }

// }
async function fetchNetworks() {
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');
    const list = document.getElementById('networkList');

    refreshBtn.disabled = true;
    refreshIcon.innerHTML = '<div class="loading-spinner"></div>';
    refreshText.textContent = 'Scanning...';

    try {
        const res = await fetch('/api/networks');
        const networks = await res.json();

        list.innerHTML = '';

        if (networks.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📡</div>
                    <h3>No Networks Found</h3>
                    <p>No WiFi networks were discovered. Try scanning again.</p>
                </div>
            `;
        } else {
            networks.forEach(ssid => {
                const li = document.createElement('li');
                li.className = 'network-item';
                li.innerHTML = `
                    <div class="network-content">
                        <div class="network-name">
                            <span class="network-icon">📶</span>
                            ${ssid}
                        </div>
                        <div class="connect-arrow">→</div>
                    </div>
                `;
                li.onclick = () => showPasswordModal(ssid);
                list.appendChild(li);
            });
        }

        showNotification(`Found ${networks.length} network${networks.length !== 1 ? 's' : ''}`, 'success');
    } catch (error) {
        console.error('Error fetching networks:', error);
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">⚠️</div>
                <h3>Connection Error</h3>
                <p>Unable to scan for networks. Please check your connection and try again.</p>
            </div>
        `;
        showNotification('Failed to scan networks', 'error');
    } finally {
        refreshBtn.disabled = false;
        refreshIcon.textContent = '🔄';
        refreshText.textContent = 'Scan Networks';
    }
}

function showPasswordModal(ssid) {
    currentSSID = ssid;
  
    document.getElementById('modalTitle').textContent = `Connect to "${ssid}"`;
    document.getElementById('networkPassword').value = '';
    document.getElementById('passwordModal').style.display = 'block';


    setTimeout(() => {
        document.getElementById('networkPassword').focus();
    }, 300);
}

function closeModal() {
    document.getElementById('passwordModal').style.display = 'none';
    currentSSID = '';
}

async function submitConnection() {
    const password = document.getElementById('networkPassword').value;
    const connectBtn = document.getElementById('connectBtn');

    if (!password.trim()) {
        showNotification('Please enter a password', 'error');
        return;
    }


    connectBtn.disabled = true;
    connectBtn.innerHTML = '<div class="loading-spinner"></div> Connecting...';

    try {
        const res = await fetch('/api/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ssid: currentSSID, password })
        });

        const msg = await res.json();

        if (res.ok) {
            showNotification(msg.message || `Connected to ${currentSSID}`, 'success');
            closeModal();
        } else {
            showNotification(msg.message || 'Connection failed', 'error');
        }
    } catch (error) {
        console.error('Connection error:', error);
        showNotification('Connection failed', 'error');
    } finally {

        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect';
    }
}

// document.getElementById('password').addEventListener('keypress',function(q){
// if(q.key==='Enter'){
// login();}
// });
document.getElementById('networkPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        submitConnection();
    }
});


document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});



document.getElementById('passwordModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});


fetchNetworks();