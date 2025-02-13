<?php
require_once('Loader.php');
$cliMode = (php_sapi_name() == 'cli');

// this script is intended to be called periodically every 10 minutes via cron

///// Job Housekeeping /////
foreach($db->getAllJobContainer() as $container) {
	// purge old jobs
	$icon = $db->getJobContainerIcon($container->id);
	if($icon == JobContainer::STATUS_SUCCEEDED) {
		if(time() - strtotime($container->last_update) > PURGE_SUCCEEDED_JOBS_AFTER) {
			if($cliMode) echo('Remove succeeded job container #'.$container->id.' ('.$container->name.')'."\n");
			$db->removeJobContainer($container->id);
		}
	}
	elseif($icon == JobContainer::STATUS_FAILED) {
		if(time() - strtotime($container->last_update) > PURGE_FAILED_JOBS_AFTER) {
			if($cliMode) echo('Remove failed job container #'.$container->id.' ('.$container->name.')'."\n");
			$db->removeJobContainer($container->id);
		}
	}

	// set job state to expired if job container end date reached
	if($container->end_time !== null && strtotime($container->end_time) < time()) {
		foreach($db->getAllJobByContainer($container->id) as $job) {
			if($job->state == Job::STATUS_WAITING_FOR_CLIENT || $job->state == Job::STATUS_DOWNLOAD_STARTED || $job->state == Job::STATUS_EXECUTION_STARTED) {
				if($cliMode) echo('Set job #'.$job->id.' (container #'.$container->id.', '.$container->name.') state to EXPIRED'."\n");
				$db->updateJobState($job->id, Job::STATUS_EXPIRED, NULL, '');
			}
		}
	}
}

///// Wake Computers For Jobs /////
foreach($db->getAllJobContainer() as $container) {
	if($container->wol_sent == 0) {
		if(strtotime($container->start_time) <= time()) {
			if($cliMode) echo('Execute WOL for job container #'.$container->id.' ('.$container->name.')'."\n");
			// check if computers are currently online (to know if we should shut them down after all jobs are done)
			if(!empty($container->shutdown_waked_after_completion)) {
				if($cliMode) echo('   Check if computers are online for possible shutdown after completion'."\n");
				$db->setComputerOnlineStateForWolShutdown($container->id);
			}
			// collect MAC addresses for WOL
			$wolMacAddresses = [];
			foreach($db->getComputerMacByContainer($container->id) as $c) {
				if($cliMode) echo('   Found MAC address '.$c->computer_network_mac."\n");
				$wolMacAddresses[] = $c->computer_network_mac;
			}
			// send WOL packet
			if($cliMode) echo('   Sending '.count($wolMacAddresses).' WOL Magic Packets'."\n");
			wol($wolMacAddresses, $cliMode);
			// update WOL sent info in db
			$db->updateJobContainer(
				$container->id,
				$container->name,
				$container->start_time,
				$container->end_time,
				$container->notes,
				1 /* WOL sent */,
				$container->shutdown_waked_after_completion,
				$container->sequence_mode,
				$container->priority,
				$container->agent_ip_ranges
			);
		}
	}

	// check WOL status (for shutting it down later)
	if(!empty($container->shutdown_waked_after_completion)) {
		foreach($db->getAllJobByContainer($container->id) as $j) {
			if(!empty($j->wol_shutdown_set)) {
				$c = $db->getComputer($j->computer_id); if(!$c) continue;
				// The computer came up in the defined time range, this means WOL worked.
				// Remove the "WOL Shutdown Set" flag to keep the shutdown forever.
				if($c->isOnline() && time() - strtotime($j->wol_shutdown_set) < WOL_SHUTDOWN_EXPIRY_SECONDS) {
					if($cliMode) echo('Host came up before WOL shutdown expiry. Keep shutdown of job #'.$j->id.' (in container #'.$container->id.' '.$container->name.') forever'."\n");
					$db->removeWolShutdownJobInContainer($container->id, $j->id, Package::POST_ACTION_SHUTDOWN);
				}
				// If the computer does not came up with WOL after a certain time, WOL didn't work -> remove the shutdown.
				// It is likely that a user has now manually powered on the machine. Then, an automatic shutdown is not desired anymore.
				if(time() - strtotime($j->wol_shutdown_set) > WOL_SHUTDOWN_EXPIRY_SECONDS) {
					if($cliMode) echo('Remove expired WOL shutdown for job #'.$j->id.' (in container #'.$container->id.' '.$container->name.')'."\n");
					$db->removeWolShutdownJobInContainer($container->id, $j->id, Package::POST_ACTION_NONE);
				}
			}
		}
	}
}

///// Logon Entries Housekeeping /////
$result = $db->removeDomainUserLogonOlderThan(PURGE_DOMAIN_USER_LOGONS_AFTER);
if($cliMode) echo('Purged '.intval($result).' domain user logons older than '.intval(PURGE_DOMAIN_USER_LOGONS_AFTER).' seconds'."\n");

///// Log Housekeeping /////
$result = $db->removeLogEntryOlderThan(PURGE_LOGS_AFTER);
if($cliMode) echo('Purged '.intval($result).' log entries older than '.intval(PURGE_LOGS_AFTER).' seconds'."\n");


if($cliMode) echo('Housekeeping Done.'."\n");
