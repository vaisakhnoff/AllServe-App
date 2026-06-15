#!/bin/bash
cd src

# Create contexts directory
mkdir -p contexts
echo "# React Contexts\n\nPlace any global React Context providers (like ThemeContext, AuthContext if not using Redux) here." > contexts/README.md

# Rename constants to shared
if [ -d "constants" ]; then
  mv constants shared
  
  # Create barrel export
  echo "export * from './messages';" > shared/index.ts
  echo "export * from './routes';" >> shared/index.ts
  echo "export * from './storage';" >> shared/index.ts
fi

echo "Phase 5 file moves complete."
