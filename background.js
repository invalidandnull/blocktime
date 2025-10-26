// Get today's date in YYYY-MM-DD format
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Check if a URL is on the supervised list
function isSupervised(url, supervisedSites) {
    if (!url) return null;
    return supervisedSites.find(site => url.includes(site.url));
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // We only care about the main frame loading a new URL
    if (changeInfo.status === 'loading' && tab.url) {
        chrome.storage.sync.get({ sites: [] }, (syncData) => {
            const supervisedSite = isSupervised(tab.url, syncData.sites);

            if (supervisedSite) {
                const today = getTodayDateString();
                chrome.storage.local.get({ usageData: {} }, (localData) => {
                    const usage = localData.usageData;

                    // Reset daily usage if it's a new day
                    if (!usage[today]) {
                        usage[today] = {};
                    }

                    const timeUsedToday = usage[today][supervisedSite.url] || 0; // in seconds
                    const timeAllowedToday = supervisedSite.time * 60; // in seconds

                    if (timeUsedToday >= timeAllowedToday) {
                        // Time is up for today
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['limit_exceeded.js']
                        });
                    } else {
                        // There is still time, inject the main content script and its CSS
                        chrome.scripting.insertCSS({
                            target: { tabId: tabId },
                            files: ['content.css']
                        });
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content_script.js']
                        });
                    }
                });
            }
        });
    }
});

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startTimer") {
        const { duration, siteUrl } = request;
        const today = getTodayDateString();

        // Update usage data
        chrome.storage.local.get({ usageData: {} }, (localData) => {
            let usage = localData.usageData;
            if (!usage[today]) {
                usage[today] = {};
            }
            usage[today][siteUrl] = (usage[today][siteUrl] || 0) + duration;
            chrome.storage.local.set({ usageData: usage });
        });

        // Set an alarm to close the tab
        chrome.alarms.create(`timer_${sender.tab.id}`, { delayInMinutes: duration / 60 });
    }
    // Return true to indicate you wish to send a response asynchronously
    // This is required in some cases, although not strictly necessary for this logic.
    // It's good practice to include it.
    return true;
});

// Listener for when an alarm goes off
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith("timer_")) {
        const tabId = parseInt(alarm.name.split("_")[1], 10);
        // We don't need to check if the tab exists, remove will fail silently.
        chrome.tabs.remove(tabId);
    } else if (alarm.name === 'dailyCleanup') {
        cleanOldUsageData();
    }
});

// Use onInstalled for setup tasks
chrome.runtime.onInstalled.addListener(() => {
    // Perform cleanup on startup
    cleanOldUsageData();

    // Create a recurring alarm for daily cleanup
    chrome.alarms.create('dailyCleanup', {
        periodInMinutes: 1440 // Run once a day
    });
});


function cleanOldUsageData() {
    const today = getTodayDateString();
    chrome.storage.local.get({ usageData: {} }, (localData) => {
        const usage = localData.usageData;
        for (const date in usage) {
            if (date !== today) {
                delete usage[date];
            }
        }
        chrome.storage.local.set({ usageData: usage });
    });
}
