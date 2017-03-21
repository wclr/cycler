echo "Removing all previously built files..."
#rm -rf  *.js.map *.d.ts *.js **/*.js.map **/*.d.ts **/*.js
#-print
find . -name node_modules -prune -o \
  \( -name '*.js' -o -name '*.d.ts' -o -name '*.js.map' \) \
  -exec rm {} +
  #-print 
