const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// ==========================================
// PENTING: Masukkan API Key Apiframe Anda di sini
// ==========================================
const API_KEY = "afk_d0c24355cb96740fe7550376c92347f53d7c093e";

app.use(cors());
app.use(express.json());

// Melayani file statis HTML, CSS, JS dari direktori saat ini
app.use(express.static(__dirname));

// Proxy endpoint untuk Generation
app.post('/api/generate', async (req, res) => {
    try {
        if (!API_KEY || API_KEY === "afk_ganti_dengan_api_key_anda") {
            return res.status(401).json({ error: "API Key belum disetel di server.js." });
        }

        // Meneruskan request ke Apiframe
        const fetchResponse = await fetch('https://api.apiframe.ai/v2/music/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(req.body)
        });

        // Baca status dan kembalikan persis ke frontend
        const contentType = fetchResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await fetchResponse.json();
            res.status(fetchResponse.status).json(data);
        } else {
            const text = await fetchResponse.text();
            res.status(fetchResponse.status).send(text);
        }

    } catch (error) {
        console.error('Error saat proxy generate:', error);
        res.status(500).json({ error: "Terjadi kesalahan di server proxy: " + error.message });
    }
});

// Proxy endpoint untuk Polling Status
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const taskId = req.params.id;

        if (!API_KEY || API_KEY === "afk_ganti_dengan_api_key_anda") {
            return res.status(401).json({ error: "API Key belum disetel di server.js." });
        }

        const fetchResponse = await fetch(`https://api.apiframe.ai/v2/jobs/${taskId}`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY
            }
        });

        const contentType = fetchResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await fetchResponse.json();
            res.status(fetchResponse.status).json(data);
        } else {
            const text = await fetchResponse.text();
            res.status(fetchResponse.status).send(text);
        }

    } catch (error) {
        console.error('Error saat proxy polling:', error);
        res.status(500).json({ error: "Terjadi kesalahan di server proxy: " + error.message });
    }
});

app.listen(PORT, () => {
    console.log("================================================");
    console.log(`🚀 Proxy Server berjalan di http://localhost:${PORT}`);
    console.log("================================================");
    console.log(`1. Buka browser dan ketik alamat: http://localhost:${PORT}`);
    console.log(`2. Jangan tutup jendela terminal ini selama prototipe digunakan.`);
});
