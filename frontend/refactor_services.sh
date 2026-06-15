#!/bin/bash
cd src/services

# Create directories
mkdir -p auth booking provider user service admin messaging serviceRequest category

# Move files
mv auth.service.ts providerAuth.service.ts auth/ 2>/dev/null
mv booking.service.ts booking/ 2>/dev/null
mv provider.service.ts providerQuote.service.ts slot.service.ts provider/ 2>/dev/null
mv user.service.ts user/ 2>/dev/null
mv service.service.ts service/ 2>/dev/null
mv admin.service.ts admin/ 2>/dev/null
mv messaging.service.ts messaging/ 2>/dev/null
mv serviceRequest.service.ts serviceRequest/ 2>/dev/null
mv category.service.ts category/ 2>/dev/null

# Create barrel exports
echo "export * from './auth.service';" > auth/index.ts
echo "export * from './providerAuth.service';" >> auth/index.ts

echo "export * from './booking.service';" > booking/index.ts

echo "export * from './provider.service';" > provider/index.ts
echo "export * from './providerQuote.service';" >> provider/index.ts
echo "export * from './slot.service';" >> provider/index.ts

echo "export * from './user.service';" > user/index.ts

echo "export * from './service.service';" > service/index.ts

echo "export * from './admin.service';" > admin/index.ts

echo "export * from './messaging.service';" > messaging/index.ts

echo "export * from './serviceRequest.service';" > serviceRequest/index.ts

echo "export * from './category.service';" > category/index.ts

echo "Done restructuring services folder."
