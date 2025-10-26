document.addEventListener('DOMContentLoaded', () => {
    const siteUrlInput = document.getElementById('site-url');
    const siteTimeInput = document.getElementById('site-time');
    const addButton = document.getElementById('add-button');
    const sitesList = document.getElementById('sites-list');

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
                chrome.storage.sync.set({ sites }, loadSites);
            });
        }
    });

    // Initial load
    loadSites();
});
