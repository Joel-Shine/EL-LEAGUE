// --- 1. Initialize Supabase ---
const supabaseUrl = 'https://wmfgxdrpexgruhdzftjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmd4ZHJwZXhncnVoZHpmdGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODc1OTMsImV4cCI6MjA5OTg2MzU5M30.RedQWi1GQ_BOsOio5Gr73SugzZFYkSB4M9egFx5lKto';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. Assets & Fun Facts ---
const teamLogos = {
    "T1": "logos/thunderbolts.png", 
    "T2": "https://github.com/Joel-Shine/EL-LEAGUE/blob/main/logos/genesis.png",
    "T3": "https://github.com/Joel-Shine/EL-LEAGUE/blob/main/logos/titans.png", 
    "T4": "https://github.com/Joel-Shine/EL-LEAGUE/blob/main/logos/blazes.png"
};

const playerImages = {
    "P1": "bharat.jpg", "P2": "madhav.jpg",
    "P3": "joel.jpg",   "P4": "alok.jpg",
    "P5": "niranjan.jpg", "P6": "evan.jpg",
    "P7": "gautham.jpg", "P8": "ghosh.jpg"
};

const playerBios = {
    "P3": "No dribbles required—just elite rim protection and a lethal jumper when you least expect it.",
    "P4": "Pure athletic menace. If he doesn't steal your pass, he's pinning your shot to the glass.",
    "P1": "An absolute blur in transition with a picture-perfect jumper and endless stamina.",
    "P2": "The undisputed final boss. Elite at everything, with an unblockable three-point sniper rifle.",
    "P5": "Kyrie handlings. Putting defenders on skates and draining heavily contested buckets.",
    "P6": "Fueled by pure passion for the game—when he finally locks in, you're dealing with a legend.",
    "P7": "The ultimate catch-and-shoot cheat code. Feed him the rock, and put three on the board.",
    "P8": "The absolute god of playmaking; an athletic freight train with eyes in the back of his head."
};

let appData = { teams: {}, players: {} };

// --- 3. Authentication Logic ---
const loginBtn = document.getElementById('real-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminZone = document.getElementById('admin-zone');
const emailInput = document.getElementById('admin-email');
const passInput = document.getElementById('admin-password');

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) showAdminPanel();
}

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passInput.value;
    if (!email || !password) return alert("Enter email and password!");
    
    loginBtn.innerText = "Loading...";
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Login failed: " + error.message);
        loginBtn.innerText = "Login";
    } else {
        showAdminPanel();
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    adminZone.style.display = "none";
    logoutBtn.style.display = "none";
    emailInput.style.display = "block";
    passInput.style.display = "block";
    loginBtn.style.display = "block";
    loginBtn.innerText = "Login";
    emailInput.value = "";
    passInput.value = "";
});

function showAdminPanel() {
    adminZone.style.display = "flex";
    emailInput.style.display = "none";
    passInput.style.display = "none";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
}

// --- 4. Fetch & Render Data ---
async function fetchLeagueData() {
    const { data: teams } = await supabaseClient.from('teams').select('*');
    const { data: players } = await supabaseClient.from('players').select('*');

    teams.forEach(t => appData.teams[t.id] = t);
    players.forEach(p => appData.players[p.id] = p);
    renderDashboard();
}

function renderDashboard() {
    renderHeroBanner();
    renderPlayerCards();
    renderStandings();
    renderBracket();
    renderLeaderboard();
    populateSelects();
}

function renderHeroBanner() {
    const banner = document.getElementById('hero-logos-container');
    banner.innerHTML = '';
    Object.values(appData.teams).forEach(team => {
        banner.innerHTML += `<img src="${teamLogos[team.id]}" class="hero-logo-img" alt="${team.name}" onerror="this.src='https://ui-avatars.com/api/?name=${team.name.charAt(0)}&background=ff6a00&color=000&bold=true'">`;
    });
}

function renderPlayerCards() {
    const grid = document.getElementById('player-cards-grid');
    grid.innerHTML = '';

    Object.values(appData.players).forEach(p => {
        const team = appData.teams[p.team_id];
        const gamesPlayed = team.wins + team.losses;
        
        const avgPts = gamesPlayed > 0 ? (p.pts / gamesPlayed).toFixed(1) : "0.0";
        const avgAst = gamesPlayed > 0 ? (p.ast / gamesPlayed).toFixed(1) : "0.0";
        const avgReb = gamesPlayed > 0 ? (p.reb / gamesPlayed).toFixed(1) : "0.0";

        const card = document.createElement('div');
        card.className = 'flip-card';
        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <div class="card-img-container">
                        <img src="${playerImages[p.id]}" class="player-card-img" alt="${p.name}" onerror="this.src='https://ui-avatars.com/api/?name=${p.name.charAt(0)}&background=222&color=ff6a00&size=200'">
                    </div>
                    <div class="card-stats-banner">
                        <div class="card-name">${p.name.split(' ')[0]}</div>
                        <div class="card-stat-row">
                            <span>PTS: ${avgPts}</span>
                            <span>AST: ${avgAst}</span>
                            <span>REB: ${avgReb}</span>
                        </div>
                    </div>
                </div>
                <div class="flip-card-back">
                    <div class="back-title">${p.name}</div>
                    <div class="back-bio">${playerBios[p.id]}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
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
                <img class="team-logo" src="${teamLogos[team.id]}" onerror="this.src='https://ui-avatars.com/api/?name=${team.name.charAt(0)}&background=ff6a00&color=000&bold=true'">
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

function renderBracket() {
    const sorted = Object.values(appData.teams).sort((a, b) => b.wins - a.wins || b.points_for - a.points_for);
    if(sorted.length >= 4) {
        document.getElementById('semi-1-team-a').innerHTML = `<img src="${teamLogos[sorted[0].id]}" class="tiny-logo" onerror="this.style.display='none'"> 1. ${sorted[0].name}`;
        document.getElementById('semi-1-team-b').innerHTML = `<img src="${teamLogos[sorted[3].id]}" class="tiny-logo" onerror="this.style.display='none'"> 4. ${sorted[3].name}`;
        document.getElementById('semi-2-team-a').innerHTML = `<img src="${teamLogos[sorted[1].id]}" class="tiny-logo" onerror="this.style.display='none'"> 2. ${sorted[1].name}`;
        document.getElementById('semi-2-team-b').innerHTML = `<img src="${teamLogos[sorted[2].id]}" class="tiny-logo" onerror="this.style.display='none'"> 3. ${sorted[2].name}`;
    }
}

function renderLeaderboard() {
    const list = document.getElementById('player-leaderboard');
    list.innerHTML = '';
    const topScorers = Object.values(appData.players).sort((a, b) => b.pts - a.pts).slice(0, 8);
    topScorers.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="player-info">
                <img src="${teamLogos[p.team_id]}" class="tiny-logo" onerror="this.style.display='none'">
                <strong>${p.name.split(' ')[0]}</strong>
            </div>
            <span>${p.pts} PTS | ${p.ast} AST | ${p.reb} REB</span>
        `;
        list.appendChild(li);
    });
}

function populateSelects() {
    const teamOptions = `<option value="">Select Team...</option>` + Object.values(appData.teams).map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    document.getElementById('team-a-select').innerHTML = teamOptions;
    document.getElementById('team-b-select').innerHTML = teamOptions;
    document.getElementById('override-team-select').innerHTML = teamOptions;

    const playerOptions = `<option value="">Select Player...</option>` + Object.values(appData.players).map(p => `<option value="${p.id}">${p.name} (${appData.teams[p.team_id].name})</option>`).join('');
    document.getElementById('player-select').innerHTML = playerOptions;
}

// --- 5. Form Submissions ---

// Form 1: Log Match
document.getElementById('team-match-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idA = document.getElementById('team-a-select').value;
    const idB = document.getElementById('team-b-select').value;
    
    if (idA === idB) { alert("A team cannot play itself!"); return; }

    const scoreA = parseInt(document.getElementById('team-a-score').value);
    const scoreB = parseInt(document.getElementById('team-b-score').value);
    const submitBtn = e.target.querySelector('button');
    submitBtn.innerText = "Saving...";

    appData.teams[idA].points_for += scoreA;
    appData.teams[idB].points_for += scoreB;

    if (scoreA > scoreB) {
        appData.teams[idA].wins += 1;
        appData.teams[idB].losses += 1;
    } else if (scoreB > scoreA) {
        appData.teams[idB].wins += 1;
        appData.teams[idA].losses += 1;
    }

    await supabaseClient.from('teams').upsert([appData.teams[idA], appData.teams[idB]]);
    renderDashboard();
    e.target.reset();
    submitBtn.innerText = "Save Match";
});

// Form 2: Update Player Stats
document.getElementById('player-stat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const playerId = document.getElementById('player-select').value;
    if (!playerId) return;

    const submitBtn = e.target.querySelector('button');
    submitBtn.innerText = "Saving...";

    appData.players[playerId].pts += parseInt(document.getElementById('player-pts').value) || 0;
    appData.players[playerId].ast += parseInt(document.getElementById('player-ast').value) || 0;
    appData.players[playerId].reb += parseInt(document.getElementById('player-reb').value) || 0;

    await supabaseClient.from('players').update({
        pts: appData.players[playerId].pts,
        ast: appData.players[playerId].ast,
        reb: appData.players[playerId].reb
    }).eq('id', playerId);
    
    renderDashboard();
    
    document.getElementById('player-pts').value = 0;
    document.getElementById('player-ast').value = 0;
    document.getElementById('player-reb').value = 0;
    document.getElementById('player-select').value = "";
    submitBtn.innerText = "Update Player";
});

// Form 3: Override Team Record
document.getElementById('team-override-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tId = document.getElementById('override-team-select').value;
    if (!tId) return;

    if(!confirm(`Are you sure you want to completely overwrite ${appData.teams[tId].name}'s record?`)) return;

    const submitBtn = e.target.querySelector('button');
    submitBtn.innerText = "Overwriting...";

    appData.teams[tId].wins = parseInt(document.getElementById('override-w').value);
    appData.teams[tId].losses = parseInt(document.getElementById('override-l').value);
    appData.teams[tId].points_for = parseInt(document.getElementById('override-pf').value);

    await supabaseClient.from('teams').update({
        wins: appData.teams[tId].wins,
        losses: appData.teams[tId].losses,
        points_for: appData.teams[tId].points_for
    }).eq('id', tId);
    
    renderDashboard();
    e.target.reset();
    submitBtn.innerText = "Force Set Record";
});

// Boot up the app!
checkSession();
fetchLeagueData();
