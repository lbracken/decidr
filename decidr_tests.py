# -*- coding: utf-8 -*-
"""
    decidr_tests
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Tests the decidr Flask app

    :license: MIT, see LICENSE for more details.
"""

import json
import unittest

from flask import request

import decidr

"""
    For tests to pass, the following data must first be loaded in the
    DB (which kind of makes this more a set of functional tests rather 
    than unit tests....)

    db.projects.insert({"_id" : "test1", "name" : "Project Name", "desc" : "unit_test_prereq"})

"""

class DecidrTestCase(unittest.TestCase):

    def setUp(self):
        """Before each test, ..."""
        decidr.app.config['TESTING'] = True
        self.app = decidr.app.test_client()
        None

    def tearDown(self):
        """After each test, ..."""
        None


    """ ***********************************************************************
        *
        * /get_project unit tests
        *
        ***********************************************************************
    """
    def test_get_project_no_id_provided(self):

        # Basic request with no arguments
        rv = self.app.get('/get_project')
        response = json.loads(rv.data)

        assert True == response["error"]
        assert response["message"]


    def test_get_project_empty_id_provided(self):

        # Basic request with no arguments
        rv = self.app.get('/get_project?id=')
        response = json.loads(rv.data)

        assert True == response["error"]
        assert response["message"]


    def test_get_project_no_project_with_id(self):

        # Basic request with no arguments
        rv = self.app.get('/get_project?id=abc45')
        response = json.loads(rv.data)

        assert True == response["error"]
        assert response["message"]


    def test_get_project(self):

        # Basic request with no arguments
        rv = self.app.get('/get_project?id=test1')
        response = json.loads(rv.data)

        assert False == response["error"]
        assert "test1" == response["id"]
        assert response["project"]
        assert response["project"]["name"] == "Project Name"
        assert response["project"]["desc"] == "unit_test_prereq"


    """ ***********************************************************************
        *
        * /save_project unit tests
        *
        ***********************************************************************
    """
    def test_save_project_no_project_provided(self):

        # Basic request with no arguments
        rv = self.app.post('/save_project', data=dict())
        response = json.loads(rv.data)

        assert True == response["error"]
        assert response["message"]


    def test_save_project_empty_project_provided(self):

        # Basic request with no arguments
        rv = self.app.post('/save_project', data=dict(
            project=""))
        response = json.loads(rv.data)

        assert True == response["error"]
        assert response["message"]


    def test_save_new_project(self):

        # Basic request with no arguments
        rv = self.app.post('/save_project', data=dict(
            project='{\
                "name": "Project Name",\
                "desc" : "unit_test",\
                "x_axis_label": "Effort",\
                "y_axis_label": "Value",\
                "curr_rev": 1,\
                "items": []}'
        ), follow_redirects=True)
        response = json.loads(rv.data)

        assert False == response["error"]
        assert response["id"]
        assert response["project"]
        assert response["project"]["name"] == "Project Name"
        assert response["project"]["desc"] == "unit_test"
        assert response["project"]["x_axis_label"] == "Effort"
        assert response["project"]["y_axis_label"] == "Value"
        assert response["project"]["curr_rev"] == 1


    def test_save_existing_project(self):

        # Basic request with no arguments
        rv = self.app.post('/save_project', data=dict(
            project='{\
                "name": "Project Name A",\
                "desc" : "unit_test",\
                "x_axis_label": "a",\
                "y_axis_label": "a",\
                "curr_rev": 1,\
                "items": []}'
        ), follow_redirects=True)
        response = json.loads(rv.data)

        assert False == response["error"]
        assert response["id"]
        assert response["project"]
        assert response["project"]["name"] == "Project Name A"
        assert response["project"]["desc"] == "unit_test"
        assert response["project"]["x_axis_label"] == "a"
        assert response["project"]["y_axis_label"] == "a"
        assert response["project"]["curr_rev"] == 1

        print type(response["project"])
        
        # Update the project, then send to server to save
        updated_project = response["project"]
        updated_project["name"] = "Project Name B"
        updated_project["desc"] = "unit_test"
        updated_project["x_axis_label"] = "b"
        updated_project["y_axis_label"] = "b"
        updated_project["curr_rev"] = 2

        rv = self.app.post('/save_project', data=dict(
            project=updated_project
        ), follow_redirects=True)
        response = json.loads(rv.data)

        assert False == response["error"]
        assert response["id"]
        assert response["project"]
        assert response["project"]["name"] == "Project Name B"
        assert response["project"]["desc"] == "unit_test"
        assert response["project"]["x_axis_label"] == "b"
        assert response["project"]["y_axis_label"] == "b"
        assert response["project"]["curr_rev"] == 2
        

if __name__ == '__main__':
    unittest.main()