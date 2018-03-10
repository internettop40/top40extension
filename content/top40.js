var top40 = (function() {
  var module = {};

  module.setExtensionInstalled = function () {
    if (Cookies) {
      Cookies.set('top40_extension_installed', true, { path: '/' });
    }
  };

  module.setExtensionInstalled();

  return module;
} ());
