export default async function handler(req, res) {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;

  if (!gasUrl) {
    return res.status(500).json({
      error: "NEXT_PUBLIC_GAS_URL tidak dikonfigurasi di .env.local",
    });
  }

  if (req.method === "GET") {
    try {
      const response = await fetch(gasUrl);
      const text = await response.text();

      // Coba untuk memparsing JSON
      try {
        const data = JSON.parse(text);
        // Pastikan format data adalah array
        const expenses = Array.isArray(data) ? data : (data.expenses || []);
        return res.status(200).json({ expenses, success: true });
      } catch (jsonErr) {
        console.warn("GAS API tidak mengembalikan JSON yang valid. Kemungkinan eror otorisasi/akses Google.");
        
        // Periksa apakah ini halaman Sign-in Google (401 / 403 atau isi teks mengandung OAuth/signin)
        const isAuthError = text.includes("signin") || text.includes("accounts.google");
        
        return res.status(200).json({
          expenses: [],
          success: false,
          error: isAuthError
            ? "API Google Sheets memerlukan otorisasi (401). Silakan setel hak akses Web App Google Apps Script ke 'Anyone'."
            : "Gagal memproses data dari API Google Sheets (Respon bukan JSON).",
          rawResponse: text.substring(0, 500)
        });
      }
    } catch (error) {
      console.error("Gagal mengambil data dari Google Sheets API:", error);
      return res.status(200).json({
        expenses: [],
        success: false,
        error: `Gagal terhubung ke API: ${error.message}`
      });
    }
  }

  if (req.method === "POST") {
    try {
      const expenseData = req.body;

      // Teruskan data ke Google Apps Script Web App
      const response = await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Google Sheets API mengembalikan status ${response.status}: ${responseText.substring(0, 100)}`
        });
      }

      return res.status(200).json({
        success: true,
        message: "Data berhasil disimpan ke Google Sheets!",
        details: responseText.substring(0, 100)
      });
    } catch (error) {
      console.error("Gagal menyimpan data ke Google Sheets API:", error);
      return res.status(500).json({
        success: false,
        error: `Gagal menyimpan data: ${error.message}`
      });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
