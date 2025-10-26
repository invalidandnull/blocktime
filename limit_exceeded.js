// This script is injected when the daily time limit for the site is exceeded.

(function () {
    // Prevent script from running multiple times on the same page
    if (window.blockTimeLimitExceeded) {
        return;
    }
    window.blockTimeLimitExceeded = true;

    const overlay = document.createElement('div');
    overlay.id = 'blocktime-limit-exceeded-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.color = 'white';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '2147483647';
    overlay.style.fontFamily = 'sans-serif';
    overlay.style.textAlign = 'center';

    const message = document.createElement('h1');
    message.textContent = '今天这个网站的浏览时间已经用完啦！';
    message.style.fontSize = '3em';
    message.style.maxWidth = '80%';

    overlay.appendChild(message);
    document.body.appendChild(overlay);

    // Stop the page from loading further resources
    window.stop();
})();
