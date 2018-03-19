var natgeoParser = (function() {
  var module = {};

  module.parseData = function (urlInfo) {
    // parse the data we need from yahoo news
    var regex_res = urlInfo.url.match('https://(.*).nationalgeographic.com/.*/(.*)/$');
    var newsId = regex_res && regex_res.length >= 2 ? regex_res[2] : '';
    var $article = $('article');
    var newsTitle = $article.find('h1').text();
    var newsContent = '';
    var paragraphLimit = 5;
    $article.find('p').each(function() {
      if (paragraphLimit > 0) {
        newsContent += "<p>" + $(this).text() + "</p>";
        paragraphLimit--;
      }
    });
    var newsLink = "<a class='news-link' href=\"" + urlInfo.url + "\">here</a>";
    newsContent += "<br/><p>... To Read more, please click " + newsLink + "</p>";
    var newsImageUrl = '';
    var $articleImage = $article.find('figure img').first();
    if ($articleImage.length > 0) {
      var srcset;
      if($article.find('figure picture source').length > 0) {
        srcset = $article.find('figure picture source').attr('srcset').split(',')[0].split(' ')[0];
        if (srcset.indexOf("http") == -1 && srcset.indexOf("/") == 0) {
          srcset = "https://" + window.location.host + srcset;
        }
      }
      newsImageUrl = $articleImage.attr('src') || srcset;
    }

    // data has been parsed
    var data = {
      newsId: newsId,
      newsTitle: newsTitle,
      newsContent: newsContent,
      newsImageUrl: newsImageUrl
    };

    return data;
  }

  return module;
} ());
