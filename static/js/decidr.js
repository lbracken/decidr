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

// Application state
var currProject = null;

var grid = null;
var gridWidth = 0;
var gridHeight = 0;
var gridInnerWidth = 0;
var gridInnerHeight = 0;
var gridMidX = 0;
var gridMidY = 0;

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
	project.desc = $("#createProject-desc").val().trim();;
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

	// Setup dialogs
	setupCreateProjectDialog();

	// See if a project id is provided in the URL. If so then open that
	// project, otherwise show the createProject dialog.
	var projectId = getParameterByName("prj");
	if (projectId) {
		getProject(projectId);
	} else {
		showCreateProjectDialog();
	}
});