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

from flask import Flask
from flask import render_template

app = Flask(__name__)
verbose = False


@app.route("/")
def main_page():
    return render_template("index.html")


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