var facebook = (function (run_mode = true) {
  var module = {
    apiData: {},
    watchPhotoInterval: 5000
  };

  module.run = function () {
    if (module.isPhotoPage()) {
      var urlInfo = main.getUrlInfo();

      // fetch user location info, then call parse function
      function getUserLocation (userLocation) {
        // wait for user to watch photo for some time, and then parse the photo
        setTimeout(function(){
          module.apiData.geolocation = userLocation;
          module.parseFacebook(urlInfo).then(function(data) {
            module.apiData.data = data;
            module.alreadyWatched(data.photoId).then(function(watched) {
              if (!watched) {
                module.prepareData(module.apiData);
              } else {
                console.log('already watched: ' + data.photoId);
              }
            });
          }, function(err) {
            console.log('error');
          });
        }, module.watchPhotoInterval);
      }
      geolocation.getLocationInfo(getUserLocation);
    }
  };

  module.parseFacebook = function (urlInfo) {
    var promise = new Promise(function(resolve, reject) {
      var facebookData = {
        photoId: urlInfo.url.match(/\/photos\/(.*)\/\?/)[1],
        photoUrl: urlInfo.url,
        photoTitle: $('title').text().replace(/^\(\d+\) /, "").replace(/ - Facebook Search$/, "")
      }; // api data to send to the server

      resolve(facebookData);
    });
    return promise;
  };

  module.buildPostContent = function(payloadData) {
    return payloadData.photoUrl;
  };

  module.prepareData = function (payload) {
    if (!payload.data.photoId) {
      return;
    }

    // fetch email first!
    main.getUserEmailOrId().then(function(data) {
      var email_or_id = data;
      // this is the data format that all submissions will require
      payload.wp_data = {
        user_email_or_id: email_or_id,
        post_content: module.buildPostContent(payload.data),
        post_title: payload.data.photoTitle,
        post_name: "facebook-" + payload.data.photoId,
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
    module.addWatched(payload.data.photoId);
  };

  // returns true if photo already watched, false if not watched
  module.alreadyWatched = function(photoId) {
    var promise = new Promise(function(resolve, reject) {
      // getPhotosWatched must return { photoId: {photoId: "asdf", expirationTime: 12345} }
      chrome.runtime.sendMessage({type: "getPhotosWatched", key: "fb-photos-watched"}, function(response) {
        var photosWatched = response;

        var watchInfo = photosWatched[photoId];
        if(!watchInfo) {
          // resolving false since not found in watchInfo
          resolve(false);
          return;
        }

        var timeNow = (new Date().getTime()) / 1000;
        var expirationTime = watchInfo['expirationTime'];
        if (expirationTime && expirationTime < timeNow) {
          // then we need to remove this item
          delete(photosWatched[photoId]);
          chrome.runtime.sendMessage({type: "updatePhotosWatched", data: photosWatched, key: "fb-photos-watched"});
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
    return promise;
  };

  module.addWatched = function(photoId) {
    // getPhotosWatched must return { photoId: {photoId: "asdf", expirationTime: 12345} }
    chrome.runtime.sendMessage({type: "getPhotosWatched", key: "fb-photos-watched"}, function(response) {
      // first of all, clean up expired photos before adding new one
      var photosWatched = module.cleanUpWatched(response);

      var duration = 60 * 60 * 24; // 24 hours!
      var timeNow = (new Date().getTime()) / 1000;
      var expirationTime = timeNow + duration;
      var watchInfo = {
        "photoId": photoId,
        "expirationTime": expirationTime
      };
      photosWatched[photoId] = watchInfo;
      chrome.runtime.sendMessage({type: "updatePhotosWatched", data: photosWatched, key: "fb-photos-watched"});
    });
  };

  module.cleanUpWatched = function(photosWatched) {
    for (var photoId in photosWatched) {
      var watchInfo = photosWatched[photoId];
      var timeNow = (new Date().getTime()) / 1000;
      var expirationTime = watchInfo['expirationTime'];
      if (expirationTime && expirationTime < timeNow) {
        // then we need to remove this item
        delete(photosWatched[photoId]);
      }
    }

    return photosWatched;
  };

  module.isPhotoPage = function () {
    return /.*\/photos\/.*/.test(window.location.href);
  };

  if (run_mode != false) {
    if (module.isPhotoPage()) {
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
