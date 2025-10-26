# Hologuard Nusantara

Hologuard Nusantara adalah aplikasi web berbasis Next.js yang menyediakan sistem pemetaan teritorial 3D interaktif dengan fitur analisis keamanan dan intelijen. Aplikasi ini menggunakan Mapbox GL JS untuk visualisasi peta 3D dan menyediakan berbagai fitur untuk monitoring dan analisis wilayah.

## 🚀 Fitur Utama

- **Peta 3D Interaktif**: Visualisasi peta 3D menggunakan Mapbox GL JS dengan berbagai style peta
- **Pemetaan Teritorial**: Analisis data teritorial komprehensif termasuk:
  - Data Geospasial Dasar
  - Data Sumber Daya Alam
  - Data Sosial Demografis
  - Data Ancaman Keamanan
  - Data Infrastruktur Kritis
  - Data Cuaca dan Alam
  - Data Intelijen
- **Points of Interest (POI)**: Menampilkan berbagai lokasi penting seperti:
  - Fasilitas umum (rumah sakit, sekolah, masjid)
  - Fasilitas komersial (mall, restoran, bank)
  - Fasilitas keamanan (kantor polisi, pangkalan militer)
  - Transportasi dan infrastruktur
- **Visualisasi Bangunan 3D**: Tampilan bangunan dengan ketinggian yang realistis
- **Kontrol Peta Lanjutan**: Zoom, rotasi, dan berbagai kontrol navigasi
- **Sistem Autentikasi**: Login dan manajemen sesi pengguna
- **Mode Offline**: Dukungan untuk operasi offline dengan caching data
- **Responsive Design**: Antarmuka yang responsif untuk berbagai ukuran layar

## 🛠️ Teknologi yang Digunakan

- **Framework**: Next.js 15.2.4 dengan React 19
- **Styling**: Tailwind CSS dengan Tailwind Animate
- **UI Components**: Radix UI primitives
- **Peta**: Mapbox GL JS
- **Form Handling**: React Hook Form dengan Zod validation
- **State Management**: React Context API
- **Icons**: Lucide React dan Heroicons
- **Notifications**: Sonner
- **Theme**: Next Themes untuk dark/light mode
- **TypeScript**: Full TypeScript support

## 📋 Prasyarat

Sebelum menjalankan aplikasi, pastikan Anda memiliki:

- Node.js (versi 18 atau lebih baru)
- npm, yarn, atau pnpm
- Akun Mapbox untuk mendapatkan access token
- API key untuk layanan cuaca (Weather API)

## 🔧 Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd hologuard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

3. **Setup environment variables**
   
   Buat file `.env.local` di root directory dan tambahkan:
   ```env
   MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   WEATHER_API_KEY=your_weather_api_key_here
   ```

   **Cara mendapatkan API Keys:**
   - **Mapbox Token**: Daftar di [Mapbox](https://www.mapbox.com/) dan buat access token
   - **Weather API Key**: Daftar di layanan cuaca seperti [WeatherAPI](https://www.weatherapi.com/)

4. **Jalankan development server**
   ```bash
   npm run dev
   # atau
   yarn dev
   # atau
   pnpm dev
   ```

5. **Buka aplikasi**
   
   Akses aplikasi di [http://localhost:3000](http://localhost:3000)

## 📁 Struktur Project

```
hologuard/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── geocode/             # Geocoding API
│   │   ├── mapbox-token/        # Mapbox token API
│   │   ├── territory-data/      # Territory data API
│   │   └── weather/             # Weather API
│   ├── login/                   # Login page
│   ├── territory-mapping/       # Territory mapping page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── map-wrapper.tsx          # Map wrapper component
├── components/                   # React components
│   ├── ui/                      # UI components (Radix UI)
│   ├── Drawer.tsx               # Drawer component
│   ├── InfoPanel.tsx            # Information panel
│   ├── Map3D.tsx                # 3D Map component
│   └── Navbar.tsx               # Navigation bar
├── context/                     # React contexts
│   ├── AuthContext.tsx          # Authentication context
│   └── MapContext.tsx           # Map state context
├── hooks/                       # Custom hooks
├── lib/                         # Utility libraries
│   ├── env.ts                   # Environment validation
│   └── utils.ts                 # Utility functions
├── public/                      # Static assets
└── styles/                      # Global styles
```

## 🎮 Cara Penggunaan

### Login
1. Akses halaman login di `/login`
2. Masukkan email dan password (sistem menggunakan mock authentication)
3. Setelah login berhasil, Anda akan diarahkan ke halaman utama

### Navigasi Peta
- **Zoom**: Gunakan mouse wheel atau tombol zoom di panel kontrol
- **Pan**: Klik dan drag untuk menggeser peta
- **Rotate**: Tahan Ctrl + klik dan drag untuk merotasi peta
- **3D Tilt**: Tahan Shift + klik dan drag untuk mengubah sudut pandang

### Fitur Peta
- **Style Peta**: Pilih dari berbagai style (Dark, Satellite, Outdoors, Light, Streets)
- **Layer Control**: Toggle tampilan bangunan 3D, jalan, dan POI
- **Territory Mapping**: Klik pada lokasi untuk mendapatkan analisis teritorial
- **Weather Info**: Lihat informasi cuaca real-time

### Panel Informasi
- Panel informasi di kiri bawah menampilkan kontrol peta dan layer
- Data teritorial akan ditampilkan setelah melakukan analisis lokasi
- Gunakan tombol minimize/maximize untuk mengatur tampilan panel

## 🔧 Scripts yang Tersedia

- `npm run dev` - Menjalankan development server
- `npm run build` - Build aplikasi untuk production
- `npm run start` - Menjalankan production server
- `npm run lint` - Menjalankan ESLint untuk code quality

## 🌐 API Endpoints

Aplikasi ini menyediakan beberapa API endpoints:

- `/api/mapbox-token` - Mendapatkan Mapbox access token
- `/api/weather` - Mendapatkan data cuaca
- `/api/geocode` - Layanan geocoding
- `/api/territory-data` - Analisis data teritorial

## 🔒 Keamanan

- Environment variables untuk API keys
- Client-side authentication dengan localStorage
- Validasi environment variables saat startup
- Rate limiting untuk API calls

## 🚀 Deployment

### Vercel (Recommended)
1. Push code ke GitHub repository
2. Connect repository ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy otomatis akan berjalan

### Manual Deployment
1. Build aplikasi: `npm run build`
2. Upload folder `.next`, `public`, dan file konfigurasi ke server
3. Set environment variables di server
4. Jalankan: `npm start`

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 License

Project ini menggunakan lisensi yang sesuai dengan kebijakan organisasi.

## 🆘 Troubleshooting

### Masalah Umum

**Peta tidak muncul:**
- Pastikan `MAPBOX_ACCESS_TOKEN` sudah diset dengan benar
- Cek console browser untuk error messages
- Pastikan token Mapbox masih valid

**Data cuaca tidak muncul:**
- Pastikan `WEATHER_API_KEY` sudah diset
- Cek quota API key weather service

**Build error:**
- Jalankan `npm install` untuk memastikan semua dependencies terinstall
- Cek versi Node.js (minimal v18)

### Performance Tips

- Gunakan production build untuk performa optimal
- Enable caching untuk data teritorial
- Gunakan CDN untuk static assets

## 📞 Support

Untuk pertanyaan atau bantuan, silakan hubungi tim development atau buat issue di repository ini.

---

**Hologuard Nusantara** - Sistem Pemetaan Teritorial 3D untuk Keamanan dan Intelijen