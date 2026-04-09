// <author>Roscoe Moedl</author>
// <date>4/22/2025</date>

using MySql.Data.MySqlClient;

namespace GUI.Client.Models
{
    /// <summary>
    /// This class encapsulates the functionality necessary for inserting data into the database
    /// and querying the database.
    /// </summary>
    public class Database
    {
        /// <summary>
        /// The connection string.
        /// Your uID login name serves as both your database name and your uid.
        /// </summary>
        private const string ConnectionString =
            "server=atr.eng.utah.edu;" +
            "database=u1312724;" +
            "uid=u1312724;" +
            "password=ohBoyMyOwnPrivateDatabase";

        /// <summary>
        /// Private member to have a consistent DateTime format.
        /// </summary>
        private const string FormatString = "yyyy-MM-dd H:mm:ss";

        /// <summary>
        /// The id of the game associated with 'this' instance of the Database class.
        /// </summary>
        private int gameId;

        /// <summary>
        /// Adds a game to the Game table in the database.
        /// </summary>
        /// <param name="startTime">the start time of the current game.</param>
        public void AddGame(DateTime startTime)
        {
            using (MySqlConnection conn = new MySqlConnection(ConnectionString))
            {
                try
                {
                    // Open a connection and create a command
                    conn.Open();

                    // Insert into the Games table
                    MySqlCommand insertCommand = conn.CreateCommand();
                    insertCommand.CommandText =
                        "INSERT INTO Games (StartTime, EndTime)" +
                        " VALUES ('" +
                        startTime.ToString(FormatString) +
                        "',NULL)";
                    insertCommand.ExecuteNonQuery();

                    // Get the id of the recently inserted game and set this.gameId to that id.
                    MySqlCommand idCommand = conn.CreateCommand();
                    idCommand.CommandText = "Select last_insert_id();";
                    object result = idCommand.ExecuteScalar();
                    if (result != null)
                    {
                        int temp = Convert.ToInt32(result);
                        this.gameId = temp;
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
        }

        /// <summary>
        /// Adds a player to the Players table in the database.
        /// </summary>
        /// <param name="playerId">The id of the player.</param>
        /// <param name="name">The name of the player.</param>
        /// <param name="enterTime">The time the player joined the game.</param>
        public void AddPlayer(int playerId, string name, DateTime enterTime)
        {
            using (MySqlConnection conn = new MySqlConnection(ConnectionString))
            {
                try
                {
                    // Open a connection
                    conn.Open();

                    // Create a command and set it's command text
                    MySqlCommand command = conn.CreateCommand();
                    command.CommandText = 
                        "INSERT INTO Players (ID, ForeignKey, Name, MaxScore, EnterTime, LeaveTime)" +
                        " VALUES (" +
                        playerId.ToString() +
                        ", "+
                        gameId.ToString() +
                        ",'" +
                        name +
                        "', NULL, '" +
                        enterTime.ToString(FormatString) +
                        "', NULL)";
                    command.ExecuteNonQuery();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
        }

        /// <summary>
        /// Updates the max score in the database for a player in a certain game.
        /// </summary>
        /// <param name="playerId">The id of the player.</param>
        /// <param name="newMaxScore">The new max score to be set.</param>
        public void UpdateMaxScore(int playerId, int newMaxScore)
        {
            using (MySqlConnection conn = new MySqlConnection(ConnectionString))
            {
                try
                {
                    conn.Open();
                    MySqlCommand command = conn.CreateCommand();

                    command.CommandText = 
                        "UPDATE Players SET MaxScore = " +
                        newMaxScore.ToString() +
                        " WHERE ID = " +
                        playerId.ToString() +
                        " AND ForeignKey = " +
                        this.gameId.ToString();
                    command.ExecuteNonQuery();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
        }

        /// <summary>
        /// Updates the leave time in the database for a player in a certain game.
        /// </summary>
        /// <param name="playerId">The id of the player.</param>
        /// <param name="leaveTime">The time the player left.</param>
        public void UpdateLeaveTime(int playerId, DateTime leaveTime)
        {
            using (MySqlConnection conn = new MySqlConnection(ConnectionString))
            {
                try
                {
                    conn.Open();
                    MySqlCommand command = conn.CreateCommand();

                    command.CommandText =
                        "UPDATE Players SET LeaveTime = '" +
                        leaveTime.ToString(FormatString) +
                        "' WHERE ID = " +
                        playerId.ToString();
                    command.ExecuteNonQuery();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
        }

        /// <summary>
        /// Updates the end time of a certain game in the database.
        /// </summary>
        /// <param name="endTime">The time the game ended.</param>
        public void UpdateEndTime(DateTime endTime)
        {
            using (MySqlConnection conn = new MySqlConnection(ConnectionString))
            {
                try
                {
                    conn.Open();
                    MySqlCommand command = conn.CreateCommand();

                    command.CommandText =
                        "UPDATE Games SET EndTime = '" +
                        endTime.ToString(FormatString) +
                        "' WHERE ID = " +
                        gameId.ToString();
                    command.ExecuteNonQuery();
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
        }
    }
}
