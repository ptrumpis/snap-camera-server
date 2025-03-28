# 🎨 Lens Creator Guide
## 1. Preparing Snap Camera Server 
### 1.1. Create Snap Developer Account
1. Go to: https://my-lenses.snapchat.com/camera-kit
2. Log-in or Sign-up for a new developer account  
  
![login](https://github.com/user-attachments/assets/4da8117b-68f8-4c6d-b60d-7ddc6e2c3b32)

### 1.2. Create a new Web App
1. Navigate to the **Apps** section
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

### 1.3. Copy and pase API Token
Now you need to copy your **API Token**  

![copy-api-token](https://github.com/user-attachments/assets/ffde2dfb-dd45-4ae4-b0ac-d627553b99a8)

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
# 3. Copy&Paste 'Production API Token' below
#
BRIDGE_API_TOKEN=
```

### 1.4. Start Snap Camera Server in Creator Mode
You can now start the Docker Server with:  
```shell
docker compose --profile creator up 
```

This will load and start an additonal Docker container to import Lenses from your Snapchat account.  
You should run the command above only if you want to import new Lenses .  
Once you activate your Lenses inside Snap Camera, they are fully imported.  

## 2. Organize your lenses in Groups
### 2.1. Lens Scheduler
You must group your lenses together with the **Lens Scheduler**

![lens groups](https://github.com/user-attachments/assets/c6640e4f-247f-4b44-9ae1-006d6b9e1f78)

You can create a **New Lens Group** and add multiple or single Lenses to them.  
If your Lenses are not showing up for selection you might have to put them in **Lens Folders** first.  
After putting them in **Folders** you can add the folders under the **Lens Sources** tab.  

## 3. Using your grouped lenses with Snap Camera
### 3.1. Copy and paste the Lens Group ID

Clicking on any **Lens Group** will enable you to view and copy the **Lens Group ID**

![lens-group-ids](https://github.com/user-attachments/assets/712469c9-9f25-45ca-ad93-f687d98b812c)

If you set up the API Token in your .env file as described in 1.3  
And started Snap Camera Server as described under 1.4  
You should now be able to paste the **Lens Group ID** into the search bar of your Snap Camera application.

