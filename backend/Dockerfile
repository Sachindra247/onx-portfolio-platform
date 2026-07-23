# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files first so Docker can cache package restoration
COPY ["OnXPortfolio.Api/OnXPortfolio.Api.csproj", "OnXPortfolio.Api/"]
COPY ["OnXPortfolio.Application/OnXPortfolio.Application.csproj", "OnXPortfolio.Application/"]
COPY ["OnXPortfolio.Domain/OnXPortfolio.Domain.csproj", "OnXPortfolio.Domain/"]
COPY ["OnXPortfolio.Infrastructure/OnXPortfolio.Infrastructure.csproj", "OnXPortfolio.Infrastructure/"]

RUN dotnet restore "OnXPortfolio.Api/OnXPortfolio.Api.csproj"

# Copy the remaining backend source code
COPY . .

WORKDIR "/src/OnXPortfolio.Api"

RUN dotnet publish "OnXPortfolio.Api.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

# Render web services expect the app to listen publicly.
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "OnXPortfolio.Api.dll"]