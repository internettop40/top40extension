var facebook = (function (run_mode = true) {
  var module = {
    apiData: {},
    watchVideoInterval: 5000
  };

  module.run = function () {
    if (module.isVideoPage()) {
      var urlInfo = main.getUrlInfo();

      // fetch user location info, then call parse function
      function getUserLocation (userLocation) {
        // wait for user to watch video for some time, and then parse the video
        setTimeout(function(){
          module.apiData.geolocation = userLocation;
          module.parseFacebook(urlInfo).then(function(data) {
            module.apiData.data = data;
            module.alreadyWatched(data.videoId).then(function(watched) {
              if (!watched) {
                module.prepareData(module.apiData);
              } else {
                console.log('already watched: ' + data.videoId);
              }
            });
          }, function(err) {
            console.log('error');
          });
        }, module.watchVideoInterval);
      }
      geolocation.getLocationInfo(getUserLocation);
    }
  };

  module.parseFacebook = function (urlInfo) {
    var promise = new Promise(function(resolve, reject) {
      var facebookData = {
        videoId: urlInfo.url.match(/\/videos\/(\d+)\/$/)[1],
        videoUrl: urlInfo.url,
        videoTitle: $('title').text().replace(/ - Facebook Search$/, "")
      }; // api data to send to the server

      resolve(facebookData);
    });
    return promise;
  };

  module.buildPostContent = function(payloadData) {
    return payloadData.videoUrl;
  };

  module.prepareData = function (payload) {
    if (!payload.data.videoId) {
      return;
    }

    // fetch email first!
    main.getUserEmailOrId().then(function(data) {
      var email_or_id = data;
      // this is the data format that all submissions will require
      payload.wp_data = {
        user_email_or_id: email_or_id,
        post_content: module.buildPostContent(payload.data),
        post_title: payload.data.videoTitle,
        post_name: "facebook-" + payload.data.videoId,
        post_type: 'facebook'
      };
      console.log('sending: ' + JSON.stringify(payload));
      module.sendData(payload);
    }, function(err) {
      // do nothing
      console.log('no email or username found!');
    });
  };

  module.sendData = function(payload) {
    $(function() {
      $.ajax({
        type: 'POST',
        url: main.base_url + '/add_post/',
        data: payload,
        error: function(err) {
          console.log('error: ' + err);
        },
        dataType: 'json',
        success: function(data) {
          console.log(data);
        }
      });
    });
    //module.addWatched(payload.data.videoId);
  };

  // returns true if video already watched, false if not watched
  module.alreadyWatched = function(videoId) {
    var promise = new Promise(function(resolve, reject) {
      // getVideosWatched must return { videoId: {videoId: "asdf", expirationTime: 12345} }
      chrome.runtime.sendMessage({type: "getVideosWatched", key: "fb-videos-watched"}, function(response) {
        var videosWatched = response;

        var watchInfo = videosWatched[videoId];
        if(!watchInfo) {
          // resolving false since not found in watchInfo
          resolve(false);
          return;
        }

        var timeNow = (new Date().getTime()) / 1000;
        var expirationTime = watchInfo['expirationTime'];
        if (expirationTime && expirationTime < timeNow) {
          // then we need to remove this item
          delete(videosWatched[videoId]);
          chrome.runtime.sendMessage({type: "updateVideosWatched", data: videosWatched, key: "fb-videos-watched"});
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
    return promise;
  };

  module.addWatched = function(videoId) {
    // getVideosWatched must return { videoId: {videoId: "asdf", expirationTime: 12345} }
    chrome.runtime.sendMessage({type: "getVideosWatched", key: "fb-videos-watched"}, function(response) {
      // first of all, clean up expired videos before adding new one
      var videosWatched = module.cleanUpWatched(response);

      var duration = 5; //60 * 60 * 24; // 24 hours!
      var timeNow = (new Date().getTime()) / 1000;
      var expirationTime = timeNow + duration;
      var watchInfo = {
        "videoId": videoId,
        "expirationTime": expirationTime
      };
      videosWatched[videoId] = watchInfo;
      chrome.runtime.sendMessage({type: "updateVideosWatched", data: videosWatched, key: "fb-videos-watched"});
    });
  };

  module.cleanUpWatched = function(videosWatched) {
    for (var videoId in videosWatched) {
      var watchInfo = videosWatched[videoId];
      var timeNow = (new Date().getTime()) / 1000;
      var expirationTime = watchInfo['expirationTime'];
      if (expirationTime && expirationTime < timeNow) {
        // then we need to remove this item
        delete(videosWatched[videoId]);
      }
    }

    return videosWatched;
  };

  module.isVideoPage = function () {
    return /\/videos\/(\d+)/.test(window.location.href);
  };

  if (run_mode != false) {
    if (module.isVideoPage()) {
      module.run();
      setTimeout(function() {
        main.runOnUrlChange(module.run);
      }, 5000);
    } else {
      main.runOnUrlChange(module.run);
    }
  }

  return module;
});

if (window.location.hostname == "www.facebook.com") {
    $(document).ready(facebook);
}
