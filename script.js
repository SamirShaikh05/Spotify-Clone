document.addEventListener('DOMContentLoaded', function () {
    const audio = new Audio();

    // Get all song elements - only declare once
    const songs = document.querySelectorAll('.song');
    // Get the now-playing bar elements
    const nowPlayingBar = document.querySelector('.now-playing-bar');
    const nowPlayingTitle = document.querySelector('.now-playing-title');
    const nowPlayingArtist = document.querySelector('.now-playing-artist');
    const nowPlayingCover = document.querySelector('.now-playing-cover');

    // Elements for the progress bar
    const progressBar = document.querySelector('.progress-track-fill');
    const currentTimeElement = document.querySelector('.progress-time:first-of-type');
    const totalTimeElement = document.querySelector('.progress-time:last-of-type');
    const progressTrack = document.querySelector('.progress-track');
    const playPauseButton = document.querySelector('.play-pause');

    // Get previous and next buttons
    const prevButton = document.querySelector('.control-button:nth-child(2)');
    const nextButton = document.querySelector('.control-button:nth-child(4)');

    // Get volume control elements
    const volumeControl = document.querySelector('.volume-track');
    const volumeFill = document.querySelector('.volume-track-fill');
    const volumeIcon = document.querySelector('.volume-icon');

    // Hamburger menu elements
    const hamburger = document.querySelector('.hamburger');
    const leftContainer = document.querySelector('.left');

    // Create progress bar handle
    const progressHandle = document.createElement('div');
    progressHandle.className = 'progress-handle';
    progressTrack.appendChild(progressHandle);

    // Create volume handle
    const volumeHandle = document.createElement('div');
    volumeHandle.className = 'volume-handle';
    volumeControl.appendChild(volumeHandle);

    // Set initial values
    let isPlaying = false;
    let songDuration = 0; // Will be set dynamically when song loads
    let isDraggingProgress = false;
    let isDraggingVolume = false;

    // Store song history and current position
    let songHistory = [];
    let currentSongIndex = -1;

    // Store all song data for easy access
    let allSongs = [];

    // Initial volume (0-1)
    let currentVolume = 1; // 100% volume to start

    // Hamburger menu toggle
    hamburger.addEventListener('click', function () {
        leftContainer.classList.toggle('show');
    });

    // Function to map song titles to file paths
    function getSongPath(title) {
        // Remove special characters and convert to lowercase for easier matching
        const simplifiedTitle = title.toLowerCase().replace(/[^\w\s]/g, '');

        // Define mapping for song titles to file paths
        const songMapping = {
            'tum se': 'songs/tumse.mp3',
            'duniyaa': 'songs/duniya.mp3',
            'zaalima': 'songs/zaalima.mp3',
            'tere pyaar mein': 'songs/terepyaarmein.mp3',
            'hawayein': 'songs/Hawae.mp3',
            'finding her': 'songs/FindingHer.mp3',
            'afsos': 'songs/Afsos.mp3',
            'blank': 'songs/blank.mp3',
            'blinding lights': 'songs/blinding.mp3',
            'heat waves': 'songs/HeatWaves.mp3',
            'stay': 'songs/Stay.mp3',
            'believer': 'songs/Imagine.mp3',
            'starboy': 'songs/Starboy.mp3',
            'mortals': 'songs/Warrio.mp3',
            'cradles': 'songs/Craddles.mp3'
        };

        // Try to find the song in our mapping
        for (const key in songMapping) {
            if (simplifiedTitle.includes(key) || key.includes(simplifiedTitle)) {
                return songMapping[key];
            }
        }
    }

    // Collect all song data into an array for easier management
    function collectAllSongs() {
        songs.forEach(song => {
            const title = song.querySelector('.songdesc').textContent;
            const artist = song.querySelector('.singer').textContent;
            const coverSrc = song.querySelector('.card').src;
            const songPath = getSongPath(title);

            allSongs.push({
                title: title,
                artist: artist,
                coverSrc: coverSrc,
                songPath: songPath,
                element: song
            });
        });
    }

    // Format time from seconds to MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // Update progress bar and time display based on audio's current time
    function updateProgress() {
        if (!audio.paused) {
            const currentTime = audio.currentTime;
            // Update time display
            currentTimeElement.textContent = formatTime(currentTime);

            // Update progress bar width
            const progressPercent = (currentTime / audio.duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            progressHandle.style.left = `${progressPercent}%`;
        }
    }

    // Toggle play/pause
    function togglePlay() {
        isPlaying = !isPlaying;

        if (isPlaying) {
            audio.play();
            // Use requestAnimationFrame for smoother updates instead of setInterval
            requestAnimationFrame(animateProgress);
        } else {
            audio.pause();
        }

        updatePlayPauseIcon();
    }

    // Use requestAnimationFrame for smoother progress updates
    function animateProgress() {
        if (!audio.paused && audio.duration) {
            const currentTime = audio.currentTime;
            const duration = audio.duration;

            // Calculate progress with boundary check
            let progress = currentTime / duration;
            progress = Math.max(0, Math.min(1, progress));

            // Update visuals
            updateProgressVisuals(progress);
        }

        if (isPlaying) {
            requestAnimationFrame(animateProgress);
        }
    }

    // Update play/pause button icon
    function updatePlayPauseIcon() {
        playPauseButton.innerHTML = isPlaying ?
            '<img src="Img/pause.svg" alt="Pause">' :
            '<img src="Img/play.svg" alt="Play">';
    }

    // Update the helper function to ensure consistent updating of both bar and handle
    function updateProgressVisuals(progress) {
        if (progress < 0 || progress > 1) {
            console.warn('Invalid progress value:', progress);
            progress = Math.max(0, Math.min(1, progress));
        }

        const percent = `${progress * 100}%`;
        progressBar.style.width = percent;
        progressHandle.style.left = percent;

        // Update time only if audio is loaded
        if (audio.duration && isFinite(audio.duration)) {
            const time = progress * audio.duration;
            currentTimeElement.textContent = formatTime(time);
        }
    }

    // Function to update navigation button states
    function updateNavigationButtons() {
        console.log('Updating navigation buttons:', {
            currentSongIndex,
            songHistoryLength: songHistory.length
        });

        // Enable/disable previous button
        prevButton.style.opacity = (currentSongIndex > 0) ? "1" : "0.5";
        prevButton.style.cursor = (currentSongIndex > 0) ? "pointer" : "not-allowed";

        // Enable/disable next button - only based on song history
        const hasNext = currentSongIndex < songHistory.length - 1;
        nextButton.style.opacity = hasNext ? "1" : "0.5";
        nextButton.style.cursor = hasNext ? "pointer" : "not-allowed";
    }

    // Enhanced function to update now playing with history management
    function updateNowPlaying(title, artist, coverSrc, songPath, addToHistory = true) {
        // Update song details
        nowPlayingTitle.textContent = title;
        nowPlayingArtist.textContent = artist;
        nowPlayingCover.src = coverSrc;

        // Reset player
        audio.pause();
        audio.src = songPath;

        // Wait for audio metadata to load to get actual duration
        audio.addEventListener('loadedmetadata', function onMetadata() {
            // Remove the event listener to prevent multiple calls
            audio.removeEventListener('loadedmetadata', onMetadata);

            // Get actual song duration from audio element
            songDuration = audio.duration;
            totalTimeElement.textContent = formatTime(songDuration);

            // Start playing the song after metadata is loaded
            if (isPlaying) {
                audio.play();
                requestAnimationFrame(animateProgress);
            }

            // Show the now-playing bar
            nowPlayingBar.classList.add('show');

            // Reset handle position
            progressHandle.style.left = '0%';
        });

        // Add to song history if needed
        if (addToHistory) {
            // If we're not at the end of history, truncate the future history
            if (currentSongIndex < songHistory.length - 1) {
                songHistory = songHistory.slice(0, currentSongIndex + 1);
            }

            // Add current song to history
            songHistory.push({
                title: title,
                artist: artist,
                coverSrc: coverSrc,
                songPath: songPath
            });

            // Update current index
            currentSongIndex = songHistory.length - 1;
        }

        // Set play state
        isPlaying = true;
        updatePlayPauseIcon();

        // Update navigation button states
        updateNavigationButtons();

        // Save to local storage
        savePlayerState();
    }

    // Play previous song
    function playPreviousSong() {
        if (currentSongIndex > 0 && !isDraggingProgress) {
            currentSongIndex--;
            const prevSong = songHistory[currentSongIndex];
            updateNowPlaying(
                prevSong.title,
                prevSong.artist,
                prevSong.coverSrc,
                prevSong.songPath,
                false // Don't add to history since we're navigating
            );
        }
    }

    // Play next song from history
    function playNextSong() {
        if (currentSongIndex < songHistory.length - 1 && !isDraggingProgress) {
            currentSongIndex++;
            const nextSong = songHistory[currentSongIndex];
            updateNowPlaying(
                nextSong.title,
                nextSong.artist,
                nextSong.coverSrc,
                nextSong.songPath,
                false // Don't add to history since we're navigating
            );
            return true;
        }
        return false;
    }

    // Save player state to local storage
    function savePlayerState() {
        const storageData = {
            currentSong: currentSongIndex >= 0 ? songHistory[currentSongIndex] : null,
            songHistory: songHistory,
            currentSongIndex: currentSongIndex,
            volume: currentVolume
        };

        localStorage.setItem('spotifyPlayerState', JSON.stringify(storageData));
    }

    // Update volume display
    function updateVolumeDisplay() {
        // Update the volume fill width based on current volume
        volumeFill.style.width = `${currentVolume * 100}%`;
        volumeHandle.style.left = `${currentVolume * 100}%`;
        audio.volume = currentVolume;

        // Update volume icon based on level
        if (currentVolume === 0) {
            volumeIcon.src = "Img/Mute.svg"; // Muted icon
            volumeIcon.alt = "Muted";
        }
        else if (currentVolume < 0.25) {
            volumeIcon.src = "Img/Low-vol.svg"; //low volume icon
            volumeIcon.alt = "Low Volume";
        }
        else if (currentVolume < 0.6) {
            volumeIcon.src = "Img/Mid-vol.svg"; // mid volume icon
            volumeIcon.alt = "Medium Volume";
        }
        else {
            volumeIcon.src = "Img/High-vol.svg"; // High volume icon
            volumeIcon.alt = "High Volume";
        }

        // Save to local storage
        const playerState = JSON.parse(localStorage.getItem('spotifyPlayerState') || '{}');
        playerState.volume = currentVolume;
        localStorage.setItem('spotifyPlayerState', JSON.stringify(playerState));
    }

    // ===== Progress Bar Drag Handling =====
    progressTrack.addEventListener('mousedown', function (e) {
        e.preventDefault();
        isDraggingProgress = true;

        // Make handle visible during entire drag operation
        progressHandle.style.display = 'block';
        progressHandle.style.opacity = '1';

        // Additional styling for the track during dragging
        progressTrack.style.backgroundColor = '#333'; // Darker background during drag
        progressBar.style.backgroundColor = '#1DB954'; // Spotify green

        // Store playback state
        const wasPlaying = !audio.paused;
        if (wasPlaying) audio.pause();

        // Disable transitions for smoother dragging
        progressBar.style.transition = 'none';
        progressHandle.style.transition = 'none';

        // Get the track dimensions
        const trackRect = this.getBoundingClientRect();
        const trackWidth = trackRect.width;

        // Function to calculate drag position with improved boundary checking
        function calculateDragPosition(clientX) {
            // Calculate position relative to track
            let position = (clientX - trackRect.left) / trackWidth;

            // Strict boundary enforcement with small buffer
            position = Math.max(0.001, Math.min(0.999, position));

            return position;
        }

        // Initial drag position
        let dragPosition = calculateDragPosition(e.clientX);
        updateProgressVisuals(dragPosition);

        // Drag handler
        function handleDrag(e) {
            if (!isDraggingProgress) return;

            // Keep handle visible throughout drag operation
            progressHandle.style.display = 'block';
            progressHandle.style.opacity = '1';

            // Calculate new position with improved boundary checking
            dragPosition = calculateDragPosition(e.clientX);
            updateProgressVisuals(dragPosition);

            // Update time display during drag
            if (audio.duration) {
                const newTime = dragPosition * audio.duration;
                currentTimeElement.textContent = formatTime(newTime);
            }
        }

        // End drag handler
        function stopDrag() {
            // Make sure we're still dragging
            if (!isDraggingProgress) return;

            // Clean up event listeners
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('mouseleave', stopDrag);

            // Reset handle display to CSS default
            progressHandle.style.display = '';
            progressHandle.style.opacity = '';

            // Reset styling
            progressTrack.style.backgroundColor = '';
            progressBar.style.backgroundColor = '';

            // Re-enable transitions
            progressBar.style.transition = '';
            progressHandle.style.transition = '';

            // Apply the position to audio if we have duration
            if (audio.duration) {
                // Set audio time to current drag position
                audio.currentTime = dragPosition * audio.duration;

                // Force visual update one more time
                updateProgressVisuals(dragPosition);
            }

            // Resume playback if it was playing
            if (wasPlaying) audio.play();

            // Reset dragging state
            isDraggingProgress = false;
        }

        // Add events to document to catch mouse movement anywhere
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('mouseleave', stopDrag); // Handle mouse leaving window
    });

    // Handle click on volume track (adjust volume)
    volumeControl.addEventListener('mousedown', function (e) {
        e.preventDefault();
        isDraggingVolume = true;

        // Make handle visible during entire drag operation
        volumeHandle.style.display = 'block';
        volumeHandle.style.opacity = '1';

        // Additional styling for the track during dragging
        volumeControl.style.backgroundColor = '#333'; // Darker background during drag
        volumeFill.style.backgroundColor = '#1DB954'; // Spotify green

        // Disable transitions for smoother dragging
        volumeFill.style.transition = 'none';
        volumeHandle.style.transition = 'none';

        // Initial volume change
        const rect = this.getBoundingClientRect();
        const clickPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        currentVolume = clickPosition;
        updateVolumeDisplay();

        // Function to handle mouse movement for dragging
        function handleVolumeDrag(e) {
            if (!isDraggingVolume) return;

            // Keep handle visible throughout drag operation
            volumeHandle.style.display = 'block';
            volumeHandle.style.opacity = '1';

            const rect = volumeControl.getBoundingClientRect();
            const dragPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            currentVolume = dragPosition;
            updateVolumeDisplay();
        }

        // Function to stop dragging
        function stopVolumeDrag() {
            // Make sure we're still dragging
            if (!isDraggingVolume) return;

            document.removeEventListener('mousemove', handleVolumeDrag);
            document.removeEventListener('mouseup', stopVolumeDrag);
            document.removeEventListener('mouseleave', stopVolumeDrag);

            // Reset handle display to CSS default
            volumeHandle.style.display = '';
            volumeHandle.style.opacity = '';

            // Reset styling
            volumeControl.style.backgroundColor = '';
            volumeFill.style.backgroundColor = '';

            // Re-enable transitions
            volumeFill.style.transition = '';
            volumeHandle.style.transition = '';

            isDraggingVolume = false;
        }

        // Add event listeners for dragging
        document.addEventListener('mousemove', handleVolumeDrag);
        document.addEventListener('mouseup', stopVolumeDrag);
        document.addEventListener('mouseleave', stopVolumeDrag);
    });

    // Handle click on volume icon (toggle mute)
    volumeIcon.addEventListener('click', function () {
        if (currentVolume > 0) {
            // Store current volume before muting
            this.dataset.previousVolume = currentVolume;
            currentVolume = 0;
        } else {
            // Restore previous volume or default to 70%
            currentVolume = parseFloat(this.dataset.previousVolume || 0.7);
        }

        // Update display
        updateVolumeDisplay();
    });

    // Add event listeners for previous and next buttons
    prevButton.addEventListener('click', function (e) {
        if (isDraggingProgress) {
            e.stopImmediatePropagation();
            return;
        }
        playPreviousSong();
    });

    nextButton.addEventListener('click', function (e) {
        if (isDraggingProgress) {
            e.stopImmediatePropagation();
            return;
        }
        playNextSong();
    });

    // Click event for play/pause button
    playPauseButton.addEventListener('click', togglePlay);

    // Add click event listeners to all songs
    songs.forEach(song => {
        song.addEventListener('click', function () {
            // Get song details from the clicked song
            const title = this.querySelector('.songdesc').textContent;
            const artist = this.querySelector('.singer').textContent;
            const coverSrc = this.querySelector('.card').src;

            // Get song path based on title
            const songPath = getSongPath(title);

            // Update now playing with this song
            updateNowPlaying(title, artist, coverSrc, songPath, true);
        });
    });

    // Load state from local storage on page load
    function loadSavedState() {
        const savedState = localStorage.getItem('spotifyPlayerState');

        if (savedState) {
            const state = JSON.parse(savedState);

            // Restore song history and index
            songHistory = state.songHistory || [];
            currentSongIndex = state.currentSongIndex || -1;

            // Restore volume
            if (state.volume !== undefined) {
                currentVolume = state.volume;
                updateVolumeDisplay();
            } else {
                // Initialize with default volume
                updateVolumeDisplay();
            }

            // If we have a current song
            if (state.currentSong) {
                const song = state.currentSong;

                // Restore song details but don't auto-play
                nowPlayingTitle.textContent = song.title;
                nowPlayingArtist.textContent = song.artist;
                nowPlayingCover.src = song.coverSrc;

                // Set audio source
                audio.src = song.songPath;

                // Load audio metadata to get duration
                audio.addEventListener('loadedmetadata', function onMetadata() {
                    audio.removeEventListener('loadedmetadata', onMetadata);

                    // Update duration display with actual duration
                    songDuration = audio.duration;
                    totalTimeElement.textContent = formatTime(songDuration);
                    currentTimeElement.textContent = '0:00';

                    // Reset handle position
                    progressHandle.style.left = '0%';

                    // Show the now-playing bar
                    nowPlayingBar.classList.add('show');
                });

                // Initialize display without starting playback
                isPlaying = false;
                updatePlayPauseIcon();
            }
        } else {
            // Initialize with default volume
            updateVolumeDisplay();
        }

        // Collect all songs data
        collectAllSongs();

        // Initialize button states
        updateNavigationButtons();
    }

    // Initialize everything
    loadSavedState();
});