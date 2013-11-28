/* decidr : https://github.com/lbracken/decidr
   :license: MIT, see LICENSE for more details.
*/

var currProject = null;


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

	// Setup base UI
	$("input[type=submit], button").button();

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