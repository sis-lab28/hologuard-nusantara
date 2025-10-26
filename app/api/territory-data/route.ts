import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory cache for API responses
const responseCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours - longer cache to prevent repeated calls

export async function POST(request: NextRequest) {
  try {
    // Get the location from the request body
    const { location } = await request.json()

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = `territory-data-${location.toLowerCase().trim()}`
    const cachedResponse = responseCache.get(cacheKey)

    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      console.log(`Using cached data for location: ${location}`)
      return NextResponse.json(cachedResponse.data)
    }

    // Get the API token from environment variables
    const apiToken = process.env.FIREWORK_API_TOKEN

    if (!apiToken) {
      console.error("FIREWORK_API_TOKEN is not set")
      console.log("Using default data due to missing API token")
      const defaultData = createDefaultData(location)
      cacheResponse(cacheKey, defaultData)
      return NextResponse.json(defaultData)
    }

    console.log(`Fetching territory data for location: ${location}`)

    // Prepare the request to Fireworks AI API
    const fireworksRequest = {
      model: "accounts/fireworks/models/deepseek-v3",
      max_tokens: 4096,
      top_p: 1,
      top_k: 40,
      presence_penalty: 0,
      frequency_penalty: 0,
      temperature: 0.6,
      messages: [
        {
          role: "user",
          content: `Berikan Data Geospasial Dasar, Data Sumber Daya Alam, Data Sosial-Demografis, Data Ancaman Keamanan, Data Infrastruktur Kritis, Data Cuaca dan Alam dan Data Intelijen Taktis tentang Operasi di ${location} dalam bentuk JSON. Pastikan format JSON valid dan gunakan format berikut:
{
  "data_geospasial_dasar": {
    "lokasi": "...",
    "koordinat": {
      "latitude": 0,
      "longitude": 0
    },
    "luas_wilayah": "...",
    "batas_wilayah": {
      "utara": "...",
      "selatan": "...",
      "barat": "...",
      "timur": "..."
    }
  },
  "data_sumber_daya_alam": {
    "hutan": "...",
    "pertanian": "...",
    "tambang": "...",
    "sungai": "..."
  },
  "data_sosial_demografis": {
    "jumlah_penduduk": "...",
    "kepadatan_penduduk": "...",
    "suku": "...",
    "agama": "...",
    "bahasa": "..."
  },
  "data_ancaman_keamanan": {
    "kejahatan": "...",
    "konflik": "...",
    "terorisme": "...",
    "bencana_alam": "..."
  },
  "data_infrastruktur_kritis": {
    "transportasi": "...",
    "energi": "...",
    "komunikasi": "...",
    "kesehatan": "...",
    "pendidikan": "..."
  },
  "data_cuaca_dan_alam": {
    "iklim": "...",
    "curah_hujan": "...",
    "musim": "...",
    "suhu_rata_rata": "..."
  },
  "data_intelijen_taktis": {
    "aktivitas_militer": "...",
    "aktivitas_polisi": "...",
    "informasi_terkini": "...",
    "rekomendasi": "..."
  }
}`,
        },
      ],
    }

    try {
      // Call the Fireworks AI API with a shorter timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      console.log("Attempting to call Fireworks API...")
      const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(fireworksRequest),
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Fireworks API error:", errorText)

        // Check specifically for rate limit errors
        const isRateLimitError =
          errorText.includes("rate limit") ||
          response.status === 429 ||
          (errorText.includes("error") && errorText.includes("limit"))

        if (isRateLimitError) {
          console.log("Rate limit exceeded, using cached or default data")
          // Return a specific error message for rate limiting
          const defaultData = createDefaultData(location)
          defaultData.rateLimitExceeded = true
          defaultData.error = "Rate limit exceeded. Using default data. Please try again later."

          // Still cache the default data to prevent further API calls
          cacheResponse(cacheKey, defaultData)
          return NextResponse.json(defaultData)
        }

        console.log("Using default data due to API error")
        const defaultData = createDefaultData(location)
        cacheResponse(cacheKey, defaultData)
        return NextResponse.json(defaultData)
      }

      const data = await response.json()
      console.log("Received response from Fireworks AI")

      // Extract the JSON content from the response
      let territoryData = {}
      let rawContent = ""

      try {
        // Get the content from the message
        rawContent = data.choices?.[0]?.message?.content || ""
        console.log("Raw content length:", rawContent.length)

        // Try multiple approaches to extract JSON

        // Approach 1: Extract JSON from markdown code blocks
        let jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)

        // Approach 2: Look for JSON directly in the text (if no code blocks found)
        if (!jsonMatch) {
          jsonMatch = rawContent.match(/\{[\s\S]*\}/)
        }

        // Approach 3: Try to find any JSON-like structure
        if (!jsonMatch && rawContent.includes("{") && rawContent.includes("}")) {
          const startIndex = rawContent.indexOf("{")
          const endIndex = rawContent.lastIndexOf("}") + 1
          if (startIndex < endIndex) {
            jsonMatch = [null, rawContent.substring(startIndex, endIndex)]
          }
        }

        if (jsonMatch && jsonMatch[1]) {
          console.log("Found JSON content, attempting to parse")

          // Clean the JSON string - remove any non-JSON characters
          let jsonString = jsonMatch[1].trim()

          // Try to parse the JSON
          try {
            territoryData = JSON.parse(jsonString)
            console.log("Successfully parsed JSON")

            // Convert snake_case keys to camelCase for consistency with null checks
            territoryData = {
              dataGeospasialDasar: territoryData.data_geospasial_dasar || {},
              dataSumberDayaAlam: territoryData.data_sumber_daya_alam || {},
              dataSosialDemografis: territoryData.data_sosial_demografis || {},
              dataAncamanKeamanan: territoryData.data_ancaman_keamanan || {},
              dataInfrastrukturKritis: territoryData.data_infrastruktur_kritis || {},
              dataCuacaDanAlam: territoryData.data_cuaca_dan_alam || {},
              dataIntelijen: territoryData.data_intelijen_taktis || {},
            }
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError)

            // Try to fix common JSON parsing issues
            try {
              // Replace single quotes with double quotes
              jsonString = jsonString.replace(/'/g, '"')

              // Fix trailing commas
              jsonString = jsonString.replace(/,\s*([}\]])/g, "$1")

              // Try parsing again
              territoryData = JSON.parse(jsonString)
              console.log("Successfully parsed JSON after fixing format")

              // Convert snake_case keys to camelCase
              territoryData = {
                dataGeospasialDasar: territoryData.data_geospasial_dasar || {},
                dataSumberDayaAlam: territoryData.data_sumber_daya_alam || {},
                dataSosialDemografis: territoryData.data_sosial_demografis || {},
                dataAncamanKeamanan: territoryData.data_ancaman_keamanan || {},
                dataInfrastrukturKritis: territoryData.data_infrastruktur_kritis || {},
                dataCuacaDanAlam: territoryData.data_cuaca_dan_alam || {},
                dataIntelijen: territoryData.data_intelijen_taktis || {},
              }
            } catch (fixedParseError) {
              console.error("Error parsing fixed JSON:", fixedParseError)
              console.log("Using default data due to JSON parsing error")
              const defaultData = createDefaultData(location)
              cacheResponse(cacheKey, defaultData)
              return NextResponse.json(defaultData)
            }
          }
        } else {
          console.log("No JSON block found in content, using default data")
          const defaultData = createDefaultData(location)
          cacheResponse(cacheKey, defaultData)
          return NextResponse.json(defaultData)
        }

        // Validate the data structure
        const isValidData = validateDataStructure(territoryData)

        if (!isValidData) {
          console.log("Data structure validation failed, using default data")
          const defaultData = createDefaultData(location)
          cacheResponse(cacheKey, defaultData)
          return NextResponse.json(defaultData)
        }

        // Cache the successful response
        cacheResponse(cacheKey, territoryData)
        return NextResponse.json(territoryData)
      } catch (error) {
        console.error("Error processing AI response:", error)
        console.log("Using default data due to processing error")
        const defaultData = createDefaultData(location)
        cacheResponse(cacheKey, defaultData)
        return NextResponse.json(defaultData)
      }
    } catch (fetchError) {
      console.error("Error calling Fireworks API:", fetchError)

      // Check if it's a rate limit error from the error message
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError)
      const isRateLimitError = errorMessage.includes("rate limit") || errorMessage.includes("429")

      if (isRateLimitError) {
        console.log("Rate limit exceeded, using cached or default data")
        const defaultData = createDefaultData(location)
        defaultData.rateLimitExceeded = true
        defaultData.error = "Rate limit exceeded. Using default data. Please try again later."
        cacheResponse(cacheKey, defaultData)
        return NextResponse.json(defaultData)
      }

      console.log("Using default data due to fetch error")
      const defaultData = createDefaultData(location)
      cacheResponse(cacheKey, defaultData)
      return NextResponse.json(defaultData)
    }
  } catch (error) {
    console.error("Error in territory data API:", error)
    console.log("Using default data due to general error")
    return NextResponse.json(createDefaultData("Unknown Location"))
  }
}

// Helper function to cache a response
function cacheResponse(key: string, data: any) {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

// Helper function to extract key-value pairs from text
function extractKeyValuePairs(text: string, targetObject: Record<string, any>) {
  const lines = text.split(/\n|\r\n/).filter((line) => line.includes(":"))

  for (const line of lines) {
    const colonIndex = line.indexOf(":")
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      if (key && value) {
        targetObject[key] = value
      }
    }
  }
}

// Helper function to validate the data structure
function validateDataStructure(data: any): boolean {
  // Check if we have at least some data in each section
  return (
    data &&
    typeof data === "object" &&
    data.dataGeospasialDasar &&
    Object.keys(data.dataGeospasialDasar).length > 0 &&
    data.dataSumberDayaAlam &&
    Object.keys(data.dataSumberDayaAlam).length > 0 &&
    data.dataSosialDemografis &&
    Object.keys(data.dataSosialDemografis).length > 0 &&
    data.dataAncamanKeamanan &&
    Object.keys(data.dataAncamanKeamanan).length > 0 &&
    data.dataInfrastrukturKritis &&
    Object.keys(data.dataInfrastrukturKritis).length > 0 &&
    data.dataCuacaDanAlam &&
    Object.keys(data.dataCuacaDanAlam).length > 0 &&
    data.dataIntelijen &&
    Object.keys(data.dataIntelijen).length > 0
  )
}

// Helper function to create default data
function createDefaultData(location: string): any {
  // Special case for Habbema Kamp
  if (location.includes("Habbema") || location.includes("habbema")) {
    return {
      dataGeospasialDasar: {
        lokasi: "Habbema Kamp, Papua, Indonesia",
        koordinat: {
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

  // Special case for Surabaya
  if (location.toLowerCase().includes("surabaya")) {
    return {
      dataGeospasialDasar: {
        lokasi: "Surabaya, Jawa Timur, Indonesia",
        koordinat: {
          latitude: -7.2575,
          longitude: 112.7521,
        },
        luas_wilayah: "350.5 km²",
        batas_wilayah: {
          utara: "Selat Madura",
          selatan: "Kabupaten Sidoarjo",
          barat: "Kabupaten Gresik",
          timur: "Selat Madura",
        },
      },
      dataSumberDayaAlam: {
        hutan: "Hutan mangrove di pesisir",
        pertanian: "Lahan pertanian terbatas di pinggiran kota",
        tambang: "Tidak ada aktivitas pertambangan signifikan",
        sungai: "Sungai Brantas, Sungai Kalimas",
      },
      dataSosialDemografis: {
        jumlah_penduduk: "3.1 juta (kota), 5+ juta (metropolitan)",
        kepadatan_penduduk: "8,900 jiwa/km²",
        suku: "Jawa, Madura, Tionghoa, Arab",
        agama: "Islam (85%), Kristen (10%), Buddha, Hindu",
        bahasa: "Indonesia, Jawa, Madura",
      },
      dataAncamanKeamanan: {
        kejahatan: "Pencurian, perampokan (tingkat sedang)",
        konflik: "Konflik industrial sesekali",
        terorisme: "Risiko rendah",
        bencana_alam: "Banjir, rob (air pasang)",
      },
      dataInfrastrukturKritis: {
        transportasi: "Bandara Juanda, Terminal Purabaya, Pelabuhan Tanjung Perak",
        energi: "PLTGU Grati, jaringan listrik PLN",
        komunikasi: "Jaringan 4G/5G, fiber optik",
        kesehatan: "RSUD Dr. Soetomo, RS Husada Utama",
        pendidikan: "ITS, Unair, UNESA, dan lainnya",
      },
      dataCuacaDanAlam: {
        iklim: "Tropis",
        curah_hujan: "1,500-2,000 mm/tahun",
        musim: "Hujan (November-April), Kemarau (Mei-Oktober)",
        suhu_rata_rata: "24-34°C",
      },
      dataIntelijen: {
        aktivitas_militer: "Kodam V/Brawijaya, Pangkalan AL",
        aktivitas_polisi: "Polda Jawa Timur, Polrestabes Surabaya",
        informasi_terkini: "Pengamanan pelabuhan dan kawasan industri",
        rekomendasi: "Tingkatkan pengawasan area vital dan pusat keramaian",
      },
    }
  }

  // Default data for other locations
  return {
    dataGeospasialDasar: {
      lokasi: location,
      koordinat: {
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
}
