# -*- coding: utf-8 -*-
"""
    decidr.service.project_service
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Module that provides project related services.

    :license: MIT, see LICENSE for more details.
"""

from datetime import datetime
import random

from db import mongo

# Allowable characters in project ids.  Avoid easy to confuse chars
# such as 1 vs l vs i, 0 vs o, 5 vs s... 
id_alphabet = "2346789abcdefghjkmnpqrtwxyz"

db_projects = None


def init_db():
    global db_projects

    # Init DB
    db_projects = mongo.get_projects_collection()


def get_project(id):
    """ Returns project with the given id, or None if no project is
        found.

    """
    db_query = {"_id" : id}
    project = db_projects.find_one(db_query)
    return project


def save_project(project):
    """ Save the given project in the database.  This can be used to
        both create a new project and update an existing one.

        TODO: Need to validate the project data passed in...
    """
    # Two different approaches here...
    #  (1) Just blindly update what was given into the DB
    #  (2) Ensure the given project exists, and copy fields...
    # For now, to start working on the WebUI, just going with (1).

    now = get_current_timestamp()

    # If the project doesn't have an id, then set one
    if not hasattr(project, "_id"):
        project["_id"] = generate_project_id()
        project["date_created"] = now

    project["date_modified"] = now

    db_projects.save(project, w=1)
    return project


def generate_project_id():
    """ Generate a new project id, and ensure it doesn't already
        exist in the DB

    """
    prj_id = None
    while not prj_id:        
        # Generate random value from restricted alphabet.
        prj_id = ''.join(random.choice(id_alphabet) for i in range(5))

        # Verify this id doesn't alredy exist...        
        db_query = {"_id" : prj_id}
        if db_projects.find_one(db_query):
            prj_id = None

    return prj_id


def get_current_timestamp():
    return int(datetime.now().strftime("%s"))


# Initialize connection to DB when loading module
init_db()    