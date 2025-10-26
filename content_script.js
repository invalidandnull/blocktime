(function () {
    // Prevent script from running multiple times
    if (window.blockTimeHasRun) {
        return;
    }
    window.blockTimeHasRun = true;

    let siteUrl = null;

    // Find the matching URL from storage to make sure we use the correct key
    chrome.storage.sync.get({ sites: [] }, (data) => {
        const matchingSite = data.sites.find(s => window.location.hostname.includes(s.url));
        if (matchingSite) {
            siteUrl = matchingSite.url;
            // Get remaining time for today
            const today = getTodayDateString();
            chrome.storage.local.get({ usageData: {} }, (localData) => {
                const usage = localData.usageData;
                const timeUsedToday = (usage[today] && usage[today][siteUrl]) || 0;
                const timeAllowedToday = matchingSite.time * 60;
                const remainingTime = timeAllowedToday - timeUsedToday;
                createTimeSelectionOverlay(remainingTime);
            });
        }
    });

    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }


    function createTimeSelectionOverlay(remainingTime) {
        const overlay = document.createElement('div');
        overlay.id = 'blocktime-overlay';

        const remainingMinutes = Math.floor(remainingTime / 60);

        overlay.innerHTML = `
      <div id="blocktime-modal">
        <h1>本次想要浏览多久？</h1>
        <p>今天 ${siteUrl} 还剩下 ${remainingMinutes} 分钟的可用时间。</p>
        <div id="blocktime-options">
          <button class="blocktime-btn" data-time="300">5 分钟</button>
          <button class="blocktime-btn" data-time="600">10 分钟</button>
          <button class="blocktime-btn" data-time="900">15 分钟</button>
        </div>
        <div id="blocktime-custom">
          <input type="number" id="blocktime-custom-time" placeholder="自定义分钟">
          <button id="blocktime-custom-btn">确定</button>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);

        // Add event listeners
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('blocktime-btn')) {
                const timeInSeconds = parseInt(e.target.dataset.time, 10);
                if (timeInSeconds > remainingTime) {
                    alert(`剩余时间不足！今天只剩下 ${remainingMinutes} 分钟。`);
                    return;
                }
                startCountdown(timeInSeconds);
            } else if (e.target.id === 'blocktime-custom-btn') {
                const customMinutes = parseInt(document.getElementById('blocktime-custom-time').value, 10);
                if (customMinutes > 0) {
                    const timeInSeconds = customMinutes * 60;
                    if (timeInSeconds > remainingTime) {
                        alert(`剩余时间不足！今天只剩下 ${remainingMinutes} 分钟。`);
                        return;
                    }
                    startCountdown(timeInSeconds);
                } else {
                    alert('请输入有效的分数。');
                }
            }
        });
    }

    function startCountdown(durationInSeconds) {
        // Remove overlay
        const overlay = document.getElementById('blocktime-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Send message to background to start the master timer
        chrome.runtime.sendMessage({ action: "startTimer", duration: durationInSeconds, siteUrl: siteUrl });

        // Create and start the visual countdown timer on the page
        const timerDiv = document.createElement('div');
        timerDiv.id = 'blocktime-timer';
        document.body.appendChild(timerDiv);

        let timeLeft = durationInSeconds;

        function updateTimerDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDiv.textContent = `剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        updateTimerDisplay(); // Initial display

        const timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                // The background script will close the tab.
                // We can optionally show a message here.
                timerDiv.textContent = '时间到！';
            }
        }, 1000);
    }
})();
