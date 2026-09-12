# Build em uma imagem, servir em outra: a imagem final nao carrega Node nem
# node_modules, so os arquivos estaticos atras do nginx.
FROM node:24-alpine AS build

WORKDIR /app

# package.json e lock antes do resto: enquanto as dependencias nao mudam, a
# camada de npm ci fica em cache e o rebuild nao baixa nada.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite injeta VITE_* no bundle em tempo de BUILD, nao de execucao. Por isso a
# URL da API e ARG e nao variavel de ambiente do container: trocar depois de
# construir nao teria efeito nenhum.
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
