var _href;

// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {

	// We'll ask the browser to use strict code to help us catch errors earlier.
	// https://developer.mozilla.org/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
	'use strict';

	var translate = navigator.mozL10n.get;

	// We want to wait until the localisations library has loaded all the strings.
	// So we'll tell it to let us know once it's ready.
	navigator.mozL10n.once(start);

	// ---

	function start() {

//		init();

		$(window).bind('hashchange', function(){
			console.log('hashchange: ' + window.location.hash);
			var querystring = Dropbox.Util.Oauth.queryParamsFromUrl(location.href);
			var _querystring = Dropbox.Util.Oauth.queryParamsFromUrl(_href);
			_href = location.href;

			if (querystring.m != _querystring.m){
				console.log('m: ' + querystring.m);
				if (querystring.m == 'get'){
					// focus inputArea
					document.querySelector('#input-areas').className = 'current';
					document.querySelector('[data-position="current"]').className = 'left';
					// 	$('#content').focus();
				}
				else {
					// leave inputArea
					document.querySelector('#input-areas').className = 'right';
					document.querySelector('[data-position="current"]').className = 'current';
				}
			}
		
		});

	}
});

