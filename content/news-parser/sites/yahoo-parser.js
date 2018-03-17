var yahooParser = (function() {
  var module = {};

  module.parseData = function (urlInfo) {
    // parse the data we need from yahoo news
    var regex_res = urlInfo.url.match('https://www.yahoo.com/news/(.*)\.html');
    var newsId = regex_res && regex_res.length == 2 ? regex_res[1] : '';
    var newsTitle = $('header').text();
    var $article = $('article[itemprop="articleBody"]');
    var newsContent = '';
    $article.find('p.canvas-text').each(function() {
      newsContent += "<p>" + $(this).text() + "</p>";
    });
    var newsImageUrl = '';
    var $articleImage = $article.find('figure img');
    if ($articleImage.length > 0) {
      newsImageUrl = $articleImage.attr('src');
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
