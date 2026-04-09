// <author> Roscoe Moedl and Kennis Borrowman </author>
// <date>April 3rd 2025, 2025</date>

using System.Text.Json;
using GUI.Client.Controllers;
using GUI.Client.Models;

/// <summary>
/// Responsible for parsing information received from the network and updating the model based on that information.
/// </summary>
public class NetworkController
{
    /// <summary>
    /// Private member that contains a List of all of the connections.
    /// </summary>
    private List<NetworkConnection> connections;

    /// <summary>
    /// A member variable to contain the world object.
    /// </summary>
    private World theWorld;

    /// <summary>
    /// The current network connection.
    /// </summary>
    private NetworkConnection connection;

    /// <summary>
    /// A boolean representing whether the client wants to disconnect.
    /// </summary>
    private bool toBeDisconnected = false;

    /// <summary>
    /// 
    /// </summary>
    private Database db = new Database();

    /// <summary>
    /// Initializes a new instance of the <see cref="NetworkController"/> class.
    /// </summary>
    /// <param name="theWorld">A reference to the world created in the GUI file.</param>
    public NetworkController(World theWorld)
    {
        this.connections = new();
        this.theWorld = theWorld;
        this.connection = new NetworkConnection();
    }

    /// <summary>
    /// Gets the Id of the client that owns 'this' NetWorkController.
    /// </summary>
    public int PlayerId { get; private set; }

    /// <summary>
    /// Continuously reads data from the server.
    /// </summary>
    /// <param name="connection">A clients connection.</param>
    public void HandleConnect(NetworkConnection connection)
    {
        this.connection = connection;
        this.connections.Add(connection);

        this.db.AddGame(DateTime.Now);

        int messageCount = 0;

        try
        {
            while (true)
            {
                if (toBeDisconnected)
                {
                    this.theWorld.Snakes.Remove(this.PlayerId);
                    this.connections.Remove(this.connection);
                    this.connection.Disconnect();
                    return;
                }
                else
                {
                    var message = connection.ReadLine();
                    if (messageCount == 0)
                    {
                        this.PlayerId = int.Parse(message);
                        messageCount++;
                        continue;
                    }

                    if (messageCount == 1)
                    {
                        this.theWorld.Size = int.Parse(message);
                        messageCount++;
                        continue;
                    }

                    this.ParseJson(message);
                }
            }
        }
        catch
        {
            throw new Exception("An unexpected problem occured in NetworkController.HandleConnect().");
        }
    }

    /// <summary>
    /// Method for View to call to send a message to the server to change
    /// the snake's direction to the given direction.
    /// </summary>
    /// <param name="direction">The direction to change the snake's direction to.</param>
    public void ChangeDirection(string direction)
    {
        this.connection.Send("{\"moving\":\"" + direction + "\"}");
    }

    /// <summary>
    /// Helper method to set this.toBeDisconnected = true;
    /// </summary>
    public void SetDisconnect()
    {
        this.db.UpdateEndTime(DateTime.Now);
        this.db.UpdateLeaveTime(PlayerId, DateTime.Now);
        this.toBeDisconnected = true;
    }

    /// <summary>
    /// Deserializes the given json string into the correct object.
    /// </summary>
    /// <param name="json">The string to deserialize.</param>
    private void ParseJson(string json)
    {
        try
        {
            if (json.Length >= 3)
            {
                if (json[2] == 'w')
                {
                    Wall? result = JsonSerializer.Deserialize<Wall>(json);
                    if (result != null)
                    {
                        // if that Wall exists already in the world then update it.
                        if (this.theWorld.Walls.ContainsKey(result.GetID()))
                        {
                            this.theWorld.Walls[result.GetID()] = result;
                        }
                        else
                        {
                            // Add the walls to the dictionary of walls.
                            this.theWorld.Walls.Add(result.GetID(), result);
                        }
                    }
                }
                else if (json[2] == 'p')
                {
                    Powerup? result = JsonSerializer.Deserialize<Powerup>(json);
                    if (result != null)
                    {
                        if (result.GetDead())
                        {
                            this.theWorld.Powerups.Remove(result.GetID());
                        }

                        // if that Powerup exists already in the world then update it.
                        else if (this.theWorld.Powerups.ContainsKey(result.GetID()))
                        {
                            this.theWorld.Powerups[result.GetID()] = result;
                        }
                        else
                        {
                            // Add the powerup to the dictionary of powerups.
                            this.theWorld.Powerups.Add(result.GetID(), result);
                        }
                    }
                }
                else if (json[2] == 's')
                {
                    Snake? result = JsonSerializer.Deserialize<Snake>(json);
                    
                    if (result != null)
                    {
                        // update the database for the leave time for that snake
                        if (result.GetDC() == true)
                        {
                            this.theWorld.Snakes.Remove(result.GetID());
                            this.db.UpdateLeaveTime(result.GetID(), DateTime.Now);
                            return;
                        }
                        // The client has already seen that snake.
                        if (this.theWorld.Snakes.ContainsKey(result.GetID()))
                        {
                            // if the max score of that snake has increased then update maxScore.
                            if (result.GetScore() > this.theWorld.Snakes[result.GetID()].MaxScore)
                            {
                                result.MaxScore = result.GetScore();
                                this.theWorld.Snakes[result.GetID()] = result; // update the snake

                                this.db.UpdateMaxScore(result.GetID(), result.GetScore());
                            }
                            else
                            {
                                result.MaxScore = this.theWorld.Snakes[result.GetID()].MaxScore; // update the maxscore of result before assigning 
                                this.theWorld.Snakes[result.GetID()] = result; // update the snake
                            } 
                        }
                        // The client has not seen that snake yet.
                        else
                        {
                            this.theWorld.Snakes.Add(result.GetID(), result);
                            this.db.AddPlayer(result.GetID(), result.GetName(), DateTime.Now);
                        }
                    }
                }
            }
        }
        catch
        {
            Console.WriteLine("There was a Deserialization exception.");
        }
    }
}
