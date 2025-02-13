<?php
$SUBVIEW = 1;
require_once('../../lib/Loader.php');
require_once('../session.php');

try {

	if(isset($_POST['create_system_user'])
	&& isset($_POST['fullname'])
	&& isset($_POST['description'])
	&& isset($_POST['password'])
	&& isset($_POST['role_id'])) {
		die(strval(intval(
			$cl->createSystemUser(
				$_POST['create_system_user'], $_POST['fullname'], $_POST['description'], $_POST['password'], $_POST['role_id']
			)
		)));
	}

	if(!empty($_POST['update_own_system_user_password'])
	&& isset($_POST['old_password'])) {
		$cl->updateOwnSystemUserPassword(
			$_POST['old_password'], $_POST['update_own_system_user_password']
		);
		die();
	}

	if(!empty($_POST['update_system_user_id'])
	&& isset($_POST['username'])
	&& isset($_POST['fullname'])
	&& isset($_POST['description'])
	&& isset($_POST['password'])
	&& isset($_POST['role_id'])) {
		$cl->updateSystemUser(
			$_POST['update_system_user_id'], $_POST['username'], $_POST['fullname'], $_POST['description'], $_POST['password'], $_POST['role_id']
		);
		die();
	}

	if(!empty($_POST['remove_system_user_id'])
	&& is_array($_POST['remove_system_user_id'])) {
		foreach($_POST['remove_system_user_id'] as $id) {
			$cl->removeSystemUser($id);
		}
		die();
	}

	if(!empty($_POST['lock_system_user_id'])
	&& is_array($_POST['lock_system_user_id'])) {
		foreach($_POST['lock_system_user_id'] as $id) {
			$cl->updateSystemUserLocked($id, 1);
		}
		die();
	}

	if(!empty($_POST['unlock_system_user_id'])
	&& is_array($_POST['unlock_system_user_id'])) {
		foreach($_POST['unlock_system_user_id'] as $id) {
			$cl->updateSystemUserLocked($id, 0);
		}
		die();
	}

} catch(PermissionException $e) {
	header('HTTP/1.1 403 Forbidden');
	die(LANG['permission_denied']);
} catch(Exception $e) {
	header('HTTP/1.1 400 Invalid Request');
	die($e->getMessage());
}

header('HTTP/1.1 400 Invalid Request');
die(LANG['unknown_method']);
