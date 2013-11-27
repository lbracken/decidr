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


def create_project(project):
    """ Creates a new project from the given data and persists it into 
        the database.

        TODO: Need to validate the project data passed in...
    """
    # Set a project id
    project["_id"] = generate_project_id()

    now = int(datetime.now().strftime("%s"))
    project["date_created"] = now
    project["date_modified"] = now

    db_projects.save(project, w=1)

    # Return the project from the get_project() function for consistency
    return get_project(project["_id"])


def get_project(id):
    """ Returns project with the given id, or None if no project is
        found.

    """
    db_query = {"_id" : id}
    project = db_projects.find_one(db_query)
    return project


def update_project(project):
    return None


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


# Initialize connection to DB when loading module
init_db()    