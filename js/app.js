var db;
var _href;
var syncing = false;
var functions = [];

function pathToTitle(path){
	return path.replace(/^\//, '').replace(/\.[^\.]*$/, '').trim();
}

function pathToFirstLine(path){
	return '# ' + pathToTitle(path);
}

function createPath(str){
	var i = str.indexOf('\n');
	var line1 = (i >= 0) ? str.substring(0, i) : str;
	return '/' + line1.replace(/^#\s*/, '').trim() + '.txt';
}

function closure(args, func){
	return function(){ func(args); };
}

function promiseClosure(args, func){
	return function(resolve, reject){ func(args, resolve, reject); };
}

function init(){
	var p1 = new Promise(function(resolve, reject){
		// create IndexedDB
		var openReq = window.indexedDB.open('api238947', Date.now());	// indexedDB...IDBFactory
		openReq.onupgradeneeded = function(e){
			console.log('upgrade IndexedDB.');

			try {
				//TODO: remove
				e.target.result.deleteObjectStore('notes');
			}
			catch (ex){
				console.warn(ex.name, ex.message);
			}

// 			var store = e.target.result.createObjectStore('notes', {keyPath:'path', autoIncrement: false});
			var store = e.target.result.createObjectStore('notes', {autoIncrement: false});
			console.info('IndexedDB "notes" keyPath: ' + store.keyPath);
		};
		openReq.onsuccess = function(e){
			db = e.target.result;
			console.log('success: open IndexedDB:', db);

			resolve();
		};
	});
}

//FIXME: cache1件ごとのfunctionを受けるように
function eachCaches(thenFunc)
{
	var caches = [];

	new Promise(function(resolve, reject){
		var transaction = db.transaction(['notes'], 'readonly');
		var store = transaction.objectStore('notes');

		var cursorReq = store.openCursor();
		cursorReq.onsuccess = function(e){
			var cursor = e.target.result;
			if (cursor){
				caches.push(cursor.value);
				console.log('cursor:', cursor);
				// console.log('fetch cache:', JSON.stringify(cursor.value));

				cursor.continue();
			}
			else {
				// end of loop
				resolve(caches);
			}
		};
	})
	.then(thenFunc);
	
	return caches;
}

function cachePathesAndQueueCacheRequest()
{
	$.ajax({
		url: 'https://api.dropbox.com/1/search/auto',
		method: 'GET',
		dataType: 'text',
		data: {
			query: '.',
			access_token: localStorage.getItem('DROPBOX_ACCESS_TOKEN'),
		},
		xhrFields: {
			withCredentials: false,
		},
		success: function(data, textStatus, jqXHR){
			var items = JSON.parse(data);

			var transaction = db.transaction(['notes'], 'readwrite');
			var store = transaction.objectStore('notes');
			
			var clearReq = store.clear();
			clearReq.onsuccess = function(){
				for (var i in items){
					console.log('cachePathesAndQueueCacheRequest: ' + items[i].path + '\n' + JSON.stringify(items[i]));
					store.put(items[i], items[i].path);

					cacheNotesQueue.unshift(items[i].path);
					console.log('cacheNotesQueue.length: ' + cacheNotesQueue.length);
				}
				setTimeout(cacheNotes, 0);

				if (functions['afterCacheNotes'] === undefined)
					functions['afterCacheNotes'] = [];

				functions['afterCacheNotes'].push(function(){
					var f = functions['afterCathesAndQueueCacheRequest'].pop();
					f();
				});

			};
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log(textStatus);
		},
	});
}

var cacheNotesInterval = 0;
var cacheNotesQueue = [];

function cacheNotes()
{
	if (cacheNotesQueue.length == 0)
		return;

	var path = cacheNotesQueue.shift();

	get(path, function(content, textStatus, jqXHR){
		var transaction = db.transaction(['notes'], 'readwrite');
		var store = transaction.objectStore('notes');

		var getReq = store.get(path);
		getReq.onsuccess = function(e){
			var item = e.target.result;

			console.log('cacheNotes: get: ' + JSON.stringify(item));
			item['content'] = content;
 			store.put(item, item.path);
			console.log('cached: ' + item.path + ' (length:' + item['content'].length + ')');
		}

// 		rendarPreviewTextQueue.unshift(path);
// 		setTimeout(rendarPreviewText, 0);

// 		var countReq = store.count();
// 		countReq.onsuccess = function(e){
// 			console.info('IndexedDB count:', e.target.result);
// 		};
	});

	if (cacheNotesQueue.length > 0){
		setTimeout(cacheNotes, cacheNotesInterval);
	}
	else {
//		listFromCache();
		var f = functions['afterCacheNotes'].pop();
		f();
	}
}


var rendarPreviewTextInterval = 100;
var rendarPreviewTextQueue = [];

function rendarPreviewText()
{
// 	if (cacheNotesQueue.length > 0)
// 		console.error('assertion error: ' + cacheNotesQueue.length + ' > 0');
	
	var li = rendarPreviewTextQueue.shift();
	if (li !== undefined){
		var ul2 = li.children('a').children('ul');
		var path = li.children('a').eq(0).data('path');
		if (path){
			var transaction = db.transaction(['notes'], 'readonly');
			var store = transaction.objectStore('notes');
			
			var getReq = store.get(path);
			getReq.onsuccess = function(e){
				var item = e.target.result;

				if (item !== undefined){
					var headings = item.content.match(/^(#+)(.+)$/gm);
					if (headings && headings.length > 0){
						for (var i in headings){
							// console.log(path + '\nheadings:\n' + headings[i]);
							$('<li class="preview-text">' + headings[i] + '</li>').appendTo(ul2);
						}
					}
					else {
						var paragraphs = item.content.split(/\n{2,}/g);
						if (paragraphs && paragraphs.length > 0){
							// console.log(path + '\nfirst paragraph:\n' + paragraphs[0]);
							$('<li class="preview-text">' + paragraphs[0] + '</li>').appendTo(ul2);
						}
					}

					console.log('preview created: ' + item.path);
				}
			};
		}
	}
	
	if (rendarPreviewTextQueue.length > 0)
		setTimeout(rendarPreviewText, rendarPreviewTextInterval);
}

function editable(value)
{
	if (value === undefined)
		$('#content').attr('contenteditable', $('#content').attr('contenteditable') == 'true' ? 'false' : 'true');
	else
		$('#content').attr('contenteditable', value);

	$('#btn-view-mode').html($('#content').attr('contenteditable') == 'true' ? 'switch to <b>view</b> mode' : 'switch to <b>edit</b> mode');
}

function addNote(title)
{
// 	if ( ! (path.match(/^\//) && path.match(/\.txt$/)))
// 		console.log('! addNote.title: ' + title);

// 	alert('addNote(' + title + ')');
	editable('true');
	
	//HACK: ファイル作成方法が分かるまでの仮コード
	window.location.href = '#m=get&path=/.txt' + '&clear=true&title=' + encodeURIComponent(title);
}

function notationTextToHtml(text)
{
	console.log('text:' + text);

	if (find)
		text = text.replace(new RegExp('(' + find + ')', 'mg'), '<span class="find">$1</span>');

	text = text
	.replace(/https?:\/\/\S+|mailto:\S+/mg, function(m0){ return '<a class="externlink" href="' + encodeURI(m0) + '" target="_blank">' + m0 + '</a>'; })
	//HACK: tel:へのリンクが<a href="tel:..." target="_blank">では機能しないのでtarget指定しない
	.replace(/tel:[0-9\-\+\#\*\(\)]+/mg, function(m0){ return '<a class="externlink" href="' + encodeURI(m0) + '">' + m0 + '</a>'; })
	.replace(/^((#+)\s*.*?)$/mg, function(m0, m1, m2){ var level = m2.length + 1; return '<h' + level + '>' + m1 + '</h' + level + '>' })
	.replace(/(\[\[([^\[\]]+?)\]\])|((?:→|&gt;&gt;&gt;)\s*(.+?))$/mg, function(m0, m1, m2, m3, m4){
		var m = m2 ? m2 : m4;
		var label = m1 ? m1 : m3;
		var a = m.split('#');

		var ret =
			'<a class="innerlink" href="#m=get'
			+ '&path=' + '/' + encodeURIComponent(a[0]) + '.txt'
			+ '&find=' + encodeURIComponent(a[1])
			+ '">' + label + '</a>';
 		
		return ret;
	})
	.replace(/\n/g, '<br>');

	console.log('html:' + text);
	
	return text;
}

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

		init();

		//HACK: ファイル作成方法が分かるまでの仮コード
		get(
			'/.txt',
			function(){},
			function(){
				put('/.txt', '');
			}
		);

		$('.search-text').bind('input', function(){
			var promiseFunc;
			var words = [];
			var searchText = $(this).val().trim();
			var m = /^\/(.*)\/$/.exec(searchText);
			if (m){
				words.push(m[1]);

				promiseFunc = function(resolve, reject){
					var re = new RegExp(this, 'i');
					eachCaches(function(notes){
						var r = _.filter(notes, function(note){
							var r2 = (re.test(note.path) || re.test(note.content));
							console.log('search RegExp:"' + re.toString() + '" in ' + note.path + ' is ' + r2.toString());
							return r2;
						});
						console.log('search1WordPromise: ' + JSON.stringify(r));
						resolve(r);
					});
				};
			}
			else {
				words = _.filter(searchText.split(/\s/), function(word){ return word.length > 0; });

				promiseFunc = function(resolve, reject){
					var word = this;
					eachCaches(function(notes){
						var r = _.filter(notes, function(note){
							var r2 = (note.path.indexOf(word) > -1 || note.content.indexOf(word) > -1);
							console.log('search str:"' + word + '" in ' + note.path + ' is ' + r2.toString());
							return r2;
						});
						console.log('search1WordPromise: ' + JSON.stringify(r));
						resolve(r);
					});
				};
			}
			
			console.log('words: ' + words);

			var search1WordPromises = [];
			for (var i in words){
				var bindedPromiseFunc = _.bind(promiseFunc, words[i]);
				search1WordPromises.push(
					new Promise(bindedPromiseFunc)
				);

// 				var promiseFunc = promiseClosure(
// 					words[i],
// 					function(word, resolve, reject){
// 						eachCaches(function(notes){
// 							var r = _.filter(notes, function(note){
// 								var r2;
// 								var m = /^\/(.*)\/$/.exec(word);
// 								if (m){
// 									var re = new RegExp(m[1], 'i');
// 									r2 = (re.test(note.path) || re.test(note.content));
// 								}
// 								else {
// 									r2 = (note.path.indexOf(word) > -1 || note.content.indexOf(word) > -1);
// 								}

// 								console.log('search "' + word + '" in ' + note.path + ' is ' + r2.toString());
// 								return r2;
// 							});
// 							console.log('search1WordPromise: ' + JSON.stringify(r));
// 							resolve(r);
// 						});
// 					});
// 				search1WordPromises.push(
// 					new Promise(promiseFunc)
// 				);
			}

			Promise
			.all(search1WordPromises)
			.then(function(results){
				$('.file-list > li').hide();
				// console.log('results.length: ' + results.length);	// == words.length
				// console.log('results[0].length: ' + results[0].length);	// == 最初の検索語にマッチしたノート数
				// console.log('results: ' + JSON.stringify(results));

				if (results.length > 0){
					var notePaths_MatchAllWords = _.pluck(results[0], 'path');
					for (var i = 1; i < results.length; ++i){
						// すべての語を含む(AND)検索
						notePaths_MatchAllWords = _.intersection(notePaths_MatchAllWords, _.pluck(results[i], 'path'));
						// いずれかの語を含む(OR)検索
						// notePaths_MatchAllWords = _.union(notePaths_MatchAllWords, results[i]);
					}

					console.log('notes_MatchAllWords.path: ' + notePaths_MatchAllWords);
					
					for (var i in notePaths_MatchAllWords){
						//FIXME: CSSセレクターに合ったエスケープルール
						$('#' + encodeURIComponent(notePaths_MatchAllWords[i]).replace(/[%\.\(\)]/g, '')).show();
					}
				}
			});
		});

		$('#preview-switch').bind('click', function(){
			if ($(this).val() == 'Preview'){
				$('.preview-texts').show(500);
				$(this).val('Title only');
			}
			else {
				$('.preview-texts').hide(750);
				$(this).val('Preview');
			}
		});
		
		var querystring = Dropbox.Util.Oauth.queryParamsFromUrl(location.href);
		if (querystring.access_token){
			localStorage.setItem('DROPBOX_ACCESS_TOKEN', querystring.access_token);
			if (window.opener){
				window.opener.location.hash = window.location.hash;
				window.close();
			}
		}

		$(window).bind('hashchange', function(){
			console.log('hashchange: ' + window.location.hash);
			$('#hash').text(window.location.hash);
			
			var querystring = Dropbox.Util.Oauth.queryParamsFromUrl(location.href);
			var _querystring = Dropbox.Util.Oauth.queryParamsFromUrl(_href);
			_href = location.href;

			if (querystring.access_token){
				//HACK: ファイル作成方法が分かるまでの仮コード
				get(
					'/.txt',
					function(){},
					function(){
						put('/.txt', '');
					}
				);
				
				$('#access_token').text(querystring.access_token);
				$('#sync1').trigger('click');
				delete querystring.access_token;
				location.hash = $.param(querystring);
			}
			if (querystring.folders != _querystring.folders){
				if (querystring.folders){
					var key = querystring.folders;
					var label = decodeURIComponent(querystring['folder-labels']);
					// $('.file-list > :not(.' + key + ')').hide();
					$('.file-list > li').hide();
					$('.file-list > .' + key).animate({height:'show', opacity:'show'}, 500);

					$('.list-title').empty().append(label + ' <em>(' + $('.file-list > .' + key).size() + ')</em>');
				}
				else {
					$('.file-list > li').animate({height:'show', opacity:'show'}, 500);

					$('.list-title').empty().append('Notes <em>(' + $('.file-list > li').size() + ')</em>');
				}
			}
			if (querystring.path != _querystring.path && querystring.path){
				var path = querystring.path;
				var clear = querystring.clear;
				var find = querystring.find;
				var title = querystring.title;
				title = title ? title : pathToFirstLine(path);

				var gotFunc = function(data, textStatus, jqXHR){
					$('#path').val(path);

					var html;
					
					var line1 = pathToFirstLine(path);
					if (line1 != data.substring(0, data.indexOf('\n')).trim())
						html = notationTextToHtml(line1 + '\n' + data);
					else
						html = notationTextToHtml(data);

					// alert('path:' + path + ', data:' + data + ', line1:' + line1);

					//HACK:
					if (clear)
						$('#content').html(title + '<br>');
					else
						$('#content').html(html);

					//FIXME: clickハンドラーの定義を.innerlink生成と同じfunctionへ移動。実行はget()が終わってから
					$('#content a').bind('click', function(e){
						if ($('#content').attr('contenteditable') != 'true'){
							console.log('navigate to ' + $(this).attr('href'));
							//TODO: test
							e.stopPropagation();
						}
					});
					
					//					//HACK:
					// 					if (clear)
					// 						$('#content').val(title + '\n');
					// 					else
					// 						$('#content').val(title + '\n' + data);

					$('#stored-content').val(planation($('#content').html()));
					// 					$('#stored-content').val($('#content').val());

					{
						// 						// create TOC
						// 						var t = $('#content');
						// 						var re = /#+\s*(.+)/g;
						// 						var lastIndex = re.lastIndex;
						// 						var m;
						// 						var sel = $('.sel-select-heading');
						// 						sel.empty();
						// 						sel.append('<option value="-1">[' + title + ']</option>');
						// 						var count = 0;
						// 						while(m = re.exec(t.val())){
						// 							sel.append('<option value="' + lastIndex + '">' + m[0] + '</option>');
						// 							lastIndex = re.lastIndex;
						// 						}
						// create TOC
						var container = $('#content > h2, #content > h3, #content > h4');
						var headings = $('#content > h2, #content > h3, #content > h4');
						var sel = $('.sel-select-heading');
						sel.empty();
						sel.append('<option value="-1">[table of contents]</option>');
						headings.each(function(){
							sel.append('<option value="' + container.index(this) + '">' + $(this).text() + '</option>');
						});
					}

					// focusInputArea();

					if (find){
						$('span.find').get(0).scrollIntoView();
						window.scrollTo(window.scrollX, window.scrollY - $('.sel-select-heading').eq(0).height() - 10);
					}
					else {
						SelectHeading(-1);
					}
				};
				
				var failFunc = function(jqXHR, textStatus, errorThrown){
					console.log(textStatus);
					
					// refered dangling link
					//TODO: pathが存在している場合にも対応
					addNote(title);
					$('#path').val(path);
				};
					
				get(path, gotFunc, failFunc);
			}
			if (querystring.m != _querystring.m){
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

		$('#btn-back').bind('click', function(){
			//FIXME: clickではなくナビゲーションが起きたときに判定
			if (planation($('#content').html()) === $('#stored-content').val() || confirm('Discard changes?'))
				window.history.back();
		});

		$('#btn-forward').bind('click', function(){
			//FIXME: clickではなくナビゲーションが起きたときに判定
			if (planation($('#content').html()) === $('#stored-content').val() || confirm('Discard changes?'))
				window.history.forward();
		});

		$('#btn-view-mode').bind('click', function(){
			editable();
		});

		$('*').bind('focus', function(){
			console.log(this.tagName + '#' + this.id + '.focus()');
		});

		var message = document.getElementById('message');

		// We're using textContent because inserting content from external sources into your page using innerHTML can be dangerous.
		// https://developer.mozilla.org/Web/API/Element.innerHTML#Security_considerations
		message.textContent = translate('message');

		$('#hash').text(window.location.hash);

		var DROPBOX_APP_KEY = 'vxi316ctxefojzh';

		$('#auth').bind('click', function(){
			window.open('https://www.dropbox.com/1/oauth2/authorize'
									+ '?response_type=token&client_id=vxi316ctxefojzh&redirect_uri=' + encodeURI('https://23904414-640a-4a7d-ac1e-e2d7594d2c6b/callback'));
		});

		$('.sel-select-heading').bind('change', function(){
			SelectHeading($(this).val());
			$(this).blur();
		});

		$('.delete-note').bind('click', function(){
			// 			var s = $('#content').val();
			var s = planation($('#content').html());
			var i = s.indexOf('\n')
			var path = $('#path').val();
			if (confirm('delete "' + path + '"?')){
				deleteNote(path);
			}
		});

		$('.back-tolist').bind('click', function(){
			// 			if ($('#content').val() === $('#stored-content').val() || confirm('Discard changes?')){
			//FIXME: clickではなくナビゲーションが起きたときに判定
			if (planation($('#content').html()) === $('#stored-content').val() || confirm('Discard changes?')){
				leaveInputArea();
			}
		});

		$('.add-note').bind('click', function(){
			addNote('');
		});

		$('.sync').bind('click', function(){
			if (! syncing){
				syncing = true;
				// alert('sync start');

				if (functions['afterCachePathesAndQueueCacheRequest'] === undefined)
					functions['afterCathesAndQueueCacheRequest'] = [];

				functions['afterCathesAndQueueCacheRequest'].push(function(){
					if (functions['afterListFromCache'] === undefined)
						functions['afterListFromCache'] = [];

					functions['afterListFromCache'].push(function(){
						syncing = false;
						// alert('sync complete');
					});
					
					listFromCache();
				});

				cachePathesAndQueueCacheRequest();
			}
		});

		$('#content').bind('click', function(){
			editable(true);
			$('#content').focus();
		});
		$('#content').bind('blur', function(){
			editable(false);
		});
		
		$('#post').bind('click', function(){
			// 		put($('#path').val(), $('#content').val());
			// 		var [path, content] = $('#content').val().split(/\n/, 2);
			// alert(typeof($('#content').val()));
			// 		var [, path, content] = $('#content').val().match(/^(.*?)\n(.*)$/);
			// 			var s = $('#content').val();
			var s = planation($('#content').html());
			var path = createPath(s);
			var content = s;
			// var content = s.substr(i + 1);
			// 		$('#path').val(path);

			var putSuccessFunc = function(data, textStatus, jqXHR){
				console.log('put: ' + textStatus + ',\n' + data);
				// cachePathesAndQueueCacheRequest();
				// listFromCache();

				leaveInputArea();
				$('#sync1').trigger('click');
			};
			var putErrorFunc = function(jqXHR, textStatus, errorThrown){
				console.log('put: ' + textStatus);
				alert('error: can\'t put to [' + path + ']: ' + textStatus + ',\n' + content);
			};

			if (path === $('#path').val() || $('#path').val() === '/.txt'){
				put(path, content, putSuccessFunc, putErrorFunc);
			}
			else {
				console.log('move: ' + $('#path').val() + ' to: ' + path);
				move($('#path').val(), path,
						 function(data, textStatus, jqXHR){
							 console.log('move: ' + textStatus);
							 put(path, content, putSuccessFunc, putErrorFunc);
						 },
						 function(jqXHR, textStatus, errorThrown){
							 alert('move:' + textStatus + ', ' + errorThrown);
						 }
						);
			}
		});

		if (localStorage.getItem('DROPBOX_ACCESS_TOKEN')){
			document.getElementById('access_token').innerHTML = localStorage.getItem('DROPBOX_ACCESS_TOKEN');
			$('#sync1').trigger('click');
		}
	}
});

function listFromCache()
{	
	new Promise(function(resolve, reject){
		eachCaches(function(items){
			$('#display').empty();
			var ul = $('<ul class="file-list"></ul>');
			ul.appendTo('#display');

			var folders = [];

			var switchContainer = $('.folder-switch-container');
			switchContainer.empty();

			console.info('listFromCache li: ' + items.length);
			for (var i in items){
				if (items[i].path == '/.txt')	// /.txt
					continue;

				var title = pathToTitle(items[i].path);
				
				var encodedSubFolders = [];
				var subFolders = items[i].path.split(/\//);
				subFolders.shift();
				subFolders.pop();
				subFolders.push('*');
				subFolders.forEach(function(folder, i2){
					folders[folder]++;
					encodedSubFolders.push(encodeURIComponent(folder).replace(/[%\(\)]/g, ''));
				});

				$('<li'
					//FIXME: CSSセレクターに合ったエスケープルール
					+ ' id="' + encodeURIComponent(items[i].path).replace(/[%\.\(\)]/g, '') + '"'
					+ ' class="'
					+ encodedSubFolders.join(' ')
					+ '">'
					// data-pathは日本語そのまま。
					//TODO: encodeURIComponent()
					+ '<a class="file-list-item" data-m="get" data-path="' + items[i].path + '">'
					+ title + '&emsp;<span class="desc">' + items[i].mime_type + '</span>'
					+ '<ul class="preview-texts" style="' + ($('#preview-switch').val() == 'Preview' ? 'display:none;' : '') + '"></ul>'
					+ '</a>'
					+ '</li>')
				.appendTo(ul);
			}

			$('a.file-list-item').bind('click', function(e){
				var querystring = Dropbox.Util.Oauth.queryParamsFromUrl(location.href);
				querystring.m = $(this).data('m');
				querystring.path = $(this).data('path');
				delete querystring.clear;
				window.location.hash = serializeQueryParams(querystring);
			});

			for (var folder in folders){
				var button = $('<button class="folder-switch" value="' + encodeURIComponent(folder).replace(/[%\(\)]/g, '') + '" data-label="' + encodeURIComponent(folder) + '">' + folder + '</button>');
				switchContainer.append(button);
			}

			$('.folder-switch').bind('click', function(){
				var querystring = Dropbox.Util.Oauth.queryParamsFromUrl(location.href);
				var key = $(this).val();
				if (key == encodeURIComponent('*')){
					delete querystring.folders;
					delete querystring['folder-labels'];
				}
				else {
					querystring.folders = key;
					querystring['folder-labels'] = $(this).data('label');
				}
				delete querystring.m;
				window.location.hash = serializeQueryParams(querystring);
			});

			var li_array = $('#display .file-list li');
			li_array.each(function(){ rendarPreviewTextQueue.unshift($(this)); });
			console.log('rendarPreviewTextQueue.length: ' + rendarPreviewTextQueue.length);
			setTimeout(rendarPreviewText, 0);

// 	li_array.each(function(){ cacheNotesQueue.unshift($(this)); });
// 	console.log('cacheNotesQueue.length: ' + cacheNotesQueue.length);
// 	setTimeout(cacheNotes, cacheNotesInterval);

			resolve();
		});
	}).then(function(resolveValue){
		var f = functions['afterListFromCache'].pop();
		f();
	});
}

function move(from, to, successFunc, errorFunc)
{
	$.ajax({
		url: 'https://api.dropbox.com/1/fileops/move'
			+ '?' + 'access_token=' + localStorage.getItem('DROPBOX_ACCESS_TOKEN')
			+ '&' + 'from_path=' + encodeURIComponent(from)
			+ '&' + 'to_path=' + encodeURIComponent(to)
			+ '&' + 'root=auto',	// auto, sandbox, dropbox
		method: 'POST',
		dataType: 'json',
// 		data: {
// 		},
// 		xhrFields: {
// 			withCredentials: false,
// 		},
		success: successFunc,
		error: errorFunc,
	});
}

function get(path, successFunc, errorFunc)
{
	$.ajax({
		url: 'https://api-content.dropbox.com/1/files/auto/' + encodeURIComponent(path),
		method: 'GET',
		dataType: 'text',
		data: {
			access_token: localStorage.getItem('DROPBOX_ACCESS_TOKEN'),
		},
		xhrFields: {
			withCredentials: false,
		},
		success: successFunc,
		error: errorFunc,
	});
}

function put(path, content, successFunc, errorFunc){
	var u = 'https://api-content.dropbox.com/1/files_put/auto/'
	+ encodeURIComponent(path)
	+ '?' + 'access_token=' + localStorage.getItem('DROPBOX_ACCESS_TOKEN');
	console.log('put:' + u);
	$.ajax({
		url: u,
		method: 'PUT',
		dataType: 'text',
		data: content,
		xhrFields: {
			withCredentials: false,
		},
		success: successFunc,
		error: errorFunc
	});
}

function deleteNote(path){
	var u = 'https://api.dropbox.com/1/fileops/delete'
	+ '?' + 'path=' + encodeURIComponent(path)
	+ '&' + 'root=auto'	// auto, sandbox, dropbox
	+ '&' + 'access_token=' + localStorage.getItem('DROPBOX_ACCESS_TOKEN');
	console.log('delete:' + u);
	$.ajax({
		url: u,
		method: 'POST',
		xhrFields: {
			withCredentials: false,
		},
		success: function(data, textStatus, jqXHR){
			console.log('delete: ' + textStatus);
			alert('delete: ' + textStatus);
			$('#sync1').trigger('click');
			leaveInputArea();
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('delete: ' + textStatus);
			alert('delete: ' + textStatus);
			//HACK:
			$('#sync1').trigger('click');
			leaveInputArea();
		},
	});
}

function SelectHeading(index)
{
	if (index == -1){
		window.scrollTo(window.scrollX, 0);
	}
	else {
		$('#content > h2, #content > h3, #content > h4').get(index).scrollIntoView();
		window.scrollTo(window.scrollX, window.scrollY - $('.sel-select-heading').eq(0).height() - 10);
	}
}

// function SelectHeading(lastIndex)
// {
// 	var t = $('#content');
// 	var start;
// 	var end;
// 	if (lastIndex == -1){
// 		t.get(0).setSelectionRange(0, 0);
// 		start = end = 0;
// 	}
// 	else {
// 		var re = /#+\s*(.+)/g;
// 		re.lastIndex = lastIndex;
// // 		var m = re.exec(t.val());
// 		var m = re.exec(planation(t.html()));
// 		start = re.lastIndex - m[0].length;
// 		end = re.lastIndex;
// 	}
// 	t.get(0).setSelectionRange(start, end);
// 	t.get(0).focus();
// }

function planation(html)
{
	return html.replace(/<br\s*\/?>/g, '\n').replace(/<.*?>/g, '');
}

// function focusInputArea(){
//  //switch input view
// 	var querystring = Dropbox.Util.Oauth.queryParamsFromUrl(location.href);
// 	querystring.m = 'get';
// 	window.location.hash = serializeQueryParams(querystring);
// }

function leaveInputArea(){
	//switch input view
	var querystring = Dropbox.Util.Oauth.queryParamsFromUrl(location.href);
	if (querystring.m)
		delete querystring.m;
	if (querystring.path)
		delete querystring.path;
	if (querystring.title)
		delete querystring.title;
	if (querystring.clear)
		delete querystring.clear;

	window.location.hash = serializeQueryParams(querystring);
}

function serializeQueryParams(obj)
{
	return $.param(obj);
//	return Object.keys(obj).map(function(key){ return key + '=' + encodeURIComponent(obj[key]) }).join('&');
}
