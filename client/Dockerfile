FROM nginx:alpine

COPY ./docs /usr/share/nginx/html

RUN echo -e 'server {\n    listen 80;\n    server_name localhost;\n    location / {\n        root /usr/share/nginx/html;\n        try_files $uri $uri/ /index.html;\n    }\n}' > /etc/nginx/conf.d/default.conf
