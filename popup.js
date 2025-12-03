document.getElementById("grab").addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: grabAIOverviewLinks
    }, (results) => {
        if(results && results[0].result){
            const links = results[0].result;
            // Display links as bullet points
            document.getElementById("links").value = links.map(link => `• ${link}`).join("\n");
        }
    });
});

document.getElementById("download").addEventListener("click", () => {
    const text = document.getElementById("links").value;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url,
        filename: "ai_overview_links.txt"
    });
});

function grabAIOverviewLinks() {
    const links = [];

    // Select all <a> elements with class KEVENd (Google search result links)
    const anchors = document.querySelectorAll("a.KEVENd[href]");
    anchors.forEach(a => {
        let href = a.href;

        // Only include links that have 'ai' or 'artificial-intelligence' in the URL
        if ((href.toLowerCase().includes("ai") || href.toLowerCase().includes("artificial-intelligence"))) {

            // Direct links
            if (href.startsWith("http") || href.startsWith("https")) {
                links.push(href);
            } 
            // Handle Google redirect URLs (/url?sa=t&...)
            else if (href.startsWith("/url?")) {
                try {
                    const urlParams = new URLSearchParams(href.split("?")[1]);
                    const realUrl = urlParams.get("url") || urlParams.get("q");
                    if (realUrl) links.push(realUrl);
                } catch (e) {}
            }
        }
    });

    return Array.from(new Set(links)); // remove duplicates
}

