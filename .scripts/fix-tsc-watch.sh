# This fixes tsc watch capabilities of files on the attached volumes in docker container
# https://github.com/Microsoft/TypeScript/issues/13242

sed -i -e 's/fingerprint.mtime.getTime() === mtimeBefore.getTime()/true/g' node_modules/typescript/lib/tsc.js
echo "Typescript incremental compilation fixed (for docker)"
