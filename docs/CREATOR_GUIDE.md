# 🎨 Lens Creator Guide
This document will guide you through the process of importing Lenses from Lens Studio to your Snap Camera Server.

## ⚠️ Important
Please note that some filters are not compatible with Snap Camera.  
Compatibility depends heavily on the Lens Studio version and the lens features used.  

`If a Lens is created in a version that is not compatible with the version of Camera Kit SDK being used, the Lens will not appear in the app!`

You can find an overview of incompatible features here:  
[Lens Studio Compatibility](https://developers.snap.com/camera-kit/ar-content/lens-studio-compatibility)

The safest version that is known to always work is Lens Studio 4.36.

## 🛠️ 1. Preparing Snap Camera Server 
### 1.1. Create Snap Developer Account
1. Go to: https://my-lenses.snapchat.com/camera-kit
2. Log-in or Sign-up for a new developer account  
  
![login](https://github.com/user-attachments/assets/4da8117b-68f8-4c6d-b60d-7ddc6e2c3b32)

### 1.2. Create a new Web App
1. Navigate to the **[Apps](https://my-lenses.snapchat.com/camera-kit/apps)** section
2. Click on the **Enable App** button  

![apps](https://github.com/user-attachments/assets/f32ee22c-8268-4aa2-8283-2ce2231daa05)

1. Click the **Select App** dropdown box
2. Choose <u>**+ Create App**</u>  

![create-new-app](https://github.com/user-attachments/assets/c3c1097a-6331-4688-ba7b-4397d159f263)

1. Pick any name for your web app
2. Select **Web** as your target platform  

![new-app](https://github.com/user-attachments/assets/dd243619-1f8d-45dd-8a39-cdb5e7b8df67)

1. Confirm your app in the next step by ticking the checkboxes
2. Click the **Enable** button  

![select-app](https://github.com/user-attachments/assets/969b8a11-53f9-4d97-a30b-9d9ca18421dd)

Your app will be created and you will be redirected to the overview page  

![your-app](https://github.com/user-attachments/assets/aeb7342c-8519-4797-a62c-b0fe968ec3b3)

### 1.3. Copy and paste Staging API Token
Now you need to copy your **Staging API Token**  

![copy-staging-token](https://github.com/user-attachments/assets/5169fdda-bd15-4c45-8398-43c933694856)

And paste the string to `BRIDGE_API_TOKEN` in your `.env` file  

```.env
###########################
# For Lens Creators
###########################
# Lens creators require an official API token in order to access their own lenses
#
# Get your own API token at:
# https://my-lenses.snapchat.com/camera-kit
#
# 1. Sign-in/Register
# 2. Create a new 'Web App'
# 3. Copy&Paste 'Staging API Token' below
#
BRIDGE_API_TOKEN=
```

It should look something like this:  
```.env
BRIDGE_API_TOKEN=ceChH4Jc8Bwy7iQAM1tafzdPJs0RwhTmkLU9XXfrhvjMt6ydM7EgR6OzoAk604zRyjyq6BriXupzbMts3eppTUr1yBYLA8ReoJPH
```
_Note: It's just a random string example not an actual API Token!_

### 1.4. Start Snap Camera Server in Creator Mode
You can now start the Docker Server with:  
```shell
docker compose --profile creator up 
```

This will load and start an additional Docker container `camera-kit-bridge` to import Lenses from your Snapchat account.   

Searching for Lens Group ID's is not possible if the `camera-kit-bridge` container is not running.

Once you activate your Lenses inside Snap Camera, they are fully imported.  
You can search them regulary by name, ID or URL after activation.  

If you want to use Creator Mode again, you can start the `camera-kit-bridge` container from Docker Desktop or re-run the command.

### 1.5 Permanently activate Creator Mode (Optional)
You can rename the file [docker-compose.override.creator.yml](https://github.com/ptrumpis/snap-camera-server/blob/main/docker-compose.override.creator.yml) to `docker-compose.override.yml` (removing the .creator part).

This will make `camera-kit-bridge` start automatically everytime the Server is started either by you or by auto config tools.  

## 🗂️ 2. Organize your lenses in Groups
### 2.1. Lens Scheduler
You must group your lenses together with the **[Lens Scheduler](https://my-lenses.snapchat.com/camera-kit/lens-scheduler)**

![lens groups](https://github.com/user-attachments/assets/c6640e4f-247f-4b44-9ae1-006d6b9e1f78)

You can create a **[New Lens Group](https://my-lenses.snapchat.com/camera-kit/lens-scheduler/groups)** and add multiple or single Lenses to them.  
If your Lenses are not showing up for selection you have to put them in **[Lens Folders](https://my-lenses.snapchat.com/lens-folders)** first (see the next step [2.2](#22-upload-lenses-for-camera-kit)).  

After putting them in **[Lens Folders](https://my-lenses.snapchat.com/lens-folders)** you can add the folders under the **[Lens Sources](https://my-lenses.snapchat.com/camera-kit/lens-scheduler/sources)** tab.  

You can follow the official Snapchat Guide for more detailed Information  
[Manage Lenses for Camera Kit](https://developers.snap.com/camera-kit/ar-content/lens-scheduler)

### 2.2 Upload Lenses for Camera Kit
To make your Lenses available under **Lens Scheduler** follow the official Snapchat Guide.

[Upload Lenses for Camera Kit](https://developers.snap.com/camera-kit/ar-content/upload-lenses)

## 🎭 3. Using your grouped lenses with Snap Camera
### 3.1. Copy & Paste the Lens Group ID
Clicking on any **Lens Group** will enable you to view and copy the **Lens Group ID**

![lens-group-ids](https://github.com/user-attachments/assets/712469c9-9f25-45ca-ad93-f687d98b812c)

### 3.2 Activate your Lenses inside Snap Camera
You should now be able to paste the **Lens Group ID** into the search bar of your Snap Camera application.
Your lenses should show up after a short moment.  

Activate your Lenses to make them persistent in your Server.  
Once activated you can search them regulary by name, ID or URL.  

**⚠️ Note:**  
If a Lens is created in a version that is not compatible with the version of Camera Kit SDK being used, the Lens will not appear in the app!

## 📑 4. Usefull resources
The following information may be useful, especially if you are having problems

- [Build Lenses in Lens Studio](https://developers.snap.com/camera-kit/ar-content/build-lenses)
- [Upload Lenses for Camera Kit](https://developers.snap.com/camera-kit/ar-content/upload-lenses)
- [Manage Lenses for Camera Kit](https://developers.snap.com/camera-kit/ar-content/lens-scheduler)
- [Lens Studio Compatibility](https://developers.snap.com/camera-kit/ar-content/lens-studio-compatibility)

## 👨‍💻 5. Finally
If you made it this far, you can consider yourself a ...

![hackerman](https://github.com/user-attachments/assets/4c798833-203b-4b03-b4a9-cda4f4101be5)