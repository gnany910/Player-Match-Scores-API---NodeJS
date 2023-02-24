const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObjectPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObjectMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertDbObjectToResponseObjectPlayerMatch = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.total_score,
    totalFours: dbObject.total_fours,
    totalSixes: dbObject.total_sixes,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT *
    FROM player_details; `;
  const playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map((eachItem) => {
      return convertDbObjectToResponseObjectPlayer(eachItem);
    })
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIDQuery = `
     SELECT *
    FROM player_details
    WHERE player_id = ${playerId}; `;
  const playerArray1 = await db.get(getPlayerByIDQuery);
  response.send(convertDbObjectToResponseObjectPlayer(playerArray1));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putPlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId}`;
  await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const API4Query = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const API4Array = await db.get(API4Query);
  response.send(convertDbObjectToResponseObjectMatch(API4Array));
});

//API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const API5Query = `
    SELECT match_details.match_id, match_details.match, match_details.year
    FROM  player_match_score LEFT JOIN match_details 
    ON player_match_score.match_id = match_details.match_id
    WHERE player_match_score.player_id = ${playerId};`;
    const API5Array = await db.all(API5Query);
    response.send(
      API5Array.map((eachItem) => {
        return convertDbObjectToResponseObjectMatch(eachItem);
      })
    );
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
});
//API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  try {
    const { matchId } = request.params;
    const API6Query = `
    SELECT player_details.player_id, player_details.player_name
    FROM  player_match_score LEFT JOIN player_details
    ON player_match_score.player_id = player_details.player_id
    WHERE player_match_score.match_id = ${matchId};`;
    const API6Array = await db.all(API6Query);
    response.send(
      API6Array.map((eachItem) => {
        return convertDbObjectToResponseObjectPlayer(eachItem);
      })
    );
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
});
//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const API7Query = `
    SELECT player_details.player_id, player_details.player_name, 
    SUM (player_match_score.score) as total_score, 
    SUM (player_match_score.fours) as total_fours, 
    SUM (player_match_score.sixes) as total_sixes
    FROM  player_match_score LEFT JOIN player_details 
    ON player_match_score.player_id = player_details.player_id
    WHERE player_match_score.player_id = ${playerId};`;
    const API7Array = await db.get(API7Query);
    response.send(convertDbObjectToResponseObjectPlayerMatch(API7Array));
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
});

module.exports = app;
