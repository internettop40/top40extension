var cnnParser = (function() {
  var module = {};

  module.parseData = function (urlInfo) {
    // parse the data we need from yahoo news
    var regex_res = urlInfo.url.match('https://www.cnn.com/(.*)/index\.html');
    var newsId = '';
    if (regex_res && regex_res.length == 2) {
      var regex_arr = regex_res[1].split("/");
      newsId = regex_arr[regex_arr.length - 1];
    }
    var newsTitle = $('h1').text();
    var newsContent = '';
    var $article = $('article');
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
    var $articleImage = $article.find('img.media__image');
    if ($articleImage.length > 0) {
      newsImageUrl = 'https:' + $articleImage.attr('src');
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
