# Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Get branch and patch level, then create patch.txt file
RUN DATE=$(date "+%Y-%m-%d:%H:%M:%S") && \
    echo $DATE > ./dist/patch.txt

# Deployment stage
FROM nginx:stable-alpine AS deploy

# Default Environment Variable values
ENV API_HOST=localhost
ENV API_PORT=8083
ENV IDP_LOGIN_URI=http://localhost:8084/login

# Copy built assets from build stage to nginx serving directory
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Expose port
EXPOSE 80

# Start nginx (uses default entrypoint which processes templates with envsubst)
CMD ["nginx", "-g", "daemon off;"]

