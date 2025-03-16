# 📋 Changelog - Snap Camera Server
Release version history and feature overview

## v3.3.4 - Patch Release
- Added latest v0.9.x web crawler code
- Added temporary warning message when trying to activate non-working web lenses
- Fixed broken relay search
- Fixed various lens upload and cache import bugs
- Fixed 404 requests for WEBP images
- Fixed missing config option for crawler timeout
- Fixed bug where web lenses would not be marked as such

## v3.3.0 - Maintenance Release
- New upload API to import modified lenses
- New cache import option to allow overwriting of existing lenses
- New config options to control search timeout, caching and share urls
- Fixed broken web search (no lenses showing)
- Updated npm packages

## v3.2.1 - Patch Release
- Fixed lens placeholder image bug
- New config option to enable placeholder images (default: disabled)
- Updated sharp library

## v3.2.0 - Support Release
- Upgrade to MySQL 8.0.x for out of the box macOS ARM support
- Node 14 code compatibility (Node 16 is still the default)
- Migration of .env application settings to config.yml
- Fixed small bug with .webp to .png image conversion
- Updated npm packages

## v3.1.1 - Patch Release
- Fixed an issue where UUID's and some share URL's would not return a search result

## v3.1.0 - Maintenance Release
- New configuration file `config.yml` for relay url's
- Relay Timeout handling and better search result experience
- Updated npm packages

## v3.0.1 - Patch Release
- Storage server would point to wrong IP if server was hosted on remote computer

## v3.0.0 - Lens Web Crawler Release
- New web crawler to download Lenses from `lens.snapchat.com`
- Search by creator URL's e.g. => https​:​//​lensstudio​.​snapchat​.​com​/creator/wmF-q3w45OG4x4ZRmLGLoA
- Relay server with backed up Snap Lenses is now fully optional
- Better control over disk space usage with new `.env` settings
- New automatic database migration
- Reworked code and performance optimizations
- Bug fixes

## 2.0.6 Patch Release
- Added missing nginx CORS headers for cache import
- Auto download of missing images improved
- Windows gencert.bat script is now included with PATH detection
- Added Video Tutorial Links
- Fix for example.env default values
- Small bug fixes

## v2.0.0 - Lens Cache Import Release
- New import API to add missing lenses from your own application cache
  - e.g. *%USERPROFILE%\AppData\Local\Snap\Snap Camera\cache\lenses*
- New editable media file templates for lens customization
- Adminer Docker image is now included to manage lens information easily
- Changed database schema to add custom hashtags to your lenses
- New search by custom hashtags e.g. => #funny, #makeup
- New nginx server theme to browse stored files easily
- Featured, top and category lenses will be auto downloaded right after server start
- Reworked code and performance optimizations
- Bug fixes

## v1.0.0 - Initial Public Release
- New completely revised Docker port
- New nginx file/web server storage system (removed S3 Storage solution)
- Changed database schema to include UUID of lenses
- Improved search functionality to find Snap Lenses easier
  - Search by lens ID e.g. => *47655570879*
  - Search by hash/UUID e.g. => *93776b3a994440c4b069b5c61ae352eb*
  - Search by link share URL e.g. => *https​:​//www​.​snapchat​.​com/unlock/?type=SNAPCODE&uuid=b534a2ce946c4c87ac089e7abed05bc9&metadata=01*
  - Search by creator name without special syntax e.g. => *Snap Inc*
- Auto backup of featured, top and category lenses to serve files locally
- Support for new image and snapcode URL's
- New dynamic server relay system
- Removed dead code relying on *studio-app.snapchat.com*
- The category thumbnails are now included in the project
- Included script to generate local SSL certificate
