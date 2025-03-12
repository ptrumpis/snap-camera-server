# Vagrantfile

env_file = File.expand_path("./.env")
if File.exist?(env_file)
  File.foreach(env_file) do |line|
    next if line.strip.start_with?('#') || !line.include?('=')

    key, value = line.strip.split('=', 2)
    ENV[key] = value.strip if key && value
  end
end

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/bionic64"

  config.vm.network "forwarded_port", guest: 3306, host: ENV['MYSQL_LOCAL_PORT'].to_i
  config.vm.network "forwarded_port", guest: 8080, host: ENV['ADMINER_LOCAL_PORT'].to_i
  config.vm.network "forwarded_port", guest: 80, host: ENV['NGINX_LOCAL_PORT'].to_i
  config.vm.network "forwarded_port", guest: 443, host: 443
  config.vm.network "forwarded_port", guest: 5645, host: ENV['APP_LOCAL_PORT'].to_i

  config.vm.synced_folder "./", "/usr/src/app"
  config.vm.synced_folder "./nginx/theme", "/etc/nginx/theme"
  config.vm.synced_folder "./nginx/snap-camera-categories-media", "/var/www/snapcamera/snap-camera-categories-media"
  config.vm.synced_folder "./nginx/snap-camera-media", "/var/www/snapcamera/snap-camera-media"
  config.vm.synced_folder "./nginx/snap-camera-media-alt", "/var/www/snapcamera/snap-camera-media-alt"
  config.vm.synced_folder "./import", "/var/www/snapcamera/import"

  config.vm.provision "shell", inline: <<-SHELL
    apt-get update && apt-get install -y mysql-server nginx nodejs npm unzip gettext \
    libvips \
    libjpeg62-turbo \
    libpng-dev \
    libwebp-dev \
    libtiff-dev \
    libgif-dev \
    libssl-dev \
    libzstd1
  SHELL

  config.vm.provision "shell", inline: <<-SHELL
    mkdir -p /etc/ssl/certs /etc/ssl/private /etc/nginx/templates

    cp /usr/src/app/ssl/studio-app.snapchat.com.crt /etc/ssl/certs/studio-app.snapchat.com.crt
    cp /usr/src/app/ssl/studio-app.snapchat.com.key /etc/ssl/private/studio-app.snapchat.com.key
    cp /usr/src/app/nginx/default.conf.template /etc/nginx/templates/default.conf.template
  SHELL

  config.vm.provision "shell", inline: <<-SHELL
    set -a
    source /usr/src/app/.env
    set +a

    export MYSQL_DATABASE=${MYSQL_DATABASE:-snapcamera}
    export MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-123456}
	  export MYSQL_USER=${MYSQL_USER:-root}

    mysql -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;"
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH 'mysql_native_password' BY '$MYSQL_ROOT_PASSWORD';"

    envsubst < /usr/src/app/mysql/db_schema.sql > /tmp/db_schema.sql

    mysql snapcamera < /tmp/db_schema.sql
	  systemctl restart mysql
    systemctl enable mysql
  SHELL

  config.vm.provision "shell", inline: <<-SHELL
    set -a
    source /usr/src/app/.env
    set +a

    export HTTP_PORT=80
    export WEBAPP_HOST=localhost
    export WEBAPP_PORT=5645
    export WWW_ROOT=/var/www/snapcamera

    envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
    systemctl restart nginx
    systemctl enable nginx
  SHELL

  config.vm.provision "shell", inline: <<-SHELL
    cd /usr/src/app && npm install && npm run build
  SHELL

  config.vm.provision "shell", inline: <<-SHELL
    cat <<EOF > /usr/src/app/start-node.sh
    #!/bin/bash
    set -a
    source /usr/src/app/.env
    set +a

    exec env \
      DB_HOST=localhost \
      DB_PORT=3306 \
      DB_NAME=\${MYSQL_DATABASE:-snapcamera} \
      DB_USER=\${MYSQL_USER:-root} \
      DB_PASS=\${MYSQL_ROOT_PASSWORD:-123456} \
      PORT=5645 \
      STORAGE_SERVER=http://studio-app.snapchat.com:\${NGINX_LOCAL_PORT:-80} \
      STORAGE_PATH=/var/www/snapcamera \
      IMPORT_DIR=import \
      MEDIA_DIR=snap-camera-media \
      MEDIA_DIR_ALT=snap-camera-media-alt \
      node /usr/src/app/server.js
    EOF

    chmod +x /usr/src/app/start-node.sh
  SHELL

  config.vm.provision "shell", inline: <<-SHELL
    cat <<EOF > /etc/systemd/system/nodeapp.service
    [Unit]
    Description=Node.js Application
    After=network.target

    [Service]
    WorkingDirectory=/usr/src/app
    ExecStart=/usr/src/app/start-node.sh
    EnvironmentFile=-/usr/src/app/.env
    Restart=always
    User=vagrant

    [Install]
    WantedBy=multi-user.target
    EOF

    systemctl daemon-reload
    systemctl enable nodeapp
    systemctl restart nodeapp
  SHELL
end
