FROM mcr.microsoft.com/dotnet/sdk:8.0 AS b
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /out
FROM mcr.microsoft.com/dotnet/aspnet:8.0
COPY --from=b /out /app
WORKDIR /app
ENTRYPOINT ["dotnet","csharp-minimal.dll"]
