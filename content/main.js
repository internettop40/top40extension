var browser = browser == null ? chrome : browser;

var main = (function () {
  var module = {
    run_mode: 'prod',//'staging',
    base_url: ''
  };

  if (module.run_mode == 'prod') {
    module.base_url = 'https://www.internettop40.com/wp-json/wp/v2';
  } else {
    module.base_url = 'https://www.staging.internettop40.com/wp-json/wp/v2';
  }

  module.runOnUrlChange = function (cb) {
    function onUrlChange (request, sender, sendResponse) {
        cb();
    }
    browser.runtime.onMessage.addListener(onUrlChange);
  }

  module.getUrlInfo = function () {
    var info = {
      host: window.location.host,
      hostname: window.location.hostname,
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      origin: window.location.origin
    };

    return info;
  };

  module.getParameterByName = function (name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  module.setUserEmailOrId = function () {
    browser.runtime.sendMessage({type: 'setEmailOrId'});
  }

  module.getUserEmailOrId = function () {
    var promise = new Promise(function(resolve, reject) {
      browser.runtime.sendMessage({type: "getEmailOrId"}, function(response) {
        if (response == null) {
          module.setUserEmailOrId();
          reject();
        } else {
          resolve(response);
        }
      });
    });
    return promise;
  }

  module.openDynamicPosts = function () {
    browser.runtime.sendMessage({type: 'openDynamicPosts'});
  }

  module.addDynamicPostsButton = function () {
    if (document.getElementById('dynamicPostsButton') != null) {
      $('#dynamicPostsButton').remove();
    }
    var openDynamicPostsButton = "<button id='dynamicPostsButton'>My Top40 List</button>";
    $('div.g1-drop-the-search').parent().append(openDynamicPostsButton);
    $('#dynamicPostsButton').click(function(){
      module.openDynamicPosts();
    });
  }
  module.addDynamicPostsButton();
  module.getUserEmailOrId();

  return module;
} ());
