// --- 1. Initialize Supabase ---
const supabaseUrl = 'https://wmfgxdrpexgruhdzftjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmd4ZHJwZXhncnVoZHpmdGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODc1OTMsImV4cCI6MjA5OTg2MzU5M30.RedQWi1GQ_BOsOio5Gr73SugzZFYkSB4M9egFx5lKto';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. Assets & Fun Facts ---
const teamLogos = {
    "T1": "https://joel-shine.github.io/EL-LEAGUE/logos/thunderbolts.png", 
    "T2": "https://joel-shine.github.io/EL-LEAGUE/logos/genesis.png",
    "T3": "https://joel-shine.github.io/EL-LEAGUE/logos/titans.png", 
    "T4": "https://joel-shine.github.io/EL-LEAGUE/logos/blazes.png"
};

const playerImages = {
    "P1": "bharath.jpg", "P2": "madhav.jpg",
    "P3": "joel.jpg",   "P4": "alok.jpg",
    "P5": "niranjan.jpg", "P6": "evan.jpg",
    "P7": "gautham.jpg", "P8": "ghosh.jpg"
};

const playerBios = {
    "P3": "No dribbles required—just elite rim protection and a lethal jumper when you least expect it.",
    "P4": "Pure athletic menace. If he doesn't steal your pass, he's pinning your shot to the glass.",
    "P1": "An absolute blur in transition with a picture-perfect jumper and endless stamina.",
    "P2": "The undisputed final boss. Elite at everything, with an unblockable three-point sniper rifle.",
    "P5": "The EL batch's Kyrie. Putting defenders on skates and draining heavily contested buckets.",
    "P6": "Fueled by pure passion for the game—when he finally locks in, you're dealing with a legend.",
    "P7": "The ultimate catch-and-shoot cheat code. Feed him the rock, and put three on the board.",
    "P8": "The absolute god of playmaking; an athletic freight train with eyes in the back of his head."
};

let appData = { teams: {}, players: {} };
let sessionStats = {}; // NEW: Tracks only the current game on the screen

// --- 3. Authentication & Sessions ---
const authElements = {
    email: document.getElementById('admin-email'),
    pass: document.getElementById('admin-password'),
    login: document.getElementById('real-login-btn'),
    logout: document.getElementById('logout-btn'),
    admin: document.getElementById('admin-zone'),
    live: document.getElementById('live-scorer-dashboard')
};

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) showAdminPanel();
}

authElements.login.addEventListener('click', async () => {
    const email = authElements.email.value;
    const pass = authElements.pass.value;
    if (!email || !pass) return alert("Enter email and password!");
    
    authElements.login.innerText = "Loading...";
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });

    if (error) {
        alert("Login failed: " + error.message);
        authElements.login.innerText = "Login";
    } else {
        showAdminPanel();
    }
});

authElements.logout.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    location.reload(); 
});

function showAdminPanel() {
    authElements.admin.style.display = "flex";
    authElements.logout.style.display = "block";
    authElements.login.style.display = "none";
    authElements.email.style.display = "none";
    authElements.pass.style.display = "none";
    
    initSessionStats(); // Set the board to 0
    renderLiveScorer(); 
}

// --- 4. Fetch & Public Rendering ---
async function fetchLeagueData() {
    try {
        const { data: teams } = await supabaseClient.from('teams').select('*');
        const { data: players } = await supabaseClient.from('players').select('*');
        teams.forEach(t => appData.teams[t.id] = t);
        players.forEach(p => appData.players[p.id] = p);
        renderDashboard();
        checkSession(); 
    } catch (e) { document.querySelector('main').innerText = "Database connection error."; }
}

function renderDashboard() {
    renderHeroBanner();
    renderPlayerCards();
    renderStandings();
    renderBracket();
    renderLeaderboard();
    populateDropdowns();
}

function renderHeroBanner() { 
    const banner = document.getElementById('hero-logos-container'); 
    banner.innerHTML = ''; 
    Object.values(appData.teams).forEach(team => { 
        banner.innerHTML += `<img src="${teamLogos[team.id]}" class="hero-logo-img" alt="${team.name}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${team.name.charAt(0)}&background=ff6a00&color=000&bold=true'">`; 
    }); 
}
    
function renderBracket() { 
    const sorted = Object.values(appData.teams).sort((a, b) => b.wins - a.wins || b.points_for - a.points_for); 
    if(sorted.length >= 4) { 
        document.getElementById('semi-1-team-a').innerHTML = `<img src="${teamLogos[sorted[0].id]}" class="tiny-logo" onerror="this.onerror=null; this.style.display='none'"> 1. ${sorted[0].name}`; 
        document.getElementById('semi-1-team-b').innerHTML = `<img src="${teamLogos[sorted[3].id]}" class="tiny-logo" onerror="this.onerror=null; this.style.display='none'"> 4. ${sorted[3].name}`; 
        document.getElementById('semi-2-team-a').innerHTML = `<img src="${teamLogos[sorted[1].id]}" class="tiny-logo" onerror="this.onerror=null; this.style.display='none'"> 2. ${sorted[1].name}`; 
        document.getElementById('semi-2-team-b').innerHTML = `<img src="${teamLogos[sorted[2].id]}" class="tiny-logo" onerror="this.onerror=null; this.style.display='none'"> 3. ${sorted[2].name}`; 
    } 
}
    
function renderStandings() { 
    const grid = document.getElementById('standings-grid'); 
    grid.innerHTML = ''; 
    const standings = Object.values(appData.teams).sort((a, b) => b.wins - a.wins || b.points_for - a.points_for); 
    standings.forEach((team, index) => { 
        const card = document.createElement('div'); 
        card.className = `team-card ${index === 0 ? 'rank-1' : ''}`; 
        card.innerHTML = ` 
            <div class="team-info"> 
                <span style="color: #666;">#${index + 1}</span> 
                <img class="team-logo" src="${teamLogos[team.id]}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${team.name.charAt(0)}&background=ff6a00&color=000&bold=true'"> 
                <strong>${team.name}</strong> 
            </div> 
            <div class="team-stats"> 
                <div class="stat-box">W-L: <strong>${team.wins}-${team.losses}</strong></div> 
                <div class="stat-box">PF: <strong>${team.points_for}</strong></div> 
            </div> 
        `; 
        grid.appendChild(card); 
    }); 
}

function renderPlayerCards() {
    const grid = document.getElementById('player-cards-grid');
    grid.innerHTML = '';
    Object.values(appData.players).forEach(p => {
        const team = appData.teams[p.team_id];
        const games = team.wins + team.losses;
        const avg = (val) => games > 0 ? (val / games).toFixed(1) : "0.0";

        let card = document.createElement('div'); 
        card.className = 'flip-card';
        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <div class="card-img-container"><img src="${playerImages[p.id]}" class="player-card-img" alt="${p.name}" onerror="this.src='https://ui-avatars.com/api/?name=${p.name.charAt(0)}&background=222&color=ff6a00&size=200'"></div>
                    <div class="card-stats-banner">
                        <div class="card-name">${p.name.split(' ')[0]}</div>
                        <div class="card-stat-row">
                            <div class="major-stats"><span>PTS ${avg(p.pts)}</span> <span>REB ${avg(p.reb)}</span> <span>AST ${avg(p.ast)}</span></div>
                            <div class="defensive-stats" style="color: #666; margin-top: 5px;"><span>BLK ${avg(p.blk||0)}</span> <span>STL ${avg(p.stl||0)}</span></div>
                        </div>
                    </div>
                </div>
                <div class="flip-card-back"><div class="back-title">${p.name}</div><div class="back-bio">${playerBios[p.id]}</div></div>
            </div>`;
        grid.appendChild(card);
    });
}

function renderLeaderboard() {
    const list = document.getElementById('player-leaderboard');
    list.innerHTML = '';
    const topScorers = Object.values(appData.players).sort((a, b) => b.pts - a.pts).slice(0, 8);
    topScorers.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<div class="player-info"><img src="${teamLogos[p.team_id]}" class="tiny-logo" onerror="this.onerror=null; this.style.display='none'"> <strong>${p.name.split(' ')[0]}</strong></div> <span>${p.pts} PTS (${appData.teams[p.team_id].wins + appData.teams[p.team_id].losses}G)</span>`;
        list.appendChild(li);
    });
}

function populateDropdowns() {
    const teamOptions = `<option value="">Select Team...</option>` + Object.values(appData.teams).map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    document.getElementById('team-a-select').innerHTML = teamOptions;
    document.getElementById('team-b-select').innerHTML = teamOptions;
    document.getElementById('override-team-select').innerHTML = teamOptions;
}


// --- 5. NEW LIVE SCORER LOGIC (FAST) ---

const STAT_MAP = { pts: "PTS", reb: "REB", ast: "AST", blk: "BLK", stl: "STL" };

function initSessionStats() {
    Object.values(appData.players).forEach(p => {
        if (!sessionStats[p.id]) {
            sessionStats[p.id] = { pts: 0, reb: 0, ast: 0, blk: 0, stl: 0 };
        }
    });
}

function clearSessionStats() {
    if(!confirm("Start a new game? This resets the live board to 0 (Database totals are kept safe).")) return;
    sessionStats = {}; 
    initSessionStats();
    renderLiveScorer();
}

function renderLiveScorer() {
    const dashboard = authElements.live;
    let rowsHtml = ''; 

    const sortedPlayers = Object.values(appData.players).sort((a,b) => a.team_id.localeCompare(b.team_id));

    sortedPlayers.forEach(p => {
        // Now pulling from sessionStats (which starts at 0) instead of cumulative p.pts
        const s = sessionStats[p.id]; 

        rowsHtml += `
            <div class="scorer-row" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 1px solid #222; gap: 20px;">
                
                <div style="display: flex; align-items: center; gap: 15px; min-width: 150px;">
                    <img src="${teamLogos[p.team_id]}" class="tiny-logo" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${p.name.charAt(0)}&background=ff6a00&color=000&bold=true'">
                    <div class="player-info" style="font-size: 1.3rem; font-weight: bold; color: var(--text-main);">${p.name.split(' ')[0]}</div>
                </div>
                
                <div class="stat-controls-container" style="display: flex; flex-wrap: wrap; justify-content: space-around; flex: 1; gap: 15px; min-width: 300px;">
                    ${renderStatControls(p.id, 'pts', s.pts)}
                    ${renderStatControls(p.id, 'reb', s.reb)}
                    ${renderStatControls(p.id, 'ast', s.ast)}
                    ${renderStatControls(p.id, 'blk', s.blk)}
                    ${renderStatControls(p.id, 'stl', s.stl)}
                </div>
            </div>`;
    });

    // Append the NEW clear button at the bottom
    rowsHtml += `
        <div style="padding: 20px; text-align: center; border-top: 2px solid var(--border);">
            <button class="ghost-btn" onclick="clearSessionStats()" style="border-color: #ff3333; color: #ff3333; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; text-transform: uppercase;">
                Reset Board For New Game
            </button>
        </div>
    `;

    dashboard.innerHTML = rowsHtml;
}

function renderStatControls(pId, statName, currentSessionVal) {
    const spanId = `val-${pId}-${statName}`;
    return `
        <div class="stat-control-box" style="display: flex; flex-direction: row; align-items: center; gap: 12px; background: #050505; padding: 8px 15px; border-radius: 8px; border: 1px solid #222;">
            
            <div class="stat-header" style="width: 35px; text-align: left; font-size: 0.95rem; font-weight: bold; color: var(--neon-orange-dim);">
                ${STAT_MAP[statName]}
            </div>
            
            <div class="controls-group" style="display: flex; align-items: center; gap: 10px;">
                <button class="stat-btn minus-btn" onclick="fastUpdate('${pId}', '${statName}', -1)">-</button>
                <span id="${spanId}" class="current-stat-value ${statName==='pts'?'pts-val':''}">${currentSessionVal}</span>
                <button class="stat-btn plus-btn" onclick="fastUpdate('${pId}', '${statName}', 1)">+</button>
            </div>
            
        </div>`;
}

// --- 6. THE FAST LIVE UPDATE ENGINE ---
async function fastUpdate(pId, stat, change) {
    const span = document.getElementById(`val-${pId}-${stat}`);
    
    // 1. Update the LOCAL SESSION 
    // Removed the 0 limit! This allows negative numbers (e.g., -1) to fix past mistakes
    let currentSessionVal = sessionStats[pId][stat];
    let newSessionVal = currentSessionVal + change; 
    
    if (change === 0) return;

    span.innerText = newSessionVal;
    sessionStats[pId][stat] = newSessionVal;
    
    // 2. Update the CUMULATIVE DB TOTAL in memory
    // (We still keep the DB total floored at 0 so a player never has negative total career points)
    appData.players[pId][stat] = Math.max(0, (appData.players[pId][stat] || 0) + change);
    
    // Flash effect
    if(stat==='pts') span.style.textShadow = change > 0 ? '0 0 25px var(--neon-orange)' : 'none';

    // 3. Send ONLY cumulative total to Supabase
    try {
        const updateData = {};
        updateData[stat] = appData.players[pId][stat]; 
        
        const { error } = await supabaseClient
            .from('players')
            .update(updateData)
            .eq('id', pId);

        if (error) throw error;
        
        if(stat==='pts') setTimeout(()=> span.style.textShadow = 'var(--neon-glow)', 300);

    } catch (e) {
        console.error("Supabase sync failed:", e);
        span.style.color = '#ff3333'; 
        alert("Sync error! Check your internet connection.");
    }
}

// --- 7. Final Log Form Submissions ---
document.getElementById('team-match-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idA = document.getElementById('team-a-select').value;
    const idB = document.getElementById('team-b-select').value;
    if (idA === idB) return alert("A team cannot play itself!");
    if(!confirm("Log this final Win/Loss? (Live stats already saved)")) return;

    const sA = parseInt(document.getElementById('team-a-score').value);
    const sB = parseInt(document.getElementById('team-b-score').value);
    const submitBtn = e.target.querySelector('button');
    submitBtn.innerText = "Saving...";

    appData.teams[idA].points_for += sA;
    appData.teams[idB].points_for += sB;
    if (sA > sB) { appData.teams[idA].wins += 1; appData.teams[idB].losses += 1; } 
    else { appData.teams[idB].wins += 1; appData.teams[idA].losses += 1; }

    await supabaseClient.from('teams').upsert([appData.teams[idA], appData.teams[idB]]);
    renderDashboard();
    e.target.reset();
    submitBtn.innerText = "Save Win/Loss";
});

document.getElementById('team-override-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tId = document.getElementById('override-team-select').value;
    if (!tId) return;
    if(!confirm(`FORCE OVERWRITE ${appData.teams[tId].name}'s record?`)) return;
    const submitBtn = e.target.querySelector('button');
    submitBtn.innerText = "Overwriting...";
    
    appData.teams[tId].wins = parseInt(document.getElementById('override-w').value);
    appData.teams[tId].losses = parseInt(document.getElementById('override-l').value);
    appData.teams[tId].points_for = parseInt(document.getElementById('override-pf').value);
    
    await supabaseClient.from('teams').update({ wins: appData.teams[tId].wins, losses: appData.teams[tId].losses, points_for: appData.teams[tId].points_for }).eq('id', tId);
    
    renderDashboard();
    e.target.reset();
    submitBtn.innerText = "Force Set Record";
});

// Boot
fetchLeagueData();
