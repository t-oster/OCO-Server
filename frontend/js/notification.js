function askNotificationPermission() {
	if(!Notification) {
		emitMessage(L__DESKTOP_NOTIFICATIONS_NOT_SUPPORTED, '', MESSAGE_TYPE_ERROR);
		return;
	}
	if(Notification.permission !== 'granted') {
		Notification.requestPermission().then(function(result) {
			if(result === 'denied') {
				emitMessage(L__DESKTOP_NOTIFICATIONS_DENIED, '', MESSAGE_TYPE_WARNING);
			}
			if(result === 'granted') {
				// start watching for notifications
				setInterval(refreshNotificationInfo, 5000);
			}
		});
	} else {
		emitMessage(L__DESKTOP_NOTIFICATIONS_ALREADY_PERMITTED, '', MESSAGE_TYPE_INFO);
	}
}

// reset previous notification state
localStorage.setItem('presentedNotifications', null);
// permission already granted
// automatically start watching for notifications
if(Notification && Notification.permission === 'granted') {
	setInterval(refreshNotificationInfo, 5000);
}

var notificationInfo = null;
function refreshNotificationInfo() {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState != 4) return;
		if(this.status == 200) {
			checkNotification(JSON.parse(this.responseText));
		}
	};
	xhttp.open('GET', 'ajax-handler/notification-info.php', true);
	xhttp.send();
}

function checkNotification(newNotificationInfo) {
	if(notificationInfo != null) {
		newNotificationInfo['job_container'].forEach(function(item1) {
			notificationInfo['job_container'].forEach(function(item2) {
				if(item1.id == item2.id && item1.state != item2.state) {
					notify('['+item1.state_description+'] '+item1.name, L__JOB_CONTAINER_STATUS_CHANGED, 'img/job.dyn.svg',
						'index.php?view=job-containers&id='+encodeURIComponent(item1.id),
						'job#'+item1.id+'#'+item1.state
					);
				}
			});
		});
	}
	notificationInfo = newNotificationInfo;
}

function notify(title, body, icon, link, tag) {
	// check if notification was already presented
	let presentedNotifications = JSON.parse(localStorage.getItem('presentedNotifications'));
	if(presentedNotifications == null) presentedNotifications = [];
	if(presentedNotifications.indexOf(tag) != -1) return;
	presentedNotifications.push(tag);
	localStorage.setItem('presentedNotifications', JSON.stringify(presentedNotifications));
	// show notification
	if(Notification.permission !== 'granted') return;
	var notification = new Notification(title, {
		icon: icon, body: body, tag: tag
	});
	notification.onclick = function() {
		window.open(link);
	};
}
