var abcParser = (function() {
  var module = {};

  module.parseData = function (urlInfo) {
    // parse the data we need from yahoo news
    var regex_res = urlInfo.url.replace(/\/story\?id=\d+/, "").match('http://abcnews.go.com/.*/(.*)$');
    var newsId = regex_res && regex_res.length == 2 ? regex_res[1] : '';
    var newsTitle = $('h1').first().text();
    var $article = $('article');
    var newsContent = '';
    var paragraphLimit = 5;
    $article.find('p[itemprop="articleBody"]').each(function() {
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
