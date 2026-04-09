// <author> Kennis Borrowman and Roscoe Moedl</author>
// <date>April 11th, 2025</date>

using System.Text.Json.Serialization;

namespace GUI.Client.Models;

/// <summary>
/// This class represents a Powerup which is an object in the world that can be
/// "eaten" to increase a Snake's size.
/// </summary>
public class Powerup
{
    /// <summary>
    /// An int representing the powerup's unique ID.
    /// </summary>
    [JsonInclude]
    private int power;

    /// <summary>
    /// A Point2D representing the location of the powerup.
    /// </summary>
    [JsonInclude]
    private Point2D loc;

    /// <summary>
    /// A bool indicating if the powerup "died" (was collected by a player) on this frame.
    /// </summary>
    [JsonInclude]
    private bool died;

    /// <summary>
    /// Initializes a new instance of the <see cref="Powerup"/> class.
    /// </summary>
    public Powerup()
    {
        this.power = 0;
        this.loc = new();
        this.died = false;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Powerup"/> class.
    /// </summary>
    /// <param name="id">The unique id of this powerup.</param>
    /// <param name="location">The Point2D which is the location of this powerup.</param>
    public Powerup(int id, Point2D location)
    {
        this.power = id;
        this.loc = location;
        this.died = false;
    }

    /// <summary>
    /// Getter for the ID.
    /// </summary>
    /// <returns>theID.</returns>
    public int GetID()
    {
        return this.power;
    }

    /// <summary>
    /// Gets whether or not the powerup has been collected.
    /// </summary>
    /// <returns>if the powerup is dead or not.</returns>
    public bool GetDead()
    {
        return this.died;
    }

    /// <summary>
    /// Gets the location of this powerup.
    /// </summary>
    /// <returns>the location of this powerup.</returns>
    public Point2D GetLoc()
    {
        return this.loc;
    }
}
