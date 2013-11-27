# -*- coding: utf-8 -*-
"""
    decidr
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Provides Flask based template rendering and web service support for
    decidr.  Its responsibilities for web service calls includes...
      * Handling incoming HTTP requests by parsing arguments
      * Call the appropriate service module
      * Create a response from the data

    :license: MIT, see LICENSE for more details.
"""

import argparse
from datetime import datetime
import json

from flask import Flask
from flask import jsonify
from flask import make_response
from flask import request
from flask import render_template

from service import project_service

app = Flask(__name__)
verbose = False


@app.route("/")
def main_page():
    return render_template("index.html")


@app.route("/create_project", methods=['POST'])
def create_project():

    # Get the client provided project
    project = get_project_from_req(request)
    response_body = {}

    if project:
        project = project_service.create_project(project)

        if project:
            populate_response_with_project(response_body, project)
            
        else:
            response_body["error"] = True
            response_body["message"] = "Error creating the project"

        if verbose:
            now = str(datetime.now())
            print ">> %s  createProject[%s]" % (now, id)          
    
    else:
        response_body["error"] = True
        response_body["message"] = "No project provided"

    # Create the response object
    response = make_response(jsonify(response_body))
    return response


@app.route("/get_project")
def get_project():

    # Get the client provided project id
    id = get_project_id_from_req(request)
    response_body = {}

    if id:
        project = project_service.get_project(id)

        if project:
            populate_response_with_project(response_body, project)

        else:
            response_body["error"] = True
            response_body["id"] = id
            response_body["message"] = "No project found for given id"

        if verbose:
            now = str(datetime.now())
            found = True if project else False
            print ">> %s  getProject[%s] -- Found: %r" % (now, id, found)          
    
    else:
        response_body["error"] = True
        response_body["message"] = "No id argument provided"

    # Create the response object
    response = make_response(jsonify(response_body))
    return response


def update_project():
    return None


def get_project_id_from_req(request):
    """ Returns the project id from the request.

    """
    id = request.args.get("id", "").strip().lower()
    return id


def get_project_from_req(request):
    """ Returns the project from the request.

    """
    try:
        project_str = request.form.get("project", None)
        project = json.loads(project_str)
        return project
    except:
        # If there's any error parsing, return None
        return None


def populate_response_with_project(response_body, project):
    response_body["error"] = False
    response_body["id"] = project["_id"]
    response_body["project"] = project


def parse_args():
    """ Parse the command line arguments

    """
    global verbose

    parser = argparse.ArgumentParser(description="decidr web service")
    parser.add_argument("-v", "--verbose", action="store_true",
            help="Make the operation talkative")
    args = parser.parse_args()   
    
    verbose = args.verbose
    return args


if __name__ == "__main__":
    args  = parse_args()

    print "-----------------------------------------< decidr web service >----"
    app.run(debug=True) # If running directly from the CLI, run in debug mode.    