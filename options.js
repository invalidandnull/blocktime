document.addEventListener('DOMContentLoaded', () => {
    const siteUrlInput = document.getElementById('site-url');
    const siteTimeInput = document.getElementById('site-time');
    const addButton = document.getElementById('add-button');
    const sitesList = document.getElementById('sites-list');
    const sitesUsageList = document.getElementById('sites-usage');

    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Load sites from storage and display them
    function loadSites() {
        chrome.storage.sync.get({ sites: [] }, (data) => {
            sitesList.innerHTML = '';
            data.sites.forEach((site, index) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
          <span>${site.url} - ${site.time} 分钟/天</span>
          <button class="remove-button" data-index="${index}">删除</button>
        `;
                sitesList.appendChild(listItem);
            });
        });
    }

    // Load usage stats and display them
    function loadUsageStats() {
        const today = getTodayDateString();

        chrome.storage.sync.get({ sites: [] }, (syncData) => {
            const sites = syncData.sites;
            if (sites.length === 0) {
                sitesUsageList.innerHTML = '<li>没有需要统计的网站。</li>';
                return;
            }

            chrome.storage.local.get({ usageData: {} }, (localData) => {
                const usage = localData.usageData[today] || {};
                sitesUsageList.innerHTML = ''; // Clear previous stats

                sites.forEach(site => {
                    const allowedTime = site.time * 60; // seconds
                    const usedTime = usage[site.url] || 0; // seconds
                    const remainingTime = Math.max(0, allowedTime - usedTime);
                    const remainingMinutes = Math.floor(remainingTime / 60);

                    const listItem = document.createElement('li');
                    // Use a simple span for the content, as we don't need buttons here.
                    listItem.innerHTML = `<span>${site.url} - 剩余 ${remainingMinutes} 分钟</span>`;
                    sitesUsageList.appendChild(listItem);
                });
            });
        });
    }


    // Add a new site
    addButton.addEventListener('click', () => {
        const url = siteUrlInput.value.trim();
        const time = parseInt(siteTimeInput.value, 10);

        if (url && time > 0) {
            chrome.storage.sync.get({ sites: [] }, (data) => {
                const sites = data.sites;
                // avoid duplicates
                if (sites.find(s => s.url === url)) {
                    alert("该网站已在列表中。");
                    return;
                }
                sites.push({ url, time });
                chrome.storage.sync.set({ sites }, () => {
                    siteUrlInput.value = '';
                    siteTimeInput.value = '';
                    loadSites();
                    loadUsageStats();
                });
            });
        } else {
            alert('请输入有效的网址和时间。');
        }
    });

    // Remove a site
    sitesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-button')) {
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            chrome.storage.sync.get({ sites: [] }, (data) => {
                const sites = data.sites;
                sites.splice(index, 1);
                chrome.storage.sync.set({ sites }, () => {
                    loadSites();
                    loadUsageStats();
                });
            });
        }
    });

    // Initial load
    loadSites();
    loadUsageStats();
});
