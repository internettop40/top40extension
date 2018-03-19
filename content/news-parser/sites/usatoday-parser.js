var usatodayParser = (function() {
  var module = {};

  module.parseData = function (urlInfo) {
    // parse the data we need from yahoo news
    var regex_res = urlInfo.url.match('https://www.usatoday.com/.*/([0-9]+)/$');
    var newsId = regex_res && regex_res.length == 2 ? 'usatoday-' + regex_res[1] : '';
    var $article = $('article');
    var newsTitle = $article.find('h1[itemprop="headline"]').text();
    var newsContent = '';
    var paragraphLimit = 5;
    $article.find('p.p-text').each(function() {
      if (paragraphLimit > 0) {
        newsContent += "<p>" + $(this).text() + "</p>";
        paragraphLimit--;
      }
    });
    var newsLink = "<a class='news-link' href=\"" + urlInfo.url + "\">here</a>";
    newsContent += "<br/><p>... To Read more, please click " + newsLink + "</p>";
    var newsImageUrl = '';
    var $articleImage = $article.find('div.image-wrap img').first();
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
