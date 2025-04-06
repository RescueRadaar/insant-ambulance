FROM node:18-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production environment
FROM nginx:stable-alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Add nginx config to redirect routes to index.html for SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 
