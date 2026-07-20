defmodule BenchPhxWeb.Router do
  use BenchPhxWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", BenchPhxWeb do
    pipe_through :api

    get "/rows", BenchController, :rows
    post "/action", BenchController, :act
  end

  scope "/api", BenchPhxWeb do
    get "/events", BenchController, :events
  end
end
