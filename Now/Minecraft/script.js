// ===== GAME CONFIGURATION =====
const CONFIG = {
    // Game Version
    VERSION: "1.2.6",
    
    // Block Types
    BLOCK_TYPES: {
        0: { name: 'Air', color: null, solid: false, transparent: true },
        1: { name: 'Grass', color: '#7CFC00', solid: true, texture: 'grass' },
        2: { name: 'Dirt', color: '#8B4513', solid: true, texture: 'dirt' },
        3: { name: 'Stone', color: '#808080', solid: true, texture: 'stone' },
        4: { name: 'Wood', color: '#DEB887', solid: true, texture: 'wood' },
        5: { name: 'Leaves', color: '#228B22', solid: true, texture: 'leaves' },
        6: { name: 'Water', color: '#1E90FF', solid: false, transparent: true, alpha: 0.7 },
        7: { name: 'Sand', color: '#F4E04D', solid: true, texture: 'sand' },
        8: { name: 'Glass', color: '#87CEEB', solid: true, transparent: true, alpha: 0.5 },
        9: { name: 'Cobblestone', color: '#696969', solid: true, texture: 'cobblestone' },
        10: { name: 'Bedrock', color: '#2C2C2C', solid: true, unbreakable: true }
    },
    
    // World Settings
    WORLD: {
        SIZE: 32,
        HEIGHT: 64,
        CHUNK_SIZE: 16,
        SEA_LEVEL: 32
    },
    
    // Player Settings
    PLAYER: {
        HEIGHT: 1.8,
        EYE_HEIGHT: 1.6,
        RADIUS: 0.3,
        SPEED: {
            WALKING: 0.12,
            SPRINTING: 0.18,
            SNEAKING: 0.06,
            FLYING: 0.15
        },
        JUMP_FORCE: 0.45,
        GRAVITY: 0.028,
        REACH_DISTANCE: 5
    },
    
    // Graphics Settings
    GRAPHICS: {
        FOV: 70,
        RENDER_DISTANCE: 8,
        MAX_FPS: 60,
        FOG: {
            START: 6,
            END: 12,
            COLOR: '#87CEEB'
        },
        PARTICLES: true,
        QUALITY: 'fancy' // 'fast', 'fancy', 'fantastic'
    },
    
    // Controls Settings
    CONTROLS: {
        SENSITIVITY: 5,
        INVERT_Y: false,
        AUTO_JUMP: true,
        VIBRATION: true,
        TOUCH_SIZE: 'normal' // 'small', 'normal', 'large'
    },
    
    // Audio Settings
    AUDIO: {
        MASTER_VOLUME: 0.7,
        MUSIC_VOLUME: 0.5,
        SFX_VOLUME: 0.8,
        BACKGROUND_MUSIC: true
    },
    
    // Game Settings
    GAME: {
        DIFFICULTY: 'normal', // 'peaceful', 'easy', 'normal', 'hard'
        MODE: 'survival', // 'survival', 'creative', 'adventure'
        DAY_NIGHT_CYCLE: true,
        WEATHER: true
    }
};

// ===== GAME STATE =====
let game = {
    // Core State
    worlds: [],
    currentWorld: null,
    world: null,
    chunks: new Map(),
    player: null,
    entities: [],
    particles: [],
    timeOfDay: 6000, // Minecraft time (0-24000)
    weather: 'clear',
    
    // Game State
    running: false,
    paused: false,
    inGame: false,
    loading: false,
    gameMode: CONFIG.GAME.MODE,
    difficulty: CONFIG.GAME.DIFFICULTY,
    
    // Performance
    canvas: null,
    ctx: null,
    lastTime: 0,
    fps: 60,
    frameCount: 0,
    deltaTime: 0,
    lastFrameTime: 0,
    
    // Input
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    touch: {
        joystick: { x: 0, y: 0, active: false, startX: 0, startY: 0 },
        look: { active: false, startX: 0, startY: 0 },
        pinch: { active: false, startDistance: 0 }
    },
    
    // Audio
    audioContext: null,
    sounds: new Map(),
    music: null,
    
    // UI
    selectedBlock: 1,
    selectedSlot: 0,
    inventory: [
        { type: 1, count: 64, name: 'Grass Block' },
        { type: 2, count: 64, name: 'Dirt' },
        { type: 3, count: 64, name: 'Stone' },
        { type: 4, count: 64, name: 'Wood' },
        { type: 5, count: 64, name: 'Leaves' },
        { type: 7, count: 64, name: 'Sand' },
        { type: 8, count: 64, name: 'Glass' },
        { type: 9, count: 64, name: 'Cobblestone' }
    ],
    
    // Statistics
    stats: {
        playTime: 0,
        blocksMined: 0,
        blocksPlaced: 0,
        distanceWalked: 0,
        mobsKilled: 0,
        deaths: 0
    },
    
    // Session Stats
    session: {
        startTime: 0,
        blocksMined: 0,
        blocksPlaced: 0,
        distanceWalked: 0
    }
};

// ===== INITIALIZATION =====
function init() {
    console.log(`Initializing Minecraft Mobile v${CONFIG.VERSION}...`);
    
    // Initialize localStorage if empty
    initStorage();
    
    // Load saved data
    loadGameData();
    
    // Initialize UI
    initUI();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize audio
    initAudio();
    
    // Load worlds
    loadWorlds();
    
    // Update statistics display
    updateStatistics();
    
    console.log('Game initialized successfully!');
}

function initStorage() {
    if (!localStorage.getItem('minecraft_first_run')) {
        localStorage.setItem('minecraft_first_run', 'true');
        localStorage.setItem('minecraft_settings', JSON.stringify(CONFIG));
        localStorage.setItem('minecraft_worlds', '[]');
        localStorage.setItem('minecraft_stats', JSON.stringify(game.stats));
        console.log('First run: Initialized localStorage');
    }
}

function loadGameData() {
    try {
        // Load settings
        const savedSettings = localStorage.getItem('minecraft_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Merge settings with CONFIG
            Object.assign(CONFIG, settings);
            
            // Apply FPS limit
            game.maxFps = CONFIG.GRAPHICS.MAX_FPS;
        }
        
        // Load statistics
        const savedStats = localStorage.getItem('minecraft_stats');
        if (savedStats) {
            game.stats = JSON.parse(savedStats);
        }
        
    } catch (e) {
        console.error('Error loading game data:', e);
    }
}

function saveGameData() {
    try {
        // Save settings
        localStorage.setItem('minecraft_settings', JSON.stringify(CONFIG));
        
        // Save statistics
        localStorage.setItem('minecraft_stats', JSON.stringify(game.stats));
        
        // Save worlds
        saveWorlds();
        
    } catch (e) {
        console.error('Error saving game data:', e);
    }
}

// ===== UI MANAGEMENT =====
function initUI() {
    // Update option sliders with current values
    updateOptionSliders();
    
    // Setup world preview canvas
    const previewCanvas = document.getElementById('worldPreviewCanvas');
    if (previewCanvas) {
        previewCanvas.width = 400;
        previewCanvas.height = 200;
        drawWorldPreview();
    }
    
    // Update touch controls size
    updateTouchControlsSize();
}

function updateOptionSliders() {
    // Graphics
    document.getElementById('renderDistance').value = CONFIG.GRAPHICS.RENDER_DISTANCE;
    document.getElementById('renderDistanceValue').textContent = CONFIG.GRAPHICS.RENDER_DISTANCE + ' chunks';
    
    document.getElementById('maxFps').value = CONFIG.GRAPHICS.MAX_FPS;
    document.getElementById('maxFpsValue').textContent = CONFIG.GRAPHICS.MAX_FPS;
    
    document.getElementById('graphicsQuality').value = CONFIG.GRAPHICS.QUALITY;
    document.getElementById('particles').value = CONFIG.GRAPHICS.PARTICLES ? 'all' : 'minimal';
    document.getElementById('fog').value = CONFIG.GRAPHICS.FOG ? 'fancy' : 'off';
    
    // Game
    document.getElementById('difficulty').value = CONFIG.GAME.DIFFICULTY;
    document.getElementById('gameMode').value = CONFIG.GAME.MODE;
    document.getElementById('allowCheats').checked = CONFIG.GAME.MODE === 'creative';
    document.getElementById('bonusChest').checked = false;
    document.getElementById('dayNightCycle').checked = CONFIG.GAME.DAY_NIGHT_CYCLE;
    
    // Controls
    document.getElementById('sensitivity').value = CONFIG.CONTROLS.SENSITIVITY;
    document.getElementById('sensitivityValue').textContent = CONFIG.CONTROLS.SENSITIVITY;
    
    document.getElementById('invertY').checked = CONFIG.CONTROLS.INVERT_Y;
    document.getElementById('autoJump').checked = CONFIG.CONTROLS.AUTO_JUMP;
    document.getElementById('vibration').checked = CONFIG.CONTROLS.VIBRATION;
    document.getElementById('touchSize').value = CONFIG.CONTROLS.TOUCH_SIZE;
    
    // Audio
    document.getElementById('masterVolume').value = CONFIG.AUDIO.MASTER_VOLUME * 100;
    document.getElementById('masterVolumeValue').textContent = Math.round(CONFIG.AUDIO.MASTER_VOLUME * 100) + '%';
    
    document.getElementById('musicVolume').value = CONFIG.AUDIO.MUSIC_VOLUME * 100;
    document.getElementById('musicVolumeValue').textContent = Math.round(CONFIG.AUDIO.MUSIC_VOLUME * 100) + '%';
    
    document.getElementById('sfxVolume').value = CONFIG.AUDIO.SFX_VOLUME * 100;
    document.getElementById('sfxVolumeValue').textContent = Math.round(CONFIG.AUDIO.SFX_VOLUME * 100) + '%';
    
    document.getElementById('backgroundMusic').checked = CONFIG.AUDIO.BACKGROUND_MUSIC;
}

function updateTouchControlsSize() {
    const size = CONFIG.CONTROLS.TOUCH_SIZE;
    const controls = document.getElementById('touchControls');
    
    let scale = 1;
    switch (size) {
        case 'small':
            scale = 0.8;
            break;
        case 'large':
            scale = 1.2;
            break;
    }
    
    controls.style.transform = `scale(${scale})`;
    controls.style.transformOrigin = 'center';
}

function drawWorldPreview() {
    const canvas = document.getElementById('worldPreviewCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const worldType = document.getElementById('worldType').value;
    const gameMode = document.getElementById('worldGameMode').value;
    const difficulty = document.getElementById('worldDifficulty').value;
    
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground based on world type
    if (worldType === 'default' || worldType === 'amplified') {
        // Draw terrain with hills
        drawTerrainPreview(ctx, canvas, worldType);
    } else if (worldType === 'flat') {
        // Draw flat world
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    } else if (worldType === 'large_biomes') {
        // Draw large biomes
        drawLargeBiomesPreview(ctx, canvas);
    }
    
    // Draw sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(350, 50, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Update preview info
    updatePreviewInfo();
}

function drawTerrainPreview(ctx, canvas, worldType) {
    const groundHeight = canvas.height - 80;
    
    // Draw grass
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(0, groundHeight, canvas.width, 80);
    
    // Draw hills/mountains
    if (worldType === 'default') {
        ctx.fillStyle = '#5CB800';
        drawHill(ctx, 50, groundHeight, 100, 30);
        drawHill(ctx, 200, groundHeight, 150, 50);
        drawHill(ctx, 350, groundHeight, 80, 25);
        
        // Draw trees
        drawTree(ctx, 100, groundHeight);
        drawTree(ctx, 250, groundHeight);
        drawTree(ctx, 380, groundHeight);
    } else if (worldType === 'amplified') {
        ctx.fillStyle = '#606060';
        drawHill(ctx, 50, groundHeight, 80, 100);
        drawHill(ctx, 150, groundHeight, 120, 120);
        drawHill(ctx, 300, groundHeight, 100, 90);
    }
}

function drawLargeBiomesPreview(ctx, canvas) {
    // Draw different biome sections
    const sectionWidth = canvas.width / 3;
    
    // Forest biome
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 60, sectionWidth, 60);
    for (let i = 0; i < 3; i++) {
        drawTree(ctx, 50 + i * 30, canvas.height - 60);
    }
    
    // Plains biome
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(sectionWidth, canvas.height - 60, sectionWidth, 60);
    
    // Desert biome
    ctx.fillStyle = '#F4E04D';
    ctx.fillRect(sectionWidth * 2, canvas.height - 60, sectionWidth, 60);
    drawCactus(ctx, sectionWidth * 2 + 50, canvas.height - 60);
}

function drawHill(ctx, x, baseY, width, height) {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + width/2, baseY - height, x + width, baseY);
    ctx.closePath();
    ctx.fill();
}

function drawTree(ctx, x, y) {
    // Trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 3, y - 20, 6, 20);
    
    // Leaves
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x, y - 25, 15, 0, Math.PI * 2);
    ctx.fill();
}

function drawCactus(ctx, x, y) {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 3, y - 25, 6, 25);
    ctx.fillRect(x - 8, y - 15, 5, 6);
    ctx.fillRect(x + 4, y - 20, 5, 6);
}

function updatePreviewInfo() {
    const worldName = document.getElementById('worldName').value || 'New World';
    const gameMode = document.getElementById('worldGameMode').value;
    const difficulty = document.getElementById('worldDifficulty').value;
    const worldType = document.getElementById('worldType').value;
    
    const infoElement = document.getElementById('previewInfo');
    if (infoElement) {
        infoElement.innerHTML = `
            <div class="preview-name">${worldName}</div>
            <div class="preview-specs">${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)} • ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} • ${worldType.charAt(0).toUpperCase() + worldType.slice(1)}</div>
        `;
    }
}

function updateStatistics() {
    // Update main menu statistics
    document.getElementById('totalPlayTime').textContent = 
        Math.floor(game.stats.playTime / 3600) + 'h';
    document.getElementById('worldsCount').textContent = game.worlds.length;
    document.getElementById('blocksMined').textContent = game.stats.blocksMined;
    
    // Update in-game session stats if in game
    if (game.inGame) {
        document.getElementById('blocksPlaced').textContent = game.session.blocksPlaced;
        document.getElementById('blocksMinedSession').textContent = game.session.blocksMined;
        document.getElementById('distanceWalked').textContent = 
            Math.floor(game.session.distanceWalked) + 'm';
        
        const sessionTime = Math.floor((Date.now() - game.session.startTime) / 60000);
        document.getElementById('sessionTime').textContent = sessionTime + 'm';
    }
}

// ===== WORLD MANAGEMENT =====
function loadWorlds() {
    try {
        const savedWorlds = localStorage.getItem('minecraft_worlds');
        if (savedWorlds) {
            game.worlds = JSON.parse(savedWorlds);
        } else {
            game.worlds = [];
        }
        
        renderWorldList();
        
    } catch (e) {
        console.error('Error loading worlds:', e);
        game.worlds = [];
        renderWorldList();
    }
}

function saveWorlds() {
    try {
        localStorage.setItem('minecraft_worlds', JSON.stringify(game.worlds));
    } catch (e) {
        console.error('Error saving worlds:', e);
    }
}

function renderWorldList() {
    const worldsList = document.getElementById('worldsList');
    if (!worldsList) return;
    
    worldsList.innerHTML = '';
    
    if (game.worlds.length === 0) {
        worldsList.innerHTML = `
            <div class="world-card empty">
                <div class="world-icon">🌍</div>
                <div class="world-info">
                    <div class="world-name">No Worlds Yet</div>
                    <div class="world-details">Create your first world to start playing!</div>
                </div>
            </div>
        `;
        return;
    }
    
    game.worlds.forEach(world => {
        const lastPlayed = new Date(world.lastPlayed);
        const now = new Date();
        const diffTime = Math.abs(now - lastPlayed);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let lastPlayedText;
        if (diffDays === 0) lastPlayedText = 'Today';
        else if (diffDays === 1) lastPlayedText = 'Yesterday';
        else if (diffDays < 7) lastPlayedText = `${diffDays} days ago`;
        else lastPlayedText = lastPlayed.toLocaleDateString();
        
        const playTimeHours = Math.floor(world.playTime / 3600);
        const playTimeMinutes = Math.floor((world.playTime % 3600) / 60);
        
        const worldElement = document.createElement('div');
        worldElement.className = 'world-card';
        worldElement.dataset.id = world.id;
        
        worldElement.innerHTML = `
            <div class="world-header">
                <div class="world-icon">${getWorldIcon(world.worldType)}</div>
                <div class="world-info">
                    <div class="world-name" title="${world.name}">${world.name}</div>
                    <div class="world-details">
                        <span class="world-detail">${world.gameMode}</span>
                        <span class="world-detail">${world.difficulty}</span>
                        <span class="world-detail">${world.worldType}</span>
                    </div>
                </div>
            </div>
            <div class="world-footer">
                <div class="world-playtime">
                    ${playTimeHours}h ${playTimeMinutes}m • ${lastPlayedText}
                </div>
                <div class="world-actions">
                    <button class="btn btn-small btn-success world-play-btn">PLAY</button>
                    <button class="btn btn-small btn-secondary world-edit-btn">EDIT</button>
                    <button class="btn btn-small btn-danger world-delete-btn">DELETE</button>
                </div>
            </div>
        `;
        
        worldsList.appendChild(worldElement);
    });
}

function getWorldIcon(worldType) {
    switch(worldType) {
        case 'default': return '🌍';
        case 'flat': return '🏞️';
        case 'large_biomes': return '🌳';
        case 'amplified': return '⛰️';
        default: return '🌍';
    }
}

function createNewWorld() {
    const worldData = {
        id: Date.now(),
        name: document.getElementById('worldName').value || 'New World',
        seed: document.getElementById('worldSeed').value || Math.floor(Math.random() * 1000000).toString(),
        gameMode: document.getElementById('worldGameMode').value,
        difficulty: document.getElementById('worldDifficulty').value,
        worldType: document.getElementById('worldType').value,
        created: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        playTime: 0,
        allowCheats: document.getElementById('allowCheatsWorld').checked,
        bonusChest: document.getElementById('bonusChestWorld').checked,
        generateStructures: document.getElementById('generateStructures').checked
    };
    
    game.worlds.push(worldData);
    saveWorlds();
    renderWorldList();
    
    // Switch back to main menu
    showScreen('mainMenu');
    showNotification(`World "${worldData.name}" created!`);
}

function playWorld(worldId) {
    const world = game.worlds.find(w => w.id === worldId);
    if (!world) {
        showNotification('World not found!');
        return;
    }
    
    game.currentWorld = world;
    
    // Update last played time
    world.lastPlayed = new Date().toISOString();
    saveWorlds();
    
    // Start game
    startGame(world);
}

function deleteWorld(worldId) {
    if (!confirm('Are you sure you want to delete this world? This cannot be undone!')) {
        return;
    }
    
    const worldIndex = game.worlds.findIndex(w => w.id === worldId);
    if (worldIndex !== -1) {
        const worldName = game.worlds[worldIndex].name;
        game.worlds.splice(worldIndex, 1);
        saveWorlds();
        renderWorldList();
        showNotification(`World "${worldName}" deleted!`);
    }
}

// ===== GAME ENGINE =====
function startGame(worldData) {
    showLoadingScreen('Loading world...');
    
    // Initialize game canvas
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    // Initialize game state
    initGameState(worldData);
    
    // Setup game controls
    setupGameControls();
    
    // Generate world
    setTimeout(() => {
        generateWorld(worldData);
        
        // Initialize hotbar
        initHotbar();
        
        // Start game loop
        hideLoadingScreen();
        showScreen('gameContainer');
        game.inGame = true;
        game.running = true;
        game.session.startTime = Date.now();
        
        // Start game loop
        gameLoop(0);
        
    }, 1000);
}

function initGameState(worldData) {
    game.player = {
        position: { x: 16, y: 70, z: 16 },
        rotation: { x: 0, y: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        onGround: false,
        flying: worldData.gameMode === 'creative',
        sprinting: false,
        sneaking: false,
        health: worldData.gameMode === 'hardcore' ? 1 : 20,
        food: 20,
        experience: 0,
        level: 0
    };
    
    game.gameMode = worldData.gameMode;
    game.difficulty = worldData.difficulty;
    
    game.world = [];
    game.chunks.clear();
    game.entities = [];
    game.particles = [];
    
    // Set world seed
    Math.seedrandom(worldData.seed);
}

function generateWorld(worldData) {
    console.log('Generating world...');
    
    // Initialize world array
    game.world = new Array(CONFIG.WORLD.SIZE);
    for (let x = 0; x < CONFIG.WORLD.SIZE; x++) {
        game.world[x] = new Array(CONFIG.WORLD.SIZE);
        for (let z = 0; z < CONFIG.WORLD.SIZE; z++) {
            game.world[x][z] = new Array(CONFIG.WORLD.HEIGHT).fill(0);
        }
    }
    
    // Generate terrain based on world type
    switch (worldData.worldType) {
        case 'default':
            generateDefaultTerrain(worldData.seed);
            break;
        case 'flat':
            generateFlatTerrain();
            break;
        case 'amplified':
            generateAmplifiedTerrain(worldData.seed);
            break;
        case 'large_biomes':
            generateLargeBiomesTerrain(worldData.seed);
            break;
    }
    
    console.log('World generation complete!');
}

function generateDefaultTerrain(seed) {
    const seaLevel = CONFIG.WORLD.SEA_LEVEL;
    
    for (let x = 0; x < CONFIG.WORLD.SIZE; x++) {
        for (let z = 0; z < CONFIG.WORLD.SIZE; z++) {
            // Generate height using Perlin-like noise
            let height = seaLevel;
            
            // Base terrain
            const nx = x / CONFIG.WORLD.SIZE * 2 - 1;
            const nz = z / CONFIG.WORLD.SIZE * 2 - 1;
            let distance = Math.sqrt(nx * nx + nz * nz);
            
            // Multiple octaves of noise
            let elevation = 0;
            let frequency = 0.1;
            let amplitude = 1;
            
            for (let i = 0; i < 4; i++) {
                elevation += (Math.sin(x * frequency + seed) * Math.cos(z * frequency + seed)) * amplitude;
                frequency *= 2;
                amplitude *= 0.5;
            }
            
            height += Math.floor(elevation * 10);
            
            // Generate layers
            for (let y = 0; y < CONFIG.WORLD.HEIGHT; y++) {
                if (y < height - 5) {
                    game.world[x][z][y] = 3; // Stone
                } else if (y < height - 1) {
                    game.world[x][z][y] = 2; // Dirt
                } else if (y === height - 1) {
                    game.world[x][z][y] = 1; // Grass
                } else if (y < seaLevel) {
                    game.world[x][z][y] = 6; // Water
                }
            }
            
            // Generate trees
            if (Math.random() < 0.02 && height > seaLevel + 2) {
                generateTree(x, Math.floor(height), z);
            }
            
            // Generate sand near water
            if (height <= seaLevel + 2 && height >= seaLevel - 2) {
                game.world[x][z][Math.floor(height)] = 7; // Sand
            }
        }
    }
}

function generateFlatTerrain() {
    const groundHeight = 32;
    
    for (let x = 0; x < CONFIG.WORLD.SIZE; x++) {
        for (let z = 0; z < CONFIG.WORLD.SIZE; z++) {
            for (let y = 0; y < CONFIG.WORLD.HEIGHT; y++) {
                if (y < groundHeight - 4) {
                    game.world[x][z][y] = 3; // Stone
                } else if (y < groundHeight) {
                    game.world[x][z][y] = 2; // Dirt
                } else if (y === groundHeight) {
                    game.world[x][z][y] = 1; // Grass
                }
            }
        }
    }
}

function generateTree(x, y, z) {
    // Tree trunk (4-6 blocks high)
    const trunkHeight = 4 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < trunkHeight; i++) {
        const ny = y + i;
        if (ny < CONFIG.WORLD.HEIGHT) {
            setBlock(x, ny, z, 4); // Wood
        }
    }
    
    // Leaves (simple cross shape)
    const topY = y + trunkHeight;
    const leafRadius = 2;
    
    for (let dx = -leafRadius; dx <= leafRadius; dx++) {
        for (let dz = -leafRadius; dz <= leafRadius; dz++) {
            for (let dy = -leafRadius; dy <= leafRadius; dy++) {
                // Simple sphere check
                if (dx*dx + dz*dz + dy*dy <= leafRadius*leafRadius) {
                    const nx = x + dx;
                    const ny = topY + dy;
                    const nz = z + dz;
                    
                    if (getBlock(nx, ny, nz) === 0) {
                        setBlock(nx, ny, nz, 5); // Leaves
                    }
                }
            }
        }
    }
}

// ===== BLOCK MANAGEMENT =====
function getBlock(x, y, z) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    
    if (ix < 0 || ix >= CONFIG.WORLD.SIZE || 
        iy < 0 || iy >= CONFIG.WORLD.HEIGHT || 
        iz < 0 || iz >= CONFIG.WORLD.SIZE) {
        return 0;
    }
    
    return game.world[ix][iz][iy] || 0;
}

function setBlock(x, y, z, type) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    
    if (ix >= 0 && ix < CONFIG.WORLD.SIZE && 
        iy >= 0 && iy < CONFIG.WORLD.HEIGHT && 
        iz >= 0 && iz < CONFIG.WORLD.SIZE) {
        
        const oldType = game.world[ix][iz][iy];
        game.world[ix][iz][iy] = type;
        
        // Update statistics
        if (type === 0) {
            game.stats.blocksMined++;
            game.session.blocksMined++;
        } else {
            game.stats.blocksPlaced++;
            game.session.blocksPlaced++;
        }
        
        // Play sound
        playSound(type === 0 ? 'break' : 'place');
        
        // Create particles
        createBlockParticles(ix, iy, iz, oldType);
    }
}

// ===== GAME LOOP =====
function gameLoop(currentTime) {
    // Calculate delta time
    game.deltaTime = Math.min(currentTime - game.lastTime, 100) / 16.67;
    game.lastTime = currentTime;
    
    // Calculate FPS
    game.frameCount++;
    if (game.frameCount % 60 === 0) {
        game.fps = Math.round(1000 / (currentTime - game.lastFrameTime) * 60);
        game.lastFrameTime = currentTime;
    }
    
    // Update canvas size
    resizeCanvas();
    
    // Update game logic if not paused
    if (!game.paused && game.running) {
        update(game.deltaTime);
    }
    
    // Render game
    render();
    
    // Update UI
    updateGameUI();
    
    // Limit FPS
    const frameInterval = 1000 / game.maxFps;
    const elapsed = currentTime - game.lastFrameTime;
    
    // Continue loop
    if (game.running) {
        if (elapsed > frameInterval) {
            game.lastFrameTime = currentTime - (elapsed % frameInterval);
            requestAnimationFrame(gameLoop);
        } else {
            setTimeout(() => {
                requestAnimationFrame(gameLoop);
            }, frameInterval - elapsed);
        }
    }
}

function update(deltaTime) {
    // Update player movement
    updatePlayerMovement(deltaTime);
    
    // Update time of day
    if (CONFIG.GAME.DAY_NIGHT_CYCLE) {
        game.timeOfDay = (game.timeOfDay + deltaTime * 20) % 24000;
    }
    
    // Update particles
    updateParticles(deltaTime);
    
    // Update statistics
    updateStatistics();
    
    // Update session play time
    game.stats.playTime += deltaTime / 60;
}

function updatePlayerMovement(deltaTime) {
    const player = game.player;
    
    // Calculate movement from joystick
    let moveX = 0;
    let moveZ = 0;
    
    if (game.touch.joystick.active) {
        moveX = game.touch.joystick.x;
        moveZ = game.touch.joystick.y;
    }
    
    // Calculate speed based on player state
    let speed = CONFIG.PLAYER.SPEED.WALKING;
    if (player.sprinting) speed = CONFIG.PLAYER.SPEED.SPRINTING;
    if (player.sneaking) speed = CONFIG.PLAYER.SPEED.SNEAKING;
    if (player.flying) speed = CONFIG.PLAYER.SPEED.FLYING;
    
    // Calculate movement direction
    const forward = Math.sin(player.rotation.y);
    const right = Math.cos(player.rotation.y);
    
    // Apply movement
    const moveDirX = moveX * right + moveZ * forward;
    const moveDirZ = moveX * -forward + moveZ * right;
    
    // Normalize movement
    const moveLength = Math.sqrt(moveDirX * moveDirX + moveDirZ * moveDirZ);
    if (moveLength > 0) {
        player.velocity.x = (moveDirX / moveLength) * speed;
        player.velocity.z = (moveDirZ / moveLength) * speed;
        
        // Update distance walked
        game.session.distanceWalked += speed * deltaTime;
        game.stats.distanceWalked += speed * deltaTime;
    } else {
        player.velocity.x = 0;
        player.velocity.z = 0;
    }
    
    // Apply gravity if not flying
    if (!player.flying) {
        player.velocity.y -= CONFIG.PLAYER.GRAVITY;
    }
    
    // Update position with collision
    updatePlayerPosition(deltaTime);
}

function updatePlayerPosition(deltaTime) {
    const player = game.player;
    
    // Try X movement
    const newX = player.position.x + player.velocity.x * deltaTime;
    if (!checkCollision(newX, player.position.y, player.position.z)) {
        player.position.x = newX;
    } else {
        player.velocity.x = 0;
    }
    
    // Try Z movement
    const newZ = player.position.z + player.velocity.z * deltaTime;
    if (!checkCollision(player.position.x, player.position.y, newZ)) {
        player.position.z = newZ;
    } else {
        player.velocity.z = 0;
    }
    
    // Try Y movement
    const newY = player.position.y + player.velocity.y * deltaTime;
    if (!checkCollision(player.position.x, newY, player.position.z)) {
        player.position.y = newY;
        player.onGround = false;
    } else {
        // Hit ground or ceiling
        if (player.velocity.y < 0) {
            player.onGround = true;
        }
        player.velocity.y = 0;
    }
    
    // Keep player in world bounds
    player.position.x = Math.max(0.5, Math.min(CONFIG.WORLD.SIZE - 0.5, player.position.x));
    player.position.y = Math.max(0, Math.min(CONFIG.WORLD.HEIGHT - CONFIG.PLAYER.HEIGHT, player.position.y));
    player.position.z = Math.max(0.5, Math.min(CONFIG.WORLD.SIZE - 0.5, player.position.z));
}

function checkCollision(x, y, z) {
    const playerRadius = CONFIG.PLAYER.RADIUS;
    const playerHeight = CONFIG.PLAYER.HEIGHT;
    
    // Check collision with blocks in player's bounding box
    const minX = Math.floor(x - playerRadius);
    const maxX = Math.ceil(x + playerRadius);
    const minY = Math.floor(y);
    const maxY = Math.ceil(y + playerHeight);
    const minZ = Math.floor(z - playerRadius);
    const maxZ = Math.ceil(z + playerRadius);
    
    for (let bx = minX; bx <= maxX; bx++) {
        for (let by = minY; by <= maxY; by++) {
            for (let bz = minZ; bz <= maxZ; bz++) {
                const block = getBlock(bx, by, bz);
                if (block !== 0 && CONFIG.BLOCK_TYPES[block].solid) {
                    // Simple AABB collision
                    const blockCenterX = bx + 0.5;
                    const blockCenterY = by + 0.5;
                    const blockCenterZ = bz + 0.5;
                    
                    const dx = Math.abs(x - blockCenterX) - (0.5 + playerRadius);
                    const dy = Math.abs(y - blockCenterY) - (0.5 + playerHeight/2);
                    const dz = Math.abs(z - blockCenterZ) - (0.5 + playerRadius);
                    
                    if (dx < 0 && dy < 0 && dz < 0) {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

// ===== RENDERING =====
function render() {
    if (!game.ctx || !game.canvas) return;
    
    const ctx = game.ctx;
    const width = game.canvas.width;
    const height = game.canvas.height;
    
    // Clear canvas with sky color
    const skyColor = getSkyColor();
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, width, height);
    
    // Simple rendering for now - draw blocks as colored squares
    drawSimpleWorld(ctx, width, height);
    
    // Draw crosshair
    drawCrosshair(ctx, width, height);
}

function drawSimpleWorld(ctx, width, height) {
    const player = game.player;
    const centerX = width / 2;
    const centerY = height / 2;
    const blockSize = 20;
    const renderDistance = CONFIG.GRAPHICS.RENDER_DISTANCE;
    
    // Collect visible blocks
    const visibleBlocks = [];
    
    const minX = Math.max(0, Math.floor(player.position.x - renderDistance));
    const maxX = Math.min(CONFIG.WORLD.SIZE - 1, Math.ceil(player.position.x + renderDistance));
    const minZ = Math.max(0, Math.floor(player.position.z - renderDistance));
    const maxZ = Math.min(CONFIG.WORLD.SIZE - 1, Math.ceil(player.position.z + renderDistance));
    
    for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
            for (let y = 0; y < CONFIG.WORLD.HEIGHT; y++) {
                const block = getBlock(x, y, z);
                if (block !== 0) {
                    const dist = Math.sqrt(
                        Math.pow(x - player.position.x, 2) + 
                        Math.pow(z - player.position.z, 2)
                    );
                    
                    if (dist < renderDistance) {
                        visibleBlocks.push({ x, y, z, block, dist });
                    }
                }
            }
        }
    }
    
    // Sort by distance (painter's algorithm)
    visibleBlocks.sort((a, b) => b.dist - a.dist);
    
    // Draw blocks
    visibleBlocks.forEach(b => {
        // Simple 3D projection
        const dx = b.x - player.position.x;
        const dz = b.z - player.position.z;
        
        // Rotate based on player rotation
        const rotatedX = dx * Math.cos(player.rotation.y) - dz * Math.sin(player.rotation.y);
        const rotatedZ = dx * Math.sin(player.rotation.y) + dz * Math.cos(player.rotation.y);
        
        // Perspective projection
        const scale = 200 / (rotatedZ + 5);
        const screenX = centerX + rotatedX * scale;
        const screenY = centerY - (b.y - player.position.y) * scale;
        
        if (rotatedZ > 0) {
            const size = blockSize * scale;
            const blockInfo = CONFIG.BLOCK_TYPES[b.block];
            
            if (blockInfo.alpha) {
                ctx.globalAlpha = blockInfo.alpha;
            }
            
            ctx.fillStyle = blockInfo.color;
            ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
            
            // Draw outline
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);
            
            // Highlight selected block
            const target = rayCast();
            if (target && target.x === b.x && target.y === b.y && target.z === b.z) {
                ctx.strokeStyle = '#FF0';
                ctx.lineWidth = 3;
                ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);
            }
        }
    });
}

function getSkyColor() {
    const time = game.timeOfDay;
    
    // Calculate sun position
    const sunAngle = (time / 24000) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    
    // Interpolate between day and night colors
    let r, g, b;
    
    if (sunHeight > 0) {
        // Day
        const t = sunHeight;
        r = Math.floor(135 * t + 30 * (1 - t));
        g = Math.floor(206 * t + 30 * (1 - t));
        b = Math.floor(235 * t + 80 * (1 - t));
    } else {
        // Night
        const t = Math.abs(sunHeight);
        r = Math.floor(30 * t + 10 * (1 - t));
        g = Math.floor(30 * t + 10 * (1 - t));
        b = Math.floor(80 * t + 30 * (1 - t));
    }
    
    return `rgb(${r}, ${g}, ${b})`;
}

function drawCrosshair(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = 20;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    
    // Draw cross
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX - 5, centerY);
    ctx.moveTo(centerX + 5, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY - 5);
    ctx.moveTo(centerX, centerY + 5);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();
}

// ===== UI UPDATES =====
function updateGameUI() {
    if (!game.inGame) return;
    
    // Update position display
    const pos = game.player.position;
    document.getElementById('posText').textContent = 
        `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
    
    // Update block info
    const target = rayCast();
    document.getElementById('blockText').textContent = 
        target ? CONFIG.BLOCK_TYPES[target.block].name : 'Air';
    
    // Update FPS
    document.getElementById('fpsText').textContent = Math.round(game.fps);
    
    // Update time display
    const time = game.timeOfDay;
    let timeText = 'Day';
    if (time > 13000 && time < 23000) timeText = 'Night';
    document.getElementById('timeText').textContent = timeText;
    
    // Update health and food
    const healthFill = document.getElementById('healthFill');
    const foodFill = document.getElementById('foodFill');
    const healthText = document.getElementById('healthText');
    const foodText = document.getElementById('foodText');
    
    if (healthFill) healthFill.style.width = (game.player.health / 20 * 100) + '%';
    if (foodFill) foodFill.style.width = (game.player.food / 20 * 100) + '%';
    if (healthText) healthText.textContent = Math.round(game.player.health);
    if (foodText) foodText.textContent = Math.round(game.player.food);
    
    // Update experience
    const expFill = document.getElementById('expFill');
    const expText = document.getElementById('expText');
    if (expFill) expFill.style.width = ((game.player.experience % 100) / 100 * 100) + '%';
    if (expText) expText.textContent = `Level ${Math.floor(game.player.experience / 100)}`;
    
    // Update current world info in pause menu
    if (game.currentWorld) {
        document.getElementById('currentWorldName').textContent = game.currentWorld.name;
        const playTime = Math.floor(game.currentWorld.playTime / 60);
        document.getElementById('currentWorldTime').textContent = `${playTime}m`;
    }
}

function initHotbar() {
    const hotbarSlots = document.querySelector('.hotbar-slots');
    if (!hotbarSlots) return;
    
    hotbarSlots.innerHTML = '';
    
    game.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'hotbar-slot';
        slot.dataset.index = index;
        slot.dataset.block = item.type;
        
        const blockInfo = CONFIG.BLOCK_TYPES[item.type];
        slot.innerHTML = `
            <div class="block-icon" style="background-color: ${blockInfo.color};"></div>
            ${game.gameMode === 'survival' ? `<div class="slot-count">${item.count}</div>` : ''}
        `;
        
        hotbarSlots.appendChild(slot);
    });
    
    // Set initial selection
    updateHotbarSelection();
}

function updateHotbarSelection() {
    const slots = document.querySelectorAll('.hotbar-slot');
    const selection = document.getElementById('hotbarSelection');
    
    slots.forEach((slot, index) => {
        if (index === game.selectedSlot) {
            slot.classList.add('selected');
            if (selection) {
                selection.style.left = (slot.offsetLeft - 5) + 'px';
            }
        } else {
            slot.classList.remove('selected');
        }
    });
    
    // Update selected block
    if (game.inventory[game.selectedSlot]) {
        game.selectedBlock = game.inventory[game.selectedSlot].type;
    }
}

// ===== RAY CASTING =====
function rayCast(maxDistance = CONFIG.PLAYER.REACH_DISTANCE, step = 0.1) {
    const player = game.player;
    const pos = player.position;
    const rot = player.rotation;
    
    const direction = {
        x: Math.sin(rot.y) * Math.cos(rot.x),
        y: -Math.sin(rot.x),
        z: Math.cos(rot.y) * Math.cos(rot.x)
    };
    
    let currentPos = { x: pos.x, y: pos.y + CONFIG.PLAYER.EYE_HEIGHT, z: pos.z };
    
    for (let distance = 0; distance < maxDistance; distance += step) {
        currentPos.x = pos.x + direction.x * distance;
        currentPos.y = pos.y + direction.y * distance + CONFIG.PLAYER.EYE_HEIGHT;
        currentPos.z = pos.z + direction.z * distance;
        
        const blockX = Math.floor(currentPos.x);
        const blockY = Math.floor(currentPos.y);
        const blockZ = Math.floor(currentPos.z);
        
        const block = getBlock(blockX, blockY, blockZ);
        
        if (block !== 0) {
            return {
                x: blockX,
                y: blockY,
                z: blockZ,
                block: block,
                distance: distance
            };
        }
    }
    
    return null;
}

// ===== EVENT HANDLERS =====
function setupEventListeners() {
    // Main Menu
    document.getElementById('createWorldBtn').addEventListener('click', () => showScreen('createWorldMenu'));
    document.getElementById('optionsBtn').addEventListener('click', () => showScreen('optionsMenu'));
    document.getElementById('multiplayerBtn').addEventListener('click', () => showScreen('multiplayerMenu'));
    document.getElementById('quitBtn').addEventListener('click', confirmQuit);
    
    // Options Menu
    document.getElementById('backBtn').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('doneOptionsBtn').addEventListener('click', saveAndBack);
    document.getElementById('saveOptionsBtn').addEventListener('click', saveOptions);
    document.getElementById('resetOptionsBtn').addEventListener('click', resetOptions);
    
    // Create World Menu
    document.getElementById('backToMenuBtn').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('createWorldConfirmBtn').addEventListener('click', createNewWorld);
    document.getElementById('cancelCreateBtn').addEventListener('click', () => showScreen('mainMenu'));
    
    // Multiplayer Menu
    document.getElementById('backToMainMultiBtn').addEventListener('click', () => showScreen('mainMenu'));
    
    // World creation form updates
    const formIds = ['worldName', 'worldSeed', 'worldGameMode', 'worldDifficulty', 'worldType'];
    formIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', drawWorldPreview);
            element.addEventListener('change', drawWorldPreview);
        }
    });
    
    // Options sliders
    setupOptionSliders();
    
    // World list delegation
    document.getElementById('worldsList').addEventListener('click', handleWorldListClick);
    
    // Window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Prevent context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function setupGameControls() {
    // Joystick
    const joystick = document.getElementById('joystickLeft');
    if (joystick) {
        joystick.addEventListener('touchstart', handleJoystickStart);
        joystick.addEventListener('touchmove', handleJoystickMove);
        joystick.addEventListener('touchend', handleJoystickEnd);
    }
    
    // Look area
    const lookArea = document.getElementById('lookArea');
    if (lookArea) {
        lookArea.addEventListener('touchstart', handleLookStart);
        lookArea.addEventListener('touchmove', handleLookMove);
        lookArea.addEventListener('touchend', handleLookEnd);
    }
    
    // Action buttons
    document.getElementById('jumpBtn').addEventListener('touchstart', handleJump);
    document.getElementById('breakBtn').addEventListener('touchstart', breakBlock);
    document.getElementById('placeBtn').addEventListener('touchstart', placeBlock);
    document.getElementById('pauseBtn').addEventListener('touchstart', togglePause);
    document.getElementById('debugBtn').addEventListener('touchstart', toggleDebug);
    
    // Hotbar
    const hotbar = document.querySelector('.hotbar-slots');
    if (hotbar) {
        hotbar.addEventListener('click', handleHotbarClick);
    }
    
    // In-game menu
    document.getElementById('resumeGameBtn').addEventListener('click', togglePause);
    document.getElementById('optionsInGameBtn').addEventListener('click', showOptionsInGame);
    document.getElementById('saveAndQuitBtn').addEventListener('click', saveAndQuit);
    document.getElementById('quitToDesktopBtn').addEventListener('click', confirmQuit);
    
    // Debug panel
    document.getElementById('closeDebug').addEventListener('click', toggleDebug);
}

function handleWorldListClick(e) {
    const worldCard = e.target.closest('.world-card');
    if (!worldCard) return;
    
    const worldId = parseInt(worldCard.dataset.id);
    
    if (e.target.classList.contains('world-play-btn')) {
        playWorld(worldId);
    } else if (e.target.classList.contains('world-delete-btn')) {
        deleteWorld(worldId);
    } else if (e.target.classList.contains('world-edit-btn')) {
        // TODO: Implement world editing
        showNotification('World editing coming soon!');
    } else {
        // Clicked on world card itself
        playWorld(worldId);
    }
}

function setupOptionSliders() {
    // Graphics
    document.getElementById('renderDistance').addEventListener('input', function() {
        document.getElementById('renderDistanceValue').textContent = this.value + ' chunks';
    });
    
    document.getElementById('maxFps').addEventListener('input', function() {
        document.getElementById('maxFpsValue').textContent = this.value;
    });
    
    // Controls
    document.getElementById('sensitivity').addEventListener('input', function() {
        document.getElementById('sensitivityValue').textContent = this.value;
    });
    
    // Audio
    document.getElementById('masterVolume').addEventListener('input', function() {
        document.getElementById('masterVolumeValue').textContent = this.value + '%';
    });
    
    document.getElementById('musicVolume').addEventListener('input', function() {
        document.getElementById('musicVolumeValue').textContent = this.value + '%';
    });
    
    document.getElementById('sfxVolume').addEventListener('input', function() {
        document.getElementById('sfxVolumeValue').textContent = this.value + '%';
    });
}

// ===== TOUCH CONTROLS =====
function handleJoystickStart(e) {
    game.touch.joystick.active = true;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    
    game.touch.joystick.startX = touch.clientX;
    game.touch.joystick.startY = touch.clientY;
    
    updateJoystick(touch);
    e.preventDefault();
}

function handleJoystickMove(e) {
    if (game.touch.joystick.active) {
        updateJoystick(e.touches[0]);
        e.preventDefault();
    }
}

function handleJoystickEnd() {
    game.touch.joystick.active = false;
    game.touch.joystick.x = 0;
    game.touch.joystick.y = 0;
    
    const handle = document.getElementById('joystickHandle');
    if (handle) {
        handle.style.transform = 'translate(-50%, -50%)';
    }
}

function updateJoystick(touch) {
    const joystick = document.getElementById('joystickLeft');
    const handle = document.getElementById('joystickHandle');
    if (!joystick || !handle) return;
    
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDist = rect.width / 3;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
    }
    
    // Update visual handle
    const handleX = (dx / maxDist) * 50;
    const handleY = (dy / maxDist) * 50;
    handle.style.transform = `translate(calc(-50% + ${handleX}%), calc(-50% + ${handleY}%))`;
    
    // Normalize values
    game.touch.joystick.x = dx / maxDist;
    game.touch.joystick.y = dy / maxDist;
}

function handleLookStart(e) {
    game.touch.look.active = true;
    const touch = e.touches[0];
    
    game.touch.look.startX = touch.clientX;
    game.touch.look.startY = touch.clientY;
    
    e.preventDefault();
}

function handleLookMove(e) {
    if (game.touch.look.active && game.inGame && !game.paused) {
        const touch = e.touches[0];
        const sensitivity = CONFIG.CONTROLS.SENSITIVITY / 500;
        
        let dx = (touch.clientX - game.touch.look.startX) * sensitivity;
        let dy = (touch.clientY - game.touch.look.startY) * sensitivity;
        
        if (CONFIG.CONTROLS.INVERT_Y) {
            dy = -dy;
        }
        
        game.player.rotation.y += dx;
        game.player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, game.player.rotation.x + dy));
        
        game.touch.look.startX = touch.clientX;
        game.touch.look.startY = touch.clientY;
        
        e.preventDefault();
    }
}

function handleLookEnd() {
    game.touch.look.active = false;
}

function handleJump() {
    if (game.inGame && !game.paused) {
        if (game.player.onGround || game.player.flying) {
            game.player.velocity.y = CONFIG.PLAYER.JUMP_FORCE;
            playSound('jump');
        }
    }
}

function breakBlock() {
    if (game.inGame && !game.paused) {
        const target = rayCast();
        if (target && target.block !== 0) {
            setBlock(target.x, target.y, target.z, 0);
        }
    }
}

function placeBlock() {
    if (game.inGame && !game.paused) {
        const target = rayCast();
        if (target) {
            // Calculate placement position
            const dir = {
                x: Math.sin(game.player.rotation.y) * Math.cos(game.player.rotation.x),
                y: -Math.sin(game.player.rotation.x),
                z: Math.cos(game.player.rotation.y) * Math.cos(game.player.rotation.x)
            };
            
            const placeX = target.x + Math.sign(dir.x);
            const placeY = target.y + Math.sign(dir.y);
            const placeZ = target.z + Math.sign(dir.z);
            
            if (getBlock(placeX, placeY, placeZ) === 0) {
                setBlock(placeX, placeY, placeZ, game.selectedBlock);
            }
        }
    }
}

function handleHotbarClick(e) {
    const slot = e.target.closest('.hotbar-slot');
    if (slot) {
        const index = parseInt(slot.dataset.index);
        game.selectedSlot = index;
        updateHotbarSelection();
    }
}

// ===== KEYBOARD CONTROLS =====
function handleKeyDown(e) {
    game.keys.add(e.key.toLowerCase());
    
    switch (e.key.toLowerCase()) {
        case 'escape':
            if (game.inGame) togglePause();
            break;
        case 'f3':
            toggleDebug();
            break;
        case 'w':
            game.touch.joystick.y = -1;
            break;
        case 's':
            game.touch.joystick.y = 1;
            break;
        case 'a':
            game.touch.joystick.x = -1;
            break;
        case 'd':
            game.touch.joystick.x = 1;
            break;
        case ' ':
            handleJump();
            break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            const index = parseInt(e.key) - 1;
            if (index < game.inventory.length) {
                game.selectedSlot = index;
                updateHotbarSelection();
            }
            break;
    }
}

function handleKeyUp(e) {
    game.keys.delete(e.key.toLowerCase());
    
    switch (e.key.toLowerCase()) {
        case 'w':
        case 's':
            game.touch.joystick.y = 0;
            break;
        case 'a':
        case 'd':
            game.touch.joystick.x = 0;
            break;
    }
}

// ===== GAME MANAGEMENT =====
function togglePause() {
    if (!game.inGame) return;
    
    game.paused = !game.paused;
    const menu = document.getElementById('ingameMenu');
    
    if (game.paused) {
        menu.style.display = 'flex';
        updateStatistics();
    } else {
        menu.style.display = 'none';
    }
}

function toggleDebug() {
    const panel = document.getElementById('debugPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    
    if (panel.style.display === 'block') {
        updateDebugInfo();
    }
}

function updateDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;
    
    const player = game.player;
    const info = `
Game: Minecraft Mobile v${CONFIG.VERSION}
FPS: ${Math.round(game.fps)} (Target: ${CONFIG.GRAPHICS.MAX_FPS})

Player:
  Position: ${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)}, ${player.position.z.toFixed(2)}
  Rotation: ${(player.rotation.x * 180/Math.PI).toFixed(1)}°, ${(player.rotation.y * 180/Math.PI).toFixed(1)}°
  Velocity: ${player.velocity.x.toFixed(2)}, ${player.velocity.y.toFixed(2)}, ${player.velocity.z.toFixed(2)}
  Health: ${player.health} Food: ${player.food}
  Mode: ${game.gameMode} Flying: ${player.flying}

World:
  Size: ${CONFIG.WORLD.SIZE}x${CONFIG.WORLD.HEIGHT}x${CONFIG.WORLD.SIZE}
  Time: ${game.timeOfDay} (${game.timeOfDay < 13000 ? 'Day' : 'Night'})
  Weather: ${game.weather}

Render:
  Distance: ${CONFIG.GRAPHICS.RENDER_DISTANCE} chunks
  Quality: ${CONFIG.GRAPHICS.QUALITY}
  Particles: ${CONFIG.GRAPHICS.PARTICLES ? 'On' : 'Off'}

Memory: ${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 'N/A'}MB
    `.trim();
    
    debugInfo.textContent = info;
}

function saveAndQuit() {
    if (game.currentWorld) {
        // Update world play time
        const sessionTime = (Date.now() - game.session.startTime) / 1000;
        game.currentWorld.playTime += sessionTime;
        game.stats.playTime += sessionTime;
        
        saveGameData();
        saveWorlds();
    }
    
    // Return to main menu
    showScreen('mainMenu');
    game.inGame = false;
    game.running = false;
    game.paused = false;
    
    // Update statistics display
    updateStatistics();
}

function confirmQuit() {
    if (confirm('Are you sure you want to quit?')) {
        if (game.inGame) {
            saveAndQuit();
        } else {
            // Close window or show quit message
            if (typeof navigator !== 'undefined' && navigator.app) {
                navigator.app.exitApp();
            } else {
                showNotification('Thanks for playing!');
            }
        }
    }
}

// ===== OPTIONS MANAGEMENT =====
function saveOptions() {
    // Graphics
    CONFIG.GRAPHICS.RENDER_DISTANCE = parseInt(document.getElementById('renderDistance').value);
    CONFIG.GRAPHICS.MAX_FPS = parseInt(document.getElementById('maxFps').value);
    game.maxFps = CONFIG.GRAPHICS.MAX_FPS;
    
    CONFIG.GRAPHICS.QUALITY = document.getElementById('graphicsQuality').value;
    CONFIG.GRAPHICS.PARTICLES = document.getElementById('particles').value !== 'minimal';
    
    // Game
    CONFIG.GAME.DIFFICULTY = document.getElementById('difficulty').value;
    CONFIG.GAME.MODE = document.getElementById('gameMode').value;
    CONFIG.GAME.DAY_NIGHT_CYCLE = document.getElementById('dayNightCycle').checked;
    
    // Controls
    CONFIG.CONTROLS.SENSITIVITY = parseInt(document.getElementById('sensitivity').value);
    CONFIG.CONTROLS.INVERT_Y = document.getElementById('invertY').checked;
    CONFIG.CONTROLS.AUTO_JUMP = document.getElementById('autoJump').checked;
    CONFIG.CONTROLS.VIBRATION = document.getElementById('vibration').checked;
    CONFIG.CONTROLS.TOUCH_SIZE = document.getElementById('touchSize').value;
    
    // Audio
    CONFIG.AUDIO.MASTER_VOLUME = parseInt(document.getElementById('masterVolume').value) / 100;
    CONFIG.AUDIO.MUSIC_VOLUME = parseInt(document.getElementById('musicVolume').value) / 100;
    CONFIG.AUDIO.SFX_VOLUME = parseInt(document.getElementById('sfxVolume').value) / 100;
    CONFIG.AUDIO.BACKGROUND_MUSIC = document.getElementById('backgroundMusic').checked;
    
    // Apply changes
    updateTouchControlsSize();
    
    // Save to localStorage
    saveGameData();
    
    showNotification('Options saved!');
}

function resetOptions() {
    if (confirm('Reset all options to defaults?')) {
        // Reset CONFIG to original values
        CONFIG.GRAPHICS.RENDER_DISTANCE = 8;
        CONFIG.GRAPHICS.MAX_FPS = 60;
        CONFIG.GRAPHICS.QUALITY = 'fancy';
        CONFIG.GRAPHICS.PARTICLES = true;
        
        CONFIG.GAME.DIFFICULTY = 'normal';
        CONFIG.GAME.MODE = 'survival';
        CONFIG.GAME.DAY_NIGHT_CYCLE = true;
        
        CONFIG.CONTROLS.SENSITIVITY = 5;
        CONFIG.CONTROLS.INVERT_Y = false;
        CONFIG.CONTROLS.AUTO_JUMP = true;
        CONFIG.CONTROLS.VIBRATION = true;
        CONFIG.CONTROLS.TOUCH_SIZE = 'normal';
        
        CONFIG.AUDIO.MASTER_VOLUME = 0.7;
        CONFIG.AUDIO.MUSIC_VOLUME = 0.5;
        CONFIG.AUDIO.SFX_VOLUME = 0.8;
        CONFIG.AUDIO.BACKGROUND_MUSIC = true;
        
        // Update UI
        updateOptionSliders();
        updateTouchControlsSize();
        
        showNotification('Options reset to defaults!');
    }
}

function saveAndBack() {
    saveOptions();
    showScreen('mainMenu');
}

function showOptionsInGame() {
    document.getElementById('ingameMenu').style.display = 'none';
    showScreen('optionsMenu');
}

// ===== UTILITY FUNCTIONS =====
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'block';
    }
}

function showLoadingScreen(text) {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingText = document.getElementById('loadingText');
    
    if (loadingScreen && loadingText) {
        loadingText.textContent = text;
        loadingScreen.style.display = 'flex';
        game.loading = true;
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        game.loading = false;
    }
}

function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
        progressFill.style.width = percent + '%';
        progressText.textContent = Math.round(percent) + '%';
    }
}

function showNotification(message, duration = 3000) {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    notificationArea.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
}

function resizeCanvas() {
    if (!game.canvas) return;
    
    const container = document.getElementById('gameContainer');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Only resize if dimensions changed
    if (game.canvas.width !== width || game.canvas.height !== height) {
        game.canvas.width = width;
        game.canvas.height = height;
        console.log(`Canvas resized to ${width}x${height}`);
    }
}

// ===== AUDIO SYSTEM =====
function initAudio() {
    try {
        game.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create sound effects
        createSound('break', 0.2, 300, 'sawtooth');
        createSound('place', 0.1, 200, 'sine');
        createSound('jump', 0.15, 150, 'sine');
        createSound('step', 0.05, 100, 'square');
        
        console.log('Audio system initialized');
    } catch (e) {
        console.warn('Web Audio API not supported:', e);
    }
}

function createSound(name, duration, frequency, type) {
    if (!game.audioContext) return;
    
    const oscillator = game.audioContext.createOscillator();
    const gainNode = game.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(game.audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(CONFIG.AUDIO.SFX_VOLUME * CONFIG.AUDIO.MASTER_VOLUME, game.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, game.audioContext.currentTime + duration);
    
    game.sounds.set(name, { oscillator, gainNode, duration });
}

function playSound(name) {
    if (!game.audioContext || !game.sounds.has(name) || CONFIG.AUDIO.MASTER_VOLUME === 0) return;
    
    try {
        const sound = game.sounds.get(name);
        sound.oscillator.start();
        sound.oscillator.stop(game.audioContext.currentTime + sound.duration);
    } catch (e) {
        console.warn('Failed to play sound:', e);
    }
}

// ===== PARTICLE SYSTEM =====
function createBlockParticles(x, y, z, blockType) {
    if (!CONFIG.GRAPHICS.PARTICLES) return;
    
    const particleCount = 8;
    const color = CONFIG.BLOCK_TYPES[blockType]?.color || '#FFFFFF';
    
    for (let i = 0; i < particleCount; i++) {
        game.particles.push({
            x: x + 0.5,
            y: y + 0.5,
            z: z + 0.5,
            vx: (Math.random() - 0.5) * 0.2,
            vy: Math.random() * 0.3,
            vz: (Math.random() - 0.5) * 0.2,
            color: color,
            size: 0.1 + Math.random() * 0.1,
            life: 1.0,
            maxLife: 1.0,
            gravity: 0.02
        });
    }
}

function updateParticles(deltaTime) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        
        // Update position
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.z += p.vz * deltaTime;
        
        // Apply gravity
        p.vy -= p.gravity * deltaTime;
        
        // Update life
        p.life -= 0.02 * deltaTime;
        
        // Remove dead particles
        if (p.life <= 0) {
            game.particles.splice(i, 1);
        }
    }
}

// ===== START GAME =====
// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.game = game;
window.CONFIG = CONFIG;