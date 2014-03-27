/**
 * Created with JetBrains PhpStorm.
 * User: Leri
 * Date: 8/16/13
 * Time: 12:22 PM
 * To change this template use File | Settings | File Templates.
 */
function ElementFinder() {
    this.findAll = function (selector) {
        var queryResult = document.querySelectorAll(selector);
        var length = queryResult.length;
        var result = [];

        for (var i = 0; i < length; i++) {
            result[i] = new Element(queryResult[i]);
        }

        return result;
    }

    this.find = function(selector) {
        var items = this.findAll(selector);

        return items.length > 0 ? items[0] : 'undefined';
    }
}