const express = require('express');
const app = require('./api/index'); // Menggunakan app dari direktori api
const path = require('path');

const PORT = process.env.PORT || 3000;

// Melayani file statis HTML, CSS, JS dari direktori saat ini 
// (Ini hanya untuk mode pengembangan lokal. Di Vercel, file statis ditangani otomatis)
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log("================================================");
    console.log(`🚀 Proxy Server (Mode Lokal) berjalan di http://localhost:${PORT}`);
    console.log("================================================");
    console.log(`1. Buka browser dan ketik alamat: http://localhost:${PORT}`);
    console.log(`2. Jangan tutup jendela terminal ini selama prototipe digunakan.`);
    console.log(`Catatan: Proyek ini sekarang sudah mendukung deployment ke Vercel.`);
});
