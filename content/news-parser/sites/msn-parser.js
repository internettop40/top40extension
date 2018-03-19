var msnParser = (function() {
  var module = {};

  module.parseData = function (urlInfo) {
    // parse the data we need from yahoo news
    var regex_res = urlInfo.url.match('https://www.msn.com/.*/(.*)/.*$');
    var newsId = regex_res && regex_res.length == 2 ? regex_res[1] : '';
    var $article = $('article');
    var newsTitle = $('h1[itemprop="headline"]').text();
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
    $article.find('img').each(function() {
      if ($(this).attr('src') !== undefined && $(this).attr('src') !== null &&
          $(this).attr('alt') !== null && $(this).attr('alt') !== undefined &&
          $(this).attr('data-src') !== undefined &&
          $(this).attr('data-src') !== null &&
          $(this).attr('src').length > 0) {
            newsImageUrl = $(this).attr('src');
          }
    });

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
