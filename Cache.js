/**
 * Created with JetBrains PhpStorm.
 * User: Leri
 * Date: 8/20/13
 * Time: 1:54 PM
 * To change this template use File | Settings | File Templates.
 */
function Cache() {
    var storage = chrome.storage.local;

    this.get = function(key, callback) {
        storage.get(key, function (result) {
            callback(result[key]);
        });
    }

    this.set = function(key, object) {
        var setObj = {};
        setObj[key] = object;
        storage.set(setObj);
    }
}