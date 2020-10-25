<?php
$SUBVIEW = 1;
require_once('../../lib/loader.php');
require_once('../session.php');

if(!empty($_POST['remove_id']) && is_array($_POST['remove_id'])) {
	foreach($_POST['remove_id'] as $id) {
		$db->removeDomainuser($id);
	}
	die();
}

$domainuser = $db->getAllDomainuser();
?>

<h1><?php echo LANG['all_domain_user']; ?></h1>


<table id='tblDomainuserData' class='list searchable sortable savesort'>
<thead>
	<tr>
		<th></th>
		<th class='searchable sortable'><?php echo LANG['login_name']; ?></th>
		<th class='searchable sortable'><?php echo LANG['last_login']; ?></th>
	</tr>
</thead>

<?php
$counter = 0;
foreach($domainuser as $u) {
	$counter ++;
	echo "<tr>";
	echo "<td><input type='checkbox' name='domainuser_id[]' value='".$u->id."'></td>";
	echo "<td><a href='#' onclick='refreshContentDomainuserDetail(\"".$u->id."\")'>".htmlspecialchars($u->username)."</a></td>";
	echo "<td>".htmlspecialchars($u->timestamp)."</td>";
	echo "</tr>";
}
?>

<tfoot>
	<tr>
		<td colspan='999'><span class='counter'><?php echo $counter; ?></span> <?php echo LANG['elements']; ?></td>
	</tr>
</tfoot>
</table>


<p><?php echo LANG['selected_elements']; ?>:&nbsp;
	<button onclick='confirmRemoveSelectedDomainuser("domainuser_id[]")'><img src='img/delete.svg'>&nbsp;<?php echo LANG['delete']; ?></button>
</p>
