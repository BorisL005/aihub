# Multi-stage build (KAN-12): a JDK build stage compiles the jar, a slim JRE
# stage runs it. No Spring profile is activated here - the deployed
# environment supplies its own configuration via deploy/.env (see
# deploy/docker-compose.yml), so this image carries no baked-in dev/debug
# profile.

FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -B dependency:go-offline
COPY src ./src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
