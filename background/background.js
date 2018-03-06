var browser = browser == null ? chrome : browser;

// trigger faster update!
function requestUpdate() {
  if (navigator.userAgent.search("Chrome") != -1) {
    browser.runtime.requestUpdateCheck(function(status) {
      if (status == "update_available") {
          browser.runtime.reload();
        }
    });
  } else {
    browser.runtime.onUpdateAvailable.addListener(function(details) {
      browser.runtime.reload();
    });
  }
}
// check for update every 1 minute (60 seconds)
requestUpdate();
setInterval(function(){ requestUpdate(); }, 60000);

function detectUrlChange() {
  //Listen for when a Tab changes state
  var prevUrl = '';
  browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
      // to prevent duplicate entries caused by double changeInfo events
      var urlSeen = {};

      if(changeInfo && changeInfo.status == "complete" && tab.url !== prevUrl && !urlSeen[tab.url]){
        urlSeen[tab.url] = true;
        prevUrl = tab.url;
        browser.tabs.sendMessage(tabId, {data: tab}, function(response) {});
        setTimeout(function() { delete(urlSeen[tab.url]); }, 3000);
      }
  });
}

detectUrlChange();

browser.runtime.onMessage.addListener(function(message,sender,sendResponse){
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

      browser.tabs.create({
          url: browser.extension.getURL('background/dialog.html'),
          active: true
      });
  } else if (message.type === 'getEmailOrId') {
    sendResponse(localStorage.getItem('email_or_id'));
  } else if (message.type === 'getVideosWatched') {
    var videosWatched = JSON.parse(localStorage.getItem('videos-watched') || '{}');
    sendResponse(videosWatched);
  } else if (message.type === 'updateVideosWatched') {
    var videosWatched = message.data;
    localStorage.setItem('videos-watched', JSON.stringify(videosWatched));
  } else if (message.type === 'openDynamicPosts') {
    openDynamicPosts();
  }
});

function openDynamicPosts () {
  browser.windows.getCurrent(function(w) {
    // create the tab,
    browser.tabs.create({
        url: browser.extension.getURL('background/dynamicPosts.html'),
        active: true
    });
  });
}

function setEmailOrId(email_or_id) {
    // Do something, eg..:
    localStorage.setItem('email_or_id', email_or_id);
};
