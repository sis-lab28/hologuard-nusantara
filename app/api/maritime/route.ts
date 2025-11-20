import WebSocket, { type RawData } from 'ws';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const south = parseFloat(searchParams.get('south') || '-11');
  const west = parseFloat(searchParams.get('west') || '95');
  const north = parseFloat(searchParams.get('north') || '6');
  const east = parseFloat(searchParams.get('east') || '141');

  const apiKey = process.env.AISSTREAM_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'AISSTREAM_API_KEY is not configured on the server.' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

      const abort = () => {
        try {
          ws.close();
        } catch (e) {
          console.error('Error closing AIS WebSocket:', e);
        }
        controller.close();
      };

      ws.on('open', () => {
        const payload: any = {
          APIKey: apiKey,
          BoundingBoxes: [
            [
              [north, west],
              [south, east],
            ],
          ],
          FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
        };

        const mmsiParams = searchParams.getAll('mmsi');
        if (mmsiParams.length > 0) {
          payload.FiltersShipMMSI = mmsiParams;
        }

        ws.send(JSON.stringify(payload));

        const hello = `data: ${JSON.stringify({ type: 'info', message: 'Connected to AISStream', payload })}\n\n`;
        controller.enqueue(new TextEncoder().encode(hello));
      });

      ws.on('message', (data: RawData) => {
        try {
          const text = typeof data === 'string' ? data : data.toString();
          const msg = `data: ${text}\n\n`;
          controller.enqueue(new TextEncoder().encode(msg));
        } catch (e) {
          console.error('Error processing AIS message:', e);
        }
      });

      ws.on('error', (err: Error) => {
        console.error('AIS WebSocket error:', err);
        const errorEvent = `data: ${JSON.stringify({ type: 'error', message: 'AIS WebSocket error' })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorEvent));
        abort();
      });

      ws.on('close', () => {
        const closeEvent = `data: ${JSON.stringify({ type: 'info', message: 'AIS WebSocket closed' })}\n\n`;
        controller.enqueue(new TextEncoder().encode(closeEvent));
        controller.close();
      });

      (request as any).signal?.addEventListener('abort', () => {
        abort();
      });
    },
    cancel() { 
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}