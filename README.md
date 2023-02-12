# Snap Camera Server
Host your own Snap Camera Lens server after the shutdown on January 25, 2023 and continue using Snap Camera by Snap Inc. as usual without restrictions.

The code is a fork of *jaku/SnapCameraPreservation* and has been changed for running your own local server with Docker.

An S3 Storage solution is no longer required.

By default `snapchatreverse.jaku.tv` is configured as relay server to download Snap Lenses.

All files will be stored on your local machine inside a Docker Volume and you may disable or change the relay server at any time.

## New Features & Improvements
- Run your own server locally with Docker (no S3 Storage required)
- Access, Browse and Backup all server files locally
- Use *snapchatreverse.jaku.tv* or any other public server as relay for missing Snap Lenses
- No patching or swapping .exe files, keep the original
- Improved search functionality to find Snap Lenses easier
  - Search by lens ID e.g. => *47655570879*
  - Search by hash/UUID e.g. => *93776b3a994440c4b069b5c61ae352eb*
  - Search by link share URL e.g. => *https​:​//www.snapchat.com/unlock/?type=SNAPCODE&uuid=b534a2ce946c4c87ac089e7abed05bc9&metadata=01*
  - Search by creator name (automatically without special syntax) e.g. => *Snap Inc*

## Requirements
- Docker
- OpenSSL (for .key and .crt file generation)

You can download [Docker Desktop](https://www.docker.com/products/docker-desktop/) from the offical website.

## Usage
You need to complete the following 4 steps:
- Configuration
- Generating SSL Certificate
- Importing Root Certificate
- Starting Docker

### Configuration
Make sure there is a file named `.env` in the directory. Just `.env` without a filename.
If it is missing create a copy of the file `example.env` and name the copy `.env`.

You can go with all default values and don't need to change anything unless your having problems with certain ports being occupied.

### Generating SSL Certificate
Snap Camera will refuse to connect to your local server if you don't have a trusted SSL certificate.
You need to generate a .crt and .key file and have the .crt file installed as trusted root certificate on your operating system.

The required files can be generated with the included script `./gencert.sh` which will output:
- ./ssl/studio-app.snapchat.com.crt
- ./ssl/studio-app.snapchat.com.key

Docker compose expects these two files by default, otherwise the containers will not start.

### Importing Root Certificate
On Windows you can import the certificate in two differnt ways
- By double-clicking the file and going through the pop up dialog (not recommended)
- By simply executing a command called *certutil* (what I recommend)

```bash
certutil -addstore -enterprise Root ./ssl/studio-app.snapchat.com.crt
```

### Starting Docker
You may start the docker containers now with
```bash
docker compose up
```

Or run the docker containers in the background with
```bash
docker compose up -d
```

## Connecting Snap Camera application to the server

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

## Additional Information

I was able to reverse engineer the Snap Lens file format. The file format is now documented and open source.

I also provided an example Snap Lens File to Zip converter purely written in JavaScript. It will work on modern Browsers without installation or NodeJS.

- https://github.com/ptrumpis/snap-lens-file-format
- https://github.com/ptrumpis/snap-lens-file-extractor

This conversion process is important because the Lens files are actually stored and served as zip archives on the server.
