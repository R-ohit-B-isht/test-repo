defmodule BenchPhxWeb.BenchController do
  use BenchPhxWeb, :controller

  @regions ~w(us-east us-west eu-central)
  @statuses ~w(ok warn err)

  defp make_row(i) do
    %{
      id: i,
      service: "svc-#{rem(i, 12)}",
      region: Enum.at(@regions, rem(i, 3)),
      status: Enum.at(@statuses, rem(i, 3)),
      latency_ms: 20 + rem(i * 37, 400),
      rps: 100 + rem(i * 91, 5000),
      updated_at: DateTime.from_unix!(1_752_900_000 + i) |> DateTime.to_iso8601()
    }
  end

  def rows(conn, _params) do
    json(conn, Enum.map(0..199, &make_row/1))
  end

  def act(conn, _params) do
    json(conn, %{ok: true, ts: System.system_time(:millisecond)})
  end

  def events(conn, _params) do
    conn =
      conn
      |> put_resp_content_type("text/event-stream")
      |> put_resp_header("cache-control", "no-cache")
      |> send_chunked(200)

    stream_events(conn, 0)
  end

  defp stream_events(conn, i) do
    payload = Jason.encode!(%{seq: i, ts: System.system_time(:millisecond)})

    case chunk(conn, "data: #{payload}\n\n") do
      {:ok, conn} ->
        Process.sleep(100)
        stream_events(conn, i + 1)

      {:error, _} ->
        conn
    end
  end
end
