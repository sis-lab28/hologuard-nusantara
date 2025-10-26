"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Database,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react"

interface TerritoryData {
  dataGeospasialDasar?: any
  dataSumberDayaAlam?: any
  dataSosialDemografis?: any
  dataAncamanKeamanan?: any
  dataInfrastrukturKritis?: any
  dataCuacaDanAlam?: any
  dataIntelijen?: any
  rawContent?: string
  error?: string
  structuredData?: boolean
  rateLimitExceeded?: boolean
  [key: string]: any
}

// Global in-memory cache to prevent multiple API calls
const apiCallTracker = new Map<string, boolean>()

export default function TerritoryMappingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState<string>("")
  const [territoryData, setTerritoryData] = useState<TerritoryData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState<boolean>(false)
  const [retryCount, setRetryCount] = useState<number>(0)
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null)
  const [autoRetrying, setAutoRetrying] = useState<boolean>(false)
  const [waitingTime, setWaitingTime] = useState<number>(0)
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false)
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false)
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number>(60) // Default 60 seconds
  const apiCallInProgress = useRef<boolean>(false)
  const initialFetchDone = useRef<boolean>(false)

  // Extract search params only once on mount
  useEffect(() => {
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const name = searchParams.get("name")

    if (lat && lng) {
      setCoordinates({
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lng),
      })
    }

    if (name) {
      setLocationName(decodeURIComponent(name))
    } else if (lat && lng) {
      // If no name is provided, use the coordinates as the location name
      setLocationName(`${lat}, ${lng}`)
    }
  }, [searchParams])

  // Function to generate default data based on location name
  const getDefaultData = useCallback(
    (location: string): TerritoryData => {
      // Special case for Habbema Kamp
      if (location.includes("Habbema") || location.includes("habbema")) {
        return {
          dataGeospasialDasar: {
            lokasi: "Habbema Kamp, Papua, Indonesia",
            koordinat: coordinates
              ? {
                  latitude: coordinates.lat,
                  longitude: coordinates.lng,
                }
              : {
                  latitude: -4.235869,
                  longitude: 138.46835,
                },
            luas_wilayah: "Estimasi: 15-20 km²",
            batas_wilayah: {
              utara: "Pegunungan Jayawijaya",
              selatan: "Lembah Baliem",
              barat: "Danau Habbema",
              timur: "Hutan Pegunungan",
            },
          },
          dataSumberDayaAlam: {
            hutan: "Hutan pegunungan tropis",
            pertanian: "Pertanian subsisten, umbi-umbian",
            tambang: "Tidak ada aktivitas pertambangan signifikan",
            sungai: "Beberapa sungai kecil dan danau Habbema",
          },
          dataSosialDemografis: {
            jumlah_penduduk: "Estimasi: 5,000-10,000",
            kepadatan_penduduk: "Rendah, <50 jiwa/km²",
            suku: "Dani, Lani, Yali",
            agama: "Kepercayaan lokal, Kristen",
            bahasa: "Bahasa Dani, bahasa Indonesia",
          },
          dataAncamanKeamanan: {
            kejahatan: "Tingkat rendah",
            konflik: "Konflik antar suku (sporadis)",
            terorisme: "Tidak ada indikasi aktif",
            bencana_alam: "Longsor, banjir bandang (risiko sedang)",
          },
          dataInfrastrukturKritis: {
            transportasi: "Jalan setapak, lapangan terbang kecil",
            energi: "Terbatas, generator lokal",
            komunikasi: "Terbatas, beberapa menara BTS",
            kesehatan: "Pusat kesehatan dasar",
            pendidikan: "Sekolah dasar",
          },
          dataCuacaDanAlam: {
            iklim: "Pegunungan tropis",
            curah_hujan: "Tinggi, 3000-4000 mm/tahun",
            musim: "Hujan (Oktober-April), Kering (Mei-September)",
            suhu_rata_rata: "10-20°C",
          },
          dataIntelijen: {
            aktivitas_militer: "Pos TNI di beberapa titik strategis",
            aktivitas_polisi: "Pos polisi di pusat pemukiman",
            informasi_terkini: "Situasi relatif stabil",
            rekomendasi: "Tingkatkan patroli di area perbatasan",
          },
        }
      }

      // Special case for Jakarta
      if (location.toLowerCase().includes("jakarta")) {
        return {
          dataGeospasialDasar: {
            lokasi: "Jakarta, Indonesia",
            koordinat: {
              latitude: -6.2088,
              longitude: 106.8456,
            },
            luas_wilayah: "661.5 km²",
            batas_wilayah: {
              utara: "Laut Jawa",
              selatan: "Kota Depok",
              barat: "Kota Tangerang",
              timur: "Kota Bekasi",
            },
          },
          dataSumberDayaAlam: {
            hutan: "Taman Nasional Kepulauan Seribu",
            pertanian: "Lahan pertanian terbatas di pinggiran kota",
            tambang: "Tidak ada aktivitas pertambangan signifikan",
            sungai: "Sungai Ciliwung, Sungai Pesanggrahan, Sungai Angke",
          },
          dataSosialDemografis: {
            jumlah_penduduk: "10.5 juta (kota), 30+ juta (metropolitan)",
            kepadatan_penduduk: "15,900 jiwa/km²",
            suku: "Jawa, Betawi, Sunda, Tionghoa, dan berbagai suku lainnya",
            agama: "Islam (85%), Kristen (10%), Buddha, Hindu, Konghucu",
            bahasa: "Indonesia, Betawi, Jawa, Sunda, Inggris",
          },
          dataAncamanKeamanan: {
            kejahatan: "Pencurian, perampokan, penipuan (tingkat sedang-tinggi)",
            konflik: "Demonstrasi politik sesekali",
            terorisme: "Risiko rendah, pengawasan ketat",
            bencana_alam: "Banjir tahunan, penurunan tanah",
          },
          dataInfrastrukturKritis: {
            transportasi: "Bandara Soekarno-Hatta, MRT, LRT, TransJakarta, KRL",
            energi: "PLTU Muara Karang, jaringan listrik PLN",
            komunikasi: "Jaringan 4G/5G, fiber optik, pusat data",
            kesehatan: "RSUPN Dr. Cipto Mangunkusumo, RS Fatmawati, dan lainnya",
            pendidikan: "Universitas Indonesia, UNJ, Trisakti, dan lainnya",
          },
          dataCuacaDanAlam: {
            iklim: "Tropis lembab",
            curah_hujan: "1,500-2,500 mm/tahun",
            musim: "Hujan (November-April), Kemarau (Mei-Oktober)",
            suhu_rata_rata: "26-32°C",
          },
          dataIntelijen: {
            aktivitas_militer: "Markas TNI, patroli rutin",
            aktivitas_polisi: "Polda Metro Jaya, Polres di setiap kota administratif",
            informasi_terkini: "Pengamanan ibu kota, persiapan pemindahan ibu kota",
            rekomendasi: "Tingkatkan pengawasan area vital dan pusat keramaian",
          },
        }
      }

      // Default data for other locations
      return {
        dataGeospasialDasar: {
          lokasi: location,
          koordinat: coordinates
            ? {
                latitude: coordinates.lat,
                longitude: coordinates.lng,
              }
            : {
                latitude: "Unknown",
                longitude: "Unknown",
              },
          luas_wilayah: "Estimasi: 40-60 km²",
          batas_wilayah: {
            utara: "Data tidak tersedia",
            selatan: "Data tidak tersedia",
            barat: "Data tidak tersedia",
            timur: "Data tidak tersedia",
          },
        },
        dataSumberDayaAlam: {
          hutan: "Data tidak tersedia",
          pertanian: "Padi, sayuran, dan tanaman pangan lainnya",
          tambang: "Data tidak tersedia",
          sungai: "Beberapa sungai kecil dan sedang",
        },
        dataSosialDemografis: {
          jumlah_penduduk: "Estimasi: 100,000-300,000",
          kepadatan_penduduk: "Estimasi: 1,000-2,000 jiwa/km²",
          suku: "Beragam",
          agama: "Islam, Kristen, Hindu, Buddha",
          bahasa: "Indonesia, bahasa daerah",
        },
        dataAncamanKeamanan: {
          kejahatan: "Pencurian, perampokan (tingkat rendah-sedang)",
          konflik: "Tidak ada konflik besar yang tercatat",
          terorisme: "Tidak ada indikasi aktif",
          bencana_alam: "Banjir, tanah longsor (risiko sedang)",
        },
        dataInfrastrukturKritis: {
          transportasi: "Jalan raya, jembatan",
          energi: "Jaringan listrik PLN",
          komunikasi: "Menara BTS, jaringan fiber optik",
          kesehatan: "Rumah sakit, puskesmas",
          pendidikan: "Sekolah dasar, menengah, tinggi",
        },
        dataCuacaDanAlam: {
          iklim: "Tropis",
          curah_hujan: "Estimasi: 2000-3000 mm/tahun",
          musim: "Hujan (Oktober-Maret), Kemarau (April-September)",
          suhu_rata_rata: "23-30°C",
        },
        dataIntelijen: {
          aktivitas_militer: "Patroli rutin TNI",
          aktivitas_polisi: "Pos polisi di pusat kota",
          informasi_terkini: "Tidak ada informasi khusus",
          rekomendasi: "Tingkatkan patroli di area rawan bencana",
        },
      }
    },
    [coordinates],
  )

  // Function to fetch territory data with retry logic
  const fetchTerritoryData = useCallback(
    async (isRetry = false) => {
      if (!locationName) return

      // Create a cache key for this location
      const cacheKey = `territory-data-${locationName.toLowerCase().trim()}`

      // Check if we're already fetching this location
      if (apiCallInProgress.current) {
        console.log("API call already in progress, skipping duplicate request")
        return
      }

      // Check if we've already fetched this location in this session
      if (apiCallTracker.get(cacheKey)) {
        console.log(`Already fetched data for ${locationName} in this session, using cached data`)
        const cachedData = localStorage.getItem(cacheKey)
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            setTerritoryData(parsedData.data)
            setIsLoading(false)
            return
          } catch (e) {
            console.error("Error parsing cached data:", e)
            // Continue with normal flow if parsing fails
          }
        }
      }

      // Check if we should use cached data from localStorage
      const cachedData = localStorage.getItem(cacheKey)
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData)
          // Check if cache is still valid (less than 24 hours old)
          if (Date.now() - parsedCache.timestamp < 24 * 60 * 60 * 1000) {
            console.log(`Using cached territory data for ${locationName}`)
            setTerritoryData(parsedCache.data)
            setIsLoading(false)
            setAutoRetrying(false)
            return
          } else {
            console.log(`Cached data for ${locationName} is expired, fetching fresh data`)
          }
        } catch (e) {
          console.error("Error parsing cached territory data:", e)
          // If there's an error parsing the cached data, continue with the normal flow
        }
      }

      // If rate limited, don't retry immediately
      if (isRateLimited && !isRetry) {
        setError(`API rate limit exceeded. Please try again in ${rateLimitResetTime} seconds.`)
        setTerritoryData(getDefaultData(locationName))
        return
      }

      if (isRetry) {
        setAutoRetrying(true)
      } else {
        setIsLoading(true)
        setAutoRetrying(false)
        setRetryCount(0)
        setIsRateLimited(false)
        // Clear any existing retry timeout
        if (retryTimeout) {
          clearTimeout(retryTimeout)
          setRetryTimeout(null)
        }
      }

      setError(null)

      // If in offline mode, use default data
      if (isOfflineMode) {
        console.log("Operating in offline mode, using default data")
        const defaultData = getDefaultData(locationName)
        setTerritoryData(defaultData)
        setIsLoading(false)
        setAutoRetrying(false)
        return
      }

      // Set flag to indicate API call is in progress
      apiCallInProgress.current = true

      try {
        console.log(
          `Fetching territory data for: ${locationName}${isRetry ? ` (retry attempt ${retryCount + 1})` : ""}`,
        )

        // Set up a timeout for the fetch operation
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch("/api/territory-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location: locationName }),
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId)
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch territory data: ${response.status}`)
        }

        const data = await response.json()

        // Mark this location as fetched in this session
        apiCallTracker.set(cacheKey, true)

        // Check for rate limit flag
        if (data.rateLimitExceeded) {
          console.log("Rate limit exceeded, using default data")
          setIsRateLimited(true)
          setRateLimitResetTime(60) // Default 60 seconds

          // Start a countdown for rate limit reset
          const countdownInterval = setInterval(() => {
            setRateLimitResetTime((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                setIsRateLimited(false)
                return 0
              }
              return prev - 1
            })
          }, 1000)

          setError(data.error || "Rate limit exceeded. Using default data. Please try again later.")
          const defaultData = getDefaultData(locationName)
          setTerritoryData(defaultData)

          // Cache the default data to prevent further API calls
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: defaultData,
              timestamp: Date.now(),
            }),
          )

          setIsLoading(false)
          setAutoRetrying(false)
          apiCallInProgress.current = false
          return
        }

        if (data.error) {
          setError(data.error)
          if (data.rawContent) {
            setTerritoryData({
              rawContent: data.rawContent,
              structuredData: false,
            })
            setShowRawData(true)
          } else {
            // If no raw content, set default placeholder data
            const defaultData = getDefaultData(locationName)
            setTerritoryData(defaultData)

            // Cache the default data
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: defaultData,
                timestamp: Date.now(),
              }),
            )
          }

          // If this was an auto-retry, schedule another one with exponential backoff
          if (isRetry && retryCount < 3) {
            const nextRetryTime = Math.min(2000 * Math.pow(2, retryCount), 30000) // Max 30 seconds
            console.log(`Scheduling retry in ${nextRetryTime / 1000} seconds`)

            // Set up countdown timer
            setWaitingTime(Math.floor(nextRetryTime / 1000))
            const countdownInterval = setInterval(() => {
              setWaitingTime((prev) => {
                if (prev <= 1) {
                  clearInterval(countdownInterval)
                  return 0
                }
                return prev - 1
              })
            }, 1000)

            const timeout = setTimeout(() => {
              clearInterval(countdownInterval)
              setRetryCount((prev) => prev + 1)
              apiCallInProgress.current = false
              fetchTerritoryData(true)
            }, nextRetryTime)

            setRetryTimeout(timeout)
          } else {
            setAutoRetrying(false)
            apiCallInProgress.current = false
          }

          return
        }

        // Check if we received empty data and use defaults if needed
        const hasData = Object.values(data).some(
          (value) => value && typeof value === "object" && Object.keys(value).length > 0,
        )

        if (!hasData) {
          console.log("Received empty data, using defaults")
          const defaultData = getDefaultData(locationName)
          setTerritoryData(defaultData)

          // Cache the default data
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: defaultData,
              timestamp: Date.now(),
            }),
          )
        } else {
          setTerritoryData(data)

          // Cache the successful response
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: data,
              timestamp: Date.now(),
            }),
          )

          setAutoRetrying(false)
          // Clear any retry timeout since we got data successfully
          if (retryTimeout) {
            clearTimeout(retryTimeout)
            setRetryTimeout(null)
          }
        }

        console.log("Territory data received:", data)
      } catch (err) {
        console.error("Error fetching territory data:", err)

        // Check if it's a rate limit error
        const errorMessage = err instanceof Error ? err.message : String(err)
        const isRateLimitError =
          errorMessage.includes("rate limit") ||
          errorMessage.includes("429") ||
          errorMessage.includes("too many requests")

        if (isRateLimitError) {
          console.log("Rate limit error detected")
          setIsRateLimited(true)
          setRateLimitResetTime(60) // Default 60 seconds

          // Start a countdown for rate limit reset
          const countdownInterval = setInterval(() => {
            setRateLimitResetTime((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                setIsRateLimited(false)
                return 0
              }
              return prev - 1
            })
          }, 1000)

          setError("Rate limit exceeded. Using default data. Please try again later.")
          const defaultData = getDefaultData(locationName)
          setTerritoryData(defaultData)

          // Cache the default data
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: defaultData,
              timestamp: Date.now(),
            }),
          )

          setIsLoading(false)
          setAutoRetrying(false)
          apiCallInProgress.current = false
          return
        }

        // Check if it's a network error
        const isNetworkError =
          err instanceof Error &&
          (err.message.includes("Failed to fetch") ||
            err.message.includes("NetworkError") ||
            err.message.includes("Network request failed") ||
            err.name === "AbortError")

        if (isNetworkError) {
          setError("Network error: Unable to connect to the server. Using offline data.")
          // Suggest switching to offline mode
          if (!isOfflineMode) {
            // Set offline mode after multiple network failures
            if (retryCount >= 2) {
              setIsOfflineMode(true)
            }
          }
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch territory data")
        }

        // Set default data on error
        const defaultData = getDefaultData(locationName)
        setTerritoryData(defaultData)

        // Cache the default data
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: defaultData,
            timestamp: Date.now(),
          }),
        )

        // If this was an auto-retry, schedule another one with exponential backoff
        if (isRetry && retryCount < 3) {
          const nextRetryTime = Math.min(2000 * Math.pow(2, retryCount), 30000) // Max 30 seconds
          console.log(`Scheduling retry in ${nextRetryTime / 1000} seconds`)

          // Set up countdown timer
          setWaitingTime(Math.floor(nextRetryTime / 1000))
          const countdownInterval = setInterval(() => {
            setWaitingTime((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                return 0
              }
              return prev - 1
            })
          }, 1000)

          const timeout = setTimeout(() => {
            clearInterval(countdownInterval)
            setRetryCount((prev) => prev + 1)
            apiCallInProgress.current = false
            fetchTerritoryData(true)
          }, nextRetryTime)

          setRetryTimeout(timeout)
        } else {
          setAutoRetrying(false)
          apiCallInProgress.current = false
        }
      } finally {
        if (!isRetry) {
          setIsLoading(false)
          apiCallInProgress.current = false
        }
      }
    },
    [locationName, retryCount, retryTimeout, getDefaultData, isOfflineMode, isRateLimited, rateLimitResetTime],
  )

  // Initial data fetch - with protection against infinite loops
  useEffect(() => {
    if (locationName && !initialFetchDone.current) {
      initialFetchDone.current = true
      fetchTerritoryData()
    }

    // Cleanup function to clear any pending timeouts and cache flags
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      apiCallInProgress.current = false
    }
  }, [locationName, fetchTerritoryData])

  // Helper function to render data sections
  const renderDataSection = (title: string, data: any) => {
    if (!data || Object.keys(data).length === 0) {
      // If no data, show placeholder
      return (
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-green-400">{title}</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <Database className="h-6 w-6 text-gray-500 mb-2" />
            <p className="text-gray-400 text-sm">Data tidak tersedia</p>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3 text-green-400">{title}</h3>
        {Object.entries(data || {}).map(([key, value]) => (
          <div key={key} className="mb-2">
            <span className="font-medium text-gray-200">{key}:</span>{" "}
            <span className="text-gray-300">
              {typeof value === "object" && value !== null ? (
                <div className="pl-4 mt-1 border-l-2 border-gray-600">
                  {Object.entries(value || {}).map(([subKey, subValue]) => (
                    <div key={subKey} className="mb-1">
                      <span className="font-medium text-gray-300">{subKey}:</span>{" "}
                      <span className="text-gray-400">{String(subValue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                String(value)
              )}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Function to handle manual retry
  const handleRetry = () => {
    // Don't retry if rate limited
    if (isRateLimited) {
      return
    }

    // Cancel any ongoing auto-retry
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      setRetryTimeout(null)
    }
    setAutoRetrying(false)
    setRetryCount(0)
    apiCallInProgress.current = false
    initialFetchDone.current = false

    // Clear the cache for this location to force a fresh fetch
    if (locationName) {
      const cacheKey = `territory-data-${locationName.toLowerCase().trim()}`
      apiCallTracker.delete(cacheKey)
      localStorage.removeItem(cacheKey)
    }

    fetchTerritoryData()
  }

  // Function to cancel auto-retry
  const cancelAutoRetry = () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      setRetryTimeout(null)
    }
    setAutoRetrying(false)
    apiCallInProgress.current = false
  }

  // Toggle offline mode
  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode)
    if (!isOfflineMode) {
      // If switching to offline mode, load default data
      setTerritoryData(getDefaultData(locationName))
      // Cancel any ongoing retries
      if (retryTimeout) {
        clearTimeout(retryTimeout)
        setRetryTimeout(null)
      }
      setAutoRetrying(false)
      apiCallInProgress.current = false
    }
  }

  // Function to manually parse the sample data provided by the user
  const parseManualData = () => {
    try {
      // Cancel any ongoing auto-retry
      if (retryTimeout) {
        clearTimeout(retryTimeout)
        setRetryTimeout(null)
      }
      setAutoRetrying(false)
      apiCallInProgress.current = false

      // This is the sample data provided by the user
      const sampleContent = `Berikut adalah contoh JSON yang berisi data geospasial dasar, sumber daya alam, sosial-demografis, ancaman keamanan, infrastruktur kritis, cuaca dan alam, serta intelijen taktis tentang operasi di Banjar:

\`\`\`json
{
  "data_geospasial_dasar": {
    "lokasi": "Banjar, Jawa Barat, Indonesia",
    "koordinat": {
      "latitude": -7.3697,
      "longitude": 108.5336
    },
    "luas_wilayah": "166.37 km²",
    "batas_wilayah": {
      "utara": "Kabupaten Ciamis",
      "selatan": "Kabupaten Cilacap",
      "barat": "Kabupaten Cilacap",
      "timur": "Kabupaten Ciamis"
    }
  },
  "data_sumber_daya_alam": {
    "hutan": "Hutan lindung dan hutan produksi",
    "pertanian": "Padi, jagung, dan sayuran",
    "tambang": "Batu kapur dan pasir",
    "sungai": "Sungai Citanduy"
  },
  "data_sosial_demografis": {
    "jumlah_penduduk": 180000,
    "kepadatan_penduduk": "1082 jiwa/km²",
    "suku": "Sunda, Jawa",  {
    "jumlah_penduduk": 180000,
    "kepadatan_penduduk": "1082 jiwa/km²",
    "suku": "Sunda, Jawa",
    "agama": "Islam, Kristen, Hindu",
    "bahasa": "Sunda, Indonesia"
  },
  "data_ancaman_keamanan": {
    "kejahatan": "Pencurian, perampokan",
    "konflik": "Konflik lahan",
    "terorisme": "Tidak ada indikasi aktif",
    "bencana_alam": "Banjir, tanah longsor"
  },
  "data_infrastruktur_kritis": {
    "transportasi": "Jalan raya, jembatan",
    "energi": "Pembangkit listrik tenaga air",
    "komunikasi": "Menara BTS, jaringan fiber optik",
    "kesehatan": "Rumah sakit, puskesmas",
    "pendidikan": "Sekolah dasar, menengah, tinggi"
  },
  "data_cuaca_dan_alam": {
    "iklim": "Tropis basah",
    "curah_hujan": "2000-3000 mm/tahun",
    "musim": "Hujan (Oktober-Maret), Kemarau (April-September)",
    "suhu_rata_rata": "23-30°C"
  },
  "data_intelijen_taktis": {
    "aktivitas_militer": "Patroli rutin TNI",
    "aktivitas_polisi": "Pos polisi di pusat kota",
    "informasi_terkini": "Peningkatan keamanan selama musim liburan",
    "rekomendasi": "Meningkatkan patroli di wilayah rawan banjir dan tanah longsor"
  }
}
\`\`\``

      // Extract the JSON part
      const jsonMatch = sampleContent.match(/```json\s*([\s\S]*?)\s*```/)

      if (jsonMatch && jsonMatch[1]) {
        const parsedData = JSON.parse(jsonMatch[1])

        // Convert to our expected format with null checks
        const formattedData = {
          dataGeospasialDasar: parsedData.data_geospasial_dasar || {},
          dataSumberDayaAlam: parsedData.data_sumber_daya_alam || {},
          dataSosialDemografis: parsedData.data_sosial_demografis || {},
          dataAncamanKeamanan: parsedData.data_ancaman_keamanan || {},
          dataInfrastrukturKritis: parsedData.data_infrastruktur_kritis || {},
          dataCuacaDanAlam: parsedData.data_cuaca_dan_alam || {},
          dataIntelijen: parsedData.data_intelijen_taktis || {},
        }

        setTerritoryData(formattedData)
        setShowRawData(false)
        setError(null)
        setIsRateLimited(false)
      } else {
        throw new Error("Could not extract JSON from the sample content")
      }
    } catch (err) {
      console.error("Error parsing manual data:", err)
      setError(err instanceof Error ? err.message : "Failed to parse manual data")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center text-green-500 hover:text-green-400 mb-6">
          <ArrowLeft className="mr-2" size={20} />
          Back to Map
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-500">Territory Mapping</h1>

          <div className="flex space-x-2">
            {/* Offline mode toggle */}
            <button
              onClick={toggleOfflineMode}
              className={`px-3 py-2 rounded text-sm flex items-center ${
                isOfflineMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-600 hover:bg-gray-700"
              }`}
              title={isOfflineMode ? "Switch to Online Mode" : "Switch to Offline Mode"}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff size={16} className="mr-1" />
                  Offline Mode
                </>
              ) : (
                <>
                  <Wifi size={16} className="mr-1" />
                  Online Mode
                </>
              )}
            </button>

            {/* Sample data button */}
            <button
              onClick={parseManualData}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center"
              title="Load Sample Data"
            >
              <FileText size={16} className="mr-1" />
              Load Sample Data
            </button>
          </div>
        </div>

        {coordinates ? (
          <div className="bg-gray-800 p-6 rounded-lg border border-green-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {locationName || "Selected Location"}
                <span className="text-sm font-normal ml-2 text-gray-400">
                  ({coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)})
                </span>
              </h2>

              {!isLoading && (
                <div className="flex space-x-2">
                  {territoryData && territoryData.rawContent && (
                    <button
                      onClick={() => setShowRawData(!showRawData)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center"
                    >
                      {showRawData ? "Show Structured Data" : "Show Raw Data"}
                    </button>
                  )}
                  <button
                    onClick={handleRetry}
                    className={`px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center ${
                      isRateLimited || isOfflineMode || apiCallInProgress.current ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title="Refresh Data"
                    disabled={isLoading || isOfflineMode || isRateLimited || apiCallInProgress.current}
                  >
                    <RefreshCw
                      size={16}
                      className={`mr-1 ${isLoading || apiCallInProgress.current ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>
              )}
            </div>

            {/* API call in progress notification */}
            {apiCallInProgress.current && (
              <div className="bg-blue-900/30 border border-blue-800 p-3 rounded-lg mb-4 flex items-center">
                <Loader2 className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
                <div>
                  <p className="text-blue-300 text-sm">API request in progress. Please wait...</p>
                </div>
              </div>
            )}

            {/* Rate limit notification */}
            {isRateLimited && (
              <div className="bg-orange-900/30 border border-orange-800 p-3 rounded-lg mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                  <div>
                    <p className="text-orange-300 text-sm">
                      API rate limit exceeded. Please wait {rateLimitResetTime} seconds before trying again.
                    </p>
                    <p className="text-orange-400/70 text-xs mt-1">
                      Using default data. You can also use sample data or offline mode.
                    </p>
                  </div>
                </div>
                <button
                  onClick={parseManualData}
                  className="px-2 py-1 bg-orange-800 hover:bg-orange-700 rounded text-xs"
                >
                  Use Sample
                </button>
              </div>
            )}

            {/* Offline mode notification */}
            {isOfflineMode && (
              <div className="bg-yellow-900/30 border border-yellow-800 p-3 rounded-lg mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <WifiOff className="h-5 w-5 text-yellow-500 mr-2" />
                  <div>
                    <p className="text-yellow-300 text-sm">Operating in offline mode. Using locally generated data.</p>
                    <p className="text-yellow-400/70 text-xs mt-1">
                      Switch to online mode to fetch real-time data when available.
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleOfflineMode}
                  className="px-2 py-1 bg-yellow-800 hover:bg-yellow-700 rounded text-xs"
                >
                  Go Online
                </button>
              </div>
            )}

            {/* Auto-retry notification */}
            {autoRetrying && !isOfflineMode && !isRateLimited && (
              <div className="bg-yellow-900/30 border border-yellow-800 p-3 rounded-lg mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                  <div>
                    <p className="text-yellow-300 text-sm">
                      Waiting for API response... Retrying in {waitingTime} seconds
                    </p>
                    <p className="text-yellow-400/70 text-xs mt-1">Attempt {retryCount + 1} of 4</p>
                  </div>
                </div>
                <button
                  onClick={cancelAutoRetry}
                  className="px-2 py-1 bg-yellow-800 hover:bg-yellow-700 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-4" />
                <p className="text-gray-300">Fetching territory intelligence data...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a moment as we analyze the area</p>
              </div>
            ) : error ? (
              <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-400">Error fetching territory data</h3>
                    <p className="text-red-200 mt-1">{error}</p>
                    <div className="flex space-x-2 mt-3">
                      {!isOfflineMode && !isRateLimited && !apiCallInProgress.current && (
                        <button
                          onClick={handleRetry}
                          className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-white text-sm flex items-center"
                        >
                          <RefreshCw size={14} className="mr-1" />
                          Retry
                        </button>
                      )}
                      <button
                        onClick={toggleOfflineMode}
                        className="px-3 py-1 bg-yellow-800 hover:bg-yellow-700 rounded text-white text-sm flex items-center"
                      >
                        {isOfflineMode ? (
                          <>
                            <Wifi size={14} className="mr-1" />
                            Go Online
                          </>
                        ) : (
                          <>
                            <WifiOff size={14} className="mr-1" />
                            Use Offline Mode
                          </>
                        )}
                      </button>
                      <button
                        onClick={parseManualData}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm flex items-center"
                      >
                        <FileText size={14} className="mr-1" />
                        Use Sample Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : territoryData ? (
              <>
                {showRawData && territoryData.rawContent ? (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 text-green-400">Raw Response Data</h3>
                    <div className="bg-gray-800 p-4 rounded whitespace-pre-wrap font-mono text-sm text-gray-300 max-h-[600px] overflow-y-auto">
                      {territoryData.rawContent}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderDataSection("Data Geospasial Dasar", territoryData.dataGeospasialDasar)}
                      {renderDataSection("Data Sumber Daya Alam", territoryData.dataSumberDayaAlam)}
                      {renderDataSection("Data Sosial-Demografis", territoryData.dataSosialDemografis)}
                      {renderDataSection("Data Ancaman Keamanan", territoryData.dataAncamanKeamanan)}
                      {renderDataSection("Data Infrastruktur Kritis", territoryData.dataInfrastrukturKritis)}
                      {renderDataSection("Data Cuaca dan Alam", territoryData.dataCuacaDanAlam)}
                    </div>

                    {territoryData && territoryData.dataIntelijen && (
                      <div className="mt-8 p-4 bg-gray-700 rounded-lg border border-yellow-600">
                        <h3 className="text-lg font-medium mb-2 text-yellow-500">Data Intelijen Taktis</h3>
                        {Object.entries(territoryData.dataIntelijen || {}).map(([key, value]) => (
                          <div key={key} className="text-gray-300 mb-2">
                            <span className="font-medium">{key}:</span>{" "}
                            {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3 text-green-400">Terrain Analysis</h3>
                  <p className="text-gray-300 mb-2">Elevation: 45m above sea level</p>
                  <p className="text-gray-300 mb-2">Terrain Type: Urban</p>
                  <p className="text-gray-300">Vegetation: Minimal</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3 text-green-400">Security Assessment</h3>
                  <p className="text-gray-300 mb-2">Risk Level: Medium</p>
                  <p className="text-gray-300 mb-2">Patrol Frequency: Every 2 hours</p>
                  <p className="text-gray-300">Sensor Coverage: 85%</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3 text-green-400">Infrastructure</h3>
                  <p className="text-gray-300 mb-2">Power Grid: Operational</p>
                  <p className="text-gray-300 mb-2">Water Supply: Stable</p>
                  <p className="text-gray-300">Communications: 4G/5G Coverage</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3 text-green-400">Population</h3>
                  <p className="text-gray-300 mb-2">Density: High</p>
                  <p className="text-gray-300 mb-2">Civilian Activity: Active 06:00-22:00</p>
                  <p className="text-gray-300">Key Facilities: 3 within 500m</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg border border-red-500 text-center">
            <p className="text-lg">No coordinates provided. Please return to the map and select a location.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Return to Map
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
