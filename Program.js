/**
 * Created with JetBrains PhpStorm.
 * User: Leri
 * Date: 8/16/13
 * Time: 12:50 PM
 * To change this template use File | Settings | File Templates.
 */
function Program() {
    var elementFinder;
    var options;
    var optionsExpander;
    var needleTextBox;
    var replacementTextBox;
    var matchCaseCheckBox;
    var useRegexCheckBox;
    var errorLabel;
    var noticeLabel;
    var skipButton;
    var replaceButton;
    var replaceAllButton;
    var lastTabId = null;
    var cache = null;

    this.run = function() {
        initializeComponents();
    }

    function initializeComponents() {
        lastTabId = null;
        elementFinder = new ElementFinder();
        options = elementFinder.find('#options');
        optionsExpander = elementFinder.find('#optionsExpander');
        needleTextBox = elementFinder.find('#needle');
        replacementTextBox = elementFinder.find('#replacement');
        matchCaseCheckBox = elementFinder.find('#matchCase');
        useRegexCheckBox = elementFinder.find('#useRegex');
        errorLabel = elementFinder.find('#errorLabel');
        noticeLabel = elementFinder.find('#noticeLabel');
        skipButton = elementFinder.find('#skipButton');
        replaceButton = elementFinder.find('#replaceButton');
        replaceAllButton = elementFinder.find('#replaceAllButton');

        initializeCache();

        needleTextBox.focus();

        bindEvents();

        send({
            "context": "init"
        });
    }

    function initializeCache() {
        cache = new Cache();
        cache.get('inputs', function (result) {
            var inputs = {};
			var needleTextBoxId = needleTextBox.getId();
			var replacementTextBoxId = replacementTextBox.getId();

            if (typeof  result === 'undefined') {
                inputs[needleTextBoxId] = '';
                inputs[replacementTextBoxId] = '';

                cache.set('inputs', inputs);
            } else {
                inputs = result;
            }

            needleTextBox.value(inputs[needleTextBoxId]);
            replacementTextBox.value(inputs[replacementTextBoxId]);
        });
		cache.get('options', function (result) {
			var matchCaseCheckBoxId = matchCaseCheckBox.getId();
			var useRegexCheckBoxId = useRegexCheckBox.getId();
		
			if (typeof result === 'undefined') {
				result = { 'visible': false, };
				result[matchCaseCheckBoxId] = false;
				result[useRegexCheckBoxId] = false;
			
				cache.set('options', result);
			} else {
				if (result.visible) {
					showOptions();
				} else {
					hideOptions();
				}
				
				matchCaseCheckBox.checked(result[matchCaseCheckBoxId]);
				useRegexCheckBox.checked(result[useRegexCheckBoxId]);
			}
		});
    }

    function bindEvents() {
        optionsExpander.bind('click', optionsExpanderClicked);
		matchCaseCheckBox.bind('change', optionsChanged);
		useRegexCheckBox.bind('change', optionsChanged);
        needleTextBox.bind('blur', inputUpdated);
        replacementTextBox.bind('blur', inputUpdated);
        skipButton.bind('click', commandFired);
        replaceButton.bind('click', commandFired);
        replaceAllButton.bind('click', commandFired);
        chrome.extension.onMessage.addListener(function (state) {
            switch (state.status) {
                case 'error':
                    errorLabel.html(state.message);
                    disableButtons();
                    break;
                case 'notice':
                    noticeLabel.html(state.message);
                    break;
                case 'Ok':
                    enableButtons();
                    break;
            }
        })
    }

    function optionsExpanderClicked(s, e) {
		var hidden = options.isHidden();
	
        if (hidden) {
            showOptions();
        } else {
            hideOptions();
        }
		
		cache.get('options', function (result) {
			result.visible = hidden;
			cache.set('options', result);
		});
    }
	
	function optionsChanged(s, e) {
		cache.get('options', function (result) {
			result[s.getId()] = s.checked();
			cache.set('options', result);
		});
	}

    function inputUpdated(s, e) {
        cache.get('inputs', function (result) {
            result[s.getId()] = s.value();
            cache.set('inputs', result);
        });
    }

    function commandFired(s, e) {
        cleanUp();

        var command = {
            "context": s.getId().replace("Button", ""),
            "state": {
                "needle": needleTextBox.value(),
                "replacement": replacementTextBox.value(),
                "useRegex": useRegexCheckBox.checked(),
                "ignoreCase": !matchCaseCheckBox.checked()
            }
        };
        send(command);
    }

    function disableButtons() {
        skipButton.disable();
        replaceButton.disable();
        replaceAllButton.disable();
    }

    function enableButtons() {
        skipButton.enable();
        replaceButton.enable();
        replaceAllButton.enable();
    }

    function cleanUp() {
        noticeLabel.html('');
    }
	
	function showOptions() {
		options.show();
		optionsExpander.html('[-]');
	}
	
	function hideOptions() {
		options.hide();
		optionsExpander.html('[+]');
	}

    function send(message) {
        if (lastTabId === null) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                lastTabId = tabs[0].id;
                chrome.tabs.sendMessage(lastTabId, message);
            });
        } else {
            chrome.tabs.sendMessage(lastTabId, message);
        }
    }
}