(function ($) {
  // 変更可能性のある DOM 指定法はここにまとめておく
  var DOM_NICONICO_SEARCH_LI = "div.contentBody>ul.list>li.item";
  var DOM_NICONICO_SEARCH_THUMBNAIL = "div.itemThumb>a";

  // URL から動画 ID を抽出する正規表現
  var MOVIE_ID_EXTRACTOR = /\/watch\/(sm\d+|nm\d+|\d+)(?:\?.+)?$/

  // ニコニコAPIのURL
  var NICONICO_API_URL = "http://ext.nicovideo.jp/api/getthumbinfo/__MOVIE_ID__";

  // ニコニコ検索のURL
  var NICONICO_SEARCH_URL = /^http:\/\/www.nicovideo.jp\/(search|tag)\/.+$/;

  // キャッシュ
  var cache = {};

  // URL から動画 ID を抽出する
  function extractMovieId(url) {
    var match = url.match(MOVIE_ID_EXTRACTOR);
    if (! match) {
      console.error("Could not extract movie id: ", url);
    } else {
      var id = match[1];
      return id;
    }
  }

  // 動画 ID から情報を取得する
  function findMovieInfo(movieId) {
    // Chrome 45 以上では、Promise をネイティブにサポート
    // ref: http://caniuse.com/#search=Promise
    return new Promise(function (resolve, reject) {
      // キャッシュに情報があれば、それを返す
      // なければ API を叩き、結果を cache して返す。
      if (cache[movieId] !== void 0) {
        console.log("Obtained XML data from cache.");
        return resolve(cache[movieId]);
      } else {
        var url = NICONICO_API_URL.replace("__MOVIE_ID__", movieId);
        $.ajax({
          type       : "GET",
          url        : url ,
          processData: true,
        }).success(function (xml) {
          // フォーマットしてからキャッシュし返す
          var formatted = formatXMLtoObject(xml);
          cache[movieId] = formatted;
          console.log("Obtained XML data from API.");
          return resolve(formatted);
        }).error(function (request, status, error) {
          console.error("Error occured: status[%s]", status, error);
          return reject(error);
        });
      }
    });
  }

  // XML を、必要な情報をもったオブジェクトに変換する
  function formatXMLtoObject(xml) {
    var $xml = $(xml);
    // うｐ主とその id
    var userName = $xml.find("user_nickname").text();
    var userId   = $xml.find("user_id").text();
    var tags     = $xml.find("tags").children("tag").map(function () {
      return $(this).text();
    }).get();

    return {
      userName: userName,
      userId  : userId,
      tags    : tags
    };
  }

  // 動画情報を、マウスオーバーの中に表示できる形式に変更
  function formatObjectToTitle(obj) {
    var userName = obj.userName;
    var tags     = obj.tags;

    return "投稿者: " + userName + "\n" + "タグ: " + tags.join(" ");
  }

  // 動画情報 XML を、必要な
  console.log("NICONICO-INFO");

  // ニコニコの検索画面のリンクにマウスオーバーすることで、
  // 投稿者名と投稿者ID、タグ一覧を表示する



  // ニコニコの検索画面にて
  function caseNiconicoSearch() {
    // 検索画面の動画一覧
    var $lis = $(DOM_NICONICO_SEARCH_LI);

    $lis.each(function () {
      var $li = $(this);
      // サムネ画像の <a> タグを検出
      var $a = $li.find(DOM_NICONICO_SEARCH_THUMBNAIL);
      // <a> タグを hover した際に、情報を取得し、表示する。
      $a.mouseover(function () {
        // URL から動画 ID を抽出
        var movieId = extractMovieId($a.attr("href"));
        findMovieInfo(movieId)
          .then(function (data) {
            // 取得した情報をマウスオーバーする
            $a.attr("title", formatObjectToTitle(data));
          });
      });
    });
  }

  var url = location.href;

  if (url.match(NICONICO_SEARCH_URL)) {
    // ニコニコの検索画面の場合
    caseNiconicoSearch();
  }

})(jQuery);
