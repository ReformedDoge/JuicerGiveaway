try {
let requestUrl, requestHeaders, isScrapeActive = false,
    keys = {
        user: "user",
        cursorBottom: "cursor-bottom"
    },
    usersData = [],
    userIdSet = new Set,
    cursor = "",
    scrapeInterval,
    isPaused = false,
    isRunning = false,
    includeRetweet = true;
const maxTweetCount = 10000;

function setScrapeTimer() {
    isRunning = true;
    console.log("Scraping in progress");
    scrapeInterval = setInterval(() => {
        if (requestUrl && isScrapeActive) {
            const headers = new Headers;
            var cursorMatch;
            isPaused = false;
            requestHeaders.forEach(header => {
                headers.append(header.name, header.value)
            });
            requestUrl = requestUrl.replace("count%22%3A20%2C%22", "count%22%3A100%2C%22");
            if (cursor) {
                if (requestUrl.includes("cursor%22%3A%22")) {
                    cursorMatch = /cursor%22%3A%22(.*)%22%2C%22/g.exec(requestUrl);
                    if (cursorMatch) {
                        cursorMatch = cursorMatch[0];
                        requestUrl = requestUrl.replace(cursorMatch, "cursor%22%3A%22" + encodeURIComponent(cursor) + "%22%2C%22");
                    }
                } else {
                    requestUrl = requestUrl.replace("includePromotedContent", "cursor%22%3A%22" + encodeURIComponent(cursor) + "%22%2C%22includePromotedContent");
                }
            }
            fetch(requestUrl, {
                method: "GET",
                headers: headers,
                credentials: "include"
            }).then(response => response.json()).then(data => {
                chrome.storage.local.get(["rbIncludeRetweet"], response => {
                    if (response.rbIncludeRetweet !== undefined) {
                        includeRetweet = response.rbIncludeRetweet;
                    }
                    processLikes(data);
                });
            }).catch(error => {
                console.error(error)
            })
        }
    }, 4000)
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let day = date.getDate().toString().padStart(2, "0");
    let hours = date.getHours().toString().padStart(2, "0");
    let minutes = date.getMinutes().toString().padStart(2, "0");
    let seconds = date.getSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function processLikes(responseData) {
    try {
        if (responseData && responseData.data.favoriters_timeline.timeline.instructions.length > 0) {
            var instructions = responseData.data.favoriters_timeline.timeline.instructions;
            let entries = [];
            for (const instruction of instructions) {
                if ("TimelineAddEntries" === instruction.type) {
                    entries = instruction.entries;
                }
            }
            let hasNewTweet = false;
            for (const entry of entries) {
                try {
                    var userData = {
                        ID: "",
                        UserName: "",
                        ScreenName: "",
                        UserAccountCreationDate: "",
                        CanDM: "",
                        Bio: "",
                        UserFollowerCount: 0,
                        UserFollowingCount: 0,
                        ListedCount: 0,
                        StatusesCount: 0,
                        MediaCount: 0,
                        ProfileImageURL: "",
                        Location: "",
                        IsVerified: false,
                        IsBlueVerified: false
                    };
                    if (entry.entryId.startsWith(keys.user)) {
                        hasNewTweet = true;
                        if (!userIdSet.has(entry.content.itemContent.user_results.result.id)) {
                            if ("UserUnavailable" === entry.content.itemContent.user_results.result.__typename) {
                                console.log("UserUnavailable", entry.content.itemContent.user_results.result.reason);
                            } else {
                                userData.ID = entry.content.itemContent.user_results.result.rest_id ?? "-";
                                userData.UserName = entry.content.itemContent.user_results.result.legacy.name ?? "-";
                                userData.ScreenName = "@" + (entry.content.itemContent.user_results.result.legacy.screen_name ?? "-");
                                userData.CanDM = entry.content.itemContent.user_results.result.legacy.can_dm ?? "-";
                                userData.UserAccountCreationDate = formatDate(entry.content.itemContent.user_results.result.legacy.created_at) ?? "-";
                                userData.Bio = entry.content.itemContent.user_results.result.legacy.description ?? "-";
                                userData.UserFollowerCount = entry.content.itemContent.user_results.result.legacy.followers_count ?? "-";
                                userData.UserFollowingCount = entry.content.itemContent.user_results.result.legacy.friends_count ?? "-";
                                userData.ListedCount = entry.content.itemContent.user_results.result.legacy.listed_count ?? "-";
                                userData.Location = entry.content.itemContent.user_results.result.legacy.location ?? "-";
                                userData.MediaCount = entry.content.itemContent.user_results.result.legacy.media_count ?? "-";
                                userData.StatusesCount = entry.content.itemContent.user_results.result.legacy.statuses_count ?? "-";
                                userData.ProfileImageURL = entry.content.itemContent.user_results.result.legacy.profile_image_url_https ?? "-";
                                userData.IsVerified = entry.content.itemContent.user_results.result.legacy.verified ?? "-";
                                userData.IsBlueVerified = entry.content.itemContent.user_results.result.is_blue_verified ?? "-";
                                userIdSet.add(userData.id);
                                usersData.push(userData);
                            }
                        }
                    } else if (entry.entryId.startsWith(keys.cursorBottom)) {
                        userData.cursorBottom = entry.content.value;
                        cursor = entry.content.value;
                    }
                } catch (error) {
                    console.log("Error", error);
                }
            }
            if (usersData.length >= maxTweetCount) {
                usersData = usersData.slice(0, maxTweetCount);
            }
            try {
            chrome.tabs.sendMessage(I, {
                type: "updateProgress",
                data: usersData
            }).then(() => {
                if (!hasNewTweet) {
                    chrome.tabs.sendMessage(I, {
                        type: "scrapeDone",
                        data: usersData
                    }).then(() => {
                        console.log(usersData);
                        if (scrapeInterval) {
                            clearInterval(scrapeInterval);
                        }
                        S = undefined;
                        isRunning = false;
                        chrome.runtime.sendMessage({
                            type: "scrapeDone"
                        }, (response) => {
                            // Handle response here if needed
                            console.log("scrapeDone message sent successfully");
                        });
                    }).catch(error => {
                        console.error("Error sending scrapeDone message:", error);
                    });
                }
            }).catch(error => {
                console.error("Error sending updateProgress message:", error);
            });
        } catch (error) {
            // Suppress the error, or log it if necessary
            console.error("Error occurred but was suppressed:", error);
        }

        }
    } catch (error) {
        console.log(error);
    }
}

chrome.webRequest.onBeforeSendHeaders.addListener(async request => {
    var cursorMatch;
    if (request.tabId !== I || S === undefined || (requestUrl = request.url).includes("cursor%22%3A%22") && (cursorMatch = /cursor%22%3A%22(.*)%22%2C%22/g.exec(requestUrl)) && (cursorMatch = cursorMatch[0], requestUrl = requestUrl.replace(cursorMatch, "cursor%22%3A%22" + encodeURIComponent(cursor) + "%22%2C%22")), requestHeaders = request.requestHeaders, isScrapeActive = true, !scrapeInterval) {
        setScrapeTimer()
    }
}, {
    urls: ["*://*.x.com/i/api/graphql/*Favoriters*"]
}, ["requestHeaders"]);

let tabUpdated = false;
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (I === tabId && changeInfo.status === "complete" && tab.url === C && S !== undefined) {
        if (!tabUpdated){
            await chrome.tabs.sendMessage(tabId, {
                type: "startScrape",
                user: S,
                myUserInfo: userData
            });
            tabUpdated = true;
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (I && tabId === I) {
        clearInterval(scrapeInterval);
        S = undefined;
        isRunning = false;
        chrome.tabs.sendMessage(I, { type: "scrapeDone" }); // Ensure message is sent when tab is removed
    }
});
let userData, I, C, S;

chrome.runtime.onConnect.addListener(port => {
    if (port.name === "popup") {
        port.onMessage.addListener(async message => {
            if (message.type === "startExport") {
                scrapeInterval = undefined;
                S = message.user;
                usersData = [];
                userIdSet = new Set;
                isPaused = false;
                tabUpdated = false;
                cursor = "";
                chrome.tabs.create({
                    url: message.url
                }, async tab => {
                    I = tab.id;
                    C = message.url;
                });
            } else if (message.type === "checkRunningState") {
                port.postMessage({
                    from: "returnRunningState",
                    isTimerRunning: isRunning,
                    tweetUser: S
                });
            }
        });
        port.onDisconnect.addListener(() => {
        });
    }
});
} catch (error) {
    console.error("An error occurred in the background script:", error);
}