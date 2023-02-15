# Snap Camera Server
Host your own Snap Camera server after the shutdown on January 25, 2023 and continue using Snap Camera by Snap Inc. as usual without restrictions and even better features than before.

The code is a fork of *jaku/SnapCameraPreservation* and has been changed for running your own local server with Docker.
By default `snapchatreverse.jaku.tv` is configured as relay server to download Snap Lenses.

All files will be stored on your local machine inside a Docker Volume and you may disable or change the relay server at any time.

## New Features & Improvements
- **[New]** **Import missing lenses from your own application cache!**
- **[New]** Run your own server locally with Docker
- **[New]** No Amazon S3 Storage solution required
- **[New]** No patching or swapping .exe files, keep the original binaries
- **[New]** Works with Snap Camera [1.21, 1.20, ...] and older versions
- **[New]** Use your own custom thumbnails/images for your Snap Lenses
- **[New]** Access, browse and backup all server files locally
- **[New]** Improved search functionality to find Snap Lenses easier
  - Search by lens ID e.g. => *47655570879*
  - Search by hash/UUID e.g. => *93776b3a994440c4b069b5c61ae352eb*
  - Search by link share URL e.g. => *https​:​//www​.​snapchat​.​com/unlock/?type=SNAPCODE&uuid=b534a2ce946c4c87ac089e7abed05bc9&metadata=01*
  - Search by creator name (automatically without special syntax) e.g. => *Snap Inc*
  - Search by custom hashtags e.g. => #funny, #makeup

*See the **Changelog** below for a full list of changes*

### Snap Camera Cache Import
You can import your local cached lenses through this online interface [Snap Lens Cache Import](https://ptrumpis.github.io/snap-lens-cache-import/)

## Requirements
- Docker
- OpenSSL (for .key and .crt file generation)

You can download [Docker Desktop](https://www.docker.com/products/docker-desktop/) from the offical website.

## Usage
You need to complete the following 5 steps:
1. Configuration
2. Generating SSL Certificate
3. Importing Root Certificate
4. Starting Docker
5. Edit the /etc/hosts file

### 1. Configuration
Make sure there is a file named `.env` in the directory. Just `.env` without a filename.
If it is missing create a copy of the file `example.env` and name the copy `.env`.

You can go with all default values and don't need to change anything unless your having problems with certain ports being occupied.

### 2. Generating SSL Certificate
Snap Camera will refuse to connect to your local server if you don't have a trusted SSL certificate.
You need to generate a .crt and .key file and have the .crt file installed as trusted root certificate on your operating system.

The required files can be generated with the included script `./gencert.sh` which will output:
- ./ssl/studio-app.snapchat.com.crt
- ./ssl/studio-app.snapchat.com.key

Docker compose expects these two files by default, otherwise the containers will not start.

### 3. Importing Root Certificate
On Windows you can import the certificate in two differnt ways
- By double-clicking the file and going through the pop up dialog (not recommended)
- By simply executing a command called *certutil* (what I recommend)

```bash
certutil -addstore -enterprise Root ./ssl/studio-app.snapchat.com.crt
```

### 4. Starting Docker
You may start the docker containers now with
```bash
docker compose up
```

Or run the docker containers in the background with
```bash
docker compose up -d
```

### 5. Edit the /etc/hosts file
#### Connecting your Snap Camera application to your local server
Patching the exe file may work, but I find it much easier to edit a line in a text file. This step is also easier to undo.

1. I suggest to edit your `/etc/hosts` file. For Windows users that file is located at `%SYSTEMROOT%\System32\drivers\etc\hosts`

2. Open the file as Administrator and add a single line to connect your Snap Camera application to the local server
   ```hosts
   127.0.0.1       studio-app.snapchat.com
   ```
   
3. You can disable the connection anytime by placing a hash before the line
   ```hosts
   #127.0.0.1       studio-app.snapchat.com
   ```

## Changelog
### v2.0.0 - Lens Cache Import Release
- New import API to add missing lenses from your own application cache
- New editable media file templates for lens customization
- Adminer docker image is now included to edit lens information easily
- Changed database schema to include tags for lenses
- New nginx server theme to browse stored files easily
- Featured, top and category lenses will be auto downloaded right after server start
- Reworked code and performance optimizations
- Some Bug fixes

### v1.21.0 - Initial Public Release
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

## Additional Information
I was able to reverse engineer the Snap Lens file format. The file format is now documented and open source.

I also provided an example Snap Lens File to Zip converter purely written in JavaScript. It will work on modern Browsers without installation or NodeJS.

- https://github.com/ptrumpis/snap-lens-file-format
- https://github.com/ptrumpis/snap-lens-file-extractor

**This conversion process is important because the Lens files are actually stored and served as zip archives on the server.**

This might help other developers to create 3rd party tools in the future.
Or help Lens creators to extract the assets of existing Lenses to use them as template for their own.
