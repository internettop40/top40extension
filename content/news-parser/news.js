var news = (function() {
  var module = {
    apiData: {}
  };

  module.run = function () {
    // get url info
    var urlInfo = main.getUrlInfo();

    // fetch user location info, then call parse function
    function getUserLocation (userLocation) {
      module.apiData.geolocation = userLocation;
      module.parseNews(urlInfo).then(function(data) {
        if (!data.newsId || !data.newsId.length) {
          return;
        }

        module.apiData.data = data;
        module.alreadyRead(data.newsId).then(function (newsRead) {
          if(!newsRead) {
            module.prepareData(module.apiData);
          } else {
            console.log('news already read: ' + data.newsId);
          }
        });
      }, function (err) {
        console.log(err);
      });
    }
    geolocation.getLocationInfo(getUserLocation);
  };

  module.parseNews = function (urlInfo) {
    var promise = new Promise(function(resolve, reject) {
      var newsData = {};

      var parsedData = {
        newsId: '',
        newsTitle: '',
        newsContent: '',
        newsImageUrl: ''
      };
      switch (urlInfo.host) {
        case 'www.yahoo.com':
          parsedData = yahooParser.parseData(urlInfo);
          break;
        case 'www.huffingtonpost.com':
          parsedData = {};
          break;
        default:
          parsedData = {};
          break;
      }

      newsData = parsedData;
      newsData.newsUrl = urlInfo.url;

      resolve(newsData);
    });

    return promise;
  };

  module.buildPostContent = function (payloadData) {
    return "<div class='top40-news-wrapper'>" +
              "<div class='top40-news-image'>" +
                "<img src='" + payloadData.newsImageUrl + "' />" +
              "</div>" +
              payloadData.newsContent +
           "</div>";
  }

  module.prepareData = function (payload) {
    if (!payload.data.newsId) {
      return;
    }

    // fetch email first!
    main.getUserEmailOrId().then(function(data) {
      var email_or_id = data;
      // this is the data format that all submissions will require
      payload.wp_data = {
        user_email_or_id: email_or_id,
        post_content: module.buildPostContent(payload.data),
        post_title: payload.data.newsTitle,
        post_name: "top40-news-" + payload.data.newsId,
        post_type: 'top40-news'
      };
      console.log('sending: ' + JSON.stringify(payload));
      module.sendData(payload);
    }, function(err) {
      // do nothing
      console.log('no email or username found!');
    });
  }

  module.sendData = function (payload) {
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
    module.addRead(payload.data.newsId);
  };

  // returns true if news already read, false if not read
  module.alreadyRead = function(newsId) {
    var promise = new Promise(function(resolve, reject) {
      // getNewsRead must return { newsId: {newsId: "asdf", expirationTime: 12345} }
      chrome.runtime.sendMessage({type: "getNewsRead", key: "news-read"}, function(response) {
        var newsRead = response;

        var readInfo = newsRead[newsId];
        if(!readInfo) {
          // resolving false since not found in readInfo
          resolve(false);
          return;
        }

        var timeNow = (new Date().getTime()) / 1000;
        var expirationTime = readInfo['expirationTime'];
        if (expirationTime && expirationTime < timeNow) {
          // then we need to remove this item
          delete(newsRead[newsId]);
          chrome.runtime.sendMessage({type: "updateNewsRead", data: newsRead, key: "news-read"});
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
    return promise;
  };

  module.addRead = function(newsId) {
    // getNewsRead must return { newsId: {newsId: "asdf", expirationTime: 12345} }
    chrome.runtime.sendMessage({type: "getNewsRead", key: "news-read"}, function(response) {
      // first of all, clean up expired news before adding new one
      var newsRead = module.cleanUpNewsRead(response);

      var duration = 60 * 60 * 24; // 24 hours!
      var timeNow = (new Date().getTime()) / 1000;
      var expirationTime = timeNow + duration;
      var readInfo = {
        "newsId": newsId,
        "expirationTime": expirationTime
      };
      newsRead[newsId] = readInfo;
      chrome.runtime.sendMessage({type: "updateNewsRead", data: newsRead, key: "news-read"});
    });
  };

  module.cleanUpNewsRead = function(newsRead) {
    for (var newsId in newsRead) {
      var readInfo = newsRead[newsId];
      var timeNow = (new Date().getTime()) / 1000;
      var expirationTime = readInfo['expirationTime'];
      if (expirationTime && expirationTime < timeNow) {
        // then we need to remove this item
        delete(newsRead[newsId]);
      }
    }

    return newsRead;
  };

  main.runOnUrlChange(module.run);

  return module;
});

$(document).ready(news);
