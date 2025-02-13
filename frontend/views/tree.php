<?php
$SUBVIEW = 1;
require_once('../../lib/Loader.php');
require_once('../session.php');
?>

<div id='divNodeDomainUsers' class='node'>
	<a <?php echo explorerLink('views/domain-users.php'); ?>><img src='img/users.dyn.svg'><?php echo LANG['users']; ?></a>
</div>

<div class='node expandable'>
	<a <?php echo explorerLink('views/computers.php'); ?>><img src='img/computer.dyn.svg'><?php echo LANG['computer']; ?></a>
	<div id='divNodeComputers' class='subitems'>
		<?php echo getComputerGroupsHtml($cl); ?>
	</div>
</div>

<?php if($currentSystemUser->checkPermission(null, PermissionManager::SPECIAL_PERMISSION_SOFTWARE_VIEW, false)) { ?>
<div class='node expandable'>
	<a <?php echo explorerLink('views/software.php'); ?>><img src='img/software.dyn.svg'><?php echo LANG['recognised_software']; ?></a>
	<div id='divSubnodeSoftware' class='subitems'>
		<a <?php echo explorerLink('views/software.php?os=other'); ?>><img src='img/linux.dyn.svg'><?php echo LANG['linux']; ?></a>
		<a <?php echo explorerLink('views/software.php?os=macos'); ?>><img src='img/apple.dyn.svg'><?php echo LANG['macos']; ?></a>
		<a <?php echo explorerLink('views/software.php?os=windows'); ?>><img src='img/windows.dyn.svg'><?php echo LANG['windows']; ?></a>
	</div>
</div>
<?php } ?>

<div class='node expandable'>
	<a <?php echo explorerLink('views/package-families.php'); ?>><img src='img/package.dyn.svg'><?php echo LANG['packages']; ?></a>
	<div id='divNodePackages' class='subitems'>
		<?php echo getPackageGroupsHtml($cl); ?>
	</div>
</div>

<div id='divNodeJobs' class='node expandable'>
	<a <?php echo explorerLink('views/job-containers.php'); ?>><img src='img/job.dyn.svg'><?php echo LANG['jobs']; ?></a>
	<div id='divSubnodeJobs' class='subitems'>
		<?php
		foreach($cl->getJobContainers() as $container) {
			echo "<a ".explorerLink('views/job-containers.php?id='.$container->id)."><img src='img/".$db->getJobContainerIcon($container->id).".dyn.svg'>".htmlspecialchars($container->name)."</a>";
		}
		?>
	</div>
</div>

<div class='node expandable'>
	<a <?php echo explorerLink('views/reports.php'); ?>><img src='img/report.dyn.svg'><?php echo LANG['reports']; ?></a>
	<div id='divSubnodeReports' class='subitems'>
		<?php echo getReportGroupsHtml($cl); ?>
	</div>
</div>

<?php
// include add-ons
foreach(glob(__DIR__.'/tree.d/*.php') as $filename) {
	require_once($filename);
}
?>

<?php
function getComputerGroupsHtml(CoreLogic $cl, $parentId=null) {
	$html = '';
	$subgroups = $cl->getComputerGroups($parentId);
	if(count($subgroups) == 0) return false;
	foreach($subgroups as $group) {
		$subHtml = getComputerGroupsHtml($cl, $group->id);
		$html .= "<div class='subnode ".(empty($subHtml) ? '' : 'expandable')."'>";
		$html .= "<a ".explorerLink('views/computers.php?id='.$group->id)."><img src='img/folder.dyn.svg'>".htmlspecialchars($group->name)."</a>";
		$html .= "<div id='divNodeComputerGroup".($group->id)."' class='subitems'>";
		$html .= $subHtml;
		$html .= "</div>";
		$html .= "</div>";
	}
	return $html;
}
function getPackageGroupsHtml(CoreLogic $cl, $parentId=null) {
	$html = '';
	$subgroups = $cl->getPackageGroups($parentId);
	if(count($subgroups) == 0) return false;
	foreach($subgroups as $group) {
		$subHtml = getPackageGroupsHtml($cl, $group->id);
		$html .= "<div class='subnode ".(empty($subHtml) ? '' : 'expandable')."'>";
		$html .= "<a ".explorerLink('views/packages.php?id='.$group->id)."><img src='img/folder.dyn.svg'>".htmlspecialchars($group->name)."</a>";
		$html .= "<div id='divNodePackageGroup".($group->id)."' class='subitems'>";
		$html .= $subHtml;
		$html .= "</div>";
		$html .= "</div>";
	}
	return $html;
}
function getReportGroupsHtml(CoreLogic $cl, $parentId=null) {
	$html = '';
	$subgroups = $cl->getReportGroups($parentId);
	if(count($subgroups) == 0) return false;
	foreach($subgroups as $group) {
		$subHtml = getReportGroupsHtml($cl, $group->id);
		$html .= "<div class='subnode ".(empty($subHtml) ? '' : 'expandable')."'>";
		$html .= "<a ".explorerLink('views/reports.php?id='.$group->id)."><img src='img/folder.dyn.svg'>".htmlspecialchars($group->name)."</a>";
		$html .= "<div id='divNodeReportGroup".($group->id)."' class='subitems'>";
		$html .= $subHtml;
		$html .= "</div>";
		$html .= "</div>";
	}
	return $html;
}
