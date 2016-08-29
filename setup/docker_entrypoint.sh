#!/bin/bash
set -e 

# start mysql
service mysql start 

# start django
#exec "python manage.py runserver 0.0.0.0:8000"
exec "$@"
