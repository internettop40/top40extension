var geolocation = (function () {
  var module = {
    location: {
      city: '',
      region: '', // or state/province
      country: '',
      postal: '',
      found: false
    },
    callbackFn: null
  };

  /**
   *
   */
  module.getLocationInfo = function (callbackFn) {
    module.callbackFn = callbackFn;
    chrome.runtime.sendMessage({type: "getLocation"}, function(response) {
      if (Object.keys(response.data).length > 0) {
        module.location = response.data;
        if (module.callbackFn) {
          module.callbackFn(module.location);
        }
        return;
      } else {
        if (!navigator.geolocation){
          console.log('geolocation is not supported by your browser');
          // get ip info!
          module.getIpAddr();
          return;
        }

        function success(position) {
          var latitude  = position.coords.latitude;
          var longitude = position.coords.longitude;

          module.getAddressFromPosition(latitude, longitude);
        }

        function error() {
          console.log('geolocation error!');

          // get ip info!
          module.getIpAddr();
        }

        navigator.geolocation.getCurrentPosition(success, error);
      }
    });
  };

  /**
   *
   */
  module.getAddressFromPosition = function (latitude, longitude) {
    var apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&sensor=true';

    function parseResults(data) {
      var parsedAddress = {
        city: '',
        region: '',
        country: '',
        postal: ''
      };

      var addressComponents = data[0].address_components;
      var foundCnt = 0;

      for (index in addressComponents) {
        address = addressComponents[index];
        var types = address.types;
        if (types && types.indexOf('locality') > -1 ) {
          parsedAddress.city = address.long_name; foundCnt++;
        } else if (types && types.indexOf('administrative_area_level_1') > -1) {
          parsedAddress.region = address.long_name; foundCnt++;
        } else if (types && types.indexOf('country') > -1) {
          parsedAddress.country = address.long_name; foundCnt++;
        } else if (types && types.indexOf('postal_code') > -1) {
          parsedAddress.postal = address.long_name; foundCnt++;
        }
      }

      // if all four address attributes parsed, then update location
      if (foundCnt == 4) {
        module.updateLocation(
          parsedAddress.city,
          parsedAddress.region,
          parsedAddress.country,
          parsedAddress.postal
        );
      } else {
        // use address lookup by IP as a backup
        module.getIpAddr();
      }
    };

    $(function() {
      $.ajax({
        type: 'GET',
        url: apiUrl,
        data: {
          format: 'json'
        },
        error: function(error) {
          console.log('maps.googleapis error!');
        },
        dataType: 'json',
        success: function(data) {
          parseResults(data.results);
        }
      });
    });
  }

  /**
   *
   */
  module.getIpAddr = function () {
    $(function() {
      $.ajax({
        type: 'GET',
        url: 'https://api.ipify.org?format=json',
        data: {
          format: 'json'
        },
        error: function() {
          console.log('api.ipify error!');
        },
        dataType: 'json',
        success: function(data) {
          console.log(data);
          module.getAddressFromIp(data.ip);
        }
      });
    });
  };

  /**
   * get approximate address from IP
   */
  module.getAddressFromIp = function (ipAddr) {
    $(function() {
      $.ajax({
        type: 'GET',
        url: 'https://ipinfo.io/' + ipAddr,
        data: {
          format: 'json'
        },
        error: function() {
          console.log('ipinfo error!');
        },
        dataType: 'json',
        success: function(data) {
          module.updateLocation(data.city, data.region, data.country, data.postal);
        }
      });
    });
  }

  /**
   *
   */
  module.updateLocation = function (city, region, country, postal) {
    if (city && region && country && postal) {
      module.location.city = city;
      module.location.region = region;
      module.location.country = country;
      module.location.postal = postal;
      module.location.found = true;

      chrome.runtime.sendMessage({type: "setLocation", data: module.location}, function(response) {
        //console.log(response.farewell);
      });

      if (module.callbackFn) {
        module.callbackFn(module.location);
      }
    }
  }

  return module;
} ());
