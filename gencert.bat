@echo off
setlocal

if not exist "ssl" mkdir "ssl"

IF EXIST "ssl\studio-app.snapchat.com.key" (
	IF EXIST "ssl\studio-app.snapchat.com.crt" (
		echo SSL certificate already exists.
		exit /b 0
	)
)

REM create tmp cfg
set "TEMP_CONF=%TEMP%\openssl_%RANDOM%.cnf"
(
echo [ req ]
echo distinguished_name = req_distinguished_name
echo prompt = no
echo [ req_distinguished_name ]
echo [ v3_ca ]
echo subjectAltName = DNS:*.snapchat.com
) > "%TEMP_CONF%"

set COMMAND=req -x509 -nodes -days 3650 -subj "/C=CA/ST=QC/O=Snap Inc./CN=studio-app.snapchat.com" -newkey rsa:2048 -keyout .\ssl\studio-app.snapchat.com.key -out .\ssl\studio-app.snapchat.com.crt -config "%TEMP_CONF%"

WHERE openssl >nul 2>&1
IF %ERRORLEVEL% == 0 (
	openssl %COMMAND%
) ELSE (
	IF EXIST "%programfiles%\OpenSSL-Win64\bin\openssl.exe" (
		"%programfiles%\OpenSSL-Win64\bin\openssl.exe" %COMMAND%
	) ELSE (
		IF EXIST "%programfiles(x86)%\OpenSSL-Win32\bin\openssl.exe" (
			"%programfiles(x86)%\OpenSSL-Win32\bin\openssl.exe" %COMMAND%
		) ELSE (
			echo Error: OpenSSL could not be found on your system. Please download and install OpenSSL.
			del "%TEMP_CONF%" 2>nul
			pause
			exit /b 1
		)
	)
)

REM remove tmp cfg
del "%TEMP_CONF%" 2>nul

if exist "ssl\studio-app.snapchat.com.key" if exist "ssl\studio-app.snapchat.com.crt" (
	echo SSL certificate generated successfully.
) else (
	echo Certificate generation failed.
)

endlocal
