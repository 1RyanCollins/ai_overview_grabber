// popup.js

document.addEventListener("DOMContentLoaded", () => {

    // Grab links button
    document.getElementById("grab").addEventListener("click", async () => {
        try {
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) throw new Error("No active tab found.");

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: grabTextFragmentLinks
            });

            if (!results || !results[0] || !results[0].result) {
                document.getElementById("links").value = "";
                return;
            }

            const rawLinks = results[0].result;
            const links = rawLinks.map(link => cleanText(link)).filter(l => l);

            // Display with a safe hyphen bullet
            document.getElementById("links").value = links.map(link => `- ${link}`).join("\n");

        } catch (err) {
            console.error(err);
            alert("Error grabbing links: " + err.message);
        }
    });

    // Copy to clipboard button
    document.getElementById("copy").addEventListener("click", async () => {
        const text = document.getElementById("links").value;
        if (!text) {
            alert("Nothing to copy!");
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            alert("Copied to clipboard!");
        } catch (e) {
            console.error(e);
            alert("Copy failed: " + e.message);
        }
    });

    // Optional download button (still works as TXT)
    document.getElementById("download")?.addEventListener("click", () => {
        const text = document.getElementById("links").value;
        if (!text) {
            alert("Nothing to download!");
            return;
        }

        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
            url: url,
            filename: "text_fragment_links.txt"
        });
    });

});

// --- Helper functions ---

// Clean non-printable / weird characters
function cleanText(str) {
    if (!str && str !== 0) return "";
    let s = String(str);
    s = s.replace(/\uFFFD/g, '');  // replacement char
    s = s.replace(/â€¢/g, '');     // explicit removal
    s = s.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ''); // remove control/non-ASCII
    s = s.trim().replace(/\s+/g, ' ');
    return s;
}

// Grab all #:~:text= links on the page and remove duplicates
function grabTextFragmentLinks() {
    const links = [];
    const anchors = document.querySelectorAll("a[href]");
    anchors.forEach(a => {
        let href = a.href;
        if (href && href.includes(":~:text=")) {
            try {
                const mainUrl = href.split("#")[0];
                links.push(mainUrl);
            } catch (e) {}
        }
    });
    return Array.from(new Set(links));
}



