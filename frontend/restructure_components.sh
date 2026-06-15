#!/bin/bash
cd src/components

# Create directories
mkdir -p common user messaging provider

# Move files from ui/ to their respective domain folders
mv ui/AddressList.tsx user/ 2>/dev/null
mv ui/LocationSelector.tsx user/ 2>/dev/null
mv ui/ServicePricingModal.tsx provider/ 2>/dev/null
mv ui/ChatWindow.tsx messaging/ 2>/dev/null

# Move everything else from ui/ to common/
mv ui/* common/ 2>/dev/null
rm -rf ui/

# Move files from dashboard/ to user/
mv dashboard/* user/ 2>/dev/null
rm -rf dashboard/

# Create index.ts in common/
echo "export * from './Button';" > common/index.ts
echo "export * from './Input';" >> common/index.ts
echo "export * from './Modal';" >> common/index.ts
echo "export * from './Badge';" >> common/index.ts
echo "export * from './Loader';" >> common/index.ts
echo "export * from './OtpInput';" >> common/index.ts
echo "export * from './PasswordStrength';" >> common/index.ts
echo "export * from './ImageCropper';" >> common/index.ts

echo "Done restructuring components folder."
