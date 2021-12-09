// ======== GENERAL ========
function obj(id) {
	return document.getElementById(id);
}
function handleRefresh(e) {
	if((e.which || e.keyCode) == 116) {
		e.preventDefault();
		refreshContent();
		refreshSidebar();
	}
}
function getCheckedRadioValue(name) {
	var rates = document.getElementsByName(name);
	for(var i = 0; i < rates.length; i++) {
		if(rates[i].checked) {
			return rates[i].value;
		}
	}
}

function rewriteUrlContentParameter(ajaxRequestUrl) {
	// compile parameters to replace from ajax request URL
	var paramsToReplace = {};
	var url = new URL(ajaxRequestUrl, location);
	paramsToReplace['view'] = url.pathname.split(/[\\/]/).pop().split('.')[0];
	for(const [key, value] of url.searchParams) {
		paramsToReplace[key] = value;
	}
	// now replace the parameters in current URL
	var kvp = []; // kvp looks like ['key1=value1', ...] // document.location.search.substr(1).split('&')
	for(const [ikey, ivalue] of Object.entries(paramsToReplace)) {
		key = encodeURIComponent(ikey);
		value = encodeURIComponent(ivalue);
		let i = 0;
		for(; i<kvp.length; i++) {
			if(kvp[i].startsWith(key + '=')) {
				let pair = kvp[i].split('=');
				pair[1] = value;
				kvp[i] = pair.join('=');
				break;
			}
		}
		if(i >= kvp.length) {
			kvp[kvp.length] = [key,value].join('=');
		}
	}
	window.history.pushState(
		currentExplorerContentUrl,
		document.title,
		document.location.pathname+'?'+kvp.join('&')
	);
}
window.onpopstate = function (event) {
	if(event.state != null) {
		// browser's back button pressed
		ajaxRequest(event.state, 'explorer-content', null, false);
	}
};

// ======== DIALOG ========
const DIALOG_BUTTONS_NONE   = 0;
const DIALOG_BUTTONS_RELOAD = 1;
const DIALOG_BUTTONS_CLOSE  = 2;
const DIALOG_SIZE_LARGE     = 0;
const DIALOG_SIZE_SMALL     = 1;
const DIALOG_SIZE_AUTO      = 2;
function showDialog(title='', text='', controls=false, size=false, monospace=false) {
	showDialogHTML(title, escapeHTML(text), controls, size, monospace);
}
function showDialogAjax(title='', url='', controls=false, size=false, monospace=false) {
	ajaxRequest(url, null, function(text) {
		showDialogHTML(title, text, controls, size, monospace);
	}, false)
}
function showDialogHTML(title='', text='', controls=false, size=false, monospace=false) {
	obj('dialog-container').classList.add('active');
	obj('dialog-title').innerText = title;
	obj('dialog-text').innerHTML = text;
	if(controls == DIALOG_BUTTONS_RELOAD) {
		obj('dialog-controls').style.display = 'flex';
		obj('btnDialogHome').style.visibility = 'visible';
		obj('btnDialogReload').style.visibility = 'visible';
		obj('btnDialogClose').style.visibility = 'visible';
	} else if(controls == DIALOG_BUTTONS_CLOSE) {
		obj('dialog-controls').style.display = 'flex';
		obj('btnDialogHome').style.visibility = 'collapse';
		obj('btnDialogReload').style.visibility = 'collapse';
		obj('btnDialogClose').style.visibility = 'inline-block';
	} else {
		obj('dialog-controls').style.display = 'none';
	}
	obj('dialog-box').className = '';
	if(size == DIALOG_SIZE_LARGE) {
		obj('dialog-box').classList.add('large');
	} else if(size == DIALOG_SIZE_SMALL) {
		obj('dialog-box').classList.add('small');
	}
	if(monospace) {
		obj('dialog-text').classList.add('monospace');
	} else {
		obj('dialog-text').classList.remove('monospace');
	}
}
function hideDialog() {
	obj('dialog-container').classList.remove('active');
}
function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// ======== AJAX OPERATIONS ========
var currentExplorerContentUrl = null;
function ajaxRequest(url, objID, callback, addToHistory=true, showFullscreenLoader=true) {
	let timer = null;
	if(objID == 'explorer-content') {
		currentExplorerContentUrl = url;
		showLoader(true);
		if(showFullscreenLoader) timer = setTimeout(function(){ showLoader2(true) }, 100);
	}
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState != 4) {
			return;
		}
		if(this.status == 200) {
			if(obj(objID) != null) {
				obj(objID).innerHTML = this.responseText;
				if(objID == 'explorer-content') {
					// add to history
					if(addToHistory) rewriteUrlContentParameter(currentExplorerContentUrl);
					// set page title
					let titleObject = obj('page-title');
					if(titleObject != null) document.title = titleObject.innerText;
					else document.title = L__DEFAULT_PAGE_TITLE;
					// init newly loaded tables
					initTableSort()
					initTableSearch()
				}
			}
			if(callback != undefined && typeof callback == 'function') {
				callback(this.responseText);
			}
		} else if(this.status == 401) {
			window.location.href = 'login.php';
		} else {
			if(this.status == 0) {
				emitMessage(L__NO_CONNECTION_TO_SERVER, L__PLEASE_CHECK_NETWORK, MESSAGE_TYPE_ERROR);
			} else {
				emitMessage(L__ERROR+' '+this.status+' '+this.statusText, this.responseText, MESSAGE_TYPE_ERROR);
			}
		}
		// hide loaders
		if(objID == 'explorer-content') {
			if(showFullscreenLoader) clearTimeout(timer);
			showLoader(false);
			showLoader2(false);
		}
	};
	xhttp.open("GET", url, true);
	xhttp.send();
}
function ajaxRequestPost(url, body, objID, callback, errorCallback) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200) {
			if(obj(objID) != null) {
				obj(objID).innerHTML = this.responseText;
				if(objID == 'explorer-content') {
					initTableSort()
					initTableSearch()
				}
			}
			if(callback != undefined && typeof callback == 'function') {
				callback(this.responseText);
			}
		} else if(this.readyState == 4) {
			if(errorCallback != undefined && typeof errorCallback == 'function') {
				errorCallback(this.status, this.statusText, this.responseText);
			} else {
				emitMessage(L__ERROR+' '+this.status+' '+this.statusText, this.responseText, MESSAGE_TYPE_ERROR);
			}
		}
	};
	xhttp.open("POST", url, true);
	xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhttp.send(body);
}
function urlencodeObject(srcjson) {
	if(typeof srcjson !== "object") return null;
	var urljson = "";
	var keys = Object.keys(srcjson);
	for(var i=0; i <keys.length; i++){
		urljson += encodeURIComponent(keys[i]) + "=" + encodeURIComponent(srcjson[keys[i]]);
		if(i < (keys.length-1)) urljson+="&";
	}
	return urljson;
}
function urlencodeArray(src) {
	if(!Array.isArray(src)) return null;
	var urljson = "";
	for(var i=0; i <src.length; i++){
		urljson += encodeURIComponent(src[i]['key']) + "=" + encodeURIComponent(src[i]['value']);
		if(i < (src.length-1)) urljson+="&";
	}
	return urljson;
}

function showLoader(state) {
	if(state) {
		document.body.classList.add('loading');
	} else {
		document.body.classList.remove('loading');
	}
}
function showLoader2(state) {
	if(state) {
		document.body.classList.add('loading2');
	} else {
		document.body.classList.remove('loading2');
	}
}

function getSelectValues(select, except=null) {
	var result = [];
	var options = select && select.options;
	var opt;
	for(var i=0, iLen=options.length; i<iLen; i++) {
		opt = options[i];
		if(opt.selected && opt.value != except) {
			result.push(opt.value || opt.text);
		}
	}
	return result;
}
function setInputsDisabled(rootElement, disabled) {
	var elements = rootElement.querySelectorAll('input, select, textarea, button');
	for(var i = 0; i < elements.length; i++) {
		elements[i].disabled = disabled;
	}
}

// ======== CONTENT REFRESH FUNCTIONS ========
const REFRESH_SIDEBAR_TIMEOUT = 10000;
const REFRESH_CONTENT_TIMEOUT = 2000;
var refreshContentTimer = null;
var refreshSidebarTimer = null;
function refreshSidebar(callback=null, handleAutoRefresh=false) {
	ajaxRequest('views/tree.php', 'explorer-tree', function() {
		// execute custom callback
		if(callback != undefined && typeof callback == 'function') callback(text);
		// schedule next refresh after loading finished
		if(handleAutoRefresh && refreshSidebarTimer != null) {
			refreshSidebarTimer = setTimeout(function(){ refreshSidebar(null, true) }, REFRESH_SIDEBAR_TIMEOUT);
		}
	}, false);
}
function refreshContent(callback=null, handleAutoRefresh=false) {
	if(currentExplorerContentUrl == null) return;
	ajaxRequest(currentExplorerContentUrl, 'explorer-content', function(text) {
		// execute custom callback
		if(callback != undefined && typeof callback == 'function') callback(text);
		// schedule next refresh after loading finished
		if(handleAutoRefresh && refreshContentTimer != null) {
			scheduleNextContentRefresh();
		}
	}, false, !handleAutoRefresh);
}
function scheduleNextContentRefresh() {
	refreshContentTimer = setTimeout(function(){ refreshContent(null, true) }, REFRESH_CONTENT_TIMEOUT);
}
function toggleAutoRefresh() {
	if(refreshContentTimer == null) {
		scheduleNextContentRefresh();
		btnRefresh.classList.add('active');
	} else {
		clearTimeout(refreshContentTimer);
		refreshContentTimer = null;
		btnRefresh.classList.remove('active');
	}
}
function refreshContentExplorer(url) {
	ajaxRequest(url, 'explorer-content');
}
function refreshContentPackageNew(name=null, version=null, description=null, install_procedure=null, install_procedure_success_return_codes=null, install_procedure_post_action=null, uninstall_procedure=null, uninstall_procedure_success_return_codes=null, uninstall_procedure_post_action=null, download_for_uninstall=null, compatible_os=null, compatible_os_version=null) {
	ajaxRequest('views/package-new.php?' +
		(name ? '&name='+encodeURIComponent(name) : '') +
		(version ? '&version='+encodeURIComponent(version) : '') +
		(description ? '&description='+encodeURIComponent(description) : '') +
		(install_procedure ? '&install_procedure='+encodeURIComponent(install_procedure) : '') +
		(install_procedure_success_return_codes ? '&install_procedure_success_return_codes='+encodeURIComponent(install_procedure_success_return_codes) : '') +
		(install_procedure_post_action ? '&install_procedure_post_action='+encodeURIComponent(install_procedure_post_action) : '') +
		(uninstall_procedure ? '&uninstall_procedure='+encodeURIComponent(uninstall_procedure) : '') +
		(uninstall_procedure_success_return_codes ? '&uninstall_procedure_success_return_codes='+encodeURIComponent(uninstall_procedure_success_return_codes) : '') +
		(uninstall_procedure_post_action ? '&uninstall_procedure_post_action='+encodeURIComponent(uninstall_procedure_post_action) : '') +
		(download_for_uninstall ? '&download_for_uninstall='+encodeURIComponent(download_for_uninstall) : '') +
		(compatible_os ? '&compatible_os='+encodeURIComponent(compatible_os) : '') +
		(compatible_os_version ? '&compatible_os_version='+encodeURIComponent(compatible_os_version) : ''),
		'explorer-content'
	);
}
function refreshContentDeploy(package_ids=[], package_group_ids=[], computer_ids=[], computer_group_ids=[]) {
	var params = [];
	package_ids.forEach(function(entry) {
		params.push({'key':'package_id[]', 'value':entry});
	});
	package_group_ids.forEach(function(entry) {
		params.push({'key':'package_group_id[]', 'value':entry});
	});
	computer_ids.forEach(function(entry) {
		params.push({'key':'computer_id[]', 'value':entry});
	});
	computer_group_ids.forEach(function(entry) {
		params.push({'key':'computer_group_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequest('views/deploy.php?'+paramString, 'explorer-content', function(){
		refreshDeployComputerAndPackages(sltComputerGroup.value, sltPackageGroup.value, computer_ids, package_ids);
	});
}

// ======== SEARCH OPERATIONS ========
function doSearch(query) {
	ajaxRequest('views/search.php?query='+encodeURIComponent(query), 'search-results');
	openSearchResults();
}
function closeSearchResults() {
	obj('search-results').style.display = 'none';
	obj('search-glass').classList.remove('focus');
}
function openSearchResults() {
	obj('search-results').style.display = 'block';
	obj('search-glass').classList.add('focus');
}
function handleSearchResultNavigation(event) {
	if(event.code == 'ArrowDown') focusNextSearchResult();
	else if(event.code == 'ArrowUp') focusNextSearchResult(-1);
}
function focusNextSearchResult(step=1) {
	var links = document.querySelectorAll('#search-results a');
	for(let i=0; i<links.length; i++) {
		if(links[i] === document.activeElement) {
			var next = links[i + step] || links[0];
			next.focus();
			return;
		}
	}
	links[0].focus();
}

// ======== MESSAGE BOX OPERATIONS ========
const MESSAGE_TYPE_INFO    = 'info';
const MESSAGE_TYPE_SUCCESS = 'success';
const MESSAGE_TYPE_WARNING = 'warning';
const MESSAGE_TYPE_ERROR   = 'error';
function emitMessage(title, text, type='info', timeout=8000) {
	var messageBox = document.createElement('div');
	messageBox.classList.add('message');
	messageBox.classList.add('icon');
	messageBox.classList.add(type);
	var messageBoxTitle = document.createElement('div');
	messageBoxTitle.classList.add('message-title');
	messageBoxTitle.innerText = title;
	messageBox.appendChild(messageBoxTitle);
	var messageBoxText = document.createElement('div');
	messageBoxText.innerText = text;
	messageBox.appendChild(messageBoxText);
	var messageBoxClose = document.createElement('button');
	messageBoxClose.classList.add('message-close');
	messageBoxClose.innerText = 'Close';
	messageBoxClose.onclick = function() { messageBox.remove(); };
	messageBox.appendChild(messageBoxClose);
	obj('message-container').prepend(messageBox);
	if(timeout != null) setTimeout(function() { messageBox.remove(); }, timeout);
}

// ======== PACKAGE OPERATIONS ========
function updatePackageProcedureTemplates() {
	if(fleArchive.files.length > 0) {
		var newOptions = '';
		var i, L = lstInstallProceduresTemplates.options.length - 1;
		for(i = L; i >= 0; i--) {
			newOptions += '<option>'+lstInstallProceduresTemplates.options[i].innerText.replace('[FILENAME]',fleArchive.files[0].name)+'</option>';
		}
		lstInstallProcedures.innerHTML = newOptions;

		var newOptions2 = '';
		var i, L = lstUninstallProceduresTemplates.options.length - 1;
		for(i = L; i >= 0; i--) {
			var fileName = fleArchive.files[0].name;
			if(fileName.endsWith('.deb')) fileName = fileName.replace('.deb', '');
			newOptions2 += '<option>'+lstUninstallProceduresTemplates.options[i].innerText.replace('[FILENAME]',fileName)+'</option>';
		}
		lstUninstallProcedures.innerHTML = newOptions2;
	}
}
function createPackage(name, version, description, archive, install_procedure, install_procedure_success_return_codes, install_procedure_post_action, uninstall_procedure, uninstall_procedure_success_return_codes, download_for_uninstall, uninstall_procedure_post_action, compatible_os, compatible_os_version) {
	if(typeof archive === 'undefined') {
		if(!confirm(L__CONFIRM_CREATE_EMPTY_PACKAGE)) {
			return;
		}
	}

	setInputsDisabled(frmNewPackage, true);
	btnCreatePackage.style.display = 'none';
	prgPackageUploadContainer.style.display = 'inline-block';

	let req = new XMLHttpRequest();
	let formData = new FormData();
	formData.append('name', name);
	formData.append('version', version);
	formData.append('description', description);
	formData.append('archive', archive);
	formData.append('install_procedure', install_procedure);
	formData.append('install_procedure_success_return_codes', install_procedure_success_return_codes);
	formData.append('install_procedure_post_action', install_procedure_post_action);
	formData.append('uninstall_procedure', uninstall_procedure);
	formData.append('uninstall_procedure_success_return_codes', uninstall_procedure_success_return_codes);
	formData.append('download_for_uninstall', download_for_uninstall ? '1' : '0');
	formData.append('uninstall_procedure_post_action', uninstall_procedure_post_action);
	formData.append('compatible_os', compatible_os);
	formData.append('compatible_os_version', compatible_os_version);

	req.upload.onprogress = function(evt) {
		if(evt.lengthComputable) {
			var progress = Math.ceil((evt.loaded / evt.total) * 100);
			if(progress == 100) {
				prgPackageUpload.classList.add('animated');
				prgPackageUploadText.innerText = L__IN_PROGRESS;
				prgPackageUpload.style.width = '100%';
			} else {
				prgPackageUpload.classList.remove('animated');
				prgPackageUploadText.innerText = progress + '%';
				prgPackageUpload.style.width = progress + '%';
			}
		} else {
			console.warn('form length is not computable');
			prgPackageUpload.classList.add('animated');
			prgPackageUploadText.innerText = L__IN_PROGRESS;
			prgPackageUpload.style.width = '100%';
		}
	};
	req.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200) {
				var newPackageId = parseInt(this.responseText);
				refreshContentExplorer('views/package-details.php?id='+newPackageId);
				emitMessage(L__PACKAGE_CREATED, name+' ('+version+')', MESSAGE_TYPE_SUCCESS);
				if(newPackageId == 1 || newPackageId % 100 == 0) topConfettiRain();
			} else {
				emitMessage(L__ERROR+' '+this.status+' '+this.statusText, this.responseText, MESSAGE_TYPE_ERROR);
				setInputsDisabled(frmNewPackage, false);
				btnCreatePackage.style.display = 'inline-block';
				prgPackageUploadContainer.style.display = 'none';
			}
		}
	};

	req.open('POST', 'ajax-handler/packages.php');
	req.send(formData);
}
function renamePackageFamily(id, oldValue) {
	var newValue = prompt(L__ENTER_NAME, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_family_id':id, 'update_name':newValue}), null, function() {
			refreshContent();
			emitMessage(L__OBJECT_RENAMED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function removePackageFamilyIcon(id) {
	if(!confirm(L__ARE_YOU_SURE)) return;
	ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_family_id':id, 'remove_icon':1}), null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function editPackageFamilyIcon(id, file) {
	if(file.size/1024/1024 > 2/*MiB*/) {
		emitMessage(L__FILE_TOO_BIG, '', MESSAGE_TYPE_ERROR);
		return;
	}

	let req = new XMLHttpRequest();
	let formData = new FormData();
	formData.append('update_package_family_id', id);
	formData.append('update_icon', file);

	req.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200) {
				refreshContent();
				emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
			} else {
				emitMessage(L__ERROR+' '+this.status+' '+this.statusText, this.responseText, MESSAGE_TYPE_ERROR);
			}
		}
	};

	req.open('POST', 'ajax-handler/packages.php');
	req.send(formData);
}
function editPackageFamilyNotes(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_family_id':id, 'update_notes':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageVersion(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_version':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageInstallProcedure(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_install_procedure':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageInstallProcedureSuccessReturnCodes(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_install_procedure_success_return_codes':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageInstallProcedureAction(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_PROCEDURE_POST_ACTION, oldValue);
	if(newValue != null && newValue != '') {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_install_procedure_action':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageUninstallProcedure(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_uninstall_procedure':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageUninstallProcedureSuccessReturnCodes(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_uninstall_procedure_success_return_codes':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageUninstallProcedureAction(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_PROCEDURE_POST_ACTION, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_uninstall_procedure_action':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageDownloadForUninstall(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_DOWNLOAD_FOR_UNINSTALL_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_download_for_uninstall':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageNotes(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_note':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageCompatibleOs(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_compatible_os':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editPackageCompatibleOsVersion(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'update_package_id':id, 'update_compatible_os_version':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function reorderPackageInGroup(groupId, oldPos, newPos) {
	var params = [];
	params.push({'key':'move_in_group', 'value':groupId});
	params.push({'key':'move_from_pos', 'value':oldPos});
	params.push({'key':'move_to_pos', 'value':newPos});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/packages.php', paramString, null, refreshContent);
}
function removeSelectedPackage(checkboxName, attributeName=null, event=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	confirmRemovePackage(ids, event);
}
function confirmRemovePackage(ids, event=null, infoText='') {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_id[]', 'value':entry});
	});
	if(event != null && event.shiftKey) {
		params.push({'key':'force', 'value':'1'});
	}
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE_PACKAGE)) {
		ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
			refreshContent();
			emitMessage(L__OBJECT_DELETED, infoText, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function removeSelectedPackageFromGroup(checkboxName, groupId) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	removePackageFromGroup(ids, groupId);
}
function removePackageFromGroup(ids, groupId) {
	var params = [];
	params.push({'key':'remove_from_group_id', 'value':groupId});
	ids.forEach(function(entry) {
		params.push({'key':'remove_from_group_package_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__OBJECT_REMOVED_FROM_GROUP, '', MESSAGE_TYPE_SUCCESS);
	});
}
function removeSelectedPackageFamily(checkboxName, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	confirmRemovePackageFamily(ids);
}
function confirmRemovePackageFamily(ids, infoText='') {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_package_family_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE)) {
		ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
			refreshContent();
			emitMessage(L__OBJECT_DELETED, infoText, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function deploySelectedPackage(checkboxName, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	refreshContentDeploy(ids);
}
function newPackageGroup(parent_id=null) {
	var newName = prompt(L__ENTER_NAME);
	if(newName != null && newName != '') {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'add_group':newName, 'parent_id':parent_id}), null, function(text) {
			refreshContentExplorer('views/packages.php?id='+parseInt(text));
			refreshSidebar();
			emitMessage(L__GROUP_CREATED, newName, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function renamePackageGroup(id, oldName) {
	var newValue = prompt(L__ENTER_NAME, oldName);
	if(newValue != null && newValue != '') {
		ajaxRequestPost('ajax-handler/packages.php', urlencodeObject({'rename_group':id, 'new_name':newValue}), null, function() {
			refreshContent(); refreshSidebar();
			emitMessage(L__GROUP_RENAMED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function confirmRemovePackageGroup(ids, event=null, infoText='') {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_group_id[]', 'value':entry});
	});
	if(event != null && event.shiftKey) {
		params.push({'key':'force', 'value':'1'});
	}
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE_GROUP)) {
		ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
			refreshContentExplorer('views/packages.php'); refreshSidebar();
			emitMessage(L__GROUP_DELETED, infoText, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function addSelectedPackageToGroup(checkboxName, groupId, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var params = [];
	params.push({'key':'add_to_group_id', 'value':groupId});
	ids.forEach(function(entry) {
		params.push({'key':'add_to_group_package_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
		emitMessage(L__PACKAGES_ADDED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function addPackageToGroup(packageId, groupId) {
	var params = [];
	params.push({'key':'add_to_group_id', 'value':groupId});
	params.push({'key':'add_to_group_package_id[]', 'value':packageId});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__PACKAGES_ADDED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function addPackageDependency(packageId, dependencyPackageId) {
	var params = [];
	params.push({'key':'update_package_id', 'value':packageId});
	params.push({'key':'add_dependency_package_id', 'value':dependencyPackageId});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function removeSelectedPackageDependency(checkboxName, packageId) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	removePackageDependency(ids, packageId);
}
function removePackageDependency(ids, packageId) {
	var params = [];
	params.push({'key':'update_package_id', 'value':packageId});
	ids.forEach(function(entry) {
		params.push({'key':'remove_dependency_package_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function removeSelectedDependentPackages(checkboxName, packageId) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	removeDependentPackages(ids, packageId);
}
function removeDependentPackages(ids, packageId) {
	var params = [];
	params.push({'key':'update_package_id', 'value':packageId});
	ids.forEach(function(entry) {
		params.push({'key':'remove_dependent_package_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/packages.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function confirmUninstallPackage(checkboxName, defaultStartTime) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'uninstall_package_assignment_id[]', 'value':entry});
	});
	var startTime = prompt(L__CONFIRM_UNINSTALL_PACKAGE, defaultStartTime);
	if(startTime != null && startTime != '') {
		params.push({'key':'start_time', 'value':startTime});
		var paramString = urlencodeArray(params);
		ajaxRequestPost('ajax-handler/computers.php', paramString, null, function() {
			refreshSidebar(); refreshContent();
			emitMessage(L__JOBS_CREATED, '', MESSAGE_TYPE_SUCCESS);
		});
	}
}
function confirmRemovePackageComputerAssignment(checkboxName) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_package_assignment_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_REMOVE_PACKAGE_ASSIGNMENT)) {
		ajaxRequestPost('ajax-handler/computers.php', paramString, null, function() {
			refreshContent();
			emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
		});
	}
}
function refreshDeployComputerAndPackages(refreshComputersGroupId=null, refreshPackagesGroupId=null, preselectComputerIds=[], preselectPackageIds=[]) {
	if(refreshComputersGroupId != null) {
		var params = [];
		params.push({'key':'get_computer_group_members', 'value':refreshComputersGroupId});
		preselectComputerIds.forEach(function(entry) {
			params.push({'key':'computer_id[]', 'value':entry});
		});
		ajaxRequest("ajax-handler/deploy.php?"+urlencodeArray(params), 'sltComputer', function(){ refreshDeployCount() });
		if(refreshComputersGroupId < 1) sltComputerGroup.value = -1;
	}
	if(refreshPackagesGroupId != null) {
		var params = [];
		params.push({'key':'get_package_group_members', 'value':refreshPackagesGroupId});
		preselectPackageIds.forEach(function(entry) {
			params.push({'key':'package_id[]', 'value':entry});
		});
		ajaxRequest("ajax-handler/deploy.php?"+urlencodeArray(params), 'sltPackage', function(){ refreshDeployCount() });
		if(refreshPackagesGroupId < 1) sltPackageGroup.value = -1;
	}
}
function refreshDeployCount() {
	spnSelectedComputers.innerHTML = getSelectValues(sltComputer).length;
	spnSelectedPackages.innerHTML = getSelectValues(sltPackage).length;
	spnTotalComputers.innerHTML = sltComputer.options.length;
	spnTotalPackages.innerHTML = sltPackage.options.length;

	let computerGroupCount = getSelectValues(sltComputerGroup, -1).length;
	let packageGroupCount = getSelectValues(sltPackageGroup, -1).length;

	// computer ids have priority - if only one group is selected, we evaluate the selected computers instead of the whole group
	if(computerGroupCount == 1) spnSelectedComputerGroups.innerHTML = '0';
	else spnSelectedComputerGroups.innerHTML = computerGroupCount;

	// package ids have priority - if only one group is selected, we evaluate the selected packages instead of the whole group
	if(packageGroupCount == 1) spnSelectedPackageGroups.innerHTML = '0';
	else spnSelectedPackageGroups.innerHTML = packageGroupCount;

	spnTotalComputerGroups.innerHTML = sltComputerGroup.options.length;
	spnTotalPackageGroups.innerHTML = sltPackageGroup.options.length;
}

// ======== COMPUTER OPERATIONS ========
function editComputerNotes(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/computers.php', urlencodeObject({'update_computer_id':id, 'update_note':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function setComputerForceUpdate(id, value) {
	ajaxRequestPost('ajax-handler/computers.php', urlencodeObject({'update_computer_id':id, 'update_force_update':value}), null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function newComputer() {
	var newName = prompt(L__ENTER_NAME);
	if(newName != null) {
		var params = [];
		params.push({'key':'add_computer', 'value':newName});
		var paramString = urlencodeArray(params);
		ajaxRequestPost('ajax-handler/computers.php', paramString, null, function(text) {
			refreshContentExplorer('views/computer-details.php?id='+parseInt(text));
			emitMessage(L__COMPUTER_CREATED, newName, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function removeSelectedComputerFromGroup(checkboxName, groupId) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	removeComputerFromGroup(ids, groupId);
}
function removeComputerFromGroup(ids, groupId) {
	var params = [];
	params.push({'key':'remove_from_group_id', 'value':groupId});
	ids.forEach(function(entry) {
		params.push({'key':'remove_from_group_computer_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/computers.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__OBJECT_REMOVED_FROM_GROUP, '', MESSAGE_TYPE_SUCCESS);
	});
}
function removeSelectedComputer(checkboxName, attributeName=null, event=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	confirmRemoveComputer(ids, event);
}
function confirmRemoveComputer(ids, event=null, infoText='') {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_id[]', 'value':entry});
	});
	if(event != null && event.shiftKey) {
		params.push({'key':'force', 'value':'1'});
	}
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE)) {
		ajaxRequestPost('ajax-handler/computers.php', paramString, null, function() {
			refreshContent();
			emitMessage(L__OBJECT_DELETED, infoText, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function deploySelectedComputer(checkboxName, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	refreshContentDeploy([],[],ids);
}
function renameComputer(id, oldName) {
	var newValue = prompt(L__ENTER_NEW_HOSTNAME, oldName);
	if(newValue != null && newValue != '') {
		ajaxRequestPost('ajax-handler/computers.php', urlencodeObject({'rename_computer_id':id, 'new_name':newValue}), null, function() {
			refreshContent();
			emitMessage(L__OBJECT_RENAMED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function wolSelectedComputer(checkboxName, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	confirmWolComputer(ids);
}
function confirmWolComputer(ids) {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'wol_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/computers.php', paramString, null, function() {
		emitMessage(L__WOL_SENT, '', MESSAGE_TYPE_SUCCESS);
	});
}
function newComputerGroup(parent_id=null) {
	var newName = prompt(L__ENTER_NAME);
	if(newName != null && newName != '') {
		ajaxRequestPost('ajax-handler/computers.php', urlencodeObject({'add_group':newName, 'parent_id':parent_id}), null, function(text){
			refreshSidebar(); refreshContentExplorer('views/computers.php?id='+parseInt(text));
			emitMessage(L__GROUP_CREATED, newName, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function renameComputerGroup(id, oldName) {
	var newValue = prompt(L__ENTER_NAME, oldName);
	if(newValue != null && newValue != '') {
		ajaxRequestPost('ajax-handler/computers.php', urlencodeObject({'rename_group':id, 'new_name':newValue}), null, function() {
			refreshContent(); refreshSidebar();
			emitMessage(L__GROUP_RENAMED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function confirmRemoveComputerGroup(ids, event=null, infoText='') {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_group_id[]', 'value':entry});
	});
	if(event != null && event.shiftKey) {
		params.push({'key':'force', 'value':'1'});
	}
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE_GROUP)) {
		ajaxRequestPost('ajax-handler/computers.php', paramString, null, function() {
			refreshContentExplorer('views/computers.php'); refreshSidebar();
			emitMessage(L__GROUP_DELETED, infoText, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function addSelectedComputerToGroup(checkboxName, groupId, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var params = [];
	params.push({'key':'add_to_group_id', 'value':groupId});
	ids.forEach(function(entry) {
		params.push({'key':'add_to_group_computer_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/computers.php', paramString, null, function() {
		emitMessage(L__COMPUTER_ADDED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function addComputerToGroup(computerId, groupId) {
	var params = [];
	params.push({'key':'add_to_group_id', 'value':groupId});
	params.push({'key':'add_to_group_computer_id[]', 'value':computerId});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/computers.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__COMPUTER_ADDED, '', MESSAGE_TYPE_SUCCESS);
	});
}

// ======== JOB OPERATIONS ========
function removeSelectedJobContainer(checkboxName, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	confirmRemoveJobContainer(ids);
}
function confirmRemoveJobContainer(ids, infoText='') {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_container_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE_JOBCONTAINER)) {
		ajaxRequestPost('ajax-handler/job-containers.php', paramString, null, function() {
			refreshContentExplorer('views/job-containers.php'); refreshSidebar();
			emitMessage(L__OBJECT_DELETED, infoText, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function removeSelectedJob(checkboxName, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	confirmRemoveJob(ids);
}
function confirmRemoveJob(ids) {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_job_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE_JOB)) {
		ajaxRequestPost('ajax-handler/job-containers.php', paramString, null, function() {
			refreshContent(); refreshSidebar();
			emitMessage(L__OBJECT_DELETED, '', MESSAGE_TYPE_SUCCESS);
		});
	}
}
function confirmRenewFailedJobsInContainer(id, defaultStartTime) {
	if(!confirm(L__CONFIRM_RENEW_JOBS)) { return; }
	var startTime = prompt(L__ENTER_START_TIME, defaultStartTime);
	if(startTime == null || startTime == '') { return; }
	ajaxRequestPost('ajax-handler/job-containers.php', urlencodeObject({'renew_container_id':id, 'renew_start_time':startTime}), null, function() {
		refreshContent(); refreshSidebar();
		emitMessage(L__JOBS_CREATED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function renameJobContainer(id, oldName) {
	var newValue = prompt(L__ENTER_NAME, oldName);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/job-containers.php', urlencodeObject({'edit_container_id':id, 'new_name':newValue}), null, function() {
			refreshContent(); refreshSidebar();
			emitMessage(L__OBJECT_RENAMED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editJobContainerStart(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/job-containers.php', urlencodeObject({'edit_container_id':id, 'new_start':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editJobContainerEnd(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/job-containers.php', urlencodeObject({'edit_container_id':id, 'new_end':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editJobContainerSequenceMode(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/job-containers.php', urlencodeObject({'edit_container_id':id, 'new_sequence_mode':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editJobContainerPriority(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/job-containers.php', urlencodeObject({'edit_container_id':id, 'new_priority':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editJobContainerNotes(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/job-containers.php', urlencodeObject({'edit_container_id':id, 'new_notes':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function deploy(title, start, end, description, sltComputer, sltComputerGroup, sltPackage, sltPackageGroup, useWol, shutdownWakedAfterCompletion, autoCreateUninstallJobs, forceInstallSameVersion, restartTimeout, sequenceMode, priority) {
	setInputsDisabled(frmDeploy, true);
	btnDeploy.style.display = 'none';
	prgDeployContainer.style.display = 'flex';

	let req = new XMLHttpRequest();
	let formData = new FormData();
	formData.append('add_jobcontainer', title);
	formData.append('date_start', start);
	formData.append('date_end', end);
	formData.append('description', description);
	formData.append('use_wol', useWol ? 1 : 0);
	formData.append('shutdown_waked_after_completion', shutdownWakedAfterCompletion ? 1 : 0);
	formData.append('auto_create_uninstall_jobs', autoCreateUninstallJobs ? 1 : 0);
	formData.append('force_install_same_version', forceInstallSameVersion ? 1 : 0);
	formData.append('restart_timeout', restartTimeout);
	formData.append('sequence_mode', sequenceMode);
	formData.append('priority', priority);
	getSelectValues(sltPackage).forEach(function(entry) {
		formData.append('package_id[]', entry);
	});
	getSelectValues(sltPackageGroup).forEach(function(entry) {
		formData.append('package_group_id[]', entry);
	});
	getSelectValues(sltComputer).forEach(function(entry) {
		formData.append('computer_id[]', entry);
	});
	getSelectValues(sltComputerGroup).forEach(function(entry) {
		formData.append('computer_group_id[]', entry);
	});
	req.open('POST', 'ajax-handler/deploy.php');
	req.send(formData);
	req.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200) {
				refreshContentExplorer('views/job-containers.php?id='+parseInt(this.responseText));
				refreshSidebar();
				emitMessage(L__JOBS_CREATED, title, MESSAGE_TYPE_SUCCESS);
			} else {
				emitMessage(L__ERROR+' '+this.status+' '+this.statusText, this.responseText, MESSAGE_TYPE_ERROR);
				setInputsDisabled(frmDeploy, false);
				btnDeploy.style.display = 'inline-block';
				prgDeployContainer.style.display = 'none';
			}
		}
	};
}

// ======== DOMAINUSER OPERATIONS ========
function confirmRemoveSelectedDomainuser(checkboxName) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE)) {
		ajaxRequestPost('ajax-handler/domain-users.php', paramString, null, function() {
			refreshContent();
			emitMessage(L__OBJECT_DELETED, '', MESSAGE_TYPE_SUCCESS);
		});
	}
}

// ======== REPOT OPERATIONS ========
function newReportGroup(parent_id=null) {
	var newValue = prompt(L__ENTER_NAME);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/reports.php', urlencodeObject({'add_group':newValue, 'parent_id':parent_id}), null, function(text) {
			refreshContentExplorer('views/reports.php?id='+parseInt(text));
			refreshSidebar();
			emitMessage(L__GROUP_CREATED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function renameReportGroup(id, oldName) {
	var newValue = prompt(L__ENTER_NAME, oldName);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/reports.php', urlencodeObject({'rename_group':id, 'new_name':newValue}), null, function() {
			refreshContent(); refreshSidebar();
			emitMessage(L__GROUP_RENAMED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function confirmRemoveReportGroup(ids, event=null, infoText='') {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_group_id[]', 'value':entry});
	});
	if(event != null && event.shiftKey) {
		params.push({'key':'force', 'value':'1'});
	}
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE_GROUP)) {
		ajaxRequestPost('ajax-handler/reports.php', paramString, null, function() {
			refreshContentExplorer('views/reports.php'); refreshSidebar();
			emitMessage(L__GROUP_DELETED, infoText, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function newReport(group_id=0) {
	var newName = prompt(L__ENTER_NAME);
	if(newName != null) {
		var newQuery = prompt(L__ENTER_QUERY);
		if(newQuery != null) {
			ajaxRequestPost('ajax-handler/reports.php', urlencodeObject({'add_report':newName, 'query':newQuery, 'group_id':group_id}), null, function(text) {
				refreshContentExplorer('views/report-details.php?id='+parseInt(text));
				emitMessage(L__REPORT_CREATED, newName, MESSAGE_TYPE_SUCCESS);
			});
		}
	}
}
function renameReport(id, oldValue) {
	var newValue = prompt(L__ENTER_NAME, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/reports.php', urlencodeObject({'update_report_id':id, 'update_name':newValue}), null, function() {
			refreshContent();
			emitMessage(L__OBJECT_RENAMED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editReportNote(id, oldValue) {
	var newValue = prompt(L__ENTER_NEW_VALUE, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/reports.php', urlencodeObject({'update_report_id':id, 'update_note':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function editReportQuery(id, oldValue) {
	var newValue = prompt(L__ENTER_QUERY, oldValue);
	if(newValue != null) {
		ajaxRequestPost('ajax-handler/reports.php', urlencodeObject({'update_report_id':id, 'update_query':newValue}), null, function() {
			refreshContent();
			emitMessage(L__SAVED, newValue, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function removeSelectedReport(checkboxName, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	confirmRemoveReport(ids);
}
function confirmRemoveReport(ids, infoText='') {
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE)) {
		ajaxRequestPost('ajax-handler/reports.php', paramString, null, function() {
			refreshContent();
			emitMessage(L__OBJECT_DELETED, infoText, MESSAGE_TYPE_SUCCESS);
		});
	}
}
function moveSelectedReportToGroup(checkboxName, groupId, attributeName=null) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			if(attributeName == null) {
				ids.push(entry.value);
			} else {
				ids.push(entry.getAttribute(attributeName));
			}
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var params = [];
	params.push({'key':'move_to_group_id', 'value':groupId});
	ids.forEach(function(entry) {
		params.push({'key':'move_to_group_report_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/reports.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}

// ======== SYSTEMUSER OPERATIONS ========
function confirmRemoveSelectedSystemuser(checkboxName) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'remove_systemuser_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	if(confirm(L__CONFIRM_DELETE)) {
		ajaxRequestPost('ajax-handler/settings.php', paramString, null, function() {
			refreshContent();
			emitMessage(L__OBJECT_DELETED, '', MESSAGE_TYPE_SUCCESS);
		});
	}
}
function lockSelectedSystemuser(checkboxName) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'lock_systemuser_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/settings.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function unlockSelectedSystemuser(checkboxName) {
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	var params = [];
	ids.forEach(function(entry) {
		params.push({'key':'unlock_systemuser_id[]', 'value':entry});
	});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/settings.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}
function createSystemuser(username, fullname, password) {
	var params = [];
	params.push({'key':'add_systemuser_username', 'value':username});
	params.push({'key':'add_systemuser_fullname', 'value':fullname});
	params.push({'key':'add_systemuser_password', 'value':password});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/settings.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__USER_CREATED, username, MESSAGE_TYPE_SUCCESS);
	});
}
function changeSelectedSystemuserPassword(checkboxName, password, password2) {
	if(password != password2) {
		emitMessage(L__PASSWORDS_DO_NOT_MATCH, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var ids = [];
	document.getElementsByName(checkboxName).forEach(function(entry) {
		if(entry.checked) {
			ids.push(entry.value);
		}
	});
	if(ids.length == 0) {
		emitMessage(L__NO_ELEMENTS_SELECTED, '', MESSAGE_TYPE_WARNING);
		return;
	}
	var params = [];
	params.push({'key':'change_systemuser_id', 'value':ids[0]});
	params.push({'key':'change_systemuser_password', 'value':password});
	var paramString = urlencodeArray(params);
	ajaxRequestPost('ajax-handler/settings.php', paramString, null, function() {
		refreshContent();
		emitMessage(L__SAVED, '', MESSAGE_TYPE_SUCCESS);
	});
}
