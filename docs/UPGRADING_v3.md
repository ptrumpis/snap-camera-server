# Upgrade from Version 2.x to newest 3.x
This article will cover how to upgrade your current Snap Camera Server to the latest v3 release.

## Getting started
* Upgrading works by downloading the [Latest v3.x Release](https://github.com/ptrumpis/snap-camera-server/releases/latest)
* Copy your current `ssl/` folder over to the new Server directory and create a new `.env` file by copying `example.env`
* Removing/Uninstalling your current version inside Docker
* Start the new Server with Docker

## Copy files
* Just copy the `ssl/` folder from your old Server directory to the new Server directory.
* If you imported any lenses you will also need to copy your `import/` folder over to your new server directory.
* Create a new `.env` configuration file like the first time by making a copy of the template `example.env` file.

## Docker Desktop
Start your local Docker Dekstop application and complete these 3 steps one after the other.

1. Remove the Container
2. Remove the Image
3. Remove the Volume

### Remove the Container
* Click on Containers and remove the `snap-camera-server` container by clicking the trash bin.

![docker_containers_delete](https://user-images.githubusercontent.com/116500225/222521467-1875b4c5-d05a-4506-8c54-be705ced6f5a.PNG)

---

### Remove the Image
* Click on Images and remove the `snap-camera-server` image by clicking the trash bin.

![docker_images_delete](https://user-images.githubusercontent.com/116500225/222521469-7f20e5bd-b963-4dbb-b583-461531de809e.PNG)

---

### Remove the Volume
* Click on Volumes and remove the `node-modules` volume by clicking the trash bin.

![docker_volumes_delete](https://user-images.githubusercontent.com/116500225/222521462-31096aec-9db2-4c9c-a61f-fc8ea2fe2fee.PNG)

## Start the new Server
We need to tell Docker Desktop about our new Server.

Run this command with a Windows Powershell or Terminal inside your new server directory:
```bash
docker compose up --build
```

## Done
Awesome your done 🥳🎉
