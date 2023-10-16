# 🛠️ Configuration - Snap Camera Server
In order to get the server running you need to complete the following 5 steps:

1. [Create Configuration file](#1-create-configuration-file-video-tutorial)
2. [Generate SSL certificate](#2-generate-ssl-certificate-video-tutorial)
3. [Import Root certificate](#3-import-root-certificate-video-tutorial)
4. [Start Docker](#4-starting-docker-video-tutorial)
5. [Edit the /etc/hosts file](#5-edit-the-etchosts-file-video-tutorial)

This can be done manually or automatically (Windows).

## 🤖 Automatic Configuration
### Windows
Windows users can now use the [Auto Configuration Tool](https://github.com/ptrumpis/snap-camera-server-auto-config), which will handle all of these tasks for you.

If you prefer to do the steps manually then you can watch the video guide below which covers all the steps in detail.

### Mac OS
The Windows [Auto Configuration Tool](https://github.com/ptrumpis/snap-camera-server-auto-config) now includes an `AutoConfig.applescript` file for Mac OS users.

It is still experimental but you can try to run it with your Script Editor on your macOS computer.

## 🎓 How To Video Guides
You can watch these step by step video guides on YouTube if you need help with the configuration on your local machine.

### Windows Installation Guide
[![Snap Camera Server Windows Installation Guide](https://img.youtube.com/vi/bcsjvWHUr7c/0.jpg)](https://www.youtube.com/watch?v=bcsjvWHUr7c)

### Mac OS Installation Guide
[![Snap Camera Server Mac OS Installation Guide](https://img.youtube.com/vi/b2ILHJaD1T4/0.jpg)](https://www.youtube.com/watch?v=b2ILHJaD1T4)

## 💪 Manual Configuration Steps
In addition to the full video guide each step is also covered by a short video tutorial

### 1. Create Configuration file ([Video Tutorial](https://youtu.be/wZIPBPVs-70))
You need to create a `.env` configuration file.

Create a copy of the file `example.env` and name the copy `.env` (without filename).

You can go with all default values and don't need to change anything unless your having problems with certain ports being occupied or if you want to host the server on the internet.

Read the [Server Settings (.env)](https://github.com/ptrumpis/snap-camera-server/wiki/Server-Settings-(.env)) page for configuration details.

### 2. Generate SSL certificate ([Video Tutorial](https://youtu.be/4QJP8MLvSdA))
Snap Camera will refuse to connect to your local server if you don't have a trusted SSL certificate.
You need to generate a .crt and .key file and have the .crt file installed as trusted root certificate on your operating system.

Don't worry, it sounds harder than it is. Just make sure you have **OpenSSL** installed.

The required files can be generated with the included script `./gencert.bat` or `./gencert.sh` which will output:
- ./ssl/studio-app.snapchat.com.crt
- ./ssl/studio-app.snapchat.com.key

Docker compose expects these two files by default, otherwise the containers will not start.

### 3. Import Root certificate ([Video Tutorial](https://youtu.be/mJFmvTg1yfE))
You need to tell your operating system to trust the newly generated certificate.

On Windows you can import the certificate in three different ways:
1. By double-clicking the file and going through the pop up dialog
2. By running the Windows management console application `certlm.msc`
3. By simply executing a command called *certutil* (what I recommend)

```bash
certutil -addstore -enterprise Root ./ssl/studio-app.snapchat.com.crt
```

You need to run this command as Administrator on a Windows Powershell.

### 4. Starting Docker ([Video Tutorial](https://youtu.be/2siSkWdZLbo))
You may start the docker containers now by executing the command
```bash
docker compose up
```

The command can be executed with a terminal like Windows Powershell.

*Docker must be installed to execute this command*

### 5. Edit the /etc/hosts file ([Video Tutorial](https://youtu.be/o9gAo5VH2cw))
#### Connecting your Snap Camera application to your local server
You need to tell/force your Snap Camera application to use your server instead the one that has been shutdown on January 25, 2023.

1. Edit your `/etc/hosts` file. For Windows users that file is located at 
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

## 🎉 Congratulations
After completing the 5 steps you may now start Snap Camera!

Download the latest [Snap Camera v1.21.0](https://github.com/ptrumpis/snap-camera-server/discussions/6) if the client application is not already installed on your system.

And remember to apply the [signature patch](https://github.com/ptrumpis/snap-camera-signature-patch) if you want to access lenses from [lens.snapchat.com](https://lens.snapchat.com).
