decidr
======

Plot and prioritize tasks.  When you have a number of items to work on for a project, decidr allows you to plot them (typically by level of effort and value to project), which can provide clarity about which items to work on first.

A running instance is hosted at http://levibracken.com/decidr.


##Running the application

decidr is built as a Flask application. To run:

    $ python -m decidr

The WebUI (and web service) is then available at http://localhost:5000.

Persistence is handled by mongoDB.  Be sure to update settings.cfg with your mongoDB configuration.  Why use mongoDB for such a simple application?  No good reason other than mongoDB is already installed and used on the server where decidr is live hosted.

###Running unit tests

To run the unit tests:

	$ python -m decidr_tests
