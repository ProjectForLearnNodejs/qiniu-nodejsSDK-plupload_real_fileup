/**
 * is image
 * @param  {String}  url of a file
 * @return {Boolean} file is a image or not
 */
function isImage(url) {
    var res, suffix = "";
    var imageSuffixes = ["png", "jpg", "jpeg", "gif", "bmp"];
    var suffixMatch = /\.([a-zA-Z0-9]+)(\?|\@|$)/;

    if (!url || !suffixMatch.test(url)) {
        return false;
    }
    res = suffixMatch.exec(url);
    suffix = res[1].toLowerCase();
    for (var i = 0, l = imageSuffixes.length; i < l; i++) {
        if (suffix === imageSuffixes[i]) {
            return true;
        }
    }
    return false;
}