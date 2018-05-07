var youtube = (function (run_mode = true) {
  var module = {
    watchVideoInterval: 5000,
    apiData: {}
  };

  module.run = function () {

    // get url info
    var urlInfo = main.getUrlInfo();

    // fetch user location info, then call parse function
    function getUserLocation (userLocation) {
      // wait for user to watch video for some time, and then parse the video
      setTimeout(function(){
        module.apiData.geolocation = userLocation;
        module.parseYoutube(urlInfo).then(function(data) {
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
  };

  module.parseYoutube = function (urlInfo) {
    var promise = new Promise(function(resolve, reject) {

      var youtubeData = {}; // api data to send to the server
      var videoId = main.getParameterByName('v', urlInfo.url);
      var formattedUrl = urlInfo.origin + urlInfo.pathname + "?v=" + videoId;
      var isMusicVideo = false;
      var videoTitle = $('h1.title').text();

      // we have to click the more-button for screen scraping to work... unfortunately.
      $('.more-button').click();
      setTimeout(function() {
        $('.ytd-metadata-row-container-renderer').each(function() {
            var metadataText = $(this).text().replace(/\s/g, '');
            if (metadataText === 'CategoryMusic') {
              isMusicVideo = true;
            }
        });
        $('.less-button').click();

        // at this point, we know if a video is a music video or not!
        youtubeData.videoId = videoId;
        youtubeData.videoTitle = videoTitle;
        youtubeData.videoUrl = formattedUrl;
        youtubeData.isMusicVideo = isMusicVideo;
        resolve(youtubeData);
      }, 100);
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
        post_name: "youtube-" + payload.data.videoId,
        post_type: 'youtube'
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
    module.addWatched(payload.data.videoId);
  }

  // returns true if video already watched, false if not watched
  module.alreadyWatched = function(videoId) {
    var promise = new Promise(function(resolve, reject) {
      // getVideosWatched must return { videoId: {videoId: "asdf", expirationTime: 12345} }
      chrome.runtime.sendMessage({type: "getVideosWatched", key: "videos-watched"}, function(response) {
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
          chrome.runtime.sendMessage({type: "updateVideosWatched", data: videosWatched, key: "videos-watched"});
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
    chrome.runtime.sendMessage({type: "getVideosWatched", key: "videos-watched"}, function(response) {
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
      chrome.runtime.sendMessage({type: "updateVideosWatched", data: videosWatched, key: "videos-watched"});
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

  if (run_mode != false) {
    console.log('lets run');
    main.runOnUrlChange(module.run);
  }

  return module;
});

if (window.location.hostname == "www.youtube.com") {
    $(document).ready(youtube);
}
