/**
 * Created with JetBrains PhpStorm.
 * User: Leri
 * Date: 8/16/13
 * Time: 12:25 PM
 * To change this template use File | Settings | File Templates.
 */
function Element(domElement) {
    this.dom = domElement;
    this.children = [];

    for (var i = 0; i < domElement.children.length; i++) {
        this.children[i] = new Element(domElement.children[i]);
    }

    this.bind = function (eventName, callback) {
        domElement.addEventListener(eventName, function (e) {
            callback(new Element(this), e);
        }, false);
    }

    this.show = function(display) {
        display = typeof display !== 'undefined' ? display : 'block';
        domElement.style.display = display;
    }

    this.hide = function() {
        domElement.style.display = "none";
    }

    this.disable = function() {
        domElement.disabled = true;
    }

    this.enable = function() {
        domElement.disabled = false;
    }

    this.isHidden = function() {
        return domElement.style.display === "none" || domElement.style.display == "";
    }

    this.getId = function() {
        return domElement.id;
    }

    this.value = function(val) {
        if (typeof val !== 'undefined') {
            domElement.value = val;
        }

        return domElement.value;
    }

    this.focus = function() {
        domElement.focus();
    }

    this.click = function() {
        domElement.click();
    }

    this.html = function(val) {
        if (typeof val !== 'undefined'){
            domElement.innerHTML = val;
        }
        return domElement.innerHTML;
    }
    
    this.checked = function(val) {
        if (typeof val !== 'undefined') {
            domElement.checked = val;
        }
        
        return domElement.checked;
    }
}