# --- Estagio 1: build ---------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# pom.xml copiado sozinho primeiro: enquanto as dependencias nao mudarem,
# o Docker reaproveita esta camada e nao rebaixa tudo a cada alteracao de codigo.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# --- Estagio 2: runtime -------------------------------------------------
# Imagem final so com JRE: nao carrega Maven nem o codigo-fonte.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Processo roda como usuario sem privilegio, nao como root.
RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build /build/target/*.jar app.jar
USER spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
