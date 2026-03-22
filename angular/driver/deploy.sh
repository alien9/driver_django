#!/usr/bin/env bash

rm ../../driver/static/driver -rf
cp dist/driver ../../driver/static/ -r
cp dist/driver/index.html ../../templates/index.html
sed -i 's/\/app-root>/\/app-root>\n{% csrf_token %}/' ../../templates/index.html
sed -i 's/script src="/script src="\/static\/driver\//g'  ../../templates/index.html
sed -i 's/ href="styles/ href="\/static\/driver\/styles/g' ../../templates/index.html
sed -i 's/ href="assets/ href="\/static\/driver\/assets/g' ../../templates/index.html

echo "Remember to execute collectstatic."