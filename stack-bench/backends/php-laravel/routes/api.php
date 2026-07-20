<?php

use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\StreamedResponse;

function makeRow(int $i): array
{
    $regions = ['us-east', 'us-west', 'eu-central'];
    $statuses = ['ok', 'warn', 'err'];

    return [
        'id' => $i,
        'service' => 'svc-' . ($i % 12),
        'region' => $regions[$i % 3],
        'status' => $statuses[$i % 3],
        'latency_ms' => 20 + (($i * 37) % 400),
        'rps' => 100 + (($i * 91) % 5000),
        'updated_at' => gmdate('c', 1752900000 + $i),
    ];
}

Route::get('/rows', function () {
    $rows = [];
    for ($i = 0; $i < 200; $i++) {
        $rows[] = makeRow($i);
    }

    return response()->json($rows);
});

Route::post('/action', function () {
    return response()->json(['ok' => true, 'ts' => (int) (microtime(true) * 1000)]);
});

Route::get('/events', function () {
    return new StreamedResponse(function () {
        $i = 0;
        while (true) {
            echo 'data: ' . json_encode(['seq' => $i++, 'ts' => (int) (microtime(true) * 1000)]) . "\n\n";
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
            if (connection_aborted()) {
                break;
            }
            usleep(100000);
        }
    }, 200, ['Content-Type' => 'text/event-stream', 'Cache-Control' => 'no-cache', 'X-Accel-Buffering' => 'no']);
});
