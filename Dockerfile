FROM nginx:1.20.0-alpine
COPY ./dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
RUN chmod +x /usr/sbin/nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
