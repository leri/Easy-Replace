/**
 * Created with JetBrains PhpStorm.
 * User: Leri
 * Date: 8/16/13
 * Time: 2:33 PM
 * To change this template use File | Settings | File Templates.
 */
(function () {
    // Injecting prototype. This will probably break third-party script if it does the same.
    // Maybe move to just simple functions? At this point this keeps my code clean. So let it be as it's now
    (function () {
        var specials = [
                "-"
                , "["
                , "]"
                // order doesn't matter below
                , "/"
                , "{"
                , "}"
                , "("
                , ")"
                , "*"
                , "+"
                , "?"
                , "."
                , "\\"
                , "^"
                , "$"
                , "|"
            ];
        var regex = new RegExp('[' + specials.join('\\') + ']', 'g');

        String.prototype.escapeForRegex = function () {
            return this.replace(regex, "\\$&");
        };
    }());

    chrome.extension.onMessage.addListener(function (message, v, s) {
        switch (message.context) {
            case 'replaceAll':
                replaceAll(message.state);
                break;
            case 'replace':
                replace(message.state);
                break;
            case 'skip':
                find(message.state);
                break;
            case 'init':
                init();
                break;
        }
    });

    var lastOffsets = {
        "activeReplaceableNumber": 0,
        "stringOffset": 0,
        "replacementOffset":0
    };

    function find(state, replaceables, regex) {
        replaceables = typeof replaceables === 'undefined' ? getReplaceables() : replaceables;

        if (replaceables.length > 0) {
            regex = typeof regex === 'undefined' ? buildRegex(state, false) : regex;

            var currentReplaceable = replaceables[lastOffsets.activeReplaceableNumber];
            var notSearchedPart = currentReplaceable.value.substring(lastOffsets.stringOffset);
            var needlePosition = notSearchedPart.search(regex);

            if (needlePosition > -1) {
                var match = notSearchedPart.match(regex);
                match = match[0];

                currentReplaceable.selectionStart = lastOffsets.stringOffset + needlePosition;
                currentReplaceable.selectionEnd = currentReplaceable.selectionStart + match.length;
                lastOffsets.stringOffset = currentReplaceable.selectionEnd;
                lastOffsets.replacementOffset = currentReplaceable.selectionStart;

                if (state.needle !== '') {
                    scrollToSelection(currentReplaceable);
                }
            } else if (lastOffsets.activeReplaceableNumber < replaceables.length - 1) {
                lastOffsets.stringOffset = 0;
                lastOffsets.activeReplaceableNumber++;

                find(state);
            } else {
                resetOffsets();

                send({
                    "status": "notice",
                    "message": "Reached the end. No more occurrences."
                });
            }
        }
    }

    function replace(state) {
        var replaceables = getReplaceables();

        if (replaceables.length > 0) {
            var regex = buildRegex(state, false);

            var currentReplaceable = replaceables[lastOffsets.activeReplaceableNumber];
            var notReplacedPart = currentReplaceable.value.substring(lastOffsets.replacementOffset);
            var needlePosition = notReplacedPart.search(regex);

            if (needlePosition > -1) {
                var replaced = notReplacedPart.replace(regex, state.replacement);
                currentReplaceable.value = currentReplaceable.value.substring(0, lastOffsets.replacementOffset) + replaced;

                find(state, replaceables, regex);
            } else if (lastOffsets.activeReplaceableNumber < replaceables.length - 1) {
                lastOffsets.replacementOffset = 0;
                lastOffsets.activeReplaceableNumber++;

                replace(state);
            }
        }
    }

    function replaceAll(state) {
        var replaceables = getReplaceables();
        var replaceablesCount = replaceables.length;

        if (replaceablesCount > 0) {
            var regex = buildRegex(state, true);
            var occurrencesCount = countOccurrences(replaceables, regex);

            if (confirm(occurrencesCount + ' occurrences were found for term \'' + state.needle + '\'. Replace all?')) {
                for (var i = 0; i < replaceablesCount; i++) {
                    var activeTextArea = replaceables[i];
                    activeTextArea.value = activeTextArea.value.replace(regex, state.replacement);
                }
            }

            resetOffsets();
        }
    }

    function resetOffsets() {
        lastOffsets.activeReplaceableNumber = 0;
        lastOffsets.replacementOffset = 0;
        lastOffsets.stringOffset = 0;
    }

    function init() {
        var initResult = {
            "status": "error",
            "message": 'Extension can only replace text within the text areas and input fields'
        };

        if (hasReplaceables()) {
            initResult.status = "Ok";
            initResult.message = "";
        }

        send(initResult);
    }

    function hasReplaceables() {
        var replaceables = getReplaceables();
        return replaceables.length > 0;
    }

    function getReplaceables() {
        return querySelectorAllWithIFrames(document, 'textarea, input[type=text], input[type=search]');
    }

    function querySelectorAllWithIFrames(document, selector) {
        var items = Array.prototype.slice.call(document.querySelectorAll(selector));
        var iframes = document.querySelectorAll('iframe');

        for (var i = 0; i < iframes.length; i++) {
            var iframe = iframes[i];
            var iframeDoc = iframe.contentWindow.document;
            var itemsInIframe = querySelectorAllWithIFrames(iframeDoc, selector);
            items = items.concat(itemsInIframe);
        }

        return items;
    }

    function countOccurrences(replaceables, regex) {
        var occurrencesCount = 0;

        for (var i = 0; i < replaceables.length; i++) {
            var activeTextArea = replaceables[i];
            var matches = activeTextArea.value.match(regex);

            if (matches !== null) {
                occurrencesCount += matches.length;
            }
        }

        return occurrencesCount;
    }

    function buildRegex(state, all) {
        var flags = all ? 'g' : '';

        if (!state.useRegex) {
            state.needle = state.needle.escapeForRegex();
        }

        if (state.ignoreCase) {
            flags += 'i';
        }

        return new RegExp(state.needle, flags);
    }

    function scrollToSelection(replaceable) {
        window.scroll(0, findPosition(replaceable));

        if (replaceable.constructor.name == 'HTMLTextAreaElement') {
            scrollToSelectionInTextArea(replaceable, replaceable.selectionStart);
        }
    }

    function findPosition(elem) {
        var currentTop = 0;

        if (elem.offsetParent) {
            do {
                currentTop += elem.offsetTop;
            } while (elem = elem.offsetParent);
        }

        return currentTop;
    }

    function scrollToSelectionInTextArea(elem, selectionStart) {
        var charsPerRow = elem.cols;
        var selectionRow = (selectionStart - (selectionStart % charsPerRow)) / charsPerRow;

        var lineHeight = elem.clientHeight / elem.rows;

        lineHeight += elem.value.substring(0, selectionStart).split("\n").length - 1;

        elem.scrollTop = lineHeight * selectionRow;
    }

    function send(message) {
        chrome.extension.sendMessage(message);
    }
}());