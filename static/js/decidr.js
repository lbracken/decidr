/* decidr : https://github.com/lbracken/decidr
   :license: MIT, see LICENSE for more details.
*/

// Constants
var gridMarginTop = 5;
var gridMarginBottom = 25;
var gridMarginLeft = 25;
var gridMarginRight = 5;
var gridAxisTextStyle = {'text-anchor':'middle', 'font-size':12, 'font-weight':'bold'};
var gridAxisStyle      = {'stroke':'#111'};
var gridMinorAxisStyle = {'stroke':'#DDD'};

var gridItemTextOffsetY = 15;
var gridItemStyle = {'cursor':'pointer'};
var gridItemTextStyle = {'text-anchor':'middle', 'font-size':12};
var gridItemDefaultColor = "#D15600";
var gridItemMoveTolerance = 2;

// Application state
var currProject = null;

var grid = null;
var gridWidth = 0;
var gridHeight = 0;
var gridInnerWidth = 0;
var gridInnerHeight = 0;
var gridMidX = 0;
var gridMidY = 0;

var gridItemPoints = null;
var currSelectedItem = null;

var effectSpeed = "slow";

// Debug variables
var resizeCount = 0;


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

	$.getJSON("get_project", {id:projectId}, loadProject);
}

function createProject() {

	// Create a new project object
	var project = new Object();
	project.name = $("#createProject-name").val().trim();
	project.desc = $("#createProject-desc").val().trim();
	project.x_axis_label = "Effort";	// Set to default...
	project.y_axis_label = "Value";		// Set to default...
	project.items = new Array();
	project.curr_rev = 0;

	// Disable the createProject form
	$("#createProject-name").prop('disabled', true);
	$("#createProject-desc").prop('disabled', true);
	$("#createProject-submit").hide();
	$("#createProject-cancel").hide();
	$("#createProject-dialog .loading").show();

	// TODO: The JSON.stringify won't be IE friendly..?..
	showServerCommunicationInProgress();
	$.post("save_project", {project : JSON.stringify(project)}, onProjectCreated);
}

function onProjectCreated(response) {
	hideCreateProjectDialog();
	showServerCommunicationSuccess();
	loadProject(response);
}

function saveProject() {

	if (!currProject) {
		return;
	}

	showServerCommunicationInProgress();
	$.post("save_project", {project : JSON.stringify(currProject)}, onProjectSaved);
}

function onProjectSaved() {
	showServerCommunicationSuccess();
}

function loadProject(response) {

	currProject = response.project;
	if (!currProject) {
		alert('Unable to load project -- no project provided');
		return;
	}

	window.location.hash = "#prj=" + currProject._id;
	$("#prjTitle").text(currProject.name);
	$("#prjDesc").text(currProject.desc);
	$("#prjCtrlBar").fadeIn();

	toggleInfoDock();
	resizeContent();
	toggleGridContainer();

	effectSpeed = "fast";
	renderGrid();
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

	// Add this item to the current project
	currProject.curr_rev = itemRev.rev;
	currProject.items.push(item);

	// Update the UI
	hideCreateItemDialog();
	renderGrid();

	// Update the project on the server
	saveProject();
}


// ****************************************************************************
// *                                                                          *
// *  UI                                                                      *
// *                                                                          *
// ****************************************************************************

function showServerCommunicationInProgress() {
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

function toggleGridContainer() {
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

	resizeCount = resizeCount + 1;
	$("#_debug_resizeCount").text(resizeCount);
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
	// TODO: Toggle showing grid item history
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

function setupCreateProjectDialog() {

	$("#createProject-dialog").dialog({
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

	$("#createProject-submit").click(createProject);
	$("#createProject-cancel").click(hideCreateProjectDialog);
	$("#createProject-show").click(showCreateProjectDialog);
}

function showCreateProjectDialog() {

	// Smoothly scroll to the top of the page
	$("html, body").animate({scrollTop: 0});

	// Reset the dialog's form fields
	$("#createProject-name").val("");
	$("#createProject-desc").val("");
	$("#createProject-name").prop("disabled", false);
	$("#createProject-desc").prop("disabled", false);
	$("#createProject-dialog").dialog("open");

	$("#createProject-dialog .loading").hide();
	$("#createProject-submit").show();
	$("#createProject-cancel").show();
	$("#createProject-name").focus();
}

function hideCreateProjectDialog() {
	$("#createProject-dialog").dialog("close");
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

$(document).ready(function() {

	// Basic UI setup
	$(window).resize(function(){resizeContent();});
	$("input[type=submit], button").button();

	$("#infoDockToggleBtn").click(toggleInfoDock);
	$("#itemColorSelector").change(onItemColorChange);

	// Setup dialogs
	setupCreateProjectDialog();
	setupCreateItemDialog();

	// See if a project id is provided in the URL. If so then open that
	// project, otherwise show the createProject dialog.
	var projectId = getParameterByName("prj");
	if (projectId) {
		getProject(projectId);
	} else {
		showCreateProjectDialog();
	}
});