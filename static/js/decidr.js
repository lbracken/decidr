/* decidr : https://github.com/lbracken/decidr
   :license: MIT, see LICENSE for more details.
*/

// Constants
var gridMarginTop = 5;
var gridMarginBottom = 25;
var gridMarginLeft = 25;
var gridMarginRight = 5;
var gridAxisTextStyle = {'text-anchor':'middle', 'font-size':12, 'font-weight':'bold'};
var gridAxisStyle = {'stroke':'#111'};
var gridMinorAxisStyle = {'stroke':'#DDD'};

var gridItemTextOffsetY = 15;
var gridItemStyle = {'cursor':'pointer'};
var gridItemTextStyle = {'text-anchor':'middle', 'font-size':12};
var gridItemDefaultColor = "#D15600";
var gridItemMoveTolerance = 2;

var gridItemHistoryPointStyle = {'fill':'#999','stroke':'#999'};
var gridItemHistoryPathStyle = {'stroke':'#999','stroke-width':3,'stroke-linecap':'round'};

var recentProjectsCookieName = "recentProjects";
var recentProjectsMax = 7;

var createEditProjectDialogHeight = 300;
var createEditProjectDialogHeightTall = 340;
var createEditProjectDialogWidth = 475;
var createEditProjectDialogWidthWide = 750;

// Application state and variables
var currProject = null;
var currSelectedItem = null;

var grid = null;
var gridItemPoints = null;

var gridItemHistoryPoints = null;
var girdItemHistoryPath = null;

var gridWidth = 0;
var gridHeight = 0;
var gridInnerWidth = 0;
var gridInnerHeight = 0;
var gridMidX = 0;
var gridMidY = 0;
var effectSpeed = "slow";


// ****************************************************************************
// *                                                                          *
// *  Project Logic                                                           *
// *                                                                          *
// ****************************************************************************

function getProject(projectId) {

	if (!projectId) {
		alert('Unable to get project -- no project id provided');
		return;
	}

	$.getJSON("get_project", {id:projectId}, loadProject)
		.fail(onGetProjectFailure);
}

function onGetProjectFailure(jqxhr, textStatus, error) {
	hideServerCommunication();

	$("#fatalErrorMessage").show();
	$("#fatalErrorMessage").text("Error getting project from server.");
}

function createProject() {
	disableCreateEditProjectForm();

	// Create a new project object
	var project = new Object();
	project.name = $("#createEditProject-name").val().trim();
	project.desc = $("#createEditProject-desc").val().trim();
	project.x_axis_label = "Effort";	// Set to default...
	project.y_axis_label = "Value";		// Set to default...
	project.items = new Array();
	project.curr_rev = 0;

	// TODO: The JSON.stringify won't be IE friendly..?..
	showServerCommunicationInProgress();
	$.post("save_project", {project : JSON.stringify(project)}, onProjectCreated)
		.fail(onCreateProjectFailure);
}

function onProjectCreated(response) {
	hideCreateEditProjectDialog();
	hideInfoDock();
	showServerCommunicationSuccess();
	loadProject(response);
}

function onCreateProjectFailure(jqxhr, textStatus, error) {
	hideCreateEditProjectDialog();
	hideServerCommunication();

	$("#fatalErrorMessage").show();
	$("#fatalErrorMessage").text("Error creating project on server.");
}

function editProject() {
	disableCreateEditProjectForm();

	// Update the current project with new values
	currProject.name = $("#createEditProject-name").val().trim();
	currProject.desc = $("#createEditProject-desc").val().trim();
	currProject.x_axis_label = $("#createEditProject-xaxis").val().trim();
	currProject.y_axis_label = $("#createEditProject-yaxis").val().trim();

	// Update the UI
	renderProjectTitleDescription();
	renderGrid();

	// Save the project
	saveProject();
	hideCreateEditProjectDialog();	
}

function saveProject() {

	if (!currProject) {
		return;
	}

	showServerCommunicationInProgress();
	$.post("save_project", {project : JSON.stringify(currProject)}, onProjectSaved)
		.fail(onSaveProjectFailure);
}

function onProjectSaved() {
	showServerCommunicationSuccess();
}

function onSaveProjectFailure(jqxhr, textStatus, error) {
	showServerCommunicationFailure();
}

function loadProject(response) {

	hideCreateEditProjectDialog();
	currProject = response.project;
	if (!currProject) {
		$("#fatalErrorMessage").show();
		$("#fatalErrorMessage").text("No project found with the id '" + response.id  + "'");
		return;
	}

	window.location.hash = "#prj=" + currProject._id;
	renderProjectTitleDescription();
	$("#prjCtrlBar").fadeIn();

	if (currProject.items.length > 0) {
		toggleInfoDock();
	}

	resizeContent();
	showGridContainer();

	effectSpeed = "fast";
	renderGrid();	
	recentProjects = updateRecentProjectsCookie();
}

function renderProjectTitleDescription() {

	if (currProject) {
		$("#prjTitle").text(currProject.name);
		$("#prjDesc").text(currProject.desc);
	}
}

function createItem() {

	// Create a new item object
	var item = new Object();
	item.name = $("#createItem-name").val().trim();
	item.desc = $("#createItem-desc").val().trim();
	item.color = gridItemDefaultColor;
	item.rev = new Array();

	var itemRev = new Object();
	itemRev.rev = currProject.curr_rev + 1;
	itemRev.x = 50;
	itemRev.y = 50;
	item.rev.push(itemRev);

	// If this is the first item being added, then toggle in the infodock.
	if (currProject.items.length == 0) {
		toggleInfoDock();
	}	

	// Add this item to the current project
	currProject.curr_rev = itemRev.rev;
	currProject.items.push(item);

	// Update the UI
	hideCreateItemDialog();
	renderGrid();
	selectItem(item);

	// Update the project on the server
	saveProject();
}

function deleteCurrentItem() {

	if (null == currProject || null == currSelectedItem) {
		return;
	}

	// Remove the currently selected item from the project
	var idx = currProject.items.indexOf(currSelectedItem);	
	currProject.items.splice(idx, 1);

	// If there are no longer items, then hide the infodock
	if (currProject.items.length < 1) {
		hideInfoDock();
		resizeContent();
	}

	// Update the UI
	renderGrid();

	// Select another item, if there are items remaining
	if (currProject.items.length > 0) {
		selectItem(currProject.items[0]);
	}

	// Update the project on the server
	saveProject();
}

// ****************************************************************************
// *                                                                          *
// *  UI                                                                      *
// *                                                                          *
// ****************************************************************************

function showServerCommunicationInProgress() {
	$("#fatalErrorMessage").hide();
	$("#updateSuccess").hide();
	$("#updateFailure").hide();
	$("#updateInProgress").fadeIn();
}

function showServerCommunicationSuccess() {
	$("#updateInProgress").hide();
	$("#updateFailure").hide();	
	$("#updateSuccess").fadeIn();	
}

function showServerCommunicationFailure() {
	$("#updateSuccess").hide();
	$("#updateInProgress").hide();
	$("#updateFailure").fadeIn();
}

function hideServerCommunication() {
	$("#updateSuccess").hide();
	$("#updateInProgress").hide();
	$("#updateFailure").hide();
}

function showGridContainer() {
	$("#gridContainer").hide();
	$("#gridContainer").toggle("drop", {direction:"left"}, effectSpeed, resizeContent);
}

function resizeContent() {
	var contentWidth = $("#content").width();
	var currInfoDockWidth = isInfoDockVisible() ? $("#infoDock").width() : 0;
	var gridContainerRightPadding = isInfoDockVisible() ? 20 : 0;
	var gridContainerWidth = contentWidth - currInfoDockWidth - gridContainerRightPadding;
	$("#gridContainer").width(gridContainerWidth);
	if(grid != null) {
		renderGrid();
	}
}

function isInfoDockVisible() {
	return $("#infoDock").is(":visible");
}

function toggleInfoDock() {
	$("#infoDockToggleBtn").hide();
	$("#infoDockToggleBtn").text(isInfoDockVisible() ? "<< Show Details" : "Hide Details >>");
	$("#infoDockToggleBtn").fadeIn();
	$("#infoDock").toggle("drop", {direction:"right"}, effectSpeed, resizeContent);
}

function hideInfoDock() {
	$("#infoDockToggleBtn").hide();
	$("#infoDock").hide();
}

function onItemColorChange() {

	if (!currSelectedItem) {
		return;
	}

	// Update current item, rerender grid, then update on server
	currSelectedItem.color = $("#itemColorSelector").val();
	renderGrid();
	saveProject();
}

// ****************************************************************************
// *                                                                          *
// *  UI - Grid                                                                      *
// *                                                                          *
// ****************************************************************************

function renderGrid() {

	// Ensure there's a project to render
	if (!currProject) {
		return;
	}

	gridWidth = $("#gridContainer").width() - 5;
	gridHeight = $("#gridContainer").height() - 5;
	gridInnerWidth = gridWidth - gridMarginRight - gridMarginLeft;
	gridInnerHeight = gridHeight - gridMarginBottom - gridMarginTop
	gridMidX = (gridInnerWidth) / 2 + gridMarginLeft;
	gridMidY = (gridInnerHeight) / 2 + gridMarginTop;

	// Hide and clear the Grid
	if (grid) {
		grid.clear();
		grid.setSize(gridWidth, gridHeight);
	} else {
		grid = Raphael("grid", gridWidth, gridHeight);
	}

	// Draw Axis labels
	var xAxisLabel = grid.text(gridMidX, gridHeight-10, currProject.x_axis_label);	
	var yAxisLabel = grid.text(10, gridMidY, currProject.y_axis_label);

	xAxisLabel.attr(gridAxisTextStyle);
	yAxisLabel.attr(gridAxisTextStyle);
	yAxisLabel.attr({'transform':'r270'});

	// Draw Axis lines
	var xAxis = grid.path("M" + gridMarginLeft + " " + gridMidY + "H" + (gridWidth - gridMarginRight)).attr(gridAxisStyle);
	var yAxis = grid.path("M" + gridMidX + " " + gridMarginTop + "V" + (gridHeight - gridMarginBottom)).attr(gridAxisStyle);

	// Draw extra axis lines
	grid.path("M" + (gridMarginLeft + gridInnerWidth * .25) + " " + gridMarginTop + "V" + (gridHeight - gridMarginBottom)).attr(gridMinorAxisStyle);
	grid.path("M" + (gridMarginLeft + gridInnerWidth * .75) + " " + gridMarginTop + "V" + (gridHeight - gridMarginBottom)).attr(gridMinorAxisStyle);
	grid.path("M" + gridMarginLeft + " " + (gridMarginTop + gridInnerHeight * .25) + "H" + (gridWidth - gridMarginRight)).attr(gridMinorAxisStyle);
	grid.path("M" + gridMarginLeft + " " + (gridMarginTop + gridInnerHeight * .75) + "H" + (gridWidth - gridMarginRight)).attr(gridMinorAxisStyle);

	// Draw the borders
	var outerBorder = grid.path("M" + gridMarginLeft + " " + gridMarginTop +
		"V" + (gridHeight - gridMarginBottom) + 
		"H" + (gridWidth - gridMarginRight) +
		"V" + (gridMarginTop) + "Z").attr(gridAxisStyle);

	// Render each item
	var firstItem = null;
	gridItemPoints = new Array();
	if (currProject.items) {
		$.each(currProject.items, function(idx, item) {
			gridItemPoints[idx] = renderGridItem(item);

			// Select the first item
			if (idx == 0) {
				firstItem = item;
			}
		});
	}
	
	var itemToSelect = (null == currSelectedItem) ? firstItem : currSelectedItem;
	selectItem(itemToSelect);	
}

function renderGridItem(item) {

	if (!item || !item.rev) {
		return;
	}

	var currRev = item.rev[item.rev.length-1];
	var itemX = calculateItemPointX(currRev.x);
	var itemY = calculateItemPointY(currRev.y);

	var itemPoint = grid.circle(itemX, itemY, 5);	
	itemPoint.attr(gridItemStyle);
	itemPoint.attr({'fill':item.color});

	itemPoint.textLabel = grid.text(itemX, itemY - gridItemTextOffsetY, item.name);
	itemPoint.textLabel.attr(gridItemTextStyle);

	itemPoint.drag(gridItemMove, gridItemMoveStart, gridItemMoveEnd);
	itemPoint.click(gridItemClick);
	itemPoint.dblclick(gridItemDblClick);

	itemPoint.item = item;
	return itemPoint;
}

function selectItem(item) {

	if (!item) {
		return;
	}

	currSelectedItem = item;

	// Remove highlight from all other itemPoints, and then add a highlight
	// to the selected item.
	$.each(gridItemPoints, function(idx, itemPoint) {
		if (itemPoint.glowing) {
			itemPoint.glowing.remove();
		}
		if (item === itemPoint.item) {
			itemPoint.glowing = itemPoint.glow({color:'#FBEC5D',width:60});
		}
	});

	hideGridItemHistory();

	$("#itemTitle").text(item.name);
	$("#itemDesc").val(item.desc);
	$("#itemColorSelector").val(item.color);

	if(item.rev) {
		$("#itemRevs").text(item.rev.length-1);
		var latestRev = item.rev[item.rev.length-1];
		$("#itemXPos").text(latestRev.x);
		$("#itemYPos").text(latestRev.y);
	}	
}

function gridItemMove(dx, dy) {

	// TODO: Collision detection...

	// Calculate new X,Y
	var X = this.attr("cx") + dx - (this.dx || 0),
	    Y = this.attr("cy") + dy - (this.dy || 0);

	// Ensure new values are within bounds
	if(X < gridMarginLeft) {X = gridMarginLeft;}
	if(X > gridMarginLeft + gridInnerWidth) {X = gridMarginLeft + gridInnerWidth;}
	if(Y < gridMarginTop) {Y = gridMarginTop;}
	if(Y > gridMarginTop + gridInnerHeight) {Y = gridMarginTop + gridInnerHeight;}
	gridItemReposition(this, X, Y);

	this.dx = dx;
	this.dy = dy;
}

function gridItemReposition(itemPoint, X, Y) {

	// Reposition the item point and label
	itemPoint.attr({cx: X, cy: Y});
	itemPoint.textLabel.attr({x: X, y: (Y-gridItemTextOffsetY)});
}

function gridItemMoveStart() {
	selectItem(this.item);

	if (this.glowing) {
		this.glowing.remove();
	}
}

function gridItemMoveEnd(dx, dy) {
	this.dx = this.dy = 0;
	var currItem = this.item;

	// Fade out and in to show move has 'snapped' in place
	this.attr({'opacity':0}).animate({'opacity':1}, 500);

	var newX = calculateXFromItemPoint(this);
	var newY = calculateYFromItemPoint(this);

	// Don't update an item if the move was very small
	var oldX = currItem.rev[currItem.rev.length-1].x;
	var oldY = currItem.rev[currItem.rev.length-1].y;
	if (Math.abs(newX - oldX) < gridItemMoveTolerance && Math.abs(newY - oldY) < gridItemMoveTolerance) {
		gridItemReposition(this, calculateItemPointX(oldX), calculateItemPointY(oldY));
		return;
	}

	var itemRev = new Object();
	itemRev.rev = currProject.curr_rev+1;
	itemRev.x = newX;
	itemRev.y = newY;	
	
	$.each(currProject.items, function(idx, currPrjItem) {
		if (currPrjItem === currItem) {
			currPrjItem.rev.push(itemRev);
			currProject.curr_rev = itemRev.rev;
			return false;	// Break loop
		}
	});

	// Update on server...
	saveProject();
}

function gridItemClick() {	
	selectItem(this.item, this);
}

function gridItemDblClick() {
	if (girdItemHistoryPath) {
		hideGridItemHistory();
	} else {
		showGridItemHistory(this.item);
	}
}

function showGridItemHistory(item) {

	if (!item || item.rev.length <= 1) {
		return;
	}

	var gridItemPoint = getGridItemPointByItem(item);
	if (!gridItemPoint) {
		return;
	}

	var girdItemHistoryPathStr = "";
	gridItemHistoryPoints = new Array();
	$.each(item.rev, function(idx, rev) {
		var itemX = calculateItemPointX(rev.x);
		var itemY = calculateItemPointY(rev.y);

		if (idx != item.rev.length-1) {
			var historyPoint = grid.circle(itemX, itemY, 5);	
			historyPoint.attr(gridItemHistoryPointStyle);
			gridItemHistoryPoints[idx] = historyPoint;
		}

		girdItemHistoryPathStr += (idx==0) ? "M" : "L";
		girdItemHistoryPathStr += itemX + " " + itemY;
	});

	girdItemHistoryPath = grid.path(girdItemHistoryPathStr);
	girdItemHistoryPath.attr(gridItemHistoryPathStyle);
}

function hideGridItemHistory() {

	// Remove each history point from the graph
	if (gridItemHistoryPoints) {
		$.each(gridItemHistoryPoints, function(idx, gridItemHistoryPoint) {
			gridItemHistoryPoint.remove();
		});
		gridItemHistoryPoints = null;
	}

	// Remove the history path from the graph
	if (girdItemHistoryPath) {
		girdItemHistoryPath.remove();
		girdItemHistoryPath = null;
	}
}

function getGridItemPointByItem(item) {

	if (!item) {
		return null;
	}

	var gridItemPoint = null;
	$.each(gridItemPoints, function(idx, ip) {
		if (item === ip.item) {
			gridItemPoint = gridItemPoints[idx];
			return false;	// Break loop
		}
	});

	return gridItemPoint;
}

// Get the SVG grid coordinates from the Item's 'X' value
function calculateItemPointX(itemX) {
	return gridInnerWidth * (itemX / 100.0) + gridMarginLeft
}

// Get the SVG grid coordinates from the Item's 'Y' value
function calculateItemPointY(itemY) {
	return gridInnerHeight * Math.abs((100 - itemY) / 100.0) + gridMarginTop;
}

// Get the Item's 'X' value from the SVG grid coordinates
function calculateXFromItemPoint(itemPoint) {
	return Math.round((itemPoint.attr("cx") - gridMarginLeft) / gridInnerWidth * 100);
}

// Get the Item's 'Y' value from the SVG grid coordinates
function calculateYFromItemPoint(itemPoint) {	
	return Math.abs(Math.round((itemPoint.attr("cy") - gridMarginTop) / gridInnerHeight * 100) - 100);
}

// ****************************************************************************
// *                                                                          *
// *  Dialogs                                                                 *
// *                                                                          *
// ****************************************************************************

function setupCreateEditProjectDialog() {

	$("#createEditProject-dialog").dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		show: {effect:"fadeIn", duration:500},
		open: function() {
			$(this).dialog("widget").find(".ui-dialog-titlebar").hide();
		}
	});

	$("#createEditProject-cancel").click(hideCreateEditProjectDialog);
	$("#createProject-show").click(showCreateProjectDialog);
	$("#editProject-show").click(showEditProjectDialog);
}

function showCreateProjectDialog() {

	resetCreateEditProjectDialog("Create New Project",
		"Create Project", createProject);

	var recentProjects = getRecentProjectsFromCookie();
	if (recentProjects && recentProjects.length > 0) {
		
		$("#recentProjects").show();

		var listItemsStr = "";
		$.each(recentProjects, function(i, prj) {
			listItemsStr += "<li><a href='#prj=" + prj._id + "'>" + prj.name + "</a></li>";
		});
		$("#recentProjects-List").html(listItemsStr);
		$("#createEditProject-dialog").dialog("option", "width", createEditProjectDialogWidthWide);
	}

	// Only allow the dialog to be closed if there's a project loaded
	if (currProject) {
		$("#createEditProject-cancel").show();
	} else { 
		$("#createEditProject-cancel").hide();
	}
}

function showEditProjectDialog() {

	if (!currProject) {
		return;
	}

	resetCreateEditProjectDialog("Edit Project", "Save", editProject);
	$("#createEditProject-dialog").dialog("option", "height", createEditProjectDialogHeightTall);
	$(".createEditProject-extra").show();

	// Populate the dialog with the current project's values
	$("#createEditProject-name").val(currProject.name);
	$("#createEditProject-desc").val(currProject.desc);
	$("#createEditProject-xaxis").val(currProject.x_axis_label);
	$("#createEditProject-yaxis").val(currProject.y_axis_label);

}

function resetCreateEditProjectDialog(title, submitText, submitHandler) {

	// Smoothly scroll to the top of the page
	$("html, body").animate({scrollTop: 0});
	$("#recentProjects").hide();

	$("#createEditProject-dialog").dialog("option", "width", createEditProjectDialogWidth);
	$("#createEditProject-dialog").dialog("option", "height", createEditProjectDialogHeight);

	// Reset the dialog's form fields
	$("#createEditProject-title").text(title);
	$("#createEditProject-name").val("");
	$("#createEditProject-desc").val("");
	$("#createEditProject-name").prop("disabled", false);
	$("#createEditProject-desc").prop("disabled", false);

	$(".createEditProject-extra").hide();
	$("#createEditProject-xaxis").val("");
	$("#createEditProject-yaxis").val("");
	$("#createEditProject-xaxis").prop("disabled", false);
	$("#createEditProject-yaxis").prop("disabled", false);	

	$("#createEditProject-dialog").dialog("open");	
	$("#createEditProject-dialog .loading").hide();

	$("#createEditProject-submit").off("click");
	$("#createEditProject-submit").click(submitHandler);
	$("#createEditProject-submit").button( "option", "label", submitText);
	$("#createEditProject-submit").show();
	$("#createEditProject-cancel").show();

	$("#createEditProject-name").focus();
}

function hideCreateEditProjectDialog() {
	$("#createEditProject-dialog").dialog("close");
}

function disableCreateEditProjectForm() {
	$("#createEditProject-name").prop('disabled', true);
	$("#createEditProject-desc").prop('disabled', true);
	$("#createEditProject-xaxis").prop('disabled', true);
	$("#createEditProject-yaxis").prop('disabled', true);		
	$("#createEditProject-submit").hide();
	$("#createEditProject-cancel").hide();
	$("#createEditProject-dialog .loading").show();
}

function setupCreateItemDialog() {

	$("#createItem-dialog").dialog({
		autoOpen: false,
		height: 275,
		width: 450,
		modal: true,
		resizable: false,
		show: {effect:"fadeIn", duration:500},
		open: function() {
			$(this).dialog("widget").find(".ui-dialog-titlebar").hide();
		}
	});

	$("#createItem-submit").click(createItem);
	$("#createItem-cancel").click(hideCreateItemDialog);
	$("#createItem-show").click(showCreateItemDialog);
}

function showCreateItemDialog() {

	// Smoothly scroll to the top of the page
	$("html, body").animate({scrollTop: 0});

	$("#createItem-name").val("");
	$("#createItem-desc").val("");
	$("#createItem-name").prop('disabled', false);
	$("#createItem-desc").prop('disabled', false);
	$("#createItem-dialog").dialog("open");

	$("#createItem-dialog .loading").hide();
	$("#createItem-submit").show();
	$("#createItem-cancel").show();
	$("#createItem-name").focus();	
}

function hideCreateItemDialog() {
	$("#createItem-dialog").dialog("close");
}

// ****************************************************************************
// *                                                                          *
// *  Cookie Handling                                                         *
// *                                                                          *
// ****************************************************************************


// Ensures that the current project has been added to the recent projects cookie
function updateRecentProjectsCookie() {

	if (!currProject) {
		return;
	}

	// Get the list of recent projects from the recent projects cookie.
	// If the current project is in the list of recent cookies then
	// remove it (so we can add to top of list later)...
	var recentProjects = getRecentProjectsFromCookie();
	if (recentProjects) {
		for (var i = 0; i < recentProjects.length; i++) {
			if (recentProjects[i]._id === currProject._id) {
				recentProjects.splice(i, 1);
				break;
			}
		}
	} else {
		recentProjects = new Array();
	}

	// We can't really exceed 4KB per cookie, so limit the cookie
	// to only keep the last few projects
	if (recentProjects.length > recentProjectsMax - 1) {
		var toRemove = recentProjects.length - recentProjectsMax + 1;
		recentProjects.splice(recentProjectsMax - 1, toRemove);
	}

	// Add the current project to the top of the list
	var recentProject = {};
	recentProject._id = currProject._id;
	recentProject.name = currProject.name;
	recentProjects.unshift(recentProject);
	$.cookie(recentProjectsCookieName, JSON.stringify(recentProjects));

	return recentProjects;
}

// Gets a list of recent projects from the recent projects cookie
function getRecentProjectsFromCookie() {

	try {
		recentProjects = JSON.parse($.cookie(recentProjectsCookieName));
		return recentProjects;
	} catch (err) {
		// If the cookie couldn't be parsed, then set its value to empty string
		$.cookie(recentProjectsCookieName, "");
		return null;
	}
}



// ****************************************************************************
// *                                                                          *
// *  Misc                                                                    *
// *                                                                          *
// ****************************************************************************

// http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
function getParameterByName(name) {
    var query = window.location.hash.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == name) {
            return decodeURIComponent(pair[1]);
        }
    }
    return "";
}

function onHashChange(showCreateProject) {

	// See if a project id is provided in the URL. If so then open that
	// project, otherwise show the createProject dialog.
	var projectId = getParameterByName("prj");
	if (projectId) {
		getProject(projectId);
	} else if (showCreateProject) {
		showCreateProjectDialog();
	}	
}

$(document).ready(function() {

	// Basic UI setup
	$(window).resize(resizeContent);
	$(window).on("hashchange", onHashChange);
	$("input[type=submit], button").button();	

	// Setup infodock controls
	$("#infoDockToggleBtn").click(toggleInfoDock);
	$("#itemColorSelector").change(onItemColorChange);
	$("#deleteItemBtn").click(deleteCurrentItem);

	// Setup dialogs
	setupCreateEditProjectDialog();
	setupCreateItemDialog();

	// Load any provided project, or show createProject
	onHashChange(true);
});