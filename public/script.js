document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('music-form');
    const viewForm = document.getElementById('view-form');
    const viewLoading = document.getElementById('view-loading');
    const viewSuccess = document.getElementById('view-success');
    
    // Auth Views & Elements
    const viewLogin = document.getElementById('view-login');
    const viewRegister = document.getElementById('view-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const linkRegister = document.getElementById('link-register');
    const linkLogin = document.getElementById('link-login');
    const userProfile = document.getElementById('user-profile');
    const displayUsername = document.getElementById('display-username');

    const btnCreateNew = document.getElementById('btn-create-new');
    const btnPlay = document.getElementById('btn-play');
    const pollingStatus = document.getElementById('polling-status');
    
    let generatedAudioUrl = null;

    // Function to switch active view
    const switchView = (viewToShow) => {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        viewToShow.classList.add('active');
    };

    // Auth Navigation
    linkRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(viewRegister);
    });

    linkLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(viewLogin);
    });

    // Handle Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        
        // Show user profile in header
        displayUsername.textContent = username;
        userProfile.style.display = 'flex';
        
        // Go to main app view
        switchView(viewForm);
    });

    // Handle Register
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;

        if (password !== confirmPassword) {
            alert('Error: Konfirmasi password tidak cocok.');
            return;
        }

        alert('Registrasi berhasil! Silakan log in.');
        
        // Clear fields
        registerForm.reset();
        
        // Go to login view
        switchView(viewLogin);
    });

    // Update slider values
    const styleWeightInput = document.getElementById('style_weight');
    const styleWeightVal = document.getElementById('style_weight_val');
    if(styleWeightInput && styleWeightVal) {
        styleWeightInput.addEventListener('input', (e) => styleWeightVal.textContent = e.target.value);
    }

    const weirdnessInput = document.getElementById('weirdness');
    const weirdnessVal = document.getElementById('weirdness_val');
    if(weirdnessInput && weirdnessVal) {
        weirdnessInput.addEventListener('input', (e) => weirdnessVal.textContent = e.target.value);
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const genre = document.getElementById('genre').value;
        const instrument = document.getElementById('instrument').value;
        const supportingInstrument = document.getElementById('supporting_instrument').value.trim();
        const details = document.getElementById('details').value.trim();

        if (!details) {
            alert('Error: Anda harus mengisi detail atau lirik lagu. Permintaan dibatalkan.');
            return;
        }

        // Gather optional fields
        const title = document.getElementById('title').value.trim();
        const style = document.getElementById('style').value.trim();
        const excludeStyle = document.getElementById('exclude_style').value.trim();
        const vocalGender = document.getElementById('vocal_gender').value;
        const customMode = document.getElementById('custom_mode').checked;
        const autoLyrics = document.getElementById('auto_lyrics').checked;
        const instrumental = document.getElementById('instrumental').checked;
        const styleWeight = parseFloat(document.getElementById('style_weight').value);
        const weirdness = parseFloat(document.getElementById('weirdness').value);

        // Construct a prompt from the inputs
        let promptText = details;
        if (supportingInstrument) {
            promptText = `[Supporting Instruments: ${supportingInstrument}]\n` + promptText;
        }

        if (!customMode) {
            let basePrompt = `A ${genre} song with dominant ${instrument}.`;
            if (supportingInstrument) {
                basePrompt = `A ${genre} song with dominant ${instrument} and supporting ${supportingInstrument}.`;
                promptText = details; // reset so we don't duplicate the tag in non-custom mode, or we can just append. Let's just append.
            }
            promptText = `${basePrompt} ${promptText}`;
        }

        switchView(viewLoading);
        pollingStatus.textContent = "Mengirim permintaan ke Apiframe (Suno V5.5)...";

        try {
            const requestBody = {
                model: "suno",
                prompt: promptText,
                sunoParams: {
                    model_version: "V5_5",
                    instrumental: instrumental,
                    custom_mode: customMode,
                    auto_lyrics: autoLyrics,
                    style_weight: styleWeight,
                    weirdness: weirdness
                }
            };

            if (title) requestBody.sunoParams.title = title;
            // Map our style field to tags if in custom mode, or add to tags anyway
            if (style) requestBody.sunoParams.tags = style;
            else if (customMode) requestBody.sunoParams.tags = `A ${genre} song with dominant ${instrument}`;
            
            if (excludeStyle) requestBody.sunoParams.negative_tags = excludeStyle;
            if (vocalGender !== 'ai') requestBody.sunoParams.vocal_gender = vocalGender;

            // 1. Send Generation Request via Local Proxy
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            // Parse response as JSON if possible, otherwise as text
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`HTTP Error: ${response.status} - ${text}`);
            }
            
            if (!response.ok) {
                // Menampilkan detail error asli dari Apiframe jika ada
                throw new Error(`Server API merespons dengan error: ${JSON.stringify(data)}`);
            }

            // Apiframe v2 mungkin mengembalikan array, atau objek dengan id/task_id bersarang
            let taskData = data;
            if (Array.isArray(data) && data.length > 0) {
                taskData = data[0];
            }
            
            const taskId = taskData.task_id || taskData.id || taskData.job_id || (taskData.data && (taskData.data.task_id || taskData.data.id || taskData.data.job_id));
            
            if (!taskId) {
                // Jika masih gagal mengekstrak, tampilkan JSON asli agar user bisa menyalin ID secara manual jika perlu
                const rawJson = JSON.stringify(data);
                pollingStatus.innerHTML = `<span style="color: red;">Error parsing Task ID. Respons: ${rawJson}</span>`;
                throw new Error(`Tidak menemukan task_id dari respons API. Respons asli: ${rawJson}`);
            }

            pollingStatus.textContent = `Task ID: ${taskId}. Memulai polling...`;

            // Start Polling
            pollTaskStatus(taskId);

        } catch (error) {
            alert(`Error: ${error.message}`);
            switchView(viewForm);
        }
    });

    const pollTaskStatus = async (taskId) => {
        try {
            // Apiframe v2 polling endpoint via Local Proxy
            const fetchResponse = await fetch(`/api/jobs/${taskId}`, {
                method: 'GET'
            });

            const fetchData = await fetchResponse.json();
            
            if (fetchData.status === 'finished' || fetchData.status === 'completed') {
                pollingStatus.textContent = "Lagu berhasil dibuat!";
                
                // Extract audio URL. Often it returns an array of results or a single url
                // Suno usually generates 2 songs, let's try to get the first one's audio_url
                let audioUrl = null;
                if (fetchData.audio_url) {
                    audioUrl = fetchData.audio_url;
                } else if (fetchData.data && fetchData.data.length > 0) {
                    audioUrl = fetchData.data[0].audio_url;
                }

                if (audioUrl) {
                    generatedAudioUrl = audioUrl;
                    switchView(viewSuccess);
                    // Automatically download or open
                    downloadAudio(audioUrl);
                } else {
                    throw new Error("Lagu berstatus selesai tapi URL audio tidak ditemukan.");
                }

            } else if (fetchData.status === 'failed' || fetchData.status === 'error') {
                throw new Error("Generasi lagu gagal di server.");
            } else {
                // Status is still processing/in_progress
                pollingStatus.textContent = `Status: ${fetchData.status || 'processing'}... Menunggu...`;
                // Poll again in 4 seconds
                setTimeout(() => pollTaskStatus(taskId), 4000);
            }

        } catch (error) {
            console.error(error);
            pollingStatus.textContent = `Polling Error: ${error.message}. Akan mencoba lagi...`;
            // Keep polling even if network blips occur
            setTimeout(() => pollTaskStatus(apiKey, taskId), 5000);
        }
    };

    // Create New Button (Reset)
    btnCreateNew.addEventListener('click', () => {
        // We don't reset the form entirely so the user doesn't lose the API key
        document.getElementById('genre').value = "";
        document.getElementById('instrument').value = "";
        document.getElementById('details').value = "";
        switchView(viewForm);
    });

    // Play Button
    btnPlay.addEventListener('click', () => {
        if (generatedAudioUrl) {
            window.open(generatedAudioUrl, '_blank');
        } else {
            alert("URL Audio tidak tersedia.");
        }
    });

    // Function to trigger audio download
    const downloadAudio = (url) => {
        // Because of CORS, we might not be able to download directly via fetch & blob if the server restricts it.
        // Opening in new tab or using a direct link is safer for remote audio files in prototypes.
        // We will create a link element and click it.
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MusicStar_AI_Generated_Song.mp3';
        a.target = '_blank'; // Fallback if download attribute is ignored due to cross-origin
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
});
