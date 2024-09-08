# Upgrade from Version 3.x to newest 4.x
This article will cover how to upgrade Snap Camera Server v3.x to the latest v4.x release.

## Getting started
* Upgrading works by downloading the [Latest v4.x Release](https://github.com/ptrumpis/snap-camera-server/releases/latest)
* Copy your current `ssl/` folder over to the new Server directory
* You can keep your existing `.env` file or create a new one by copying `example.env`
* Removing/Uninstalling your current version inside Docker
* Start the new Server with Docker

## Copy files
* Just copy the `ssl/` folder from your old Server directory to the new Server directory.
* If you imported any lenses you will also need to copy your `import/` folder over to your new server directory.
* Copy your existing `.env` file over to your new Server directory or create a new `.env` configuration file like the first time by making a copy of the template `example.env` file.

## Docker Desktop
Start your local Docker Dekstop application and complete these 2 steps one after the other.

1. Remove the Container
2. Remove the Image

### Remove the Container
* Click on Containers and remove the `snap-camera-server` container by clicking the trash bin.

![docker_containers_delete](https://user-images.githubusercontent.com/116500225/222521467-1875b4c5-d05a-4506-8c54-be705ced6f5a.PNG)

---

### Remove the Image
* Click on Images and remove the `snap-camera-server` image by clicking the trash bin.

![docker_images_delete](https://user-images.githubusercontent.com/116500225/222521469-7f20e5bd-b963-4dbb-b583-461531de809e.PNG)

#### Remove MySQL 5.7 Image (Optional) 
You can optionaly remove the `mysql` image with the `5.7` tag

## Start the new Server
We need to tell Docker Desktop about our new Server.

Run this command with a Windows Powershell or macOS Terminal inside your new server directory:
```bash
docker compose up
```

## Done
Awesome your done 🥳🎉
