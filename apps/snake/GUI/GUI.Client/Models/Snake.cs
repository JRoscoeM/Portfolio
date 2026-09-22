// <author> Roscoe Moedl</author>
// <date>April 11th, 2025</date>

using System.Text.Json.Serialization;

namespace GUI.Client.Models;

/// <summary>
/// A class which represents a snake. A snake consists of an Id, player name, a body with a direction, a player score,
/// and several booleans which indicate whether the snake is dead/alive and whether the player joined/disconnected on this frame.
/// </summary>
public class Snake
{
    /// <summary>
    /// this snake's unique ID.
    /// </summary>
    [JsonInclude]
    private int snake;

    /// <summary>
    /// This player's name.
    /// </summary>
    [JsonInclude]
    private string name;

    /// <summary>
    /// A list of points representing the vertices of the body of the snake. TODO accessibility.
    /// </summary>
    [JsonInclude]
    private List<Point2D> body;

    /// <summary>
    /// This snake's direction of travel.
    /// </summary>
    [JsonInclude]
    private Point2D dir;

    /// <summary>
    /// Represents the player's score.
    /// </summary>
    [JsonInclude]
    private int score;

    /// <summary>
    /// bool to indicate whether the player has died on this frame.
    /// </summary>
    [JsonInclude]
    private bool died;

    /// <summary>
    /// indicates whether the snakes is alive or dead.
    /// </summary>
    [JsonInclude]
    private bool alive;

    /// <summary>
    /// indicates whether the player controlling the snake disconnected on this frame.
    /// </summary>
    [JsonInclude]
    private bool dc;

    /// <summary>
    /// indicates whether the player joined on this frame.
    /// </summary>
    [JsonInclude]
    private bool join;

    /// <summary>
    /// Initializes a new instance of the <see cref="Models.Snake"/> class.
    /// </summary>
    public Snake()
    {
        this.snake = 0;
        this.name = string.Empty;
        this.body = new();
        this.dir = new();
        this.score = 0;
        this.died = false;
        this.alive = true;
        this.dc = false;
        this.join = false;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Models.Snake"/> class.
    /// </summary>
    /// <param name="id">The unique id of 'this' snake.</param>
    /// <param name="name">The name of the player controlling 'this' snake.</param>
    /// <param name="start">The starting position of 'this' snake.</param>
    /// <param name="direction">The initial direction of 'this' snake.</param>
    /// <param name="gameId">The game Id of 'this' snake.</param>
    public Snake(int id, string name, Point2D start, Point2D direction, int gameId)
    {
        this.snake = id;
        this.name = name;
        this.body = new List<Point2D>();
        this.dir = direction;
        this.score = 0;
        this.died = false;
        this.alive = true;
        this.dc = false;
        this.join = true;
    }

    /// <summary>
    /// Gets or sets the max score ever sent by the servere for this snake.
    /// </summary>
    [JsonIgnore]
    public int MaxScore { get; set; }

    /// <summary>
    /// Getter for the snake's ID.
    /// </summary>
    /// <returns>the snake's id.</returns>
    public int GetID()
    {
        return this.snake;
    }

    /// <summary>
    /// Getter for the snake's ID.
    /// </summary>
    /// <returns>the snake's id.</returns>
    public string GetName()
    {
        return this.name;
    }

    /// <summary>
    /// Getter for the snake's score.
    /// </summary>
    /// <returns>the snake's score.</returns>
    public int GetScore()
    {
        return this.score;
    }

    /// <summary>
    /// Getter Method for whether the snake is disconnected.
    /// </summary>
    /// <returns>this.dc.</returns>
    public bool GetDC()
    {
        return this.dc;
    }

    /// <summary>
    /// Getter for the list of snake body segments.
    /// </summary>
    /// <returns>the list of snake body segments.</returns>
    public List<Point2D> GetBody()
    {
        return this.body;
    }

    /// <summary>
    /// Gets if the snake died on this frame.
    /// </summary>
    /// <returns>if the snake died on this frame.</returns>
    public bool GetDied()
    {
        return this.died;
    }

    /// <summary>
    /// Gets if the snake is alive on this frame.
    /// </summary>
    /// <returns>if the snake is alive on this frame.</returns>
    public bool GetAlive()
    {
        return this.alive;
    }

    /// <summary>
    /// Gets if the snake joined on this frame.
    /// </summary>
    /// <returns>if the snake joined on this frame.</returns>
    public bool GetJoin()
    {
        return this.join;
    }
}
