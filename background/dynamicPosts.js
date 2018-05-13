/*
var payload = {
  'post_type': 'youtube',
  'friends': 'joe91e' // username or email joe91e@gmail.com
  //'location': {'city' : 4}
};
*/

var youtube_module = youtube(false);

function addSpinner() {
  $("#loadingSpinner").spin("large", "black");
  /*var opts = {
    lines: 12, // The number of lines to draw
    length: 7, // The length of each line
    width: 5, // The line thickness
    radius: 10, // The radius of the inner circle
    color: '#000', // #rbg or #rrggbb
    speed: 1, // Rounds per second
    trail: 100, // Afterglow percentage
    shadow: true // Whether to render a shadow
  };
  var target = document.getElementById('foo');
  var spinner = new Spinner(opts).spin(target);*/
}

$(document).ready(function() {
  load_youtube_iframe_api();

  // check if search query is present.
  var validQueryPresent = loadFromSearchQuery();

  // set search form as collapsible
  $('#searchForm').collapse({
    toggle: !validQueryPresent // show if and only if no search query parameters
  });

  getFriendsInfo();

  $('#datepicker').datepicker({
    format: 'm/d/yyyy',
    startDate: '-365d',
    endDate: '0d',
  });

  var defaultStart = moment().subtract(7, 'days').format('l');
  var defaultEnd = moment().format('l');
  $('#startDate').val(defaultStart);
  $('#endDate').val(defaultEnd);

  getLocationInfo().then(function(location_data) {
    setLocationInfo(location_data);
    $('#getListBtn').prop('disabled', false);
  }, function(error) {
    console.log(error);
  });

  // handle collapsible toggling
  $('#getListBtn, #showFilterBtn, #hideFilterBtn').click(function() {
    toggleSearchFilters($(this).attr('id'));
  });
  // handle location filter toggle
  $('#locationFilterType').change(function() {
    var locationType = $(this).val();
    $('.locationFilterSelections').hide();
    if (locationType === 'Country') {
      $('#locationFilterCountry').show();
    } else if (locationType === 'Region') {
      $('#locationFilterRegion').show();
    } else {
      $('#locationFilterCity').show();
    }
  });

  $('#searchForm').submit(function(e){
    showLoading();
    e.preventDefault();
    var filterData = {};

    // parse the form
    var postType = $('#postTypeFilter').val();
    filterData['post_type'] = postType;

    var defaultStart = moment().subtract(7, 'days').format('l');
    var defaultEnd = moment().format('l');
    var postStartDate = $('#startDate').val();
    var postEndDate = $('#endDate').val();
    if (postStartDate == null || postStartDate.length == 0) { postStartDate = defaultStart; }
    if (postEndDate == null || postEndDate.length == 0) { postEndDate = defaultEnd; }
    filterData['start_date'] = moment(postStartDate).format("YYYY-MM-DD");
    filterData['end_date'] = moment(postEndDate).format("YYYY-MM-DD");

    var filterByFriends = $('#filterFriendsCheckbox').prop('checked');
    var filterByLocation = $('#filterLocationCheckbox').prop('checked');

    if (filterByFriends) {
      filterData['friends'] = $('#friendsFilterType').val();
    }

    if (filterByLocation) {
      var locationFilterType = $('#locationFilterType').val();
      var locationId = $('#locationFilter' + locationFilterType).val();
      var locationData = {};
      locationData[locationFilterType.toLowerCase()] = locationId;
      filterData['location'] = locationData;
    }

    // start the search!
    getPostIds(filterData);
  });


  $(window).resize(function(){
    var $fbEmbed = $(".facebook-responsive:visible");
    $fbEmbed.css('height', ($fbEmbed.width() + 150) + 'px');
  });
});

function showLoading() {
  $('#results').html('');
  $('#results').hide();
  $('#share-buttons').hide();
  $('#loading').show();
  addSpinner();
}

function toggleSearchFilters(toggleOption) {
  if (toggleOption === 'getListBtn' || toggleOption === 'hideFilterBtn') {
    // hide collapsible
    $('#searchForm').collapse('hide');
    // now toggle buttons
    $('#getListBtn').hide();
    $('#hideFilterBtn').hide();
    $('#showFilterBtn').show();

    if (toggleOption === 'getListBtn') {
        $('#searchForm').submit();
    }
  } else {
    // show collapsible
    $('#searchForm').collapse('show');
    // now toggle buttons
    $('#showFilterBtn').hide();
    $('#getListBtn').show();
    $('#hideFilterBtn').show();
  }
}

function loadFromSearchQuery() {
  var regex = new RegExp('&quot;', 'g');
  var query = window.location.search.replace(regex, '"');
  if (query != "" && query.length > 0 && query.indexOf("?") != -1) {
    var filterData = {};
    query = query.substring(1);
    queryArr = query.split("&");
    for (var idx in queryArr) {
      var filterArr = queryArr[idx].split("=");
      var filterName = filterArr[0].replace('amp;', '');
      var filterValue = decodeURIComponent(filterArr[1]);
      filterData[filterName] = JSON.parse(filterValue);
    }

    if (Object.keys(filterData).length > 0) {
        showLoading();
        console.log(filterData);
        getPostIds(filterData);
        return true;
    }
  }

  return false;
}

function updateUrlWithFilter(filterData) {
  var query = "?";
  for (var filterName in filterData) {
    var filter = filterData[filterName];
    if (query == "?") {
        query += filterName + "=" + JSON.stringify(filter);
    } else {
        query += "&" + filterName + "=" + JSON.stringify(filter);
    }
  }

  // update url without refreshing
  if (history.pushState) {
      var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + query;
      window.history.pushState({path:newurl},'',newurl);
  }
  var shareUrl = 'https://www.internettop40.com/mytop40' + query;
  updateShareButtons(encodeURIComponent(shareUrl));
}

function updateShareButtons(url) {
  var facebookShare = 'https://facebook.com/sharer/sharer.php?u=' + url;
  var regex = new RegExp('"', 'g');
  var twitterShare = 'https://twitter.com/share?text=My%20IT40%20Chart&url=' + encodeURIComponent(decodeURIComponent(url).replace(regex, '&quot;'));
  var googleShare = 'https://plus.google.com/share?text=My%20IT40%20Chart&url=' + url;
  var pinterestShare = 'https://pinterest.com/pin/create/button/?url=' + url + '&description=My%20IT40%20Chart%20' + encodeURIComponent(decodeURIComponent(url).replace(regex, '&quot;'));

  $('#facebookSharebutton').attr('href', facebookShare);
  $('#twitterShareButton').attr('href', twitterShare);
  $('#googleShareButton').attr('href', googleShare);
  $('#pinterestShareButton').attr('href', pinterestShare);
}

function appendSnaxIdToShareLink(snax_id, postInfo) {
  var fbLink = $('#facebookSharebutton').attr('href');
  var twitterLink = $('#twitterShareButton').attr('href');
  var googleLink = $('#googleShareButton').attr('href');
  var pinterestLink = $('#pinterestShareButton').attr('href');

  var snax_id_param = encodeURIComponent("&snax_id=" + snax_id);
  $('#facebookSharebutton').attr('href', fbLink + snax_id_param);
  $('#twitterShareButton').attr('href', twitterLink + snax_id_param);
  $('#googleShareButton').attr('href', googleLink + snax_id_param);

  var pinterestMedia = '';
  var postName = postInfo['post_name'];
  if (/^youtube-/.test(postName)) {
    var videoId = postInfo['post_name'].split('youtube-')[1];
    var imageUrl = "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
    pinterestMedia = "&media=" + imageUrl;
  } else if(/^top40-news-/.test(postName)) {
    var $postContent = $(postInfo['post_content']);
    var thumbnailSrc = $postContent.find('img').attr('src');
    pinterestMedia = "&media=" + thumbnailSrc;
  }
  $('#pinterestShareButton').attr('href', pinterestLink + snax_id_param + pinterestMedia);
}

function getPostIds(filterData) {
  $.ajax({
    type: 'POST',
    url: main.base_url + '/get_filtered_posts/',
    data: filterData,
    error: function(err) {
      console.log('error: ');
      console.log(err);
    },
    dataType: 'json',
    success: function(data) {
      /*
      data = {
        post_id: cnt,
        1234: 1
      }
      */
      if (data != null) {
        updateUrlWithFilter(filterData);
        fetchPostInfo(Object.keys(data), data);
      } else {
        console.log('data is null!');
        console.log(filterData);
      }
    }
  });
}

function getFriendsInfo() {
  main.getUserEmailOrId().then(function(email_or_id) {
    $.ajax({
      type: 'GET',
      url: main.base_url + '/get_user_friends/' + email_or_id,
      error: function(err) {
        console.log(err);
      },
      dataType: 'json',
      success: function(data) {
        for (var idx in data) {
          var friend = data[idx];
          var displayName = friend['display_name']
          if (friend['is_me'] == true) {
            displayName += " (me)";
            var option = "<option selected value='" + friend['ID'] + "'>" + displayName + "</option>";
            $('#friendsFilterType').prepend(option);
          } else {
            var option = "<option selected value='" + friend['ID'] + "'>" + displayName + "</option>";
            $('#friendsFilterType').append(option);
          }
        }
      }
    });
  }, function (err) {
    // do nothing
    console.log('no email or username found!');
  });
}

function getLocationInfo() {
  var promise = new Promise(function(resolve, reject) {
    var all_locations = JSON.parse(localStorage.getItem('all_locations') || '{}');
    var expirationTime = localStorage.getItem('all_location_expiration');
    var timeNow = (new Date().getTime()) / 1000;
    // if location exists and did not expire, then proceed to use.
    if (Object.keys(all_locations).length > 0 &&
        (expirationTime && expirationTime > timeNow))
    {
      resolve(all_locations);
    } else {
      // now we need to fetch fresh data.
      $(function() {
        $.ajax({
          type: 'GET',
          url: main.base_url + '/get_all_locations',
          data: {
            format: 'json'
          },
          error: function() {
            reject('get_all_locations error!');
          },
          dataType: 'json',
          success: function(data) {
            var duration = 60 * 60; // 1 hour
            var expirationTime = timeNow + duration;
            localStorage.setItem('all_location_expiration', expirationTime);
            localStorage.setItem('all_locations', JSON.stringify(data));
            resolve(data);
          }
        });
      });
    }
  });
  return promise;
}

function setLocationInfo(data) {
  function getParentLocation(data, parentId) {
    for (var idx in data) {
      if (data[idx]['geolocation_id'] == parentId) {
        return data[idx];
      }
    }

    return null;
  }

  // first iteration, build display string
  for (var idx in data) {
    var displayString = data[idx]['geolocation'];
    if (data[idx]['type'] === 'region') {
      // need to add country
      var parentCountryId = data[idx]['parent_geolocation_id'];
      var parentCountry = getParentLocation(data, parentCountryId);
      if (parentCountry != null) {
        displayString += ", " + parentCountry['geolocation'];
      }
    } else if (data[idx]['type'] === 'city'){
      // need to add region
      var parentRegionId = data[idx]['parent_geolocation_id'];
      var parentRegion = getParentLocation(data, parentRegionId);
      if (parentRegion != null) {
        displayString += ", " + parentRegion['geolocation'];
      }

      // need to add country
      var parentCountryId = parentRegion['parent_geolocation_id'];
      var parentCountry = getParentLocation(data, parentCountryId);
      if (parentCountry != null) {
        displayString += ", " + parentCountry['geolocation'];
      }
    }
    data[idx]['displayString'] = displayString;
  }

  // second iteration, now add to dropdown
  $('.locationFilterSelections').html('');
  $('.locationFilterSelections').prop('disabled', false);
  for (var idx in data) {
    var location_data = data[idx];
    var location_type = location_data['type'];
    var selectElemId = "locationFilter" + location_type.charAt(0).toUpperCase() + location_type.slice(1);
    var optionString = "<option value='" + location_data['geolocation_id'] + "'>" +
                          location_data['displayString'] +
                       "</option>";
    $('#' + selectElemId).append(optionString);
  }
}

function fetchPostInfo(post_ids, post_view_counts) {
  $.ajax({
    type: 'POST',
    url: main.base_url + '/get_posts_by_ids/',
    data: {"id": post_ids},
    error: function(err) {
      console.log('error: ');
      console.log(err);
    },
    dataType: 'json',
    success: function(data) {
      fetchPostInfoHelper(data, post_view_counts);
    }
  });
}

/**
 * fetches parent post info as well, before displaying contents
 */
function fetchPostInfoHelper(post_info_list, post_view_counts) {
  var parent_post_ids = [];
  var parent_post_exists = {};
  for (var idx in post_info_list) {
    var parent_post_id = post_info_list[idx]['post_parent'];
    if (!(parent_post_id in parent_post_exists)) {
      parent_post_ids.push(parent_post_id);
      parent_post_exists[parent_post_id] = true;
    }
  }
  $.ajax({
    type: 'POST',
    url: main.base_url + '/get_posts_by_ids/',
    data: {"id": parent_post_ids},
    error: function(err) {
      console.log('error: ');
      console.log(err);
    },
    dataType: 'json',
    success: function(parent_post_info) {
      displayPostInfo(post_info_list, parent_post_info, post_view_counts);
    }
  });
}

function sort_by_rank(a,b) {
  // return sort by rank desc;
  if (a.view_count < b.view_count) {
    return 1;
  } else if (a.view_count > b.view_count) {
    return -1;
  }
  return 0;
}

function displayPostInfo(data, parent_data, post_view_counts) {
  // empty the results first!
  $('#loading').hide();

  // merge duplicated items using post_name
  var post_names_combined_view_counts = {};
  var merged_data = []; // list that merges daily and weekly data into 1
  for (var i = 0; i < data.length; i++) {
    var postInfo = data[i];
    // if there is a duplicate entry
    if (postInfo['post_name'] in post_names_combined_view_counts) {
      post_names_combined_view_counts[postInfo['post_name']] += parseInt(post_view_counts[postInfo['ID']]);
    } else {
      post_names_combined_view_counts[postInfo['post_name']] = parseInt(post_view_counts[postInfo['ID']]);
      merged_data.push(data[i]);
    }
  }

  // assign view counts
  for (var i = 0; i < merged_data.length; i++) {
    merged_data[i]['view_count'] = post_names_combined_view_counts[merged_data[i]['post_name']];
  }

  // sort the data by view count desc
  merged_data.sort(sort_by_rank);

  var listsByPage = {}; // items to put in the results section as we paginate.
  var rankToDisplayInfo = {}; // key = rank, value = embed
  var curPage = 0;
  var itemsPerPage = 40; // 40 items at a time!
  var displayCount = 0;
  for (var i = 0; i < merged_data.length; i++) {
    var postInfo = merged_data[i];
    var postName = postInfo['post_name'];

    if (/^youtube-/.test(postName)) {
      var displayInfo = buildYoutubeDisplay(postInfo, parent_data, i+1);
    } else if (/^top40-news-/.test(postName)) {
      var displayInfo = buildNewsDisplay(postInfo, parent_data, i+1);
    } else if (/facebook-/.test(postName)) {
      var displayInfo = buildFacebookDisplay(postInfo, parent_data, i+1);
    } else if (/instagram-/.test(postName)) {
      var displayInfo = buildInstagramDisplay(postInfo, parent_data, i+1);
    }
    if (/^youtube-/.test(postName) ||
        /^top40-news-/.test(postName) ||
        /facebook-/.test(postName) ||
        /instagram-/.test(postName)
    ) {
      curPage = parseInt(displayCount / itemsPerPage);
      // put results in the lists by page
      if (!(curPage in listsByPage)) {
        listsByPage[curPage] = "";
      }
      listsByPage[curPage] += displayInfo["item"];
      rankToDisplayInfo[i+1] = displayInfo;
      displayCount++;

      // update share link here!
      if (i == 0) {
        appendSnaxIdToShareLink(postInfo['ID'], postInfo);
      }
    }
  }

  if (displayCount == 0) {
    var emptyMsg = '<br/><div class="alert alert-warning" role="alert">' +
      '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
      '</button>' +
      'no data matching your current search filters!' +
    '</div>';
    $('#results').append(emptyMsg);
  } else {
    // we have data to display!
    for (var page = 0; page < Object.keys(listsByPage).length; page++) {
      var pageContent = "<div id='page-" + page + "' class='page-results'>" + listsByPage[page] + "</div>";
      $('#results').append(pageContent);
    }
    $('.page-results').hide();
    $('#page-0').show();
    buildPagination(Object.keys(listsByPage).length);

    $('.collapse.embeds').on('show.bs.collapse', function () {
      var $cardBody = $(this).find('.card-body');
      if ($cardBody.hasClass('facebook-responsive')) {
        var width = $(this).parent().width();
        $cardBody.css('height', (width + 80) + 'px');
      }
      // do youtube stuff
      var rank = $(this).attr('rank');
      if ((!$cardBody.html() || !$cardBody.html().length) && ("embed" in rankToDisplayInfo[rank])) {
        $cardBody.append(rankToDisplayInfo[rank]["embed"]);
        new YT.Player(rankToDisplayInfo[rank]["playerId"], {
          videoId: rankToDisplayInfo[rank]["videoId"],
          events: {
            'onStateChange': function (event) {
              if (event.data == YT.PlayerState.PLAYING || event.data == YT.PlayerState.BUFFERING) {
                rankToDisplayInfo[rank]["isPlaying"] = true;

                setTimeout(function() {
                  if (rankToDisplayInfo[rank]["isPlaying"] == true && !("dataSent" in rankToDisplayInfo[rank])) {
                    rankToDisplayInfo[rank]["dataSent"] = true;
                    var vUrl = event.target.getVideoUrl();
                    var vData = event.target.getVideoData();
                    var youtubeData = {
                      data: {
                        videoId: vData.video_id,
                        videoTitle: vData.title,
                        videoUrl: vUrl,
                        isMusicVideo: rankToDisplayInfo[rank]["isMusicVideo"]
                      }
                    };
                    // add geolocation as well
                    geolocation.getLocationInfo(function (userLocation) {
                      youtubeData.geolocation = userLocation;
                      youtube_module.prepareData(youtubeData);
                    });
                  }
                }, 15000);
              } else {
                rankToDisplayInfo[rank]["isPlaying"] = false;
              }
            }
          }
        });
      }
    });

    // convert each one of the anchor tags from loading in current screen to opening in new tab
    $('.card-body a').each(function() {
        $(this).click(function() {
          var link = $(this).attr('href');
          window.open(link);
          return false;
        });
    });
  }
  $('#results').show();
  $('#share-buttons').show();
}

function buildPagination(numPages) {
  // clean up first!
  $('#paginator ul.pagination').html('');

  var prev = '<li id="prevPageBtn" page="prev" class="page-item">' +
          '<a class="page-link" href="#" tabindex="-1"><span class="oi oi-chevron-left" title="chevron left" aria-hidden="true"></span></a>' +
        '</li>';
  var next =  '<li id="nextPageBtn" page="next" class="page-item">' +
          '<a class="page-link" href="#"><span class="oi oi-chevron-right" title="chevron right" aria-hidden="true"></span></a>' +
        '</li>';
  if (numPages > 0) {
    $('#paginator ul.pagination').append(prev);
    for (var page = 0; page < numPages; page++) {
      var pageItem = '<li class="page-item" page="' + page + '" id="pageItem' + page + '"><a class="page-link" href="#">' + parseInt(page+1) + '</a></li>';
      $('#paginator ul.pagination').append(pageItem);
    }
    $('#paginator ul.pagination').append(next);

    // now setup the pagination logic
    $('.page-item').click(function() {
      var page = $(this).attr('page');

      if (page === 'prev') {
        var curPage = $('.page-item.active').attr('page');
        if (parseInt(curPage) > 0) {
          var prevPage = parseInt(curPage) - 1;
          $('.page-item').removeClass('active');
          $('#pageItem' + prevPage).addClass('active');
          $('.page-results').hide();
          $('#page-' + prevPage).show();
        }
      } else if (page === 'next') {
        var curPage = $('.page-item.active').attr('page');
        if (parseInt(curPage) < numPages - 1) {
          var nextPage = parseInt(curPage) + 1;
          $('.page-item').removeClass('active');
          $('#pageItem' + nextPage).addClass('active');
          $('.page-results').hide();
          $('#page-' + nextPage).show();
        }
      } else {
        $('.page-item').removeClass('active');
        $(this).addClass('active');
        $('.page-results').hide();
        $('#page-' + page).show();
      }
    });

    // set the first page item as active by default
    $('#pageItem0').addClass('active');
    $('#paginator').show();
  }
}

function buildYoutubeDisplay(postInfo, parentInfoList, rank) {
  var parentInfo = {};
  for (var idx in parentInfoList) {
    if (postInfo['post_parent'] === parentInfoList[idx]['ID']) {
      parentInfo = parentInfoList[idx];
    }
  }
  var isMusicVideo = ("post_name" in parentInfo) ? (parentInfo["post_name"].indexOf("top40-music") !== -1) : false;
  var videoId = postInfo['post_name'].split('youtube-')[1];
  var videoUrl = "https://www.youtube.com/embed/" + videoId + "?enablejsapi";
  var embedSmall = "<img src='https://img.youtube.com/vi/" + videoId + "/default.jpg'>";
  var playerId = 'yt-player-' + rank;
  var embed = "<div id='" + playerId + "' style='position: abolute; top: 0; left: 0; width: 100%;'></div>";
  //var embed = "<iframe id='yt-player-" + rank + "' src='" + videoUrl + "' frameborder='0' allowfullscreen />";
  var viewButton = "<button class='btn btn-secondary btn-sm' data-toggle='collapse' style='float: right; position: absolute; top: 20px; right: 8px;'" +
                      " data-target='#collapse_" +
                      rank + "' aria-expanded='true' aria-controls='collapse_" + rank + "'>" +
                      "view" +
                "</button>";
  var viewCount = "<small><b>" + postInfo['view_count'] + "</b> views</small>";
  var card = "<div class='card' style='margin: 0px 5px;'>" +
                "<div class='card-header' style='padding: 0.1rem 0.5rem;' id='heading_" + rank + "'>" +
                  "<table style='width: inherit;'><tbody><tr>" +
                    "<td style='min-width: 50px;'><h5 style='margin-bottom: 0px; text-align: center;'>" +  "#" + rank + "</h5><div>" + viewCount + "</div></td>" +
                    "<td padding-left: 5px;>" +  embedSmall + "</td>" +
                    "<td style='padding: 0px 10px; vertical-align: middle;'>" +
                      "<div style='overflow: hidden;'><b>"
                      +  postInfo['post_title'] + "</b></div>" +
                    "</td>" +
                    "<td style='min-width: 55px; vertical-align: middle;'>" +  viewButton + "</td>" +
                  "</tr></tbody></table>" +
                "</div>" +
                "<div id='collapse_" + rank + "' rank='" + rank + "' class='collapse embeds' aria-labelledby='heading_" + rank + "' data-parent='#results' style='padding: 10px;'>" +
                  "<div class='card-body embed-iframe embed-collapse'>" +
                    // this is where embed goes!
                  "</div>" +
                "</div>" +
             "</div>";

  return {
      "item": card,
      "embed": embed,
      "playerId": playerId,
      "videoId": videoId,
      "isMusicVideo": isMusicVideo
  };
}

function buildNewsDisplay(postInfo, parentInfoList, rank) {
  var parentInfo = {};
  for (var idx in parentInfoList) {
    if (postInfo['post_parent'] === parentInfoList[idx]['ID']) {
      parentInfo = parentInfoList[idx];
    }
  }
  var newsId = postInfo['post_name'].split('top40-news-')[1];
  var $postContent = $(postInfo['post_content']);
  var newsUrl = $postContent.find('a').attr('href');
  var thumbnailSrc = $postContent.find('img').attr('src');
  var thumbnail = "<img src='" + thumbnailSrc + "' style='max-height: 90px'>";
  var viewButton = "<button class='btn btn-secondary btn-sm' data-toggle='collapse' style='float: right; position: absolute; top: 20px; right: 8px;'" +
                      " data-target='#collapse_" +
                      rank + "' aria-expanded='true' aria-controls='collapse_" + rank + "'>" +
                      "view" +
                "</button>";
  var viewCount = "<small><b>" + postInfo['view_count'] + "</b> views</small>";
  var card = "<div class='card' style='margin: 0px 5px;'>" +
                "<div class='card-header' style='padding: 0.1rem 0.5rem;' id='heading_" + rank + "'>" +
                  "<table style='width: inherit;'><tbody><tr>" +
                    "<td style='min-width: 50px;'><h5 style='margin-bottom: 0px; text-align: center;'>" +  "#" + rank + "</h5><div>" + viewCount + "</div></td>" +
                    "<td padding-left: 5px;>" + thumbnail + "</td>" +
                    "<td style='padding: 0px 10px; vertical-align: middle;'>" +
                      "<div style='overflow: hidden;'><b>"
                      +  postInfo['post_title'] + "</b></div>" +
                    "</td>" +
                    "<td style='min-width: 55px; vertical-align: middle;'>" +  viewButton + "</td>" +
                  "</tr></tbody></table>" +
                "</div>" +
                "<div id='collapse_" + rank + "' rank='" + rank + "' class='collapse embeds' aria-labelledby='heading_" + rank + "' data-parent='#results' style='padding: 10px;'>" +
                  "<div class='card-body embed-collapse'>" +
                    postInfo['post_content'] +
                  "</div>" +
                "</div>" +
             "</div>";
   return {
       "item": card,
       "newsId": newsId
   };
}

function buildFacebookDisplay(postInfo, parentInfoList, rank) {
  var parentInfo = {};
  for (var idx in parentInfoList) {
    if (postInfo['post_parent'] === parentInfoList[idx]['ID']) {
      parentInfo = parentInfoList[idx];
    }
  }
  var videoId = postInfo['post_name'].split('facebook-')[1];
  var videoUrl = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(postInfo['post_content']);
  var embed = '<iframe src="' + videoUrl + '&show_text=true&appId' +
              '" style="border:none;overflow:hidden;" scrolling="no" frameborder="0" allowTransparency="true" allowFullScreen="true" allow="encrypted-media"></iframe>';
  var embedSmall = '<iframe src="' + videoUrl + '&show_text=true&appId&width=150&height=100' +
              '" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allowFullScreen="true" allow="encrypted-media" width="150" height="100"></iframe>';
  var viewButton = "<button class='btn btn-secondary btn-sm' data-toggle='collapse' style='float: right; position: absolute; top: 20px; right: 8px;'" +
                      " data-target='#collapse_" +
                      rank + "' aria-expanded='true' aria-controls='collapse_" + rank + "'>" +
                      "view" +
                "</button>";
  var viewCount = "<small><b>" + postInfo['view_count'] + "</b> views</small>";
  var card = "<div class='card' style='margin: 0px 5px;'>" +
                "<div class='card-header' style='padding: 0.1rem 0.5rem;' id='heading_" + rank + "'>" +
                  "<table style='width: inherit;'><tbody><tr>" +
                    "<td style='min-width: 50px;'><h5 style='margin-bottom: 0px; text-align: center;'>" +  "#" + rank + "</h5><div>" + viewCount + "</div></td>" +
                    "<td padding-left: 5px;>" +  embedSmall + "</td>" +
                    "<td style='padding: 0px 10px; vertical-align: middle;'>" +
                      "<div style='overflow: hidden;'><b>"
                      +  postInfo['post_title'] + "</b></div>" +
                    "</td>" +
                    "<td style='min-width: 55px; vertical-align: middle;'>" +  viewButton + "</td>" +
                  "</tr></tbody></table>" +
                "</div>" +
                "<div id='collapse_" + rank + "' rank='" + rank + "' class='collapse embeds' aria-labelledby='heading_" + rank + "' data-parent='#results' style='padding: 10px;'>" +
                  "<div class='card-body facebook-responsive' style=''>" +
                    embed +
                  "</div>" +
                "</div>" +
             "</div>";
   return {
       "item": card,
       "videoId": videoId
   };
}

function load_youtube_iframe_api() {
  var tag = document.createElement('script');
  tag.src = "iframe_api.js";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
