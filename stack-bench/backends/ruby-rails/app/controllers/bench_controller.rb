class BenchController < ApplicationController
  include ActionController::Live

  REGIONS = %w[us-east us-west eu-central].freeze
  STATUSES = %w[ok warn err].freeze

  def rows
    render json: (0...200).map { |i| make_row(i) }
  end

  def act
    render json: { ok: true, ts: (Time.now.to_f * 1000).to_i }
  end

  def events
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    i = 0
    loop do
      response.stream.write("data: #{ { seq: i, ts: (Time.now.to_f * 1000).to_i }.to_json }\n\n")
      i += 1
      sleep 0.1
    end
  rescue IOError, ActionController::Live::ClientDisconnected
  ensure
    response.stream.close
  end

  private

  def make_row(i)
    {
      id: i,
      service: "svc-#{i % 12}",
      region: REGIONS[i % 3],
      status: STATUSES[i % 3],
      latency_ms: 20 + ((i * 37) % 400),
      rps: 100 + ((i * 91) % 5000),
      updated_at: Time.at(1_752_900_000 + i).utc.iso8601
    }
  end
end
