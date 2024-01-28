[![GitHub License](https://img.shields.io/github/license/ptrumpis/snap-camera-server)](https://github.com/ptrumpis/snap-camera-server?tab=MIT-1-ov-file#readme)
[![GitHub Release Date](https://img.shields.io/github/release-date/ptrumpis/snap-camera-server)](https://github.com/ptrumpis/snap-camera-server/releases/latest)
[![GitHub Release](https://img.shields.io/github/v/release/ptrumpis/snap-camera-server)](https://github.com/ptrumpis/snap-camera-server/releases/latest)
[![GitHub stars](https://img.shields.io/github/stars/ptrumpis/snap-camera-server?style=flat)](https://github.com/ptrumpis/snap-camera-server/stargazers) 
[![GitHub forks](https://img.shields.io/github/forks/ptrumpis/snap-camera-server?style=flat)](https://github.com/ptrumpis/snap-camera-server/forks)
[![GitHub Commits](https://img.shields.io/github/commit-activity/t/ptrumpis/snap-camera-server)](https://github.com/ptrumpis/snap-camera-server/commits)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/ptrumpis)](https://github.com/sponsors/ptrumpis)
[![GitHub Discussions](https://img.shields.io/github/discussions/ptrumpis/snap-camera-server)](https://github.com/ptrumpis/snap-camera-server/discussions)

# 👻 Snap Camera Server v3.2
An alternative self hosted solution for Snap Camera.  
It will let you continue to use Snapcamera with all Snapchat filters after the shutdown on January 25, 2023.

**This code is a fork of *jaku/SnapCameraPreservation* on steroids 💪** 
- ✔️ No previously backed up files or third party server required.
- ✔️ Access all Snap Lenses from **lens.snapchat.com** without restrictions.
- ✔️ Import Lenses from local application cache e.g. `AppData\Local\Snap\Snap Camera\cache\lenses`.
- ✔️ All files will be stored inside a Docker Volume (e.g. on your local machine).
- ✔️ Works 100% on Windows and Mac OS without missing Lenses.

You get the full decentralized control and you can use *Snap Camera* until Doomsday.

See the [📋 Changelog](docs/CHANGELOG.md) for a full list of changes and features.

## ⚠️ Pre-Requirements
This server requires Docker and OpenSSL and maybe 5 to 10 minutes of your time ⏲️
- [🐋 Docker](https://www.docker.com/)
- [🔐 OpenSSL](https://www.openssl.org/) (Download from [slproweb.com](https://slproweb.com/products/Win32OpenSSL.html) as Windows user)

*The client application is required to apply the filters to your webcam ([Download Snap Camera](https://github.com/ptrumpis/snap-camera-server/discussions/6))*

## 🚀 Getting Started
1. [📥 Download the latest release](https://github.com/ptrumpis/snap-camera-server/releases/latest)
2. [🛠️ Complete the configuration](docs/CONFIGURATION.md)
3. [📖 Read the Server Wiki](https://github.com/ptrumpis/snap-camera-server/wiki)

There are also step by step video guides for [📺 Windows](https://www.youtube.com/watch?v=bcsjvWHUr7c) and [📺 Mac OS](https://www.youtube.com/watch?v=b2ILHJaD1T4) available.  
If you want to upgrade an existing server version to a newer version, have a look at:
- [Upgrade v2.x to v3.x](docs/UPGRADING_v3.md)

## 💯 Advanced Features
### 📤 Snap Camera Cache Import 
You can import your local cached lenses through this online interface [Snap Lens Cache Import](https://ptrumpis.github.io/snap-lens-cache-import/)  
Watch the [📺 Re-Import Cache Video Guide](https://www.youtube.com/watch?v=alo49et3QxY) if you need help.

### 🌐 Web Lens Download
All Snap Lenses are still available for download at **https://lens.snapchat.com** (hidden from view).  
You need to apply a special [Snap Camera Signature Patch](https://ptrumpis.github.io/snap-camera-signature-patch/) to your `Snap Camera.exe` to get access to these web lenses.

## 💬 Community
This is a non profit open source project for the greater good and you can help to make it better.
- [🐛 Report Bugs](https://github.com/ptrumpis/snap-camera-server/issues)
- [🙏 Ask for Help](https://github.com/ptrumpis/snap-camera-server/discussions/categories/q-a)

Help to build a community
- [💬 Join Discussions](https://github.com/ptrumpis/snap-camera-server/discussions)
- [💡 Suggest Features](https://github.com/ptrumpis/snap-camera-server/discussions/categories/ideas)
- [👍 Help Others](https://github.com/ptrumpis/snap-camera-server/discussions/categories/q-a)
- [🙌 Share Lenses](https://github.com/ptrumpis/snap-camera-server/discussions/categories/share)
- [✍️ Contribute](https://github.com/ptrumpis/snap-camera-server/pulls)

Like and share this project with others:  
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

## 🤝 Contributors
![GitHub Contributors Image](https://contrib.rocks/image?repo=ptrumpis/snap-camera-server)

## ❤️ Support
If you like my work and want to support me, feel free to invite me for a virtual coffee ☕  
[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/ptrumpis)
[![Buy me a Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ptrumpis)
[![Liberapay](https://img.shields.io/badge/Liberapay-F6C915?style=for-the-badge&logo=liberapay&logoColor=black)](https://liberapay.com/ptrumpis/)
[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=D2T92FVZAE65L)

You can also become my GitHub Sponsor  
[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#white)](https://github.com/sponsors/ptrumpis)
