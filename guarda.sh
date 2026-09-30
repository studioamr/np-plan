#!/bin/bash
# uso: ./guarda.sh <nombre> [ancho]  — guarda el PNG del portapapeles en img/orig/<nombre>.png y un JPG web en img/<nombre>.jpg
cd "$(dirname "$0")/img" || exit 1
osascript -e "set f to open for access POSIX file \"$PWD/orig/$1.png\" with write permission
write (the clipboard as «class PNGf») to f
close access f" && sips -s format jpeg -s formatOptions 74 -Z "${2:-2000}" "orig/$1.png" --out "$1.jpg" >/dev/null && ls -la "$1.jpg"
