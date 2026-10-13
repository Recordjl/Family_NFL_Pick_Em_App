const SHEETS = {
  CONFIG: 'Config',
  USERS: 'Users',
  TEAMS: 'Teams',
  GAMES: 'Games',
  PICKS: 'Picks',
  WEEKS: 'Weeks'
};

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Family NFL Pick Em')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Pick Em App')
    .addItem('1. Setup Sheets', 'setupPickEm')
    .addItem('2. Import Odds For Current Week', 'importOddsForCurrentWeek')
    .addItem('3. Import Scores For Current Week', 'importScoresForCurrentWeek')
    .addSeparator()
    .addItem('Create Hourly Score Update Trigger', 'createScoreUpdateTrigger')
    .addItem('Delete Score Update Triggers', 'deleteScoreUpdateTriggers')
    .addToUi();
}

function setupPickEm() {
  createSheetIfMissing_(SHEETS.CONFIG, [
    ['Key', 'Value'],
    ['CURRENT_WEEK', '1'],
    ['WEEK_START', '2026-09-01T00:00:00Z'],
    ['WEEK_END', '2026-09-15T00:00:00Z'],
    ['LOCK_MINUTES_BEFORE_KICKOFF', '60'],
    ['ODDS_API_KEY', 'PASTE_YOUR_ODDS_API_KEY_HERE'],
    ['ODDS_SPORT_KEY', 'americanfootball_nfl'],
    ['ODDS_BOOKMAKER', 'draftkings']
  ]);

  createSheetIfMissing_(SHEETS.WEEKS, [
    ['Week', 'WeekStartUTC', 'WeekEndUTC'],
    [1, '', ''],
    [2, '', ''],
    [3, '', ''],
    [4, '', ''],
    [5, '', ''],
    [6, '', ''],
    [7, '', ''],
    [8, '', ''],
    [9, '', ''],
    [10, '', ''],
    [11, '', ''],
    [12, '', ''],
    [13, '', ''],
    [14, '', ''],
    [15, '', ''],
    [16, '', ''],
    [17, '', ''],
    [18, '', '']
  ]);

  createSheetIfMissing_(SHEETS.USERS, [
    ['UserId', 'Name', 'Pin', 'Active', 'IsAdmin'],
    ['1', 'Chris', '1111', 'TRUE', 'TRUE'],
    ['2', 'Peg', '2222', 'TRUE', 'FALSE'],
    ['3', 'Jeremy', '3333', 'TRUE', 'FALSE'],
    ['4', 'Kelsey', '4444', 'TRUE', 'FALSE'],
    ['5', 'Myranda', '5555', 'TRUE', 'FALSE'],
    ['6', 'Mike', '6666', 'TRUE', 'FALSE'],
    ['7', 'Rob & Lydia', '7777', 'TRUE', 'FALSE'],
    ['8', 'Alexandria', '8888', 'TRUE', 'FALSE'],
    ['9', 'Will & Ava', '9999', 'TRUE', 'FALSE'],
    ['10', 'Alex', '1010', 'TRUE', 'FALSE'],
    ['11', 'Jonny', '1212', 'TRUE', 'FALSE'],
    ['12', 'J Finn', '1313', 'TRUE', 'FALSE']
  ]);

  createSheetIfMissing_(SHEETS.TEAMS, [
    ['FullName', 'Abbr', 'Nickname', 'OddsApiName'],
    ['Arizona Cardinals', 'ARI', 'Cardinals', 'Arizona Cardinals'],
    ['Atlanta Falcons', 'ATL', 'Falcons', 'Atlanta Falcons'],
    ['Baltimore Ravens', 'BAL', 'Ravens', 'Baltimore Ravens'],
    ['Buffalo Bills', 'BUF', 'Bills', 'Buffalo Bills'],
    ['Carolina Panthers', 'CAR', 'Panthers', 'Carolina Panthers'],
    ['Chicago Bears', 'CHI', 'Bears', 'Chicago Bears'],
    ['Cincinnati Bengals', 'CIN', 'Bengals', 'Cincinnati Bengals'],
    ['Cleveland Browns', 'CLE', 'Browns', 'Cleveland Browns'],
    ['Dallas Cowboys', 'DAL', 'Cowboys', 'Dallas Cowboys'],
    ['Denver Broncos', 'DEN', 'Broncos', 'Denver Broncos'],
    ['Detroit Lions', 'DET', 'Lions', 'Detroit Lions'],
    ['Green Bay Packers', 'GB', 'Packers', 'Green Bay Packers'],
    ['Houston Texans', 'HOU', 'Texans', 'Houston Texans'],
    ['Indianapolis Colts', 'IND', 'Colts', 'Indianapolis Colts'],
    ['Jacksonville Jaguars', 'JAX', 'Jaguars', 'Jacksonville Jaguars'],
    ['Kansas City Chiefs', 'KC', 'Chiefs', 'Kansas City Chiefs'],
    ['Las Vegas Raiders', 'LV', 'Raiders', 'Las Vegas Raiders'],
    ['Los Angeles Chargers', 'LAC', 'Chargers', 'Los Angeles Chargers'],
    ['Los Angeles Rams', 'LA', 'Rams', 'Los Angeles Rams'],
    ['Miami Dolphins', 'MIA', 'Dolphins', 'Miami Dolphins'],
    ['Minnesota Vikings', 'MIN', 'Vikings', 'Minnesota Vikings'],
    ['New England Patriots', 'NE', 'Patriots', 'New England Patriots'],
    ['New Orleans Saints', 'NO', 'Saints', 'New Orleans Saints'],
    ['New York Giants', 'NYG', 'Giants', 'New York Giants'],
    ['New York Jets', 'NYJ', 'Jets', 'New York Jets'],
    ['Philadelphia Eagles', 'PHI', 'Eagles', 'Philadelphia Eagles'],
    ['Pittsburgh Steelers', 'PIT', 'Steelers', 'Pittsburgh Steelers'],
    ['San Francisco 49ers', 'SF', '49ers', 'San Francisco 49ers'],
    ['Seattle Seahawks', 'SEA', 'Seahawks', 'Seattle Seahawks'],
    ['Tampa Bay Buccaneers', 'TB', 'Buccaneers', 'Tampa Bay Buccaneers'],
    ['Tennessee Titans', 'TEN', 'Titans', 'Tennessee Titans'],
    ['Washington Commanders', 'WAS', 'Commanders', 'Washington Commanders']
  ]);

  createSheetIfMissing_(SHEETS.GAMES, [
    [
      'GameId',
      'Week',
      'KickoffUTC',
      'AwayAbbr',
      'AwayTeam',
      'HomeAbbr',
      'HomeTeam',
      'AwaySpread',
      'HomeSpread',
      'AwayScore',
      'HomeScore',
      'Status',
      'ApiEventId',
      'LastOddsUpdate'
    ]
  ]);

  createSheetIfMissing_(SHEETS.PICKS, [
    [
      'Timestamp',
      'Week',
      'UserId',
      'GameId',
      'PickedAbbr',
      'IsTriple'
    ]
  ]);

  SpreadsheetApp.getUi().alert('Pick Em sheets are ready.');
}

function importOddsForCurrentWeek() {
  const config = getConfig_();

  const apiKey = config.ODDS_API_KEY;
  if (!apiKey || apiKey === 'PASTE_YOUR_ODDS_API_KEY_HERE') {
    throw new Error('Add your Odds API key to Config first.');
  }

  const week = getCurrentWeek_();
  const range = getWeekRange_(week);
  const weekStart = range.weekStart;
  const weekEnd = range.weekEnd;

  const sportKey = config.ODDS_SPORT_KEY || 'americanfootball_nfl';
  const bookmaker = config.ODDS_BOOKMAKER || 'draftkings';

  const url =
    `https://api.the-odds-api.com/v4/sports/${sportKey}/odds` +
    `?apiKey=${encodeURIComponent(apiKey)}` +
    `&regions=us` +
    `&markets=spreads` +
    `&oddsFormat=american` +
    `&bookmakers=${encodeURIComponent(bookmaker)}`;

  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(response.getContentText());
  }

  const events = JSON.parse(response.getContentText());
  const gamesSheet = sheet_(SHEETS.GAMES);
  const games = readObjects_(SHEETS.GAMES);

  const existingByApiId = {};
  games.forEach(g => {
    if (g.ApiEventId) {
      existingByApiId[g.ApiEventId] = g;
    }
  });

  const now = new Date();
  let imported = 0;

  events.forEach(event => {
    const kickoff = new Date(event.commence_time);

    if (kickoff < weekStart || kickoff > weekEnd) {
      return;
    }

    const book = event.bookmakers && event.bookmakers[0];
    if (!book) return;

    const spreadMarket = book.markets.find(m => m.key === 'spreads');
    if (!spreadMarket) return;

    const awayName = event.away_team;
    const homeName = event.home_team;

    const awayAbbr = teamAbbrFromOddsName_(awayName);
    const homeAbbr = teamAbbrFromOddsName_(homeName);

    if (!awayAbbr || !homeAbbr) {
      throw new Error(`Could not map teams: ${awayName} / ${homeName}`);
    }

    const awayOutcome = spreadMarket.outcomes.find(o => o.name === awayName);
    const homeOutcome = spreadMarket.outcomes.find(o => o.name === homeName);

    if (!awayOutcome || !homeOutcome) return;

    const row = [
      event.id,
      week,
      kickoff.toISOString(),
      awayAbbr,
      awayName,
      homeAbbr,
      homeName,
      awayOutcome.point,
      homeOutcome.point,
      '',
      '',
      'Scheduled',
      event.id,
      now.toISOString()
    ];

    const existing = existingByApiId[event.id];

    if (existing) {
      const rowIndex = findRowByValue_(SHEETS.GAMES, 'ApiEventId', event.id);
      gamesSheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      gamesSheet.appendRow(row);
    }

    imported++;
  });

  SpreadsheetApp.getUi().alert(`Imported or updated ${imported} games for Week ${week}.`);
}

function importScoresForCurrentWeek() {
  const week = getCurrentWeek_();
  const range = getWeekRange_(week);
  const weekStart = range.weekStart;
  const weekEnd = range.weekEnd;

  const startDate = formatEspnDate_(weekStart);
  const endDate = formatEspnDate_(weekEnd);

  const url =
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` +
    `?dates=${startDate}-${endDate}` +
    `&limit=100`;

  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`ESPN score import failed: ${response.getContentText()}`);
  }

  const data = JSON.parse(response.getContentText());
  const events = data.events || [];

  const scoreMap = {};

  events.forEach(event => {
    if (
      !event.competitions ||
      !event.competitions[0] ||
      !event.competitions[0].competitors
    ) {
      return;
    }

    const competition = event.competitions[0];
    const competitors = competition.competitors;

    const away = competitors.find(c => c.homeAway === 'away');
    const home = competitors.find(c => c.homeAway === 'home');

    if (!away || !home) return;

    const awayAbbr = normalizeTeamAbbr_(away.team.abbreviation);
    const homeAbbr = normalizeTeamAbbr_(home.team.abbreviation);

    const completed =
      event.status &&
      event.status.type &&
      event.status.type.completed === true;

    const statusText =
      completed
        ? 'Final'
        : event.status && event.status.type
          ? event.status.type.description
          : 'Scheduled';

    const awayScore =
      away.score !== undefined && away.score !== ''
        ? Number(away.score)
        : '';

    const homeScore =
      home.score !== undefined && home.score !== ''
        ? Number(home.score)
        : '';

    const key = `${awayAbbr}_${homeAbbr}`;

    scoreMap[key] = {
      awayAbbr,
      homeAbbr,
      awayScore,
      homeScore,
      completed,
      statusText
    };
  });

  const gamesSheet = sheet_(SHEETS.GAMES);
  const values = gamesSheet.getDataRange().getValues();

  if (values.length < 2) {
    Logger.log('No games found.');
    return {
      updatedFinals: 0,
      updatedStatuses: 0
    };
  }

  const headers = values[0];

  const col = {
    week: headers.indexOf('Week'),
    awayAbbr: headers.indexOf('AwayAbbr'),
    homeAbbr: headers.indexOf('HomeAbbr'),
    awayScore: headers.indexOf('AwayScore'),
    homeScore: headers.indexOf('HomeScore'),
    status: headers.indexOf('Status')
  };

  Object.keys(col).forEach(key => {
    if (col[key] === -1) {
      throw new Error(`Missing Games column: ${key}`);
    }
  });

  let updatedFinals = 0;
  let updatedStatuses = 0;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    const rowWeek = Number(row[col.week]);

    if (rowWeek !== week) {
      continue;
    }

    const awayAbbr = normalizeTeamAbbr_(row[col.awayAbbr]);
    const homeAbbr = normalizeTeamAbbr_(row[col.homeAbbr]);

    const key = `${awayAbbr}_${homeAbbr}`;
    const score = scoreMap[key];

    if (!score) {
      continue;
    }

    const sheetRow = r + 1;

    if (score.completed) {
      gamesSheet.getRange(sheetRow, col.awayScore + 1).setValue(score.awayScore);
      gamesSheet.getRange(sheetRow, col.homeScore + 1).setValue(score.homeScore);
      gamesSheet.getRange(sheetRow, col.status + 1).setValue('Final');
      updatedFinals++;
    } else {
      gamesSheet.getRange(sheetRow, col.status + 1).setValue(score.statusText);
      updatedStatuses++;
    }
  }

  Logger.log(`Final scores updated: ${updatedFinals}`);
  Logger.log(`Statuses updated: ${updatedStatuses}`);

  return {
    updatedFinals,
    updatedStatuses
  };
}

function createScoreUpdateTrigger() {
  deleteScoreUpdateTriggers(false);

  ScriptApp.newTrigger('importScoresForCurrentWeek')
    .timeBased()
    .everyHours(1)
    .create();

  SpreadsheetApp.getUi().alert('Hourly score update trigger created.');
}

function deleteScoreUpdateTriggers(showAlert = true) {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'importScoresForCurrentWeek') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  if (showAlert) {
    SpreadsheetApp.getUi().alert('Score update triggers deleted.');
  }
}

function login(name, pin) {
  const users = readObjects_(SHEETS.USERS);

  const found = users.find(u =>
    String(u.Name).trim().toLowerCase() === String(name).trim().toLowerCase() &&
    String(u.Pin).trim() === String(pin).trim() &&
    String(u.Active).toUpperCase() === 'TRUE'
  );

  if (!found) {
    return {
      success: false,
      message: 'Invalid name or PIN.'
    };
  }

  return {
    success: true,
    user: {
      userId: String(found.UserId),
      name: found.Name,
      isAdmin: String(found.IsAdmin).toUpperCase() === 'TRUE'
    }
  };
}

function getAppData(userId) {
  const config = getConfig_();

  const week = getCurrentWeek_();
  const lockMinutes = Number(config.LOCK_MINUTES_BEFORE_KICKOFF || 60);

  const games = readObjects_(SHEETS.GAMES)
    .filter(g => Number(g.Week) === week)
    .sort((a, b) => new Date(a.KickoffUTC) - new Date(b.KickoffUTC));

  const picks = readObjects_(SHEETS.PICKS)
    .filter(p => Number(p.Week) === week && String(p.UserId) === String(userId));

  const pickMap = {};
  picks.forEach(p => {
    pickMap[p.GameId] = {
      pickedAbbr: p.PickedAbbr,
      isTriple: String(p.IsTriple).toUpperCase() === 'TRUE'
    };
  });

  const now = new Date();

  return {
    week,
    currentWeek: week,
    lockMinutes,

    games: games.map(g => {
      const kickoff = new Date(g.KickoffUTC);
      const lockTime = new Date(kickoff.getTime() - lockMinutes * 60 * 1000);
      const locked = now >= lockTime;

      return {
        gameId: g.GameId,
        week: Number(g.Week),
        kickoffUTC: g.KickoffUTC,
        awayAbbr: g.AwayAbbr,
        awayTeam: g.AwayTeam,
        homeAbbr: g.HomeAbbr,
        homeTeam: g.HomeTeam,
        awaySpread: Number(g.AwaySpread),
        homeSpread: Number(g.HomeSpread),
        awayScore: g.AwayScore,
        homeScore: g.HomeScore,
        status: g.Status,
        locked,
        existingPick: pickMap[g.GameId] || null
      };
    }),

    standings: getStandings(),
    weeklyStandings: getWeeklyStandings(week),
    seasonByWeek: getSeasonStandingsByWeek(),
    pickHistory: getPickHistoryForUser(userId),
    allPicks: getAllPicksForWeek(week)
  };
}

function submitPicks(payload) {
  const userId = String(payload.userId);
  const pin = String(payload.pin);
  const week = Number(payload.week);
  const submittedPicks = payload.picks || [];

  const users = readObjects_(SHEETS.USERS);
  const user = users.find(u =>
    String(u.UserId) === userId &&
    String(u.Pin).trim() === pin &&
    String(u.Active).toUpperCase() === 'TRUE'
  );

  if (!user) {
    return {
      success: false,
      message: 'Login expired or invalid PIN.'
    };
  }

  if (submittedPicks.length !== 8) {
    return {
      success: false,
      message: 'You must select exactly 8 games.'
    };
  }

  const tripleCount = submittedPicks.filter(p => p.isTriple).length;
  if (tripleCount !== 1) {
    return {
      success: false,
      message: 'You must select exactly one 3-point pick.'
    };
  }

  const uniqueGames = new Set(submittedPicks.map(p => p.gameId));
  if (uniqueGames.size !== 8) {
    return {
      success: false,
      message: 'Duplicate game detected.'
    };
  }

  const config = getConfig_();
  const lockMinutes = Number(config.LOCK_MINUTES_BEFORE_KICKOFF || 60);

  const games = readObjects_(SHEETS.GAMES)
    .filter(g => Number(g.Week) === week);

  const gameMap = {};
  games.forEach(g => {
    gameMap[g.GameId] = g;
  });

  const oldPicks = readObjects_(SHEETS.PICKS)
    .filter(p => Number(p.Week) === week && String(p.UserId) === userId);

  const oldMap = {};
  oldPicks.forEach(p => {
    oldMap[p.GameId] = {
      pickedAbbr: p.PickedAbbr,
      isTriple: String(p.IsTriple).toUpperCase() === 'TRUE'
    };
  });

  const now = new Date();

  for (const p of submittedPicks) {
    const game = gameMap[p.gameId];

    if (!game) {
      return {
        success: false,
        message: 'Invalid game selected.'
      };
    }

    if (![game.AwayAbbr, game.HomeAbbr].includes(p.pickedAbbr)) {
      return {
        success: false,
        message: 'Invalid team selected.'
      };
    }

    const kickoff = new Date(game.KickoffUTC);
    const lockTime = new Date(kickoff.getTime() - lockMinutes * 60 * 1000);
    const locked = now >= lockTime;

    if (locked) {
      const old = oldMap[p.gameId];

      if (!old) {
        return {
          success: false,
          message: `${game.AwayAbbr} at ${game.HomeAbbr} is locked.`
        };
      }

      if (
        old.pickedAbbr !== p.pickedAbbr ||
        Boolean(old.isTriple) !== Boolean(p.isTriple)
      ) {
        return {
          success: false,
          message: `${game.AwayAbbr} at ${game.HomeAbbr} is locked and cannot be changed.`
        };
      }
    }
  }

  replaceUserWeekPicks_(userId, week, submittedPicks);

  return {
    success: true,
    message: 'Picks submitted!'
  };
}

function getStandings() {
  const users = readObjects_(SHEETS.USERS)
    .filter(u => String(u.Active).toUpperCase() === 'TRUE');

  const games = readObjects_(SHEETS.GAMES);
  const picks = readObjects_(SHEETS.PICKS);

  const gameMap = {};
  games.forEach(g => {
    gameMap[g.GameId] = g;
  });

  const result = users.map(u => {
    const userPicks = picks.filter(p => String(p.UserId) === String(u.UserId));

    let seasonPoints = 0;
    let seasonCorrect = 0;

    userPicks.forEach(p => {
      const game = gameMap[p.GameId];
      if (!game) return;

      const scored = scorePick_(game, p);
      seasonPoints += scored.points;
      seasonCorrect += scored.correct ? 1 : 0;
    });

    return {
      userId: String(u.UserId),
      name: u.Name,
      seasonPoints,
      seasonCorrect
    };
  });

  result.sort((a, b) => {
    if (b.seasonPoints !== a.seasonPoints) {
      return b.seasonPoints - a.seasonPoints;
    }

    if (b.seasonCorrect !== a.seasonCorrect) {
      return b.seasonCorrect - a.seasonCorrect;
    }

    return a.name.localeCompare(b.name);
  });

  return result;
}

function getWeeklyStandings(week) {
  const users = readObjects_(SHEETS.USERS)
    .filter(u => String(u.Active).toUpperCase() === 'TRUE');

  const games = readObjects_(SHEETS.GAMES)
    .filter(g => Number(g.Week) === Number(week));

  const picks = readObjects_(SHEETS.PICKS)
    .filter(p => Number(p.Week) === Number(week));

  const gameMap = {};
  games.forEach(g => {
    gameMap[g.GameId] = g;
  });

  const result = users.map(u => {
    const userPicks = picks.filter(p => String(p.UserId) === String(u.UserId));

    let weekPoints = 0;
    let weekCorrect = 0;

    userPicks.forEach(p => {
      const game = gameMap[p.GameId];
      if (!game) return;

      const scored = scorePick_(game, p);
      weekPoints += scored.points;
      weekCorrect += scored.correct ? 1 : 0;
    });

    return {
      userId: String(u.UserId),
      name: u.Name,
      week: Number(week),
      weekPoints,
      weekCorrect,
      picksSubmitted: userPicks.length
    };
  });

  result.sort((a, b) => {
    if (b.weekPoints !== a.weekPoints) {
      return b.weekPoints - a.weekPoints;
    }

    if (b.weekCorrect !== a.weekCorrect) {
      return b.weekCorrect - a.weekCorrect;
    }

    return a.name.localeCompare(b.name);
  });

  return result;
}

function getSeasonStandingsByWeek() {
  const users = readObjects_(SHEETS.USERS)
    .filter(u => String(u.Active).toUpperCase() === 'TRUE');

  const games = readObjects_(SHEETS.GAMES);
  const picks = readObjects_(SHEETS.PICKS);

  const gameMap = {};
  games.forEach(g => {
    gameMap[g.GameId] = g;
  });

  const weekSet = new Set();

  games.forEach(g => {
    const week = Number(g.Week);
    if (!Number.isNaN(week) && week > 0) {
      weekSet.add(week);
    }
  });

  picks.forEach(p => {
    const week = Number(p.Week);
    if (!Number.isNaN(week) && week > 0) {
      weekSet.add(week);
    }
  });

  const weeks = Array.from(weekSet).sort((a, b) => a - b);

  const rows = users.map(u => {
    let totalPoints = 0;
    let totalCorrect = 0;
    const weekData = {};

    weeks.forEach(week => {
      const userWeekPicks = picks.filter(p =>
        String(p.UserId) === String(u.UserId) &&
        Number(p.Week) === Number(week)
      );

      let weekPoints = 0;
      let weekCorrect = 0;

      userWeekPicks.forEach(p => {
        const game = gameMap[p.GameId];
        if (!game) return;

        const scored = scorePick_(game, p);
        weekPoints += scored.points;
        weekCorrect += scored.correct ? 1 : 0;
      });

      totalPoints += weekPoints;
      totalCorrect += weekCorrect;

      weekData[String(week)] = {
        points: weekPoints,
        correct: weekCorrect,
        picksSubmitted: userWeekPicks.length,
        cumulativePoints: totalPoints,
        cumulativeCorrect: totalCorrect
      };
    });

    return {
      userId: String(u.UserId),
      name: u.Name,
      totalPoints,
      totalCorrect,
      weeks: weekData
    };
  });

  rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    if (b.totalCorrect !== a.totalCorrect) {
      return b.totalCorrect - a.totalCorrect;
    }

    return a.name.localeCompare(b.name);
  });

  return {
    weeks,
    rows
  };
}

function getPickHistoryForUser(userId) {
  const games = readObjects_(SHEETS.GAMES);
  const picks = readObjects_(SHEETS.PICKS)
    .filter(p => String(p.UserId) === String(userId));

  const gameMap = {};
  games.forEach(g => {
    gameMap[g.GameId] = g;
  });

  const history = picks.map(p => {
    const game = gameMap[p.GameId];

    if (!game) {
      return null;
    }

    const scored = scorePick_(game, p);
    const spreadWinner = getSpreadWinner_(game);

    let resultLabel = 'Pending';
    const status = String(game.Status || '').trim().toLowerCase();

    if (status === 'final') {
      if (spreadWinner === 'PUSH') {
        resultLabel = 'Push - Correct';
      } else if (scored.correct) {
        resultLabel = 'Correct';
      } else {
        resultLabel = 'Incorrect';
      }
    }

    return {
      week: Number(p.Week),
      gameId: p.GameId,
      kickoffUTC: game.KickoffUTC,
      matchup: `${game.AwayAbbr} at ${game.HomeAbbr}`,
      awayAbbr: game.AwayAbbr,
      homeAbbr: game.HomeAbbr,
      awaySpread: Number(game.AwaySpread),
      homeSpread: Number(game.HomeSpread),
      awayScore: game.AwayScore,
      homeScore: game.HomeScore,
      pickedAbbr: p.PickedAbbr,
      isTriple: String(p.IsTriple).toUpperCase() === 'TRUE',
      status: game.Status || '',
      spreadWinner,
      resultLabel,
      correct: scored.correct,
      points: scored.points
    };
  }).filter(Boolean);

  history.sort((a, b) => {
    if (a.week !== b.week) {
      return b.week - a.week;
    }

    return new Date(a.kickoffUTC) - new Date(b.kickoffUTC);
  });

  return history;
}

function getAllPicksForWeek(week) {
  const config = getConfig_();
  const lockMinutes = Number(config.LOCK_MINUTES_BEFORE_KICKOFF || 60);

  const users = readObjects_(SHEETS.USERS)
    .filter(u => String(u.Active).toUpperCase() === 'TRUE');

  const games = readObjects_(SHEETS.GAMES)
    .filter(g => Number(g.Week) === Number(week))
    .sort((a, b) => new Date(a.KickoffUTC) - new Date(b.KickoffUTC));

  const gameList = games.map(g => ({
    gameId: String(g.GameId),
    kickoffUTC: g.KickoffUTC,
    matchup: `${g.AwayAbbr} at ${g.HomeAbbr}`,
    awayAbbr: g.AwayAbbr,
    homeAbbr: g.HomeAbbr,
    awaySpread: Number(g.AwaySpread),
    homeSpread: Number(g.HomeSpread),
    awayScore: g.AwayScore,
    homeScore: g.HomeScore,
    status: g.Status || '',
    spreadWinner: getSpreadWinner_(g)
  }));

  if (games.length === 0) {
    return {
      week: Number(week),
      isRevealed: false,
      revealAt: '',
      games: [],
      rows: []
    };
  }

  const lockTimes = games
    .map(g => {
      const kickoff = new Date(g.KickoffUTC);
      if (Number.isNaN(kickoff.getTime())) return null;

      return kickoff.getTime() - lockMinutes * 60 * 1000;
    })
    .filter(Boolean);

  if (lockTimes.length === 0) {
    return {
      week: Number(week),
      isRevealed: false,
      revealAt: '',
      games: gameList,
      rows: []
    };
  }

  const fullWeekLockTime = new Date(Math.max(...lockTimes));
  const now = new Date();
  const isRevealed = now >= fullWeekLockTime;

  if (!isRevealed) {
    return {
      week: Number(week),
      isRevealed: false,
      revealAt: fullWeekLockTime.toISOString(),
      games: gameList,
      rows: []
    };
  }

  const picks = readObjects_(SHEETS.PICKS)
    .filter(p => Number(p.Week) === Number(week));

  const picksByUserGame = {};

  picks.forEach(p => {
    const userId = String(p.UserId);
    const gameId = String(p.GameId);

    if (!picksByUserGame[userId]) {
      picksByUserGame[userId] = {};
    }

    picksByUserGame[userId][gameId] = p;
  });

  const rows = users.map(u => {
    const userId = String(u.UserId);
    const userPicks = picksByUserGame[userId] || {};

    let weekPoints = 0;
    let weekCorrect = 0;
    let picksSubmitted = 0;
    const picksByGame = {};

    games.forEach(g => {
      const gameId = String(g.GameId);
      const pick = userPicks[gameId];

      if (!pick) {
        picksByGame[gameId] = null;
        return;
      }

      picksSubmitted++;

      const scored = scorePick_(g, pick);
      const spreadWinner = getSpreadWinner_(g);

      weekPoints += scored.points;
      weekCorrect += scored.correct ? 1 : 0;

      let resultLabel = 'Pending';
      const status = String(g.Status || '').trim().toLowerCase();

      if (status === 'final') {
        if (spreadWinner === 'PUSH') {
          resultLabel = 'Push - Correct';
        } else if (scored.correct) {
          resultLabel = 'Correct';
        } else {
          resultLabel = 'Incorrect';
        }
      }

      picksByGame[gameId] = {
        pickedAbbr: pick.PickedAbbr,
        isTriple: String(pick.IsTriple).toUpperCase() === 'TRUE',
        correct: scored.correct,
        points: scored.points,
        resultLabel,
        spreadWinner
      };
    });

    return {
      userId,
      name: u.Name,
      picksSubmitted,
      weekPoints,
      weekCorrect,
      picksByGame
    };
  });

  rows.sort((a, b) => {
    if (b.weekPoints !== a.weekPoints) {
      return b.weekPoints - a.weekPoints;
    }

    if (b.weekCorrect !== a.weekCorrect) {
      return b.weekCorrect - a.weekCorrect;
    }

    return a.name.localeCompare(b.name);
  });

  return {
    week: Number(week),
    isRevealed: true,
    revealAt: fullWeekLockTime.toISOString(),
    games: gameList,
    rows
  };
}

function scorePick_(game, pick) {
  const status = String(game.Status || '').trim().toLowerCase();

  if (status !== 'final') {
    return {
      correct: false,
      points: 0
    };
  }

  if (game.AwayScore === '' || game.HomeScore === '') {
    return {
      correct: false,
      points: 0
    };
  }

  const awayScore = Number(game.AwayScore);
  const homeScore = Number(game.HomeScore);

  if (Number.isNaN(awayScore) || Number.isNaN(homeScore)) {
    return {
      correct: false,
      points: 0
    };
  }

  const awayAdjusted = awayScore + Number(game.AwaySpread);
  const homeAdjusted = homeScore + Number(game.HomeSpread);

  let winner;

  if (awayAdjusted > homeAdjusted) {
    winner = game.AwayAbbr;
  } else if (homeAdjusted > awayAdjusted) {
    winner = game.HomeAbbr;
  } else {
    winner = 'PUSH';
  }

  const picked = String(pick.PickedAbbr || pick.pickedAbbr);
  const isTriple = String(pick.IsTriple || pick.isTriple).toUpperCase() === 'TRUE';

  const correct =
    winner === 'PUSH'
      ? [game.AwayAbbr, game.HomeAbbr].includes(picked)
      : picked === winner;

  return {
    correct,
    points: correct ? isTriple ? 3 : 1 : 0
  };
}

function getSpreadWinner_(game) {
  const status = String(game.Status || '').trim().toLowerCase();

  if (status !== 'final') {
    return '';
  }

  if (game.AwayScore === '' || game.HomeScore === '') {
    return '';
  }

  const awayScore = Number(game.AwayScore);
  const homeScore = Number(game.HomeScore);

  if (Number.isNaN(awayScore) || Number.isNaN(homeScore)) {
    return '';
  }

  const awayAdjusted = awayScore + Number(game.AwaySpread);
  const homeAdjusted = homeScore + Number(game.HomeSpread);

  if (awayAdjusted > homeAdjusted) {
    return game.AwayAbbr;
  }

  if (homeAdjusted > awayAdjusted) {
    return game.HomeAbbr;
  }

  return 'PUSH';
}

function replaceUserWeekPicks_(userId, week, picks) {
  const picksSheet = sheet_(SHEETS.PICKS);
  const values = picksSheet.getDataRange().getValues();

  for (let r = values.length; r >= 2; r--) {
    const row = values[r - 1];
    const rowWeek = Number(row[1]);
    const rowUserId = String(row[2]);

    if (rowWeek === Number(week) && rowUserId === String(userId)) {
      picksSheet.deleteRow(r);
    }
  }

  const now = new Date().toISOString();

  const rows = picks.map(p => [
    now,
    week,
    userId,
    p.gameId,
    p.pickedAbbr,
    p.isTriple ? 'TRUE' : 'FALSE'
  ]);

  picksSheet
    .getRange(picksSheet.getLastRow() + 1, 1, rows.length, rows[0].length)
    .setValues(rows);
}

function getCurrentWeek_() {
  const weeks = readObjects_(SHEETS.WEEKS);
  const now = new Date();

  if (!weeks || weeks.length === 0) {
    const config = getConfig_();
    return Number(config.CURRENT_WEEK || 1);
  }

  const parsedWeeks = weeks
    .map(w => {
      const weekNum = Number(w.Week);
      const start = new Date(w.WeekStartUTC);
      const end = new Date(w.WeekEndUTC);

      return {
        week: weekNum,
        start,
        end
      };
    })
    .filter(w =>
      !Number.isNaN(w.week) &&
      !Number.isNaN(w.start.getTime()) &&
      !Number.isNaN(w.end.getTime())
    )
    .sort((a, b) => a.week - b.week);

  const current = parsedWeeks.find(w =>
    now >= w.start && now <= w.end
  );

  if (current) {
    return current.week;
  }

  const nextWeek = parsedWeeks.find(w => now < w.start);
  if (nextWeek) {
    return nextWeek.week;
  }

  if (parsedWeeks.length > 0) {
    return parsedWeeks[parsedWeeks.length - 1].week;
  }

  return 1;
}

function getWeekRange_(week) {
  const weeks = readObjects_(SHEETS.WEEKS);

  const row = weeks.find(w => Number(w.Week) === Number(week));

  if (!row) {
    throw new Error(`Week ${week} was not found in the Weeks sheet.`);
  }

  const weekStart = new Date(row.WeekStartUTC);
  const weekEnd = new Date(row.WeekEndUTC);

  if (
    Number.isNaN(weekStart.getTime()) ||
    Number.isNaN(weekEnd.getTime())
  ) {
    throw new Error(`Invalid date range for Week ${week} in the Weeks sheet.`);
  }

  return {
    weekStart,
    weekEnd
  };
}

function createSheetIfMissing_(name, rows) {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function sheet_(name) {
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function readObjects_(sheetName) {
  const sheet = sheet_(sheetName);

  if (!sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) return [];

  const headers = values[0];

  return values
    .slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
}

function getConfig_() {
  const rows = readObjects_(SHEETS.CONFIG);
  const config = {};

  rows.forEach(r => {
    config[r.Key] = r.Value;
  });

  return config;
}

function teamAbbrFromOddsName_(oddsName) {
  const teams = readObjects_(SHEETS.TEAMS);

  const found = teams.find(t =>
    String(t.OddsApiName).trim().toLowerCase() ===
    String(oddsName).trim().toLowerCase()
  );

  return found ? found.Abbr : '';
}

function findRowByValue_(sheetName, headerName, value) {
  const sheet = sheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const colIndex = headers.indexOf(headerName);

  if (colIndex === -1) {
    throw new Error(`Header not found: ${headerName}`);
  }

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][colIndex]) === String(value)) {
      return r + 1;
    }
  }

  return -1;
}

function formatEspnDate_(date) {
  return Utilities.formatDate(date, 'America/New_York', 'yyyyMMdd');
}

function normalizeTeamAbbr_(abbr) {
  const value = String(abbr || '').trim().toUpperCase();

  const map = {
    WSH: 'WAS',
    JAC: 'JAX',
    LAR: 'LA'
  };

  return map[value] || value;
}