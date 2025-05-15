const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const botFiles = [
  "config.js",           // config and constants first
  "gameState.js",        // shared game state data next
  "utils.js",            // helper functions
  "actionNode.js",       // core ActionNode class and instances
  "decisionNode.js",     // DecisionNode class and decision nodes
  "actions/move.js",     // individual action implementations
  "actions/shoot.js",
  "actions/heal.js",
  "actions/melee.js",
  "trees/behaviourTree.js",  // behavior tree builder that depends on nodes/actions
  "main.js"              // main entry point: runs the loop
];

const injectedLoader = `
(function () {
    'use strict';
    const botFiles = ${JSON.stringify(botFiles)};
    for (const file of botFiles) {
        const script = document.createElement('script');
        script.src = '/' + file;
        script.type = 'text/javascript';
        document.head.appendChild(script);
    }
    const checkGameInitialization = setInterval(() => {
        if (_e.game) {
            window.game = _e.game;
            window.weaponData = O;
            console.log("Game is now accessible from the console.");
            clearInterval(checkGameInitialization);
        }
    }, 10);
})();
`;

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function launchBot(instanceId) {
    console.log(`Starting bot instance ${instanceId}...`);

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    await page.setRequestInterception(true);
    page.on("request", async (request) => {
        const url = request.url();
        const pathname = new URL(url).pathname.slice(1);

        // Intercept and modify app-*.js
        if (url.includes("app-") && url.endsWith(".js")) {
            console.log(`Intercepting client-side app script at: ${url}`);
            try {
                const originalScript = await fetchUrl(url);
                const modifiedScript = originalScript + "\n\n" + injectedLoader;

                request.respond({
                    status: 200,
                    contentType: "application/javascript",
                    body: modifiedScript
                });
            } catch (err) {
                console.error("Failed to fetch app script:", err);
                request.abort();
            }
            return;
        }

        // Serve your bot files
        if (botFiles.includes(pathname)) {
            const localPath = path.join(__dirname, pathname);
            if (fs.existsSync(localPath)) {
                console.log(`Instance ${instanceId}: Serving ${pathname}`);
                const script = fs.readFileSync(localPath, "utf8");
                request.respond({
                    status: 200,
                    contentType: "application/javascript",
                    body: script
                });
                return;
            }
        }

        // Let everything else pass through
        request.continue();
    });

    await page.goto("http://66.179.254.36/", { waitUntil: "domcontentloaded" });
    console.log(`Instance ${instanceId}: Page loaded.`);

    try {
        await page.waitForSelector("#btn-start-mode-0", { visible: true, timeout: 10000 });
        await page.click("#btn-start-mode-0");
        console.log(`Instance ${instanceId}: Clicked 'Play'.`);
    } catch (error) {
        console.log(`Instance ${instanceId}: No 'Play' button found.`);
    }

    await new Promise(resolve => setTimeout(resolve, 50000000));
    await browser.close();
    console.log(`Instance ${instanceId}: Browser closed.`);
}

launchBot(1);