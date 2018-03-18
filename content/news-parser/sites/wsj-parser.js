var wsjParser = (function() {
  var module = {};

  module.parseData = function (urlInfo) {
    // parse the data we need from yahoo news
    var regex_res = urlInfo.url.match('https://www.wsj.com/articles/(.*)$');
    var newsId = regex_res && regex_res.length == 2 ? regex_res[1] : '';
    var newsTitle = $('h1').text();
    var $article = $('article');
    var newsContent = '';
    /*$article.find('p.canvas-text').each(function() {
      newsContent += "<p>" + $(this).text() + "</p>";
    });*/
    newsContent += "<p>" + $article.find('p').first().text() + "</p>";
    var newsLink = "<a href=\"" + urlInfo.url + "\">here</a>";
    newsContent += "<br/><p>... To Read more, please click " + newsLink + "</p>";
    var newsImageUrl = '';
    var $articleImage = $article.find('img').first();
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
