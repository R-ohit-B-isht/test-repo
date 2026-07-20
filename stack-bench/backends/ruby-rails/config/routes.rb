Rails.application.routes.draw do
  get "/api/rows", to: "bench#rows"
  post "/api/action", to: "bench#act"
  get "/api/events", to: "bench#events"
end
