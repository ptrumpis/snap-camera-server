# Changelog
Release Version History

## v2.0.0 - Lens Cache Import Release
- New import API to add missing lenses from your own application cache
- New editable media file templates for lens customization
- Adminer docker image is now included to edit lens information easily
- Changed database schema to include tags for lenses
- New nginx server theme to browse stored files easily
- Featured, top and category lenses will be auto downloaded right after server start
- Reworked code and performance optimizations
- Some Bug fixes

## v1.0.0 - Initial Public Release
- New completely revised Docker port
- New nginx file/web server storage system
- Changed database schema to include UUID of lenses
- Improved search functionality to find Snap Lenses easier
  - Search by lens ID
  - Search by hash/UUID
  - Search by link share URL
  - Search by creator name without special syntax
- Auto backup of featured, top and category lenses to serve files locally
- Support for new image and snapcode URL's
- New dynamic server relay system
- Removed dead code that would rely on the original *studio-app.snapchat.com* server
- The category thumbnails are now included in the project
- Included script to generate local SSL certificate