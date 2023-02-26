# Snap Camera Server v3 👻💻
Host your own Snap Camera server after the shutdown on January 25, 2023.

**This code is a fork of *jaku/SnapCameraPreservation* on steroids.**
- It does not require any previously backed up files or third party server.
- Access all web lenses from the offical website `lens.snapchat.com` without restrictions.
- Import lenses from your local application cache e.g. `AppData\Local\Snap\Snap Camera\cache\lenses`.
- All files will be stored inside a Docker Volume (e.g. on your local machine).
- More features than the original Snap Camera application.
- Works 100% on Windows without limitations.

You get the full decentralized control and you can use *Snap Camera* until Doomsday.

See the [Changelog](https://github.com/ptrumpis/snap-camera-server/blob/main/CHANGELOG.md) for a full list of changes and features.

## ⚙️ Operation Modes
This server can operate in different modes:
1. Relay all requests to another Snap Camera protocol compatible server (server chaining possible).
   - **snapchatreverse.jaku.tv** is configured as relay server by default.
2. Download lenses from **lens.snapchat.com** by acting as a proxy between your Snap Camera application and the website.
   - This requires a special [Patch](https://github.com/ptrumpis/snap-camera-signature-patch) of your `Snap Camera.exe` (*see below*).

**The server can run in one of these two modes or in both at the same time (default).**

### 🌐 Web Lens Download
All Snap Lenses are still available for download at **https://lens.snapchat.com** (hidden from view).

You need to apply a special [Snap Camera Signature Patch](https://github.com/ptrumpis/snap-camera-signature-patch) to your `Snap Camera.exe` to get access to these web lenses. 

 *This patch is only available for Windows as of now (because I don't own a Mac lol).*

### 📥 Snap Camera Cache Import 
You can import your local cached lenses through this online interface [Snap Lens Cache Import](https://ptrumpis.github.io/snap-lens-cache-import/)

Watch the [Re-Import Cache Video Guide](https://www.youtube.com/watch?v=alo49et3QxY) if you need help.

---

## ⚠️ Server Requirements
This server requires Docker and OpenSSL and maybe 10 minutes of your time
- [Docker](https://www.docker.com/)
- OpenSSL ([slproweb.com](https://slproweb.com/products/Win32OpenSSL.html) for Windows)

## 🚀 Usage
Start by downloading the latest release: [Download Latest Release](https://github.com/ptrumpis/snap-camera-server/releases/latest)

After downloading and unpacking the source files you need to complete the following 5 steps:
1. Configuration
2. Generating SSL Certificate
3. Importing Root Certificate
4. Starting Docker
5. Edit the /etc/hosts file

This can be done manually or automatically (Windows).

## 🦾 Automatic Configuration on Windows
Windows users can now use this [Windows Auto Configuration Tool](https://github.com/ptrumpis/snap-camera-server-auto-config), which will handle all of these tasks for you.

If you are not a Windows user or prefer to do the steps manually then you can watch the video guide below which covers all the steps in detail.

## 🎓 How To Video Guide
You can watch this step by step video guide on YouTube if you need help with the configuration on your local Windows machine.

[![Snap Camera Installation Guide](https://img.youtube.com/vi/bcsjvWHUr7c/0.jpg)](https://www.youtube.com/watch?v=bcsjvWHUr7c)

## 💪 Manual Configuration Steps
In addition to the full video guide each step is also covered by a short video tutorial

### 1. Configuration ([Video Tutorial](https://youtu.be/wZIPBPVs-70))
You need to create a `.env` configuration file.

Create a copy of the file `example.env` and name the copy `.env` (without filename).

You can go with all default values and don't need to change anything unless your having problems with certain ports being occupied.

### 2. Generating SSL Certificate ([Video Tutorial](https://youtu.be/4QJP8MLvSdA))
Snap Camera will refuse to connect to your local server if you don't have a trusted SSL certificate.
You need to generate a .crt and .key file and have the .crt file installed as trusted root certificate on your operating system.

The required files can be generated with the included script `./gencert.bat` or `./gencert.sh` which will output:
- ./ssl/studio-app.snapchat.com.crt
- ./ssl/studio-app.snapchat.com.key

Docker compose expects these two files by default, otherwise the containers will not start.

### 3. Importing Root Certificate ([Video Tutorial](https://youtu.be/mJFmvTg1yfE))
On Windows you can import the certificate in three different ways
1. By double-clicking the file and going through the pop up dialog
2. By running the Widnows management console application `certlm.msc`
3. By simply executing a command called *certutil* (what I recommend)

```bash
certutil -addstore -enterprise Root ./ssl/studio-app.snapchat.com.crt
```

You need to run this command as Administrator on a Windows Powershell.

### 4. Starting Docker ([Video Tutorial](https://youtu.be/2siSkWdZLbo))
You may start the docker containers now with
```bash
docker compose up
```

Or run the docker containers in the background with
```bash
docker compose up -d
```

### 5. Edit the /etc/hosts file ([Video Tutorial](https://youtu.be/o9gAo5VH2cw))
#### Connecting your Snap Camera application to your local server
Patching the exe file may work, but I find it much easier to edit a line in a text file. This step is also easier to undo.

1. I suggest to edit your `/etc/hosts` file. For Windows users that file is located at 
   ```
   %SYSTEMROOT%\System32\drivers\etc\hosts
   ```

2. Open the file as Administrator and add a single line to connect your Snap Camera application to the local server
   ```hosts
   127.0.0.1       studio-app.snapchat.com
   ```
   
3. You can disable the connection anytime by placing a hash before the line
   ```hosts
   #127.0.0.1       studio-app.snapchat.com
   ```

## 📢 Additional Information
I was able to reverse engineer the Snap Lens file format. The file format is now documented and open source.

I also provided an example Snap Lens File to Zip converter purely written in JavaScript. It will work on modern Browsers without installation.

- https://github.com/ptrumpis/snap-lens-file-format
- https://github.com/ptrumpis/snap-lens-file-extractor

**This conversion process is important because the Lens files are actually stored and served as zip archives on the server.**

This might help other developers to create 3rd party tools in the future.
Or help Lens creators to extract the assets of existing Lenses to use them as template for their own.
