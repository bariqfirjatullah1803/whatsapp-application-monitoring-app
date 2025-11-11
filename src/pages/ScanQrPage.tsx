import {
  MessageCircle,
  RefreshCcw,
  Scan as ScanIcon,
  ShieldCheck,
  Smartphone,
  Wifi,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type StepItemProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
}

const StepItem = ({ icon: Icon, title, description }: StepItemProps) => (
  <li className="flex gap-3 rounded-lg border border-dashed border-border/60 bg-background/80 p-4">
    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="size-5" aria-hidden />
    </div>
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </li>
)

type TipItemProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
}

const TipItem = ({ icon: Icon, label }: TipItemProps) => (
  <li className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
    <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
    <span>{label}</span>
  </li>
)

export const ScanQrPage = () => {
  const steps: StepItemProps[] = [
    {
      icon: Smartphone,
      title: "Buka WhatsApp di ponsel",
      description:
        "Masuk ke aplikasi WhatsApp lalu pilih menu Opsi ••• atau Pengaturan, sesuai dengan perangkat yang digunakan.",
    },
    {
      icon: MessageCircle,
      title: "Masuk ke menu Perangkat Tertaut",
      description:
        "Pilih Perangkat Tertaut dan ketuk tombol Tautkan perangkat untuk membuka pemindai QR.",
    },
    {
      icon: ScanIcon,
      title: "Arahkan kamera ke layar",
      description:
        "Arahkan kamera ponsel ke kode QR di layar ini sampai status berubah menandakan koneksi berhasil.",
    },
  ]

  const tips: TipItemProps[] = [
    {
      icon: ShieldCheck,
      label:
        "Setelah berhasil, sesi lama akan otomatis keluar demi keamanan akun Anda.",
    },
    {
      icon: Wifi,
      label: "Gunakan koneksi internet yang stabil agar proses penautan cepat.",
    },
    {
      icon: ScanIcon,
      label: "Pastikan area layar dan kamera memiliki pencahayaan yang cukup.",
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 py-10 sm:py-16">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6">
        <header className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-3 gap-2 border-primary/60 text-primary">
            <ScanIcon className="size-4" aria-hidden />
            Menunggu pemindaian
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pindai Kode QR WhatsApp
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Gunakan ponsel Anda untuk memindai kode QR dan hubungkan akun WhatsApp Business dengan dashboard pemantauan.
          </p>
        </header>

        <Card className="border-border/60 shadow-lg shadow-primary/5">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl sm:text-2xl">Langkah-langkah</CardTitle>
            <CardDescription>
              Arahkan kamera ponsel ke kode QR di sebelah kanan untuk menautkan perangkat.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
            <div className="flex flex-col gap-6">
              <ul className="flex flex-col gap-3">
                {steps.map((step) => (
                  <StepItem
                    key={step.title}
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </ul>

              <Separator />

              <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold">Tips pemindaian</h2>
                <ul className="grid gap-2 md:grid-cols-2">
                  {tips.map((tip) => (
                    <TipItem key={tip.label} icon={tip.icon} label={tip.label} />
                  ))}
                </ul>
              </div>
            </div>

            <aside className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
              <h3 className="text-lg font-semibold">Kode QR siap dipindai</h3>
              <p className="text-sm text-muted-foreground">
                Arahkan kamera ponsel ke kode QR di sebelah kanan untuk menautkan perangkat.
              </p>

              <div className="relative flex aspect-square w-full max-w-xs items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background shadow-inner">
                <span className="text-xs font-semibold tracking-[0.3em] text-muted-foreground">
                  QR CODE
                </span>
              </div>

              <Button type="button" variant="outline" className="w-full max-w-xs" disabled>
                <RefreshCcw className="size-4" aria-hidden />
                Perbarui kode
              </Button>

              <div className="flex items-start gap-2 rounded-lg bg-secondary/70 px-4 py-3 text-left text-xs text-secondary-foreground sm:text-sm">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Kami tidak menyimpan data percakapan Anda. Koneksi terenkripsi end-to-end.
                </span>
              </div>
            </aside>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export default ScanQrPage

