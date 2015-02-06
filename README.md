# decidr

decidr is a project to help organize and prioritize tasks. Tasks are added to a grid and relatively positioned based upon two dimensions of importance -- level of effort and value to project. This can provide clarity about the tasks at hand and order to knock them out.

A running instance is hosted at http://levibracken.com/decidr.
  
##Running the application

decidr uses MongoDB for persistnce. By default it tries to connect to a mongo instance at `localhost:27017`. To use a different host:port, update `settings.cfg`.

To run locally...

    $ python decidr.py

You can then access the WebUI at http://localhost:5000.

To run tests...

	$ python decidr_tests.py

For tests to pass, you must first load some test data into the DB (see `decidr_tests.py` header).

## Docker

This project can be deployed as a Docker container. The decidr image does not include MongoDB by default, it must be linked to another container with MongoDB.  When linking to another container there's no need to update `settings.cfg`.

To build a decidr image...

	$ docker build -t="decidr" .

To start a decidr container (and the official MongoDB container)...

	$ docker run -d --name mongo mongo
	$ docker run -d -P --name decidr --link mongo:db decidr