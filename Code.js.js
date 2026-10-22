const SHEETS = {
  CONFIG: 'Config',
  USERS: 'Users',
  TEAMS: 'Teams',
  GAMES: 'Games',
  PICKS: 'Picks',
  WEEKS: 'Weeks'
};

const MAX_PICKS_PER_WEEK = 8;

const SCRIPT_PROPERTIES = {
  SPREADSHEET_ID: 'PICK_EM_SPREADSHEET_ID',
  ODDS_API_KEY: 'ODDS_API_KEY'
};

/* ========================================================================== */
/* WEB APP                                                                    */
/* ========================================================================== */

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Family NFL Pick Em')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ========================================================================== */
/* SPREADSHEET MENU                                                           */
/* ========================================================================== */

function onOpen() {
  try {
    rememberSpreadsheetId_();
  } catch (error) {
    console.warn(
      `Could not remember spreadsheet ID: ${error.message}`
    );
  }

  SpreadsheetApp.getUi()
    .createMenu('Pick Em App')
    .addItem('1. Setup Sheets', 'setupPickEm')
    .addItem(
      '2. Fix Week Ranges for Monday Night Games',
      'fixWeekRangesForMondayNightGames'
    )
    .addSeparator()
    .addItem(
      'Import Odds For Current Week',
      'importOddsForCurrentWeek'
    )
    .addItem(
      'Import Scores For Current Week',
      'importScoresForCurrentWeek'
    )
    .addSeparator()
    .addItem(
      'Create Odds Update Trigger',
      'createOddsUpdateTrigger'
    )
    .addItem(
      'Delete Odds Update Triggers',
      'deleteOddsUpdateTriggers'
    )
    .addSeparator()
    .addItem(
      'Create Hourly Score Update Trigger',
      'createScoreUpdateTrigger'
    )
    .addItem(
      'Delete Score Update Triggers',
      'deleteScoreUpdateTriggers'
    )
    .addToUi();
}

/* ========================================================================== */
/* INITIAL SETUP                                                              */
/* ========================================================================== */

function setupPickEm() {
  rememberSpreadsheetId_();

  createSheetIfMissing_(SHEETS.CONFIG, [
    ['Key', 'Value'],
    ['CURRENT_WEEK', '1'],
    ['WEEK_START', '2026-09-08T12:00:00Z'],
    ['WEEK_END', '2026-09-15T11:59:59Z'],
    ['LOCK_MINUTES_BEFORE_KICKOFF', '1'],
    ['ODDS_API_KEY', 'PASTE_YOUR_ODDS_API_KEY_HERE'],
    ['ODDS_SPORT_KEY', 'americanfootball_nfl'],
    ['ODDS_BOOKMAKER', 'draftkings'],
    ['ODDS_SCORE_DAYS_FROM', '3'],
    ['ODDS_FREEZE_DAY', 'WEDNESDAY'],
    ['ODDS_FREEZE_HOUR', '12'],
    ['ODDS_FREEZE_MINUTE', '0'],
    ['ODDS_FREEZE_TIMEZONE', 'America/New_York']
  ]);

  createSheetIfMissing_(
    SHEETS.WEEKS,
    buildDefaultWeekRows_()
  );

  createSheetIfMissing_(SHEETS.USERS, [
    ['UserId', 'Name', 'Pin', 'Active', 'IsAdmin'],
    ['1', 'Chris', '1111', 'TRUE', 'FALSE'],
    ['2', 'Peg', '2222', 'TRUE', 'FALSE'],
    ['3', 'Jeremy', '3333', 'TRUE', 'TRUE'],
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

  /*
   * Add new configuration keys to an existing Config sheet without
   * overwriting existing configuration values.
   */
  ensureConfigKey_('ODDS_SCORE_DAYS_FROM', '3');
  ensureConfigKey_('ODDS_FREEZE_DAY', 'WEDNESDAY');
  ensureConfigKey_('ODDS_FREEZE_HOUR', '12');
  ensureConfigKey_('ODDS_FREEZE_MINUTE', '0');
  ensureConfigKey_(
    'ODDS_FREEZE_TIMEZONE',
    'America/New_York'
  );

  SpreadsheetApp.getUi().alert(
    'Pick Em sheets are ready.\n\n' +
    'For an existing workbook, also run:\n' +
    'Pick Em App > Fix Week Ranges for Monday Night Games'
  );
}

/**
 * Builds default ranges for Week 1 through Week 18.
 *
 * Each week starts Tuesday at noon UTC and ends the following Tuesday
 * at 11:59:59 UTC. This includes Monday night games, which occur on
 * Tuesday in UTC.
 */
function buildDefaultWeekRows_() {
  const rows = [
    ['Week', 'WeekStartUTC', 'WeekEndUTC']
  ];

  const weekOneStart = new Date(
    '2026-09-08T12:00:00Z'
  );

  for (let week = 1; week <= 18; week++) {
    const start = new Date(
      weekOneStart.getTime() +
      (week - 1) * 7 * 24 * 60 * 60 * 1000
    );

    const end = new Date(
      start.getTime() +
      7 * 24 * 60 * 60 * 1000 -
      1000
    );

    rows.push([
      week,
      start.toISOString(),
      end.toISOString()
    ]);
  }

  return rows;
}

/* ========================================================================== */
/* WEEK RANGE REPAIR                                                          */
/* ========================================================================== */

/**
 * Repairs existing week ranges so Monday night games are included.
 *
 * This is idempotent and can safely be run more than once.
 */
function fixWeekRangesForMondayNightGames() {
  rememberSpreadsheetId_();

  const weeksSheet = sheet_(SHEETS.WEEKS);

  if (!weeksSheet) {
    throw new Error('The Weeks sheet was not found.');
  }

  const values = weeksSheet
    .getDataRange()
    .getValues();

  if (values.length < 2) {
    throw new Error(
      'No week ranges were found in the Weeks sheet.'
    );
  }

  const headers = values[0];
  const startCol = headers.indexOf('WeekStartUTC');
  const endCol = headers.indexOf('WeekEndUTC');

  if (startCol === -1 || endCol === -1) {
    throw new Error(
      'The Weeks sheet must contain WeekStartUTC and WeekEndUTC columns.'
    );
  }

  let updated = 0;

  for (let r = 1; r < values.length; r++) {
    const currentStart = new Date(
      values[r][startCol]
    );

    if (Number.isNaN(currentStart.getTime())) {
      continue;
    }

    const normalizedStart = new Date(Date.UTC(
      currentStart.getUTCFullYear(),
      currentStart.getUTCMonth(),
      currentStart.getUTCDate(),
      12,
      0,
      0,
      0
    ));

    const normalizedEnd = new Date(
      normalizedStart.getTime() +
      7 * 24 * 60 * 60 * 1000 -
      1000
    );

    values[r][startCol] =
      normalizedStart.toISOString();

    values[r][endCol] =
      normalizedEnd.toISOString();

    updated++;
  }

  if (updated > 0) {
    weeksSheet
      .getRange(
        2,
        1,
        values.length - 1,
        headers.length
      )
      .setValues(values.slice(1));
  }

  SpreadsheetApp.getUi().alert(
    `${updated} week ranges were repaired.\n\n` +
    'Monday night games will now remain in the correct NFL week.\n\n' +
    'Next, run Import Odds For Current Week again.'
  );
}

/* ========================================================================== */
/* ODDS IMPORT                                                                */
/* ========================================================================== */

function importOddsForCurrentWeek() {
  rememberSpreadsheetId_();

  const result = runWithScriptLock_(
    () => importOddsForCurrentWeek_()
  );

  const freezeStatus = result.weeklyOddsFrozen
    ? 'ACTIVE — existing spreads were preserved'
    : 'Not active yet';

  SpreadsheetApp.getUi().alert(
    `Odds import completed for Week ${result.week}.\n\n` +
    `API events returned: ${result.eventsReturned}\n` +
    `New games added: ${result.added}\n` +
    `Existing games processed: ${result.updated}\n` +
    `Stored spreads preserved: ${result.lockedSpreadsPreserved}\n` +
    `Preserved by weekly freeze: ${result.weeklyFrozenSpreadsPreserved}\n` +
    `Events skipped: ${result.skipped}\n\n` +
    `Weekly odds freeze: ${result.oddsFreezeLocal}\n` +
    `Freeze status: ${freezeStatus}`
  );

  return result;
}

/**
 * Trigger-safe odds import.
 */
function importOddsForCurrentWeekTrigger() {
  try {
    const result = runWithScriptLock_(
      () => importOddsForCurrentWeek_()
    );

    console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    console.error(
      `Odds import trigger failed: ${error.message}\n` +
      `${error.stack || ''}`
    );

    throw error;
  }
}

/**
 * Imports spreads from The Odds API.
 *
 * Existing spreads are preserved when either:
 * 1. The weekly Wednesday-noon freeze has passed; or
 * 2. The individual game is already locked.
 *
 * A missing game can still be added after the weekly freeze. Its first
 * imported spread will then be preserved by later imports.
 */
function importOddsForCurrentWeek_() {
  const config = getConfig_();
  const apiKey = getOddsApiKey_();

  if (
    !apiKey ||
    apiKey === 'PASTE_YOUR_ODDS_API_KEY_HERE'
  ) {
    throw new Error(
      'Add your Odds API key to the Config sheet or Script Properties first.'
    );
  }

  const week = getCurrentWeek_();
  const range = getWeekRange_(week);
  const weekStart = range.weekStart;
  const weekEnd = range.weekEnd;

  const sportKey = String(
    config.ODDS_SPORT_KEY ||
    'americanfootball_nfl'
  ).trim();

  const bookmaker = String(
    config.ODDS_BOOKMAKER ||
    'draftkings'
  ).trim();

  const lockMinutes = Number(
    config.LOCK_MINUTES_BEFORE_KICKOFF ||
    1
  );

  const url =
    `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds` +
    `?apiKey=${encodeURIComponent(apiKey)}` +
    '&regions=us' +
    '&markets=spreads' +
    '&oddsFormat=american' +
    `&bookmakers=${encodeURIComponent(bookmaker)}`;

  const apiResult = fetchOddsApiJson_(
    url,
    'The Odds API odds endpoint'
  );

  const events = apiResult.data;

  if (!Array.isArray(events)) {
    throw new Error(
      'The Odds API odds response did not contain an event array.'
    );
  }

  const gamesSheet = sheet_(SHEETS.GAMES);

  if (!gamesSheet) {
    throw new Error('The Games sheet was not found.');
  }

  const existingGames = readObjects_(
    SHEETS.GAMES
  );

  const existingByApiId = {};
  const existingByMatchup = {};

  existingGames.forEach(game => {
    const apiEventId = String(
      game.ApiEventId || ''
    ).trim();

    if (apiEventId) {
      existingByApiId[apiEventId] = game;
    }

    const gameWeek = Number(game.Week);
    const awayAbbr = normalizeTeamAbbr_(
      game.AwayAbbr
    );
    const homeAbbr = normalizeTeamAbbr_(
      game.HomeAbbr
    );

    if (awayAbbr && homeAbbr) {
      existingByMatchup[
        `${gameWeek}|${awayAbbr}_${homeAbbr}`
      ] = game;
    }
  });

  const now = new Date();
  const oddsFreezeInfo = getOddsFreezeInfo_(week);

  const weeklyOddsFrozen =
    now >= oddsFreezeInfo.time;

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let lockedSpreadsPreserved = 0;
  let weeklyFrozenSpreadsPreserved = 0;

  events.forEach(event => {
    const kickoff = new Date(
      event.commence_time
    );

    if (
      Number.isNaN(kickoff.getTime()) ||
      kickoff < weekStart ||
      kickoff > weekEnd
    ) {
      skipped++;
      return;
    }

    const books = Array.isArray(
      event.bookmakers
    )
      ? event.bookmakers
      : [];

    /*
     * Prefer the configured bookmaker. If it is not present, use the
     * first bookmaker returned so a game is not omitted entirely.
     */
    const book =
      books.find(item =>
        String(item.key) === bookmaker
      ) ||
      books[0];

    if (
      !book ||
      !Array.isArray(book.markets)
    ) {
      skipped++;
      return;
    }

    const spreadMarket = book.markets.find(
      market => market.key === 'spreads'
    );

    if (
      !spreadMarket ||
      !Array.isArray(spreadMarket.outcomes)
    ) {
      skipped++;
      return;
    }

    const awayName = String(
      event.away_team || ''
    ).trim();

    const homeName = String(
      event.home_team || ''
    ).trim();

    const awayAbbr =
      teamAbbrFromOddsName_(awayName);

    const homeAbbr =
      teamAbbrFromOddsName_(homeName);

    if (!awayAbbr || !homeAbbr) {
      throw new Error(
        `Could not map Odds API teams: ${awayName} / ${homeName}`
      );
    }

    const awayOutcome =
      spreadMarket.outcomes.find(
        outcome => outcome.name === awayName
      );

    const homeOutcome =
      spreadMarket.outcomes.find(
        outcome => outcome.name === homeName
      );

    if (!awayOutcome || !homeOutcome) {
      skipped++;
      return;
    }

    const eventId = String(
      event.id || ''
    ).trim();

    if (!eventId) {
      skipped++;
      return;
    }

    let awaySpread = Number(
      awayOutcome.point
    );

    let homeSpread = Number(
      homeOutcome.point
    );

    if (
      !Number.isFinite(awaySpread) ||
      !Number.isFinite(homeSpread)
    ) {
      skipped++;
      return;
    }

    const matchupKey =
      `${week}|${awayAbbr}_${homeAbbr}`;

    /*
     * Match by API event ID first, then by matchup. Matching by matchup
     * prevents a duplicate if the API event ID changes.
     */
    const existing =
      existingByApiId[eventId] ||
      existingByMatchup[matchupKey] ||
      null;

    let gameId = eventId;
    let awayScore = '';
    let homeScore = '';
    let status = 'Scheduled';

    if (existing) {
      gameId = String(
        existing.GameId || eventId
      );

      awayScore = existing.AwayScore;
      homeScore = existing.HomeScore;
      status = existing.Status || 'Scheduled';

      const gameLockTime = new Date(
        kickoff.getTime() -
        lockMinutes * 60 * 1000
      );

      const preserveStoredSpread =
        weeklyOddsFrozen ||
        now >= gameLockTime;

      if (preserveStoredSpread) {
        const existingAwaySpread =
          parseNumberOrNull_(
            existing.AwaySpread
          );

        const existingHomeSpread =
          parseNumberOrNull_(
            existing.HomeSpread
          );

        /*
         * If the stored spread is blank or invalid, allow the API spread
         * to fill it even after the freeze.
         */
        if (
          existingAwaySpread !== null &&
          existingHomeSpread !== null
        ) {
          awaySpread = existingAwaySpread;
          homeSpread = existingHomeSpread;
          lockedSpreadsPreserved++;

          if (weeklyOddsFrozen) {
            weeklyFrozenSpreadsPreserved++;
          }
        }
      }
    }

    const row = [
      gameId,
      week,
      kickoff.toISOString(),
      awayAbbr,
      awayName,
      homeAbbr,
      homeName,
      awaySpread,
      homeSpread,
      awayScore,
      homeScore,
      status,
      eventId,
      now.toISOString()
    ];

    if (existing) {
      const rowIndex = findRowByValue_(
        SHEETS.GAMES,
        'GameId',
        gameId
      );

      if (rowIndex > 0) {
        gamesSheet
          .getRange(
            rowIndex,
            1,
            1,
            row.length
          )
          .setValues([row]);

        updated++;
      } else {
        gamesSheet.appendRow(row);
        added++;
      }
    } else {
      gamesSheet.appendRow(row);
      added++;
    }

    existingByApiId[eventId] = {
      GameId: gameId,
      ApiEventId: eventId,
      Week: week,
      AwayAbbr: awayAbbr,
      HomeAbbr: homeAbbr,
      AwaySpread: awaySpread,
      HomeSpread: homeSpread,
      AwayScore: awayScore,
      HomeScore: homeScore,
      Status: status
    };

    existingByMatchup[matchupKey] =
      existingByApiId[eventId];
  });

  return {
    success: true,
    week,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    oddsFreezeUTC:
      oddsFreezeInfo.time.toISOString(),
    oddsFreezeLocal:
      oddsFreezeInfo.localText,
    weeklyOddsFrozen,
    eventsReturned: events.length,
    added,
    updated,
    skipped,
    lockedSpreadsPreserved,
    weeklyFrozenSpreadsPreserved,
    requestsRemaining:
      apiResult.requestsRemaining
  };
}

/* ========================================================================== */
/* WEEKLY ODDS FREEZE                                                         */
/* ========================================================================== */

/**
 * Returns the configured weekly odds freeze time.
 *
 * Default:
 * Wednesday at 12:00 PM America/New_York.
 */
function getOddsFreezeInfo_(week) {
  const config = getConfig_();
  const range = getWeekRange_(week);

  let timezone = String(
    config.ODDS_FREEZE_TIMEZONE ||
    'America/New_York'
  ).trim();

  try {
    Utilities.formatDate(
      new Date(),
      timezone,
      'yyyy-MM-dd'
    );
  } catch (error) {
    timezone = 'America/New_York';
  }

  const dayName = String(
    config.ODDS_FREEZE_DAY ||
    'WEDNESDAY'
  ).trim().toUpperCase();

  let hour = Number(
    config.ODDS_FREEZE_HOUR !== undefined
      ? config.ODDS_FREEZE_HOUR
      : 12
  );

  let minute = Number(
    config.ODDS_FREEZE_MINUTE !== undefined
      ? config.ODDS_FREEZE_MINUTE
      : 0
  );

  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23
  ) {
    hour = 12;
  }

  if (
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    minute = 0;
  }

  const weekdays = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
  };

  const targetWeekday =
    weekdays[dayName] !== undefined
      ? weekdays[dayName]
      : weekdays.WEDNESDAY;

  /*
   * Find the local calendar date on which the configured NFL week starts.
   */
  const localStartText = Utilities.formatDate(
    range.weekStart,
    timezone,
    'yyyy-MM-dd'
  );

  const startParts = localStartText
    .split('-')
    .map(Number);

  const startYear = startParts[0];
  const startMonth = startParts[1];
  const startDay = startParts[2];

  /*
   * UTC noon is used only for safe calendar arithmetic. It is not the
   * final freeze timestamp.
   */
  const calendarAnchor = new Date(Date.UTC(
    startYear,
    startMonth - 1,
    startDay,
    12,
    0,
    0,
    0
  ));

  const startWeekday =
    calendarAnchor.getUTCDay();

  const daysUntilTarget =
    (targetWeekday - startWeekday + 7) % 7;

  const targetCalendarDate = new Date(Date.UTC(
    startYear,
    startMonth - 1,
    startDay + daysUntilTarget,
    12,
    0,
    0,
    0
  ));

  const targetYear =
    targetCalendarDate.getUTCFullYear();

  const targetMonth =
    targetCalendarDate.getUTCMonth() + 1;

  const targetDay =
    targetCalendarDate.getUTCDate();

  const freezeTime = localDateTimeToUtc_(
    targetYear,
    targetMonth,
    targetDay,
    hour,
    minute,
    timezone
  );

  return {
    time: freezeTime,
    timezone,
    dayName,
    hour,
    minute,
    localText: Utilities.formatDate(
      freezeTime,
      timezone,
      'EEE MMM d, yyyy h:mm a z'
    )
  };
}

/**
 * Converts a date/time in a named timezone to a UTC Date.
 *
 * The iterative adjustment handles daylight-saving-time changes.
 */
function localDateTimeToUtc_(
  year,
  month,
  day,
  hour,
  minute,
  timezone
) {
  const requestedAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

  let guess = new Date(requestedAsUtc);

  for (let attempt = 0; attempt < 4; attempt++) {
    const localText = Utilities.formatDate(
      guess,
      timezone,
      'yyyy-MM-dd-HH-mm-ss'
    );

    const parts = localText
      .split('-')
      .map(Number);

    const formattedLocalAsUtc = Date.UTC(
      parts[0],
      parts[1] - 1,
      parts[2],
      parts[3],
      parts[4],
      parts[5],
      0
    );

    const difference =
      requestedAsUtc - formattedLocalAsUtc;

    if (difference === 0) {
      break;
    }

    guess = new Date(
      guess.getTime() + difference
    );
  }

  return guess;
}

/* ========================================================================== */
/* SCORE IMPORT USING THE ODDS API                                            */
/* ========================================================================== */

function importScoresForCurrentWeek() {
  rememberSpreadsheetId_();

  const result = runWithScriptLock_(
    () => importScoresForCurrentWeek_()
  );

  const unmatchedPreview =
    result.unmatchedGames.length > 0
      ? (
          '\n\nUnmatched games:\n' +
          result.unmatchedGames
            .slice(0, 10)
            .join('\n')
        )
      : '';

  SpreadsheetApp.getUi().alert(
    `Score import completed for Week ${result.week}.\n\n` +
    `Provider: ${result.provider}\n` +
    `Score events returned: ${result.eventsReturned}\n` +
    `Games matched: ${result.gamesMatched}\n` +
    `Final scores updated: ${result.updatedFinals}\n` +
    `Live scores updated: ${result.updatedLiveScores}\n` +
    `Statuses updated: ${result.updatedStatuses}\n` +
    `Already-final games skipped: ${result.alreadyFinalSkipped}\n` +
    `Completed events missing scores: ${result.missingCompletedScores}\n` +
    `Games not matched: ${result.gamesNotMatched}` +
    unmatchedPreview
  );

  return result;
}

/**
 * Trigger-safe score import.
 *
 * The API is only contacted if a pending game is near kickoff.
 */
function importScoresForCurrentWeekTrigger() {
  try {
    if (!shouldRunAutomatedScoreImport_()) {
      const result = {
        success: true,
        skipped: true,
        reason:
          'No pending games are currently near kickoff.'
      };

      console.log(JSON.stringify(result));
      return result;
    }

    const result = runWithScriptLock_(
      () => importScoresForCurrentWeek_()
    );

    console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    console.error(
      `Score import trigger failed: ${error.message}\n` +
      `${error.stack || ''}`
    );

    throw error;
  }
}

/**
 * Imports live and completed scores from The Odds API.
 */
function importScoresForCurrentWeek_() {
  const config = getConfig_();
  const apiKey = getOddsApiKey_();

  if (
    !apiKey ||
    apiKey === 'PASTE_YOUR_ODDS_API_KEY_HERE'
  ) {
    throw new Error(
      'Add your Odds API key to the Config sheet or Script Properties first.'
    );
  }

  const week = getCurrentWeek_();

  const sportKey = String(
    config.ODDS_SPORT_KEY ||
    'americanfootball_nfl'
  ).trim();

  let daysFrom = Number(
    config.ODDS_SCORE_DAYS_FROM ||
    3
  );

  if (!Number.isFinite(daysFrom)) {
    daysFrom = 3;
  }

  daysFrom = Math.max(
    1,
    Math.min(3, Math.floor(daysFrom))
  );

  const gamesSheet = sheet_(SHEETS.GAMES);

  if (!gamesSheet) {
    throw new Error('The Games sheet was not found.');
  }

  const values = gamesSheet
    .getDataRange()
    .getValues();

  if (values.length < 2) {
    return emptyScoreImportResult_(week);
  }

  const headers = values[0];

  const col = {
    gameId: headers.indexOf('GameId'),
    week: headers.indexOf('Week'),
    kickoffUTC: headers.indexOf('KickoffUTC'),
    awayAbbr: headers.indexOf('AwayAbbr'),
    homeAbbr: headers.indexOf('HomeAbbr'),
    awayScore: headers.indexOf('AwayScore'),
    homeScore: headers.indexOf('HomeScore'),
    status: headers.indexOf('Status'),
    apiEventId: headers.indexOf('ApiEventId')
  };

  [
    'gameId',
    'week',
    'kickoffUTC',
    'awayAbbr',
    'homeAbbr',
    'awayScore',
    'homeScore',
    'status'
  ].forEach(columnName => {
    if (col[columnName] === -1) {
      throw new Error(
        `Missing Games column: ${columnName}`
      );
    }
  });

  const currentWeekRowIndexes = [];

  for (let r = 1; r < values.length; r++) {
    if (
      Number(values[r][col.week]) ===
      Number(week)
    ) {
      currentWeekRowIndexes.push(r);
    }
  }

  if (currentWeekRowIndexes.length === 0) {
    return emptyScoreImportResult_(week);
  }

  const scoreResponse = fetchOddsApiScores_(
    sportKey,
    apiKey,
    daysFrom
  );

  const events = scoreResponse.events;

  const teamNameToAbbr = {};

  readObjects_(SHEETS.TEAMS).forEach(team => {
    const abbr = normalizeTeamAbbr_(
      team.Abbr
    );

    const fullName = String(
      team.FullName || ''
    ).trim().toLowerCase();

    const oddsApiName = String(
      team.OddsApiName || ''
    ).trim().toLowerCase();

    if (fullName) {
      teamNameToAbbr[fullName] = abbr;
    }

    if (oddsApiName) {
      teamNameToAbbr[oddsApiName] = abbr;
    }
  });

  const eventsById = {};
  const eventsByMatchup = {};

  events.forEach(event => {
    const eventId = String(
      event.id || ''
    ).trim();

    if (eventId) {
      eventsById[eventId] = event;
    }

    const awayAbbr =
      getTeamAbbrFromScoreEvent_(
        event.away_team,
        teamNameToAbbr
      );

    const homeAbbr =
      getTeamAbbrFromScoreEvent_(
        event.home_team,
        teamNameToAbbr
      );

    if (awayAbbr && homeAbbr) {
      eventsByMatchup[
        `${awayAbbr}_${homeAbbr}`
      ] = event;
    }
  });

  const rowCount = values.length - 1;

  const awayScoreValues = values
    .slice(1)
    .map(row => [row[col.awayScore]]);

  const homeScoreValues = values
    .slice(1)
    .map(row => [row[col.homeScore]]);

  const statusValues = values
    .slice(1)
    .map(row => [row[col.status]]);

  let gamesMatched = 0;
  let updatedFinals = 0;
  let updatedLiveScores = 0;
  let updatedStatuses = 0;
  let alreadyFinalSkipped = 0;
  let missingCompletedScores = 0;
  let gamesNotMatched = 0;
  let dataChanged = false;

  const unmatchedGames = [];
  const now = new Date();

  currentWeekRowIndexes.forEach(r => {
    const row = values[r];

    const oldStatus = String(
      row[col.status] || ''
    ).trim();

    /*
     * Preserve final scores already stored in the sheet.
     */
    if (oldStatus.toLowerCase() === 'final') {
      alreadyFinalSkipped++;
      return;
    }

    const awayAbbr = normalizeTeamAbbr_(
      row[col.awayAbbr]
    );

    const homeAbbr = normalizeTeamAbbr_(
      row[col.homeAbbr]
    );

    const matchupKey =
      `${awayAbbr}_${homeAbbr}`;

    const storedEventId =
      col.apiEventId !== -1
        ? String(
            row[col.apiEventId] || ''
          ).trim()
        : String(
            row[col.gameId] || ''
          ).trim();

    const event =
      eventsById[storedEventId] ||
      eventsByMatchup[matchupKey];

    if (!event) {
      gamesNotMatched++;

      unmatchedGames.push(
        `${awayAbbr} at ${homeAbbr}`
      );

      return;
    }

    gamesMatched++;

    const awayScore = getOddsApiTeamScore_(
      event,
      event.away_team
    );

    const homeScore = getOddsApiTeamScore_(
      event,
      event.home_team
    );

    const hasBothScores =
      awayScore !== '' &&
      homeScore !== '';

    const outputIndex = r - 1;

    if (event.completed === true) {
      if (!hasBothScores) {
        missingCompletedScores++;
        return;
      }

      const finalChanged =
        String(row[col.awayScore]) !==
          String(awayScore) ||
        String(row[col.homeScore]) !==
          String(homeScore) ||
        oldStatus.toLowerCase() !== 'final';

      awayScoreValues[outputIndex][0] =
        awayScore;

      homeScoreValues[outputIndex][0] =
        homeScore;

      statusValues[outputIndex][0] =
        'Final';

      if (finalChanged) {
        updatedFinals++;
        dataChanged = true;
      }

      return;
    }

    const kickoff = new Date(
      event.commence_time ||
      row[col.kickoffUTC]
    );

    const hasStarted =
      !Number.isNaN(kickoff.getTime()) &&
      now >= kickoff;

    const newStatus =
      hasBothScores || hasStarted
        ? 'In Progress'
        : 'Scheduled';

    if (hasBothScores) {
      const liveScoreChanged =
        String(row[col.awayScore]) !==
          String(awayScore) ||
        String(row[col.homeScore]) !==
          String(homeScore);

      awayScoreValues[outputIndex][0] =
        awayScore;

      homeScoreValues[outputIndex][0] =
        homeScore;

      if (liveScoreChanged) {
        updatedLiveScores++;
        dataChanged = true;
      }
    }

    if (oldStatus !== newStatus) {
      statusValues[outputIndex][0] =
        newStatus;

      updatedStatuses++;
      dataChanged = true;
    }
  });

  /*
   * Only score and status columns are written. Spreads cannot be changed
   * by the score importer.
   */
  if (dataChanged) {
    gamesSheet
      .getRange(
        2,
        col.awayScore + 1,
        rowCount,
        1
      )
      .setValues(awayScoreValues);

    gamesSheet
      .getRange(
        2,
        col.homeScore + 1,
        rowCount,
        1
      )
      .setValues(homeScoreValues);

    gamesSheet
      .getRange(
        2,
        col.status + 1,
        rowCount,
        1
      )
      .setValues(statusValues);
  }

  const result = {
    success: true,
    week,
    provider: 'The Odds API',
    eventsReturned: events.length,
    gamesMatched,
    updatedFinals,
    updatedLiveScores,
    updatedStatuses,
    alreadyFinalSkipped,
    missingCompletedScores,
    gamesNotMatched,
    unmatchedGames,
    requestsRemaining:
      scoreResponse.requestsRemaining
  };

  console.log(JSON.stringify(result));

  return result;
}

/**
 * Requests upcoming, live, and recently completed games.
 */
function fetchOddsApiScores_(
  sportKey,
  apiKey,
  daysFrom
) {
  const url =
    `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/scores/` +
    `?apiKey=${encodeURIComponent(apiKey)}` +
    `&daysFrom=${encodeURIComponent(daysFrom)}` +
    '&dateFormat=iso';

  const result = fetchOddsApiJson_(
    url,
    'The Odds API scores endpoint'
  );

  if (!Array.isArray(result.data)) {
    throw new Error(
      'The Odds API scores response did not contain an event array.'
    );
  }

  return {
    events: result.data,
    requestsRemaining:
      result.requestsRemaining
  };
}

function getTeamAbbrFromScoreEvent_(
  teamName,
  teamNameToAbbr
) {
  const normalizedName = String(
    teamName || ''
  ).trim().toLowerCase();

  return teamNameToAbbr[normalizedName] || '';
}

function getOddsApiTeamScore_(
  event,
  teamName
) {
  if (!Array.isArray(event.scores)) {
    return '';
  }

  const normalizedTeamName = String(
    teamName || ''
  ).trim().toLowerCase();

  const scoreEntry = event.scores.find(
    item =>
      String(item.name || '')
        .trim()
        .toLowerCase() === normalizedTeamName
  );

  if (
    !scoreEntry ||
    scoreEntry.score === undefined ||
    scoreEntry.score === null ||
    scoreEntry.score === ''
  ) {
    return '';
  }

  const score = Number(
    scoreEntry.score
  );

  return Number.isFinite(score)
    ? score
    : '';
}

/**
 * Prevents unnecessary score API requests.
 *
 * The score trigger can run from 90 minutes before kickoff through
 * 30 hours after kickoff for any game not marked Final.
 */
function shouldRunAutomatedScoreImport_() {
  const week = getCurrentWeek_();

  const games = readObjects_(SHEETS.GAMES)
    .filter(game =>
      Number(game.Week) === Number(week) &&
      String(game.Status || '')
        .trim()
        .toLowerCase() !== 'final'
    );

  if (games.length === 0) {
    return false;
  }

  const nowTime = Date.now();
  const beforeKickoff =
    90 * 60 * 1000;
  const afterKickoff =
    30 * 60 * 60 * 1000;

  return games.some(game => {
    const kickoff = new Date(
      game.KickoffUTC
    );

    if (Number.isNaN(kickoff.getTime())) {
      return false;
    }

    const kickoffTime =
      kickoff.getTime();

    return (
      nowTime >=
        kickoffTime - beforeKickoff &&
      nowTime <=
        kickoffTime + afterKickoff
    );
  });
}

function emptyScoreImportResult_(week) {
  return {
    success: true,
    week,
    provider: 'The Odds API',
    eventsReturned: 0,
    gamesMatched: 0,
    updatedFinals: 0,
    updatedLiveScores: 0,
    updatedStatuses: 0,
    alreadyFinalSkipped: 0,
    missingCompletedScores: 0,
    gamesNotMatched: 0,
    unmatchedGames: [],
    requestsRemaining: ''
  };
}

/* ========================================================================== */
/* ODDS API HTTP HELPER                                                       */
/* ========================================================================== */

function fetchOddsApiJson_(url, serviceName) {
  let response;

  try {
    response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        Accept: 'application/json'
      }
    });
  } catch (error) {
    throw new Error(
      `${serviceName} connection failed: ${error.message}`
    );
  }

  const statusCode =
    response.getResponseCode();

  const responseText =
    response.getContentText();

  if (
    statusCode < 200 ||
    statusCode >= 300
  ) {
    throw new Error(
      `${serviceName} returned HTTP ${statusCode}. ` +
      `Response: ${responseText.substring(0, 1000)}`
    );
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `${serviceName} returned invalid JSON. ` +
      `Response begins with: ${responseText.substring(0, 500)}`
    );
  }

  const headers =
    response.getAllHeaders();

  const requestsRemaining =
    getHeaderValue_(
      headers,
      'x-requests-remaining'
    );

  return {
    data,
    requestsRemaining
  };
}

function getHeaderValue_(headers, requestedName) {
  const target = String(
    requestedName
  ).toLowerCase();

  const matchingKey = Object.keys(
    headers || {}
  ).find(key =>
    String(key).toLowerCase() === target
  );

  return matchingKey
    ? headers[matchingKey]
    : '';
}

/* ========================================================================== */
/* AUTOMATION TRIGGERS                                                        */
/* ========================================================================== */

function createOddsUpdateTrigger() {
  rememberSpreadsheetId_();
  deleteOddsUpdateTriggers(false);

  ScriptApp
    .newTrigger(
      'importOddsForCurrentWeekTrigger'
    )
    .timeBased()
    .everyHours(6)
    .create();

  SpreadsheetApp.getUi().alert(
    'Odds update trigger created.\n\n' +
    'It will run every 6 hours.\n\n' +
    'Existing spreads will stop changing after the configured ' +
    'Wednesday-noon freeze.'
  );
}

function deleteOddsUpdateTriggers(
  showAlert = true
) {
  const handlerNames = new Set([
    'importOddsForCurrentWeek',
    'importOddsForCurrentWeekTrigger'
  ]);

  ScriptApp
    .getProjectTriggers()
    .forEach(trigger => {
      if (
        handlerNames.has(
          trigger.getHandlerFunction()
        )
      ) {
        ScriptApp.deleteTrigger(trigger);
      }
    });

  if (showAlert) {
    SpreadsheetApp.getUi().alert(
      'Existing odds update triggers were deleted.'
    );
  }
}

function createScoreUpdateTrigger() {
  rememberSpreadsheetId_();
  deleteScoreUpdateTriggers(false);

  ScriptApp
    .newTrigger(
      'importScoresForCurrentWeekTrigger'
    )
    .timeBased()
    .everyHours(1)
    .create();

  SpreadsheetApp.getUi().alert(
    'Hourly score update trigger created using The Odds API.\n\n' +
    'The trigger only requests scores when a pending game is near kickoff.'
  );
}

function deleteScoreUpdateTriggers(
  showAlert = true
) {
  const handlerNames = new Set([
    'importScoresForCurrentWeek',
    'importScoresForCurrentWeekTrigger',
    'importScoresFromEspn',
    'importScoresFromEspnTrigger'
  ]);

  ScriptApp
    .getProjectTriggers()
    .forEach(trigger => {
      if (
        handlerNames.has(
          trigger.getHandlerFunction()
        )
      ) {
        ScriptApp.deleteTrigger(trigger);
      }
    });

  if (showAlert) {
    SpreadsheetApp.getUi().alert(
      'Existing score update triggers were deleted.'
    );
  }
}

/* ========================================================================== */
/* LOGIN AND APP DATA                                                         */
/* ========================================================================== */

function login(name, pin) {
  const users = readObjects_(
    SHEETS.USERS
  );

  const found = users.find(user =>
    String(user.Name)
      .trim()
      .toLowerCase() ===
      String(name)
        .trim()
        .toLowerCase() &&
    String(user.Pin).trim() ===
      String(pin).trim() &&
    String(user.Active).toUpperCase() ===
      'TRUE'
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
      isAdmin:
        String(found.IsAdmin)
          .toUpperCase() === 'TRUE'
    }
  };
}

function getAppData(userId) {
  const config = getConfig_();
  const week = getCurrentWeek_();

  const lockMinutes = Number(
    config.LOCK_MINUTES_BEFORE_KICKOFF ||
    1
  );

  const games = readObjects_(SHEETS.GAMES)
    .filter(game =>
      Number(game.Week) === week
    )
    .sort(
      (a, b) =>
        new Date(a.KickoffUTC) -
        new Date(b.KickoffUTC)
    );

  const picks = readObjects_(SHEETS.PICKS)
    .filter(pick =>
      Number(pick.Week) === week &&
      String(pick.UserId) ===
        String(userId)
    );

  const pickMap = {};

  picks.forEach(pick => {
    pickMap[String(pick.GameId)] = {
      pickedAbbr: pick.PickedAbbr,
      isTriple: toBoolean_(
        pick.IsTriple
      )
    };
  });

  const now = new Date();

  return {
    week,
    currentWeek: week,
    lockMinutes,

    games: games.map(game => {
      const kickoff = new Date(
        game.KickoffUTC
      );

      const lockTime = new Date(
        kickoff.getTime() -
        lockMinutes * 60 * 1000
      );

      const locked =
        Number.isNaN(lockTime.getTime()) ||
        now >= lockTime;

      const gameId =
        String(game.GameId);

      return {
        gameId,
        week: Number(game.Week),
        kickoffUTC:
          toIsoString_(game.KickoffUTC),
        awayAbbr: game.AwayAbbr,
        awayTeam: game.AwayTeam,
        homeAbbr: game.HomeAbbr,
        homeTeam: game.HomeTeam,
        awaySpread:
          Number(game.AwaySpread),
        homeSpread:
          Number(game.HomeSpread),
        awayScore: game.AwayScore,
        homeScore: game.HomeScore,
        status: game.Status,
        locked,
        existingPick:
          pickMap[gameId] || null
      };
    }),

    standings: getStandings(),
    weeklyStandings:
      getWeeklyStandings(week),
    seasonByWeek:
      getSeasonStandingsByWeek(),
    pickHistory:
      getPickHistoryForUser(userId),
    allPicks:
      getAllPicksForWeek(week)
  };
}

/* ========================================================================== */
/* PICK SUBMISSION                                                            */
/* ========================================================================== */

function submitPicks(payload) {
  if (!payload) {
    return {
      success: false,
      message:
        'No pick data was received.'
    };
  }

  const userId = String(
    payload.userId || ''
  );

  const pin = String(
    payload.pin || ''
  );

  const week = Number(
    payload.week
  );

  const submittedPicks =
    Array.isArray(payload.picks)
      ? payload.picks
      : [];

  const currentWeek =
    getCurrentWeek_();

  if (week !== currentWeek) {
    return {
      success: false,
      message:
        `Week ${week} is no longer the current week. ` +
        'Refresh the app and try again.'
    };
  }

  const users =
    readObjects_(SHEETS.USERS);

  const user = users.find(item =>
    String(item.UserId) === userId &&
    String(item.Pin).trim() ===
      pin.trim() &&
    String(item.Active).toUpperCase() ===
      'TRUE'
  );

  if (!user) {
    return {
      success: false,
      message:
        'Login expired or invalid PIN.'
    };
  }

  /*
   * Users may submit anywhere from 1 to MAX_PICKS_PER_WEEK picks, and can
   * come back later to add more until they reach the maximum.
   */
  if (submittedPicks.length < 1) {
    return {
      success: false,
      message:
        'You must select at least 1 game.'
    };
  }

  if (submittedPicks.length > MAX_PICKS_PER_WEEK) {
    return {
      success: false,
      message:
        `You can select at most ${MAX_PICKS_PER_WEEK} games.`
    };
  }

  /*
   * The 3-point pick is optional until it is chosen, but only one is
   * allowed per week.
   */
  const tripleCount =
    submittedPicks.filter(
      pick =>
        toBoolean_(pick.isTriple)
    ).length;

  if (tripleCount > 1) {
    return {
      success: false,
      message:
        'You can only have one 3-point pick.'
    };
  }

  const uniqueGames = new Set(
    submittedPicks.map(
      pick => String(pick.gameId)
    )
  );

  if (uniqueGames.size !== submittedPicks.length) {
    return {
      success: false,
      message:
        'Duplicate game detected.'
    };
  }

  const config = getConfig_();

  const lockMinutes = Number(
    config.LOCK_MINUTES_BEFORE_KICKOFF ||
    1
  );

  const games = readObjects_(SHEETS.GAMES)
    .filter(game =>
      Number(game.Week) === week
    );

  const gameMap = {};

  games.forEach(game => {
    gameMap[String(game.GameId)] =
      game;
  });

  const oldPicks = readObjects_(SHEETS.PICKS)
    .filter(pick =>
      Number(pick.Week) === week &&
      String(pick.UserId) === userId
    );

  const oldMap = {};

  oldPicks.forEach(pick => {
    oldMap[String(pick.GameId)] = {
      pickedAbbr:
        String(pick.PickedAbbr),
      isTriple:
        toBoolean_(pick.IsTriple)
    };
  });

  const submittedMap = {};

  submittedPicks.forEach(pick => {
    submittedMap[
      String(pick.gameId)
    ] = {
      pickedAbbr:
        String(pick.pickedAbbr),
      isTriple:
        toBoolean_(pick.isTriple)
    };
  });

  const now = new Date();

  /*
   * Ensure an existing locked pick was not removed.
   */
  for (
    const oldGameId of Object.keys(oldMap)
  ) {
    const game = gameMap[oldGameId];

    if (!game) {
      continue;
    }

    const kickoff = new Date(
      game.KickoffUTC
    );

    const lockTime = new Date(
      kickoff.getTime() -
      lockMinutes * 60 * 1000
    );

    if (now < lockTime) {
      continue;
    }

    const oldPick =
      oldMap[oldGameId];

    const newPick =
      submittedMap[oldGameId];

    if (
      !newPick ||
      newPick.pickedAbbr !==
        oldPick.pickedAbbr ||
      newPick.isTriple !==
        oldPick.isTriple
    ) {
      return {
        success: false,
        message:
          `${game.AwayAbbr} at ${game.HomeAbbr} is locked ` +
          'and cannot be removed or changed.'
      };
    }
  }

  for (
    const submittedPick of submittedPicks
  ) {
    const gameId = String(
      submittedPick.gameId
    );

    const pickedAbbr = String(
      submittedPick.pickedAbbr
    );

    const isTriple = toBoolean_(
      submittedPick.isTriple
    );

    const game = gameMap[gameId];

    if (!game) {
      return {
        success: false,
        message:
          'Invalid game selected.'
      };
    }

    if (
      ![
        String(game.AwayAbbr),
        String(game.HomeAbbr)
      ].includes(pickedAbbr)
    ) {
      return {
        success: false,
        message:
          'Invalid team selected.'
      };
    }

    const kickoff = new Date(
      game.KickoffUTC
    );

    const lockTime = new Date(
      kickoff.getTime() -
      lockMinutes * 60 * 1000
    );

    if (now >= lockTime) {
      const oldPick =
        oldMap[gameId];

      if (!oldPick) {
        return {
          success: false,
          message:
            `${game.AwayAbbr} at ${game.HomeAbbr} is locked.`
        };
      }

      if (
        oldPick.pickedAbbr !==
          pickedAbbr ||
        oldPick.isTriple !==
          isTriple
      ) {
        return {
          success: false,
          message:
            `${game.AwayAbbr} at ${game.HomeAbbr} is locked ` +
            'and cannot be changed.'
        };
      }
    }
  }

  const cleanPicks =
    submittedPicks.map(pick => ({
      gameId:
        String(pick.gameId),
      pickedAbbr:
        String(pick.pickedAbbr),
      isTriple:
        toBoolean_(pick.isTriple)
    }));

  replaceUserWeekPicks_(
    userId,
    week,
    cleanPicks
  );

  return {
    success: true,
    message: 'Picks submitted!'
  };
}

/* ========================================================================== */
/* STANDINGS                                                                  */
/* ========================================================================== */

function getStandings() {
  const users = readObjects_(SHEETS.USERS)
    .filter(user =>
      String(user.Active)
        .toUpperCase() === 'TRUE'
    );

  const games =
    readObjects_(SHEETS.GAMES);

  const picks =
    readObjects_(SHEETS.PICKS);

  const gameMap = {};

  games.forEach(game => {
    gameMap[String(game.GameId)] =
      game;
  });

  const result = users.map(user => {
    const userPicks = picks.filter(
      pick =>
        String(pick.UserId) ===
        String(user.UserId)
    );

    let seasonPoints = 0;
    let seasonCorrect = 0;

    userPicks.forEach(pick => {
      const game =
        gameMap[String(pick.GameId)];

      if (!game) {
        return;
      }

      const scored =
        scorePick_(game, pick);

      seasonPoints += scored.points;
      seasonCorrect +=
        scored.correct ? 1 : 0;
    });

    return {
      userId: String(user.UserId),
      name: user.Name,
      seasonPoints,
      seasonCorrect
    };
  });

  result.sort((a, b) => {
    if (
      b.seasonPoints !==
      a.seasonPoints
    ) {
      return (
        b.seasonPoints -
        a.seasonPoints
      );
    }

    if (
      b.seasonCorrect !==
      a.seasonCorrect
    ) {
      return (
        b.seasonCorrect -
        a.seasonCorrect
      );
    }

    return String(a.name)
      .localeCompare(String(b.name));
  });

  return result;
}

function getWeeklyStandings(week) {
  const users = readObjects_(SHEETS.USERS)
    .filter(user =>
      String(user.Active)
        .toUpperCase() === 'TRUE'
    );

  const games = readObjects_(SHEETS.GAMES)
    .filter(game =>
      Number(game.Week) ===
      Number(week)
    );

  const picks = readObjects_(SHEETS.PICKS)
    .filter(pick =>
      Number(pick.Week) ===
      Number(week)
    );

  const gameMap = {};

  games.forEach(game => {
    gameMap[String(game.GameId)] =
      game;
  });

  const result = users.map(user => {
    const userPicks = picks.filter(
      pick =>
        String(pick.UserId) ===
        String(user.UserId)
    );

    let weekPoints = 0;
    let weekCorrect = 0;

    userPicks.forEach(pick => {
      const game =
        gameMap[String(pick.GameId)];

      if (!game) {
        return;
      }

      const scored =
        scorePick_(game, pick);

      weekPoints += scored.points;
      weekCorrect +=
        scored.correct ? 1 : 0;
    });

    return {
      userId: String(user.UserId),
      name: user.Name,
      week: Number(week),
      weekPoints,
      weekCorrect,
      picksSubmitted:
        userPicks.length
    };
  });

  result.sort((a, b) => {
    if (
      b.weekPoints !==
      a.weekPoints
    ) {
      return (
        b.weekPoints -
        a.weekPoints
      );
    }

    if (
      b.weekCorrect !==
      a.weekCorrect
    ) {
      return (
        b.weekCorrect -
        a.weekCorrect
      );
    }

    return String(a.name)
      .localeCompare(String(b.name));
  });

  return result;
}

function getSeasonStandingsByWeek() {
  const users = readObjects_(SHEETS.USERS)
    .filter(user =>
      String(user.Active)
        .toUpperCase() === 'TRUE'
    );

  const games =
    readObjects_(SHEETS.GAMES);

  const picks =
    readObjects_(SHEETS.PICKS);

  const gameMap = {};

  games.forEach(game => {
    gameMap[String(game.GameId)] =
      game;
  });

  const weekSet = new Set();

  games.forEach(game => {
    const week = Number(game.Week);

    if (
      Number.isFinite(week) &&
      week > 0
    ) {
      weekSet.add(week);
    }
  });

  picks.forEach(pick => {
    const week = Number(pick.Week);

    if (
      Number.isFinite(week) &&
      week > 0
    ) {
      weekSet.add(week);
    }
  });

  const weeks = Array.from(weekSet)
    .sort((a, b) => a - b);

  const rows = users.map(user => {
    let totalPoints = 0;
    let totalCorrect = 0;

    const weekData = {};

    weeks.forEach(week => {
      const userWeekPicks =
        picks.filter(pick =>
          String(pick.UserId) ===
            String(user.UserId) &&
          Number(pick.Week) ===
            Number(week)
        );

      let weekPoints = 0;
      let weekCorrect = 0;

      userWeekPicks.forEach(pick => {
        const game =
          gameMap[String(pick.GameId)];

        if (!game) {
          return;
        }

        const scored =
          scorePick_(game, pick);

        weekPoints += scored.points;
        weekCorrect +=
          scored.correct ? 1 : 0;
      });

      totalPoints += weekPoints;
      totalCorrect += weekCorrect;

      weekData[String(week)] = {
        points: weekPoints,
        correct: weekCorrect,
        picksSubmitted:
          userWeekPicks.length,
        cumulativePoints:
          totalPoints,
        cumulativeCorrect:
          totalCorrect
      };
    });

    return {
      userId: String(user.UserId),
      name: user.Name,
      totalPoints,
      totalCorrect,
      weeks: weekData
    };
  });

  rows.sort((a, b) => {
    if (
      b.totalPoints !==
      a.totalPoints
    ) {
      return (
        b.totalPoints -
        a.totalPoints
      );
    }

    if (
      b.totalCorrect !==
      a.totalCorrect
    ) {
      return (
        b.totalCorrect -
        a.totalCorrect
      );
    }

    return String(a.name)
      .localeCompare(String(b.name));
  });

  return {
    weeks,
    rows
  };
}

/* ========================================================================== */
/* PICK HISTORY                                                               */
/* ========================================================================== */

function getPickHistoryForUser(userId) {
  const games =
    readObjects_(SHEETS.GAMES);

  const picks = readObjects_(SHEETS.PICKS)
    .filter(pick =>
      String(pick.UserId) ===
      String(userId)
    );

  const gameMap = {};

  games.forEach(game => {
    gameMap[String(game.GameId)] =
      game;
  });

  const history = picks
    .map(pick => {
      const game =
        gameMap[String(pick.GameId)];

      if (!game) {
        return null;
      }

      const scored =
        scorePick_(game, pick);

      const spreadWinner =
        getSpreadWinner_(game);

      let resultLabel = 'Pending';

      const status = String(
        game.Status || ''
      ).trim().toLowerCase();

      if (status === 'final') {
        if (spreadWinner === 'PUSH') {
          resultLabel =
            'Push - Correct';
        } else if (scored.correct) {
          resultLabel =
            'Correct';
        } else {
          resultLabel =
            'Incorrect';
        }
      }

      return {
        week: Number(pick.Week),
        gameId:
          String(pick.GameId),
        kickoffUTC:
          toIsoString_(
            game.KickoffUTC
          ),
        matchup:
          `${game.AwayAbbr} at ${game.HomeAbbr}`,
        awayAbbr:
          game.AwayAbbr,
        homeAbbr:
          game.HomeAbbr,
        awaySpread:
          Number(game.AwaySpread),
        homeSpread:
          Number(game.HomeSpread),
        awayScore:
          game.AwayScore,
        homeScore:
          game.HomeScore,
        pickedAbbr:
          pick.PickedAbbr,
        isTriple:
          toBoolean_(pick.IsTriple),
        status:
          game.Status || '',
        spreadWinner,
        resultLabel,
        correct:
          scored.correct,
        points:
          scored.points
      };
    })
    .filter(Boolean);

  history.sort((a, b) => {
    if (a.week !== b.week) {
      return b.week - a.week;
    }

    return (
      new Date(a.kickoffUTC) -
      new Date(b.kickoffUTC)
    );
  });

  return history;
}

/* ========================================================================== */
/* ALL PICKS                                                                  */
/* ========================================================================== */

function getAllPicksForWeek(week) {
  const config = getConfig_();

  const lockMinutes = Number(
    config.LOCK_MINUTES_BEFORE_KICKOFF ||
    1
  );

  const users = readObjects_(SHEETS.USERS)
    .filter(user =>
      String(user.Active)
        .toUpperCase() === 'TRUE'
    );

  const games = readObjects_(SHEETS.GAMES)
    .filter(game =>
      Number(game.Week) ===
      Number(week)
    )
    .sort(
      (a, b) =>
        new Date(a.KickoffUTC) -
        new Date(b.KickoffUTC)
    );

  const gameList = games.map(game => ({
    gameId:
      String(game.GameId),
    kickoffUTC:
      toIsoString_(game.KickoffUTC),
    matchup:
      `${game.AwayAbbr} at ${game.HomeAbbr}`,
    awayAbbr:
      game.AwayAbbr,
    homeAbbr:
      game.HomeAbbr,
    awaySpread:
      Number(game.AwaySpread),
    homeSpread:
      Number(game.HomeSpread),
    awayScore:
      game.AwayScore,
    homeScore:
      game.HomeScore,
    status:
      game.Status || '',
    spreadWinner:
      getSpreadWinner_(game)
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
    .map(game => {
      const kickoff = new Date(
        game.KickoffUTC
      );

      if (
        Number.isNaN(kickoff.getTime())
      ) {
        return null;
      }

      return (
        kickoff.getTime() -
        lockMinutes * 60 * 1000
      );
    })
    .filter(value =>
      Number.isFinite(value)
    );

  if (lockTimes.length === 0) {
    return {
      week: Number(week),
      isRevealed: false,
      revealAt: '',
      games: gameList,
      rows: []
    };
  }

  const fullWeekLockTime = new Date(
    Math.max(...lockTimes)
  );

  const isRevealed =
    new Date() >= fullWeekLockTime;

  if (!isRevealed) {
    return {
      week: Number(week),
      isRevealed: false,
      revealAt:
        fullWeekLockTime.toISOString(),
      games: gameList,
      rows: []
    };
  }

  const picks = readObjects_(SHEETS.PICKS)
    .filter(pick =>
      Number(pick.Week) ===
      Number(week)
    );

  const picksByUserGame = {};

  picks.forEach(pick => {
    const userId =
      String(pick.UserId);

    const gameId =
      String(pick.GameId);

    if (!picksByUserGame[userId]) {
      picksByUserGame[userId] = {};
    }

    picksByUserGame[userId][gameId] =
      pick;
  });

  const rows = users.map(user => {
    const userId =
      String(user.UserId);

    const userPicks =
      picksByUserGame[userId] || {};

    let weekPoints = 0;
    let weekCorrect = 0;
    let picksSubmitted = 0;

    const picksByGame = {};

    games.forEach(game => {
      const gameId =
        String(game.GameId);

      const pick =
        userPicks[gameId];

      if (!pick) {
        picksByGame[gameId] = null;
        return;
      }

      picksSubmitted++;

      const scored =
        scorePick_(game, pick);

      const spreadWinner =
        getSpreadWinner_(game);

      weekPoints += scored.points;
      weekCorrect +=
        scored.correct ? 1 : 0;

      let resultLabel = 'Pending';

      const status = String(
        game.Status || ''
      ).trim().toLowerCase();

      if (status === 'final') {
        if (
          spreadWinner === 'PUSH'
        ) {
          resultLabel =
            'Push - Correct';
        } else if (
          scored.correct
        ) {
          resultLabel = 'Correct';
        } else {
          resultLabel = 'Incorrect';
        }
      }

      picksByGame[gameId] = {
        pickedAbbr:
          pick.PickedAbbr,
        isTriple:
          toBoolean_(pick.IsTriple),
        correct:
          scored.correct,
        points:
          scored.points,
        resultLabel,
        spreadWinner
      };
    });

    return {
      userId,
      name: user.Name,
      picksSubmitted,
      weekPoints,
      weekCorrect,
      picksByGame
    };
  });

  rows.sort((a, b) => {
    if (
      b.weekPoints !==
      a.weekPoints
    ) {
      return (
        b.weekPoints -
        a.weekPoints
      );
    }

    if (
      b.weekCorrect !==
      a.weekCorrect
    ) {
      return (
        b.weekCorrect -
        a.weekCorrect
      );
    }

    return String(a.name)
      .localeCompare(String(b.name));
  });

  return {
    week: Number(week),
    isRevealed: true,
    revealAt:
      fullWeekLockTime.toISOString(),
    games: gameList,
    rows
  };
}

/* ========================================================================== */
/* AGAINST-THE-SPREAD SCORING                                                 */
/* ========================================================================== */

function scorePick_(game, pick) {
  const winner =
    calculateSpreadWinner_(game);

  if (!winner) {
    return {
      correct: false,
      points: 0
    };
  }

  const picked = String(
    pick.PickedAbbr !== undefined
      ? pick.PickedAbbr
      : pick.pickedAbbr || ''
  );

  const isTriple = toBoolean_(
    pick.IsTriple !== undefined
      ? pick.IsTriple
      : pick.isTriple
  );

  const correct =
    winner === 'PUSH'
      ? [
          String(game.AwayAbbr),
          String(game.HomeAbbr)
        ].includes(picked)
      : picked === winner;

  return {
    correct,
    points:
      correct
        ? (isTriple ? 3 : 1)
        : 0
  };
}

function getSpreadWinner_(game) {
  return calculateSpreadWinner_(game);
}

/**
 * Determines the winner against the spread.
 */
function calculateSpreadWinner_(game) {
  const status = String(
    game.Status || ''
  ).trim().toLowerCase();

  if (status !== 'final') {
    return '';
  }

  const awayScore =
    parseNumberOrNull_(game.AwayScore);

  const homeScore =
    parseNumberOrNull_(game.HomeScore);

  if (
    awayScore === null ||
    homeScore === null
  ) {
    return '';
  }

  let awaySpread =
    parseNumberOrNull_(
      game.AwaySpread
    );

  if (awaySpread === null) {
    const homeSpread =
      parseNumberOrNull_(
        game.HomeSpread
      );

    if (homeSpread !== null) {
      awaySpread = -homeSpread;
    }
  }

  if (awaySpread === null) {
    return '';
  }

  const adjustedMargin =
    awayScore +
    awaySpread -
    homeScore;

  if (
    Math.abs(adjustedMargin) <
    0.000001
  ) {
    return 'PUSH';
  }

  return adjustedMargin > 0
    ? String(game.AwayAbbr)
    : String(game.HomeAbbr);
}

/* ========================================================================== */
/* PICK SHEET WRITING                                                         */
/* ========================================================================== */

function replaceUserWeekPicks_(
  userId,
  week,
  picks
) {
  const picksSheet =
    sheet_(SHEETS.PICKS);

  if (!picksSheet) {
    throw new Error(
      'The Picks sheet was not found.'
    );
  }

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'The Picks sheet is busy. Please try submitting again.'
    );
  }

  try {
    const values = picksSheet
      .getDataRange()
      .getValues();

    for (
      let rowNumber = values.length;
      rowNumber >= 2;
      rowNumber--
    ) {
      const row =
        values[rowNumber - 1];

      const rowWeek =
        Number(row[1]);

      const rowUserId =
        String(row[2]);

      if (
        rowWeek === Number(week) &&
        rowUserId === String(userId)
      ) {
        picksSheet.deleteRow(
          rowNumber
        );
      }
    }

    const now =
      new Date().toISOString();

    const rows = picks.map(pick => [
      now,
      week,
      userId,
      pick.gameId,
      pick.pickedAbbr,
      pick.isTriple
        ? 'TRUE'
        : 'FALSE'
    ]);

    if (rows.length > 0) {
      picksSheet
        .getRange(
          picksSheet.getLastRow() + 1,
          1,
          rows.length,
          rows[0].length
        )
        .setValues(rows);
    }
  } finally {
    lock.releaseLock();
  }
}

/* ========================================================================== */
/* CURRENT WEEK                                                               */
/* ========================================================================== */

function getCurrentWeek_() {
  const weeks =
    readObjects_(SHEETS.WEEKS);

  const now = new Date();

  if (
    !weeks ||
    weeks.length === 0
  ) {
    const config = getConfig_();

    return Number(
      config.CURRENT_WEEK || 1
    );
  }

  const parsedWeeks = weeks
    .map(row => ({
      week: Number(row.Week),
      start:
        new Date(row.WeekStartUTC),
      end:
        new Date(row.WeekEndUTC)
    }))
    .filter(item =>
      Number.isFinite(item.week) &&
      !Number.isNaN(
        item.start.getTime()
      ) &&
      !Number.isNaN(
        item.end.getTime()
      )
    )
    .sort(
      (a, b) => a.week - b.week
    );

  const current = parsedWeeks.find(
    item =>
      now >= item.start &&
      now <= item.end
  );

  if (current) {
    return current.week;
  }

  const nextWeek = parsedWeeks.find(
    item => now < item.start
  );

  if (nextWeek) {
    return nextWeek.week;
  }

  if (parsedWeeks.length > 0) {
    return parsedWeeks[
      parsedWeeks.length - 1
    ].week;
  }

  return 1;
}

function getWeekRange_(week) {
  const weeks =
    readObjects_(SHEETS.WEEKS);

  const row = weeks.find(
    item =>
      Number(item.Week) ===
      Number(week)
  );

  if (!row) {
    throw new Error(
      `Week ${week} was not found in the Weeks sheet.`
    );
  }

  const weekStart =
    new Date(row.WeekStartUTC);

  const weekEnd =
    new Date(row.WeekEndUTC);

  if (
    Number.isNaN(
      weekStart.getTime()
    ) ||
    Number.isNaN(
      weekEnd.getTime()
    )
  ) {
    throw new Error(
      `Invalid date range for Week ${week} in the Weeks sheet.`
    );
  }

  return {
    weekStart,
    weekEnd
  };
}

/* ========================================================================== */
/* SPREADSHEET HELPERS                                                        */
/* ========================================================================== */

function rememberSpreadsheetId_() {
  const activeSpreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();

  if (!activeSpreadsheet) {
    return;
  }

  PropertiesService
    .getScriptProperties()
    .setProperty(
      SCRIPT_PROPERTIES.SPREADSHEET_ID,
      activeSpreadsheet.getId()
    );
}

function getSpreadsheet_() {
  const spreadsheetId =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        SCRIPT_PROPERTIES.SPREADSHEET_ID
      );

  if (spreadsheetId) {
    return SpreadsheetApp.openById(
      spreadsheetId
    );
  }

  const activeSpreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();

  if (activeSpreadsheet) {
    PropertiesService
      .getScriptProperties()
      .setProperty(
        SCRIPT_PROPERTIES.SPREADSHEET_ID,
        activeSpreadsheet.getId()
      );

    return activeSpreadsheet;
  }

  throw new Error(
    'No spreadsheet is configured. Open the spreadsheet and run Setup Sheets once.'
  );
}

function createSheetIfMissing_(
  name,
  rows
) {
  const spreadsheet =
    getSpreadsheet_();

  let sheet =
    spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet =
      spreadsheet.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(
        1,
        1,
        rows.length,
        rows[0].length
      )
      .setValues(rows);
  }
}

function sheet_(name) {
  return getSpreadsheet_()
    .getSheetByName(name);
}

function readObjects_(sheetName) {
  const sheet = sheet_(sheetName);

  if (!sheet) {
    return [];
  }

  const values = sheet
    .getDataRange()
    .getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0];

  return values
    .slice(1)
    .filter(row =>
      row.some(cell => cell !== '')
    )
    .map(row => {
      const object = {};

      headers.forEach(
        (header, index) => {
          object[header] = row[index];
        }
      );

      return object;
    });
}

function findRowByValue_(
  sheetName,
  headerName,
  value
) {
  const sheet = sheet_(sheetName);

  if (!sheet) {
    return -1;
  }

  const values = sheet
    .getDataRange()
    .getValues();

  if (values.length === 0) {
    return -1;
  }

  const headers = values[0];

  const columnIndex =
    headers.indexOf(headerName);

  if (columnIndex === -1) {
    throw new Error(
      `Header not found: ${headerName}`
    );
  }

  for (
    let r = 1;
    r < values.length;
    r++
  ) {
    if (
      String(
        values[r][columnIndex]
      ) === String(value)
    ) {
      return r + 1;
    }
  }

  return -1;
}

/* ========================================================================== */
/* CONFIG HELPERS                                                             */
/* ========================================================================== */

function getConfig_() {
  const rows =
    readObjects_(SHEETS.CONFIG);

  const config = {};

  rows.forEach(row => {
    config[String(row.Key)] =
      row.Value;
  });

  return config;
}

function ensureConfigKey_(
  key,
  defaultValue
) {
  const configSheet =
    sheet_(SHEETS.CONFIG);

  if (!configSheet) {
    throw new Error(
      'The Config sheet was not found.'
    );
  }

  const values = configSheet
    .getDataRange()
    .getValues();

  if (values.length === 0) {
    configSheet
      .getRange(1, 1, 2, 2)
      .setValues([
        ['Key', 'Value'],
        [key, defaultValue]
      ]);

    return;
  }

  const headers = values[0];

  const keyColumn =
    headers.indexOf('Key');

  const valueColumn =
    headers.indexOf('Value');

  if (
    keyColumn === -1 ||
    valueColumn === -1
  ) {
    throw new Error(
      'The Config sheet must contain Key and Value columns.'
    );
  }

  const existing = values
    .slice(1)
    .find(row =>
      String(row[keyColumn]).trim() ===
      String(key).trim()
    );

  if (!existing) {
    const newRow = new Array(
      headers.length
    ).fill('');

    newRow[keyColumn] = key;
    newRow[valueColumn] =
      defaultValue;

    configSheet.appendRow(newRow);
  }
}

function getOddsApiKey_() {
  const propertyKey =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        SCRIPT_PROPERTIES.ODDS_API_KEY
      );

  /*
   * A Script Property takes priority over the Config sheet.
   */
  if (propertyKey) {
    return String(propertyKey).trim();
  }

  const config = getConfig_();

  return String(
    config.ODDS_API_KEY || ''
  ).trim();
}

/* ========================================================================== */
/* TEAM AND VALUE HELPERS                                                     */
/* ========================================================================== */

function teamAbbrFromOddsName_(
  oddsName
) {
  const teams =
    readObjects_(SHEETS.TEAMS);

  const normalizedName = String(
    oddsName || ''
  ).trim().toLowerCase();

  const found = teams.find(team =>
    String(team.OddsApiName || '')
      .trim()
      .toLowerCase() ===
      normalizedName
  );

  return found
    ? String(found.Abbr)
    : '';
}

function normalizeTeamAbbr_(abbr) {
  const value = String(
    abbr || ''
  ).trim().toUpperCase();

  const map = {
    WSH: 'WAS',
    JAC: 'JAX',
    LAR: 'LA'
  };

  return map[value] || value;
}

function parseNumberOrNull_(value) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function toIsoString_(value) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return '';
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return String(value);
  }

  return date.toISOString();
}

function toBoolean_(value) {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  return String(value)
    .trim()
    .toUpperCase() === 'TRUE';
}

/* ========================================================================== */
/* LOCK HELPER                                                                */
/* ========================================================================== */

function runWithScriptLock_(callback) {
  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(60000)) {
    throw new Error(
      'Another automated update is already running. Please try again shortly.'
    );
  }

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}