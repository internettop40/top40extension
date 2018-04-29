var dialogTabId = null;

// trigger faster update!
function requestUpdate() {
  if (navigator.userAgent.search("Chrome") != -1) {
    chrome.runtime.requestUpdateCheck(function(status) {
      if (status == "update_available") {
          chrome.runtime.reload();
        }
    });
  } else if (navigator.userAgent.search("Mozilla") != -1 || navigator.userAgent.search("Firefox") != -1) {
    chrome.runtime.onUpdateAvailable.addListener(function(details) {
      chrome.runtime.reload();
    });
  }
}
// check for update every 1 minute (60 seconds)
requestUpdate();
setInterval(function(){ requestUpdate(); }, 60000);

function detectUrlChange() {
  //Listen for when a Tab changes state
  var prevUrl = '';
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
      // to prevent duplicate entries caused by double changeInfo events
      var urlSeen = {};
      if(changeInfo && changeInfo.status == "complete" && tab.url !== prevUrl && !urlSeen[tab.url]){
        urlSeen[tab.url] = true;
        prevUrl = tab.url;
        chrome.tabs.sendMessage(tabId, {data: tab}, function(response) {});
        setTimeout(function() { delete(urlSeen[tab.url]); }, 3000);
      }
  });
}

detectUrlChange();

chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
  var timeNow = (new Date().getTime()) / 1000; // current unixtime in seconds

  if (message.type == 'setLocation') {
    localStorage.setItem('geolocation', JSON.stringify(message.data));
    var duration = 60 * 60 * 24; // 24 hours!
    var expirationTime = timeNow + duration;
    localStorage.setItem('geolocation_expiration', expirationTime);
    sendResponse({});
  } else if (message.type == 'getLocation') {
    var expirationTime = localStorage.getItem('geolocation_expiration');
    // if location has not been updated for past 24 hours, then update.
    if (expirationTime && expirationTime < timeNow) {
      localStorage.removeItem('geolocation');
      localStorage.removeItem('geolocation_expiration');
    }

    var geoloc = localStorage.getItem('geolocation') || '{}';
    sendResponse({data: JSON.parse(geoloc)});
  } else if (message.type === 'setEmailOrId') {
      var email_or_id = localStorage.getItem('email_or_id');
      if (email_or_id != null) {
        return;
      }

      chrome.tabs.create({
          url: chrome.extension.getURL('background/dialog.html'),
          active: true
      }, function (dialogTab) {
        dialogTabId = dialogTab.id;
      });
  } else if (message.type === 'getEmailOrId') {
    sendResponse(localStorage.getItem('email_or_id'));
  } else if (
    message.type === 'getVideosWatched' ||
    message.type === 'getNewsRead'
  ) {
    var info = JSON.parse(localStorage.getItem(message.key) || '{}');
    sendResponse(info);
  } else if (
    message.type === 'updateVideosWatched' ||
    message.type === 'updateNewsRead'
  ) {
    localStorage.setItem(message.key, JSON.stringify(message.data));
  } else if (message.type === 'openDynamicPosts') {
    openDynamicPosts(message);
  }
});

function openDynamicPosts (message) {
  var currentTab;
  var query = { active: true, currentWindow: true };
  chrome.tabs.query(query, function(t) {
    currentTab = t[0];
  });


  chrome.windows.getCurrent(function(w) {
    var dynamicPostsUrl = 'background/dynamicPosts.html';
    if ('params' in message) {
      dynamicPostsUrl += message['params'];
    }

    // create the tab,
    chrome.tabs.create({
        url: chrome.extension.getURL(dynamicPostsUrl),
        active: true
    });

    if ('replaceTab' in message) {
      chrome.tabs.remove(currentTab.id);
    }
  });
}

function setEmailOrId(email_or_id) {
    // Do something, eg..:
    localStorage.setItem('email_or_id', email_or_id);
};

function closeDialogWindow() {
  if (dialogTabId != null) {
    chrome.tabs.get(dialogTabId, function (tab) {
      if (tab.url.search("dialog.html") != -1) {
        chrome.tabs.remove(tab.id);
      }
    });
  }
}
