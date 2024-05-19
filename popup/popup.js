try {
    // Establish a connection to the Chrome runtime
     // Establish a connection to the Chrome runtime
    const runtimePort = chrome.runtime.connect({ name: "popup" });
    runtimePort.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            // Handle the error or suppress the warning
            console.error("Error on disconnect:", chrome.runtime.lastError.message);
        }
    });
    // Define error messages
    const errorMessages = {
        emptyUrl: "Please enter the tweet URL.",
        invalidUrl: "Please enter a valid tweet URL in the format https://x.com/username/status/tweet-id."
    };

    // Get DOM elements
    const tweetUrlInput = document.getElementById("tweetUrlInput");
    const startButton = document.getElementById("startButton");

    // Add event listener to the start button
    startButton.addEventListener("click", () => {
        console.log("clicked")
        const tweetUrl = tweetUrlInput.value.trim();

        if (!tweetUrl) {
            alert(errorMessages.emptyUrl);
            return;
        }

        if (!/^https:\/\/x\.com\/.+?\/status\/.+$/i.test(tweetUrl)) {
            alert(errorMessages.invalidUrl);
            return;
        }

        const modifiedUrl = tweetUrl.endsWith("/likes") ? tweetUrl : tweetUrl + "/likes";
        if (runtimePort && runtimePort.name === "popup") {
            runtimePort.postMessage({
                type: "startExport",
                url: modifiedUrl,
                user: tweetUrl
            });
        }        
    });
    

    document.addEventListener('DOMContentLoaded', function() {
        const audioLabel = document.querySelector('.audio-label');
        audioLabel.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    });

    // This  manages the audio switch in the extension popup.
    // It loads the initial value from storage, sets it to the default if not already set,
    // and saves any changes to storage. It also communicates the change to the content script.
    document.addEventListener("DOMContentLoaded", function() {
        var audioSwitch = document.getElementById("flexSwitchCheckChecked");
    
        // Load initial value from storage
        chrome.storage.sync.get("audioEnabled", function(data) {
            if (data.audioEnabled === undefined) {
                // Set default value if not already set
                chrome.storage.sync.set({ "audioEnabled": true });
                audioSwitch.checked = true; // Set the switch to enabled
            } else {
                audioSwitch.checked = data.audioEnabled;
            }
        });
    
        // Event listener for checkbox change
        audioSwitch.addEventListener("change", function() {
            var audioEnabled = audioSwitch.checked;
            // Save the new value to storage
            chrome.storage.sync.set({ "audioEnabled": audioEnabled });
        });
    });
    

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "scrapeDone") {
            // Handle the message indicating scrape is done
            // Example: update UI or notify user
            console.log("Scraping done.");
        }
    });
} catch (error) {
    console.error("An error occurred in the popup script:", error);
}
