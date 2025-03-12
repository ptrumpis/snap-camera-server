# 🛠️ Configuration - Snap Camera Server

In order to get the server running you can use the  
[Automatic Configuration](#-automatic-configuration)

Or complete the following 5 steps manually:

1. [Create Configuration file](#1-create-configuration-file-video-clip)
2. [Generate SSL certificate](#2-generate-ssl-certificate-video-clip)
3. [Import Root certificate](#3-import-root-certificate-video-clip)
4. [Start Docker](#4-starting-docker-video-clip)
5. [Edit the /etc/hosts file](#5-edit-the-etchosts-file-video-clip)

This can be done manually or automatically (Windows and macOS).

## 🤖 Automatic Configuration
### Windows
Windows users can use the [Auto Configuration Tool](https://github.com/ptrumpis/snap-camera-server-auto-config), which will handle all configuration steps for you.

If you prefer to do the steps manually then you can watch the video guide below which covers all the steps in detail.

### macOS
The [Auto Configuration Tool](https://github.com/ptrumpis/snap-camera-server-auto-config) includes an `autoconfig.sh` file for macOS users.

You need to copy and run this command inside your Terminal window.
```bash
sudo /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/ptrumpis/snap-camera-server-auto-config/master/macOS/autoconfig.sh)"
```

## 🎓 How To Video Guides
You can watch these step by step video guides on YouTube if you need help with the manual configuration on your local machine.

### Windows Installation Guide
[![Snap Camera Server Windows Installation Guide](https://img.youtube.com/vi/bcsjvWHUr7c/default.jpg)](https://www.youtube.com/watch?v=bcsjvWHUr7c)

### macOS Installation Guide
[![Snap Camera Server Mac OS Installation Guide](https://img.youtube.com/vi/b2ILHJaD1T4/default.jpg)](https://www.youtube.com/watch?v=b2ILHJaD1T4)

## 💪 Manual Configuration Steps
In addition to the full video guide each step is also covered by a short video tutorial

### 1. Create Configuration file ([Video Clip](https://youtu.be/wZIPBPVs-70))
You need to create a `.env` configuration file.

Create a copy of the file `example.env` and name the copy `.env` (without filename).

You can go with all default values and don't need to change anything unless your having problems with certain ports being occupied or if you want to host the server on the internet.

Read the [Configuration Settings (.env)](https://github.com/ptrumpis/snap-camera-server/wiki/Configuration-Settings-(.env)) page for configuration details.

### 2. Generate SSL certificate ([Video Clip](https://youtu.be/4QJP8MLvSdA))
Snap Camera will refuse to connect to your local server if you don't have a trusted SSL certificate.
You need to generate a .crt and .key file and have the .crt file installed as trusted root certificate on your operating system.

Don't worry, it sounds harder than it is. Just make sure you have **OpenSSL** installed.

The required files can be generated with the included script `./gencert.bat` or `./gencert.sh` which will output:
- ./ssl/studio-app.snapchat.com.crt
- ./ssl/studio-app.snapchat.com.key

Docker compose expects these two files by default, otherwise the containers will not start.

### 3. Import Root certificate ([Video Clip](https://youtu.be/mJFmvTg1yfE))
You need to tell your operating system to trust the newly generated certificate.

#### Windows
On Windows you can import the certificate in three different ways:
1. By double-clicking the file and going through the pop up dialog
2. By running the Windows management console application `certlm.msc`
3. By simply executing a command called *certutil* (what I recommend)

```bash
certutil -addstore -enterprise Root ./ssl/studio-app.snapchat.com.crt
```

You need to run this command as Administrator on a Windows Powershell.

#### macOS
On macOS you can run these two commands inside a Terminal window.

```bash
sudo security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db ./ssl/studio-app.snapchat.com.crt
```

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./ssl/studio-app.snapchat.com.crt
```

### 4. Starting Docker ([Video Clip](https://youtu.be/2siSkWdZLbo))
You may start the docker containers now by executing the command
```bash
docker compose up
```

The command can be executed with a terminal like Windows Powershell.

*Docker must be installed to execute this command*

### 5. Edit the /etc/hosts file ([Video Clip](https://youtu.be/o9gAo5VH2cw))
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

#### 🔗 Please like and share this project with others:  
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/intent/tweet?url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server&text=Snap%20Camera%20Server%20is%20a%20self%20hosted%20solution%20to%20use%20Snapchat%20webcam%20filters&hashtags=snapcamera,snapchat)
[![Pinterest](https://img.shields.io/badge/Pinterest-E60023?style=for-the-badge&logo=pinterest&logoColor=white)](https://pinterest.com/pin/create/button/?url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server&media=&description=Snap%20Camera%20Server%20is%20a%20self%20hosted%20solution%20to%20use%20Snapchat%20webcam%20filters)
[![Reddit](https://img.shields.io/badge/Reddit-FF4500?style=for-the-badge&logo=reddit&logoColor=white)](https://reddit.com/submit?url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server&title=Snap%20Camera%20Server%20is%20a%20self%20hosted%20solution%20to%20use%20Snapchat%20webcam%20filters)  
[![VK](https://img.shields.io/badge/VKontakte-4C75A3?style=for-the-badge&logo=vk&logoColor=white)](http://vk.com/share.php?url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server&title=Snap%20Camera%20Server%20is%20a%20self%20hosted%20solution%20to%20use%20Snapchat%20webcam%20filters)
[![Tumblr](https://img.shields.io/badge/Tumblr-35465C?style=for-the-badge&logo=tumblr&logoColor=white)](http://www.tumblr.com/share?v=3&u=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server&t=)
[![LinkedIn](https://img.shields.io/badge/LinkedIN-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server)
[![Xing](https://img.shields.io/badge/Xing-006567?style=for-the-badge&logo=xing&logoColor=white)](https://www.xing.com/app/user?op=share;url=url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server)  
[![Telegram](https://img.shields.io/badge/Telegram-0088CC?style=for-the-badge&logo=telegram&logoColor=white)](https://telegram.me/share/url?url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server&text=Snap%20Camera%20Server%20is%20a%20self%20hosted%20solution%20to%20use%20Snapchat%20webcam%20filters)
[![Skype](https://img.shields.io/badge/Skype-00AFF0?style=for-the-badge&logo=skype&logoColor=white)](https://web.skype.com/share?url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://api.whatsapp.com/send?text=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server)
[![Sina Weibo](https://img.shields.io/badge/新浪微博-DF2029?style=for-the-badge&logo=sina-weibo&logoColor=white)](https://service.weibo.com/share/share.php?url=https%3A%2F%2Fgithub.com%2Fptrumpis%2Fsnap-camera-server&title=Snap%20Camera%20Server%20is%20a%20self%20hosted%20solution%20to%20use%20Snapchat%20webcam%20filters)
