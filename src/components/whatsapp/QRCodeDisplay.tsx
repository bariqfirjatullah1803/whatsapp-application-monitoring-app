import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode: string | null;
  isReady: boolean;
  error: string | null;
}

export function QRCodeDisplay({ qrCode, isReady, error }: QRCodeDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Connection</CardTitle>
        <CardDescription>
          {isReady
            ? 'WhatsApp is connected and ready'
            : 'Scan QR code with your WhatsApp to connect'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isReady ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-600">Connected!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your WhatsApp is connected and ready to use
            </p>
          </div>
        ) : qrCode ? (
          <div className="space-y-4">
            <img src={qrCode} alt="QR Code" className="w-64 h-64 mx-auto" />
            <p className="text-sm text-center text-muted-foreground">
              Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Initializing WhatsApp client...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

