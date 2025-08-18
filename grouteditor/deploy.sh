#!/usr/bin/env bash

rm ../grout/static/dist -rf
cp -r dist ../grout/static/
cp ../grout/templates/grouteditor_template.html ../grout/templates/grouteditor.html
D=$(egrep -r 'script src' ../grout/static/dist/grouteditor/browser/index.html | sed "s/<\/body>//")
echo $D;
D=$(echo $D | sed "s/src=\"/src=\"{% static \"dist\/grouteditor\/browser\//g" | sed "s/\" type=/\" %}\" type=/g" | sed "s/\"/\\\"/g")
echo $D;

D=$(echo $D | sed "s/\//\\\\\//g")
sed -i -e "s/^<script src.*$/${D}/" ../grout/templates/grouteditor.html
echo "Remember to execute collectstatic."