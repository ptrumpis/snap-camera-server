@echo off
IF EXIST "ssl\studio-app.snapchat.com.key" (
	IF EXIST "ssl\studio-app.snapchat.com.crt" (
		echo SSL certificate already exists.
		exit
	)
)
SET command=req -x509 -nodes -days 3650 -subj "/C=CA/ST=QC/O=Snap Inc./CN=studio-app.snapchat.com" -addext "subjectAltName=DNS:*.snapchat.com" -newkey rsa:2048 -keyout ./ssl/studio-app.snapchat.com.key -out ./ssl/studio-app.snapchat.com.crt
WHERE openssl >nul 2>&1
IF %ERRORLEVEL% == 0 (
	openssl %command%
) ELSE (
	IF EXIST "%programfiles%\OpenSSL-Win64\bin\openssl.exe" (
		"%programfiles%\OpenSSL-Win64\bin\openssl.exe" %command%
	) ELSE (
		IF EXIST "%programfiles(x86)%\OpenSSL-Win32\bin\openssl.exe" (
			"%programfiles(x86)%\OpenSSL-Win32\bin\openssl.exe" %command%
		) ELSE (
			echo Error: OpenSSL could not be found on your system. Please download and install OpenSSL.
			pause
		)
	)
)
