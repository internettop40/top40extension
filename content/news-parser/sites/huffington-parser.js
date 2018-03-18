var huffingtonParser = (function() {
  var module = {};

  module.parseData = function (urlInfo) {
    // parse the data we need from yahoo news
    var regex_res = urlInfo.url.match('https://www.huffingtonpost.com/entry/(.*)');
    var newsId = regex_res && regex_res.length == 2 ? regex_res[1] : '';
    var newsTitle = $('div.headline h1').text();
    var $article = $('div.entry__body');
    var newsContent = '';
    /*$article.find('entry__text p').each(function() {
      newsContent += "<p>" + $(this).text() + "</p>";
    });*/
    newsContent += "<p>" + $article.find('.entry__text p').first().text() + "</p>";
    var newsLink = "<a href=\"" + urlInfo.url + "\">here</a>";
    newsContent += "<br/><p>... To Read more, please click " + newsLink + "</p>";
    var newsImageUrl = '';
    var $articleImage = $article.find('img.image__src');
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
