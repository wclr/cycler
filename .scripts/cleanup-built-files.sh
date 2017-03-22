echo "Removing all previously built files..."
find . -name node_modules -prune -o \
  \( -name '*.js' -o -name '*.d.ts' -o -name '*.js.map' \) \
  -exec rm {} +
  #-print 
