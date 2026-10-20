# Builds the whole app into one container: React pages + Spring Boot API.

# Step 1: build the React front end
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Step 2: build the Spring Boot back end, with the React files inside it
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
COPY --from=frontend /frontend/dist ./src/main/resources/static
RUN mvn -B package -DskipTests

# Step 3: small image that just runs the app
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/finance-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
# Keep Java within the free plan's 512 MB of memory
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+UseSerialGC", "-jar", "app.jar"]