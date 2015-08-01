try {
	//action menu
	document.querySelector('#btn-action-menu').addEventListener ('click', function () {
	  document.querySelector('#action-menu').className = 'fade-in';
	});
	document.querySelector('#action-menu').addEventListener ('click', function () {
	  this.className = 'fade-out';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//buttons
	document.querySelector('#btn-buttons').addEventListener ('click', function () {
	  document.querySelector('#buttons').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-buttons-back').addEventListener ('click', function () {
	  document.querySelector('#buttons').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//confirm
	document.querySelector('#btn-confirm').addEventListener ('click', function () {
	  document.querySelector('#confirm').className = 'fade-in';
	});
	document.querySelector('#confirm').addEventListener ('click', function () {
	  this.className = 'fade-out';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//edit mode
	document.querySelector('#btn-edit-mode').addEventListener ('click', function () {
	  document.querySelector('#edit-mode').className = 'edit';
	});
	document.querySelector('#edit-mode').addEventListener ('click', function () {
	  this.className = '';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//headers
	document.querySelector('#btn-headers').addEventListener ('click', function () {
	  document.querySelector('#headers').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-headers-back').addEventListener ('click', function () {
	  document.querySelector('#headers').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//input areas
	document.querySelector('#btn-input-areas').addEventListener ('click', function () {
	  document.querySelector('#input-areas').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-input-areas-back').addEventListener ('click', function () {
		console.log('#btn-input-areas-back.click');
	  document.querySelector('#input-areas').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
		console.log('#btn-input-areas-back.click2');
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//status
	document.querySelector('#btn-status').addEventListener ('click', function () {
	  utils.status.show('The Alarm is set for 7 hours and 14 minutes from now');    
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//switches
	document.querySelector('#btn-switches').addEventListener ('click', function () {
	  document.querySelector('#switches').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-switches-back').addEventListener ('click', function () {
	  document.querySelector('#switches').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//lists
	document.querySelector('#btn-lists').addEventListener ('click', function () {
	  document.querySelector('#lists').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-lists-back').addEventListener ('click', function () {
	  document.querySelector('#lists').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//progress
	document.querySelector('#btn-progress').addEventListener ('click', function () {
	  document.querySelector('#progress').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-progress-back').addEventListener ('click', function () {
	  document.querySelector('#progress').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//scrolling
	document.querySelector('#btn-scrolling').addEventListener ('click', function () {
	  document.querySelector('#scrolling').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-scrolling-back').addEventListener ('click', function () {
	  document.querySelector('#scrolling').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//seek bars
	document.querySelector('#btn-seek-bars').addEventListener ('click', function () {
	  document.querySelector('#seek-bars').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	  var animend = (/webkit/i).test(navigator.appVersion) ? 'webkitAnimationEnd' : 'animationend';

	  document.addEventListener(animend, function animationend() {
	    document.removeEventListener(animend, animationend);
	    utils.seekbars.init();
	  });
	});
	document.querySelector('#btn-seek-bars-back').addEventListener ('click', function () {
	  document.querySelector('#seek-bars').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//tabs
	document.querySelector('#btn-tabs').addEventListener ('click', function () {
	  document.querySelector('#tabs').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-tabs-back').addEventListener ('click', function () {
	  document.querySelector('#tabs').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//filters
	document.querySelector('#btn-filters').addEventListener ('click', function () {
	  document.querySelector('#filters').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-filters-back').addEventListener ('click', function () {
	  document.querySelector('#filters').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

try {
	//toolbars
	document.querySelector('#btn-toolbars').addEventListener ('click', function () {
	  document.querySelector('#toolbars').className = 'current';
	  document.querySelector('[data-position="current"]').className = 'left';
	});
	document.querySelector('#btn-toolbars-back').addEventListener ('click', function () {
	  document.querySelector('#toolbars').className = 'right';
	  document.querySelector('[data-position="current"]').className = 'current';
	});
}
catch (ex){
	console.error(ex.message, ex);
}

